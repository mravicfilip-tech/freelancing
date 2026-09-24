// Which theme the page is in, who is allowed to change it, and the one thing
// that has to happen when it does.
//
// The store is deliberately not React state. Two of its consumers are
// imperative: the inline script in index.html sets the theme before React
// exists, and the motion modules read resolved token values inside
// `gsap.context`, nowhere near a component. So the truth lives here, on the
// document element, and React subscribes to it rather than owning it.

import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

/** Absent means "follow the system". Only an explicit choice is written. */
const KEY = 'phorecast-theme';

const root = document.documentElement;

/**
 * Read a resolved custom property.
 *
 * Call this INSIDE a motion module's build/start function, never at module
 * scope, where it would run before the theme is known and never re-read when
 * the theme changes. Pass the dark value as the fallback, so a missing
 * property degrades to the dark theme.
 */
export const tok = (name: string, fallback = ''): string =>
  getComputedStyle(root).getPropertyValue(name).trim() || fallback;

const stored = (): Theme | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    // Safari private mode throws on localStorage rather than returning null.
    return null;
  }
};

const systemTheme = (): Theme =>
  matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

// The inline script in index.html has already written this before first paint;
// reading it back rather than recomputing it means the two can never disagree.
let theme: Theme = root.dataset.theme === 'light' ? 'light' : 'dark';

// Bumped once per ACTUAL change of theme, and never otherwise: section
// rebuilds are keyed off this number, so a spurious bump replays every
// section's entrance. See `useSectionMotion`.
let epoch = 0;

const subscribers = new Set<() => void>();

const subscribe = (fn: () => void) => {
  subscribers.add(fn);
  return () => { subscribers.delete(fn); };
};

/** `media` alone cannot follow an explicit override, so drive the tags by hand. */
function syncMetaColor(next: Theme) {
  for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    m.media = m.dataset.theme === next ? 'all' : 'not all';
  }
}

function apply(next: Theme) {
  if (next === theme && root.dataset.theme === next) return;
  theme = next;
  root.dataset.theme = next;
  syncMetaColor(next);
  epoch++;
  for (const fn of subscribers) fn();
}

/** An explicit choice, which outranks the system setting from now on. */
export function setTheme(next: Theme) {
  try { localStorage.setItem(KEY, next); } catch { /* private mode: session only */ }
  apply(next);
}

export function toggleTheme() {
  setTheme(theme === 'dark' ? 'light' : 'dark');
}

export const getTheme = (): Theme => theme;

// While nothing has been chosen, the system setting still leads. Once it has,
// this listener is inert until the key is cleared.
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (!stored()) apply(systemTheme());
});

// The inline script is the one that matters: it runs before first paint. This
// is the recovery path for the case where it did not run at all (a stripped
// index.html, a test harness mounting the app directly), so the attribute and
// this module still agree.
if (root.dataset.theme !== 'light' && root.dataset.theme !== 'dark') {
  root.dataset.theme = theme = stored() ?? systemTheme();
  syncMetaColor(theme);
}

export const useTheme = (): Theme =>
  useSyncExternalStore(subscribe, () => theme, () => theme);

/**
 * A number that changes when, and only when, the theme does.
 *
 * `useSectionMotion` takes it as a layout-effect dependency. Several motion
 * modules read their resting colours from `getComputedStyle` at build time and
 * cache them for the life of the loop, and `useSectionMotion` otherwise builds
 * a section once. Without this, a theme flip after a section has built leaves
 * its loop settling to dark-mode colours on a light page, silently.
 */
export const useThemeEpoch = (): number =>
  useSyncExternalStore(subscribe, () => epoch, () => epoch);
