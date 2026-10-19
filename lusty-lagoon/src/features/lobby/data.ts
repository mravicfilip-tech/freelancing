import type { CoinId } from '../../data/wallet';

// Mock activity for the lobby, on the Figma's games and players. Wagers and payouts vary and add
// up, where the Figma repeats $200 and prints payouts that do not match the multiplier.

export type Bet = {
  id: string;
  gameId: string;
  player: string;
  initials: string;
  avatar?: string;
  time: string;
  wager: number;
  coin: CoinId;
  multiplier: number;
  mine?: boolean;
};

const av = (name: string) => `/art/avatars/${name}.webp`;

export const BETS: Bet[] = [
  { id: 'b1', gameId: 'mad-max', player: 'John D.', initials: 'JD', avatar: av('john-sm'), time: '3:52 PM', wager: 200, coin: 'usdt', multiplier: 0.3, mine: true },
  { id: 'b2', gameId: 'big-bass-splash', player: 'JJ Maybank', initials: 'JM', avatar: av('jj'), time: '3:52 PM', wager: 50, coin: 'btc', multiplier: 0 },
  { id: 'b3', gameId: 'dog-house-multihold', player: 'Alice G.', initials: 'AG', avatar: av('alice'), time: '3:51 PM', wager: 120, coin: 'xrp', multiplier: 1.43 },
  { id: 'b4', gameId: 'scruffy-duck', player: 'Goodie B.', initials: 'GB', avatar: av('goodie'), time: '3:51 PM', wager: 20, coin: 'btc', multiplier: 0 },
  { id: 'b5', gameId: 'dwarf-and-dragon', player: 'Peki M.', initials: 'PM', avatar: av('peki-m'), time: '3:50 PM', wager: 40, coin: 'xrp', multiplier: 7.08 },
  { id: 'b6', gameId: 'beware-the-deep', player: 'Niksa S.', initials: 'NS', avatar: av('niksa-s'), time: '3:50 PM', wager: 300, coin: 'btc', multiplier: 0 },
  { id: 'b7', gameId: 'lava-lions', player: 'Tane M.', initials: 'TM', avatar: av('tane-m'), time: '3:49 PM', wager: 10, coin: 'usdt', multiplier: 0 },
  { id: 'b8', gameId: 'sugar-rush', player: 'John D.', initials: 'JD', avatar: av('john-sm'), time: '3:47 PM', wager: 40, coin: 'usdt', multiplier: 2.5, mine: true },
  { id: 'b9', gameId: 'zeus-thunderbolt', player: 'Mila R.', initials: 'MR', time: '3:46 PM', wager: 500, coin: 'eth', multiplier: 1.43 },
  { id: 'b10', gameId: 'aztec-fire', player: 'Tane M.', initials: 'TM', avatar: av('tane-m'), time: '3:45 PM', wager: 10, coin: 'usdt', multiplier: 52.4 },
  { id: 'b11', gameId: 'gates-of-olympus', player: 'Ficko', initials: 'FI', avatar: av('ficko'), time: '3:44 PM', wager: 250, coin: 'btc', multiplier: 3.2 },
  { id: 'b12', gameId: 'wolf-gold', player: 'John D.', initials: 'JD', avatar: av('john-sm'), time: '3:41 PM', wager: 25, coin: 'usdt', multiplier: 0, mine: true },
];

export const payout = (b: Bet) => Math.round(b.wager * b.multiplier * 100) / 100;

export type Winner = { gameId: string; player: string; avatar: string; amount: number; coin: CoinId };

export const TOP_WINNERS: Winner[] = [
  { gameId: 'sugar-rush', player: 'Peki82', avatar: av('peki'), amount: 0.42, coin: 'btc' },
  { gameId: 'scarab-wheel', player: 'Ficko1', avatar: av('ficko'), amount: 0.18, coin: 'btc' },
  { gameId: 'book-of-ra', player: 'Niksa', avatar: av('niksa'), amount: 1.06, coin: 'btc' },
  { gameId: 'aztec-fire', player: 'Tane4', avatar: av('tane'), amount: 0.27, coin: 'btc' },
];

/** The featured slot carousel. Sugar Rush has its own banner in the Figma, the rest use their wide cover. */
export const FEATURED: { gameId: string; art?: string }[] = [
  { gameId: 'sugar-rush', art: '/art/lobby/featured-sugar-rush.webp' },
  { gameId: 'scarab-wheel' },
  { gameId: 'coin-volcano' },
];

/** The Recommended for you rail, in the Figma's order first. */
export const RECOMMENDED = ['lucky-dwarfs', 'starlight-princess', 'sweet-bonanza', 'billy-bob-boom', 'capypark', 'sugar-rush', 'gates-of-olympus', 'big-bass-splash', 'wolf-gold', 'zeus-thunderbolt'];

/** The Explore grid, in the Figma's order for its three rows of eight, then the rest of the catalogue. The Figma shows
 * Dwarf and Dragon twice, so the second slot holds Hell Hot. */
export const EXPLORE_ORDER = [
  'mad-max', 'big-bass-splash', 'gates-of-olympus', 'wolf-gold', 'dog-house-multihold', 'gold-fever', 'cash-n-riches', 'sumo-supreme',
  'primate-king', 'release-the-kraken', 'buffalo-mania', 'dwarf-and-dragon', 'five-lions', 'beware-the-deep', 'dwarven-gems', 'hell-hot',
  'battle-dwarf', 'farm-hunt', 'lava-lions', 'diamond-king-gold', 'boom-boom-gold', 'scruffy-duck', 'tiki-boom', 'super-boom',
];

export const GIVEAWAY = { pool: 0.42, coin: 'btc' as CoinId, entryEvery: 10, ends: 'Sunday at midnight' };
