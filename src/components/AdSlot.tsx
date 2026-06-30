'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT as CLIENT } from '@/lib/ads';

/**
 * A single AdSense ad unit. The publisher id is configured by default (see
 * src/lib/ads.ts), so this renders nothing unless a `slot` id is also set — the
 * manual in-article and footer slots stay empty until their ad-unit ids are
 * provided (Auto Ads still works from the site-wide script regardless).
 */
export function AdSlot({
  slot,
  format = 'auto',
  layout,
  className = '',
}: {
  slot?: string;
  format?: string;
  layout?: string;
  className?: string;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !slot || pushed.current) return;
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not ready or blocked — leave the slot empty.
    }
  }, [slot]);

  if (!CLIENT || !slot) return null;

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
      {...(layout ? { 'data-ad-layout': layout } : {})}
      aria-label="Advertisement"
    />
  );
}
