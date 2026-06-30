import type { RawItem, ScoredItem, TopicLog } from './types';
import crypto from 'node:crypto';

/**
 * Composite score with three axes:
 *   popularity  — log-scaled upvotes, source-weighted
 *   engagement  — comment-to-upvote ratio (discussion signal)
 *   recency     — exponential decay, 24h half-life
 *
 * Final score = 0.5·pop + 0.2·engagement + 0.3·recency, all normalized 0-1.
 */

const SOURCE_WEIGHT: Record<RawItem['source'], number> = {
  hackernews: 1.0,
  reddit: 0.85,
  devto: 0.75,
  bravenews: 0.9,
  rss: 0.7,
  youtube: 0.6,
  googletrends: 0.8,
};

const HALF_LIFE_HOURS = 24;

export function score(items: RawItem[]): ScoredItem[] {
  const now = Date.now();

  // Pre-compute max upvotes per source for normalization
  const maxUp: Partial<Record<RawItem['source'], number>> = {};
  for (const it of items) {
    const u = it.upvotes ?? 0;
    maxUp[it.source] = Math.max(maxUp[it.source] ?? 0, u);
  }

  return items.map<ScoredItem>((it) => {
    const up = it.upvotes ?? 0;
    const comm = it.comments ?? 0;

    const normalizedUp = Math.log1p(up) / Math.log1p(Math.max(1, maxUp[it.source] ?? 1));
    const popularity = normalizedUp * SOURCE_WEIGHT[it.source];

    const engagement = up > 0 ? Math.min(1, comm / up) : comm > 5 ? 0.5 : 0;

    const ageHours = (now - new Date(it.publishedAt).getTime()) / 3_600_000;
    const recency = Math.pow(0.5, Math.max(0, ageHours) / HALF_LIFE_HOURS);

    const total = 0.5 * popularity + 0.2 * engagement + 0.3 * recency;

    return {
      ...it,
      score: Number(total.toFixed(4)),
      breakdown: {
        popularity: Number(popularity.toFixed(3)),
        engagement: Number(engagement.toFixed(3)),
        recency: Number(recency.toFixed(3)),
      },
    };
  });
}

/** Normalize a title into a fingerprint so near-duplicates collide. */
export function signature(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3) // drop stopwords-ish
    .sort()
    .join(' ');
  return crypto.createHash('sha1').update(cleaned).digest('hex').slice(0, 16);
}

export function dedupe(items: ScoredItem[]): ScoredItem[] {
  const seen = new Set<string>();
  const out: ScoredItem[] = [];
  for (const it of items.sort((a, b) => b.score - a.score)) {
    const sig = signature(it.title);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(it);
  }
  return out;
}

export function pickWinner(items: ScoredItem[], log: TopicLog): ScoredItem | null {
  const priorSigs = new Set(log.topics.map((t) => t.signature));
  const candidate = items.find((it) => !priorSigs.has(signature(it.title)));
  return candidate ?? null;
}
