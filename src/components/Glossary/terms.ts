/**
 * The glossary's content, copied from the Figma frame "Glossary" (node 2113:4). The page renders
 * this array and nothing else, so a term is added here, not in markup: the letter groups, the
 * alphabet bar's enabled letters and the search all follow from it.
 */

export type Guide = {
  /** The link's words, without the arrow — the page draws that. */
  label: string;
  /** The guide it opens. There is no Guides page on the site yet, so these are placeholders. */
  slug: string;
};

export type Term = {
  term: string;
  definition: string;
  guide?: Guide;
};

export const TERMS: Term[] = [
  {
    term: 'Blockchain',
    definition:
      'A distributed digital ledger that records transactions across multiple participants. Blockchain technology can enable transparent and secure transfer of digital assets without relying on a single central system.',
    guide: { label: 'Explore Blockchain Guides', slug: 'blockchain' },
  },
  {
    term: 'Cross-Border Payment',
    definition:
      'A financial transaction where the sender and recipient are located in different countries. Cross-border payments often involve currency conversion, payment networks and multiple financial institutions.',
  },
  {
    term: 'Cryptocurrency',
    definition:
      'A digital asset secured using cryptographic technology and typically transferred through blockchain networks.',
  },
  {
    term: 'Digital Wallet',
    definition:
      'A digital application or service used to store payment credentials or digital assets and initiate transactions.',
    guide: { label: 'Crypto Wallets Explained Simply', slug: 'crypto-wallets-explained-simply' },
  },
  {
    term: 'Exchange Rate',
    definition:
      'The value of one currency expressed in terms of another currency. Exchange rates determine how much of one currency is received when another is converted.',
    guide: { label: 'Understanding Exchange Rates', slug: 'understanding-exchange-rates' },
  },
  {
    term: 'Fiat Currency',
    definition:
      'Government-issued currency such as the US dollar, euro or British pound that is recognized as legal tender.',
  },
  {
    term: 'FX Spread',
    definition:
      'The difference between the market exchange rate and the rate offered to a customer during a currency conversion. The spread can represent part of the effective cost of an international transfer.',
  },
  {
    term: 'Liquidity',
    definition:
      'The ability to buy, sell or convert an asset efficiently without causing a significant change in its market price.',
  },
  {
    term: 'Off-Ramp',
    definition:
      'A service or process that converts digital assets or cryptocurrency into traditional fiat currency.',
  },
  {
    term: 'On-Ramp',
    definition:
      'A service that allows users to convert traditional fiat currency into cryptocurrency or other digital assets.',
  },
  {
    term: 'PayFi',
    definition:
      'A category of financial infrastructure that combines blockchain technology with real-world payment use cases, enabling digital assets to interact more directly with everyday financial systems.',
    guide: { label: 'What Is PayFi and Why Does It Matter?', slug: 'what-is-payfi' },
  },
  {
    term: 'Remittance',
    definition:
      'A transfer of money from one person or entity to another, often across international borders. Remittances are commonly used to send money to family members, pay international obligations or move funds between countries.',
    guide: { label: "A Beginner's Guide to International Remittances", slug: 'international-remittances' },
  },
  {
    term: 'Settlement',
    definition:
      'The final stage of a financial transaction when funds are successfully transferred and ownership of the payment is completed between participating institutions or users.',
  },
  {
    term: 'Stablecoin',
    definition:
      'A type of digital asset designed to maintain a relatively stable value by referencing another asset, commonly a fiat currency such as the US dollar.',
  },
  {
    term: 'Web3',
    definition:
      'A broad term describing internet technologies and applications built around blockchain networks, digital ownership and decentralized infrastructure.',
  },
];

/** The sidebar's list, in the design's order. Each name must match a `term` above. */
export const POPULAR = [
  'Remittance',
  'Exchange Rate',
  'FX Spread',
  'Blockchain',
  'PayFi',
  'Digital Wallet',
  'Stablecoin',
  'Settlement',
  'Liquidity',
  'On-Ramp',
];

/** Where the Guides live. The site has no Guides page yet; point this at it when it does. */
export const GUIDES_HREF = '/guides';

export const guideHref = (guide: Guide) => `${GUIDES_HREF}/${guide.slug}`;

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const letterOf = (t: Term) => t.term[0].toUpperCase();

/** A stable anchor per term, e.g. "Cross-Border Payment" → "term-cross-border-payment". */
export const termId = (name: string) => `term-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
