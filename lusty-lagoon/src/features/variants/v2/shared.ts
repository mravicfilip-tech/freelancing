import { GAMES, gameById, type CatalogueGame, type Category } from '../../../data/games';
import { EXPLORE_ORDER } from '../../lobby/data';

// Data helpers variant 2 shares across its parts.

export type Filter = 'all' | Category;

/** The catalogue in the lobby's order, portrait covers only. */
export const ORDERED: CatalogueGame[] = [
  ...['sugar-rush', 'sweet-bonanza', 'starlight-princess', 'lucky-dwarfs', 'zeus-thunderbolt', 'aztec-fire'].map((id) => gameById(id)!),
  ...EXPLORE_ORDER.map((id) => gameById(id)!),
];
for (const g of GAMES) if (!g.wideOnly && !ORDERED.some((o) => o.id === g.id)) ORDERED.push(g);

export const CATEGORY_NAME: Record<Category, string> = {
  slots: 'Slot game',
  megaways: 'Megaways',
  'hold-and-win': 'Hold and win',
  fish: 'Fish game',
  new: 'New this week',
};

/** A stable live player count per game, so the numbers vary but never jump between renders. */
export function onlineFor(id: string) {
  let n = 0;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 9973;
  return 140 + (n % 860);
}

/** A player name as a chat handle, @peki82. */
export const handle = (player: string) => `@${player.replace(/\s|\./g, '').toLowerCase()}`;

/** The name a card prints. The category line under it already says Megaways, so the suffix and the edition numbers drop. */
export const cardName = (g: CatalogueGame) =>
  (g.short ?? g.name)
    .replace(/,.*$/, '')
    .replace(/ Megaways$/, '')
    .replace(/ (1000|5000|40|6 Deluxe)$/, '')
    .replace(/^The /, '');
