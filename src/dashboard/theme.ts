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
