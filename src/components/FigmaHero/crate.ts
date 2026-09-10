/**
 * The crate's geometry, and the furniture built into the export around it.
 *
 * The Figma export (node 2767:55) is 226 stroke segments and nothing else — no fills, no interior,
 * no thickness. Left that way it is a wireframe: light meant for the opening shows through every
 * panel, the lid is a sheet of paper, and the hole under it is a flat dark rhombus lying on top of
 * the box rather than a cavity you can see into. Everything here exists to make it a solid object.
 *
 * All coordinates are in the export's own 401.5 × 406 viewBox, measured off the drawing: the top
 * face is a rhombus with corners at (204,6) (400,82) (204,156) (2,80), and the crate bottoms out at
 * y = 405, which makes it a regular isometric solid 249 tall.
 */

export const NS = 'http://www.w3.org/2000/svg';

/** The lid's outer rim. */
export const TOP = { t: [204, 6], r: [400, 82], f: [204, 156], l: [2, 80] } as const;
/** The middle of it — where the lid parts from the body, and so where everything comes from. */
export const SEAM = { x: 204, y: 81 };
/** The rear corner, which the lid swings about. */
export const HINGE = '204 30';
/** How far the box falls away below the rim. */
const H = 249;
/** How deep a cavity reads before the dark stops carrying detail. */
const D = 78;
/** The lid's own thickness, as a slab rather than a sheet. */
const T = 11;

const pts = (...p: number[][]) => p.map(([x, y]) => `${x},${y}`).join(' ');
/** The rim inset to the hole it covers: the lid laps over the box, so the opening is inside it. */
const inset = (k: number) => {
  const c = [SEAM.x, SEAM.y];
  const m = ([x, y]: readonly number[]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k];
  return { t: m(TOP.t), r: m(TOP.r), f: m(TOP.f), l: m(TOP.l) };
};
const M = inset(0.9);

export const POLY = {
  top: pts([...TOP.t], [...TOP.r], [...TOP.f], [...TOP.l]),
  mouth: pts(M.t, M.r, M.f, M.l),
  left: pts([...TOP.l], [...TOP.f], [TOP.f[0], TOP.f[1] + H], [TOP.l[0], TOP.l[1] + H]),
  right: pts([...TOP.f], [...TOP.r], [TOP.r[0], TOP.r[1] + H], [TOP.f[0], TOP.f[1] + H]),

  /* The inside. Looking down into an isometric box you see the two far walls and the floor; the
     near walls are behind the front rim, and the clip to the mouth removes them. Without these the
     opening was a flat dark shape — there was nothing for it to be the opening OF. */
  wallBack: pts(M.l, M.t, [M.t[0], M.t[1] + D], [M.l[0], M.l[1] + D]),
  wallSide: pts(M.t, M.r, [M.r[0], M.r[1] + D], [M.t[0], M.t[1] + D]),
  floor: pts([M.t[0], M.t[1] + D], [M.r[0], M.r[1] + D], [M.f[0], M.f[1] + D], [M.l[0], M.l[1] + D]),

  /* The lid's thickness, along the two edges that face the viewer. A lid that lifts off a box has
     to have an underside, or it reads as a sticker peeling. */
  lipLeft: pts([...TOP.l], [...TOP.f], [TOP.f[0], TOP.f[1] + T], [TOP.l[0], TOP.l[1] + T]),
  lipRight: pts([...TOP.f], [...TOP.r], [TOP.r[0], TOP.r[1] + T], [TOP.f[0], TOP.f[1] + T]),
} as const;

/**
 * The lid's panel cut in two down its long diagonal, for the direction that parts it like a hatch.
 *
 * Two halves rather than four quarters, and sliding rather than hinging, because the drawing is an
 * isometric projection: a piece that slides along one of the box's own axes stays true to it, while
 * a piece that folds up has to foreshorten, and a 2D rotation cannot do that — it just lays the
 * shape flat at an angle, which reads as torn paper rather than an opening lid.
 */
