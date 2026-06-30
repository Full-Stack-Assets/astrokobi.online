import type { AdapterResult } from './types';

/**
 * Post a status to Mastodon. Skips unless MASTODON_INSTANCE_URL (e.g.
 * https://mastodon.social) and MASTODON_ACCESS_TOKEN are set (create the token
 * under Preferences → Development). Mastodon auto-links URLs, so no facets needed.
 */
export async function postToMastodon(text: string): Promise<AdapterResult> {
  const instance = process.env.MASTODON_INSTANCE_URL?.replace(/\/+$/, '');
  const token = process.env.MASTODON_ACCESS_TOKEN;
  if (!instance || !token) return { skipped: true };

  const res = await fetch(`${instance}/api/v1/statuses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: text, visibility: 'public' }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { url?: string };
  return { url: data.url };
}
