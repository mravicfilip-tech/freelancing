import type { ReactNode } from 'react';
import { Cherries, Coins, Fish, Lightning, Sparkle, SquaresFour } from '@phosphor-icons/react';
import { GAMES, gameById, type Category } from '../../../data/games';
import { EXPLORE_ORDER } from '../../lobby/data';

// The game filter the sidebar nav, the chips and the tiles share.

export type Filter = 'all' | Category;

export const NAV: { value: Filter; label: string; chip: string; icon: ReactNode }[] = [
  { value: 'all', label: 'Lobby', chip: 'All', icon: <SquaresFour weight="fill" /> },
  { value: 'slots', label: 'Slots', chip: 'Slots', icon: <Cherries weight="fill" /> },
  { value: 'megaways', label: 'Megaways', chip: 'Megaways', icon: <Lightning weight="fill" /> },
  { value: 'hold-and-win', label: 'Hold and win', chip: 'Hold and win', icon: <Coins weight="fill" /> },
  { value: 'fish', label: 'Fish games', chip: 'Fish', icon: <Fish weight="fill" /> },
  { value: 'new', label: 'New', chip: 'New', icon: <Sparkle weight="fill" /> },
];

/** The catalogue in the lobby's explore order first, portrait covers only. */
export const ORDERED = [...EXPLORE_ORDER.map((id) => gameById(id)!), ...GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id))];

export const countOf = (c: Filter) => (c === 'all' ? ORDERED.length : ORDERED.filter((g) => g.category === c).length);
