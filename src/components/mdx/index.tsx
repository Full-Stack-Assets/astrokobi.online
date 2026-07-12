import type { ReactNode } from 'react';
import { siteConfig } from '@/site.config';
import { resolveGearHref } from '@/lib/affiliate';
import { NewsletterCTA } from '@/components/NewsletterCTA';

type CalloutType = 'takeaway' | 'warning' | 'note';

const CALLOUT_CONFIG: Record<CalloutType, { label: string; bg: string; border: string; accent: string }> = {
  takeaway: { label: 'Takeaway', bg: 'bg-accent/[0.06]', border: 'border-accent', accent: 'text-accent' },
  warning:  { label: 'Watch out', bg: 'bg-amber-400/[0.06]', border: 'border-amber-400', accent: 'text-amber-300' },
  note:     { label: 'Note', bg: 'bg-white/[0.03]', border: 'border-muted', accent: 'text-muted' },
};

export function Callout({ type = 'note', children }: { type?: CalloutType; children: ReactNode }) {
  const c = CALLOUT_CONFIG[type];
  return (
    <aside className={`my-8 border border-white/10 border-l-2 ${c.border} ${c.bg} pl-5 pr-5 py-4 backdrop-blur-sm`}>
      <div className={`mb-1 font-mono text-[10px] uppercase tracking-[0.25em] ${c.accent}`}>
        {c.label}
      </div>
      <div className="font-display text-lg leading-snug text-paper">{children}</div>
    </aside>
  );
}

export function ProsCons({ children }: { children: ReactNode }) {
  return (
    <div className="glass-card my-10 grid gap-4 sm:grid-cols-2 sm:gap-0">
      {children}
    </div>
  );
}

export function Pros({ children }: { children: ReactNode }) {
  return (
    <div className="border-t-2 border-accent p-6 sm:border-r sm:border-r-white/10">
      <div className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-accent">
        <span className="text-lg leading-none">+</span> Pros
      </div>
      <ul className="space-y-2 text-base text-paper/85">{children}</ul>
    </div>
  );
}

export function Cons({ children }: { children: ReactNode }) {
  return (
    <div className="border-t-2 border-muted p-6">
      <div className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-muted">
        <span className="text-lg leading-none">–</span> Cons
      </div>
      <ul className="space-y-2 text-base text-paper/85">{children}</ul>
    </div>
  );
}

export function FAQ({ children }: { children: ReactNode }) {
  return (
    <div className="my-10 divide-y divide-white/10 border-t border-b border-white/15">
      {children}
    </div>
  );
}

export function Question({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group py-5">
      <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
        <span className="font-display text-lg font-medium leading-snug text-paper transition-colors group-hover:text-accent">{q}</span>
        <span className="mt-1 shrink-0 text-accent font-mono text-xl leading-none transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="mt-3 text-[17px] leading-relaxed text-paper/75">{children}</div>
    </details>
  );
}

/**
 * FTC-compliant affiliate disclosure. Reads the site name from siteConfig so the
 * template stays portable.
 *  - scope="box"  (default): wording for inside a <GearBox> ("the links below").
 *  - scope="site": wording for a site-wide placement (footer / About page).
 */
export function AffiliateDisclosure({ scope = 'box' }: { scope?: 'box' | 'site' }) {
  if (scope === 'site') {
    return (
      <p className="text-[11px] leading-relaxed text-muted">
        Some links on {siteConfig.name} are affiliate links. If you buy through
        them, {siteConfig.name} may earn a commission at no extra cost to you —
        it helps keep the site running. We only recommend things we&rsquo;d point
        a friend to. <span className="whitespace-nowrap">As an Amazon Associate,</span>{' '}
        {siteConfig.name} earns from qualifying purchases.
      </p>
    );
  }
  return (
    <p className="text-[11px] leading-relaxed text-muted">
      {siteConfig.name} may earn a commission on purchases made through the links
      below, at no extra cost to you. We only recommend gear we'd point a friend
      to. <span className="whitespace-nowrap">As an Amazon Associate,</span>{' '}
      {siteConfig.name} earns from qualifying purchases.
    </p>
  );
}

/**
 * A single product recommendation row. Either pass a bare Amazon `asin`
 * (decorated with the configured Associates tag) or a full `href` to any
 * retailer's affiliate URL. Always rendered rel="sponsored nofollow".
 */
export function GearPick({
  name,
  href,
  asin,
  why,
  price,
}: {
  name: string;
  href?: string;
  asin?: string;
  why?: ReactNode;
  price?: string;
}) {
  const url = resolveGearHref({ href, asin });
  return (
    <li className="flex flex-col gap-1 border-t border-white/10 py-3 first:border-t-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <a
          href={url}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
          className="font-display font-semibold text-accent underline-offset-2 hover:underline"
        >
          {name}
        </a>
        {why && <span className="ml-2 text-sm text-muted">— {why}</span>}
      </div>
      {price && (
        <span className="shrink-0 font-mono text-xs uppercase tracking-widest text-muted">
          {price}
        </span>
      )}
    </li>
  );
}

/**
 * A bordered "recommended gear" block for the body of a post. Wraps a list of
 * <GearPick> items with a heading and the affiliate disclosure.
 */
export function GearBox({ title = 'Recommended gear', children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="glass-card my-10 p-6">
      <div className="mb-1 font-display text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        {title}
      </div>
      <div className="mb-4">
        <AffiliateDisclosure />
      </div>
      <ul className="space-y-0">{children}</ul>
    </aside>
  );
}

export const mdxComponents = {
  Callout,
  ProsCons,
  Pros,
  Cons,
  FAQ,
  Question,
  GearBox,
  GearPick,
  AffiliateDisclosure,
  NewsletterCTA,
};
