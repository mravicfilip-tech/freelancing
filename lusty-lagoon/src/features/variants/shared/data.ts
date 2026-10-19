import { useEffect, useMemo, useState } from 'react';
import type { CoinId } from '../../../data/wallet';
import type { Category } from '../../../data/games';

// Mock data the five dashboard variants share, in the shape a casino backend returns. Names,
// amounts and times vary on purpose. The lobby's own data (bets, top winners, featured, the
// recommended and explore orders) lives in features/lobby/data.ts and is reused as is.

const av = (name: string) => `/art/avatars/${name}.webp`;

export const ONLINE_NOW = 1284;

export type ChatRole = 'admin' | 'mod';
export type ChatMessage = { id: string; player: string; avatar?: string; initials: string; role?: ChatRole; text: string; time: string; mine?: boolean };

export const CHAT: ChatMessage[] = [
  { id: 'c1', player: 'Peki82', avatar: av('peki'), initials: 'PK', text: 'Sugar Rush just paid 420x on a 50 cent spin, I am shaking', time: '3:41 PM' },
  { id: 'c2', player: 'Lagoon Team', initials: 'LT', role: 'admin', text: 'Never share your password or wallet seed in chat. The team will never ask for it.', time: '3:42 PM' },
  { id: 'c3', player: 'Ficko1', avatar: av('ficko'), initials: 'FI', text: '@Peki82 which bet size? I keep dying on the free spins', time: '3:43 PM' },
  { id: 'c4', player: 'Alice G.', avatar: av('alice'), initials: 'AG', text: 'Hot Streak draw is Sunday, anyone already over 50 entries?', time: '3:45 PM' },
  { id: 'c5', player: 'Niksa', avatar: av('niksa'), initials: 'NS', role: 'mod', text: 'Tips over 25 USDT go through the Tip tab, not chat. Thanks all', time: '3:46 PM' },
  { id: 'c6', player: 'Goodie B.', avatar: av('goodie'), initials: 'GB', text: 'Book of Ra is cold today, moving to Big Bass', time: '3:48 PM' },
  { id: 'c7', player: 'Tane4', avatar: av('tane'), initials: 'TA', text: 'gm lagoon', time: '3:49 PM' },
  { id: 'c8', player: 'JJ Maybank', avatar: av('jj'), initials: 'JM', text: 'Withdrew to BTC in 12 minutes, first time it was that quick', time: '3:51 PM' },
];

export type LiveWin = { id: string; gameId: string; player: string; avatar?: string; initials?: string; amount: number; coin: CoinId; ago: string };

export const LIVE_WINS: LiveWin[] = [
  { id: 'w1', gameId: 'sugar-rush', player: 'Peki82', avatar: av('peki'), amount: 0.42, coin: 'btc', ago: '1m' },
  { id: 'w2', gameId: 'gates-of-olympus', player: 'Ficko1', avatar: av('ficko'), amount: 9840, coin: 'usdt', ago: '1m' },
  { id: 'w3', gameId: 'big-bass-splash', player: 'Alice G.', avatar: av('alice'), amount: 312.5, coin: 'usdt', ago: '2m' },
  { id: 'w4', gameId: 'wolf-gold', player: 'Goodie B.', avatar: av('goodie'), amount: 1.06, coin: 'eth', ago: '2m' },
  { id: 'w5', gameId: 'starlight-princess', player: 'Niksa', avatar: av('niksa'), amount: 2210, coin: 'usdt', ago: '3m' },
  { id: 'w6', gameId: 'dog-house-multihold', player: 'JJ Maybank', avatar: av('jj'), amount: 171.6, coin: 'xrp', ago: '4m' },
  { id: 'w7', gameId: 'aztec-fire', player: 'Tane4', avatar: av('tane'), amount: 524, coin: 'usdt', ago: '5m' },
  { id: 'w8', gameId: 'scarab-wheel', player: 'Mila R.', initials: 'MR', amount: 0.18, coin: 'btc', ago: '6m' },
  { id: 'w9', gameId: 'lucky-dwarfs', player: 'Peki M.', avatar: av('peki-m'), amount: 88, coin: 'usdt', ago: '7m' },
  { id: 'w10', gameId: 'zeus-thunderbolt', player: 'Niksa S.', avatar: av('niksa-s'), amount: 3.1, coin: 'eth', ago: '8m' },
  { id: 'w11', gameId: 'sweet-bonanza', player: 'Tane M.', avatar: av('tane-m'), amount: 640, coin: 'usdt', ago: '9m' },
  { id: 'w12', gameId: 'five-lions', player: 'John D.', avatar: av('john-sm'), amount: 100, coin: 'usdt', ago: '11m' },
];

