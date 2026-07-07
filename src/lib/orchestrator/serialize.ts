import type { GeneratedPost } from './types';
import { activeSiteVariant } from '@/site.config';

/**
 * Serialize a GeneratedPost into a complete MDX file with YAML frontmatter.
 * The shape matches the TinaCMS schema in tina/config.ts. `date` defaults to now
 * (the live pipeline) but can be overridden — the seed/backfill runner spreads
 * dates across recent history so a generated back catalog looks natural.
 */
export function serialize(post: GeneratedPost, date: Date = new Date()): string {
  const fm = {
    site: activeSiteVariant,
    title: post.title,
    description: post.description,
    date: date.toISOString(),
    category: post.category,
    tags: post.tags,
    hero: {
      url: post.heroImage.url,
      alt: post.heroImage.alt,
      credit: post.heroImage.credit,
      creditUrl: post.heroImage.creditUrl,
    },
    sources: post.sources,
  };

  const yaml = toYaml(fm);
  return `---\n${yaml}---\n\n${sanitizeBody(post.body).trim()}\n`;
}

/**
 * Make the LLM-written MDX body safe to prerender. Two known model habits break
 * MDX parsing and would fail the whole site build:
 *
 * 1. Unescaped double quotes inside a <Question q="..."> attribute (e.g. q="the
 *    "limited" plan"). Replace the inner double quotes with single quotes so
 *    the attribute stays well-formed.
 * 2. A component opened on its own line but closed inline at the end of a
 *    paragraph:
 *        <Callout type="takeaway">
 *        Some paragraph text.</Callout>
 *    In MDX a tag alone on its line opens a *flow* element whose closing tag
 *    must also sit at block level — glued to the paragraph it's a parse error
 *    ("Expected the closing tag … after the end of paragraph"). Move such a
 *    closing tag onto its own line. Single-line elements (open + close on one
 *    line) are valid and left untouched.
 */
export function sanitizeBody(body: string): string {
  const quotesFixed = body.replace(
    /(<Question\s+q=")([^\n]*?)(">)/g,
    (_match, open: string, question: string, close: string) =>
      `${open}${question.replace(/"/g, "'")}${close}`
  );

  return quotesFixed.replace(
    /^(.*\S)(<\/(Callout|Question|Pros|Cons|ProsCons|FAQ|GearBox|GearPick)>)[ \t]*$/gm,
    (match, before: string, closing: string, tag: string) =>
      // Leave valid single-line elements (opening tag on the same line) alone.
      new RegExp(`<${tag}[\\s>]`).test(before) ? match : `${before}\n${closing}`
  );
}

function toYaml(obj: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return 'null';

  if (typeof obj === 'string') return quoteIfNeeded(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return (
      '\n' +
      obj
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            const entries = Object.entries(item as Record<string, unknown>);
            const first = entries[0];
            const rest = entries.slice(1);
            const firstLine = `${pad}- ${first[0]}: ${toYaml(first[1], indent + 1)}`;
            const restLines = rest
              .map(([k, v]) => `${pad}  ${k}: ${toYaml(v, indent + 1)}`)
              .join('\n');
            return restLines ? `${firstLine}\n${restLines}` : firstLine;
          }
          return `${pad}- ${toYaml(item, indent + 1)}`;
        })
        .join('\n')
    );
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    if (indent === 0) {
      return entries.map(([k, v]) => `${k}: ${toYaml(v, indent + 1)}`).join('\n') + '\n';
    }
    return (
      '\n' +
      entries.map(([k, v]) => `${pad}${k}: ${toYaml(v, indent + 1)}`).join('\n')
    );
  }

  return '';
}

function quoteIfNeeded(s: string): string {
  // Always quote for safety — dates, colons, leading dashes, etc. all need it
  const escaped = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}
