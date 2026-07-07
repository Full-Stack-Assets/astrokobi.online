'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT as CLIENT } from '@/lib/ads';

/**
 * A single AdSense ad unit. Renders nothing unless both the publisher id (see
 * src/lib/ads.ts) and a `slot` id are configured — slots stay empty until their
 * ad-unit ids are provided (Auto Ads still works from the site-wide script
 * regardless).
 *
 * Lazy by default: the adsbygoogle push (which triggers the ad request) fires
 * only when the unit scrolls within ~300px of the viewport, so below-the-fold
 * units don't cost bandwidth or drag down LCP on load. Pass `eager` for a unit
 * that is reliably above the fold.
 */
export function AdSlot({
  slot,
  format = 'auto',
  layout,
  className = '',
  eager = false,
}: {
  slot?: string;
  format?: string;
  layout?: string;
  className?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !slot || pushed.current) return;

    const push = () => {
      if (pushed.current) return;
      try {
        ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
        pushed.current = true;
      } catch {
        // AdSense script not ready or blocked — leave the slot empty.
      }
    };

    const el = ref.current;
    if (eager || !el || typeof IntersectionObserver === 'undefined') {
      push();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          push();
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [slot, eager]);

  if (!CLIENT || !slot) return null;

  return (
    <ins
      ref={ref}
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
