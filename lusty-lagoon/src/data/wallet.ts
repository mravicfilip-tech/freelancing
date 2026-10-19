// Wallet data for the prototype. Methods, arrival times and the coin list come from the Figma file
// (Wallet, Deposit and Withdraw frames). Fees, rates, limits and addresses are mock values in the
// shapes a real cashier API returns. The account currency is USDT, as in the Figma top bar.

import btc from 'cryptocurrency-icons/svg/color/btc.svg';
import eth from 'cryptocurrency-icons/svg/color/eth.svg';
import usdt from 'cryptocurrency-icons/svg/color/usdt.svg';
import usdc from 'cryptocurrency-icons/svg/color/usdc.svg';
import ltc from 'cryptocurrency-icons/svg/color/ltc.svg';
import xrp from 'cryptocurrency-icons/svg/color/xrp.svg';
import trx from 'cryptocurrency-icons/svg/color/trx.svg';
import doge from 'cryptocurrency-icons/svg/color/doge.svg';

export type CoinId = 'btc' | 'eth' | 'usdt' | 'usdc' | 'ltc' | 'xrp' | 'trx' | 'doge';
export type CashMethodId = 'mastercard' | 'visa' | 'paypal' | 'wire';
export type Direction = 'deposit' | 'withdraw';
export type TxStatus = 'pending' | 'completed' | 'declined';

export type AddressFormat = 'bitcoin' | 'evm' | 'tron' | 'litecoin' | 'xrp' | 'dogecoin';

export type Network = {
  id: string;
  name: string;
  short: string;
  format: AddressFormat;
  /** Network fee taken from a withdrawal, in the coin. */
  withdrawFee: number;
  confirmations: number;
  arrival: string;
  depositAddress: string;
};

export type Coin = {
  id: CoinId;
  symbol: string;
  name: string;
  icon: string;
  /** Price in USDT. */
  rate: number;
  decimals: number;
  minDeposit: number;
  minWithdraw: number;
  networks: Network[];
  /** XRP needs a destination tag on deposits, or the funds cannot be matched to the account. */
  memo?: { label: string; value: string };
};

export type CashMethod = {
  id: CashMethodId;
  name: string;
  kind: 'card' | 'wallet' | 'bank';
  depositArrives: string;
  withdrawArrives: string;
  feePct: number;
  flatFee: number;
  min: number;
  max: number;
};

export type Selection = { kind: 'coin'; coinId: CoinId } | { kind: 'cash'; methodId: CashMethodId };

export type Transaction = {
  id: string;
  direction: Direction;
  method: Selection;
  networkId?: string;
  /** Amount in the method's own currency, coin units for coins and USD for cash. */
  amount: number;
  /** The same amount in USDT, for sorting and totals. */
  value: number;
  status: TxStatus;
  date: string;
  /** On-chain hash for coins, a bank or processor reference for cash. */
  reference: string;
};

export const ACCOUNT = {
  name: 'John D.',
  initials: 'JD',
  currency: 'USDT',
  balance: 2492,
  rank: { name: 'Bronze', next: 'Silver', points: 550_000, nextAt: 650_000 },
  savedCard: { brand: 'visa' as CashMethodId, last4: '4821', expires: '08/28' },
  paypalEmail: 'john.d@gmail.com',
  depositBonusPct: 150,
};

