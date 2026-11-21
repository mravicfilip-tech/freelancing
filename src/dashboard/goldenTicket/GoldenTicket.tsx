import { useEffect, useId, useRef, type RefObject } from 'react';
import { electric, fromPolyline, type Electric } from './electric';
import './GoldenTicket.css';

/**
 * Ported from the landing page (remittix-website: src/components/FigmaHero/GoldenTicket.tsx) so the
 * dashboard shows the same ticket. Keep the two in step.
 *
 * The Remittix Golden Ticket, drawn in the campaign creative's style: metallic gold foil with a
 * glitter grain and hot light in its corners, a light rim and an inner frame line, concave cut
 * corners and a notch on each side, fine guilloche lines, and the mark, the wordmark and a big
 * italic "Golden Ticket" embossed in pale gold that glows.
 *
 * It is one SVG in its own 1000 × 410 units, so it is the same ticket at any size, and the
 * dashboard's electric border (electric.ts) is traced on the very outline the SVG is cut to.
 */

const W = 1000;
const H = 410;
const RC = 62; // concave corners
const N = 36; // the side notches
const IN = 22; // the inner frame's inset
const h = H / 2;

/** the ticket's outline, clockwise from the top edge */
const OUTER = `M${RC} 0H${W - RC}A${RC} ${RC} 0 0 0 ${W} ${RC}V${h - N}A${N} ${N} 0 0 0 ${W} ${h + N}V${H - RC}A${RC} ${RC} 0 0 0 ${W - RC} ${H}H${RC}A${RC} ${RC} 0 0 0 0 ${H - RC}V${h + N}A${N} ${N} 0 0 0 0 ${h - N}V${RC}A${RC} ${RC} 0 0 0 ${RC} 0Z`;

/** the inner frame: the same figure, every curve offset inward */
const FRAME = (() => {
  const R = RC + IN;
  const x0 = Math.sqrt(R * R - IN * IN);
  const NN = N + IN;
  const sn = Math.sqrt(NN * NN - IN * IN);
  return `M${x0} ${IN}H${W - x0}A${R} ${R} 0 0 0 ${W - IN} ${x0}V${h - sn}A${NN} ${NN} 0 0 0 ${W - IN} ${h + sn}V${H - x0}A${R} ${R} 0 0 0 ${W - x0} ${H - IN}H${x0}A${R} ${R} 0 0 0 ${IN} ${H - x0}V${h + sn}A${NN} ${NN} 0 0 0 ${IN} ${h - sn}V${x0}A${R} ${R} 0 0 0 ${x0} ${IN}Z`;
})();

/** the same outline as points, for the electric border */
const POINTS: [number, number][] = (() => {
  const pts: [number, number][] = [];
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 6));
    for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
  };
  const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
    const n = Math.max(6, Math.round((Math.abs(a1 - a0) * r) / 6));
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  line(RC, 0, W - RC, 0);
  arc(W, 0, RC, Math.PI, Math.PI / 2);
  line(W, RC, W, h - N);
  arc(W, h, N, -Math.PI / 2, (-3 * Math.PI) / 2);
  line(W, h + N, W, H - RC);
  arc(W, H, RC, -Math.PI / 2, -Math.PI);
  line(W - RC, H, RC, H);
  arc(0, H, RC, 0, -Math.PI / 2);
  line(0, H - RC, 0, h + N);
  arc(0, h, N, Math.PI / 2, -Math.PI / 2);
  line(0, h - N, 0, RC);
  arc(0, 0, RC, Math.PI / 2, 0);
  return pts;
})();

/** light lines sweeping out of the top-right corner, as engraved on the creative's ticket */
const GUILLOCHE = Array.from({ length: 7 }, (_, i) => {
  const o = i * 26;
  return `M${520 + o} ${-10} C ${640 + o} ${120 - o * 0.2}, ${760 + o * 0.4} ${150 + o * 0.6}, ${1010} ${250 + o * 0.9}`;
});

