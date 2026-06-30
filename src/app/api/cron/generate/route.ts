import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/orchestrator/pipeline';

// Node runtime — Cheerio, youtubei.js, and Octokit need Node APIs.
// NOTE: On Cloudflare Pages Functions the CPU limit per request is ~30s and
// the pipeline routinely exceeds that (scrape + LLM + commit). If you deploy
// to CF Pages, migrate this handler to a Cloudflare Workers Cron Trigger
// (15-min CPU budget) that imports the same `runPipeline`. On Vercel, the
// default serverless function budget is enough on Pro; set `maxDuration` if
// you see timeouts.
export const runtime = 'nodejs';
export const maxDuration = 300; // Vercel: 5 minutes
export const dynamic = 'force-dynamic';

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') ?? '';
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
  if (header === `Bearer ${secret}`) return true;
  // Also accept ?secret= for manual curl testing
  const url = new URL(req.url);
  return url.searchParams.get('secret') === secret;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dryRun') === '1';

  const result = await runPipeline({ dryRun });
  const status = result.ok ? 200 : result.error ? 500 : 200; // 200 for graceful skips
  return NextResponse.json(result, { status });
}

export async function POST(req: Request) {
  return GET(req);
}
