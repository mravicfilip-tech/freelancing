import { useSyncExternalStore } from 'react';
import { GLOBES } from './components/HeroPlanet/variants';

/**
 * Which treatment the WebGL globe wears, and the in-page switcher that changes it.
 *
 * This lives apart from ./heroVariant because it is only ever read by the pre-Figma hero and its
 * switcher, both of which load on demand. Keeping the store here means GLOBES — and through it the
 * whole HeroPlanet module graph — stays out of the bundle every visitor downloads.
 */
export type GlobeId = (typeof GLOBES)[number]['id'];

const GLOBE_KEY = 'remittix.globe';
const params = new URLSearchParams(window.location.search);

/** `globe-halftone` → `halftone`, `refine-mono` → `mono`: the form used on the URL. */
const shortId = (id: string) => id.replace(/^(globe|refine)-/, '');

function readInitialGlobe(): GlobeId {
  const fromUrl = params.get('globe');
  const match = (v: string | null) => GLOBES.find((g) => g.id === v || shortId(g.id) === v)?.id;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(GLOBE_KEY);
  } catch {
    /* private mode, blocked storage */
  }
  return match(fromUrl) ?? match(stored) ?? GLOBES[0].id;
}

let globe: GlobeId = readInitialGlobe();
const listeners = new Set<() => void>();

export function setGlobe(next: GlobeId) {
  if (next === globe) return;
  globe = next;
  try {
    window.localStorage.setItem(GLOBE_KEY, next);
  } catch {
    /* ignore */
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('globe', shortId(next));
    window.history.replaceState(null, '', url);
  } catch {
    /* sandboxed frames may refuse history writes */
  }
  listeners.forEach((l) => l());
}

export function useGlobe(): GlobeId {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => globe,
  );
}
