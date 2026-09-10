/**
 * Which hero direction to render: `?hero=1|2|3`. Also stamped on <html data-hero> for the type system.
 *
 * Deliberately dependency-free. main.tsx imports it before the first paint, so anything reached from
 * here lands in the bundle every visitor downloads — which is why the globe switcher's store, and the
 * HeroPlanet graph behind it, sits in ./globeVariant instead.
 */
const params = new URLSearchParams(window.location.search);
const raw = params.get('hero');
/** On this branch the Figma hero is the default; `?hero=1|2|3` still reaches the earlier directions. */
export const HERO_VARIANT: 'figma' | '1' | '2' | '3' = raw === '1' || raw === '2' || raw === '3' ? raw : 'figma';
document.documentElement.dataset.hero = HERO_VARIANT;

const planet = params.get('planet');
export const PLANET_ENABLED = planet !== 'off';
export const PLANET_STATIC = planet === 'static';
