/**
 * Presale figures for the dashboard. One module so a real API can replace the
 * constants without touching a component.
 */

export const PRESALE = {
  stage: 12,
  price: 0.18,
  nextPrice: 0.19,
  /** Share of the current stage already sold. */
  progress: 0.765,
  usdLeft: 4_859_041,
  rtxLeft: 18_376_032,
} as const;

export const HOLDINGS = {
  balance: 0,
  worthAtTge: 0,
  referralEarnings: 0,
  commission: 0.05,
} as const;

export const LEVEL = {
  current: 4,
  next: 5,
  /** Progress from the current rank toward the next. */
  progress: 0.12,
} as const;

export const REFERRALS = {
  earnings: 124.53,
  claimed: 383.65,
  share: 0.15,
  link: 'https://remittix.io/join/0h2e31',
} as const;

export const FLASH_SALE = {
  bonus: 4.5,
  code: 'LAUNCH450',
  /** Seconds left when the page loads: 23h 11m 29s of the 72-hour window. */
  secondsLeft: 23 * 3600 + 11 * 60 + 29,
} as const;

export type TokenId = 'USDT' | 'ETH' | 'BTC' | 'SOL' | 'USDC' | 'BNB';

/** Indicative USD rates, used by the calculator to price a contribution. */
export const TOKENS: { id: TokenId; name: string; usd: number }[] = [
  { id: 'USDT', name: 'Tether', usd: 1 },
  { id: 'USDC', name: 'USD Coin', usd: 1 },
  { id: 'ETH', name: 'Ethereum', usd: 3_140 },
  { id: 'BTC', name: 'Bitcoin', usd: 96_400 },
  { id: 'SOL', name: 'Solana', usd: 182 },
  { id: 'BNB', name: 'BNB', usd: 634 },
];

export type Order = {
  id: number;
  method: TokenId | 'CARD';
  rtx: number;
  usd: number;
  minutesAgo: number;
};

export const LIVE_ORDERS: Order[] = [
  { id: 94196, method: 'ETH', rtx: 594.44, usd: 107, minutesAgo: 5 },
  { id: 94195, method: 'CARD', rtx: 277.78, usd: 50, minutesAgo: 12 },
  { id: 94194, method: 'BTC', rtx: 5594.44, usd: 1007, minutesAgo: 21 },
  { id: 94193, method: 'USDT', rtx: 1388.89, usd: 250, minutesAgo: 26 },
  { id: 94192, method: 'ETH', rtx: 472.22, usd: 85, minutesAgo: 34 },
  { id: 94191, method: 'SOL', rtx: 18888.89, usd: 3400, minutesAgo: 41 },
];

// ---------- Formatting ----------

export const money = (n: number, digits = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const whole = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export const usd = (n: number) => '$' + whole(n);
