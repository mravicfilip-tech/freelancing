// V2 Linija. The United Carriers illustrated scroll story, 1:1 in Linde tokens. Flat technical
// vector drawings in side view on a pale ground. The forklift takes a pallet off the rack, turns
// toward the camera, lowers it, drives right while the floor turns into a black aisle, then the view
// tips to top down and the truck follows the aisle to the dock. SVG and GSAP only, the clock is
// useScrollStory. The drawing fills the screen and the shared hero frame sits on top of it, see
// src/ui/HeroFrame.tsx. The frame turns white while the black floor is under the bottom left block.
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useScrollStory, clamp01, range } from '../../scroll/useScrollStory';
import { C } from '../../tokens';
import { ForkliftFront, ForkliftSide, LoadSide, RackSide } from './art';
import { YardMap } from './map';
import { HeroFrame } from '../../ui/HeroFrame';
import './v2.css';

const LENGTH = 9000;

// The 1440 by 900 drawing is fitted to the screen as one centred frame, scaled and lifted so the
// subject clears the top row and the bottom left block of the hero frame at every resting scroll
// position. The drawing's lowest subject edge, the rack and truck feet at scroll zero, stops 16px
// above the block. Its highest, the truck on the black floor, stops 100px below the top edge. The
// yard map starts on the same frame and slides to MAP_NUDGE while the view tips. Nothing inside the
// drawing is retimed. FEET and CROWN are frame units, MAP_NUDGE is screen pixels.
const FEET = 812;
const CROWN = 190;
const GAP_BELOW = 16;
const TOP_EDGE = 100;
const MAP_NUDGE = { x: 280, y: 0, k: 1 };
// The black floor's top edge, in screen pixels at 900 tall, above which the bottom left block turns white.
const FLOOR_FLIP = 640;

const io = (t: number) => 0.5 - Math.cos(Math.PI * clamp01(t)) / 2;
const ein = (t: number) => clamp01(t) ** 2;
const eout = (t: number) => 1 - (1 - clamp01(t)) ** 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Keyframes [p, value], eased in and out between each pair.
function kf(p: number, keys: [number, number][]) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i];
    const [p0, v0] = keys[i - 1];
    if (p <= p1) return v0 + (v1 - v0) * io((p - p0) / (p1 - p0));
  }
  return keys[keys.length - 1][1];
}

// Distance driven in the long drive, eased in then steady.
function drive(p: number) {
  const t = range(p, 0.44, 0.84);
  const a = 0.18;
  const d = t < a ? (t * t) / (2 * a) : t - a / 2;
  return d / (1 - a / 2);
}

const RACK_X = 300;
const PICK_Y = 300;

type Els = Record<string, HTMLElement | SVGElement | null>;

