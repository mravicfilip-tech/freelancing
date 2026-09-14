import { LIVE_ORDERS, PRESALE } from '../data';

/**
 * Earn-screen figures. Same rule as the dashboard's data module: one place,
 * derived where it can be, so a real API replaces constants without touching
 * a component.
 */

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
