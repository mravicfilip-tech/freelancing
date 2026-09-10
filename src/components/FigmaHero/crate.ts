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

/**
 * The top slab's corners, traced off the artwork itself — the intersections of the rim rails
 * `seg-7` × `seg-69` × `seg-6` × `seg-73` — rather than eyeballed from a screenshot.
 *
 * The front corner is the one that mattered: it sits at y≈184, not the y≈156 this file assumed, so
 * every polygon built from it was 25 units short and floated above the artwork's own edges.
 *
 * The drawing is also NOT a rigid isometric, which is why a single height constant could never fit
 * it: opposite rim edges are not parallel (rear slopes ±0.39/0.43, front ±0.53/0.50), and the
 * vertical edges are ~225 at the front corner against ~185 at the left and right ones. The faces
 * below are built from those measured verticals instead of one shared height.
 */
export const TOP = { t: [205.2, 1.9], r: [398.0, 84.2], f: [199.3, 183.6], l: [3.9, 80.9] } as const;
/** The middle of the slab — where the lid parts from the body, and so where everything comes from. */
export const SEAM = { x: (TOP.l[0] + TOP.r[0]) / 2, y: (TOP.t[1] + TOP.f[1]) / 2 };
/** The rear corner, which the lid swings about. */
export const HINGE = `${TOP.t[0]} ${TOP.t[1] - 26}`;
/** The verticals, measured at the corners they belong to. */
const V_SIDE = 185;
const V_FRONT = 225;
/** How deep a cavity reads before the walls stop carrying a value difference. */
const D = 74;

const pts = (...p: readonly (readonly number[])[]) => p.map(([x, y]) => `${x},${y}`).join(' ');
const lerp = (a: readonly number[], b: readonly number[], k: number) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const down = (p: readonly number[], d: number) => [p[0], p[1] + d];
const unit = (a: readonly number[], b: readonly number[]) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const m = Math.hypot(dx, dy) || 1;
  return [dx / m, dy / m] as const;
};

/** The rim inset to the hole it covers: the lid laps over the box, so the opening is inside it. */
const M = {
  t: lerp(TOP.t, [SEAM.x, SEAM.y], 0.1),
  r: lerp(TOP.r, [SEAM.x, SEAM.y], 0.1),
  f: lerp(TOP.f, [SEAM.x, SEAM.y], 0.1),
  l: lerp(TOP.l, [SEAM.x, SEAM.y], 0.1),
};

export const POLY = {
  top: pts(TOP.t, TOP.r, TOP.f, TOP.l),
  mouth: pts(M.t, M.r, M.f, M.l),
  /* The body's two visible faces, each dropping from its own corner by that corner's own vertical —
     the drawing does not share one height between them. */
  left: pts(TOP.l, TOP.f, down(TOP.f, V_FRONT), down(TOP.l, V_SIDE)),
  right: pts(TOP.f, TOP.r, down(TOP.r, V_SIDE), down(TOP.f, V_FRONT)),

  /* The inside. Looking down into the box you see its two far walls and its floor; the near walls
     are behind the front rim, and the clip to the mouth removes them. */
  wallBack: pts(M.l, M.t, down(M.t, D), down(M.l, D)),
  wallSide: pts(M.t, M.r, down(M.r, D), down(M.t, D)),
  floor: pts(down(M.t, D), down(M.r, D), down(M.f, D), down(M.l, D)),

  /* The lid's thickness, along the two edges that face the viewer. */
  lipLeft: pts(TOP.l, TOP.f, down(TOP.f, 11), down(TOP.l, 11)),
  lipRight: pts(TOP.f, TOP.r, down(TOP.r, 11), down(TOP.f, 11)),
} as const;

/** The lid's panel cut in two down its long diagonal, for the direction that parts it like a hatch. */
export const SPLIT = [pts(M.l, M.t, M.f), pts(M.t, M.r, M.f)] as const;
/** The box's own left and right axes, taken from the measured corners rather than assumed. */
export const AXIS = { left: unit(TOP.f, TOP.l), right: unit(TOP.f, TOP.r) };

