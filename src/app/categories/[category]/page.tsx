import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { listPosts } from '@/lib/posts';
import { SITE_URL, SITE_NAME } from '@/lib/structured-data';
import { AdSlot } from '@/components/AdSlot';
import { ADSENSE_SLOT_LISTING } from '@/lib/ads';
import { siteConfig } from '@/site.config';

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await listPosts();
  const cats = Array.from(new Set(posts.map((p) => p.frontmatter.category)));
  return cats.map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const label = category[0].toUpperCase() + category.slice(1);
  const title = `${label} — latest coverage`;
  const description = `Every ${SITE_NAME} dispatch filed under ${label}.`;
  const url = `${SITE_URL}/categories/${category}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description, siteName: SITE_NAME },
    twitter: { card: 'summary', title, description },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const all = await listPosts();
  const posts = all.filter((p) => p.frontmatter.category === category);
  if (posts.length === 0) notFound();

  // Cross-link the sibling categories that actually have posts.
  const otherCategories = siteConfig.categories.filter(
    (c) => c !== category && all.some((p) => p.frontmatter.category === c)
  );

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: category, item: `${SITE_URL}/categories/${category}` },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }}
      />
      <div className="mb-12 border-b-2 border-ink pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">Category</div>
        <h1 className="mt-2 font-display text-5xl font-black capitalize">{category}</h1>
        <p className="mt-2 text-muted">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
      </div>
      <ul className="divide-y divide-ink/20">
        {posts.map((p) => (
          <li key={p.slug} className="py-6">
            <Link href={`/blog/${p.slug}`} className="group block">
              <h2 className="font-display text-2xl font-semibold group-hover:text-accent transition-colors">
                {p.frontmatter.title}
              </h2>
              <p className="mt-1 text-ink/70">{p.frontmatter.description}</p>
              <div className="mt-2 text-xs uppercase tracking-widest text-muted">
                {new Date(p.frontmatter.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}{p.readingTimeMin} min
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Listing ad — renders nothing unless AdSense + the listing unit are configured */}
      <AdSlot slot={ADSENSE_SLOT_LISTING} format="auto" className="mt-12" />

      {otherCategories.length > 0 && (
        <nav className="mt-14 border-t border-ink/20 pt-8">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
            Other frequencies
          </div>
          <div className="flex flex-wrap gap-3">
            {otherCategories.map((c) => (
              <Link
                key={c}
                href={`/categories/${c}`}
                className="border border-ink/30 px-3 py-1.5 text-xs uppercase tracking-widest text-ink/70 transition-colors hover:border-accent hover:text-accent"
              >
                {c}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
