// The addresses of the blog's posts, kept apart from the posts themselves so the first page load (App.tsx) can tell a post's address from
// the homepage without loading the shop. A post lives at the site's root like on the old WordPress site, ekotehnika.rs/<post>/, so an
// old post keeps its exact address when it comes over (taste 2026-11-26 13:06, briefs/blog/plan.md). Every slug here also needs its two
// rewrites in vercel.json, with and without the closing slash.
export const POST_SLUGS = ['linde-safety-guard', 'postavka-regala-vemax', 'staplercup-2025', 'linde-servisni-setovi', 'gri-ultimate-green-xt'] as const;

export const isPostSlug = (s: string) => (POST_SLUGS as readonly string[]).includes(s);