/**
 * Where the lid's outer boundary sits directly under `x` — the seam, along the two near edges. The
 * rear edges are the far silhouette and nothing of the body lies above them, so only these matter.
 */
function seamY(x: number): number {
  return x < TOP.f[0]
    ? TOP.l[1] + ((x - TOP.l[0]) * (TOP.f[1] - TOP.l[1])) / (TOP.f[0] - TOP.l[0])
    : TOP.f[1] + ((x - TOP.f[0]) * (TOP.r[1] - TOP.f[1])) / (TOP.r[0] - TOP.f[0]);
}

/**
 * Whether a drawn path belongs to the lid — the removable top — rather than to the body.
 *
 * It samples the path rather than reading its bounding box, because the long rim diagonals run
 * parallel to the seam and their bbox corners fall far below it. The measured gap either side of
 * the cut is wide: the deepest lid path clears the seam by 3, the shallowest body path by 16, so
 * anything from 4 to 15 gives the identical partition.
 *
 * The corner braces are drawn over the top and down the sides as separate paths; this sends their
 * top plates up with the lid and leaves their side plates on the body, which is how a crate's
 * braces actually cap a lid — and it leaves the body's top rim complete.
 */
export function isLid(el: SVGPathElement): boolean {
  const len = el.getTotalLength();
  const n = Math.max(2, Math.ceil(len / 4));
  let drop = -Infinity;
  for (let i = 0; i <= n; i++) {
    const pt = el.getPointAtLength((len * i) / n);
    drop = Math.max(drop, pt.y - seamY(pt.x));
  }
  return drop < 8;
}

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
    `<clipPath id="chest-mouth"><polygon points="${POLY.mouth}"/></clipPath>` +
    `<clipPath id="chest-top"><polygon points="${POLY.top}"/></clipPath>`;
  svg.insertBefore(defs, svg.firstChild);

  // the body, filled — the faces the line work only outlines
  lines.insertBefore(make('polygon', { class: 'chest__face chest__face--right', points: POLY.right }), lines.firstChild);
  lines.insertBefore(make('polygon', { class: 'chest__face chest__face--left', points: POLY.left }), lines.firstChild);

  /* The cavity, clipped to the mouth so nothing can lie over the rim. Two far walls and a floor,
     each a value step apart — that difference is the depth. No black: the light bands of this site
     have no voids, and a hole punched in the page is not a surface the design owns. */
  const cave = make('g', { class: 'chest__cave', 'clip-path': 'url(#chest-mouth)' });
  cave.appendChild(make('polygon', { class: 'chest__floor', points: POLY.floor }));
  cave.appendChild(make('polygon', { class: 'chest__wall chest__wall--back', points: POLY.wallBack }));
  cave.appendChild(make('polygon', { class: 'chest__wall chest__wall--side', points: POLY.wallSide }));
  lines.insertBefore(cave, lines.children[2] ?? null);

  /* The mouth's own edge, and the light that runs round it. One hairline seats the opening — the
     weight every other edge on the page is seated with — and the seam is a short dash on a long gap
     driven at a constant rate, which is how the orbit, the bolt and the payment line each announce
     themselves. The rings fire from the same rim when the latch gives. */
  const rim = make('g', { class: 'chest__rimG' });
  rim.appendChild(make('polygon', { class: 'chest__rim', points: POLY.mouth }));
  const seam = make('polygon', { class: 'chest__seam', points: POLY.mouth }) as SVGPolygonElement;
  rim.appendChild(seam);
  const pings = [0, 1].map(() => {
    const el = make('polygon', { class: 'chest__ping', points: POLY.mouth });
    rim.appendChild(el);
    return el;
  });
  lines.insertBefore(rim, lines.children[3] ?? null);

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

  return { lidG, lidFace, cave, seam, pings };
}
