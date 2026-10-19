import { CASH_METHODS, cashFee, coinById, type CashMethodId, type CoinId } from '../../../data/wallet';

// The quick deposit methods and the quote behind You pay, You get and the commission. Cash methods
// take their fee from cashFee in data/wallet.ts, out of the amount, as the wallet does. Coins carry no deposit fee here, so You pay is the
// amount converted at the coin's rate. Amounts are in USD, which credits 1 to 1 as USDT.

export type QuickMethod =
  | { key: string; tag: string; name: string; kind: 'cash'; methodId: CashMethodId }
  | { key: string; tag: string; name: string; kind: 'coin'; coinId: CoinId; networkId: string };

export const QUICK_METHODS: QuickMethod[] = [
  { key: 'visa', tag: 'Card', name: 'Visa', kind: 'cash', methodId: 'visa' },
  { key: 'mastercard', tag: 'Card', name: 'Mastercard', kind: 'cash', methodId: 'mastercard' },
  { key: 'paypal', tag: 'Online', name: 'PayPal', kind: 'cash', methodId: 'paypal' },
  { key: 'usdt', tag: 'TRC20', name: 'Tether', kind: 'coin', coinId: 'usdt', networkId: 'trc20' },
  { key: 'btc', tag: 'BTC', name: 'Bitcoin', kind: 'coin', coinId: 'btc', networkId: 'btc' },
  { key: 'eth', tag: 'ERC20', name: 'Ethereum', kind: 'coin', coinId: 'eth', networkId: 'erc20' },
];

export const PRESETS = [15, 25, 50];

export type Quote = {
  /** What leaves the player's card or wallet, in the method's own unit. */
  pay: number;
  payUnit: string;
  payDigits: number;
  /** What lands on the balance, in USDT. */
  get: number;
  fee: number;
  feeLabel: string;
  min: number;
  max: number;
  /** A sentence when the amount cannot go through, or null. */
  problem: string | null;
};

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

export function quoteFor(m: QuickMethod, amount: number): Quote {
  if (m.kind === 'cash') {
    const cash = CASH_METHODS.find((c) => c.id === m.methodId)!;
    const fee = amount > 0 ? cashFee(cash, amount) : 0;
    const feeLabel = cash.flatFee ? `Commission (${cash.flatFee} USD flat)` : `Commission (${cash.feePct.toFixed(2)}%)`;
    let problem: string | null = null;
    if (!(amount > 0)) problem = 'Type an amount, or pick one of the presets.';
    else if (amount < cash.min) problem = `${cash.name} takes ${cash.min} USD or more.`;
    else if (amount > cash.max) problem = `${cash.name} takes up to ${cash.max.toLocaleString('en-US')} USD at a time.`;
    // The wallet takes the fee out of the amount, so the same deposit reads the same in both places.
    return { pay: round(amount, 2), payUnit: 'USD', payDigits: 2, get: round(Math.max(0, amount - fee), 2), fee, feeLabel, min: cash.min, max: cash.max, problem };
  }
  const coin = coinById(m.coinId);
  const min = Math.ceil(coin.minDeposit * coin.rate * 100) / 100;
  const digits = coin.rate >= 1000 ? 6 : coin.rate > 1 ? 4 : 2;
  let problem: string | null = null;
  if (!(amount > 0)) problem = 'Type an amount, or pick one of the presets.';
  else if (amount < min) problem = `${coin.symbol} deposits start at ${coin.minDeposit} ${coin.symbol}, about ${min.toFixed(2)} USD.`;
  return { pay: round(amount / coin.rate, digits), payUnit: coin.symbol, payDigits: digits, get: amount, fee: 0, feeLabel: 'Commission, none on coins', min, max: Infinity, problem };
}

/** The deposit route in the wallet's own deep link form, so it opens on the same method. A card or
 * PayPal opens on the review step with the amount, a coin opens on its deposit address. */
export function checkoutUrl(m: QuickMethod, amount: number, promo: string) {
  const q = new URLSearchParams();
  if (m.kind === 'cash') {
    q.set('pick', m.methodId);
    q.set('amount', String(amount));
    q.set('step', 'review');
  } else {
    q.set('pick', m.coinId);
    q.set('network', m.networkId);
    q.set('step', 'send');
  }
  if (promo) q.set('promo', promo);
  return `/wallet/deposit?${q.toString()}`;
}