export const COINS: Coin[] = [
  {
    id: 'btc', symbol: 'BTC', name: 'Bitcoin', icon: btc, rate: 98450, decimals: 8, minDeposit: 0.0001, minWithdraw: 0.0005,
    networks: [
      { id: 'btc', name: 'Bitcoin', short: 'BTC', format: 'bitcoin', withdrawFee: 0.00002, confirmations: 2, arrival: 'About 20 minutes', depositAddress: 'bc1qx8n4ztm9g7k2v6w3h0p5s4r8ld2fj7c9yq3e6m' },
    ],
  },
  {
    id: 'eth', symbol: 'ETH', name: 'Ethereum', icon: eth, rate: 3620, decimals: 6, minDeposit: 0.005, minWithdraw: 0.01,
    networks: [
      { id: 'erc20', name: 'Ethereum', short: 'ERC20', format: 'evm', withdrawFee: 0.0012, confirmations: 12, arrival: 'About 3 minutes', depositAddress: '0x7A3f9C2e41B8d05F6a1c93E4b2D7f80A5c6E1b94' },
    ],
  },
  {
    id: 'usdt', symbol: 'USDT', name: 'Tether', icon: usdt, rate: 1, decimals: 2, minDeposit: 10, minWithdraw: 20,
    networks: [
      { id: 'trc20', name: 'Tron', short: 'TRC20', format: 'tron', withdrawFee: 1, confirmations: 19, arrival: 'About 1 minute', depositAddress: 'TQm4h8Xz2Rk9Vn5bL7wC3pE6sJ1aG8dY2u' },
      { id: 'erc20', name: 'Ethereum', short: 'ERC20', format: 'evm', withdrawFee: 4.5, confirmations: 12, arrival: 'About 3 minutes', depositAddress: '0x7A3f9C2e41B8d05F6a1c93E4b2D7f80A5c6E1b94' },
      { id: 'bep20', name: 'BNB Smart Chain', short: 'BEP20', format: 'evm', withdrawFee: 0.8, confirmations: 15, arrival: 'About 1 minute', depositAddress: '0x2c9E51bD8a04F3e7C61d9B5a8f0E27D4c3A6b018' },
    ],
  },
  {
    id: 'usdc', symbol: 'USDC', name: 'USD Coin', icon: usdc, rate: 1, decimals: 2, minDeposit: 10, minWithdraw: 20,
    networks: [
      { id: 'erc20', name: 'Ethereum', short: 'ERC20', format: 'evm', withdrawFee: 4.5, confirmations: 12, arrival: 'About 3 minutes', depositAddress: '0x7A3f9C2e41B8d05F6a1c93E4b2D7f80A5c6E1b94' },
      { id: 'polygon', name: 'Polygon', short: 'POL', format: 'evm', withdrawFee: 0.2, confirmations: 128, arrival: 'About 5 minutes', depositAddress: '0x91dB4e7A2C08f53E6b1aD9c74F0e2B8A5d3C6f17' },
    ],
  },
  {
    id: 'ltc', symbol: 'LTC', name: 'Litecoin', icon: ltc, rate: 92.4, decimals: 6, minDeposit: 0.01, minWithdraw: 0.05,
    networks: [
      { id: 'ltc', name: 'Litecoin', short: 'LTC', format: 'litecoin', withdrawFee: 0.0005, confirmations: 6, arrival: 'About 15 minutes', depositAddress: 'ltc1q9w5r3k8m2x7v4n6h0j5s8d2f4g7c3a9z6e1y' },
    ],
  },
  {
    id: 'xrp', symbol: 'XRP', name: 'XRP', icon: xrp, rate: 2.31, decimals: 2, minDeposit: 10, minWithdraw: 20,
    networks: [
      { id: 'xrp', name: 'XRP Ledger', short: 'XRP', format: 'xrp', withdrawFee: 0.25, confirmations: 1, arrival: 'Under 1 minute', depositAddress: 'rLu5sSq9VnZ8x3R7mK2bHc4tW6pD1fJ9eY' },
    ],
    memo: { label: 'Destination tag', value: '48213907' },
  },
  {
    id: 'trx', symbol: 'TRX', name: 'Tron', icon: trx, rate: 0.27, decimals: 2, minDeposit: 50, minWithdraw: 100,
    networks: [
      { id: 'trx', name: 'Tron', short: 'TRX', format: 'tron', withdrawFee: 1, confirmations: 19, arrival: 'About 1 minute', depositAddress: 'TQm4h8Xz2Rk9Vn5bL7wC3pE6sJ1aG8dY2u' },
    ],
  },
  {
    id: 'doge', symbol: 'DOGE', name: 'Dogecoin', icon: doge, rate: 0.19, decimals: 2, minDeposit: 50, minWithdraw: 100,
    networks: [
      { id: 'doge', name: 'Dogecoin', short: 'DOGE', format: 'dogecoin', withdrawFee: 2, confirmations: 6, arrival: 'About 10 minutes', depositAddress: 'D8vQ3mZ7kR2xN5bW9cL4tH6pS1jF8gY3eA' },
    ],
  },
];

