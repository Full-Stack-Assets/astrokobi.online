#!/usr/bin/env tsx
/**
 * Seed / backfill runner — stands up a real back catalog from a curated list of
 * evergreen topics (scripts/seed-topics.ts) instead of from live trending
 * sources. Each topic is Brave-searched, scraped, and written through the same
 * generate → validate → serialize path as the hourly pipeline, so the output is
 * identical in shape. The hourly job then accretes current stories on top.
 *
 * It NEVER commits via Octokit (like `npm run generate`): posts are written to
 * content/posts/ and the local content/.topic-log.json is updated. It is
 * idempotent — a topic whose signature is already in the log is skipped, so you
 * can stop and re-run to continue, or run it again later after adding topics.
 *
 * Requires the writer LLM key (whatever `llm.apiKeyEnv` is in site.config.ts)
 * and BRAVE_API_KEY (evergreen topics have no source URL, so research relies on
 * web search to find material). PEXELS_API_KEY is optional (hero images).
 *
 * Usage:
 *   npm run seed                        # generate every not-yet-covered topic
 *   npm run seed -- --dry               # research+write the first topic, write nothing
 *   npm run seed -- --limit=10          # only the first 10 not-yet-covered topics
 *   npm run seed -- --interval-hours=24 # space post dates 24 hours apart (default 24)
 *   npm run seed -- --delay=2000        # ms to wait between topics (default 1500)
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { generateForTopic } from '../src/lib/orchestrator/pipeline';
import { signature } from '../src/lib/orchestrator/score';
import type { TopicLog } from '../src/lib/orchestrator/types';
import { siteConfig } from '../src/site.config';
import { SEED_TOPICS } from './seed-topics';

const LOG_PATH = path.join(process.cwd(), 'content', '.topic-log.json');
const POSTS_DIR = path.join(process.cwd(), 'content', siteConfig.contentDirectory);

function flag(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

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
  const limit = Number(flag('limit', '0')) || Infinity;
  const intervalHours = Number(flag('interval-hours', '24')) || 24;
  const delayMs = Number(flag('delay', '1500'));

  const llmKeyEnv = siteConfig.llm.apiKeyEnv;
  if (!process.env[llmKeyEnv]?.trim()) {
    console.error(`✗ ${llmKeyEnv} is not set — it's required to write posts. See .env.example.`);
    process.exit(1);
  }
  if (!process.env.BRAVE_API_KEY?.trim()) {
    console.warn(
      '⚠ BRAVE_API_KEY is not set. Evergreen topics have no source URL of their own, ' +
        'so without web search there is nothing to research and every topic will be skipped.\n'
    );
  }

  let log = await loadLocalLog();
  const covered = new Set(log.topics.map((t) => t.signature));
  const pending = SEED_TOPICS.filter((topic) => !covered.has(signature(topic)));
  const queue = pending.slice(0, limit === Infinity ? pending.length : limit);

  console.log(
    `→ ${SEED_TOPICS.length} topics in list, ${pending.length} not yet covered.\n` +
      `→ ${dryRun ? 'DRY RUN (1 topic, nothing written)' : `generating ${queue.length}`}…\n`
  );

  // ── Dry run: research + write a single topic, print a preview ─────
  if (dryRun) {
    const topic = queue[0] ?? SEED_TOPICS[0];
    console.log(`Topic: ${topic}\n`);
    const res = await generateForTopic(topic, { dryRun: true });
    console.log(JSON.stringify({ ...res, mdx: res.mdx ? `[${res.mdx.length} bytes]` : undefined }, null, 2));
    if (res.mdx) {
      console.log('\n─── MDX preview (first 2000 chars) ───');
      console.log(res.mdx.slice(0, 2000));
    }
    return;
  }

  await fs.mkdir(POSTS_DIR, { recursive: true });
  const now = Date.now();
  let written = 0;
  let skipped = 0;

  for (let i = 0; i < queue.length; i++) {
    const topic = queue[i];
    // Spread dates backward from now so the catalog reads as history rather than
    // a single burst: earlier in the queue = more recent publish date.
    const date = new Date(now - i * intervalHours * 3_600_000);
    process.stdout.write(`[${i + 1}/${queue.length}] ${topic} … `);

    const res = await generateForTopic(topic, { dryRun: true, date });

    if (!res.ok || !res.slug || !res.mdx) {
      console.log(`skip (${res.skipped ?? res.error ?? 'unknown'})`);
      skipped++;
      if (delayMs > 0) await sleep(delayMs);
      continue;
    }

    await fs.writeFile(path.join(POSTS_DIR, `${res.slug}.mdx`), res.mdx, 'utf8');
    log = {
      topics: [
        ...log.topics,
        {
          slug: res.slug,
          title: topic,
          url: '',
          publishedAt: date.toISOString(),
          signature: signature(topic),
        },
      ],
    };
    await saveLocalLog(log); // save after each so a crash is resumable
    written++;
    console.log(`✓ ${res.slug}`);

    if (delayMs > 0 && i < queue.length - 1) await sleep(delayMs);
  }

  console.log(
    `\n✓ Done. Wrote ${written} post(s), skipped ${skipped}. ` +
      `Topic log now has ${log.topics.length} entries.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
