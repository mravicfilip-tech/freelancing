// Preloader 2, Nacrt, a blueprint. The page's own grid draws itself on the white sheet from its plus marks, the five verticals and the two
// rules, laid out by the same numbers as the real grid (gridXs in Grid.tsx), and a Linde truck draws itself in fine ink lines in the middle
// of it, part by part, as the loading grows (forklift.ts). A crosshair follows the mouse with a coordinate label in the style of the page's
// own, 44.66 N 20.44 E at the centre, and the numbers move with the mouse. The two logos stand where the top row has them, so when the sheet
// goes they are the page's own logos. At the end the drawing fades and the sheet fades with it, the grid lines stay and the page's grid
// draws over them, so the lines become the page's grid as the scene comes in. The lines are the real grid's black half at the same 18
// percent, on the same pixels.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { gridXs, RULE_BOTTOM, RULE_TOP } from '../Grid';
import { BOX, CENTRE, FORKLIFT, HUBS } from './forklift';
import { INK, outCubic, span, useFrame, type LoaderState } from './state';
import { Readout } from './Readout';

// the shares of the loading the grid draws in, the plus marks first, then the verticals one after the other, then the rules
const PLUS_AT = [0, 0.1];
const VERT_AT = (i: number): [number, number] => [0.04 + i * 0.045, 0.34 + i * 0.045];
const RULE_AT = (row: number, seg: number): [number, number] => [0.3 + row * 0.05 + seg * 0.05, 0.5 + row * 0.05 + seg * 0.05];
const LOGO_AT = [0.04, 0.2];
// the coordinates at the centre of the sheet, Vrčin, and how far a pixel of mouse moves them, in degrees
const LAT = 44.66;
const LON = 20.44;
const PER_PX = 0.0008;

type Draw = { el: SVGPathElement; a: number; b: number };

