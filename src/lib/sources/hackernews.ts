import type { RawItem } from '../orchestrator/types';

interface HNHit {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string;
  created_at: string;
  points: number;
  num_comments: number;
  story_text?: string;
  _tags: string[];
}

export async function fetchHackerNews(): Promise<RawItem[]> {
  // Filter to stories from the last 48 hours with >20 points.
  // Uses search_by_date for recency ordering + a created_at_i floor.
  const cutoff = Math.floor((Date.now() - 48 * 3600 * 1000) / 1000);
  const res = await fetch(
    `https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=points>20,created_at_i>${cutoff}&hitsPerPage=50`
  );
  if (!res.ok) return [];

  const json = (await res.json()) as { hits: HNHit[] };

  return json.hits
    .filter((h) => h.title && (h.url || h.story_text))
    .map<RawItem>((h) => ({
      id: `hn:${h.objectID}`,
      source: 'hackernews',
      title: h.title!,
      url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      author: h.author,
      publishedAt: h.created_at,
      summary: h.story_text?.slice(0, 500),
      upvotes: h.points,
      comments: h.num_comments,
      tags: h._tags.filter((t) => !t.startsWith('author_') && t !== 'story'),
    }));
}
