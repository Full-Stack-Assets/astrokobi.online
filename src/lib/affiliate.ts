// Affiliate-link helpers for the <GearBox>/<GearPick> MDX components.
//
// Design goals:
//  - Retailer-agnostic: a <GearPick> can carry any full affiliate URL.
//  - Amazon convenience: pass a bare ASIN and we build the product URL and
//    append the configured Associates tag.
//  - Safe to ship untagged: with no tag configured, links render as plain,
//    untracked outbound links (still rel="sponsored nofollow") — nothing breaks
//    and nothing silently mis-attributes.
//
// The tag resolves from `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` (per-deploy override)
// then `siteConfig.affiliate.amazonTag`. Empty-string env vars (unset CI
// secrets arrive as "") are treated as absent, per the repo convention.
import { siteConfig } from '@/site.config';

/** The Amazon Associates tracking id, or '' when none is configured. */
export function amazonTag(): string {
  const fromEnv = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return siteConfig.affiliate?.amazonTag?.trim() || '';
}

/** True when any affiliate tag is configured (gates the disclosure copy). */
export function affiliateEnabled(): boolean {
  return amazonTag().length > 0;
}

/**
 * Whether to render the site-wide affiliate disclosure (footer + About page).
 * Driven by config so it shows for Amazon/FTC compliance regardless of whether
 * a tracking tag is set yet — a site can carry affiliate links before its
 * program approval comes through.
 */
export function shouldDisclose(): boolean {
  return siteConfig.affiliate?.disclose ?? true;
}

/** Append the Associates tag to an Amazon URL (no-op if untagged or already tagged). */
function tagAmazonUrl(url: string, tag: string): string {
  if (!tag) return url;
  try {
    const u = new URL(url);
    if (!/(^|\.)amazon\./i.test(u.hostname)) return url; // only decorate Amazon
    if (u.searchParams.has('tag')) return url; // respect an explicit tag
    u.searchParams.set('tag', tag);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Resolve the final href for a <GearPick>.
 *  - `asin` given  → https://www.amazon.com/dp/<ASIN>?tag=<tag>
 *  - `href` given  → used as-is, with the Amazon tag appended if it's an
 *                    Amazon link and no tag is already present.
 */
export function resolveGearHref({ href, asin }: { href?: string; asin?: string }): string {
  const tag = amazonTag();
  if (asin && asin.trim()) {
    const base = `https://www.amazon.com/dp/${encodeURIComponent(asin.trim())}`;
    return tag ? `${base}?tag=${encodeURIComponent(tag)}` : base;
  }
  if (href && href.trim()) return tagAmazonUrl(href.trim(), tag);
  return '#';
}
