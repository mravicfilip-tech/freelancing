import { LIVE_ORDERS, PRESALE } from '../data';

/**
 * Earn-screen figures. Same rule as the dashboard's data module: one place,
 * derived where it can be, so a real API replaces constants without touching
 * a component.
 */

export type Promo = { id: string; title: string; accent: string; body: string };

/** The reference's carousel copy, one card per rail. */
export const PROMOS: Promo[] = [
  { id: 'rails', title: 'Fiat rails', accent: 'for crypto businesses', body: 'Settle invoices in 30+ currencies straight from a wallet, with the FX rate locked at send.' },
  { id: 'bank', title: 'Pay any bank account', accent: 'using crypto', body: 'Send to a local IBAN or account number; the recipient sees a normal bank transfer.' },
  { id: 'xborder', title: 'Cross-border transfers', accent: 'without the bank fee', body: 'One flat fee, no correspondent chain, and the money lands the same day in most corridors.' },
  { id: 'card', title: 'Spend $RTX', accent: 'anywhere cards work', body: 'A virtual card funded from your balance, so a presale allocation becomes money you can use.' },
];

const TOKENS_SOLD = 265_000_000;
const RAISED = 17_200_000;

export const STAGE = {
  n: PRESALE.stage,
  price: PRESALE.price,
  nextPrice: PRESALE.nextPrice,
  /** Share of the stage sold, from the same figure the ladder shows. */
  progress: PRESALE.progress,
  raised: RAISED,
  tokensSold: TOKENS_SOLD,
  /** 13d 10h 23m 59s to the step-up when the page loads. */
  secondsLeft: 13 * 86400 + 10 * 3600 + 23 * 60 + 59,
} as const;

/** The dashboard's own live feed, so both screens show the same orders. */
export const EARN_ORDERS = LIVE_ORDERS;
