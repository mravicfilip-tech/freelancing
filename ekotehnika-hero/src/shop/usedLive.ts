// Whether the Polovni shop has a machine on sale that the client confirmed as Ekotehnika's own. The menu, the phone's menu sheet and the
// footer point their Polovni link to /prodavnica/polovni only then, until then they keep the old used page on ekotehnika.rs. Kept apart
// from used.ts so the first page load reads one flag and not the shop's data.
import data from './polovni.json';

export const USED_LIVE = (data.items as { status: string; confirmed: boolean }[]).some((u) => u.status === 'na-stanju' && u.confirmed);
export const USED_HREF = '/prodavnica/polovni';
export const OLD_USED_PATH = '/polovni-linde-viljuskari/';
