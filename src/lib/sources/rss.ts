import Parser from 'rss-parser';
import type { RawItem } from '../orchestrator/types';
import { siteConfig } from '@/site.config';

const DEFAULT_FEEDS = siteConfig.sources.rssFeeds;

const parser = new Parser({ timeout: 10_000 });

export async function fetchRss(): Promise<RawItem[]> {
  const extra = process.env.EXTRA_FEEDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  const feeds = [...DEFAULT_FEEDS, ...extra];
  const items: RawItem[] = [];

  const results = await Promise.allSettled(feeds.map((f) => parser.parseURL(f)));

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const feed = result.value;
    for (const entry of feed.items.slice(0, 10)) {
      if (!entry.link || !entry.title) continue;
      items.push({
        id: `rss:${entry.guid ?? entry.link}`,
        source: 'rss',
        title: entry.title,
        url: entry.link,
        author: entry.creator ?? feed.title,
        publishedAt: entry.isoDate ?? entry.pubDate ?? new Date().toISOString(),
        summary: (entry.contentSnippet ?? entry.content ?? '').slice(0, 500),
        tags: entry.categories ?? [],
      });
    }
  }
  return items;
}
