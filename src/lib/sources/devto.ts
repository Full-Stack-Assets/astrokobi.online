import type { RawItem } from '../orchestrator/types';

interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  tag_list: string[];
  positive_reactions_count: number;
  comments_count: number;
  user: { username: string };
}

export async function fetchDevTo(): Promise<RawItem[]> {
  const res = await fetch(
    'https://dev.to/api/articles?per_page=50&top=1',
    { headers: { accept: 'application/json' } }
  );
  if (!res.ok) return [];

  const articles = (await res.json()) as DevToArticle[];

  return articles.map<RawItem>((a) => ({
    id: `devto:${a.id}`,
    source: 'devto',
    title: a.title,
    url: a.url,
    author: a.user.username,
    publishedAt: a.published_at,
    summary: a.description,
    upvotes: a.positive_reactions_count,
    comments: a.comments_count,
    tags: a.tag_list,
  }));
}
