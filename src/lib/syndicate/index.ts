import { SITE_URL } from '../structured-data';
import { postToBluesky } from './bluesky';
import { postToMastodon } from './mastodon';
import { crossPostToDevTo } from './devto';
import type { AdapterResult, SyndicationPost, SyndicationResult } from './types';

export type { SyndicationPost, SyndicationResult } from './types';

/** Conservative microblog ceiling — fits Bluesky (300 graphemes) and Mastodon (500). */
const MICROBLOG_LIMIT = 280;

/**
 * Fan a freshly published post out to every configured platform. Each adapter
 * no-ops when its credentials are absent and never throws past this boundary, so
 * a missing token or a flaky API can't fail the generation run.
 */
export async function syndicate(post: SyndicationPost): Promise<SyndicationResult[]> {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const blurb = microblogText(post.title, post.description, url);

  return Promise.all([
    runAdapter('bluesky', () => postToBluesky(blurb, url)),
    runAdapter('mastodon', () => postToMastodon(blurb)),
    runAdapter('devto', () => crossPostToDevTo(post, url)),
  ]);
}

async function runAdapter(
  platform: string,
  fn: () => Promise<AdapterResult>
): Promise<SyndicationResult> {
  try {
    const r = await fn();
    if ('skipped' in r) return { platform, status: 'skipped', reason: 'not configured' };
    return { platform, status: 'posted', url: r.url };
  } catch (err) {
    return { platform, status: 'error', reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Compose "title — description\n\nurl", trimmed to fit the microblog limit. */
export function microblogText(title: string, description: string, url: string): string {
  const tail = `\n\n${url}`;
  const room = MICROBLOG_LIMIT - tail.length;
  const withDesc = `${title} — ${description}`;

  let lead: string;
  if (withDesc.length <= room) lead = withDesc;
  else if (title.length <= room) lead = title;
  else lead = title.slice(0, room - 1).trimEnd() + '…';

  return `${lead}${tail}`;
}
