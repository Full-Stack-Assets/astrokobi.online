# Affiliate links — `<GearBox>` / `<GearPick>`

Reusable MDX components for tasteful, FTC-compliant product recommendations in
posts. Retailer-agnostic, safe to ship with no affiliate account configured.

## Setup

Set your Amazon Associates tracking id either in `src/site.config.ts`:

```ts
affiliate: { amazonTag: 'astrokobi-20' },
```

…or per-deploy via env (overrides the config, see `.env.example`):

```
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG=astrokobi-20
```

**Leave it blank and nothing breaks** — links render as plain, untracked
outbound links (still `rel="sponsored nofollow"`). They start earning the moment
a tag is set; no per-post edits needed.

## Usage in a post

```mdx
<GearBox title="Start contributing tonight">
  <GearPick name="10x50 binoculars" href="https://www.amazon.com/s?k=10x50+astronomy+binoculars" why="the cheapest way to start" />
  <GearPick name="Beginner Dobsonian telescope" asin="B00DFG1PSO" why="best aperture per dollar" price="≈$300" />
</GearBox>
```

- **`<GearBox title?>`** — bordered block; renders the title + the affiliate
  disclosure automatically, then its `<GearPick>` children.
- **`<GearPick>`** props:
  - `name` (required) — the link text.
  - `href` — any retailer's affiliate URL. Amazon links get the tag appended automatically.
  - `asin` — a bare Amazon ASIN; the component builds `amazon.com/dp/<ASIN>?tag=<tag>`.
  - `why` — short reason it's recommended.
  - `price` — optional price hint shown on the right.

Use **either** `href` **or** `asin`. All links are `target="_blank"` +
`rel="sponsored nofollow noopener noreferrer"`.

## Where it's wired today

The components are live in a curated set of high-intent posts (stargazing,
telescopes, aurora-chasing, moon-watching, and "further reading" boxes on
explainer posts). To roll out more, drop a `<GearBox>` right before the `## FAQ`
heading in any post.

## Site-wide disclosure

A site-wide affiliate disclosure renders automatically in the **footer** (every
page) and as an **"Affiliate disclosure" section on the About page**, satisfying
the Amazon Associates Operating Agreement and FTC requirements. It's controlled by
`site.config.ts → affiliate.disclose` (default `true`) and shows regardless of
whether a tracking tag is set yet — so it's in place before program approval.
Set `disclose: false` only for a site instance that carries no affiliate links.

The same `<AffiliateDisclosure scope="site" />` component is reused; inside a
`<GearBox>` it renders with `scope="box"` wording automatically.

## Notes

- These are **optional** components — the hourly generation pipeline does **not**
  emit them (the writer prompt and `PostSchema` are unchanged). They're for
  manually-curated placements only, so the strict MDX contract is untouched.
- Implementation: `src/lib/affiliate.ts` (URL/tag logic) and the components in
  `src/components/mdx/index.tsx` (registered in `mdxComponents`).
