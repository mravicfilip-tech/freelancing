/**
 * Tiny URL + localStorage backed store, in the shape `heroVariant.ts` already
 * uses: a module-level value, a listener set, and a `useSyncExternalStore` hook.
 */
import { useSyncExternalStore } from 'react';

type Store<T extends string> = {
  get: () => T;
  set: (next: T) => void;
  use: () => T;
};

export function createStore<T extends string>(opts: {
  key: string;
  param: string;
  values: readonly T[];
  fallback: T;
}): Store<T> {
  const match = (v: string | null): T | undefined =>
    opts.values.find((candidate) => candidate === v);

  let current: T = (() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(opts.key);
    } catch {
      /* private mode, blocked storage */
    }
    const fromUrl = new URLSearchParams(window.location.search).get(opts.param);
    return match(fromUrl) ?? match(stored) ?? opts.fallback;
  })();

  const listeners = new Set<() => void>();

  const set = (next: T) => {
    if (next === current) return;
    current = next;
    try {
      window.localStorage.setItem(opts.key, next);
    } catch {
      /* ignore */
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(opts.param, next);
      window.history.replaceState(null, '', url);
    } catch {
      /* sandboxed frames may refuse history writes */
    }
    listeners.forEach((l) => l());
  };

  return {
    get: () => current,
    set,
    use: () =>
      useSyncExternalStore(
        (l) => {
          listeners.add(l);
          return () => listeners.delete(l);
        },
        () => current,
      ),
  };
}
