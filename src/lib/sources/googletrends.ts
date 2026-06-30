import Parser from 'rss-parser';
import type { RawItem } from '../orchestrator/types';

// Google Trends' "Trending now" feed for the US. No API key needed.
const TRENDS_RSS = 'https://trends.google.com/trending/rss?geo=US';

// The raw feed is general-interest (sports, celebrities, weather…). Keep the
// blog on its space & astronomy niche by only surfacing trends whose term or
// related headlines mention one of these. Matched on WORD BOUNDARIES (case-
// insensitive): a naive substring match let off-niche news through before —
// e.g. "ai" inside "cap-tai-n" / "ai-des" matched the old tech keyword list.
const SPACE_TERMS = [
  'space', 'spaceflight', 'spacecraft', 'spacex', 'starship', 'rocket', 'rockets',
  'nasa', 'esa', 'isro', 'jaxa', 'astronaut', 'astronauts', 'cosmonaut', 'satellite',
  'satellites', 'orbit', 'orbital', 'orbiter', 'mars', 'martian', 'moon', 'lunar',
  'jupiter', 'saturn', 'venus', 'neptune', 'uranus', 'pluto', 'asteroid', 'asteroids',
  'comet', 'comets', 'meteor', 'meteorite', 'meteor shower', 'eclipse', 'telescope',
  'telescopes', 'hubble', 'webb', 'jwst', 'galaxy', 'galaxies', 'galactic', 'nebula',
  'supernova', 'pulsar', 'quasar', 'exoplanet', 'exoplanets', 'cosmology', 'cosmos',
  'cosmic', 'astronomy', 'astronomer', 'astronomers', 'astronomical', 'astrophysics',
  'astrobiology', 'gravitational wave', 'gravitational waves', 'dark matter',
  'dark energy', 'big bang', 'milky way', 'andromeda', 'solar system', 'interstellar',
  'planetary', 'planet', 'planets', 'artemis', 'voyager', 'perseverance', 'rover',
  'international space station', 'aurora', 'solar flare', 'sunspot', 'seti',
  'extraterrestrial', 'kuiper belt', 'oort cloud', 'observatory', 'black hole',
  'black holes', 'neutron star', 'dwarf planet', 'stargazing', 'celestial', 'constellation',
];
// Single case-insensitive regex; spaces in multi-word terms allow any whitespace.
const SPACE_RE = new RegExp('\\b(' + SPACE_TERMS.join('|').replace(/ /g, '\\s+') + ')\\b', 'i');

type TrendItemFields = {
  'ht:approx_traffic'?: string;
  'ht:news_item'?: Array<Record<string, unknown>>;
};

const parser = new Parser<Record<string, unknown>, TrendItemFields>({
  timeout: 10_000,
  customFields: {
    item: [
      'ht:approx_traffic',
      ['ht:news_item', 'ht:news_item', { keepArray: true }],
    ],
  },
});

export async function fetchGoogleTrends(): Promise<RawItem[]> {
  try {
    return await parseTrendsXml(await fetchText(TRENDS_RSS));
  } catch (err) {
    console.warn('[googletrends] fetch/parse failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

/** Parse a Google Trends RSS document into niche-filtered RawItems. */
export async function parseTrendsXml(xml: string): Promise<RawItem[]> {
  const feed = await parser.parseString(xml);
  return toRawItems(feed.items);
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; WireAndLogicBot/1.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

type TrendItem = TrendItemFields & { title?: string; isoDate?: string; pubDate?: string };

/** Map parsed feed items to RawItems, dropping anything off the tech niche. */
export function toRawItems(items: TrendItem[]): RawItem[] {
  const out: RawItem[] = [];

  for (const entry of items) {
    const term = String(entry.title ?? '').trim();
    if (!term) continue;

    const news = entry['ht:news_item'] ?? [];
    const haystack = [
      term,
      ...news.map((n) => `${field(n, 'ht:news_item_title')} ${field(n, 'ht:news_item_source')}`),
    ].join(' ');
    // SPACE_RE is case-insensitive, so no need to lowercase the haystack.
    if (!SPACE_RE.test(haystack)) continue;

    // Prefer a related news headline + URL so the research step has something
    // concrete to scrape; fall back to a Google search for the bare term.
    const top = news.find((n) => field(n, 'ht:news_item_url'));
    const title = (top && field(top, 'ht:news_item_title')) || term;
    const url =
      (top && field(top, 'ht:news_item_url')) ||
      `https://www.google.com/search?q=${encodeURIComponent(term)}`;

    out.push({
      id: `googletrends:${term}`,
      source: 'googletrends',
      title,
      url,
      publishedAt:
        String(entry.isoDate ?? entry.pubDate ?? '') || new Date().toISOString(),
      summary: `Trending search: ${term}`,
      upvotes: parseTraffic(entry['ht:approx_traffic']),
      comments: 0,
      tags: ['trending'],
    });
  }

  return out;
}

function field(obj: Record<string, unknown>, key: string): string {
  return String(obj[key] ?? '').trim();
}

/** "200,000+" / "200K+" / "2M+" → an approximate integer for scoring. */
export function parseTraffic(raw?: string): number {
  if (!raw) return 0;
  const m = raw.replace(/[,+\s]/g, '').match(/^([\d.]+)\s*([KMB]?)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = m[2].toUpperCase();
  const mult = unit === 'B' ? 1e9 : unit === 'M' ? 1e6 : unit === 'K' ? 1e3 : 1;
  return Math.round(n * mult);
}
