import type { TxStatus } from '../../data/wallet';

// Mock referral data. Names, dates and statuses vary. The reward and the 20 USDT deposit rule are
// placeholders in the shape a real referral API returns, the Figma only says "$50 for each friend".

export const REFERRAL = {
  link: 'https://lustylagoon.com/join/JOHND-4F7K2',
  code: 'JOHND-4F7K2',
  playerReward: 50,
  minDeposit: 20,
  friendBonusPct: 150,
  currency: 'USDT',
};

export type Via = 'Facebook' | 'WhatsApp' | 'Link' | 'Code';

export type Friend = {
  id: string;
  name: string;
  email: string;
  date: string;
  via: Via;
  /** In USDT. Only a friend who deposited has paid out. */
  earned: number;
  status: TxStatus;
};

// Pending means the friend signed up and has not deposited. Declined means the referral cannot pay.
export const STATUS_NOTE: Record<TxStatus, string> = {
  completed: 'Deposited, paid out',
  pending: 'Signed up, no deposit yet',
  declined: 'Already had an account',
};

const PAID = REFERRAL.playerReward;

export const FRIENDS: Friend[] = [
  { id: 'f1', name: 'Peki972', email: 'pekim@gmail.com', date: '2026-10-18T14:23:00', via: 'Facebook', earned: 0, status: 'pending' },
  { id: 'f2', name: 'Niksa74', email: 'niksa923@gmail.com', date: '2026-10-17T15:12:00', via: 'Code', earned: 0, status: 'declined' },
  { id: 'f3', name: 'Marija Kovacevic', email: 'marija.kovacevic.photography@studio-northside.example.com', date: '2026-10-15T18:45:00', via: 'WhatsApp', earned: PAID, status: 'completed' },
  { id: 'f4', name: 'tane_m', email: 'tane.m@outlook.com', date: '2026-10-12T20:30:00', via: 'Link', earned: PAID, status: 'completed' },
  { id: 'f5', name: 'Ficko', email: 'ficko1@proton.me', date: '2026-10-09T21:00:00', via: 'WhatsApp', earned: PAID, status: 'completed' },
  { id: 'f6', name: 'Alice G.', email: 'alice.g@gmail.com', date: '2026-10-06T14:00:00', via: 'Facebook', earned: 0, status: 'pending' },
  { id: 'f7', name: 'Mila R.', email: 'mila.r@gmail.com', date: '2026-09-29T19:20:00', via: 'Code', earned: PAID, status: 'completed' },
  { id: 'f8', name: 'Goodie B.', email: 'goodieb@yahoo.com', date: '2026-09-21T21:50:00', via: 'Link', earned: 0, status: 'declined' },
  { id: 'f9', name: 'Dario Petrovic', email: 'dario.p@gmail.com', date: '2026-09-14T11:05:00', via: 'WhatsApp', earned: PAID, status: 'completed' },
];

const FIRST = ['Ana', 'Luka', 'Ivan', 'Maja', 'Tomas', 'Sara', 'Nina', 'Vuk', 'Eva', 'Jonas', 'Lea', 'Marko'];
const LAST = ['Horvat', 'Novak', 'Kralj', 'Babic', 'Jovic', 'Maric', 'Tadic', 'Peric'];
const VIAS: Via[] = ['Facebook', 'WhatsApp', 'Link', 'Code'];
const STATUSES: TxStatus[] = ['completed', 'completed', 'pending', 'completed', 'declined'];

// A long list for the large state, 240 friends.
export function largeFriends(): Friend[] {
  const start = new Date('2026-10-17T12:00:00').getTime();
  const out: Friend[] = [];
  for (let i = 0; i < 240; i++) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3) % LAST.length];
    const status = STATUSES[i % STATUSES.length];
    out.push({
      id: `big${i}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@example.com`.toLowerCase(),
      date: new Date(start - i * 1000 * 60 * 60 * 9).toISOString().slice(0, 19),
      via: VIAS[i % VIAS.length],
      earned: status === 'completed' ? PAID : 0,
      status,
    });
  }
  return out;
}

export const shareUrls = (link: string) => ({
  Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
  WhatsApp: `https://wa.me/?text=${encodeURIComponent(`Join me on Lusty Lagoon and we both get paid. ${link}`)}`,
});
