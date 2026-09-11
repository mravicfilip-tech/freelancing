import { useSyncExternalStore } from 'react';
import { DEFAULT_VARIANT, isVariantId, type VariantId } from './phorecast/HeroLogo/variants';

/** Which site to render: Phorecast by default, the Remittix hero via `?site=remittix`. Stamped on <html data-site>. */
const params = new URLSearchParams(window.location.search);
export const SITE: 'phorecast' | 'remittix' = params.get('site') === 'remittix' ? 'remittix' : 'phorecast';
document.documentElement.dataset.site = SITE;

/** `?logo=off` renders the Phorecast hero without the WebGL mark; `?logo=static` forces its reduced-motion frame. */
const logo = params.get('logo');
export const LOGO_ENABLED = logo !== 'off';
export const LOGO_STATIC = logo === 'static';

// ---------- Mark treatment (the in-page switcher) ----------
const VARIANT_KEY = 'phorecast.variant';

function readInitialVariant(): VariantId {
  const fromUrl = params.get('variant');
  if (isVariantId(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(VARIANT_KEY);
    if (isVariantId(stored)) return stored;
  } catch {
    /* private mode, blocked storage */
  }
  return DEFAULT_VARIANT;
}

let variant: VariantId = readInitialVariant();
const listeners = new Set<() => void>();

export function setVariant(next: VariantId) {
  if (next === variant) return;
  variant = next;
  try {
    window.localStorage.setItem(VARIANT_KEY, next);
  } catch {
    /* ignore */
  }
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('variant', next);
    window.history.replaceState(null, '', url);
  } catch {
    /* sandboxed frames may refuse history writes */
  }
  listeners.forEach((l) => l());
}

export function useVariant(): VariantId {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => variant,
  );
}
