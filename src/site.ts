/** Which site to render: Phorecast by default, the Remittix hero via `?site=remittix`. Stamped on <html data-site>. */
const params = new URLSearchParams(window.location.search);
export const SITE: 'phorecast' | 'remittix' = params.get('site') === 'remittix' ? 'remittix' : 'phorecast';
document.documentElement.dataset.site = SITE;

/** `?logo=off` renders the Phorecast hero without the WebGL mark; `?logo=static` forces its reduced-motion frame. */
const logo = params.get('logo');
export const LOGO_ENABLED = logo !== 'off';
export const LOGO_STATIC = logo === 'static';
