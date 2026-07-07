// AdSense configuration. The publisher id (public value) defaults from
// site.config.ts; override per-deploy with NEXT_PUBLIC_ADSENSE_CLIENT. Slot ids
// are account-specific ad units — set them to render the manual in-article and
// footer slots; without them those slots stay empty (Auto Ads still works from
// the loaded script if enabled in the dashboard).
import { siteConfig } from '@/site.config';

export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || siteConfig.adsenseClient;

export const ADSENSE_SLOT_IN_ARTICLE = process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE;
export const ADSENSE_SLOT_FOOTER = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER;
// Mid-article unit, injected between body sections on the post page (only when
// the post carries the contract's "## How to think about it" heading to split at).
export const ADSENSE_SLOT_MID_ARTICLE = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID_ARTICLE;
// Listing unit, rendered as a card in the home grid and after taxonomy listings.
export const ADSENSE_SLOT_LISTING = process.env.NEXT_PUBLIC_ADSENSE_SLOT_LISTING;
