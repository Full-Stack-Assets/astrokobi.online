#!/usr/bin/env tsx
/**
 * One-time backfill: a batch of evergreen articles, each pinned to a specific
 * historical day (spread daily across June 2026) so the catalog reads as
 * publishing history rather than a single burst.
 *
 * Each entry uses the same generateForTopic() path as scripts/seed.ts (real
 * Brave-search research + a real LLM author). This repo's pipeline options are
 * `dryRun` and `date` only (see TopicPipelineOptions in
 * src/lib/orchestrator/pipeline.ts), so posts come out at the site's standard
 * length.
 *
 * NEVER commits via Octokit: posts are written to the site's content directory
 * (content/<siteConfig.contentDirectory>/) and the local
 * content/.topic-log.json is updated, exactly like seed.ts. The companion
 * workflow (.github/workflows/backfill-articles.yml) commits the result.
 * Idempotent — an item whose signature is already in the log is skipped, and
 * the log is saved after each item, so a partial/interrupted run can simply be
 * re-dispatched.
 *
 * Requires the writer LLM key (`llm.apiKeyEnv` in site.config.ts) and
 * BRAVE_API_KEY (these topics have no source URL, so research relies on web
 * search). PEXELS_API_KEY is optional (hero images).
 *
 * Usage:
 *   npx tsx scripts/backfill-articles.ts         # run the whole batch
 *   npx tsx scripts/backfill-articles.ts --dry   # research+write the first item, write nothing
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { generateForTopic } from '../src/lib/orchestrator/pipeline';
import { signature } from '../src/lib/orchestrator/score';
import type { TopicLog } from '../src/lib/orchestrator/types';
import { siteConfig } from '../src/site.config';

const LOG_PATH = path.join(process.cwd(), 'content', '.topic-log.json');
const POSTS_DIR = path.join(process.cwd(), 'content', siteConfig.contentDirectory);

const DELAY_MS = 2000;

interface BackfillItem {
  topic: string;
  date: string; // ISO
}

// Chronological, one per day at 12:00Z across June 2026. Evergreen
// explainer/guide topics on this site's beat — artificial intelligence,
// machine-intelligence signals, planetary systems, and near-future technology
// — the kind of piece an interested reader actually searches for.
const BACKFILL_ITEMS: BackfillItem[] = [
  { topic: 'How large language models actually work, explained without the math', date: '2026-06-01T12:00:00.000Z' },
  { topic: 'AI agents explained: how software that acts differs from software that answers', date: '2026-06-02T12:00:00.000Z' },
  { topic: 'How AI models are trained: pretraining, fine-tuning, and reinforcement learning from human feedback', date: '2026-06-03T12:00:00.000Z' },
  { topic: 'What is AGI and how would we actually know when we reach it', date: '2026-06-04T12:00:00.000Z' },
  { topic: 'AI scaling laws: why bigger models got smarter and whether that era is ending', date: '2026-06-05T12:00:00.000Z' },
  { topic: 'What is edge AI and why machine intelligence is moving onto your devices', date: '2026-06-06T12:00:00.000Z' },
  { topic: 'How AI hallucinations happen and how to spot them', date: '2026-06-08T12:00:00.000Z' },
  { topic: 'Brain-computer interfaces: how they work and where they are headed', date: '2026-06-09T12:00:00.000Z' },
  { topic: 'How planetary systems form from disks of gas and dust', date: '2026-06-10T12:00:00.000Z' },
  { topic: 'How astronomers find exoplanets: transits, wobbles, and direct imaging', date: '2026-06-11T12:00:00.000Z' },
  { topic: 'What makes a planet habitable: the science of the Goldilocks zone', date: '2026-06-12T12:00:00.000Z' },
  { topic: 'SETI and technosignatures: how we listen for machine intelligence beyond Earth', date: '2026-06-13T12:00:00.000Z' },
  { topic: 'Terraforming Mars: what it would actually take', date: '2026-06-15T12:00:00.000Z' },
  { topic: 'Fusion power explained: how close are we really', date: '2026-06-16T12:00:00.000Z' },
  { topic: 'Solid-state batteries and the future of energy storage', date: '2026-06-17T12:00:00.000Z' },
  { topic: 'Digital twins: how virtual replicas are starting to run the physical world', date: '2026-06-18T12:00:00.000Z' },
  { topic: 'The Kardashev scale: measuring civilizations by the energy they command', date: '2026-06-19T12:00:00.000Z' },
  { topic: 'The technological singularity: what it means and should we take it seriously', date: '2026-06-20T12:00:00.000Z' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loadLocalLog(): Promise<TopicLog> {
  try {
    return JSON.parse(await fs.readFile(LOG_PATH, 'utf8')) as TopicLog;
  } catch {
    return { topics: [] };
  }
}

async function saveLocalLog(log: TopicLog): Promise<void> {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2), 'utf8');
}

async function main() {
  const dryRun = process.argv.includes('--dry');

  const llmKeyEnv = siteConfig.llm.apiKeyEnv;
  if (!process.env[llmKeyEnv]?.trim()) {
    console.error(`✗ ${llmKeyEnv} is not set — it's required to write posts. See .env.example.`);
    process.exit(1);
  }
  if (!process.env.BRAVE_API_KEY?.trim()) {
    console.error(
      '✗ BRAVE_API_KEY is not set. These topics have no source URL of their own, ' +
        'so without web search there is nothing to research — every item would be skipped.'
    );
    process.exit(1);
  }

  let log = await loadLocalLog();
  const covered = new Set(log.topics.map((t) => t.signature));
  const queue = BACKFILL_ITEMS.filter((item) => !covered.has(signature(item.topic)));

  console.log(
    `→ ${BACKFILL_ITEMS.length} items in batch, ${queue.length} not yet covered.\n` +
      `→ ${dryRun ? 'DRY RUN (1 item, nothing written)' : `generating ${queue.length}`}…\n`
  );

  if (dryRun) {
    const item = queue[0] ?? BACKFILL_ITEMS[0];
    console.log(`Topic: ${item.topic}\nDate: ${item.date}\n`);
    const res = await generateForTopic(item.topic, {
      dryRun: true,
      date: new Date(item.date),
    });
    console.log(JSON.stringify({ ...res, mdx: res.mdx ? `[${res.mdx.length} bytes]` : undefined }, null, 2));
    if (res.mdx) {
      console.log('\n─── MDX preview (first 2000 chars) ───');
      console.log(res.mdx.slice(0, 2000));
    }
    return;
  }

  await fs.mkdir(POSTS_DIR, { recursive: true });
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    process.stdout.write(`[${i + 1}/${queue.length}] ${item.date.slice(0, 10)} — ${item.topic} … `);

    const res = await generateForTopic(item.topic, {
      dryRun: true,
      date: new Date(item.date),
    });

    if (!res.ok || !res.slug || !res.mdx) {
      console.log(`skip (${res.skipped ?? res.error ?? 'unknown'})`);
      skipped++;
      if (DELAY_MS > 0) await sleep(DELAY_MS);
      continue;
    }

    await fs.writeFile(path.join(POSTS_DIR, `${res.slug}.mdx`), res.mdx, 'utf8');
    log = {
      topics: [
        ...log.topics,
        {
          slug: res.slug,
          title: item.topic,
          url: '',
          publishedAt: item.date,
          signature: signature(item.topic),
        },
      ],
    };
    await saveLocalLog(log); // save after each so an interrupted run is resumable
    written++;
    console.log(`✓ ${res.slug} (${res.mdx.length} bytes)`);

    if (DELAY_MS > 0 && i < queue.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n✓ Done. Wrote ${written} post(s), skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
