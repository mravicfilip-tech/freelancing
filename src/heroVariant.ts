/** Which hero direction to render: `?hero=1|2|3`. Also stamped on <html data-hero> for the type system. */
const params = new URLSearchParams(window.location.search);
const raw = params.get('hero');
/** On this branch the Figma hero is the default; `?hero=1|2|3` still reaches the earlier directions. */
export const HERO_VARIANT: 'figma' | '1' | '2' | '3' = raw === '1' || raw === '2' || raw === '3' ? raw : 'figma';
document.documentElement.dataset.hero = HERO_VARIANT;

const planet = params.get('planet');
export const PLANET_ENABLED = planet !== 'off';
export const PLANET_STATIC = planet === 'static';

// ---------- Globe treatment (the in-page switcher) ----------
import { useSyncExternalStore } from 'react';
import { GLOBES } from './components/HeroPlanet/variants';

export type GlobeId = (typeof GLOBES)[number]['id'];
const GLOBE_KEY = 'remittix.globe';
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
