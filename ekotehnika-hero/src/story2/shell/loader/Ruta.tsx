// Preloader 4, Ruta, the servis map's language on the white sheet. A dashed road draws on from a pin at Vrčin, the square white point with
// the ink plus of the map, runs across the screen and settles on the line of the hero's own road, and the service van in the LMH red and
// the greys of its wrap drives along it with the loading. The whole route lies on the sheet from the start, very faint, and the dashes fill
// in behind the van like a progress bar (taste 2026-11-03 10:23, the robot path). The mouse moves the layers a little against each other,
// the far graticule least, then the road and the van most. At the end the van drives out on the right, the dashes of the road turn white
// like the lane markings of the hero's road, which is arriving under the sheet at the same height, and the line carries on into it.
// The road is the only part that has to meet the page, so the parallax is back at zero by the time the sheet goes.
import { useEffect, useRef, useState } from 'react';
import { GREY, INK, LMH_RED, lerp, outCubic, span, useFrame, type LoaderState } from './state';
import { Readout } from './Readout';

// where the hero's lane line is on a 900 high screen, 481px, as a share of the height, and where the road joins it
const LANE = 481 / 900;
const JOIN = 0.46;
// the pin at Vrčin, as shares of the width and height
const PIN = { x: 0.13, y: 0.74 };
// how far the layers move with the mouse, in px at the edge of the screen
const FAR = 8;
const NEAR = 16;
const VAN_EXTRA = 8;
// the road runs on this far past the right edge so the van drives out and the dashes carry on into the hero
const RUN_ON = 180;

// the van, a side view facing right, its wheels on y 0, about 160 wide
const VAN_W = 160;

export function Ruta({ state }: { state: LoaderState }) {
  const [size, setSize] = useState({ w: state.w, h: state.h });
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const { w, h } = size;
  const px = Math.round(w * PIN.x);
  const py = Math.round(h * PIN.y);
  const yL = Math.round(h * LANE);
  const xJ = Math.round(w * JOIN);
  const k = Math.round(w * 0.17);
  const d = `M${px} ${py}C${px + k} ${py} ${xJ - k} ${yL} ${xJ} ${yL}H${w + RUN_ON}`;
  const scale = Math.min(1.7, Math.max(1.05, (w / 1440) * 1.35));

  const path = useRef<SVGPathElement>(null);
  const reveal = useRef<SVGPathElement>(null);
  const live = useRef<SVGPathElement>(null);
  const faint = useRef<SVGPathElement>(null);
  const len = useRef(0);
  const ground = useRef<HTMLDivElement>(null);
  const far = useRef<SVGGElement>(null);
  const near = useRef<SVGGElement>(null);
  const van = useRef<SVGGElement>(null);
  const pin = useRef<SVGGElement>(null);
  const pulse = useRef<SVGCircleElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  // the mouse as the layers see it, eased, and let go of in the closing move
  const m = useRef({ x: 0, y: 0 });

  useEffect(() => {
    len.current = path.current?.getTotalLength() ?? 0;
    if (reveal.current) reveal.current.style.strokeDasharray = `${len.current} ${len.current}`;
  }, [d]);

  useFrame(state, (s, dt) => {
    const L = len.current;
    if (!L || !path.current) return;
    const out = s.out;
    // the van is on the road's length that is on screen at the end of the loading, then drives out of the right edge in the closing move
    const onScreen = L - RUN_ON - (w - xJ) * 0.12;
    const dist = lerp(0, onScreen, s.p) + outCubic(span(s.full, 0.02, 0.5)) * (L - onScreen) * 0.999;
    const here = path.current.getPointAtLength(dist);
    const ahead = path.current.getPointAtLength(Math.min(L, dist + 3));
    const back = path.current.getPointAtLength(Math.max(0, dist - 3));
    // the van leans into the climb a little less than the road does, so it reads as driving and not as tipping
    const ang = (Math.atan2(ahead.y - back.y, ahead.x - back.x) * 180) / Math.PI;
    // the dashes show behind the van, and stay once it is gone
    if (reveal.current) reveal.current.style.strokeDashoffset = String(L - Math.min(L, dist + 4));
    // the layers follow the mouse against each other, and are back at rest when the road has to meet the page
    const rest = 1 - span(s.full, 0, 0.18);
    const kk = 1 - Math.exp(-6 * dt);
    m.current.x += (s.mx * rest - m.current.x) * kk;
    m.current.y += (s.my * rest - m.current.y) * kk;
    if (far.current) far.current.style.opacity = String(1 - span(out, 0.1, 0.6));
    if (far.current) far.current.style.transform = `translate3d(${(-m.current.x * FAR).toFixed(2)}px, ${(-m.current.y * FAR * 0.6).toFixed(2)}px, 0)`;
    if (near.current) near.current.style.transform = `translate3d(${(-m.current.x * NEAR).toFixed(2)}px, ${(-m.current.y * NEAR * 0.6).toFixed(2)}px, 0)`;
    if (van.current) {
      const vx = -m.current.x * VAN_EXTRA;
      van.current.setAttribute('transform', `translate(${(here.x + vx).toFixed(1)} ${(here.y + 12 * scale).toFixed(1)}) rotate(${(ang * 0.65).toFixed(2)}) scale(${scale.toFixed(3)})`);
    }
    // the pin shows at once, its ring sends out a pulse once a second
    if (pulse.current) {
      const t = (s.t % 1.2) / 1.2;
      pulse.current.setAttribute('r', String(16 + t * 26));
      pulse.current.style.opacity = String((1 - t) * 0.35 * (1 - span(out, 0, 0.3)));
    }
    if (pin.current) pin.current.style.opacity = String(1 - span(out, 0, 0.35));
    if (tag.current) tag.current.style.opacity = String(1 - span(out, 0, 0.35));
    if (faint.current) faint.current.style.opacity = String(1 - span(out, 0, 0.3));
    // the ground goes first, then the road turns white like the hero's lane markings and fades into the real one
    if (ground.current) ground.current.style.opacity = String(1 - outCubic(span(out, 0.05, 0.7)));
    if (live.current) {
      const white = span(out, 0.05, 0.6);
      live.current.style.stroke = white > 0 ? `rgb(${Math.round(lerp(34, 255, white))} ${Math.round(lerp(34, 255, white))} ${Math.round(lerp(34, 255, white))})` : INK;
      live.current.style.opacity = String(1 - span(out, 0.55, 1));
    }
  });

  return (
    <div className="rt">
      <div className="pl-ground" ref={ground} />
      <svg className="rt-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <defs>
          <pattern id="rt-grat" width={120} height={120} patternUnits="userSpaceOnUse" x={px % 120} y={py % 120}>
            <path d="M56 60H64M60 56V64" stroke={INK} strokeOpacity={0.16} fill="none" />
          </pattern>
          <mask id="rt-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={w + RUN_ON} height={h}>
            <path ref={reveal} d={d} fill="none" stroke="#fff" strokeWidth={14} />
          </mask>
        </defs>
        <g ref={far}>
          <rect x={-40} y={-40} width={w + 80} height={h + 80} fill="url(#rt-grat)" />
        </g>
        <g ref={near}>
          {/* the whole route, faint, and the measuring path the van is placed on */}
          <path ref={faint} d={d} fill="none" stroke={INK} strokeOpacity={0.14} strokeWidth={2} strokeDasharray="2 10" strokeLinecap="butt" />
          <path ref={path} d={d} fill="none" stroke="none" />
          {/* the dashes of the road, revealed behind the van by the mask */}
          <g mask="url(#rt-mask)">
            <path ref={live} d={d} fill="none" stroke={INK} strokeWidth={2} strokeDasharray="6 8" strokeLinecap="butt" />
          </g>
          <g ref={pin} transform={`translate(${px} ${py})`}>
            <circle ref={pulse} r={16} fill="none" stroke={INK} strokeWidth={1} />
            {/* the point of the servis map, a white square with an ink edge and an ink plus */}
            <rect x={-14.5} y={-14.5} width={29} height={29} fill="#fff" stroke={INK} strokeWidth={1} />
            <path d="M-7 0H7M0 -7V7" stroke={INK} strokeWidth={2} />
          </g>
        </g>
        <g ref={van}>
          <Van />
        </g>
      </svg>
      <div className="rt-tag" ref={tag} style={{ left: px - 14, top: py - 66 }}>
        <span className="rt-name">Vrčin</span>
        <span className="rt-geo">44.66 N 20.44 E</span>
      </div>
      <Readout state={state} />
    </div>
  );
}

