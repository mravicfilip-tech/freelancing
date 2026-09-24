import { EDUCATION_CENTRE_URL } from '../site/navigation';

export type GlossaryTerm = {
  /** Anchor id, also used in the URL hash (`/glossary#fx-spread`). */
  id: string;
  term: string;
  definition: string;
  /** Optional deeper read in the Education Centre. */
  guide?: { label: string; href: string };
};

/** Alphabetical. The A–Z bar and the letter sections are derived from this list. */
export const TERMS: GlossaryTerm[] = [
  {
    id: 'blockchain',
    term: 'Blockchain',
    definition:
      'A distributed digital ledger that records transactions across multiple participants. Blockchain technology can enable transparent and secure transfer of digital assets without relying on a single central system.',
    guide: { label: 'Explore Blockchain Guides', href: `${EDUCATION_CENTRE_URL}/blockchain` },
  },
  {
    id: 'cross-border-payment',
    term: 'Cross-Border Payment',
    definition:
      'A financial transaction where the sender and recipient are located in different countries. Cross-border payments often involve currency conversion, payment networks and multiple financial institutions.',
  },
  {
    id: 'cryptocurrency',
    term: 'Cryptocurrency',
    definition:
      'A digital asset secured using cryptographic technology and typically transferred through blockchain networks.',
  },
  {
    id: 'digital-wallet',
    term: 'Digital Wallet',
    definition:
      'A digital application or service used to store payment credentials or digital assets and initiate transactions.',
    guide: { label: 'Crypto Wallets Explained Simply', href: `${EDUCATION_CENTRE_URL}/crypto-wallets-explained-simply` },
  },
  {
    id: 'exchange-rate',
    term: 'Exchange Rate',
    definition:
      'The value of one currency expressed in terms of another currency. Exchange rates determine how much of one currency is received when another is converted.',
    guide: { label: 'Understanding Exchange Rates', href: `${EDUCATION_CENTRE_URL}/understanding-exchange-rates` },
  },
  {
    id: 'fiat-currency',
    term: 'Fiat Currency',
    definition:
      'Government-issued currency such as the US dollar, euro or British pound that is recognized as legal tender.',
  },
  {
    id: 'fx-spread',
    term: 'FX Spread',
    definition:
      'The difference between the market exchange rate and the rate offered to a customer during a currency conversion. The spread can represent part of the effective cost of an international transfer.',
  },
  {
    id: 'liquidity',
    term: 'Liquidity',
    definition:
      'The ability to buy, sell or convert an asset efficiently without causing a significant change in its market price.',
  },
  {
    id: 'off-ramp',
    term: 'Off-Ramp',
    definition:
      'A service or process that converts digital assets or cryptocurrency into traditional fiat currency.',
  },
  {
    id: 'on-ramp',
    term: 'On-Ramp',
    definition:
      'A service that allows users to convert traditional fiat currency into cryptocurrency or other digital assets.',
  },
  {
    id: 'payfi',
    term: 'PayFi',
    definition:
      'A category of financial infrastructure that combines blockchain technology with real-world payment use cases, enabling digital assets to interact more directly with everyday financial systems.',
    guide: { label: 'What Is PayFi and Why Does It Matter?', href: `${EDUCATION_CENTRE_URL}/what-is-payfi` },
  },
  {
    id: 'remittance',
    term: 'Remittance',
    definition:
      'A transfer of money from one person or entity to another, often across international borders. Remittances are commonly used to send money to family members, pay international obligations or move funds between countries.',
    guide: {
      label: 'A Beginner’s Guide to International Remittances',
      href: `${EDUCATION_CENTRE_URL}/international-remittances-beginners-guide`,
    },
  },
  {
    id: 'settlement',
    term: 'Settlement',
    definition:
      'The final stage of a financial transaction when funds are successfully transferred and ownership of the payment is completed between participating institutions or users.',
  },
  {
    id: 'stablecoin',
    term: 'Stablecoin',
    definition:
      'A type of digital asset designed to maintain a relatively stable value by referencing another asset, commonly a fiat currency such as the US dollar.',
  },
  {
    id: 'web3',
    term: 'Web3',
    definition:
      'A broad term describing internet technologies and applications built around blockchain networks, digital ownership and decentralized infrastructure.',
  },
];

/** Sidebar order, by term id. */
export const POPULAR_TERM_IDS = [
  'remittance',
  'exchange-rate',
  'fx-spread',
  'blockchain',
  'payfi',
  'digital-wallet',
  'stablecoin',
  'settlement',
  'liquidity',
  'on-ramp',
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const initialOf = (t: GlossaryTerm) => t.term.charAt(0).toUpperCase();
