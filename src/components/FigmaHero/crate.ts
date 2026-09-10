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
/** The rear corner, which the lid swings about. It is a corner of the slab, not a point 26 units
 *  above one: a pivot in mid-air is not a hinge, and by the time the old one was used the lid had
 *  already been lifted 124 units clear of it. */
export const HINGE = `${TOP.t[0]} ${TOP.t[1]}`;

/**
 * The lid's tilt, as this drawing understands one.
 *
 * A 2D `rotation` spins the slab in the picture plane. That cannot foreshorten, so an isometric
 * rhombus turned this way keeps its full width at every angle and reads as a plate spinning rather
 * than a lid opening — and all four of its corners move, where a hinge has two that never do. At
 * 62° the measured result put the lid's left corner *inside* the box's left face and its right
 * corner 230 units above the top of the frame, which is what "the top part is not in sync with the
 * bottom" looks like.
 *
 * A tilt about a real edge is an affine map, so it is one matrix. Take the hinge edge `U` and the
 * edge across it `V`, both from the back corner. Turning by φ leaves everything along `U` alone and
 * takes the `V` component to `V·cos φ`, lifted by `κ|V|·sin φ` — κ being how much screen height a
 * unit of real height buys in this projection (2/√5 for the 2:1 dimetric the file is drawn in).
 * The hinge edge is fixed by construction, and the front corner's first movement is straight up.
 */
const H = TOP.t;
const U = [TOP.r[0] - H[0], TOP.r[1] - H[1]] as const;
const V = [TOP.l[0] - H[0], TOP.l[1] - H[1]] as const;
const KV = (2 / Math.sqrt(5)) * Math.hypot(V[0], V[1]);
const DET = U[0] * V[1] - V[0] * U[1];

/** The SVG matrix that tilts the lid by `phi` radians about the box's own back-right rim edge. */
export function tiltMatrix(phi: number): string {
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const vx = V[0] * c;
  const vy = V[1] * c - KV * s;
  const a = (U[0] * V[1] - vx * U[1]) / DET;
  const b = (U[1] * V[1] - vy * U[1]) / DET;
  const cc = (U[0] * (vx - V[0])) / DET;
  const d = (-U[1] * V[0] + vy * U[0]) / DET;
  return `matrix(${a} ${b} ${cc} ${d} ${H[0] - (a * H[0] + cc * H[1])} ${H[1] - (b * H[0] + d * H[1])})`;
}
/**
 * How thick the lid is. This is the fact the file was built without: the drawing is not a flat
 * plate on a box, it is a slab sitting on an open body, and the slab has a measurable depth —
 * 18.60 at the left corner (`seg-68`), 18.66 at the right (`seg-74`), 17.87 at the front, where
 * the two underside rails meet at (194, 208.5).
 */
const LID = 18.5;
/** The verticals, measured at the corners they belong to — from the body's rim, so a slab less. */
const V_SIDE = 185 - LID;
const V_FRONT = 225 - LID;
/** How deep a cavity reads before the walls stop carrying a value difference. */
const D = 74;

const pts = (...p: readonly (readonly number[])[]) => p.map(([x, y]) => `${x},${y}`).join(' ');
const down = (p: readonly number[], d: number) => [p[0], p[1] + d];
const unit = (a: readonly number[], b: readonly number[]) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const m = Math.hypot(dx, dy) || 1;
  return [dx / m, dy / m] as const;
};

/**
 * The rim the artwork actually draws — the inner edge of the lid's perimeter strap, taken as the
 * intersection of `seg-18 × seg-54 × seg-17 × seg-60` rather than guessed.
 *
 * It replaces a 10% lerp toward the centre, which could never be right: the slab's diagonals are
 * 395.9 and 180.9, so one proportion insets the sides by 19.8 and the front and back by 9.0 — a
 * strap more than twice as wide at the sides as at the ends. The drawn strap is a constant
 * 12–16 units perpendicular the whole way round, which is what a strap is.
 */
const PANEL = { t: [203.9, 15.5], r: [363.0, 82.7], f: [197.6, 163.4], l: [39.1, 79.1] } as const;
/** The opening in the body: that same rim, one slab-depth down, which is where the lid seats. */
const MOUTH = {
  t: down(PANEL.t, LID),
  r: down(PANEL.r, LID),
  f: down(PANEL.f, LID),
  l: down(PANEL.l, LID),
};