// The service van in its wrap, silver cab and front, the LMH red rear behind a convex sweep with two grey stripes ahead of it, after
// scenes/sistem/vanWrap.ts. No lettering, the wrap's words are not drawn here.
function Van() {
  return (
    <g strokeLinejoin="round">
      <ellipse cx={0} cy={2} rx={VAN_W / 2 + 6} ry={5} fill={INK} fillOpacity={0.12} />
      {/* the cab and the cargo box in silver, then the red rear over the box */}
      <path d="M-80 -24Q-80 -70 -74 -70H14L44 -70L70 -46L80 -40V-18H-74Q-80 -18 -80 -24Z" fill={GREY.pale} stroke={INK} strokeWidth={1.2} strokeOpacity={0.8} />
      <path d="M-80 -24V-64Q-80 -70 -74 -70H6Q20 -44 8 -18H-74Q-80 -18 -80 -24Z" fill={LMH_RED} />
      {/* the two grey stripes ahead of the sweep */}
      <path d="M12 -28Q44 -32 79 -26" fill="none" stroke={GREY.light} strokeWidth={4} />
      <path d="M10 -21Q42 -25 79 -19" fill="none" stroke={GREY.mid} strokeWidth={3} />
      {/* the windscreen, the side window and the lamps */}
      <path d="M48 -66L68 -46H48Z" fill={GREY.dark} />
      <path d="M22 -64H42V-48H22Z" fill={GREY.dark} />
      <path d="M78 -36H80V-30H78Z" fill={LMH_RED} />
      {/* the wheels, ink tyres with a grey hub */}
      {[-46, 48].map((x) => (
        <g key={x}>
          <circle cx={x} cy={-14} r={15} fill={INK} />
          <circle cx={x} cy={-14} r={7} fill={GREY.light} />
          <circle cx={x} cy={-14} r={2.5} fill={GREY.dark} />
        </g>
      ))}
    </g>
  );
}
