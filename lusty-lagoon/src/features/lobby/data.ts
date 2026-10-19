import type { CoinId } from '../../data/wallet';

// Mock activity for the lobby. Amounts, players and times vary, unlike the Figma's repeated rows.

export type Bet = {
  id: string;
  gameId: string;
  player: string;
  initials: string;
  time: string;
  wager: number;
  coin: CoinId;
  multiplier: number;
  mine?: boolean;
};

export const BETS: Bet[] = [
  { id: 'b1', gameId: 'mad-max', player: 'John D.', initials: 'JD', time: '21:52', wager: 200, coin: 'usdt', multiplier: 0.3, mine: true },
  { id: 'b2', gameId: 'wolf-gold', player: 'JJ Maybank', initials: 'JM', time: '21:52', wager: 50, coin: 'btc', multiplier: 0 },
  { id: 'b3', gameId: 'gates-of-olympus', player: 'Alice G.', initials: 'AG', time: '21:51', wager: 120, coin: 'xrp', multiplier: 14.6 },
  { id: 'b4', gameId: 'tiki-boom', player: 'Goodie B.', initials: 'GB', time: '21:51', wager: 20, coin: 'btc', multiplier: 0 },
  { id: 'b5', gameId: 'scarab-wheel', player: 'Peki M.', initials: 'PM', time: '21:50', wager: 75, coin: 'xrp', multiplier: 7.08 },
  { id: 'b6', gameId: 'sumo-supreme', player: 'Niksa S.', initials: 'NS', time: '21:50', wager: 300, coin: 'btc', multiplier: 0 },
  { id: 'b7', gameId: 'aztec-fire', player: 'Tane M.', initials: 'TM', time: '21:49', wager: 10, coin: 'usdt', multiplier: 52.4 },
  { id: 'b8', gameId: 'sugar-rush', player: 'John D.', initials: 'JD', time: '21:47', wager: 40, coin: 'usdt', multiplier: 2.5, mine: true },
  { id: 'b9', gameId: 'zeus-thunderbolt', player: 'Mila R.', initials: 'MR', time: '21:46', wager: 500, coin: 'eth', multiplier: 1.43 },
  { id: 'b10', gameId: 'festival-of-fortune', player: 'Ficko', initials: 'FI', time: '21:45', wager: 25, coin: 'ltc', multiplier: 0 },
];

export const payout = (b: Bet) => Math.round(b.wager * b.multiplier * 100) / 100;

export type Winner = { gameId: string; player: string; amount: number; coin: CoinId };

export const TOP_WINNERS: Winner[] = [
  { gameId: 'sugar-rush', player: 'Peki82', amount: 0.42, coin: 'btc' },
  { gameId: 'scarab-wheel', player: 'Ficko1', amount: 3.1, coin: 'eth' },
  { gameId: 'gates-of-olympus', player: 'Niksa', amount: 9840, coin: 'usdt' },
  { gameId: 'aztec-fire', player: 'Tane4', amount: 2210, coin: 'usdt' },
];

export const FEATURED = ['sugar-rush', 'scarab-wheel', 'coin-volcano'];
