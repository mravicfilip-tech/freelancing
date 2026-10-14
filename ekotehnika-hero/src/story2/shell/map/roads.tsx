// The routes of the Mreža map as roads with movement along them, round 5, Filip's "lines need to be like pathways on the road
// that showcase movement, even though it maybe wouldn't be real roads". Five treatments for his board, ?servismap=1&road=1 to 5.
//   1 Cesta     a soft road band with a white centre dash that flows out from the centre
//   2 Trag      a trail of small squares on the page grid's rhythm, flowing out
//   3 Trasa     a road drawn as two hairlines, one service van, a short white bar, driving each one
//   4 Putevi    the routes merge into trunk roads the way a real network does, wider where more towns share them, pulses on them
//   5 Linije    the same network drawn as a transit diagram, 45 and 90 degree runs with round corners, pulses on them
// The dashes move with a CSS animation only, so with reduced motion they stand still.
import type { CSSProperties } from 'react';
import { BASES, TOWNS, km, nearest, type LonLat, type Pt } from './geo';

export const ROAD = (() => {
  const n = Number(new URLSearchParams(window.location.search).get('road'));
  return n >= 1 && n <= 5 ? n : 1;
})();

type Node = { name: string; ll: LonLat };
type Edge = { a: Node; b: Node; load: number };

// a small stable number per name, for which side a road bends to and when its van sets off
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

// Every town on its own road from the centre that covers it.
export function spokes(): Edge[] {
  return TOWNS.map((t) => {
    const b = nearest(t.ll);
    return { a: { name: b.name, ll: b.ll }, b: t, load: 1 };
  });
}

// The roads merge. Nearest towns first, each joins the closest node already on its centre's network that lies nearer the
// centre and costs at most a fifth more than driving straight, so shared stretches become trunk roads.
export function network(): Edge[] {
  const edges: Edge[] = [];
  for (const base of BASES) {
    const root: Node = { name: base.name, ll: base.ll };
    const towns = TOWNS.filter((t) => nearest(t.ll).id === base.id).sort((p, q) => km(p.ll, base.ll) - km(q.ll, base.ll));
    const on: Node[] = [root];
    const parent = new Map<string, Node>();
    for (const t of towns) {
      const direct = km(base.ll, t.ll);
      let best = root;
      let bestD = direct;
      for (const p of on) {
        if (p === root) continue;
        const toBase = km(base.ll, p.ll);
        if (toBase >= direct) continue;
        if (toBase + km(p.ll, t.ll) > 1.2 * direct) continue;
        const d = km(p.ll, t.ll);
        if (d < bestD) {
          best = p;
          bestD = d;
        }
      }
      parent.set(t.name, best);
      on.push(t);
    }
    // the load of a road is the towns it carries, itself and every town hung off it
    const load = new Map<string, number>();
    for (const t of [...towns].reverse()) {
      const l = (load.get(t.name) ?? 0) + 1;
      load.set(t.name, l);
      const p = parent.get(t.name)!;
      if (p !== root) load.set(p.name, (load.get(p.name) ?? 0) + l);
    }
    for (const t of towns) edges.push({ a: parent.get(t.name)!, b: t, load: load.get(t.name) ?? 1 });
  }
  return edges;
}

const f = (n: number) => n.toFixed(1);

// a gentle S bend, so a straight line reads as a road
export function sPath(a: Pt, b: Pt, seed: string) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  const nx = -dy / d;
  const ny = dx / d;
  const off = 0.09 * d * (hash(seed) < 0.5 ? 1 : -1);
  const c1 = [a[0] + dx / 3 + nx * off, a[1] + dy / 3 + ny * off];
  const c2 = [a[0] + (2 * dx) / 3 - nx * off, a[1] + (2 * dy) / 3 - ny * off];
  return `M${f(a[0])} ${f(a[1])}C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(b[0])} ${f(b[1])}`;
}

