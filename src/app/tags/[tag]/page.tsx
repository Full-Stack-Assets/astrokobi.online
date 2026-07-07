import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { listPosts } from '@/lib/posts';
import { SITE_URL, SITE_NAME } from '@/lib/structured-data';
import { AdSlot } from '@/components/AdSlot';
import { ADSENSE_SLOT_LISTING } from '@/lib/ads';

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await listPosts();
  const tags = Array.from(new Set(posts.flatMap((p) => p.frontmatter.tags ?? [])));
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const title = `#${tag} — tagged stories`;
  const description = `Every ${SITE_NAME} dispatch tagged #${tag}.`;
  const url = `${SITE_URL}/tags/${tag}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, title, description, siteName: SITE_NAME },
    twitter: { card: 'summary', title, description },
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = (await listPosts()).filter((p) => p.frontmatter.tags?.includes(tag));
  if (posts.length === 0) notFound();

  // Cross-link the categories these tagged posts belong to.
  const categories = Array.from(new Set(posts.map((p) => p.frontmatter.category)));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12 border-b-2 border-ink pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">Tag</div>
        <h1 className="mt-2 font-display text-5xl font-black">#{tag}</h1>
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

      {categories.length > 0 && (
        <nav className="mt-14 border-t border-ink/20 pt-8">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
            Explore the frequencies
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
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
