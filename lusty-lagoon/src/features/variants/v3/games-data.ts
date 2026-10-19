import { GAMES, gameById, type Category } from '../../../data/games';
import { ACCOUNT, coinById, type CoinId } from '../../../data/wallet';
import { RANKS } from '../../../data/ranks';
import { EXPLORE_ORDER } from '../../lobby/data';
import { LIVE_WINS, RACE } from '../shared/data';

// Data helpers for variant 3. Everything is derived from the shared data, so the numbers add up.

export type Filter = 'all' | Category;

export const ORDERED = [...EXPLORE_ORDER.map((id) => gameById(id)!), ...GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id))];
export const countOf = (c: Filter) => (c === 'all' ? ORDERED.length : ORDERED.filter((g) => g.category === c).length);

/** Where John stands. 550,000 of the 650,000 Silver needs, so 100,000 to go. */
export const POINTS = ACCOUNT.rank.points;
export const RANK_INDEX = RANKS.findIndex((r) => r.name === ACCOUNT.rank.name);
export const NEXT = RANKS[RANK_INDEX + 1];
export const TO_NEXT = NEXT.from - POINTS;
/** Share of the way from the current rank to the next one, 0 to 1. */
export const PROGRESS = (POINTS - RANKS[RANK_INDEX].from) / (NEXT.from - RANKS[RANK_INDEX].from);

export type TierId = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export const tierOf = (name: string) => name.toLowerCase() as TierId;

/** One pillar cut-out per rank, the order the landing page stands them in. Heights keep each whole. */
export const TIER_ART: Record<TierId, { pillar: string; reward: [string, string] }> = {
  bronze: { pillar: '/art/landing/pillar-flowers-left.webp', reward: ['Daily spin', 'Free'] },
  silver: { pillar: '/art/landing/pillar-gems-a.webp', reward: ['Weekly drop', '$50'] },
  gold: { pillar: '/art/landing/pillar-gems-b.webp', reward: ['Weekly drop', '$200'] },
  platinum: { pillar: '/art/landing/pillar-flowers-right.webp', reward: ['Weekly drop', '$500'] },
  diamond: { pillar: '/art/landing/pillar-girl.webp', reward: ['Weekly drop', '$1,000'] },
};

/** A handle the way the feeds write it, Alice G. reads @aliceg. */
export const handle = (player: string) => `@${player.replace(/\s|\./g, '').toLowerCase()}`;

/**
 * The race leaderboard, places 1 to 10. Places 1 to 3 are the shared RACE leaders. Places 4 to 10 are
 * held in this variant until the race API returns them. The ten prizes add up to the 5,000 pool.
 */
const MORE: { player: string; avatar?: string; wagered: number; prize: number; tier: TierId }[] = [
  { player: 'Goodie B.', avatar: '/art/avatars/goodie.webp', wagered: 31450, prize: 400, tier: 'silver' },
  { player: 'JJ Maybank', avatar: '/art/avatars/jj.webp', wagered: 24880, prize: 250, tier: 'silver' },
  { player: 'Niksa', avatar: '/art/avatars/niksa.webp', wagered: 19310, prize: 150, tier: 'gold' },
  { player: 'Tane4', avatar: '/art/avatars/tane.webp', wagered: 15120, prize: 120, tier: 'bronze' },
  { player: 'Mila R.', wagered: 13400, prize: 80, tier: 'silver' },
  { player: 'Peki M.', avatar: '/art/avatars/peki-m.webp', wagered: 11960, prize: 60, tier: 'bronze' },
  { player: 'Tane M.', avatar: '/art/avatars/tane-m.webp', wagered: 10960, prize: 40, tier: 'bronze' },
];
const TOP_TIERS: TierId[] = ['diamond', 'platinum', 'gold'];

export const LEADERS = [
  ...RACE.leaders.map((l, i) => ({ place: l.place, player: l.player, avatar: l.avatar as string | undefined, wagered: l.wagered, prize: l.prize, tier: TOP_TIERS[i] })),
  ...MORE.map((m, i) => ({ place: i + 4, ...m })),
];

/** Top wins today, the biggest of the day's wins by their value in USDT. */
const usd = (amount: number, coin: CoinId) => amount * coinById(coin).rate;
export const TOP_WINS = [...LIVE_WINS]
  .sort((a, b) => usd(b.amount, b.coin) - usd(a.amount, a.coin))
  .filter((w, i, all) => all.findIndex((x) => x.player === w.player) === i)
  .slice(0, 5)
  .map((w) => ({ ...w, usd: usd(w.amount, w.coin) }));
