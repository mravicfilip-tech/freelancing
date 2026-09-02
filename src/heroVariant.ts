/** Which hero direction to render: `?hero=1|2|3`. Also stamped on <html data-hero> for the type system. */
const params = new URLSearchParams(window.location.search);
const raw = params.get('hero');
export const HERO_VARIANT: '1' | '2' | '3' = raw === '2' || raw === '3' ? raw : '1';
document.documentElement.dataset.hero = HERO_VARIANT;

const planet = params.get('planet');
export const PLANET_ENABLED = planet !== 'off';
export const PLANET_STATIC = planet === 'static';
