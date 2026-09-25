/* The blog: /blog (every post) and /blog/<slug> (one post).
   ---------------------------------------------------------------------------
   The posts themselves are data, in src/content/blog.ts; this file only
   renders them. <Footer /> is appended by App.tsx, as on the other pages; the
   FAQ is not, because it belongs to the product pages.

   Reused rather than rebuilt: <Nav>, <LiveDot> + `.eyebrow`, `.lede`,
   `.btn`, <Roll>, <Icon> (the brand mark and the footer's social glyphs),
   and the type scale's tokens. Nothing here sets its own font size.

   NO ENTRANCE MOTION, deliberately. These are reading pages: the text is
   there on first paint, with no `data-motion` gate to wait on. The only
   movement is the site's standard hover (the label roll on buttons, a colour
   change on card titles); the covers do not move.

   THE COVER. A post without a `cover` image gets BlogCover's branded
   placeholder: the Phorcast mark on a hairline grid. Adding
   `cover` to a post in content/blog.ts replaces it, in the card and on the
   post page, with no change here. */

import { useEffect, useState } from 'react';
import { Nav } from '../Nav';
import { LiveDot } from '../LiveDot';
import { Icon } from '../Icon';
import { Roll } from '../Roll';
import { BLOG, blogPost } from '../../lib/router';
import {
  CATEGORIES, formatDate, posts, readMinutes, relatedPosts, sectionId,
} from '../../content/blog';
import type { Category, Post } from '../../content/blog';
import mark from '../../assets/brand/mark.svg';
import xGlyph from '../../assets/footer/social/x.svg';
import telegramGlyph from '../../assets/footer/social/telegram.svg';
import './Blog.css';

const SITE_TITLE = 'Phorcast';

/** Sets the tab title while the page is showing, and puts the old one back after. */
function useDocumentTitle(title: string) {
  useEffect(() => {
    const before = document.title;
    document.title = title;
    return () => { document.title = before; };
  }, [title]);
}

/** The nav, in the same wide column and at the same offset as on the other pages. */
function BlogTop() {
  return (
    <header className="blog-top" id="top">
      <div className="container container--wide">
        <Nav />
      </div>
    </header>
  );
}

/** The post's image, or the branded placeholder when it has none. Decorative:
 *  the title next to it already says what the post is. */
function BlogCover({ post, className = '' }: { post: Post; className?: string }) {
  return (
    <div className={`blog-cover ${className}`}>
      {post.cover ? (
        <img className="blog-cover__img" src={post.cover} alt="" loading="lazy" decoding="async" />
      ) : (
        <div className="blog-cover__art" aria-hidden="true">
          <Icon src={mark} w={34} h={40} className="blog-cover__mark" style={{ width: undefined, height: undefined }} />
        </div>
      )}
    </div>
  );
}

/** "Learn · 2 min read". */
function Meta({ post }: { post: Post }) {
  return (
    <p className="blog-meta">
      <span>{post.category}</span>
      <span aria-hidden="true">·</span>
      <span>{readMinutes(post)} min read</span>
    </p>
  );
}

/** One post in a grid. The whole card is the link. */
function BlogCard({ post }: { post: Post }) {
  return (
    <li className="blog-card-wrap">
      <a className="blog-card" href={blogPost(post.slug)}>
        <BlogCover post={post} className="blog-card__cover" />
        <div className="blog-card__text">
          <Meta post={post} />
          <h3 className="blog-card__title">{post.title}</h3>
          <p className="blog-card__excerpt">{post.excerpt}</p>
          <time className="blog-card__date" dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </a>
    </li>
  );
}

function BlogGrid({ items }: { items: readonly Post[] }) {
  return (
    <ul className="blog-grid">
      {items.map((p) => <BlogCard key={p.slug} post={p} />)}
    </ul>
  );
}

/* ── /blog ─────────────────────────────────────────────────────────────────── */

type Filter = 'All' | Category;
const FILTERS: Filter[] = ['All', ...CATEGORIES];