/** The weekly race. Prize pool in USDT, split across the top ten by wagered amount. */
export const RACE = {
  name: 'Weekly race',
  pool: 5000,
  currency: 'USDT' as const,
  endsInSeconds: 3 * 86400 + 9 * 3600 + 32 * 60,
  leaders: [
    { place: 1, player: 'Ficko1', avatar: av('ficko'), wagered: 84210, prize: 2000 },
    { place: 2, player: 'Alice G.', avatar: av('alice'), wagered: 61980, prize: 1200 },
    { place: 3, player: 'Peki82', avatar: av('peki'), wagered: 42600, prize: 700 },
  ],
  you: { place: 214, wagered: 1840, toTen: 9120 },
};

/** The daily chest. One chest a day, the amount grows with the streak. */
export const DAILY_CHEST = {
  readyInSeconds: 2 * 3600 + 15 * 60 + 30,
  streak: 3,
  days: [
    { day: 'Mon', amount: 1, status: 'claimed' as const },
    { day: 'Tue', amount: 2, status: 'claimed' as const },
    { day: 'Wed', amount: 3, status: 'claimed' as const },
    { day: 'Thu', amount: 5, status: 'today' as const },
    { day: 'Fri', amount: 8, status: 'locked' as const },
    { day: 'Sat', amount: 13, status: 'locked' as const },
    { day: 'Sun', amount: 21, status: 'locked' as const },
  ],
  currency: 'USDT' as const,
};

/** Game rooms, one per catalogue category, with the art that fits it and a live player count. */
export const ROOMS: { id: Category; label: string; blurb: string; art: string; players: number }[] = [
  { id: 'slots', label: 'Slots', blurb: 'Classic reels and bonus buys', art: '/art/landing/casino-arcade.webp', players: 642 },
  { id: 'megaways', label: 'Megaways', blurb: 'Up to 117,649 ways a spin', art: '/art/landing/casino-hall.webp', players: 233 },
  { id: 'hold-and-win', label: 'Hold and win', blurb: 'Lock coins, fill the grid', art: '/art/landing/casino-courtyard.webp', players: 198 },
  { id: 'fish', label: 'Fish games', blurb: 'Reel in the big catch', art: '/art/landing/hero-beach.webp', players: 117 },
  { id: 'new', label: 'New', blurb: 'Added this week', art: '/art/landing/slot-machine.webp', players: 94 },
];

export const PROVIDERS = ['Pragmatic Play', 'NetEnt', 'Relax Gaming', 'Habanero', 'Playtech', 'Novomatic', 'Fugaso', 'Rotativka', 'Gamzix', '3 Oaks Gaming', 'EGT', 'Betsoft'];

/** The player's recent games, last played first, with their result this session. */
export const CONTINUE_PLAYING: { gameId: string; lastPlayed: string; session: number }[] = [
  { gameId: 'sugar-rush', lastPlayed: '12 min ago', session: 60 },
  { gameId: 'gates-of-olympus', lastPlayed: 'Yesterday', session: -40 },
  { gameId: 'big-bass-splash', lastPlayed: '2 days ago', session: 12.5 },
  { gameId: 'wolf-gold', lastPlayed: '3 days ago', session: -25 },
];

/** Counts down once a second from a starting number of seconds. Stays still when the page asks for a still frame with ?still. */
export function useCountdown(start: number) {
  const still = useMemo(() => new URLSearchParams(window.location.search).has('still'), []);
  const [left, setLeft] = useState(start);
  useEffect(() => {
    if (still) return;
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [still]);
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { left, d, h, m, s, hms: `${pad(h)}:${pad(m)}:${pad(s)}`, pad };
}

/** The ?state= switch every variant honours, loading, empty or error. */
export function useVariantState() {
  return useMemo(() => new URLSearchParams(window.location.search).get('state'), []);
}
