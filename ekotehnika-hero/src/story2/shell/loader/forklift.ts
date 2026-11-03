// The line drawing of a Linde counterbalance truck for the Nacrt preloader, a side view facing right, in a box 660 wide and 440 high with
// the floor at y 400. Each part is one path with the window of the loading it draws itself in, from a to b as shares of the whole, the
// wheels first, then the chassis, the mast and the tine, the overhead guard and last the seat and the wheel. Every path is one stroke, so
// the draw on is a dash offset on a path of length 1 (pathLength in Nacrt.tsx), and the circles are circles. Plain geometry, there is no
// brand mark in it, the marks on the sheet are the logo files.
export type Part = { d: string; a: number; b: number; w?: number; o?: number };

// a circle as a path, so every part takes the same dash offset
const ring = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

// a tilted ellipse as a closed path of 40 short lines, the steering wheel seen from the side
const ellipse = (cx: number, cy: number, rx: number, ry: number, deg: number) => {
  const r = (deg * Math.PI) / 180;
  const pts = Array.from({ length: 41 }, (_, i) => {
    const t = (i / 40) * Math.PI * 2;
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    return `${(cx + x * Math.cos(r) - y * Math.sin(r)).toFixed(1)} ${(cy + x * Math.sin(r) + y * Math.cos(r)).toFixed(1)}`;
  });
  return `M${pts.join('L')}`;
};

export const FORKLIFT: Part[] = [
  // the floor line the truck stands on
  { d: 'M20 400H640', a: 0, b: 0.12, o: 0.5 },
  // the drive wheel at the front, tyre, rim and hub, and the steer wheel at the back
  { d: ring(392, 358, 42), a: 0.02, b: 0.16, w: 1.5 },
  { d: ring(392, 358, 29), a: 0.06, b: 0.18 },
  { d: ring(392, 358, 11), a: 0.1, b: 0.2 },
  { d: ring(118, 366, 34), a: 0.04, b: 0.18, w: 1.5 },
  { d: ring(118, 366, 22), a: 0.08, b: 0.2 },
  { d: ring(118, 366, 8), a: 0.12, b: 0.22 },
  // the wheel arches
  { d: 'M355 392A50 50 0 1 1 429 392', a: 0.16, b: 0.3 },
  { d: 'M88 392A40 40 0 1 1 148 392', a: 0.16, b: 0.3 },
  // the chassis from the foot of the counterweight over the seat plinth and the dash to the nose, and the underbody between the arches
  { d: 'M88 392H60L52 330Q46 262 88 250L200 238L210 226H312L324 300H372L384 272L424 292L440 330V392H429', a: 0.2, b: 0.42, w: 1.6 },
  { d: 'M148 392H355', a: 0.26, b: 0.36 },
  // the counterweight and the hood, their seams and the rear lamp
  { d: 'M126 246L134 380', a: 0.34, b: 0.44 },
  { d: 'M54 306H206', a: 0.36, b: 0.46 },
  { d: 'M210 250H316M214 264H318', a: 0.38, b: 0.48 },
  { d: 'M54 296H62V320H54Z', a: 0.4, b: 0.46 },
  // the mast, two channels with their cross members and the cap, and the tilt cylinder
  { d: 'M450 392V52H462V392M482 392V52H494V392', a: 0.44, b: 0.62, w: 1.5 },
  { d: 'M462 70H482M462 200H482M462 330H482M446 52H498', a: 0.52, b: 0.64 },
  { d: 'M426 296L452 200M432 298L458 202', a: 0.54, b: 0.64 },
  // the carriage, its backrest and the tine with the bevel at its tip
  { d: 'M498 250H514V392H498Z', a: 0.56, b: 0.66 },
  { d: 'M514 156V250M522 156V250M514 156H522M514 190H522M514 222H522', a: 0.6, b: 0.7 },
  { d: 'M498 380H616L630 392H498', a: 0.58, b: 0.7, w: 1.6 },
  // the overhead guard, two posts at the back and two at the front as tubes, and the roof plate with its slats
  { d: 'M204 100L222 226M212 99L230 226', a: 0.66, b: 0.8 },
  { d: 'M416 86L376 272M424 85L384 272', a: 0.68, b: 0.82 },
  { d: 'M196 94L424 80V86L196 100Z', a: 0.72, b: 0.86, w: 1.5 },
  { d: 'M236 96V90M268 95V89M300 93V87M332 91V85M364 89V83M396 87V81', a: 0.8, b: 0.88 },
  // the seat and its back, the steering wheel and its column
  { d: 'M246 224Q238 170 252 150L272 152Q270 190 282 224', a: 0.8, b: 0.92 },
  { d: 'M246 224Q248 208 270 206H312V226', a: 0.84, b: 0.94 },
  { d: ellipse(350, 210, 24, 6, -38), a: 0.86, b: 0.96 },
  { d: 'M356 216L366 296', a: 0.88, b: 0.97 },
];

// the centre lines through the hubs and the mast, drawn as one faint layer once the truck is there
export const CENTRE = 'M20 358H476M392 300V418M118 324V412M472 30V418';
// the hubs, for a plus mark each
export const HUBS: [number, number][] = [
  [392, 358],
  [118, 366],
];
export const BOX = { w: 660, h: 440, cx: 335, cy: 226 };
