// Copy for Direction 1. Lines marked dummy are placeholder copy for the prototype.
import { hero, pillars, trust, SITE } from '../../content';

const servis = pillars.find((p) => p.id === 'servis')!;
const najam = pillars.find((p) => p.id === 'najam')!;

export type Chapter = {
  time: string;
  tag: string;
  ghost: string;
  title: string[];
  body: string;
  link?: { label: string; href: string };
};

// Index is the beat. Chapter 0 and 8 render their own layouts, the rest share one.
export const chapters: Chapter[] = [
  { time: '02:14', tag: 'Noćna smena', ghost: 'NOĆNA SMENA', title: ['Linde', 'viljuškari.'], body: hero.headline[1] },
  {
    time: '02:14',
    tag: 'Zastoj',
    ghost: 'ZASTOJ',
    // dummy
    title: ['Viljuškar', 'staje usred', 'prolaza.'],
    // dummy
    body: 'Noćna smena je u punom toku. Viljuškar klijenta staje sa paletom na vilicama, a isporuka čeka.',
  },
  {
    time: '02:16',
    tag: 'Hitan servis',
    ghost: 'HITNO',
    // dummy
    title: ['Poziv', 'u 02:16.'],
    // dummy
    body: 'Jedan telefonski poziv i servis kreće. Zamenski viljuškar je već na putu do vaše rampe.',
  },
  {
    time: '02:40',
    tag: 'Najam',
    ghost: 'NAJAM',
    // dummy
    title: ['Zamena', 'stiže na rampu.'],
    body: `${najam.line} Zamenski Linde viljuškar radi dok vaš čeka popravku.`,
    link: { label: najam.more, href: najam.href },
  },
  {
    time: '03:05',
    tag: 'Preuzimanje',
    ghost: 'ZAMENA',
    // dummy
    title: ['Paleta', 'menja vilice.'],
    // dummy
    body: 'Crveni Linde preuzima paletu tamo gde je stala i vraća posao u tok.',
  },
  {
    time: '03:20',
    tag: 'Nastavak',
    ghost: 'POSAO TEČE',
    // dummy
    title: ['Smena', 'ne staje.'],
    // dummy
    body: 'Paleta stiže do mesta isporuke, a pokvareni viljuškar ide pravo na servis.',
  },
  {
    time: '04:10',
    tag: 'Servis',
    ghost: 'SERVIS',
    // dummy
    title: ['Na servisnom', 'liftu.'],
    body: servis.line,
    link: { label: servis.cta, href: servis.href },
  },
  {
    time: '06:00',
    tag: 'Zora',
    ghost: 'ZORA',
    // dummy
    title: ['Zora.', 'Spremni za smenu.'],
    // dummy
    body: `${trust[3].text}, da viljuškar stigne na posao pre prvog kamiona.`,
  },
  { time: '06:00', tag: 'Ekotehnika', ghost: 'LINDE', title: ['Spremni i', 'noću.'], body: hero.sub },
];

export const links = [
  { label: 'Novi', href: `${SITE}/viljuskari/` },
  { label: 'Polovni', href: `${SITE}/polovni-linde-viljuskari/` },
  { label: 'Najam', href: `${SITE}/iznajmljivanje-viljuskara-cena/` },
  { label: 'Servis', href: `${SITE}/servis/odrzavanje-i-popravka/` },
  { label: 'Kontakt', href: `${SITE}/kontakt/` },
];

// The tags pinned to 3D objects. win is the beat range each tag shows in.
export type TagDef = {
  id: string;
  label: string;
  sub: string;
  target: 'broken' | 'red' | 'pallet' | 'dock' | 'lift' | 'van';
  rise: number;
  dx: number;
  dy: number;
  win: [number, number];
};

export const tags: TagDef[] = [
  { id: 'a', label: 'Prekid rada', sub: 'Viljuškar klijenta', target: 'broken', rise: 2.9, dx: -84, dy: -70, win: [1.0, 1.82] },
  { id: 'b', label: 'Paleta', sub: 'Roba čeka', target: 'pallet', rise: 1.15, dx: 70, dy: -60, win: [1.0, 1.82] },
  { id: 'c', label: 'Oštećeni viljuškar', sub: 'Zastoj u prolazu', target: 'broken', rise: 1.0, dx: 36, dy: 96, win: [2.0, 2.82] },
  { id: 'd', label: 'Rampa', sub: 'Pravac zamene', target: 'dock', rise: 3.9, dx: -50, dy: 90, win: [2.0, 2.82] },
  { id: 'l', label: 'Rampa', sub: 'Pravac zamene', target: 'dock', rise: 4.4, dx: -150, dy: -50, win: [3.0, 3.82] },
  { id: 'e', label: 'Zamenski viljuškar', sub: 'Linde', target: 'red', rise: 2.3, dx: 80, dy: -70, win: [3.0, 3.82] },
  { id: 'k', label: 'Zamenski viljuškar', sub: 'Linde', target: 'red', rise: 2.3, dx: -84, dy: -76, win: [4.0, 5.82] },
  { id: 'f', label: 'Paleta preuzeta', sub: 'Na vilicama', target: 'pallet', rise: 1.2, dx: 56, dy: -76, win: [4.0, 5.82] },
  { id: 'g', label: 'Na servis', sub: 'Pokvaren viljuškar', target: 'broken', rise: 1.0, dx: 34, dy: 92, win: [5.0, 5.82] },
  { id: 'h', label: 'Servisni lift', sub: 'Pregled i popravka', target: 'lift', rise: 3.3, dx: 72, dy: -64, win: [6.0, 6.82] },
  { id: 'i', label: 'Servisno vozilo', sub: 'Širom Srbije', target: 'van', rise: 2.2, dx: -120, dy: -70, win: [7.0, 7.82] },
  { id: 'j', label: 'Rampa', sub: 'Smena se nastavlja', target: 'dock', rise: 3.9, dx: -60, dy: -64, win: [7.0, 7.82] },
];