export const POLY = {
  top: pts(TOP.t, TOP.r, TOP.f, TOP.l),
  mouth: pts(MOUTH.t, MOUTH.r, MOUTH.f, MOUTH.l),
  /* The body's two visible faces. They start at the body's own rim — a slab below the lid's — not
     at the lid's silhouette: built from `TOP` the body's fill and its rim stood 18.5 units above
     the rim the artwork draws, hanging in the air over a corner post whose top is at y=209. That
     is the plate that sat proud of the crate. Each drops by its own corner's vertical, since the
     drawing does not share one height between them. */
  left: pts(down(TOP.l, LID), down(TOP.f, LID), down(TOP.f, LID + V_FRONT), down(TOP.l, LID + V_SIDE)),
  right: pts(down(TOP.f, LID), down(TOP.r, LID), down(TOP.r, LID + V_SIDE), down(TOP.f, LID + V_FRONT)),

  /* The inside. Looking down into the box you see its two far walls and its floor; the near walls
     are behind the front rim, and the clip to the mouth removes them. */
  wallBack: pts(MOUTH.l, MOUTH.t, down(MOUTH.t, D), down(MOUTH.l, D)),
  wallSide: pts(MOUTH.t, MOUTH.r, down(MOUTH.r, D), down(MOUTH.t, D)),
  floor: pts(down(MOUTH.t, D), down(MOUTH.r, D), down(MOUTH.f, D), down(MOUTH.l, D)),

  /* The lid's thickness, along the two edges that face the viewer — its own measured depth. At 11
     the fill stopped 7.5 short of the underside the export draws, so the slab's bottom rail ran
     across nothing. */
  lipLeft: pts(TOP.l, TOP.f, down(TOP.f, LID), down(TOP.l, LID)),
  lipRight: pts(TOP.f, TOP.r, down(TOP.r, LID), down(TOP.f, LID)),
} as const;

/** The lid's panel cut in two down its long diagonal, for the direction that parts it like a hatch. */
export const SPLIT = [pts(PANEL.l, PANEL.t, PANEL.f), pts(PANEL.t, PANEL.r, PANEL.f)] as const;
/** The box's own left and right axes, taken from the measured corners rather than assumed. */
export const AXIS = { left: unit(TOP.f, TOP.l), right: unit(TOP.f, TOP.r) };

/**
 * Where the lid's UNDERSIDE sits directly below `x` — the rails the export draws along the slab's
 * two near edges, `seg-79` on the left and `seg-81` on the right, read as full lines. They cross at
 * (196.85, 202.68), and that crossing is the front corner of the parting line.
 *
 *   seg-79  (38.5, 118) → (153.5, 179.5)
 *   seg-81  (367.5, 118) → (234.5, 184)
 */
const UNDER_L = { m: 0.534783, c: 97.412 } as const;
const UNDER_R = { m: -0.496241, c: 300.368 } as const;
function underY(x: number): number {
  return Math.min(UNDER_L.m * x + UNDER_L.c, UNDER_R.m * x + UNDER_R.c);
}

/**
 * Whether a drawn path belongs to the lid — the removable slab — rather than to the body.
 *
 * The fence is the lid's own underside, because that is where the two pieces actually part. The
 * rule this replaces measured against the lid's TOP plane and cut a whole level too high: it left
 * the slab's own bottom edge, all six corner-brace side plates and both corner verticals on the
 * body, so the lid came off as a bare panel and the body kept the lid's frame. 81 paths went up
 * where 109 belong.
 *
 * It samples rather than reading a bounding box, because the rails run parallel to the cut and
 * their bbox corners fall far below it. The margin is wide: the deepest lid path hangs 9.6 below
 * the underside, where the left brace wraps its corner, and the shallowest body path starts 18.3
 * below it — so anything from 10 to 18 gives the identical partition.
 */
export function isLid(el: SVGPathElement): boolean {
  const len = el.getTotalLength();
  const n = Math.max(2, Math.ceil(len / 4));
  let drop = -Infinity;
  for (let i = 0; i <= n; i++) {
    const pt = el.getPointAtLength((len * i) / n);
    drop = Math.max(drop, pt.y - underY(pt.x));
  }
  return drop < 14;
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

  /* Each face is a gradient rather than one flat value, so light has a direction on the object: it
     falls from the rear-left, which is where every other scene on this page lights from. The stops
     are tokens, so a theme sets the ladder — on a light page the two ends of each face are the same
     value and the crate stays the flat white plate the design draws. */
  const ramp = (id: string, a: string, b: string, x2: string, y2: string) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">` +
    `<stop offset="0" class="chest__gs chest__gs--${a}"/><stop offset="1" class="chest__gs chest__gs--${b}"/></linearGradient>`;

  const defs = make('defs', {});
  defs.innerHTML =
    `<clipPath id="chest-mouth"><polygon points="${POLY.mouth}"/></clipPath>` +
    `<clipPath id="chest-top"><polygon points="${POLY.top}"/></clipPath>` +
    ramp('chest-gTop', 'topA', 'topB', '0.55', '1') +
    ramp('chest-gLeft', 'leftA', 'leftB', '0.2', '1') +
    ramp('chest-gRight', 'rightA', 'rightB', '0.35', '1') +
    /* What is inside is lit from what is inside: the crate carries value, and the light it throws
       up out of the mouth is the same indigo everything in transit on this site is drawn in. */
    `<radialGradient id="chest-gGlow" cx="0.5" cy="0.62" r="0.72">` +
    `<stop offset="0" class="chest__gs chest__gs--glowA"/><stop offset="1" class="chest__gs chest__gs--glowB"/></radialGradient>`;
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
  // the light in the box, laid over its walls and floor and clipped to the mouth with them
  cave.appendChild(make('polygon', { class: 'chest__glow', points: POLY.mouth }));
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
