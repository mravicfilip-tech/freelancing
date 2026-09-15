import { REFERRALS } from '../data';

/**
 * Referral figures and activity. The dashboard's own numbers, with the
 * status each commission is in; a real API replaces this module without
 * touching a component.
 */
export type Status = 'Paid' | 'Pending';
export type Activity = { id: string; user: string; usd: number; cut: number; status: Status; date: string };

export const TOTALS = {
  earned: REFERRALS.earnings,
  paid: REFERRALS.claimed,
  pending: Number((REFERRALS.earnings - REFERRALS.claimed).toFixed(2)),
  share: REFERRALS.share,
  link: REFERRALS.link,
} as const;

const row = (id: string, user: string, usd: number, status: Status, date: string): Activity => ({ id, user, usd, cut: Number((usd * REFERRALS.share).toFixed(2)), status, date });

export const ACTIVITY: Activity[] = [
  row('r-2041', '0x7a41…3f2b', 250, 'Pending', '2026-09-15'),
  row('r-2036', '0xc0de…91a4', 1000, 'Pending', '2026-09-14'),
  row('r-2029', '0x5f8b…d773', 120, 'Pending', '2026-09-13'),
  row('r-2011', '0x91ee…07c5', 1193.33, 'Pending', '2026-09-11'),
  row('r-1987', '0x33ab…6e10', 2000, 'Paid', '2026-09-06'),
  row('r-1962', '0xb7c2…44d9', 1500, 'Paid', '2026-09-02'),
  row('r-1940', '0x0f61…a8b3', 800, 'Paid', '2026-08-28'),
  row('r-1918', '0x6d0a…c1e7', 1200, 'Paid', '2026-08-21'),
  row('r-1895', '0xe4f9…52aa', 500, 'Paid', '2026-08-14'),
];

export const fmtDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
