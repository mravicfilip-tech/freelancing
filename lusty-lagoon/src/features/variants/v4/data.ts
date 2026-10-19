import { GAMES, gameById, type CatalogueGame, type Category } from '../../../data/games';
import { EXPLORE_ORDER } from '../../lobby/data';

// The floor's game list and the filters on it. The grid is portrait covers, so a game that only
// has a landscape cover stays out, as it does in the lobby. Every count on the page comes from
// this one list, so a room, a chip and the grid always agree.

export const FLOOR: CatalogueGame[] = [
  ...EXPLORE_ORDER.map((id) => gameById(id)!),
  ...GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id)),
];

export type CategoryFilter = 'all' | Category;
export type SortKey = 'recommended' | 'az' | 'rtp' | 'new';

export const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'az', label: 'Name A to Z' },
  { value: 'rtp', label: 'Highest return' },
  { value: 'new', label: 'Newest first' },
];

export const ALL_PROVIDERS = 'all';

/** Providers that have at least one game on the floor, the biggest first. */
export const PROVIDER_LIST: { name: string; count: number }[] = (() => {
  const counts = new Map<string, number>();
  for (const g of FLOOR) counts.set(g.provider, (counts.get(g.provider) ?? 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
})();

export type Filters = { cat: CategoryFilter; provider: string; query: string; sort: SortKey };

export const matchesQuery = (g: CatalogueGame, query: string) => {
  const q = query.trim().toLowerCase();
  return !q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q);
};

/** The games that pass every filter except the category, which is what a category chip counts. */
export const withoutCategory = (f: Filters) => FLOOR.filter((g) => (f.provider === ALL_PROVIDERS || g.provider === f.provider) && matchesQuery(g, f.query));

export function applyFilters(f: Filters): CatalogueGame[] {
  const list = withoutCategory(f).filter((g) => f.cat === 'all' || g.category === f.cat);
  if (f.sort === 'az') return [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (f.sort === 'rtp') return [...list].sort((a, b) => b.rtp - a.rtp);
  if (f.sort === 'new') return [...list].sort((a, b) => Number(b.tag === 'New') - Number(a.tag === 'New'));
  return list;
}

export const countIn = (cat: Category) => FLOOR.filter((g) => g.category === cat).length;

export const isFiltered = (f: Filters) => f.cat !== 'all' || f.provider !== ALL_PROVIDERS || f.query.trim() !== '';

// The live feed's multipliers, the payout over the stake, as a wins socket sends them with each win.
// Keyed by the shared feed's win id, so the feed itself stays the one shared list.
export const WIN_MULT: Record<string, number> = {
  w1: 420, w2: 1968, w3: 62.5, w4: 18.4, w5: 1105, w6: 34.32, w7: 104.8, w8: 7.2,
  w9: 4.4, w10: 248, w11: 12.8, w12: 2, w13: 296, w14: 25.6, w15: 5.3, w16: 96,
  w17: 82.4, w18: 2450, w19: 9.65, w20: 8.4, w21: 2.9, w22: 70, w23: 1248, w24: 3.6,
};

export type Rarity = 'gold' | 'purple' | 'blue' | 'green';

/** The rarity a multiplier earns, the colour of the line under its cell. */
export const rarityOf = (mult: number): Rarity => (mult >= 1000 ? 'gold' : mult >= 100 ? 'purple' : mult >= 10 ? 'blue' : 'green');

/** Each rarity's text colour, all over 6 to 1 on the sunken cell. */
export const RARITY_TEXT: Record<Rarity, string> = {
  gold: 'text-[#F4D543]',
  purple: 'text-[#C9A2FF]',
  blue: 'text-[#7DBBFF]',
  green: 'text-[#3DD68C]',
};

/** A multiplier the way the feed writes it, 2 decimals under 100 and none from 100 up. */
export const formatMult = (m: number) => `${m >= 100 ? Math.round(m).toLocaleString('en-US') : m.toFixed(2)}x`;

/** The big win line behind the Big wins tab. */
export const BIG_WIN = 100;

/** The signed in player, whose wins the Your wins tab shows. */
export const ME = 'John D.';

/** Each room's hue as an rgb triplet, for the line along a card's floor. */
export const ROOM_RGB: Record<Category, string> = {
  slots: '180 124 255',
  megaways: '90 169 255',
  'hold-and-win': '244 213 67',
  fish: '59 201 219',
  new: '255 122 174',
};

/** Each room's hue as a text colour, for the room label over a cover, CS2's coloured item type. */
export const ROOM_TEXT: Record<Category, string> = {
  slots: 'text-[#C9A2FF]',
  megaways: 'text-[#7DBBFF]',
  'hold-and-win': 'text-[#F4D543]',
  fish: 'text-[#5FD4E4]',
  new: 'text-[#FF8FB8]',
};
