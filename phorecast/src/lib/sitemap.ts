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

   THE ORDER. Each group opens with the client's own list, in the client's
   order: Product "Markets, Leaderboard, Trading Hours, FAQs"; Company "About,
   Partner Program, Blog, Brand Kit"; Legal "Terms of Service, Privacy Policy,
   Cookies, Contact". After those come the pages the site already linked to
   that the client's list did not name -- nothing is dropped:

     Product   Portfolio, Deposit, Withdraw        (the old footer's Product)
     Company   Why Phorcast, How it works,
               Infrastructure                      (the old MORE menu; real
                                                    landing-page sections)
     Legal     Risk Disclosure,
               Deposit & Withdrawal Policy         (the old footer's Legal)

   None of the old footer links was a page: every one was a slugged fragment
   (`#risk-disclosure`, ...) with no element to land on. So they are empty here
   exactly as the client's new ones are.

   "Contact" is the client's Legal item and is a placeholder like the rest.
   The "Contacts" link that stood under the footer's brand block is gone at the
   client's request, and there has never been a contact page or route.

   NOT HERE, deliberately: Home (the logo and the bar already carry it), Login
   and Sign Up (actions, in the bar and the sheet's dock), and the in-page
   calls to action (`#signup`, `#markets`, `#bonus`) that live inside bands. */
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
      { label: 'Portfolio', href: '' },
      { label: 'Deposit', href: '' },
      { label: 'Withdraw', href: '' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: ABOUT },
      { label: 'Partner Program', href: '' },
      { label: 'Blog', href: '' },
      { label: 'Brand Kit', href: '' },
      { label: 'Why Phorcast', href: '#why' },
      { label: 'How it works', href: '#how' },
      { label: 'Infrastructure', href: '#built' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '' },
      { label: 'Privacy Policy', href: '' },
      { label: 'Cookies', href: '' },
      { label: 'Contact', href: '' },
      { label: 'Risk Disclosure', href: '' },
      { label: 'Deposit & Withdrawal Policy', href: '' },
    ],
  },
];

/** The footer's four social icons, in the client's order. TODO(client):
 *  TikTok and Telegram are still to come. */
export const SOCIAL_URLS = {
  x: 'https://x.com/PhorcastHQ',
  tiktok: '',
  discord: 'https://discord.gg/phorcast',
  telegram: '',
};

/** One entry by label, for the few places that name a page outside a list. */
export const page = (label: string): SitemapLink => {
  for (const g of SITEMAP) for (const l of g.links) if (l.label === label) return l;
  throw new Error(`sitemap: no page called "${label}"`);
};

/** What the nav's MORE opens, on the desktop bar and in the phone sheet. The
 *  user's call: About only, for now. The full sitemap lives in the footer; add
 *  a page here by label when MORE should carry it too. */
export const MORE_MENU: SitemapLink[] = [page('About')];

export const isPlaceholder = (href: string) => href === '';

/** The href to render, from the page we are on. See the header. */
export const resolveHref = (href: string, path: string) =>
  href.startsWith('#') ? landing(path, href) : href;

/** `aria-current="page"` for a route we are on, and nothing for anything else. */
export const currentPage = (href: string, path: string) =>
  href.startsWith('/') && href === path ? ('page' as const) : undefined;

/** A placeholder's click (and middle click): cancelled, so nothing happens. */
export const stayPut = (e: { preventDefault(): void }) => e.preventDefault();

/** The three props every placeholder-aware link spreads. */
export const linkProps = (href: string, path: string) => ({
  href: resolveHref(href, path),
  'aria-current': currentPage(href, path),
  ...(isPlaceholder(href) ? { onClick: stayPut, onAuxClick: stayPut } : {}),
});