export default function Variant2({ reduced }: { reduced: boolean }) {
  const { stageRef, progress } = useScrollStory({ length: LENGTH, reduced, smoothing: 0.07 });
  const els = useRef<Els>({});
  const heroRef = useRef<HTMLDivElement>(null);
  const r = (k: string) => (el: HTMLElement | SVGElement | null) => {
    els.current[k] = el;
  };

  useEffect(() => {
    const e = els.current as Record<string, any>;
    const frontRods = Array.from(stageRef.current?.querySelectorAll<SVGRectElement>('.v2-front .v2-frod') ?? []);
    const frontChains = Array.from(stageRef.current?.querySelectorAll<SVGLineElement>('.v2-front .v2-fchain') ?? []);
    const stage = stageRef.current as HTMLElement;
    const hf = heroRef.current as HTMLElement;

    const route = e.route as SVGPathElement;
    const total = route.getTotalLength();
    e.reveal.setAttribute('stroke-dasharray', `${total} ${total}`);

    // Fit the drawing to the screen. skirtMax is how far, in drawing units, the black floor must reach
    // below its old bottom edge, 930, to meet the screen edge.
    let size = { w: 0, h: 0, base: 1 };
    let side = { s: 1, ox: 0, oy: 0 };
    let skirtMax = 0;
    let last = -1;
    const css = (f: { s: number; ox: number; oy: number }) => `translate(${f.ox}px, ${f.oy}px) scale(${f.s})`;
    const place = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      size = { w, h, base: Math.min(w / 1440, h / 900) };
      const blockTop = (hf.querySelector('.hf-bottom') as HTMLElement).getBoundingClientRect().top - stage.getBoundingClientRect().top;
      const s = Math.max(0.3, (blockTop - GAP_BELOW - TOP_EDGE) / (FEET - CROWN));
      side = { s, ox: (w - 1440 * s) / 2, oy: TOP_EDGE - CROWN * s };
      skirtMax = Math.max(0, (h - side.oy) / s - 930);
      e.frame.style.transform = css(side);
      last = -1;
    };
    place();
    const ro = new ResizeObserver(() => {
      place();
      if (reduced) render(0);
    });
    ro.observe(stage);
    ro.observe(hf.querySelector('.hf-bottom') as HTMLElement);

    let tone = '';
    const render = (p: number) => {
      // Truck position, mast height and tilt.
      const fx =
        p < 0.44
          ? kf(p, [[0.04, -300], [0.11, 89], [0.18, 89], [0.215, 229], [0.24, 229], [0.29, 40]])
          : 40 + 2600 * drive(p);
      const lift = kf(p, [[0.11, 0], [0.18, 303], [0.215, 303], [0.24, 323], [0.36, 323], [0.4, 18]]);
      const tilt = p < 0.31 ? kf(p, [[0.24, 0], [0.28, -3], [0.29, -3], [0.31, 0]]) : kf(p, [[0.42, 0], [0.47, -3]]);
      const off = Math.max(0, lift - 120);
      const carried = p > 0.24 || (p > 0.215 && lift >= 305);

      // Turn toward the camera and back. The world mirrors so the rack ends up behind the truck.
      const sxTruck = p < 0.29 ? 1 : p < 0.31 ? 1 - ein(range(p, 0.29, 0.31)) : p < 0.42 ? 0 : eout(range(p, 0.42, 0.44));
      const sFront = p < 0.31 ? 0 : p < 0.33 ? eout(range(p, 0.31, 0.33)) : p < 0.4 ? 1 : p < 0.42 ? 1 - ein(range(p, 0.4, 0.42)) : 0;
      const sxWorld = p < 0.29 ? 1 : p < 0.31 ? 1 - ein(range(p, 0.29, 0.31)) : p < 0.42 ? 0 : -eout(range(p, 0.42, 0.44));
      const pivot = fx - 20;

      // Side camera. World point (cx, cy) sits at the screen centre at scale s. The scale stays low
      // enough that the rack, about 530 units tall, and the raised front view stay under 60 percent
      // of the screen, and every beat at rest frames the whole drawing inside the page margins.
      const s = kf(p, [[0, 0.84], [0.04, 0.84], [0.11, 1.0], [0.18, 1.0], [0.24, 1.0], [0.29, 1.0], [0.33, 1.2], [0.36, 1.2], [0.4, 1.5], [0.44, 1.0], [0.52, 1.0], [0.78, 1.0]]);
      const cy = kf(p, [[0, -431], [0.04, -431], [0.11, -340], [0.18, -340], [0.24, -340], [0.29, -330], [0.33, -212], [0.36, -212], [0.4, -113], [0.44, -310], [0.52, 50], [0.78, 55], [0.84, 70]]);
      const cxKF = kf(p, [[0, 237], [0.04, 237], [0.11, 431], [0.18, 431], [0.24, 431]]);
      const offX = kf(p, [[0.44, 0], [0.52, 90]]);
      const cx = lerp(cxKF, pivot + offX / s, io(range(p, 0.24, 0.29)));
      const cam = `translate(720 450) scale(${s}) translate(${-cx} ${-cy})`;
      const gy = (0 - cy) * s + 450;
      const truckSX = (pivot - cx) * s + 720;

      e.cam1.setAttribute('transform', cam);
      e.cam2.setAttribute('transform', cam);
      // The world turns about the spot where the truck turned, x 20, so the rack stays behind it.
      e.world.setAttribute('transform', `translate(20 0) scale(${Math.abs(sxWorld) < 1e-4 ? 1e-4 : sxWorld} 1) translate(-20 0)`);
      // The rack and the parked truck dissolve as the truck drives off, so they never sit cut by the edge.
      e.world.style.opacity = String(Math.min(1, Math.abs(sxWorld) * 1.6) * (1 - range(p, 0.445, 0.485)));
      e.truckTurn.setAttribute('transform', `translate(${pivot} 0) scale(${Math.max(1e-4, sxTruck)} 1) translate(${-pivot} 0)`);
      e.truckPos.setAttribute('transform', `translate(${fx} 0)`);
      e.front.setAttribute('transform', `translate(${pivot} 0) scale(${Math.max(1e-4, sFront)} 1)`);
      e.front.style.visibility = sFront > 0.001 ? 'visible' : 'hidden';
      const turning = (p > 0.29 && p < 0.33) || (p > 0.4 && p < 0.44);
      const blurX = turning ? 6 * Math.sin(Math.PI * (p < 0.35 ? range(p, 0.29, 0.33) : range(p, 0.4, 0.44))) : 0;
      e.mb.setAttribute('stdDeviation', `${blurX.toFixed(2)} 0`);
      const fl = blurX > 0.05 ? 'url(#v2-mb)' : '';
      if (e.cam2.getAttribute('filter') !== fl) {
        if (fl) {
          e.cam2.setAttribute('filter', fl);
          e.cam1.setAttribute('filter', fl);
        } else {
          e.cam2.removeAttribute('filter');
          e.cam1.removeAttribute('filter');
        }
      }
      e.truckTurn.style.visibility = sxTruck > 0.001 ? 'visible' : 'hidden';

      // Mast, carriage, chain and wheels.
      e.mast.setAttribute('transform', `rotate(${tilt} 42 -14)`);
      e.inner.setAttribute('transform', `translate(0 ${-off})`);
      e.rod.setAttribute('y', String(-196 - off));
      e.rod.setAttribute('height', String(off));
      e.chain.setAttribute('y1', String(-212 - off));
      e.chain.setAttribute('y2', String(-lift - 45));
      e.carriage.setAttribute('transform', `translate(0 ${-lift - 5})`);
      e.load.setAttribute('transform', carried ? 'translate(66 10)' : `translate(${RACK_X - 5 - fx} ${lift - PICK_Y + 5})`);
      e.wheelF.setAttribute('transform', `rotate(${(fx / 31) * 57.3})`);
      e.wheelR.setAttribute('transform', `rotate(${(fx / 27) * 57.3})`);
      e.finner.setAttribute('transform', `translate(0 ${-off})`);
      e.fcarriage.setAttribute('transform', `translate(0 ${-lift - 5})`);
      frontRods.forEach((rod) => {
        rod.setAttribute('y', String(-196 - off));
        rod.setAttribute('height', String(off));
      });
      frontChains.forEach((ch) => {
        ch.setAttribute('y1', String(-212 - off));
        ch.setAttribute('y2', String(-lift - 45));
      });

      // Floor line, then the black aisle drawing out under the truck and filling the bottom.
      const k1 = io(range(p, 0.455, 0.49));
      const k2 = eout(range(p, 0.48, 0.515));
      const bottom = p < 0.78 ? lerp(gy + 4, 930, k2) : lerp(930, 570, io(range(p, 0.78, 0.82)));
      e.floor.setAttribute('x', String(truckSX - 1700 * k1));
      e.floor.setAttribute('width', String(3400 * k1));
      e.floor.setAttribute('y', String(gy - 1));
      e.floor.setAttribute('height', String(Math.max(0, bottom - gy + 1)));
      e.floor.style.visibility = p > 0.83 ? 'hidden' : 'visible';
      e.ground.setAttribute('y1', String(gy));
      e.ground.setAttribute('y2', String(gy));
      e.ground2.setAttribute('y1', String(gy));
      e.ground2.setAttribute('y2', String(gy));
      e.lane.setAttribute('y1', String(gy + 46));
      e.lane.setAttribute('y2', String(gy + 46));
      e.lane.setAttribute('stroke-dashoffset', String(fx * s));
      e.lane.style.opacity = String(0.5 * range(p, 0.51, 0.53) * (1 - range(p, 0.78, 0.8)));

      // Tip from side view to top down. The side truck folds flat onto the aisle.
      const fold = range(p, 0.8, 0.825);
      const py = gy - 110 * s;
      const sy = Math.max(1e-4, 1 - ein(fold));
      const ty = (475 - py) * io(fold);
      e.squash.setAttribute('transform', `translate(0 ${ty}) translate(0 ${py}) scale(1 ${sy}) translate(0 ${-py})`);
      e.side.style.opacity = p > 0.835 ? '0' : '1';

      // Top down yard.
      const mapOn = range(p, 0.82, 0.83);
      e.map.style.opacity = String(mapOn);
      e.map.style.visibility = mapOn > 0.001 ? 'visible' : 'hidden';
      if (mapOn > 0.001) {
        const L = total * io(range(p, 0.85, 0.985));
        const P = route.getPointAtLength(L);
        const P1 = route.getPointAtLength(Math.max(0, L - 2));
        const P2 = route.getPointAtLength(Math.min(total, L + 2));
        const ang = (Math.atan2(P2.y - P1.y, P2.x - P1.x) * 180) / Math.PI;
        const A = route.getPointAtLength(Math.min(total, L + 260));
        const la = 0.45 * range(p, 0.86, 0.9) * (1 - range(p, 0.95, 0.985));
        const lx = lerp(P.x, A.x, la);
        const ly = lerp(P.y, A.y, la);
        const ms = kf(p, [[0.85, 1], [0.9, 0.9], [0.95, 0.92], [0.985, 1]]);
        const sx = kf(p, [[0.85, 640], [0.95, 700], [0.985, 740]]);
        const sy2 = kf(p, [[0.85, 475], [0.985, 480]]);
        const camx = lx - (sx - 720) / ms;
        const camy = ly - (sy2 - 450) / ms;
        e.mapCam.setAttribute('transform', `translate(720 450) scale(${ms}) translate(${-camx} ${-camy})`);
        e.mapTruck.setAttribute('transform', `translate(${P.x} ${P.y}) rotate(${ang})`);
        e.mapTruckInner.setAttribute('transform', `scale(1 ${Math.max(1e-4, io(range(p, 0.825, 0.85)))})`);
        e.reveal.setAttribute('stroke-dashoffset', String(total - Math.min(total, L + 650)));
      }

      // The map layer starts on the side frame and slides to its own while the view tips.
      const mt = io(range(p, 0.83, 0.9));
      const ms0 = size.base * MAP_NUDGE.k;
      const f1 = { s: ms0, ox: (size.w - 1440 * ms0) / 2 + MAP_NUDGE.x, oy: (size.h - 900 * ms0) / 2 + MAP_NUDGE.y };
      e.mapframe.style.transform = css({ s: lerp(side.s, f1.s, mt), ox: lerp(side.ox, f1.ox, mt), oy: lerp(side.oy, f1.oy, mt) });


      // The floor sits inside a scaled frame, so a skirt under it carries the black down to the screen
      // edge. It grows and retracts with the floor.
      const skirt = skirtMax * k2 * (1 - io(range(p, 0.78, 0.82)));
      e.skirt.setAttribute('x', e.floor.getAttribute('x'));
      e.skirt.setAttribute('width', e.floor.getAttribute('width'));
      e.skirt.setAttribute('y', String(bottom - 0.5));
      e.skirt.setAttribute('height', String(Math.max(0, skirt)));
      e.skirt.style.visibility = e.floor.style.visibility;

      // The bottom left block turns white while the black floor lies under it.
      const floorTop = gy * side.s + side.oy;
      const under = e.floor.style.visibility !== 'hidden' && k1 > 0.5 && floorTop < FLOOR_FLIP * size.base;
      const t = under ? 'white' : 'ink';
      if (t !== tone) {
        tone = t;
        hf.dataset.toneBottom = t;
      }
    };

    if (reduced) {
      render(0);
      return () => ro.disconnect();
    }
    const tick = () => {
      const p = progress.current;
      if (Math.abs(p - last) < 1e-6) return;
      last = p;
      render(p);
    };
    render(0);
    gsap.ticker.add(tick);
    return () => {
      ro.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [reduced, progress, stageRef]);

  const rack1 = (
    <RackSide x={RACK_X}>
      <LoadSide x={-5} y={0} kind="wrap" />
      <LoadSide x={-5} y={-150} kind="crates" />
      <LoadSide x={-5} y={-450} kind="cartons" />
    </RackSide>
  );
  const rack2 = (
    <RackSide x={RACK_X + 140}>
      <LoadSide x={-5} y={0} kind="tall" />
      <LoadSide x={-5} y={-150} kind="cartons" />
      <LoadSide x={-5} y={-300} kind="wrap" />
    </RackSide>
  );

  return (
    <div className="v2" ref={stageRef} role="region" aria-label="Ekotehnika, Linde viljuškari">
      <div className="v2-panel">
        <div className="v2-frame" ref={r('frame')}>
          <svg className="v2-layer" ref={r('side')} viewBox="0 0 1440 900" aria-hidden="true" focusable="false">
            <defs>
              <filter id="v2-mb" x="-20%" y="-5%" width="140%" height="110%">
                <feGaussianBlur ref={r('mb')} stdDeviation="0 0" />
              </filter>
            </defs>
            <line ref={r('ground')} x1={0} x2={1440} y1={860} y2={860} stroke={C.shadeGrey} strokeWidth={1} />
            <line ref={r('ground2')} x1={-1200} x2={0} y1={860} y2={860} stroke={C.shadeGrey} strokeWidth={1} />
            <g ref={r('cam1')}>
              <g ref={r('world')}>
                {rack1}
                {rack2}
                <g transform="translate(774 0) scale(-1 1)">
                  <ForkliftSide lift={0} load={<LoadSide x={66} y={10} kind="tall" />} />
                </g>
              </g>
            </g>
            <rect ref={r('floor')} x={0} y={900} width={0} height={0} fill={C.ink} />
            <rect ref={r('skirt')} x={0} y={900} width={0} height={0} fill={C.ink} />
            <line ref={r('lane')} x1={-200} x2={1640} y1={0} y2={0} stroke={C.textGrey} strokeWidth={2} strokeDasharray="70 110" style={{ opacity: 0 }} />
            <g ref={r('squash')}>
              <g ref={r('cam2')}>
                <g ref={r('truckTurn')}>
                  <g ref={r('truckPos')}>
                    <ForkliftSide
                      parts={{
                        mast: r('mast') as never,
                        inner: r('inner') as never,
                        rod: r('rod') as never,
                        chain: r('chain') as never,
                        carriage: r('carriage') as never,
                        wheelF: r('wheelF') as never,
                        wheelR: r('wheelR') as never,
                      }}
                      load={
                        <g ref={r('load')}>
                          <LoadSide kind="cartons" />
                        </g>
                      }
                    />
                  </g>
                </g>
                <g ref={r('front')} className="v2-front" style={{ visibility: 'hidden' }}>
                  <ForkliftFront parts={{ inner: r('finner') as never, carriage: r('fcarriage') as never }} />
                </g>
              </g>
            </g>
          </svg>
        </div>

        <div className="v2-frame" ref={r('mapframe')}>
          <svg className="v2-layer v2-map" ref={r('map')} viewBox="0 0 1440 900" aria-hidden="true" focusable="false">
            <rect x={-3000} y={-3000} width={7500} height={7500} fill={C.hoverLightGrey} />
            <YardMap
              refs={{
                cam: r('mapCam') as never,
                truck: r('mapTruck') as never,
                truckInner: r('mapTruckInner') as never,
                route: r('route') as never,
                reveal: r('reveal') as never,
              }}
            />
          </svg>
        </div>

        <div className="v2-veil" aria-hidden="true" />
        <HeroFrame tone="ink" rootRef={heroRef} />
      </div>
    </div>
  );
}
