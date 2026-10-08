// The stops of the fly through, camera keys and the card copy for each stop.
import { hero, pillars, SITE } from '../../content';

export type Vec = [number, number, number];

// A camera key. Target point, azimuth from +z toward -x in degrees, elevation in degrees,
// distance, vertical field of view. stop marks a key the story rests on.
export type Key = { p: number; t: Vec; az: number; el: number; d: number; fov: number; stop?: number };

export const keys: Key[] = [
  { p: 0.0, t: [-56, 2.5, -2], az: 40, el: 26, d: 120, fov: 20, stop: 0 },
  { p: 0.09, t: [-22, 4, -16], az: 30, el: 46, d: 153, fov: 20 },
  { p: 0.17, t: [3, 0.5, -20], az: 38, el: 31, d: 108, fov: 20, stop: 1 },
  { p: 0.255, t: [-26, 0, 18], az: 18, el: 58, d: 195, fov: 20 },
  { p: 0.34, t: [-58, 0.5, 39], az: 40, el: 37, d: 109, fov: 20, stop: 2 },
  { p: 0.425, t: [-4, 1.5, 20], az: 62, el: 22, d: 125, fov: 22 },
  { p: 0.51, t: [44, 1.5, -12], az: 32, el: 33, d: 122, fov: 20, stop: 3 },
  { p: 0.585, t: [50, 0, 14], az: 40, el: 52, d: 156, fov: 20 },
  { p: 0.66, t: [46, 0.5, 38], az: 44, el: 38, d: 96, fov: 20, stop: 4 },
  { p: 0.74, t: [68, 4, 6], az: 28, el: 34, d: 156, fov: 22 },
  { p: 0.82, t: [82, 10, -20], az: 34, el: 17, d: 127, fov: 24, stop: 5 },
  { p: 0.9, t: [40, 2, 0], az: 30, el: 38, d: 299, fov: 22 },
  { p: 1.0, t: [8, 0, 6], az: 32, el: 48, d: 507, fov: 22, stop: 6 },
];

export const stopP = keys.filter((k) => k.stop !== undefined).map((k) => k.p);

export type IconId = 'depo' | 'novi' | 'najam' | 'servis' | 'polovni' | 'hq';

export type Stop = {
  icon: IconId;
  label: string;
  title: string;
  line: string;
  a: { label: string; href: string };
  // where the white hotspot ring sits in the scene
  spot: Vec;
};

const [novi, najam, servis, polovni] = pillars;

export const stops: Stop[] = [
  {
    icon: 'depo',
    label: 'Ekotehnika',
    title: hero.headline.join(' '),
    line: hero.sub,
    // dummy label, the link goes to the home page
    a: { label: 'Pregled usluga', href: SITE },
    spot: [-46, 6, -7.5],
  },
  {
    icon: 'novi',
    label: novi.name,
    // dummy line
    title: 'Novi Linde viljuškari, po meri vašeg skladišta.',
    line: novi.line,
    a: { label: novi.more, href: novi.href },
    spot: [4, 6.2, -21],
  },
  {
    icon: 'najam',
    label: najam.name,
    // dummy line
    title: 'Najam Linde viljuškara, bez čekanja.',
    line: najam.line,
    a: { label: najam.more, href: najam.href },
    spot: [-58, 3.4, 39],
  },
  {
    icon: 'servis',
    label: servis.name,
    // dummy line
    title: 'Servis je srce Ekotehnike, od 1997.',
    line: servis.line,
    a: { label: servis.more, href: servis.href },
    spot: [44, 4, -5],
  },
  {
    icon: 'polovni',
    label: polovni.name,
    // dummy line
    title: 'Linde Approved Trucks, provereni polovni viljuškari.',
    line: polovni.line,
    a: { label: polovni.more, href: polovni.href },
    spot: [46, 5, 38],
  },
  {
    icon: 'hq',
    label: 'Vrčin',
    title: hero.kicker + '.',
    // dummy line, facts from the brief
    line: 'Servis od 1997, Linde viljuškari od 2000, zvanični partner od 2023.',
    // dummy label, the link goes to the home page
    a: { label: 'O nama', href: SITE },
    spot: [79, 16, -13.6],
  },
];

// The last key pulls back to the whole miniature and closes on the opening copy.
export const stopForKey = (s: number) => (s >= stops.length ? 0 : s);
