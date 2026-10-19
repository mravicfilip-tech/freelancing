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
