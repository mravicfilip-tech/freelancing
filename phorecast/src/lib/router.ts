/* The site's routes, hand rolled.
   ---------------------------------------------------------------------------
   There is no router dependency and there is not going to be one: the whole
   job is "/", "/about", "/blog" and "/blog/<slug>", and the rules below fit in
   a file you can read in one sitting. What it is NOT is a general router -- no
   nesting, no loaders, and one parameter only (the blog slug, read by
   `blogSlug`). An unknown path renders the landing page, which is the only
   sensible 404 for a small marketing site; an unknown blog slug renders the
   blog's own "not found" state instead (components/blog).

   WHY CLIENT ROUTING AND NOT A MULTI-PAGE BUILD. `vercel.json` already
   rewrites `/(.*)` to `/index.html`. Under that rewrite a Vite MPA cannot
   work: /about would be served index.html whatever `rollupOptions.input`
   says. The rewrite stays as it is and the routing happens here.

   THE FOUR RULES

   1. SAME-ORIGIN LINKS ARE INTERCEPTED, so navigation is `history.pushState`
      and not a document load. Everything else -- external hosts, `download`,
      `target="_blank"`, `rel="external"`, anything a component already called
      preventDefault on -- is left alone.

   2. MODIFIED CLICKS ARE LEFT ALONE. A middle click, or a click with ctrl,
      meta, shift or alt held, is a request for a new tab or a new window, and
      swallowing it is the single most irritating thing a hand-rolled router
      does. `button !== 0` covers the middle click in the browsers that still
      deliver it as a `click`; the four modifier keys cover the rest.

   3. A HASH IS AIMED AT A SECTION. Two cases, and they are different:

      - SAME path (`#why` while already on "/"): not intercepted at all. The
        browser's own fragment navigation runs, which means `scroll-behavior:
        smooth` from global.css applies and the history entry is the browser's
        own. Nothing here can do that better.
      - DIFFERENT path ("/#why" from "/about"): the target does not exist yet,
        so the fragment is remembered and applied once the other page has
        rendered -- see `useRouter` below. `history.pushState` never honours a
        fragment by itself.

   4. SCROLL GOES TO THE TOP ON A ROUTE CHANGE, UNLESS THE URL CARRIES A HASH.
      And never on Back or Forward: the browser restores the scroll position
      for a popped entry, and fighting it loses the reader's place.

   ANCHORS THAT ONLY EXIST ON THE LANDING PAGE. `#why`, `#how`, `#built` and
   `#faq` are ids in the landing page's document. Written bare in the nav they
   would resolve against whatever page is showing -- from /about, `#why` is a
   fragment with no target and the click does nothing at all. `landing()`
   below is the one place that is fixed: it hands back the bare hash on "/",
   and "/" + hash anywhere else. */

import { useEffect, useSyncExternalStore } from 'react';

const HOME = '/';
export const ABOUT = '/about';
export const BLOG = '/blog';

/** The href of one blog post. */
export const blogPost = (slug: string) => `${BLOG}/${slug}`;

/** The slug in "/blog/<slug>", or null for any other path (including "/blog"). */
export function blogSlug(path: string): string | null {
  if (!path.startsWith(BLOG + '/')) return null;
  const slug = path.slice(BLOG.length + 1);
  return slug && !slug.includes('/') ? decodeURIComponent(slug) : null;
}

export interface Route {
  /** `location.pathname`, with any trailing slash removed (except for "/"). */
  path: string;
  /** The fragment this navigation asked for, including the `#`, or ''. */
  hash: string;
  /** How we arrived. `pop` is Back/Forward and owns its own scroll position. */
  kind: 'init' | 'push' | 'pop';
}

const clean = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p);

const read = (kind: Route['kind']): Route =>
  typeof location === 'undefined'
    ? { path: HOME, hash: '', kind }
    : { path: clean(location.pathname), hash: location.hash, kind };

