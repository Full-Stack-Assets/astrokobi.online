import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { activeSiteVariant, siteConfig } from '@/site.config';

export interface PostFrontmatter {
  site: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  hero: { url: string; alt: string; credit: string; creditUrl: string };
  sources: Array<{ title: string; url: string }>;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  body: string;
  readingTimeMin: number;
}

const POSTS_DIR = path.join(process.cwd(), 'content', siteConfig.contentDirectory);

export async function listPosts(): Promise<Post[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(POSTS_DIR);
  } catch {
    return [];
  }
  const posts = await Promise.all(
    files.filter((f) => f.endsWith('.mdx')).map((f) => loadPost(f.replace(/\.mdx$/, '')))
  );
  const now = Date.now();
  return posts
    .filter((p): p is Post => p !== null)
    .filter((p) => p.frontmatter.site === activeSiteVariant)
    // Scheduled publishing: a post dated in the future stays hidden from every
    // listing (home, categories, tags, feed, sitemap) until its time arrives.
    // An unparseable date is treated as published so it can never hide a post.
    .filter((p) => {
      const t = new Date(p.frontmatter.date).getTime();
      return Number.isNaN(t) || t <= now;
    })
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}

export async function loadPost(slug: string): Promise<Post | null> {
  try {
    const raw = await fs.readFile(path.join(POSTS_DIR, `${slug}.mdx`), 'utf8');
    const { data, content } = matter(raw);
    const rt = readingTime(content);
    if (data.site !== activeSiteVariant) return null;
    return {
      slug,
      frontmatter: data as PostFrontmatter,
      body: content,
      readingTimeMin: Math.max(1, Math.round(rt.minutes)),
    };
  } catch {
    return null;
  }
}

export async function listSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(POSTS_DIR);
    return files.filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));
  } catch {
    return [];
  }
}

/**
 * Rank other posts by relevance to `current` for in-article internal linking:
 * shared tags first, then same category, then recency. Always returns up to
 * `limit` posts (falling back to recent ones) so the "keep reading" block is
 * never empty when other posts exist.
 */
export function relatedPosts(current: Post, all: Post[], limit = 3): Post[] {
  const currentTags = new Set((current.frontmatter.tags ?? []).map((t) => t.toLowerCase()));

  return all
    .filter((p) => p.slug !== current.slug)
    .map((p) => ({
      post: p,
      shared: (p.frontmatter.tags ?? []).filter((t) => currentTags.has(t.toLowerCase())).length,
      sameCategory: p.frontmatter.category === current.frontmatter.category ? 1 : 0,
    }))
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        b.sameCategory - a.sameCategory ||
        b.post.frontmatter.date.localeCompare(a.post.frontmatter.date)
    )
    .slice(0, limit)
    .map((x) => x.post);
}