export function BlogIndex() {
  useDocumentTitle(`Blog | ${SITE_TITLE}`);
  const [filter, setFilter] = useState<Filter>('All');
  const shown = filter === 'All' ? posts : posts.filter((p) => p.category === filter);

  return (
    <main className="blog-page">
      <BlogTop />
      <div className="container blog-col">
        <section className="blog-head" aria-labelledby="blog-title">
          <span className="eyebrow"><LiveDot />Blog</span>
          <h1 id="blog-title" className="display blog-head__title">Insights, guides and updates</h1>
          {/* TODO(client): placeholder lede. */}
          <p className="lede blog-head__lede">
            News from Phorcast, plain explanations of how prediction markets work, and a regular look at the markets people are watching.
          </p>
        </section>

        <section className="blog-list" aria-labelledby="blog-list-title">
          <h2 id="blog-list-title" className="blog-list__title">Categories</h2>
          {/* Toggle buttons, not tabs: the list below is one region whose
              contents change, so `aria-pressed` says which filter is on. */}
          <div className="blog-filters" role="group" aria-label="Filter posts by category">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className="blog-filter"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {shown.length > 0 ? (
            <BlogGrid items={shown} />
          ) : (
            <p className="blog-empty">No posts in this category yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

/* ── /blog/<slug> ─────────────────────────────────────────────────────────── */

/** X, Telegram and copy link. The share URLs are built from the live address,
 *  so they are right on any deployment. */
function Share({ post }: { post: Post }) {
  const [copied, setCopied] = useState(false);
  const url = typeof location === 'undefined' ? '' : location.origin + blogPost(post.slug);
  const text = encodeURIComponent(post.title);
  const link = encodeURIComponent(url);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // No clipboard (an insecure origin, or permission refused): leave the
      // label as it was rather than claim a copy that did not happen.
    }
  };

  return (
    <div className="blog-share">
      <span className="blog-share__label">Share</span>
      <a
        className="blog-share__btn"
        href={`https://x.com/intent/post?text=${text}&url=${link}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
      >
        <Icon src={xGlyph} w={18} h={18} />
      </a>
      <a
        className="blog-share__btn"
        href={`https://t.me/share/url?url=${link}&text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Telegram"
      >
        <Icon src={telegramGlyph} w={18} h={18} />
      </a>
      <button type="button" className="blog-share__copy" onClick={copy}>
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      {/* Announces the copy to screen readers; the button's own label change
          is not reliably read out. */}
      <span className="blog-sr" role="status">{copied ? 'Link copied' : ''}</span>
    </div>
  );
}

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav className="blog-crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href={BLOG}>Blog</a></li>
        <li><span aria-current="page">{current}</span></li>
      </ol>
    </nav>
  );
}

function NotFound() {
  useDocumentTitle(`Post not found | ${SITE_TITLE}`);
  return (
    <main className="blog-page">
      <BlogTop />
      <div className="container blog-col">
        <section className="blog-head blog-head--missing">
          <Breadcrumb current="Not found" />
          <h1 className="display blog-head__title">Post not found</h1>
          <p className="lede blog-head__lede">This article may have moved or been taken down.</p>
          <a className="btn btn--primary" href={BLOG}><Roll>Back to the blog</Roll></a>
        </section>
      </div>
    </main>
  );
}

export function BlogPost({ post }: { post: Post | undefined }) {
  if (!post) return <NotFound />;
  return <Article post={post} />;
}

function Article({ post }: { post: Post }) {
  useDocumentTitle(`${post.title} | ${SITE_TITLE}`);
  const sections = post.body.flatMap((b) => (b.type === 'h2' ? [b.text] : []));
  const related = relatedPosts(post);

  return (
    <main className="blog-page">
      <BlogTop />
      <div className="container blog-col">
        <article className="blog-post" aria-labelledby="post-title">
          <header className="blog-post__head">
            <Breadcrumb current={post.title} />
            <span className="eyebrow"><LiveDot />{post.category}</span>
            <h1 id="post-title" className="display blog-post__title">{post.title}</h1>
            <p className="lede blog-post__lede">{post.excerpt}</p>
            <p className="blog-post__byline">
              <span>By {post.author}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{readMinutes(post)} min read</span>
            </p>
          </header>

          <BlogCover post={post} className="blog-post__cover" />

          <div className="blog-post__layout">
            {sections.length > 1 && (
              <nav className="blog-toc" aria-labelledby="toc-title">
                <h2 id="toc-title" className="blog-toc__title">On this page</h2>
                <ol className="blog-toc__list">
                  {sections.map((s) => (
                    <li key={s}><a href={`#${sectionId(s)}`}>{s}</a></li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="blog-prose">
              {post.body.map((b, i) => {
                if (b.type === 'h2') return <h2 key={i} id={sectionId(b.text)}>{b.text}</h2>;
                if (b.type === 'ul') return <ul key={i}>{b.items.map((it) => <li key={it}>{it}</li>)}</ul>;
                return <p key={i}>{b.text}</p>;
              })}
              <Share post={post} />
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="blog-more" aria-labelledby="blog-more-title">
            <div className="blog-more__head">
              <h2 id="blog-more-title" className="blog-more__title">More articles</h2>
              <a className="btn btn--outline blog-more__all" href={BLOG}><Roll>All articles</Roll></a>
            </div>
            <BlogGrid items={related} />
          </section>
        )}
      </div>
    </main>
  );
}