export function Nacrt({ state }: { state: LoaderState }) {
  const [size, setSize] = useState({ w: state.w, h: state.h });
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const { w, h } = size;
  state.w = w;
  state.h = h;
  const xs = gridXs(w);
  const yB = h - RULE_BOTTOM - 1;
  // the truck stands in the middle of the cell between the two rules, as large as the cell allows
  const scale = Math.min(1.15, (yB - RULE_TOP - 80) / BOX.h, (w - 200) / BOX.w);
  const tx = w / 2 - BOX.cx * scale;
  const ty = (RULE_TOP + yB) / 2 - BOX.cy * scale;

  const draws = useRef<Draw[]>([]);
  const pluses = useRef<SVGGElement[]>([]);
  const logos = useRef<HTMLDivElement>(null);
  const ground = useRef<HTMLDivElement>(null);
  const truck = useRef<SVGGElement>(null);
  const grid = useRef<SVGGElement>(null);
  const centre = useRef<SVGGElement>(null);
  const cross = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const last = useRef('');
  // the crosshair rests on the truck's front wheel until the mouse moves
  const at = useRef({ x: w * 0.62, y: h * 0.45 });

  // a path is drawn by its dash offset, pathLength makes every one of them 1 long
  const add = (a: number, b: number) => (el: SVGPathElement | null) => {
    if (el && !draws.current.some((d) => d.el === el)) draws.current.push({ el, a, b });
  };

  useFrame(state, (s, dt) => {
    for (const d of draws.current) {
      const t = outCubic(span(s.p, d.a, d.b));
      d.el.style.strokeDashoffset = String(1 - t);
      d.el.style.visibility = t <= 0 ? 'hidden' : 'visible';
    }
    pluses.current.forEach((g, i) => {
      if (!g) return;
      const t = outCubic(span(s.p, PLUS_AT[0] + i * 0.004, PLUS_AT[1] + i * 0.004));
      g.style.opacity = String(t);
      g.style.transform = `rotate(${((1 - t) * -90).toFixed(1)}deg)`;
    });
    const out = s.out;
    // the sheet fades first, the drawing and the crosshair go before it, the grid lines last, over the page's own grid drawing on
    if (ground.current) ground.current.style.opacity = String(1 - outCubic(span(out, 0.05, 0.7)));
    if (truck.current) truck.current.style.opacity = String(1 - span(out, 0, 0.4));
    if (centre.current) centre.current.style.opacity = String((0.35 * outCubic(span(s.p, 0.8, 1))) * (1 - span(out, 0, 0.3)));
    if (grid.current) grid.current.style.opacity = String(1 - outCubic(span(out, 0.4, 1)));
    if (logos.current) logos.current.style.opacity = String(outCubic(span(s.p, LOGO_AT[0], LOGO_AT[1])) * (1 - outCubic(span(out, 0.05, 0.7))));
    // the crosshair follows the mouse, a little behind it
    const k = 1 - Math.exp(-14 * dt);
    if (s.moved) {
      at.current.x += (s.cx - at.current.x) * k;
      at.current.y += (s.cy - at.current.y) * k;
    }
    const x = at.current.x;
    const y = at.current.y;
    if (cross.current) {
      cross.current.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      cross.current.style.opacity = String(Math.min(1, s.t / 0.5) * (1 - span(out, 0, 0.3)));
    }
    const text = `${(LAT - (y - s.h / 2) * PER_PX).toFixed(2)} N ${(LON + (x - s.w / 2) * PER_PX).toFixed(2)} E`;
    if (text !== last.current && label.current) {
      last.current = text;
      label.current.textContent = text;
    }
  });

  return (
    <div className="nc">
      <div className="pl-ground" ref={ground} />
      <svg className="nc-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {/* the grid, the black half of each line of the real grid, on the pixel the real line is on */}
        <g ref={grid} fill="none" stroke={INK} strokeOpacity={0.18} strokeWidth={1}>
          {xs.map((x, i) => (
            <path key={`v${i}`} ref={add(...VERT_AT(i))} d={`M${x + 0.5} 0V${h}`} pathLength={1} strokeDasharray="1 1" />
          ))}
          {[RULE_TOP, yB].map((y, row) =>
            [0, 1, 2, 3].map((seg) => (
              <path key={`h${row}${seg}`} ref={add(...RULE_AT(row, seg))} d={`M${xs[seg]} ${y + 0.5}H${xs[seg + 1] + (seg === 3 ? 1 : 0)}`} pathLength={1} strokeDasharray="1 1" />
            )),
          )}
        </g>
        {/* the ten plus marks of the top and bottom rules, 9px with 1px arms, each turning a quarter as it comes in */}
        <g stroke={INK} strokeWidth={1} fill="none">
          {[RULE_TOP, yB].flatMap((y) =>
            xs.map((x, i) => (
              <g
                key={`p${y}${i}`}
                ref={(g) => {
                  if (g && !pluses.current.includes(g)) pluses.current.push(g);
                }}
                style={{ transformOrigin: `${x + 0.5}px ${y + 0.5}px`, transformBox: 'view-box', opacity: 0 }}
              >
                <path d={`M${x - 4} ${y + 0.5}H${x + 5}M${x + 0.5} ${y - 4}V${y + 5}`} />
              </g>
            )),
          )}
        </g>
        <g transform={`translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(3)})`}>
          {/* the lines are 1px to 1.6px on the screen whatever the scale of the drawing */}
          <g ref={centre} fill="none" stroke={INK} strokeWidth={1 / scale} strokeDasharray={`${10 / scale} ${3 / scale} ${2 / scale} ${3 / scale}`} style={{ opacity: 0 }}>
            <path d={CENTRE} />
            {HUBS.map(([x, y]) => (
              <path key={x} d={`M${x - 8} ${y}H${x + 8}M${x} ${y - 8}V${y + 8}`} strokeDasharray="none" />
            ))}
          </g>
          <g ref={truck} fill="none" stroke={INK} strokeLinejoin="round" strokeLinecap="round">
            {FORKLIFT.map((p, i) => (
              <path key={i} ref={add(p.a, p.b)} d={p.d} pathLength={1} strokeDasharray="1 1" strokeWidth={(p.w ?? 1) / scale} strokeOpacity={p.o ?? 0.9} />
            ))}
          </g>
        </g>
      </svg>
      <div className="nc-logos" ref={logos} style={{ '--wm-x': `${xs[1] + 24}px` } as CSSProperties}>
        <img src="/brand/linde-mh.svg" width={160} height={96} alt="" />
        <img src="/brand/ekotehnika.svg" width={160} height={33} alt="" />
      </div>
      <div className="nc-cross" ref={cross} style={{ transform: `translate3d(${at.current.x}px, ${at.current.y}px, 0)`, opacity: 0 }}>
        <i className="nc-hx" />
        <i className="nc-hy" />
        <i className="nc-ring" />
        <span className="nc-label" ref={label}>
          44.66 N 20.44 E
        </span>
      </div>
      <Readout state={state} />
    </div>
  );
}
