import type { AdapterResult } from './types';

const BSKY_SERVICE = 'https://bsky.social';

/**
 * Post to Bluesky via the AT Protocol. Skips silently unless BLUESKY_HANDLE and
 * BLUESKY_APP_PASSWORD are set (create an app password under Settings → App passwords).
 */
export async function postToBluesky(text: string, link?: string): Promise<AdapterResult> {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) return { skipped: true };

  const auth = await fetch(`${BSKY_SERVICE}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password }),
  });
  if (!auth.ok) throw new Error(`auth ${auth.status}: ${(await auth.text()).slice(0, 200)}`);
  const { accessJwt, did } = (await auth.json()) as { accessJwt: string; did: string };

  const record: Record<string, unknown> = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: new Date().toISOString(),
  };
  const facets = link ? linkFacets(text, link) : undefined;
  if (facets) record.facets = facets;

  const res = await fetch(`${BSKY_SERVICE}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessJwt}` },
    body: JSON.stringify({ repo: did, collection: 'app.bsky.feed.post', record }),
  });
  if (!res.ok) throw new Error(`post ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { uri?: string };
  return { url: data.uri };
}

/**
 * Bluesky doesn't auto-link URLs — a richtext facet over the URL's UTF-8 byte
 * range is what makes it clickable.
 */
export function linkFacets(text: string, url: string) {
  const idx = text.indexOf(url);
  if (idx < 0) return undefined;
  const enc = new TextEncoder();
  const byteStart = enc.encode(text.slice(0, idx)).length;
  const byteEnd = byteStart + enc.encode(url).length;
  return [
    {
      index: { byteStart, byteEnd },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }],
    },
  ];
}
