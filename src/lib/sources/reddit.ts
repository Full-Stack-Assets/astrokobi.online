import type { RawItem } from '../orchestrator/types';
import { siteConfig } from '@/site.config';

const SUBREDDITS = siteConfig.sources.subreddits;

// Reddit asks for a descriptive User-Agent identifying the app. Derive it from
// the site config so it stays accurate when the template is re-skinned.
const USER_AGENT = `${siteConfig.name.replace(/\s+/g, '')}:v1.0 (+${siteConfig.url})`;

/**
 * Reddit requires OAuth2 "application only" auth for server-side requests.
 * This is free and doesn't require a Reddit user account to act on behalf of.
 * 
 * Create a "script" app at https://www.reddit.com/prefs/apps
 * and set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env.
 */
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // Reuse token if still valid (Reddit tokens last 1 hour)
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent': USER_AGENT,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    console.warn(`[reddit] OAuth token request failed: ${res.status}`);
    return null;
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000, // refresh 1min early
  };
  return cachedToken.token;
}

export async function fetchReddit(): Promise<RawItem[]> {
  const token = await getAccessToken();
  if (!token) {
    console.warn('[reddit] REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set — skipping Reddit');
    return [];
  }

  const items: RawItem[] = [];
  const ua = USER_AGENT;

  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://oauth.reddit.com/r/${sub}/top?t=day&limit=15`,
        {
          headers: {
            'authorization': `Bearer ${token}`,
            'user-agent': ua,
          },
        }
      );
      if (!res.ok) {
        console.warn(`[reddit] r/${sub} returned ${res.status}`);
        continue;
      }
      const json = (await res.json()) as {
        data: { children: Array<{ data: RedditPost }> };
      };

      for (const child of json.data.children) {
        const p = child.data;
        if (p.stickied || p.over_18) continue;
        items.push({
          id: `reddit:${p.id}`,
          source: 'reddit',
          title: p.title,
          url: p.url_overridden_by_dest ?? `https://reddit.com${p.permalink}`,
          author: p.author,
          publishedAt: new Date(p.created_utc * 1000).toISOString(),
          summary: p.selftext?.slice(0, 500),
          upvotes: p.ups,
          comments: p.num_comments,
          tags: [sub],
        });
      }
    } catch (err) {
      console.warn(`[reddit] ${sub} failed:`, err);
    }
  }
  return items;
}

interface RedditPost {
  id: string;
  title: string;
  url_overridden_by_dest?: string;
  permalink: string;
  author: string;
  created_utc: number;
  selftext?: string;
  ups: number;
  num_comments: number;
  stickied: boolean;
  over_18: boolean;
}