const MARK = [
  'M8.375 10.1057H8.37305V15.4309C8.37302 16.2813 7.68344 16.9709 6.83301 16.9709H5.06934C4.58429 16.9709 4.12762 16.742 3.83691 16.3538L0.307617 11.6389C0.108284 11.3726 5.94423e-05 11.0487 0 10.7161V10.0413C3.95559e-05 9.19085 0.689618 8.50122 1.54004 8.50122H8.375V10.1057Z',
  'M4.17532 3.14357L14.1041 15.9261C14.3958 16.3017 14.8447 16.5214 15.3202 16.5214H17.0367C17.8871 16.5214 18.5765 15.832 18.5765 14.9815V8.86801C18.5765 8.5263 18.4629 8.1943 18.2535 7.92429L12.719 0.788522C12.4274 0.412451 11.9782 0.192383 11.5022 0.192383H5.39143C4.54098 0.192383 3.85156 0.881805 3.85156 1.73225V2.19896C3.85156 2.54105 3.96547 2.8734 4.17532 3.14357Z',
  'M18.3516 7.87219V2.14624C18.3516 1.68975 18.4971 1.24515 18.7671 0.877032C19.1714 0.325716 19.8141 0 20.4978 0H21.2769C21.9602 0 22.6039 0.320107 23.0163 0.864875L32.4099 13.2747C32.6967 13.6537 32.852 14.116 32.852 14.5913V14.6596C32.852 15.1761 32.6575 15.6736 32.3072 16.053C31.9183 16.4744 31.371 16.714 30.7976 16.714H25.7926C25.125 16.714 24.4942 16.4083 24.0805 15.8845L18.821 9.22415C18.5169 8.83911 18.3516 8.36281 18.3516 7.87219Z',
];

/** The type on the ticket, drawn three times: a dark relief under it, the pale gold face, and a
    glow behind — which is how the creative's lettering reads as pressed into the foil and lit. */
/** A fill per piece of the lettering: one colour for all, or the face's gradients, one per piece
    because each is drawn in its own coordinates. */
type Fills = string | { mark: string; brand: string; title: string };
const pick = (f: Fills, k: 'mark' | 'brand' | 'title') => (typeof f === 'string' ? f : f[k]);

function Lettering({ fill, part }: { fill: Fills; part: 'brand' | 'title' }) {
  return part === 'brand' ? (
    <>
      <g transform="translate(150 96) scale(2.85)">
        {MARK.map((d) => (
          <path key={d} d={d} fill={pick(fill, 'mark')} />
        ))}
      </g>
      <text x="268" y="142" fontSize="62" fontWeight="600" letterSpacing="-0.5" fill={pick(fill, 'brand')}>
        Remittix
      </text>
    </>
  ) : (
    /* Set upright at its natural width, then narrowed and slanted by a transform. Stretching the
       glyphs with textLength, and the browser's faked italic (the face has none), both render
       differently in Safari, where they crushed the letters together; a transform draws alike in
       every browser. 0.863 takes its natural 890 units to the 768 the ticket gives it. */
    <text x="0" y="0" transform="translate(124 300) skewX(-12) scale(0.863 1)" fontSize="138" fontWeight="800" letterSpacing="-2" fill={pick(fill, 'title')}>
      Golden Ticket
    </text>
  );
}

/** One line of the lettering with its glow, its relief and its face, as a group that can move. */
function Engraved({ id, part }: { id: string; part: 'brand' | 'title' }) {
  return (
    <g className={`gtk2__${part}`}>
      <g filter={`url(#${id}glow)`} opacity="0.55">
        <Lettering fill="#ffcc5c" part={part} />
      </g>
      <g transform="translate(0 5)" opacity="0.55">
        <Lettering fill="#4a2a04" part={part} />
      </g>
      <Lettering fill={{ mark: `url(#${id}typeMark)`, brand: `url(#${id}typeBrand)`, title: `url(#${id}typeTitle)` }} part={part} />
    </g>
  );
}

