/**
 * Roadmap copy. Sourced from public Remittix coverage of the six-level roadmap
 * (wallet on iOS, PayFi live, listing unlocked by the raise, then market prep).
 * Every string here is a placeholder until the client confirms the wording and
 * the raise figures — the layouts do not depend on the numbers.
 */

export type LevelStatus = 'done' | 'live' | 'next';

export type Level = {
  /** `01`–`06`, shown as the column and card number. */
  n: string;
  /** One word, the way the hero speaks: short, no colon, no gerund. */
  name: string;
  /** The gate that opens the level — raise, date or product. */
  marker: string;
  /** One sentence, under 140 characters, for the layouts that show prose. */
  blurb: string;
  /** Milestones, three to five, each under 34 characters so a pill never wraps. */
  items: string[];
  status: LevelStatus;
};

export const LEVELS: Level[] = [
  {
    n: '01',
    name: 'Foundation',
    marker: 'Complete',
    blurb: 'The contract, the team and the presale, put in place before a line of product was written.',
    items: ['Smart contract deployed', 'Presale opens', 'Audit published', 'First market campaign'],
    status: 'done',
  },
  {
    n: '02',
    name: 'Visibility',
    marker: 'Complete',
    blurb: 'Listed where holders look, and the first build of the wallet put in front of testers.',
    items: ['CoinMarketCap listing', 'CoinGecko listing', 'Partner campaigns', 'Beta wallet release'],
    status: 'done',
  },
  {
    n: '03',
    name: 'Wallet',
    marker: 'Live on iOS',
    blurb: 'The Remittix Wallet shipped to the App Store and passed a hundred thousand downloads.',
    items: ['iOS wallet on the App Store', '100k downloads', 'Testnet deployment', 'Android build'],
    status: 'done',
  },
  {
    n: '04',
    name: 'Settlement',
    marker: 'PayFi live',
    blurb: 'Crypto in, local currency out: real transfers landing in real bank accounts, in beta.',
    items: ['PayFi platform live', 'Crypto-to-fiat settled', '30+ countries covered', 'Beta volume cleared'],
    status: 'done',
  },
  {
    n: '05',
    name: 'Listing',
    marker: 'In progress',
    blurb: 'The presale closes, the exchange partners are named, and the listing date is set.',
    items: ['Presale closes', 'CEX partners named', 'Listing date revealed', 'Airdrop registration'],
    status: 'live',
  },
  {
    n: '06',
    name: 'Market',
    marker: 'Next',
    blurb: 'One token across payments, markets and earn, with the wallet wired into all three.',
    items: ['RTX utility published', 'Wallet integrations', 'Global campaign', 'Trading opens'],
    status: 'next',
  },
];

/** Raise gates, for the meter under direction 5. Confirm the figures with the client. */
export const GATES = [
  { at: 17, label: 'Wallet beta' },
  { at: 24, label: 'PayFi live' },
  { at: 30, label: 'CEX reveal' },
  { at: 32, label: 'Listing date' },
] as const;

export const RAISED = 31.2;
export const TARGET = 32;

export const STATUS_LABEL: Record<LevelStatus, string> = {
  done: 'Shipped',
  live: 'Current stage',
  next: 'Ahead',
};
