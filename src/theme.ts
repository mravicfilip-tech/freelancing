/**
 * Light and dark, stamped on <html data-theme> so every section's token block can answer to it.
 *
 * The choice is the reader's and it is remembered; until they make one the page follows the
 * system. That distinction is kept — 'system' is a real stored value, not the absence of one —
 * so a reader who has never chosen still switches with their OS at dusk, and one who has chosen
 * light on a dark machine keeps light.
 *
 * The first stamp happens at import time, before React mounts and before the first paint, so the
 * page never flashes the wrong ground.
 */
import { useSyncExternalStore } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

const KEY = 'remittix.theme';
const dark = () => window.matchMedia('(prefers-color-scheme: dark)');

function read(): ThemeChoice {
  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  if (fromUrl === 'light' || fromUrl === 'dark') return fromUrl;
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* private mode, blocked storage */
  }
  return 'system';
}

let choice: ThemeChoice = read();
const listeners = new Set<() => void>();

/** What the choice comes to right now — 'system' resolved against the OS. */
export function resolved(): Theme {
  return choice === 'system' ? (dark().matches ? 'dark' : 'light') : choice;
}

function stamp() {
  const t = resolved();
  document.documentElement.dataset.theme = t;
  /* Tells the browser which way to paint form controls, scrollbars and the canvas behind us. */
  document.documentElement.style.colorScheme = t;
}
stamp();

/* Following the system means following it as it changes, not just at load. */
dark().addEventListener('change', () => {
  if (choice !== 'system') return;
  stamp();
  listeners.forEach((l) => l());
});

export function setTheme(next: ThemeChoice) {
  if (next === choice) return;
  choice = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  stamp();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** The reader's choice, as stored — 'system' included. */
export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, () => choice);
}

/** What the page is actually showing. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, resolved);
}
