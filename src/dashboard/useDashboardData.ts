import { useEffect, useState } from 'react';
import {
  FLASH_SALE,
  HOLDINGS,
  LIVE_ORDERS,
  PRESALE,
  REFERRALS,
  REFERRAL_ROWS,
  WALLET,
  type Order,
  type Referral,
} from './data';

/**
 * The dashboard reads its figures through a promise rather than importing the
 * constants directly, so the skeleton is showing a real pending state. The day
 * a presale API exists, only this file changes — no component knows the
 * difference between a constant and a fetch.
 */
/* Written out rather than `typeof CONST`: the constants are `as const`, so
   their literal types would reject an empty wallet's zeros. */
export type Holdings = { balance: number; purchases: number; worthAtTge: number };
export type Referrals = {
  earnings: number;
  claimed: number;
  invited: number;
  share: number;
  link: string;
};
export type FlashSaleState =
  | { active: true; bonus: number; code: string; secondsLeft: number }
  | { active: false };

export type DashboardData = {
  presale: typeof PRESALE;
  holdings: Holdings;
  referrals: Referrals;
  referralRows: Referral[];
  orders: Order[];
  flashSale: FlashSaleState;
  wallet: typeof WALLET;
};

/** ~900ms: long enough that every card's shimmer registers as deliberate. */
const LATENCY_MS = 900;

const FULL: DashboardData = {
  presale: PRESALE,
  holdings: HOLDINGS,
  referrals: REFERRALS,
  referralRows: REFERRAL_ROWS,
  orders: LIVE_ORDERS,
  flashSale: { ...FLASH_SALE, active: true },
  wallet: WALLET,
};

/** What a wallet that has never touched the presale actually sees. */
const EMPTY: DashboardData = {
  presale: PRESALE,
  holdings: { balance: 0, purchases: 0, worthAtTge: 0 },
  referrals: { ...REFERRALS, earnings: 0, claimed: 0, invited: 0 },
  referralRows: [],
  orders: [],
  flashSale: { active: false },
  wallet: WALLET,
};

/**
 * Module-level so the wait happens once per session: a theme switch or a
 * remount paints from the settled promise instead of going blank again.
 */
const cache = new Map<string, Promise<DashboardData>>();

function load(empty: boolean): Promise<DashboardData> {
  const key = empty ? 'empty' : 'full';
  let p = cache.get(key);
  if (!p) {
    p = new Promise((resolve) => setTimeout(() => resolve(empty ? EMPTY : FULL), LATENCY_MS));
    cache.set(key, p);
  }
  return p;
}

export function useDashboardData(empty = false) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let live = true;
    load(empty).then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, [empty]);

  return data;
}
