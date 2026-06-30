import type { GeneratedPost } from './types';
import { siteConfig, type ImageProvider } from '@/site.config';

type Hero = GeneratedPost['heroImage'];

interface PexelsPhoto {
  photographer: string;
  photographer_url: string;
  alt: string;
  src: { large2x: string };
}
interface PexelsResponse {
  photos: PexelsPhoto[];
}

interface OpenverseResult {
  url: string;
  title?: string;
  creator?: string;
  creator_url?: string;
  foreign_landing_url?: string;
}
interface OpenverseResponse {
  results?: OpenverseResult[];
}

// Tags/categories too generic to make a meaningful image search; skipped when
// building queries so the hero reflects the article's actual subject.
const GENERIC_TERMS = new Set([
  'news', 'opinion', 'explainers', 'explainer', 'tech', 'technology',
  'culture', 'reviews', 'review', 'general', 'misc', 'update', 'updates',
]);

/**
 * Pick a banner image for a post. Provider is set in site.config.ts:
 *   'pexels'    — best quality, needs PEXELS_API_KEY (falls back to Openverse)
 *   'openverse' — keyless, commercial-licensed open media
 *   'none'      — no hero image
 *
 * To keep the hero relevant to the article, we build an ordered list of
 * candidate queries (most specific → broadest) and try each until a provider
 * returns a match — so an accurate, specific image wins when one exists, but we
 * still degrade to a broader (and finally keyless) source rather than no image.
 * Every outcome is logged so image relevance can be monitored from CI logs.
 */
export async function pickImage(post: GeneratedPost): Promise<Hero> {
  // The `as const` config gives imageProvider a literal type; assert to the
  // union so the branches below type-check. This still catches a bad provider
  // string at compile time (asserting a non-member literal is a TS error).
  const provider = siteConfig.imageProvider as ImageProvider;
  if (provider === 'none') return emptyHero();

  const queries = buildQueries(post);
  const usePexels = provider === 'pexels' && !!process.env.PEXELS_API_KEY;

  for (const query of queries) {
    if (usePexels) {
      const fromPexels = await pexels(post, query).catch((e) => {
        console.warn('[image] pexels failed, falling back:', e);
        return null;
      });
      if (fromPexels) return logHero(post, 'pexels', query, fromPexels);
    }

    const fromOpenverse = await openverse(post, query).catch((e) => {
      console.warn('[image] openverse failed:', e);
      return null;
    });
    if (fromOpenverse) return logHero(post, 'openverse', query, fromOpenverse);
  }

  // Monitoring: a post that ends up with no hero is surfaced loudly so it can
  // be caught and re-imaged rather than silently shipping a blank banner.
  console.warn(
    `[image] NO image found for "${post.slug}" — tried: ${queries.map((q) => `"${q}"`).join(', ')}. Hero left empty.`
  );
  return emptyHero();
}

/**
 * Ordered candidate queries, most specific (most accurate) first, broadening to
 * keep the hit-rate high. Drops hyphens, generic terms, and duplicates.
 */
export function buildQueries(post: GeneratedPost): string[] {
  const clean = (s: string) => s.replace(/-/g, ' ').trim();
  const tags = (post.tags ?? []).filter((t) => t && !GENERIC_TERMS.has(t.toLowerCase()));
  const cat = post.category && !GENERIC_TERMS.has(post.category.toLowerCase()) ? post.category : '';

  const candidates = [
    tags.slice(0, 2).join(' '), // two strongest tags → specific, on-subject
    tags[0] ?? '', // single strongest tag
    cat, // the category
    post.tags?.[0] ?? post.category ?? 'news', // last-resort, even if generic
  ];

  return [...new Set(candidates.map(clean).filter(Boolean))];
}

function logHero(post: GeneratedPost, provider: string, query: string, hero: Hero): Hero {
  // Monitoring: one structured line per post so image source/relevance is
  // auditable from the generation logs.
  console.log(`[image] ${post.slug}: provider=${provider} query="${query}" → ${hero.url.slice(0, 100)}`);
  return hero;
}

function emptyHero(): Hero {
  return { url: '', alt: '', credit: '', creditUrl: '' };
}

async function pexels(post: GeneratedPost, query: string): Promise<Hero | null> {
  const url = new URL('https://api.pexels.com/v1/search');
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', 'landscape');
  url.searchParams.set('size', 'large');
  url.searchParams.set('per_page', '15');

  const res = await fetch(url, { headers: { authorization: process.env.PEXELS_API_KEY as string } });
  if (!res.ok) return null;
  const json = (await res.json()) as PexelsResponse;
  if (!json.photos?.length) return null;

  const photo = json.photos[Math.abs(hashCode(post.slug)) % Math.min(5, json.photos.length)];
  return {
    url: photo.src.large2x,
    alt: photo.alt || post.title,
    credit: photo.photographer,
    creditUrl: photo.photographer_url,
  };
}

async function openverse(post: GeneratedPost, query: string): Promise<Hero | null> {
  const url = new URL('https://api.openverse.org/v1/images/');
  url.searchParams.set('q', query);
  url.searchParams.set('license_type', 'commercial');
  url.searchParams.set('aspect_ratio', 'wide');
  url.searchParams.set('page_size', '15');

  const res = await fetch(url, {
    headers: { 'user-agent': `${siteConfig.name.replace(/\s+/g, '')}/1.0 (+${siteConfig.url})` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as OpenverseResponse;
  const results = json.results ?? [];
  if (!results.length) return null;

  const r = results[Math.abs(hashCode(post.slug)) % Math.min(5, results.length)];
  return {
    url: r.url,
    alt: r.title || post.title,
    credit: r.creator || 'Openverse',
    creditUrl: r.foreign_landing_url || r.creator_url || 'https://openverse.org',
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
