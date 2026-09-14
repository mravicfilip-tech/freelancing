/**
 * Presale figures for the dashboard. One module so a real API can replace the
 * constants without touching a component.
 */

const STAGE_PRICE = 0.18;
/** What the last stage of the presale costs — the right-hand end of the ladder. */
const FINAL_PRICE = 0.35;
const RTX_LEFT = 18_376_032;

export const PRESALE = {
  stage: 12,
  price: STAGE_PRICE,
  nextPrice: 0.19,
  /** What a token costs once it lists, which is what a holding is worth. */
  listPrice: 0.25,
  /** Share of the current stage already sold. */
  progress: 0.765,
  rtxLeft: RTX_LEFT,
  /** Derived, so the two figures cannot drift apart. */
  usdLeft: Math.round(RTX_LEFT * STAGE_PRICE),
} as const;

/**
 * Stages either side of the live one, for the price ladder.
 *
 * Behind the live stage the price has climbed a cent at a time, which is what
 * buyers have actually paid. Ahead of it the climb steepens to land on the
 * final stage's $0.35 — a presale gets dearer the later you come to it, and a
 * flat cent all the way would take far more stages than the ladder can draw.
 * The steps grow by a fixed amount each time, starting at the same cent that
 * takes stage 12 to `nextPrice`, so the badge above the ladder and the first
 * step ahead of the live bar cannot disagree.
 */
const AHEAD = 6;
/** First step ahead is a cent; the rest grow so the last one lands on FINAL. */
const GROWTH = (2 * (FINAL_PRICE - STAGE_PRICE - AHEAD * 0.01)) / (AHEAD * (AHEAD - 1));

function stagePrice(n: number): number {
  const steps = n - PRESALE.stage;
  if (steps <= 0) return Number((STAGE_PRICE + steps * 0.01).toFixed(2));
  const climbed = steps * 0.01 + ((steps - 1) * steps * GROWTH) / 2;
  return Number((STAGE_PRICE + climbed).toFixed(2));
}

export const STAGE_LADDER = Array.from({ length: 12 }, (_, i) => {
  const n = PRESALE.stage - 5 + i;
  return {
    n,
    price: stagePrice(n),
    state: n < PRESALE.stage ? ('done' as const) : n === PRESALE.stage ? ('live' as const) : ('next' as const),
  };
});

/** The wallet the presale allocation is tied to — every figure below is its. */
export const WALLET = {
  address: '0x4f2a9b7c1d8e3fa6052c9147bd3e88a1c7f0d6b2',
  short: '0x4f2a…d6b2',
  chain: 'Ethereum',
} as const;

const BALANCE = 47_382.94;

export const HOLDINGS = {
  balance: BALANCE,
  /** Four buys across stages 9 to 12. */
  purchases: 4,
  worthAtTge: Number((BALANCE * PRESALE.listPrice).toFixed(2)),
} as const;

export const REFERRALS = {
  /** Paid in USDT at 15% of what each friend spends. */
  earnings: 1_284.5,
  claimed: 900,
  invited: 9,
  share: 0.15,
  link: 'https://remittix.io/join/0h2e31',
} as const;

export type Referral = { wallet: string; usd: number; cut: number; hoursAgo: number };

/** What the card's "View all" implies exists. */
export const REFERRAL_ROWS: Referral[] = [
  { wallet: '0x7a41…3f2b', usd: 250, cut: 37.5, hoursAgo: 2 },
  { wallet: '0xc0de…91a4', usd: 1000, cut: 150, hoursAgo: 9 },
  { wallet: '0x5f8b…d773', usd: 120, cut: 18, hoursAgo: 26 },
];

export const FLASH_SALE = {
  /** A fraction, not a percentage: the calculator multiplies by it directly. */
  bonus: 0.045,
  code: 'LAUNCH45',
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
  { id: 94190, method: 'USDC', rtx: 2777.78, usd: 500, minutesAgo: 53 },
  { id: 94189, method: 'CARD', rtx: 666.67, usd: 120, minutesAgo: 67 },
  { id: 94188, method: 'BNB', rtx: 4111.11, usd: 740, minutesAgo: 78 },
  { id: 94187, method: 'USDT', rtx: 8333.33, usd: 1500, minutesAgo: 94 },
];

// ---------- Formatting ----------

export const money = (n: number, digits = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const whole = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export const usd = (n: number) => '$' + whole(n);
