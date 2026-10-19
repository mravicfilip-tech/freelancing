import type { ReactNode } from 'react';
import { Cherries, Coins, Fish, Lightning, Sparkle, SquaresFour } from '@phosphor-icons/react';
import type { CategoryFilter } from './data';

// One icon per room, shared by the nav row, the finder chips and the rooms, so a room reads the
// same everywhere on the floor.
export const ROOM_ICON: Record<CategoryFilter, ReactNode> = {
  all: <SquaresFour weight="fill" />,
  slots: <Cherries weight="fill" />,
  megaways: <Lightning weight="fill" />,
  'hold-and-win': <Coins weight="fill" />,
  fish: <Fish weight="fill" />,
  new: <Sparkle weight="fill" />,
};

export const WRAP = 'mx-auto w-full max-w-[1920px] px-6';
