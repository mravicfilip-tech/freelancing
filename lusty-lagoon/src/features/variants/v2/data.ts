import { GAMES, gameById, type Category } from '../../../data/games';
import { EXPLORE_ORDER } from '../../lobby/data';
import { ROOMS } from '../shared/data';

// The Mascot stage's view of the shared catalogue. Portrait covers only, hot ones first.

export type Filter = 'all' | Category;

const HOT_FIRST = ['sugar-rush', 'gates-of-olympus', 'sweet-bonanza', 'starlight-princess', 'big-bass-splash', 'zeus-thunderbolt'];

export const ORDERED = [
  ...HOT_FIRST.map((id) => gameById(id)!),
  ...EXPLORE_ORDER.filter((id) => !HOT_FIRST.includes(id)).map((id) => gameById(id)!),
  ...GAMES.filter((g) => !g.wideOnly && !HOT_FIRST.includes(g.id) && !EXPLORE_ORDER.includes(g.id)),
];

export const countOf = (c: Filter) => (c === 'all' ? ORDERED.length : ORDERED.filter((g) => g.category === c).length);

export const playersIn = (c: Category) => ROOMS.find((r) => r.id === c)?.players ?? 0;
