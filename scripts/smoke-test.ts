#!/usr/bin/env tsx
/**
 * Smoke test — exercises each source fetcher against live APIs.
 * No API keys required for Reddit, HN, DEV.to, RSS.
 * Brave News requires BRAVE_API_KEY; YouTube requires YOUTUBE_CHANNELS.
 * 
 * Usage: npx tsx scripts/smoke-test.ts
 */

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const SKIP = '\x1b[33m⊘\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  count: number;
  ms: number;
  error?: string;
  sample?: string;
}

async function test(
  name: string,
  fn: () => Promise<Array<{ title: string }>>
): Promise<TestResult> {
  const start = Date.now();
  try {
    const items = await fn();
    const ms = Date.now() - start;
    if (items.length === 0) {
      return { name, status: 'fail', count: 0, ms, error: 'returned 0 items' };
    }
    return {
      name,
      status: 'pass',
      count: items.length,
      ms,
      sample: items[0]?.title?.slice(0, 80),
    };
  } catch (err: unknown) {
    return {
      name,
      status: 'fail',
      count: 0,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message.slice(0, 120) : String(err),
    };
  }
}

async function main() {
  console.log(`\n${BOLD}═══ Source Fetcher Smoke Test ═══${RESET}\n`);

  // Dynamic imports so we get real module execution
  const { fetchReddit } = await import('../src/lib/sources/reddit');
  const { fetchHackerNews } = await import('../src/lib/sources/hackernews');
  const { fetchDevTo } = await import('../src/lib/sources/devto');
  const { fetchRss } = await import('../src/lib/sources/rss');
  const { fetchYouTube } = await import('../src/lib/sources/youtube');
  const { fetchBraveNews } = await import('../src/lib/sources/bravenews');

  const results: TestResult[] = [];

  // 1. Reddit (requires OAuth credentials)
  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
    results.push(await test('Reddit (6 subreddits)', fetchReddit));
  } else {
    results.push({ name: 'Reddit', status: 'skip', count: 0, ms: 0, error: 'REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set' });
  }

  // 2. Hacker News
  results.push(await test('Hacker News (Algolia)', fetchHackerNews));

  // 3. DEV.to
  results.push(await test('DEV.to (top/day)', fetchDevTo));

  // 4. RSS (default feeds)
  results.push(await test('RSS (5 default feeds)', fetchRss));

  // 5. YouTube
  if (process.env.YOUTUBE_CHANNELS) {
    results.push(await test('YouTube (channel RSS)', fetchYouTube));
  } else {
    results.push({ name: 'YouTube', status: 'skip', count: 0, ms: 0, error: 'YOUTUBE_CHANNELS not set' });
  }

  // 6. Brave News
  if (process.env.BRAVE_API_KEY) {
    results.push(await test('Brave News (5 queries)', fetchBraveNews));
  } else {
    results.push({ name: 'Brave News', status: 'skip', count: 0, ms: 0, error: 'BRAVE_API_KEY not set' });
  }

  // Also test the scorer if we have items
  const allItems = results
    .filter((r) => r.status === 'pass')
    .reduce((n, r) => n + r.count, 0);

  if (allItems > 0) {
    const { score, dedupe } = await import('../src/lib/orchestrator/score');
    // Gather all items from passing sources
    const rawItems = [
      ...(await fetchReddit().catch(() => [])),
      ...(await fetchHackerNews().catch(() => [])),
      ...(await fetchDevTo().catch(() => [])),
      ...(await fetchRss().catch(() => [])),
    ];
    const scored = dedupe(score(rawItems));
    const top5 = scored.slice(0, 5);
    console.log(`\n${BOLD}═══ Top 5 Candidates (post-scoring) ═══${RESET}\n`);
    for (const [i, item] of top5.entries()) {
      console.log(
        `  ${DIM}${i + 1}.${RESET} ${BOLD}${item.score.toFixed(4)}${RESET}  ` +
        `${item.title.slice(0, 70)}` +
        `\n     ${DIM}${item.source} · pop=${item.breakdown.popularity} eng=${item.breakdown.engagement} rec=${item.breakdown.recency}${RESET}`
      );
    }
  }

  // Report
  console.log(`\n${BOLD}═══ Results ═══${RESET}\n`);
  for (const r of results) {
    const icon = r.status === 'pass' ? PASS : r.status === 'skip' ? SKIP : FAIL;
    const detail = r.status === 'pass'
      ? `${r.count} items in ${r.ms}ms — "${r.sample}"`
      : r.status === 'skip'
        ? `skipped: ${r.error}`
        : `FAILED (${r.ms}ms): ${r.error}`;
    console.log(`  ${icon} ${BOLD}${r.name}${RESET}  ${DIM}${detail}${RESET}`);
  }

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;
  console.log(`\n  ${passed} passed · ${failed} failed · ${skipped} skipped\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