// a soft single bend for the network, the road leaves its junction and settles into the town
export function qPath(a: Pt, b: Pt, seed: string) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  const off = 0.12 * d * (hash(seed) < 0.5 ? 1 : -1);
  const c = [a[0] + dx / 2 - (dy / d) * off, a[1] + dy / 2 + (dx / d) * off];
  return `M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
}

// 45 degrees first, then straight on, with a round corner of r px
export function octiPath(a: Pt, b: Pt, r = 10) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const sx = Math.sign(dx) || 1;
  const sy = Math.sign(dy) || 1;
  const k = Math.min(ax, ay);
  const corner: Pt = [a[0] + sx * k, a[1] + sy * k];
  if (Math.abs(ax - ay) < 2 || k < 2) return `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;
  const rr = Math.min(r, k * 0.7, Math.abs(ax - ay) * 0.7);
  const inX = corner[0] - (sx * rr) / Math.SQRT2;
  const inY = corner[1] - (sy * rr) / Math.SQRT2;
  const outX = ax > ay ? corner[0] + sx * rr : corner[0];
  const outY = ax > ay ? corner[1] : corner[1] + sy * rr;
  return `M${f(a[0])} ${f(a[1])}L${f(inX)} ${f(inY)}Q${f(corner[0])} ${f(corner[1])} ${f(outX)} ${f(outY)}L${f(b[0])} ${f(b[1])}`;
}

// a path's length, sampled, for the van's run
function lengthOf(d: string) {
  if (typeof document === 'undefined') return 300;
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d);
  return p.getTotalLength();
}

export function Roads({ P }: { P: (ll: LonLat) => Pt }) {
  if (ROAD === 1 || ROAD === 2 || ROAD === 3) {
    const paths = spokes().map((e) => ({ key: e.b.name, d: sPath(P(e.a.ll), P(e.b.ll), e.b.name) }));
    if (ROAD === 1)
      return (
        <g fill="none" strokeLinecap="round">
          {paths.map((p) => (
            <path key={`b${p.key}`} d={p.d} stroke="rgb(255 255 255 / 0.16)" strokeWidth={5} />
          ))}
          {paths.map((p) => (
            <path key={`c${p.key}`} className="sm-flow" d={p.d} stroke="rgb(255 255 255 / 0.9)" strokeWidth={1} strokeDasharray="5 7" strokeLinecap="butt" style={{ '--p': 12 } as CSSProperties} />
          ))}
        </g>
      );
    if (ROAD === 2)
      return (
        <g fill="none">
          {paths.map((p) => (
            <path key={p.key} className="sm-flow" d={p.d} stroke="rgb(255 255 255 / 0.85)" strokeWidth={2} strokeDasharray="2 6" style={{ '--p': 8 } as CSSProperties} />
          ))}
        </g>
      );
    return (
      <g fill="none" strokeLinecap="round">
        {paths.map((p) => (
          <path key={`o${p.key}`} d={p.d} stroke="rgb(255 255 255 / 0.5)" strokeWidth={5} />
        ))}
        {paths.map((p) => (
          <path key={`i${p.key}`} d={p.d} stroke="#000" strokeWidth={3} />
        ))}
        {paths.map((p) => {
          const len = lengthOf(p.d);
          return (
            <path
              key={`v${p.key}`}
              className="sm-van"
              d={p.d}
              stroke="#fff"
              strokeWidth={3}
              strokeLinecap="butt"
              strokeDasharray={`10 ${Math.ceil(len) + 20}`}
              style={{ '--len': len, animationDuration: `${(2.2 + len / 140).toFixed(2)}s`, animationDelay: `${(-hash(p.key) * 4).toFixed(2)}s` } as CSSProperties}
            />
          );
        })}
      </g>
    );
  }
  const edges = network();
  const draw = (e: Edge) => (ROAD === 4 ? qPath(P(e.a.ll), P(e.b.ll), e.b.name) : octiPath(P(e.a.ll), P(e.b.ll)));
  const width = (e: Edge) => (ROAD === 4 ? 1 + 0.75 * Math.sqrt(e.load) : 2);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {edges.map((e) => (
        <path key={`r${e.b.name}`} d={draw(e)} stroke={ROAD === 4 ? 'rgb(255 255 255 / 0.5)' : 'rgb(255 255 255 / 0.62)'} strokeWidth={width(e)} />
      ))}
      {edges.map((e) => (
        <path key={`p${e.b.name}`} className="sm-flow" d={draw(e)} stroke="#fff" strokeWidth={width(e) + 0.5} strokeDasharray="3 21" strokeLinecap="butt" style={{ '--p': 24 } as CSSProperties} />
      ))}
    </g>
  );
}
