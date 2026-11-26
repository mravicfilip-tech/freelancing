// The Polovni shop's data, Filip 26 November, "create a new filter for polovni ... a standalone shop but access by filtering"
// (studio briefs/polovni, the hardened kickoff, "go"). Its machines live in polovni.json, written by the polovni-oglas skill from an ad
// on mojauto.rs or polovniautomobili.com and the client's answers. A used forklift sits in one of the shop's own categories, any other
// machine, like a tractor, in a group of its own (groups in polovni.json). The menu's Polovni link points here only once a machine the
// client confirmed as Ekotehnika's own is on sale (usedLive.ts), until then it keeps its old address on ekotehnika.rs.
import data from './polovni.json';
import { CATEGORIES, fmt } from './data';

export type UsedStatus = 'na-stanju' | 'prodato' | 'primer';

export type UsedItem = {
  slug: string;
  // na-stanju is on sale, prodato leaves the list and its page says so, primer is a sample to show the template, never a real offer
  status: UsedStatus;
  // the client confirmed the ad is Ekotehnika's own, so its text and photos may be used
  confirmed: boolean;
  title: string;
  brand: string | null;
  kind: string;
  // a shop category slug for a forklift, or a group of polovni.json for any other machine
  group: string;
  year: number | null;
  hours: number | null;
  kg: number | null;
  mm: number | null;
  power: string | null;
  location: string | null;
  // in euros, null shows Cena na upit
  price: number | null;
  // whether the price holds PDV, sa or bez, null when the client has not said
  pdv: 'sa' | 'bez' | null;
  photos: string[];
  text: string[];
  specs: [string, string][];
  equipment: string[];
  source: { site: string; href: string; id: string | null; read: string } | null;
};

export const USED = data.items as unknown as UsedItem[];
const GROUPS = data.groups as { slug: string; name: string }[];

// the machines the list shows, every one not yet sold
export const usedOnSale = USED.filter((u) => u.status !== 'prodato');
export const usedOf = (slug: string) => USED.find((u) => u.slug === slug);
export const hrefUsed = (u: UsedItem) => `/prodavnica/polovni/${u.slug}`;
export const groupName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? GROUPS.find((g) => g.slug === slug)?.name ?? slug;

// "1 mašina", "2 mašine", "5 mašina", Serbian counting
export const masina = (n: number) => {
  const a = n % 10;
  const b = n % 100;
  return `${n} ${a === 1 && b !== 11 ? 'mašina' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'mašine' : 'mašina'}`;
};

export const priceOf = (u: UsedItem) => (u.price === null ? 'Cena na upit' : `${fmt(u.price)} €`);
export const pdvOf = (u: UsedItem) => (u.price === null || u.pdv === null ? null : u.pdv === 'sa' ? 'sa PDV-om' : 'bez PDV-a');

// the inquiry for one machine, Kupovina with the machine named in the message
export const askUsed = (u: UsedItem) =>
  `/kontakt?tema=kupovina&poruka=${encodeURIComponent(`Zanima me polovni ${u.kind.toLowerCase()} ${u.title}${u.year ? `, ${u.year}. godište` : ''}.`)}`;
