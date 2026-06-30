export interface SyndicationPost {
  slug: string;
  title: string;
  description: string;
  body: string;
  tags?: string[];
}

export interface SyndicationResult {
  platform: string;
  status: 'posted' | 'skipped' | 'error';
  url?: string;
  reason?: string;
}

/** An adapter either skips (not configured) or returns the created post's URL. */
export type AdapterResult = { skipped: true } | { url?: string };
