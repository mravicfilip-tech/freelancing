/* The sitemap: every page the site names, in one place.
   ---------------------------------------------------------------------------
   The footer's link columns and the nav's MORE menu both render THIS list, on
   both surfaces, so they cannot disagree; the nav bar's Markets and
   Leaderboard read their hrefs from it too. Filling in a page when it exists
   is one edit, here.

   Three kinds of href:

     '/about'   a route (see lib/router.ts)
     '#faq'     a section of the LANDING page. `resolveHref` passes it through
                `landing()`, so from /about it becomes '/#faq' and loads the
                landing page first rather than firing a fragment at a document
                that has no such id (or, for #faq, at the About page's own FAQ).
     ''         TODO(client): a page that does not exist yet. It still renders
                as a real, focusable link with its name, so the markup is final
                and only the string changes; `stayPut` cancels the click, so it
                neither reloads the page (what an empty href means) nor jumps to
                the top (what `href="#"` does).

   THE ORDER is the design order: Product "Markets, Leaderboard, Trading
   Hours, FAQs"; Company "About, Partner Program, Blog, Brand Kit"; Legal
   "Terms of Service, Privacy Policy, Cookies, Contact". "Contact" is a
   placeholder like the rest; there is no contact page or route.

   NOT HERE, deliberately: Home (the logo already carries it), Login and Sign
   Up (actions, in the bar and the sheet's dock), and the landing page's
   in-band calls to action, which live in lib/cta.ts. */
import { ABOUT, landing } from './router';

export interface SitemapLink {
  label: string;
  /** A route, a landing-page '#section', or '' for TODO(client). */
  href: string;
}

export interface SitemapGroup {
  title: string;
  links: SitemapLink[];
}

/** TODO(client): every `href: ''` below is a page still to come. */
export const SITEMAP: SitemapGroup[] = [
  {
    title: 'Product',
    links: [
      { label: 'Markets', href: '' },
      { label: 'Leaderboard', href: '' },
      { label: 'Trading Hours', href: '' },
      { label: 'FAQs', href: '#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: ABOUT },
      { label: 'Partner Program', href: '' },
      { label: 'Blog', href: '' },
      { label: 'Brand Kit', href: '' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '' },
      { label: 'Privacy Policy', href: '' },
      { label: 'Cookies', href: '' },
      { label: 'Contact', href: '' },
    ],
  },
];

/** The footer's four social icons, in design order. */
export const SOCIAL_URLS = {
  x: 'https://x.com/PhorcastHQ',
  tiktok: 'https://www.tiktok.com/@phorcast',
  discord: 'https://discord.gg/phorcast',
  telegram: 'https://t.me/phorcast',
};

/** One entry by label, for the few places that name a page outside a list. */
export const page = (label: string): SitemapLink => {
  for (const g of SITEMAP) for (const l of g.links) if (l.label === label) return l;
  throw new Error(`sitemap: no page called "${label}"`);
};

/** What the nav's MORE opens, on the desktop bar and in the phone sheet.
 *  Design decision: About only, for now. The full sitemap lives in the footer;
 *  add a page here by label when MORE should carry it too. */
export const MORE_MENU: SitemapLink[] = [page('About')];

export const isPlaceholder = (href: string) => href === '';

/** The href to render, from the page we are on. See the header. */
const resolveHref = (href: string, path: string) =>
  href.startsWith('#') ? landing(path, href) : href;

/** `aria-current="page"` for a route we are on, and nothing for anything else. */
const currentPage = (href: string, path: string) =>
  href.startsWith('/') && href === path ? ('page' as const) : undefined;

/** A placeholder's click (and middle click): cancelled, so nothing happens. */
export const stayPut = (e: { preventDefault(): void }) => e.preventDefault();

/** The three props every placeholder-aware link spreads. */
export const linkProps = (href: string, path: string) => ({
  href: resolveHref(href, path),
  'aria-current': currentPage(href, path),
  ...(isPlaceholder(href) ? { onClick: stayPut, onAuxClick: stayPut } : {}),
});
