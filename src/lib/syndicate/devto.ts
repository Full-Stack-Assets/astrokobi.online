import type { AdapterResult, SyndicationPost } from './types';
import { siteConfig } from '@/site.config';

/**
 * Cross-post to DEV.to with a canonical URL pointing back to the original, so
 * it's SEO-safe (no duplicate-content penalty) and drives referral traffic.
 * Skips unless DEVTO_API_KEY is set (Settings → Extensions → DEV API Keys).
 *
 * We publish a lead excerpt rather than the full MDX — the post body uses custom
 * components (<Callout>, <ProsCons>, …) that DEV.to can't render — and link back
 * for the full version.
 */
export async function crossPostToDevTo(
  post: SyndicationPost,
  canonicalUrl: string
): Promise<AdapterResult> {
  const key = process.env.DEVTO_API_KEY;
  if (!key) return { skipped: true };

  const bodyMarkdown =
    `${extractLead(post.body)}\n\n` +
    `*Originally published on [${siteConfig.name}](${canonicalUrl}). ` +
    `[Read the full post →](${canonicalUrl})*`;

  const res = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'api-key': key },
    body: JSON.stringify({
      article: {
        title: post.title,
        published: true,
        canonical_url: canonicalUrl,
        description: post.description,
        tags: (post.tags ?? []).map(toDevTag).filter(Boolean).slice(0, 4),
        body_markdown: bodyMarkdown,
      },
    }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { url?: string };
  return { url: data.url };
}

/** The post's lead paragraph — everything before the first heading or MDX component. */
export function extractLead(body: string): string {
  const cut = body.search(/\n#{1,6}\s|\n?<[A-Z]/);
  const lead = (cut > 0 ? body.slice(0, cut) : body).trim();
  return lead || body.trim().slice(0, 500);
}

/** DEV.to tags must be lowercase alphanumeric only. */
function toDevTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '');
}
