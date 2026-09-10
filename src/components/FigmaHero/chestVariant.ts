import { useSyncExternalStore } from 'react';

/**
 * The five directions for the hero's third slide, the line-art chest (Figma node 2767:55).
 *
 * They all share the same material — 226 named stroke segments that the designer left separated
 * exactly so the crate can be drawn rather than shown. What separates them is the order the
 * segments arrive in, what the drawing settles into once it is done, and what the surrounding
 * field does meanwhile.
 */
export const CHESTS = [
  {
    id: '1',
    label: 'Assemble',
    blurb: 'Built from the base up, then it rests and breathes on a dotted floor.',
  },
  {
    id: '2',
    label: 'Scan',
    blurb: 'A line travels down the crate and leaves it drawn behind, on repeat.',
  },
  {
    id: '3',
    label: 'Radial',
    blurb: 'Drawn outward from the middle, held inside two slow dashed rings.',
  },
  {
    id: '4',
    label: 'Scatter',
    blurb: 'Segments land out of order out of a field of dots that keeps twinkling.',
  },
  {
    id: '5',
    label: 'Unpack',
    blurb: 'The body draws, then the lid draws and lifts, and keeps breathing open.',
  },
] as const;

export type ChestId = (typeof CHESTS)[number]['id'];

const KEY = 'remittix.chest';
const params = new URLSearchParams(window.location.search);

/** `?chest=1..5` picks a direction; its presence is also what puts the review switcher on screen. */
export const CHEST_REVIEW = params.has('chest');

function readInitial(): ChestId {
  const match = (v: string | null) => CHESTS.find((c) => c.id === v || c.label.toLowerCase() === v?.toLowerCase())?.id;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(KEY);
  } catch {
    /* private mode, blocked storage */
  }
  return match(params.get('chest')) ?? match(stored) ?? CHESTS[0].id;
}

let chest: ChestId = readInitial();
const listeners = new Set<() => void>();

export function setChest(next: ChestId) {
  if (next === chest) return;
  chest = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('chest', next);
    window.history.replaceState(null, '', url);
  } catch {
    /* sandboxed frames may refuse history writes */
  }
  listeners.forEach((l) => l());
}

export function useChest(): ChestId {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => chest,
  );
}
