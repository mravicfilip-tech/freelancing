// Copy and callouts for Anatomija. Lines marked dummy are placeholder copy for the prototype.
// Every figure on the page comes from content.ts or the client facts, nothing here states a spec.

import { pillars } from '../../content';

export const INDEX_NAMES = ['Jarbol', 'Krov i kabina', 'Kontrateg', 'Točkovi', 'Bezbednost', 'Servis'];

export type ChapterCopy = { kicker: string; statement: string; body: string };

// Chapters 1 to 6. Chapter 0 and 7 are written in the component.
export const COPY: Record<number, ChapterCopy> = {
  // dummy
  1: {
    kicker: 'Jarbol i viljuške',
    statement: 'Sve što podiže, klizi jedno kroz drugo.',
    body: 'Jarbol, unutrašnji jarbol i nosač viljuški rade zajedno. Zato se teret diže mirno i precizno, i sa najviše police.',
  },
  // dummy
  2: {
    kicker: 'Zaštitni krov i kabina',
    statement: 'Operater je uvek pod zaštitom.',
    body: 'Zaštitni krov čuva operatera odozgo. Sedište i volan su na dohvat ruke, za dug radni dan sa punom kontrolom.',
  },
  // dummy
  3: {
    kicker: 'Kontrateg',
    statement: 'Teret ispred, protivteg iza.',
    body: 'Kontrateg uravnotežuje težinu tereta na viljuškama. Zato viljuškar stoji čvrsto i kada diže.',
  },
  // dummy
  4: {
    kicker: 'Točkovi',
    statement: 'Sve se oslanja na četiri točka.',
    body: 'Veći točkovi napred nose teret, manji pozadi okreću viljuškar u uskim prolazima.',
  },
  // dummy first sentence, the second line is from content.ts
  5: {
    kicker: 'Bezbednost',
    statement: 'Bezbednost je ugrađena u svaki deo.',
    body: 'Linde viljuškari nose pomoćne sisteme koji štite operatera i ljude oko mašine. Crvena tačka na podu upozorava pešake pre nego što viljuškar stigne.',
  },
  // dummy statement, the body line is the servis pillar from content.ts
  6: {
    kicker: 'Servis',
    statement: 'Počeli smo kao servis. Servis je i danas srce posla.',
    body: pillars.find((p) => p.id === 'servis')!.line,
  },
};

export type Anchor =
  | 'mast' | 'inner' | 'carriage' | 'guard' | 'seat' | 'counterweight' | 'body' | 'chassis'
  | 'w0' | 'w1' | 'w2' | 'w3' | 'spot';

export type Callout = {
  ch: number;
  title: string;
  line: string;
  anchor: Anchor;
  // point in the part's own frame
  at: [number, number, number];
  // top left corner of the label relative to the point, in screen pixels
  ox: number;
  oy: number;
};

// All callout lines are dummy.
export const CALLOUTS: Callout[] = [
  { ch: 1, title: 'Jarbol', line: 'Čvrst spoljni stub po kom sve klizi.', anchor: 'mast', at: [0.94, 2.35, 0.33], ox: -228, oy: -155 },
  { ch: 1, title: 'Unutrašnji jarbol', line: 'Izlazi iz jarbola i diže teret više.', anchor: 'inner', at: [1.03, 2.3, 0], ox: 40, oy: -95 },
  { ch: 1, title: 'Nosač viljuški', line: 'Drži viljuške i vodi ih gore i dole.', anchor: 'carriage', at: [1.1, 1.12, 0.3], ox: 56, oy: -34 },
  { ch: 1, title: 'Viljuške', line: 'Nose paletu.', anchor: 'carriage', at: [2.0, 0.08, 0.28], ox: -150, oy: 55 },

  { ch: 2, title: 'Zaštitni krov', line: 'Čuva operatera odozgo.', anchor: 'guard', at: [-0.07, 2.19, 0.5], ox: 150, oy: -110 },
  { ch: 2, title: 'Sedište', line: 'Mesto za dugu smenu.', anchor: 'seat', at: [-0.38, 1.26, 0], ox: 190, oy: -5 },
  { ch: 2, title: 'Volan', line: 'Na dohvat ruke.', anchor: 'seat', at: [0.28, 1.56, 0], ox: 130, oy: -37 },

  { ch: 3, title: 'Kontrateg', line: 'Teška masa na zadnjem delu.', anchor: 'counterweight', at: [-1.05, 1.12, 0.57], ox: 60, oy: -110 },
  { ch: 3, title: 'Karoserija', line: 'Pokriva pogon i sve što je unutra.', anchor: 'body', at: [0.1, 0.72, -0.555], ox: -230, oy: 40 },

  { ch: 4, title: 'Prednji točkovi', line: 'Nose većinu tereta.', anchor: 'w1', at: [0, 0, -0.13], ox: -70, oy: 100 },
  { ch: 4, title: 'Zadnji točkovi', line: 'Okreću viljuškar u uskom prolazu.', anchor: 'w3', at: [0, 0, -0.11], ox: 30, oy: -140 },
  { ch: 4, title: 'Šasija', line: 'Okvir na koji se sve oslanja.', anchor: 'chassis', at: [0.9, 0.1, -0.55], ox: -250, oy: 70 },

  { ch: 5, title: 'Crvena tačka na podu', line: 'Upozorava pešake pre nego što viljuškar stigne.', anchor: 'spot', at: [0, 0, 0], ox: -230, oy: 40 },
  { ch: 5, title: 'Zaštitni krov', line: 'Prvi sloj zaštite operatera.', anchor: 'guard', at: [-0.07, 2.19, 0.5], ox: 80, oy: -20 },
  { ch: 5, title: 'Kontrateg', line: 'Stabilnost pod teretom.', anchor: 'counterweight', at: [-1.05, 1.12, 0.57], ox: -20, oy: 75 },
];
