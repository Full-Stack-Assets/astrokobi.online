#!/usr/bin/env tsx
/**
 * Weekly newsletter digest — collects posts from the last N days and creates a
 * review DRAFT through the configured provider (not auto-sent; review and send
 * it from the provider dashboard). Run by .github/workflows/newsletter.yml.
 *
 * Usage: npx tsx scripts/newsletter-digest.ts
 */
import 'dotenv/config';
import { listPosts } from '../src/lib/posts';
import { buildDigest } from '../src/lib/newsletter/digest';
import { sendDigest, newsletterConfigured } from '../src/lib/newsletter';

// Parse defensively: an unset GitHub secret arrives as "" (not undefined), and
// Number("") is 0 — which would make the window 0 days and silently send nothing.
// Number("abc") is NaN. Fall back to 7 unless we got a positive finite number.
const parsedWindow = Number(process.env.NEWSLETTER_WINDOW_DAYS);
const WINDOW_DAYS = Number.isFinite(parsedWindow) && parsedWindow > 0 ? parsedWindow : 7;

async function main() {
  if (!newsletterConfigured()) {
    console.log('Newsletter not configured (set NEWSLETTER_PROVIDER + the provider API key) — skipping.');
    return;
  }

  const cutoff = Date.now() - WINDOW_DAYS * 86_400_000;
  const posts = (await listPosts()).filter(
    (p) => new Date(p.frontmatter.date).getTime() >= cutoff
  );

  if (posts.length === 0) {
    console.log(`No posts in the last ${WINDOW_DAYS} days — nothing to send.`);
    return;
  }

  const { subject, body } = buildDigest(posts);
  console.log(`→ Creating draft digest: "${subject}" (${posts.length} posts)`);

  const result = await sendDigest(subject, body);
  if (result.ok) {
    console.log('✓ Draft created — review it and send it from your newsletter provider dashboard.');
  } else {
    console.error('Digest draft failed:', result.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