export const SPLIT = [pts(M.l, M.t, M.f), pts(M.t, M.r, M.f)] as const;
/** The box's own left and right axes, as unit steps in the projection. */
export const AXIS = { left: [-0.936, -0.352], right: [0.936, -0.354] } as const;

export const make = (tag: string, attrs: Record<string, string>) => {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

/**
 * Builds the solid around the export's line work, in paint order: the body's faces, the cavity
 * inside them, the light in it, then the strokes the file already had, and last the lid as a slab
 * that can be lifted off in one piece.
 */
export function buildCrate(svg: Element, lidSegs: SVGPathElement[]) {
  const lines = svg.querySelector('#crate-lines');
  if (!lines) return null;

  const defs = make('defs', {});
  defs.innerHTML =
    // the light in the box: hot at the seam, gone by the walls
    `<radialGradient id="chest-inner" cx="50%" cy="40%">` +
    `<stop offset="0" class="chest__innerHot"/><stop offset="1" class="chest__innerCold"/></radialGradient>` +
    // the far wall catches the light; the floor keeps its own dark
    `<linearGradient id="chest-wall" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" class="chest__wallLo"/><stop offset="1" class="chest__wallHi"/></linearGradient>` +
    `<clipPath id="chest-mouth"><polygon points="${POLY.mouth}"/></clipPath>` +
    `<clipPath id="chest-top"><polygon points="${POLY.top}"/></clipPath>`;
  svg.insertBefore(defs, svg.firstChild);

  // the body, filled — the faces the line work only outlines
  lines.insertBefore(make('polygon', { class: 'chest__face chest__face--right', points: POLY.right }), lines.firstChild);
  lines.insertBefore(make('polygon', { class: 'chest__face chest__face--left', points: POLY.left }), lines.firstChild);

  // the cavity, all of it clipped to the mouth so nothing can lie over the rim
  const cave = make('g', { class: 'chest__cave', 'clip-path': 'url(#chest-mouth)' });
  cave.appendChild(make('polygon', { class: 'chest__floor', points: POLY.floor }));
  cave.appendChild(make('polygon', { class: 'chest__wall chest__wall--back', points: POLY.wallBack }));
  cave.appendChild(make('polygon', { class: 'chest__wall chest__wall--side', points: POLY.wallSide }));
  cave.appendChild(make('ellipse', { class: 'chest__innerGlow', cx: String(SEAM.x), cy: String(SEAM.y + 26), rx: '132', ry: '52' }));
  // the shadow the rim casts just inside its own front lip, which is what seats the opening
  cave.appendChild(make('polygon', { class: 'chest__occl', points: POLY.mouth }));
  lines.insertBefore(cave, lines.children[2] ?? null);

  /* The lid: its underside lips first, then its face, then the export's own strokes on top. As one
     group it lifts, tilts and returns without any of its parts drifting from the others. */
  const lidG = make('g', { class: 'chest__lid' });
  lines.appendChild(lidG);
  lidG.appendChild(make('polygon', { class: 'chest__lip chest__lip--left', points: POLY.lipLeft }));
  lidG.appendChild(make('polygon', { class: 'chest__lip chest__lip--right', points: POLY.lipRight }));
  const lidFace = make('polygon', { class: 'chest__face chest__face--top', points: POLY.top });
  lidG.appendChild(lidFace);
  // a sheen that crosses the lid as it opens — clipped to the face, so it never leaves the metal
  const sheenG = make('g', { class: 'chest__sheenClip', 'clip-path': 'url(#chest-top)' });
  sheenG.appendChild(make('rect', { class: 'chest__sheen', x: '-190', y: '-40', width: '110', height: '260', transform: 'skewX(-32)' }));
  lidG.appendChild(sheenG);
  lidSegs.forEach((el) => lidG.appendChild(el));

  return { lidG, lidFace, cave };
}
