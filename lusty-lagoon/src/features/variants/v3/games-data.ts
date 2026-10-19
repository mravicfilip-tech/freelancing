import { GAMES, gameById, type Category } from '../../../data/games';
import { ACCOUNT } from '../../../data/wallet';
import { RANKS } from '../../../data/ranks';
import { EXPLORE_ORDER } from '../../lobby/data';

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

/** One pillar cut-out per rank, and the hue each rank glows in. */
export const RANK_ART: Record<string, { pillar: string; hue: string; ink: string; height: number }> = {
  Bronze: { pillar: '/art/landing/pillar-flowers-left.webp', hue: '#E8590C', ink: '#FFB27A', height: 160 },
  Silver: { pillar: '/art/landing/pillar-gems-a.webp', hue: '#7C93D6', ink: '#B9C7F0', height: 176 },
  Gold: { pillar: '/art/landing/pillar-gems-b.webp', hue: '#F5B800', ink: '#FFD861', height: 192 },
  Platinum: { pillar: '/art/landing/pillar-flowers-right.webp', hue: '#15AABF', ink: '#7BE3F0', height: 208 },
  Diamond: { pillar: '/art/landing/pillar-girl.webp', hue: '#F06595', ink: '#FFA3C4', height: 224 },
};

/** Short reward names for the ladder cards, read from RANKS. */
export const REWARD_SHORT: Record<string, string> = {
  Bronze: 'Free daily spin',
  Silver: 'Cash drops to $50',
  Gold: 'Cash drops to $200',
  Platinum: 'Cash drops to $500',
  Diamond: 'Cash drops to $1,000',
};
