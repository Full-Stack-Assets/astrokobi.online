#!/usr/bin/env tsx
/**
 * One-time backfill: long-form (roughly double-length) evergreen articles,
 * each dated to a specific historical day identified as "thin" in this site's
 * actual publishing history — see the BACKFILL_ITEMS comment below for how
 * those days were picked (computed fresh for this repo on 2026-07-04; this
 * site posts far more frequently than the sibling .com instance, so there are
 * no zero-post days, only single-post days worth deepening).
 *
 * Each entry uses the same generateForTopic() path as scripts/seed.ts, just
 * with `targetWords` / `minBodyChars` set so the body comes out roughly double
 * the site's usual median instead of the standard length. Topics are chosen to
 * be evergreen and space/astronomy niche (per src/site.config.ts) and to
 * complement — not duplicate — whatever already published that day.
 *
 * NEVER commits via Octokit: posts are written to content/<contentDirectory>/
 * (i.e. content/editorial/ here — see siteConfig.contentDirectory) and the
 * local content/.topic-log.json is updated, exactly like seed.ts. The
 * companion workflow (.github/workflows/backfill-articles.yml) commits the
 * result. Idempotent — an item whose signature is already in the log is
 * skipped, so a partial/interrupted run can simply be re-dispatched.
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

// Long-form target: this site's body runs ~6,050 chars at the median (computed
// across content/editorial/*.mdx on 2026-07-04). Aim the prompt at roughly
// double that, and enforce a floor a bit below the exact target (LLM word
// counts vary) so a short response is rejected and retried rather than shipped.
const TARGET_WORDS = 2200;
const MIN_BODY_CHARS = 9200;

const DELAY_MS = 2000;

interface BackfillItem {
  topic: string;
  date: string; // ISO
}

// Chronological. Unlike the .com sibling (a slow evergreen seed catalog with
// real zero-post outage days), this site posts hourly-or-faster from
// 2026-06-30 onward — every calendar day from 2026-06-01 to 2026-07-04 already
// has at least one post, so there are no zero-post gap days to fill. The real
// thinness is density: 2026-06-01 through 2026-06-23 came from a single
// once-a-day evergreen seed burst (one post per day, exactly 24h apart), and
// 2026-06-26/06-28/06-29 are likewise single-post days versus the 2-9 posts/day
// once the hourly pipeline ramped up. Those 26 single-post days are the
// legitimately thin spots; this batch picks 15 of them (spread across the
// range, skipping every other early day so as not to over-cluster) and pairs
// each with a distinct, complementary evergreen topic — not a repeat of that
// day's existing post — so the backfill adds real depth instead of a near
// duplicate. Verified against content/.topic-log.json + frontmatter dates.
const BACKFILL_ITEMS: BackfillItem[] = [
  { topic: 'What nebulae are and how they give birth to stars and planets', date: '2026-06-01T20:00:00.000Z' },
  { topic: 'How the Hubble Space Telescope reshaped modern astronomy', date: '2026-06-03T20:00:00.000Z' },
  { topic: 'What the habitable zone is and why it matters in the search for life', date: '2026-06-05T20:00:00.000Z' },
  { topic: 'How radio telescopes detect signals from across the universe', date: '2026-06-07T20:00:00.000Z' },
  { topic: 'What redshift is and how astronomers use it to measure cosmic distances', date: '2026-06-09T20:00:00.000Z' },
  { topic: 'How gravity-assist maneuvers let spacecraft reach the outer solar system', date: '2026-06-11T20:00:00.000Z' },
  { topic: 'What the Search for Extraterrestrial Intelligence (SETI) is and how it works', date: '2026-06-13T20:00:00.000Z' },
  { topic: 'How space debris threatens satellites and the future of spaceflight', date: '2026-06-15T20:00:00.000Z' },
  { topic: 'What magnetars are, the most magnetic objects known in the universe', date: '2026-06-17T20:00:00.000Z' },
  { topic: 'What the cosmic microwave background is and what it reveals about the early universe', date: '2026-06-19T20:00:00.000Z' },
  { topic: 'How the Voyager probes reached interstellar space', date: '2026-06-21T20:00:00.000Z' },
  { topic: 'What rogue planets are and how worlds end up wandering without a star', date: '2026-06-23T20:00:00.000Z' },
  { topic: 'How satellite mega-constellations are changing the night sky for astronomers', date: '2026-06-26T20:00:00.000Z' },
  { topic: 'What the Drake equation is and how scientists estimate the odds of alien civilizations', date: '2026-06-28T20:00:00.000Z' },
  { topic: 'How coronal mass ejections affect Earth and satellite technology', date: '2026-06-29T20:00:00.000Z' },
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
      `→ Long-form target: ~${TARGET_WORDS} words, ${MIN_BODY_CHARS}+ body chars.\n` +
      `→ ${dryRun ? 'DRY RUN (1 item, nothing written)' : `generating ${queue.length}`}…\n`
  );

  if (dryRun) {
    const item = queue[0] ?? BACKFILL_ITEMS[0];
    console.log(`Topic: ${item.topic}\nDate: ${item.date}\n`);
    const res = await generateForTopic(item.topic, {
      dryRun: true,
      date: new Date(item.date),
      targetWords: TARGET_WORDS,
      minBodyChars: MIN_BODY_CHARS,
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
      targetWords: TARGET_WORDS,
      minBodyChars: MIN_BODY_CHARS,
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
