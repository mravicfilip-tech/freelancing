import type { Content } from '../../../shared/content';
import { Bracket } from '../../Bracket';
import './hero.css';

// Hero 5, cross section. A ground line runs across the grid a little below the middle. Above it
// sit the headline and the buttons. Below it the trench is cut open in dots, each layer a row of
// dots, the ducts dotted circles with one in bull-red. Every label is a tag with a leader line
// that starts on the tag edge and ends on the part it names, one stroke, one end dot, straight.
// The tag widths are fixed by textLength, so the line starts exactly on the tag edge.

type Dot = { x: number; y: number; r: number; t: 1 | 2 | 3 | 'r'; o?: number };
type Id = 'surface' | 'base' | 'tape' | 'backfill' | 'ducts' | 'sand';

type Geo = {
  w: number;
  h: number;
  slot: [number, number, number]; // left wall, right wall, bottom
  layerEnd: number; // the layer rows stop here, the label column starts after it
  ducts: { cx: number; cy: number; r: number; red: boolean }[];
  rows: Record<'surface' | 'base' | 'backfill' | 'sand', { y: number[]; step: number; r: number; t: 1 | 2 | 3 }>;
  tapeY: number;
  tagX: number;
  label: Record<Id, { y: number; to: [number, number] }>;
  notes: boolean;
  dim: boolean;
};

const DESK: Geo = {
  w: 1376,
  h: 384,
  slot: [350, 710, 366],
  layerEnd: 840,
  ducts: [404, 488, 572, 656].map((cx, i) => ({ cx, cy: 262, r: 30, red: i === 3 })),
  rows: {
    surface: { y: [10, 20, 30], step: 9, r: 2.4, t: 1 },
    base: { y: [44, 56, 68], step: 12, r: 1.9, t: 2 },
    backfill: { y: [92, 107, 122, 137, 152, 167, 182], step: 15, r: 1.4, t: 3 },
    sand: { y: [216, 226, 236, 246, 256, 266, 276, 286, 296, 306, 316, 326, 336, 346, 356], step: 10, r: 1.1, t: 2 },
  },
  tapeY: 199,
  tagX: 868,
  label: {
    surface: { y: 20, to: [630, 20] },
    base: { y: 56, to: [630, 56] },
    backfill: { y: 137, to: [630, 137] },
    tape: { y: 199, to: [630, 199] },
    ducts: { y: 262, to: [686, 262] },
    sand: { y: 336, to: [630, 336] },
  },
  notes: true,
  dim: true,
};

const PHONE: Geo = {
  w: 358,
  h: 340,
  slot: [16, 212, 322],
  layerEnd: 224,
  ducts: [58, 118, 178].map((cx, i) => ({ cx, cy: 218, r: 25, red: i === 2 })),
  rows: {
    surface: { y: [9, 19], step: 8, r: 2.1, t: 1 },
    base: { y: [33, 44, 55], step: 10, r: 1.7, t: 2 },
    backfill: { y: [74, 87, 100, 113, 126, 139], step: 13, r: 1.3, t: 3 },
    sand: { y: [174, 184, 194, 204, 214, 224, 234, 244, 254, 264, 274, 284, 294, 304, 314], step: 9, r: 1, t: 2 },
  },
  tapeY: 157,
  tagX: 232,
  label: {
    surface: { y: 14, to: [150, 14] },
    base: { y: 44, to: [150, 44] },
    backfill: { y: 100, to: [150, 100] },
    tape: { y: 157, to: [150, 157] },
    ducts: { y: 218, to: [203, 218] },
    sand: { y: 290, to: [150, 290] },
  },
  notes: false,
  dim: false,
};

const CHAR = 7.68; // Azeret Mono 12px, advance 0.6em plus 0.04em tracking
const TAG_H = 22;
const f1 = (n: number) => Math.round(n * 10) / 10;

function build(g: Geo) {
  const dots: Dot[] = [];
  const dimX = g.dim ? g.slot[0] - 70 : -100;
  const [sl, sr, sb] = g.slot;
  const rowDots = (ys: number[], x0: number, x1: number, step: number, r: number, t: 1 | 2 | 3, stagger: number) => {
    ys.forEach((y, k) => {
      const off = (k % 2) * stagger;
      for (let x = x0 + off; x <= x1; x += step) dots.push({ x, y, r, t });
    });
  };
  // native ground either side of the cut, sparse and dim
  const soilTop = g.rows.base.y[g.rows.base.y.length - 1] + 12;
  for (let y = soilTop; y < g.h - 8; y += 16) {
    for (let x = 6 + (Math.round(y / 16) % 2) * 8; x < g.layerEnd; x += 16) {
      if (x > sl - 8 && x < sr + 8) continue;
      dots.push({ x, y, r: 0.9, t: 3, o: 0.55 });
    }
  }
  const { surface, base, backfill, sand } = g.rows;
  rowDots(surface.y, 4, g.layerEnd, surface.step, surface.r, 1, 0);
  rowDots(base.y, 4, g.layerEnd, base.step, base.r, 2, base.step / 2);
  rowDots(backfill.y, sl + 10, sr - 10, backfill.step, backfill.r, 3, backfill.step / 2);
  // warning tape, a row of short dashes made of dots
  for (let x = sl + 8, k = 0; x <= sr - 8; x += 5, k++) if (k % 4 !== 3) dots.push({ x, y: g.tapeY, r: 1.5, t: 1 });
  // sand bed, fine dots around the ducts
  sand.y.forEach((y, k) => {
    for (let x = sl + 8 + (k % 2) * 4; x <= sr - 8; x += sand.step) {
      if (g.ducts.some((d) => Math.hypot(x - d.cx, y - d.cy) < d.r + 5)) continue;
      dots.push({ x, y, r: sand.r, t: sand.t });
    }
  });
  // the ducts, two dotted rings each
  g.ducts.forEach((d) => {
    const t = d.red ? 'r' : 1;
    const n = Math.round((2 * Math.PI * d.r) / 8.4);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      dots.push({ x: d.cx + Math.cos(a) * d.r, y: d.cy + Math.sin(a) * d.r, r: 1.9, t });
    }
    const ri = d.r - 10;
    const m = Math.round((2 * Math.PI * ri) / 7);
    for (let k = 0; k < m; k++) {
      const a = (k / m) * Math.PI * 2 + 0.2;
      dots.push({ x: d.cx + Math.cos(a) * ri, y: d.cy + Math.sin(a) * ri, r: 1.2, t, o: 0.8 });
    }
  });
  return { dots: dots.filter((d) => Math.abs(d.x - dimX) > 7), sl, sr, sb };
}

