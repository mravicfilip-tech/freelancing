/** Which feature-band animation to show: `?fx=1|2|3` (Rise, Wipe, Kinetic). Also stamped on the section as data-fx. */
const raw = new URLSearchParams(window.location.search).get('fx');
export type FxVariant = '1' | '2' | '3';
export const FX_VARIANT: FxVariant = raw === '2' || raw === '3' ? raw : '1';
