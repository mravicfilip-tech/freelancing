/**
 * Link targets shared by the landing nav and the Remittix site header/footer.
 * Paths mirror the live Remittix site; pages this repo doesn't build yet (Roadmap,
 * Whitepaper, the Education Centre articles, legal pages) resolve once they exist.
 */
export type NavLink = { label: string; href: string };

export const HOME_URL = '/';
export const PRESALE_URL = '/#presale';
export const EDUCATION_CENTRE_URL = '/education-centre';

/** The navbar's Education Centre dropdown. */
export const EDUCATION_CENTRE_MENU: NavLink[] = [{ label: 'Glossary', href: '/glossary' }];

export const PRIMARY_NAV: (NavLink & { emphasis?: boolean })[] = [
  { label: '$250k Giveaway', href: '/#giveaway', emphasis: true },
  { label: 'Tokenomics', href: '/#tokenomics' },
  { label: 'Roadmap', href: '/#roadmap' },
  { label: 'FAQs', href: '/#faqs' },
  { label: 'Whitepaper', href: '/whitepaper' },
];

export const FOOTER_NAV: NavLink[][] = [
  [
    { label: 'About', href: '/#about' },
    { label: 'Tokenomics', href: '/#tokenomics' },
    { label: 'How to buy?', href: '/#how-to-buy' },
  ],
  [
    { label: 'Roadmap', href: '/#roadmap' },
    { label: 'Ecosystem', href: '/#ecosystem' },
    { label: 'Whitepaper', href: '/whitepaper' },
  ],
];

export const LEGAL_NAV = {
  privacy: { label: 'Privacy Policy', href: '/privacy-policy' },
  terms: { label: 'Terms of Service', href: '/terms-of-service' },
};

export const CONTACT_EMAILS = ['support@remittix.com', 'marketing@remittix.com', 'investors@remittix.com'];

/**
 * Official profiles only. An empty href renders the icon without a link: fill these in
 * from the brand's verified accounts, never from search results (impersonator accounts
 * are common for presale tokens).
 */
export const SOCIAL_LINKS = {
  x: '',
  telegram: '',
  instagram: '',
};

/** True when `href` points at the page being viewed (ignores a trailing slash). */
export function isCurrentPage(href: string): boolean {
  const strip = (p: string) => p.replace(/\/+$/, '') || '/';
  return strip(href) === strip(window.location.pathname);
}
