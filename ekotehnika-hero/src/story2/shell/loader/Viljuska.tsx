// Preloader 1, Viljuška. Two Linde fork tines rise from the foot of the white sheet carrying a pallet and one carton with the Ekotehnika
// and Linde marks on its face, and how high they have lifted is how much of the page has loaded. The carton turns a little toward the
// mouse, a few degrees about its own foot, so the sheet answers a hand that has nothing to do yet. When the loading is done the tines
// lift the sheet off the page the way the L beat lifts its page, the whole sheet rides up on the steel and the steel runs on below it, the
// pallet and carton go up with it, and the page is arriving under it as the edge passes. The steel hangs a quarter of the screen below the
// sheet's edge and the sheet goes up that much further than its own height, so the tines carry on out of the top after the sheet has left. The carton is CSS, three faces and a lid with the
// logo files as supplied on its front, the pallet and the tines are one flat SVG in the greys of the brand. The sheet's own lift is the
// exit of every version, see Preloader.tsx, this one only adds the steel under it.
import { useRef } from 'react';
import { GREY, INK, lerp, liftEase, span, useFrame, type LoaderState } from './state';
import { Readout } from './Readout';

// the pallet is 480 by 64 in the SVG and the tines are 70 wide, a carton is 200 wide, 150 tall and 140 deep
const PALLET_W = 480;
const TINE_W = 70;
const TINE_X = [101, 309];
// how far under the foot of the screen the pallet's top starts, so the carton above it is out of sight, and where it stands when done, as
// a share of the screen height
const START_BELOW = 250;
// how far the tines hang below the foot of the screen when the load is up, as a share of the screen height
const HANG = 0.25;
const REST = 0.47;
// the most the carton turns toward the mouse, in degrees
const TURN_Y = 11;
const TURN_X = 7;
// the carton is seen from a little above, so its lid shows
const TILT_DOWN = -6;

// the rig is drawn for a 900 high screen and grows with a taller one
const size = (h: number) => Math.min(1.5, Math.max(1, (h / 900) * 1.25));

export function Viljuska({ state }: { state: LoaderState }) {
  // the tines run from the pallet down to the hang below the foot of the screen
  const steel = Math.ceil(((1 + HANG - REST) * state.h) / size(state.h)) + 40;
  const me = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  // the pallet's top edge, from under the screen to where it stands, the lift follows the loading and nothing else
  useFrame(state, (s) => {
    // the sheet is the root of the preloader, it rides up on the steel in the exit, on the plan's wipe curve like every lift of the page
    const sheet = me.current?.parentElement;
    if (sheet) sheet.style.transform = s.out > 0 ? `translate3d(0, ${(-(100 + HANG * 100 + 5) * liftEase(s.out)).toFixed(3)}%, 0)` : '';
    const top = lerp(s.h + START_BELOW * size(s.h), s.h * REST, s.p);
    if (rig.current) rig.current.style.transform = `translate3d(0, ${top.toFixed(1)}px, 0) scale(${size(s.h)})`;
    // the carton leans toward the mouse and settles with the lift, a small sway on the way up that is gone when the tines have stopped
    const sway = Math.sin(s.t * 3.1) * 2.2 * (1 - span(s.p, 0.85, 1)) * (s.p > 0.02 ? 1 : 0);
    if (box.current) box.current.style.transform = `rotateX(${(TILT_DOWN - s.my * TURN_X).toFixed(2)}deg) rotateY(${(s.mx * TURN_Y).toFixed(2)}deg) rotateZ(${sway.toFixed(2)}deg)`;
  });
  return (
    <div className="vl" ref={me}>
      <div className="pl-ground" />
      <div className="vl-rig" ref={rig} style={{ transform: `translate3d(0, ${state.h + START_BELOW}px, 0) scale(${size(state.h)})` }}>
        <div className="vl-persp">
          <div className="vl-box" ref={box}>
            <div className="vl-f vl-front">
              <img src="/brand/linde-mh.svg" width={80} height={48} alt="" />
              <img src="/brand/ekotehnika.svg" width={104} height={21} alt="" />
            </div>
            <div className="vl-f vl-back" />
            <div className="vl-f vl-right" />
            <div className="vl-f vl-left" />
            <div className="vl-f vl-top" />
          </div>
        </div>
        <svg className="vl-steel" width={PALLET_W} height={steel} viewBox={`0 0 ${PALLET_W} ${steel}`} aria-hidden="true">
          <defs>
            {/* the tine is lit down its middle and dark at its edges, with the dark lower edge of the L beat's blade */}
            <linearGradient id="vl-steel" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={GREY.mid} />
              <stop offset="0.35" stopColor={GREY.pale} />
              <stop offset="0.6" stopColor={GREY.light} />
              <stop offset="1" stopColor={GREY.dark} />
            </linearGradient>
          </defs>
          {/* the pallet, the deck, three blocks and the bottom boards, the openings between them are 160 wide */}
          <g stroke={INK} strokeWidth={1} strokeOpacity={0.55}>
            <rect x={8} y={14} width={48} height={36} fill={GREY.mid} />
            <rect x={216} y={14} width={48} height={36} fill={GREY.mid} />
            <rect x={424} y={14} width={48} height={36} fill={GREY.mid} />
            <rect x={0} y={50} width={64} height={13} fill={GREY.light} />
            <rect x={208} y={50} width={64} height={13} fill={GREY.light} />
            <rect x={416} y={50} width={64} height={13} fill={GREY.light} />
            <rect x={0} y={0} width={PALLET_W} height={14} fill={GREY.light} />
          </g>
          {/* the two tines, the blade end on under the deck and the shank running down past the foot of the screen */}
          {TINE_X.map((x) => (
            <g key={x}>
              <rect x={x} y={14} width={TINE_W} height={steel - 14} fill="url(#vl-steel)" stroke={INK} strokeWidth={1} strokeOpacity={0.7} />
              <rect x={x} y={42} width={TINE_W} height={4} fill={INK} fillOpacity={0.85} />
            </g>
          ))}
          {/* the carriage bar the two shanks hang on */}
          <rect x={TINE_X[0] + TINE_W} y={196} width={TINE_X[1] - TINE_X[0] - TINE_W} height={34} fill="url(#vl-steel)" stroke={INK} strokeWidth={1} strokeOpacity={0.7} />
        </svg>
      </div>
      <Readout state={state} />
    </div>
  );
}
