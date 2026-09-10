import { createStore } from './store';

/**
 * Dark is the dashboard's home key — it reads as the roadmap/footer sections of
 * the marketing site. Light is the rest of that site: #EDEFF1 and a dot grid.
 */
export const theme = createStore({
  key: 'remittix.dash.theme',
  param: 'theme',
  values: ['dark', 'light'] as const,
  fallback: 'dark',
});

/** Extended shows icon + label in a row; collapsed is the narrow centred rail. */
export const rail = createStore({
  key: 'remittix.dash.rail',
  param: 'rail',
  values: ['extended', 'collapsed'] as const,
  fallback: 'extended',
});

/** Rail treatment under review: icon style plus vertical rhythm. */
export const navStyle = createStore({
  key: 'remittix.dash.nav',
  param: 'nav',
  values: ['1', '2', '3', '4', '5'] as const,
  fallback: '1',
});

/** Header treatment under review: the greeting row and the stat strip. */
export const headStyle = createStore({
  key: 'remittix.dash.head',
  param: 'head',
  values: ['1', '2', '3', '4', '5'] as const,
  fallback: '1',
});
