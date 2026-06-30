import type { Post } from '../posts';
import { SITE_URL, SITE_NAME } from '../structured-data';

/** Assemble a markdown digest email from a set of posts (most recent first). */
export function buildDigest(posts: Post[]): { subject: string; body: string } {
  const [lead, ...rest] = posts;

  const subject =
    posts.length === 1
      ? `${SITE_NAME}: ${lead.frontmatter.title}`
      : `${SITE_NAME}: ${lead.frontmatter.title} (+${posts.length - 1} more)`;

  const url = (p: Post) => `${SITE_URL}/blog/${p.slug}`;

  // Curatorial intro — keeps the digest reading like a newsletter, not an RSS
  // dump. (Upgrade path: generate this line with the engine's LLM from the
  // week's titles for a fully bespoke lead.)
  const count = posts.length;
  const intro =
    `From the control room — ${count} ${count === 1 ? 'story' : 'stories'} worth your time this week.`;

  // Lead with one "story of the week," then a scannable list of the rest.
  const leadBlock =
    `## 🛰️ Story of the week\n\n` +
    `### [${lead.frontmatter.title}](${url(lead)})\n\n` +
    `${lead.frontmatter.description}\n`;

  const restBlock = rest.length
    ? `\n## Also this week\n\n` +
      rest
        .map((p) => `- **[${p.frontmatter.title}](${url(p)})** — ${p.frontmatter.description}`)
        .join('\n') +
      '\n'
    : '';

  const footer =
    `\n---\n\n` +
    `Enjoyed this? Forward it to someone who'd like it.\n\n` +
    `Read everything at ${SITE_URL}\n`;

  const body = `${intro}\n\n${leadBlock}${restBlock}${footer}`;
  return { subject, body };
}
