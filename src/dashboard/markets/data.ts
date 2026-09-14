import { HOLDINGS, PRESALE, stagePrice, type TokenId } from '../data';

/**
 * The wallet's own purchase history. The dashboard says the wallet holds
 * 47,382.94 $RTX across 23 purchases; these are those 23, newest first, with
 * the last one sized so the amounts add up to the balance exactly.
 */
export type Tx = {
  id: number;
  method: TokenId | 'CARD';
  rtx: number;
  /** The stage the purchase cleared in, which fixes the price paid. */
  stage: number;
  hoursAgo: number;
};

export type TxRow = Tx & {
  price: number;
  /** What was paid, in dollars. */
  usd: number;
  /** What the same tokens are worth at the listing price. */
  worth: number;
};

const D = 24;

const raw: [number, Tx['method'], number, number, number][] = [
  [94102, 'ETH', 1388.89, 12, 2],
  [94077, 'CARD', 555.56, 12, 9],
  [94010, 'USDT', 2777.78, 12, 26],
  [93942, 'BTC', 8333.33, 12, 2 * D],
  [93871, 'ETH', 1111.11, 12, 4 * D],
  [93790, 'SOL', 3888.89, 12, 6 * D],
  [93411, 'USDC', 2941.18, 11, 9 * D],
  [93380, 'CARD', 588.24, 11, 10 * D],
  [93266, 'ETH', 1764.71, 11, 12 * D],
  [93140, 'USDT', 5882.35, 11, 15 * D],
  [93055, 'BNB', 1176.47, 11, 17 * D],
  [92701, 'ETH', 1250, 10, 20 * D],
  [92644, 'CARD', 625, 10, 22 * D],
  [92530, 'BTC', 3125, 10, 25 * D],
  [92402, 'USDT', 1875, 10, 28 * D],
  [91980, 'ETH', 2000, 9, 33 * D],
  [91877, 'SOL', 1333.33, 9, 36 * D],
  [91740, 'CARD', 666.67, 9, 39 * D],
  [91302, 'USDT', 2142.86, 8, 45 * D],
  [91188, 'ETH', 1428.57, 8, 48 * D],
  [90640, 'BTC', 1538.46, 7, 55 * D],
  [90511, 'USDC', 769.23, 7, 58 * D],
  [90402, 'ETH', 0, 7, 61 * D],
];
const listed = raw.reduce((s, r) => s + r[2], 0);
raw[raw.length - 1][2] = Number((HOLDINGS.balance - listed).toFixed(2));

export const TRANSACTIONS: TxRow[] = raw.map(([id, method, rtx, stage, hoursAgo]) => {
  const price = stagePrice(stage);
  return {
    id,
    method,
    rtx,
    stage,
    hoursAgo,
    price,
    usd: Number((rtx * price).toFixed(2)),
    worth: Number((rtx * PRESALE.listPrice).toFixed(2)),
  };
});

export const PAGE_SIZE = 8;

/** The three figures over the table, all derived from the rows. */
export function summarise(rows: TxRow[]) {
  const spent = rows.reduce((s, r) => s + r.usd, 0);
  const rtx = rows.reduce((s, r) => s + r.rtx, 0);
  const stages = rows.map((r) => r.stage);
  return {
    count: rows.length,
    spent,
    rtx,
    avgPrice: rtx ? spent / rtx : 0,
    firstStage: stages.length ? Math.min(...stages) : 0,
    lastStage: stages.length ? Math.max(...stages) : 0,
  };
}

/** "2h ago", "3d ago": the same shape the live feed uses for minutes. */
export const ago = (hours: number) => (hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`);