export function GoldenTicket({ ctl, running, drawn = true, className = '' }: { ctl?: RefObject<Electric | null>; running: boolean; drawn?: boolean; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const own = useRef<Electric | null>(null);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    if (!host.current || !fx.current) return;
    const e = electric(fx.current, host.current, {
      pad: 0.14,
      shape: (w) => fromPolyline(POINTS.map(([x, y]) => [(x * w) / W, (y * w) / W])),
      // the creative's edge is a crisp lit rim: the wire hugs it, a surge brightens it rather than
      // throwing it off the edge, and the crackle is in the arcs
      amp: 0.3,
      surgeAmp: 0.25,
      halo: 0.55,
      sparks: false,
      draw: drawn ? 1 : 0,
    });
    own.current = e;
    if (ctl) ctl.current = e;
    return () => {
      e.stop();
      own.current = null;
      if (ctl) ctl.current = null;
    };
  }, [ctl]);

  useEffect(() => {
    own.current?.setRunning(running);
  }, [running]);

  return (
    <div ref={host} className={`gtk2 ${className}`}>
      <span className="gtk2__aura" aria-hidden="true" />
      <svg className="gtk2__art" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          <clipPath id={`${id}c`}>
            <path d={OUTER} />
          </clipPath>
          <linearGradient id={`${id}base`} x1="0" y1="0" x2="1" y2="0.45">
            <stop offset="0" stopColor="#7a4810" />
            <stop offset="0.24" stopColor="#97601a" />
            <stop offset="0.5" stopColor="#b0731c" />
            <stop offset="0.7" stopColor="#d79a33" />
            <stop offset="0.86" stopColor="#a1631a" />
            <stop offset="1" stopColor="#5e3507" />
          </linearGradient>
          <radialGradient id={`${id}hot`} cx="0.8" cy="0.08" r="0.62">
            <stop offset="0" stopColor="#fff6d2" stopOpacity="0.95" />
            <stop offset="0.25" stopColor="#ffd77a" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ffb340" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}warm`} cx="0.1" cy="0.95" r="0.45">
            <stop offset="0" stopColor="#ffd98a" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ffb340" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}shade`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#3a1f00" stopOpacity="0.32" />
          </linearGradient>
          <linearGradient id={`${id}rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffe7a8" />
            <stop offset="0.45" stopColor="#ffcf6a" />
            <stop offset="0.7" stopColor="#c7841f" />
            <stop offset="1" stopColor="#ffe08e" />
          </linearGradient>
          {/* The lettering's gradients and glow are set in fixed coordinates, not as shares of the
              text's box: Safari sizes those from a measure of the text taken before the web font
              loads, and cut the end of "Ticket" off its gold face and its glow. */}
          <linearGradient id={`${id}typeMark`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="17">
            <stop offset="0" stopColor="#fffbea" />
            <stop offset="0.5" stopColor="#ffe9b0" />
            <stop offset="1" stopColor="#f3c862" />
          </linearGradient>
          <linearGradient id={`${id}typeBrand`} gradientUnits="userSpaceOnUse" x1="0" y1="94" x2="0" y2="146">
            <stop offset="0" stopColor="#fffbea" />
            <stop offset="0.5" stopColor="#ffe9b0" />
            <stop offset="1" stopColor="#f3c862" />
          </linearGradient>
          <linearGradient id={`${id}typeTitle`} gradientUnits="userSpaceOnUse" x1="0" y1="-100" x2="0" y2="28">
            <stop offset="0" stopColor="#fffbea" />
            <stop offset="0.5" stopColor="#ffe9b0" />
            <stop offset="1" stopColor="#f3c862" />
          </linearGradient>
          <filter id={`${id}grain`} x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.9  0 0 0 0 0.62  0 0 0 2.6 -1.45" />
          </filter>
          <filter id={`${id}glow`} filterUnits="userSpaceOnUse" x="-60" y="-60" width="1120" height="530">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id={`${id}soft`} x="-5%" y="-10%" width="110%" height="120%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <g clipPath={`url(#${id}c)`}>
          <rect width={W} height={H} fill={`url(#${id}base)`} />
          <rect width={W} height={H} fill={`url(#${id}hot)`} />
          <rect width={W} height={H} fill={`url(#${id}warm)`} />
          <rect className="gtk2__grain" width={W} height={H} filter={`url(#${id}grain)`} />
          <g className="gtk2__lines">
            {GUILLOCHE.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <path className="gtk2__frame" d={FRAME} />
          {/* the lettering, each line glowing, in relief, and lit */}
          <Engraved id={id} part="brand" />
          <Engraved id={id} part="title" />
          <rect width={W} height={H} fill={`url(#${id}shade)`} />
        </g>
        <path className="gtk2__rimGlow" d={OUTER} stroke="#ffd27a" filter={`url(#${id}soft)`} />
        <path className="gtk2__rim" d={OUTER} stroke={`url(#${id}rim)`} />
      </svg>
      <canvas ref={fx} className="gtk2__fx" aria-hidden="true" />
    </div>
  );
}