export const CASH_METHODS: CashMethod[] = [
  { id: 'mastercard', name: 'Mastercard', kind: 'card', depositArrives: 'Instantly', withdrawArrives: 'Within 24 hours', feePct: 2.5, flatFee: 0, min: 20, max: 5000 },
  { id: 'visa', name: 'Visa', kind: 'card', depositArrives: 'Instantly', withdrawArrives: 'Within 24 hours', feePct: 2.5, flatFee: 0, min: 20, max: 5000 },
  { id: 'paypal', name: 'PayPal', kind: 'wallet', depositArrives: 'Instantly', withdrawArrives: 'Within 1 day', feePct: 3, flatFee: 0, min: 10, max: 2000 },
  { id: 'wire', name: 'Wire transfer', kind: 'bank', depositArrives: '1 to 3 days', withdrawArrives: '1 to 3 days', feePct: 0, flatFee: 15, min: 100, max: 50000 },
];

export const WIRE_DETAILS = {
  beneficiary: 'Lusty Lagoon Payments Ltd',
  iban: 'MT84 MALT 0110 0001 2345 MTLC AST0 01S',
  bic: 'MALTMTMT',
  reference: 'LL-JD-48213907',
};

export const coinById = (id: CoinId) => COINS.find((c) => c.id === id)!;
export const cashById = (id: CashMethodId) => CASH_METHODS.find((m) => m.id === id)!;

