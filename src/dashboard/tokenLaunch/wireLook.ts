import { useEffect, useState } from 'react';
import { INDIGO_WIRE } from './motion';

/**
 * The wire on the light dashboard. The indigo wire's white-hot core, laid on a pale field,
 * disappears and leaves only a purple haze; there the core is a deep indigo and the arcs fewer, so
 * it reads as a crisp live line.
 */
const INDIGO_WIRE_ON_WHITE = { halo: [75, 75, 247], glow: [92, 94, 245], core: [52, 54, 196] };

type Theme = 'light' | 'dark';
const read = (): Theme => (document.documentElement.dataset.dashTheme === 'light' ? 'light' : 'dark');

/** The dashboard's theme, following <html data-dash-theme> as it changes. */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dash-theme'] });
    return () => mo.disconnect();
  }, []);
  return theme;
}

/** The palette and arc rate for a wire, given the theme and how often it arcs on the dark. */
export function wireLook(_host: Element, theme: Theme, arcs = 1) {
  return theme === 'light' ? { palette: INDIGO_WIRE_ON_WHITE, arcs: arcs * 0.35 } : { palette: INDIGO_WIRE, arcs };
}
