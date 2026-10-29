/**
 * Which pair of cards the Earn testers slide lays over the dashboard: `?earn=1|2|3`.
 *
 * 1 — Medusa's sales-channels table and its payment → cart graph, as the pools and a deposit.
 * 2 — Medusa's order menu and activity, as a position's menu and what has happened to it.
 * 3 — the Performance and Security pair, as the fixed rate and whitelisted payouts.
 */
const raw = new URLSearchParams(window.location.search).get('earn');
export type EarnVariant = '1' | '2' | '3';
export const EARN_VARIANT: EarnVariant = raw === '2' || raw === '3' ? raw : '1';
