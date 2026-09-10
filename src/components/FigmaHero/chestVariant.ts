import { useSyncExternalStore } from 'react';

/**
 * The five directions for the hero's third slide, the line-art chest (Figma node 2767:55).
 *
 * They share the same material — 226 named stroke segments the designer left separated so the crate
 * can be drawn rather than shown, built up into a solid with a cavity and a lid that has thickness.
 * What separates them is how the lid comes off and what the chest does with what is inside it.
 */
export const CHESTS = [
  {
    id: '1',
    label: 'Vault',
    blurb: 'The lid rises, turns on edge and stands behind the box; the contents come up on a shaft of light.',
  },
  {
    id: '2',
    label: 'Hatch',
    blurb: 'The lid parts down its diagonal and the two halves slide back along the box\u2019s own axes.',
  },
  {
    id: '3',
    label: 'Hover',
    blurb: 'The lid lifts and hangs, tilting; the contents circle the crate, passing behind it and in front.',
  },
  {
    id: '4',
    label: 'Pour',
    blurb: 'The lid tips off the front edge and the contents spill over the lip and down past the crate.',
  },
  {
    id: '5',
    label: 'Dissolve',
    blurb: 'The lid comes apart into the lines it was drawn from, which drift off and let the contents up.',
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