const ADDRESS_PATTERNS: Record<AddressFormat, RegExp> = {
  bitcoin: /^(bc1[02-9ac-hj-np-z]{25,62}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/,
  evm: /^0x[a-fA-F0-9]{40}$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  litecoin: /^(ltc1[02-9ac-hj-np-z]{25,62}|[LM3][1-9A-HJ-NP-Za-km-z]{26,33})$/,
  xrp: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
  dogecoin: /^D[1-9A-HJ-NP-Za-km-z]{33}$/,
};

const FORMAT_NAMES: Record<AddressFormat, string> = {
  bitcoin: 'a Bitcoin',
  evm: 'an Ethereum style',
  tron: 'a Tron',
  litecoin: 'a Litecoin',
  xrp: 'an XRP',
  dogecoin: 'a Dogecoin',
};

/** Checks a pasted withdrawal address against the chosen network, and names the network it does match. */
export function checkAddress(address: string, network: Network): { ok: true } | { ok: false; message: string } {
  const value = address.trim();
  if (!value) return { ok: false, message: 'Paste the address you want the coins sent to.' };
  if (ADDRESS_PATTERNS[network.format].test(value)) return { ok: true };
  const other = (Object.keys(ADDRESS_PATTERNS) as AddressFormat[]).find((f) => ADDRESS_PATTERNS[f].test(value));
  if (other) {
    return {
      ok: false,
      message: `This is ${FORMAT_NAMES[other]} address, and this withdrawal goes out on ${network.name} (${network.short}). Pick the matching network or paste ${FORMAT_NAMES[network.format]} address.`,
    };
  }
  return { ok: false, message: `This is not ${FORMAT_NAMES[network.format]} address. Copy it again from your wallet, all of it.` };
}

export function cashFee(method: CashMethod, amount: number) {
  return Math.round((amount * method.feePct) / 100 * 100) / 100 + method.flatFee;
}

// History. A fixed list for the default view, and a long generated one for the large list state.

const BASE_HISTORY: Transaction[] = [
  { id: 'LL-48213907', direction: 'deposit', method: { kind: 'coin', coinId: 'usdt' }, networkId: 'trc20', amount: 500, value: 500, status: 'completed', date: '2026-10-19T09:41:00', reference: '7c1f9e0b42d85a6e3b917f04c2d8a5e61b30f7d94c2a8e5b6d1f03a9c7e4b28d' },
  { id: 'LL-48213851', direction: 'withdraw', method: { kind: 'cash', methodId: 'paypal' }, amount: 250, value: 250, status: 'pending', date: '2026-10-18T22:15:00', reference: 'PP-5RT28431KX0947215' },
  { id: 'LL-48213799', direction: 'deposit', method: { kind: 'cash', methodId: 'visa' }, amount: 100, value: 97.5, status: 'completed', date: '2026-10-18T20:03:00', reference: 'VIS-0918-4821-77Q' },
  { id: 'LL-48213702', direction: 'withdraw', method: { kind: 'coin', coinId: 'btc' }, networkId: 'btc', amount: 0.0125, value: 1230.63, status: 'completed', date: '2026-10-17T18:45:00', reference: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  { id: 'LL-48213688', direction: 'deposit', method: { kind: 'cash', methodId: 'mastercard' }, amount: 300, value: 292.5, status: 'declined', date: '2026-10-17T15:12:00', reference: 'MC-0917-1166-31B' },
  { id: 'LL-48213604', direction: 'deposit', method: { kind: 'coin', coinId: 'eth' }, networkId: 'erc20', amount: 0.25, value: 905, status: 'completed', date: '2026-10-16T21:50:00', reference: '0x9f2c6a1e4b7d03c58e2f91a0b6d4c7e35f8a2b19d0c6e47f3a5b8d21c9e0f6a4' },
  { id: 'LL-48213511', direction: 'deposit', method: { kind: 'coin', coinId: 'ltc' }, networkId: 'ltc', amount: 3.2, value: 295.68, status: 'completed', date: '2026-10-15T19:20:00', reference: 'a1d4f7c2e9b06358d2a7f41c8e0b93d65f2c7a0e4b18d9c36f5a2e70b4c1d8f3' },
  { id: 'LL-48213470', direction: 'withdraw', method: { kind: 'cash', methodId: 'wire' }, amount: 1500, value: 1500, status: 'completed', date: '2026-10-12T11:05:00', reference: 'WIRE-LL-20261012-0042' },
  { id: 'LL-48213392', direction: 'deposit', method: { kind: 'coin', coinId: 'doge' }, networkId: 'doge', amount: 1200, value: 228, status: 'completed', date: '2026-10-10T14:00:00', reference: '4b7e2a9c1f05d83e6a2c9b74f1e0d58a3c6b9f27e4d1a05c8b3f6e92d7a40c15' },
  { id: 'LL-48213305', direction: 'withdraw', method: { kind: 'coin', coinId: 'usdt' }, networkId: 'erc20', amount: 400, value: 400, status: 'declined', date: '2026-10-08T08:30:00', reference: 'LL-REJ-48213305' },
];

export function historyFor(size: 'default' | 'large' | 'empty'): Transaction[] {
  if (size === 'empty') return [];
  if (size === 'default') return BASE_HISTORY;
  const out: Transaction[] = [];
  const start = new Date('2026-10-19T09:41:00').getTime();
  for (let i = 0; i < 248; i++) {
    const base = BASE_HISTORY[i % BASE_HISTORY.length];
    out.push({
      ...base,
      id: `LL-${48213907 - i * 37}`,
      date: new Date(start - i * 1000 * 60 * 60 * 7).toISOString().slice(0, 19),
      status: i === 1 ? 'pending' : base.status,
    });
  }
  return out;
}

export function methodLabel(sel: Selection, networkId?: string) {
  if (sel.kind === 'cash') return cashById(sel.methodId).name;
  const coin = coinById(sel.coinId);
  const net = coin.networks.find((n) => n.id === networkId);
  return net && coin.networks.length > 1 ? `${coin.symbol} on ${net.short}` : coin.name;
}
