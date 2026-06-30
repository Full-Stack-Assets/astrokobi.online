import Parser from 'rss-parser';
import type { RawItem } from '../orchestrator/types';

type YtItem = {
  id?: string;
  title?: string;
  link?: string;
  author?: string;
  isoDate?: string;
  pubDate?: string;
  'media:group'?: { 'media:description'?: string[] };
};

const parser: Parser<unknown, YtItem> = new Parser({
  customFields: { item: [['media:group', 'media:group']] },
});

export async function fetchYouTube(): Promise<RawItem[]> {
  const channels = process.env.YOUTUBE_CHANNELS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (channels.length === 0) return [];

  const items: RawItem[] = [];

  for (const channelId of channels) {
    try {
      const feed = await parser.parseURL(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      );
      for (const entry of feed.items.slice(0, 5)) {
        if (!entry.link || !entry.title) continue;
        const videoId = entry.link.split('v=')[1]?.split('&')[0] ?? entry.id ?? entry.link;
        const desc = entry['media:group']?.['media:description']?.[0];
        items.push({
          id: `youtube:${videoId}`,
          source: 'youtube',
          title: entry.title,
          url: entry.link,
          author: entry.author ?? channelId,
          publishedAt: entry.isoDate ?? entry.pubDate ?? new Date().toISOString(),
          summary: desc?.slice(0, 500),
          tags: ['video'],
        });
      }
    } catch (err) {
      console.warn(`[youtube] ${channelId} failed:`, err);
    }
  }
  return items;
}
