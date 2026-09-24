/* Where the landing page's calls to action go, in one place.
   ---------------------------------------------------------------------------
   Every button and arrow link inside a landing band reads its target from
   here, so pointing one at a real page is one edit, in this file.

   Only four ids exist on the landing page: #why (the bento), #how (the steps),
   #built and #faq. A CTA whose page does not exist yet is '' -- TODO(client)
   -- and renders through the sitemap's own placeholder behaviour (`linkProps`
   in lib/sitemap.ts): a real, focusable link with its label whose click and
   middle click are cancelled, so it neither reloads the page nor jumps to the
   top. The bands used to point these at #signup, #markets and #bonus, which
   are not ids on this page and landed nowhere. */
import { linkProps } from './sitemap';

/** TODO(client): every `''` below is a page still to come. */
const CTA = {
  /** Hero slide 1, "Explore Markets". */
  heroMarkets: '',
  /** Hero slide 2, "Explore Sports Markets". */
  heroSports: '',
  /** Hero slide 3, "Claim Your Bonus". */
  heroBonus: '',
  /** Hero slide 4, "Explore the Token". */
  heroToken: '',
  /** Bento card 1, "Start Forecasting". */
  bentoStart: '',
  /** Bento card 2, "Claim Your Bonus". */
  bentoBonus: '',
  /** Bento card 3, "See How It Works": the steps band. */
  bentoHow: '#how',
  /** Bento card 4, "Explore Markets". */
  bentoMarkets: '',
  /** Familiar band button, "Explore Markets". */
  familiarMarkets: '',
  /** Built left column, "Find Your First Market". */
  builtFirstMarket: '',
  /** Built right column, "Explore Financial Markets". */
  builtFinancial: '',
} as const;

export type CtaKey = keyof typeof CTA;

/** The props a landing CTA spreads. Every CTA lives on the landing page, so
 *  its fragments resolve against '/'. */
export const ctaProps = (key: CtaKey) => linkProps(CTA[key], '/');