function Section({ c, g, label }: { c: Content; g: Geo; label: string }) {
  const { dots, sl, sr, sb } = build(g);
  const lang = c.lang;
  const layers = c.process.layers;
  const tag = (text: string) => ({ text, w: Math.round(text.length * CHAR - 0.5 + 16) });
  const dimX = sl - 70;
  const note = tag(c.process.note.toLocaleUpperCase(lang));
  return (
    <svg className={`hv5__svg art ${g.dim ? 'hv5__svg--d' : 'hv5__svg--p'}`} viewBox={`0 0 ${g.w} ${g.h}`} role="img" aria-label={label}>
      <line className="hv5__ground" x1="0" y1="0.5" x2={g.w} y2="0.5" />
      <path className="hv5__x" d="M0 -5v11M-5.5 0.5h11" />
      <path className="hv5__x" transform={`translate(${g.w} 0)`} d="M0 -5v11M-5.5 0.5h11" />
      {dots.map((d, i) => (
        <circle key={i} cx={f1(d.x)} cy={f1(d.y)} r={d.r} opacity={d.o} className={`d${d.t}`} />
      ))}
      <path className="hv5__wall" d={`M${sl} ${g.rows.base.y[g.rows.base.y.length - 1] + 12}V${sb}H${sr}V${g.rows.base.y[g.rows.base.y.length - 1] + 12}`} />
      {g.dim ? (
        <g>
          <path className="hv5__line" d={`M${dimX - 6} 0.5h12M${dimX} 0.5V${sb}M${dimX - 6} ${sb}h12`} />
          <rect className="hv5__tag" x={dimX - 30 - note.w} y={sb / 2 - TAG_H / 2} width={note.w} height={TAG_H} />
          <text className="hv5__t" x={dimX - 30 - note.w + 8} y={sb / 2 + 4} textLength={note.w - 16} lengthAdjust="spacing">
            {note.text}
          </text>
          <line className="hv5__line" x1={dimX - 30} y1={sb / 2} x2={dimX} y2={sb / 2} />
          <circle className="hv5__end" cx={dimX} cy={sb / 2} r="3" />
        </g>
      ) : null}
      {layers.map((l) => {
        const id = l.id as Id;
        const p = g.label[id];
        if (!p) return null;
        const tg = tag(l.label.toLocaleUpperCase(lang));
        const nt = g.notes ? l.note.toLocaleUpperCase(lang) : '';
        return (
          <g key={l.id}>
            <line className="hv5__line" x1={g.tagX} y1={p.y} x2={p.to[0]} y2={p.to[1]} />
            <circle className="hv5__end" cx={p.to[0]} cy={p.to[1]} r="3.2" />
            <rect className="hv5__tag" x={g.tagX} y={p.y - TAG_H / 2} width={tg.w} height={TAG_H} />
            <text className="hv5__t" x={g.tagX + 8} y={p.y + 4} textLength={tg.w - 16} lengthAdjust="spacing">
              {tg.text}
            </text>
            {nt ? (
              <text className="hv5__note" x={g.tagX + tg.w + 12} y={p.y + 4} textLength={Math.round(nt.length * CHAR - 0.5)} lengthAdjust="spacing">
                {nt}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function Hero5({ c }: { c: Content }) {
  const label = c.process.layers.map((l) => l.label).join(', ');
  return (
    <section className="hero hv hv5" data-hero="5" aria-labelledby="hv5-title">
      <div className="hv5__in g">
        <div className="hv5__top gc">
          <h1 id="hv5-title" className="hv5__title display">
            <span>{c.hero.split[0]}</span> <span>{c.hero.split[1]}</span>
          </h1>
          <div className="hv5__side">
            <p className="hv5__lede mono-body">{c.hero.lede}</p>
            <div className="hv__cta">
              <Bracket variant="solid" href={c.contact.phoneHref}>{c.ui.call}</Bracket>
              <Bracket href="#contact">{c.ui.send}</Bracket>
            </div>
          </div>
        </div>
        <div className="hv5__fig">
          <Section c={c} g={DESK} label={label} />
          <Section c={c} g={PHONE} label={label} />
          <p className="hv5__depth mono">{c.process.note}</p>
        </div>
      </div>
    </section>
  );
}