/* One object, replaced only when something actually changed, so
   `useSyncExternalStore` sees a stable snapshot between navigations. */
let current: Route = read('init');

const subscribers = new Set<() => void>();

function publish(kind: Route['kind']) {
  const next = read(kind);
  if (next.path === current.path && next.hash === current.hash && next.kind === current.kind) return;
  current = next;
  for (const fn of subscribers) fn();
}

const subscribe = (fn: () => void) => {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
};

const snapshot = () => current;

/** Go to `to` the way a click on a link to it would. */
function navigate(to: string) {
  const url = new URL(to, location.href);
  if (url.origin !== location.origin) { location.href = to; return; }

  // Same page, different fragment: hand it to the browser, which does the
  // smooth scroll and the history entry better than this file can.
  if (clean(url.pathname) === clean(location.pathname) && url.hash) {
    location.hash = url.hash;
    return;
  }
  history.pushState(null, '', url.pathname + url.search + url.hash);
  publish('push');
}

/**
 * The href for a landing-page section, from wherever we happen to be.
 *
 * On "/" it is the bare hash, so rule 3's first case applies. Anywhere else
 * it is an absolute "/#…", which rule 3's second case turns into "render the
 * landing page, then go to that section".
 *
 * Both take the path rather than reading the module's own copy of it: a
 * component that calls these has to be subscribed through `useRoute()` for
 * React to re-render it when the route changes, and passing the value in is
 * what makes that impossible to forget.
 */
export const landing = (path: string, hash: string) => (path === HOME ? hash : HOME + hash);

/** The href for the site root, likewise: `#top` on "/", "/" anywhere else. */
export const home = (path: string) => (path === HOME ? '#top' : HOME);

function interceptable(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;

  const el = e.target instanceof Element ? e.target.closest('a[href]') : null;
  if (!(el instanceof HTMLAnchorElement)) return null;
  if (el.hasAttribute('download')) return null;
  if (el.target && el.target !== '_self') return null;
  if (el.rel.split(/\s+/).includes('external')) return null;

  const url = new URL(el.href, location.href);
  if (url.origin !== location.origin) return null;
  // Rule 3, first case: a fragment on the page we are already on belongs to
  // the browser. Returning null here is what keeps `scroll-behavior: smooth`
  // working for every in-page anchor on the site.
  if (clean(url.pathname) === clean(location.pathname)) return null;

  return url.pathname + url.search + url.hash;
}

/** The live route, for any component whose output depends on it. */
export const useRoute = (): Route => useSyncExternalStore(subscribe, snapshot, snapshot);

/**
 * Installs the two listeners, runs the scroll rule, and returns the live route.
 *
 * Mounted once, at the top of the tree. The listeners are attached in an
 * effect rather than at module scope so they are removed on unmount,
 * including StrictMode's development double-mount.
 */
export function useRouter(): Route {
  const route = useRoute();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const to = interceptable(e);
      if (to === null) return;
      e.preventDefault();
      navigate(to);
    };
    const onPop = () => publish('pop');
    document.addEventListener('click', onClick);
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  useEffect(() => {
    // Rule 4. `init` is a first load, where the browser has already done
    // whatever the URL asked for, and `pop` is Back/Forward, which restores
    // its own scroll position.
    if (route.kind !== 'push') return;
    if (route.hash) {
      // The other page has just rendered, so the target exists now. `auto`
      // rather than smooth: to the reader this is a jump between documents,
      // and smoothly sliding a whole new page past them is disorienting.
      document.getElementById(decodeURIComponent(route.hash.slice(1)))
        ?.scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }
    // 'instant', not the default: global.css sets `scroll-behavior: smooth`
    // on <html>, which a bare scrollTo(0, 0) inherits. The smooth version
    // slides the new page past the reader (the same reason as `auto` above)
    // and can be cut short while the new page lays out, leaving the reader
    // part way down it.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [route]);

  return route;
}
