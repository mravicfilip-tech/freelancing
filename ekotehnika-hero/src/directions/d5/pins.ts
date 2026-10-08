// Drawing furniture pinned to 3D points. Pins are markers, notes and cards. Dims are dimension
// lines with extension lines. Both fade by story time windows and follow the camera through
// engine.project in the component.

import * as THREE from 'three';
import type { StoryEngine } from '../../three/engine';
import { v } from '../../three/engine';
import { DOCK_X, PICK } from '../../three/warehouse';
import { A_POINT, C_POINT, ZONES } from './story';
import { pillars } from '../../content';

// from, to, rise length, fall length
export type Win = [number, number, number?, number?];
type At = (e: StoryEngine) => THREE.Vector3;

export type Pin = {
  id: string;
  kind: 'marker' | 'note' | 'card' | 'axis';
  at: At;
  win: Win;
  // box offset from the pinned point in px, the box top left for notes and cards, the centre for markers
  dx: number;
  dy: number;
  letter?: string;
  title: string;
  sub?: string;
  // width and height of a note or card box, and where the leader meets it
  w?: number;
  h?: number;
  fx?: number;
  fy?: number;
  // paper tone pins keep their own look on the real scene
  paper?: boolean;
  // text sits left of a marker's dot
  flip?: boolean;
};

export type Dim = {
  id: string;
  ea: THREE.Vector3;
  eb: THREE.Vector3;
  a: THREE.Vector3;
  b: THREE.Vector3;
  label: string;
  win: Win;
};

const fixed = (p: THREE.Vector3): At => () => p;
const servis = pillars.find((p) => p.id === 'servis')!;
const polovni = pillars.find((p) => p.id === 'polovni')!;

const spotAt: At = (e) => {
  const g = e.truck.group;
  const h = g.rotation.y;
  return v(g.position.x + Math.cos(h) * 4.2, 0.03, g.position.z - Math.sin(h) * 4.2);
};
const palletAt: At = (e) => {
  const p = new THREE.Vector3();
  e.truck.anchor.getWorldPosition(p);
  return p.setY(p.y + 0.5);
};

export const pins: Pin[] = [
  // chapter 1, the route markers. Titles and subs are dummy copy.
  { id: 'A', kind: 'marker', at: fixed(A_POINT), win: [0.7, 1.5], dx: 0, dy: -72, letter: 'A', title: 'Novi viljuškari', sub: 'Salon' },
  { id: 'B', kind: 'marker', at: fixed(v(PICK.x, 0, PICK.z)), win: [0.9, 1.5], dx: -64, dy: 70, letter: 'B', title: 'Polica', sub: 'Narudžbina čeka' },
  { id: 'C', kind: 'marker', at: fixed(C_POINT), win: [1.1, 1.5], dx: 0, dy: -72, letter: 'C', title: 'Rampa', sub: 'Isporuka', flip: true },

  // chapter 2, notes on the section
  { id: 'rack', kind: 'note', at: fixed(v(PICK.x, 4.6, PICK.z)), win: [1.85, 2.7], dx: -230, dy: -30, w: 170, h: 60, fx: 1, fy: 0.5, title: 'Polica', sub: 'Najviši nivo' },
  { id: 'pal', kind: 'note', at: palletAt, win: [2.0, 2.75], dx: -250, dy: -120, w: 190, h: 60, fx: 1, fy: 0.5, title: 'Vilice', sub: 'Podižu narudžbinu' },

  // chapter 3, the floor spot
  { id: 'spot', kind: 'note', at: spotAt, win: [3.35, 4.0], dx: 26, dy: -126, w: 232, h: 60, fx: 0, fy: 1, title: 'Svetlosna tačka', sub: 'Upozorava pešake' },

  // chapter 4, the zones
  {
    id: 'zServis',
    kind: 'card',
    at: fixed(v(ZONES.servis[1], 0, ZONES.servis[2] + 0.4)),
    win: [3.8, 4.6],
    dx: 40,
    dy: 8,
    w: 336,
    h: 164,
    fx: 0,
    fy: 0.18,
    letter: 'Z1',
    title: servis.name,
    sub: servis.line,
  },
  {
    id: 'zPolovni',
    kind: 'card',
    at: fixed(v(ZONES.polovni[0], 0, ZONES.polovni[3] - 0.5)),
    win: [3.85, 4.6],
    dx: -376,
    dy: -92,
    w: 336,
    h: 164,
    fx: 1,
    fy: 0.5,
    letter: 'Z2',
    title: polovni.name,
    sub: polovni.line,
  },

  // chapter 5, axis letters
  { id: 'ax', kind: 'axis', at: fixed(v(17, 0.02, 8)), win: [4.7, 5.25], dx: 8, dy: -8, title: 'X' },
  { id: 'ay', kind: 'axis', at: fixed(v(12, 5, 8)), win: [4.7, 5.25], dx: 8, dy: -8, title: 'Y' },
  { id: 'az', kind: 'axis', at: fixed(v(12, 0.02, 3)), win: [4.7, 5.25], dx: 8, dy: -8, title: 'Z' },

  // chapter 6, a plain tag on the real dock
  { id: 'dock', kind: 'note', at: fixed(v(DOCK_X, 4.4, -2)), win: [5.95, 6.7], dx: -330, dy: -10, w: 236, h: 60, fx: 1, fy: 0.5, title: 'Rampa', sub: 'Isporuka za 24 sata', paper: true },
];

const P = (x: number, y: number, z: number) => v(x, y, z);

export const dims: Dim[] = [
  // chapter 0 and 1, the length of the route
  { id: 'len', ea: A_POINT, eb: C_POINT, a: P(2.2, 0, 0.7), b: P(DOCK_X - 0.7, 0, 0.7), label: 'PUT JEDNE PALETE', win: [0.7, 1.5, 0.3, 0.25] },
  // chapter 2, lift height and rack height on the section
  { id: 'lift', ea: P(PICK.x, 0, PICK.z - 0.7), eb: P(PICK.x, 2.92, PICK.z - 0.7), a: P(PICK.x, 0, PICK.z - 2.6), b: P(PICK.x, 2.92, PICK.z - 2.6), label: 'VISINA PODIZANJA', win: [1.95, 2.7] },
  { id: 'rackH', ea: P(PICK.x, 0, PICK.z - 0.7), eb: P(PICK.x, 4.6, PICK.z - 0.7), a: P(PICK.x, 0, PICK.z - 1.5), b: P(PICK.x, 4.6, PICK.z - 1.5), label: 'POLICA', win: [1.95, 2.7] },
  // chapter 4, the two zones
  { id: 'zP', ea: P(ZONES.polovni[0], 0, ZONES.polovni[3]), eb: P(ZONES.polovni[1], 0, ZONES.polovni[3]), a: P(ZONES.polovni[0], 0, ZONES.polovni[3] + 1.3), b: P(ZONES.polovni[1], 0, ZONES.polovni[3] + 1.3), label: 'ZONA POLOVNIH', win: [3.95, 4.6] },
  // chapter 5, a height on the racks
  { id: 'H', ea: P(DOCK_X, 4.1, 0.15), eb: P(DOCK_X, 0, 0.15), a: P(DOCK_X, 4.1, 1.7), b: P(DOCK_X, 0, 1.7), label: 'VISINA RAMPE', win: [4.8, 5.3] },
];
