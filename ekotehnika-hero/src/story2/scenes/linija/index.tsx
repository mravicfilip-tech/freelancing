// Linija, the drawn scene for storyline 2. One 1440 by 900 vector drawing fitted to the stage, every layer a
// function of the story position. Outdoors the forklift stays in one place while the Ekotehnika site moves past,
// the view flips to top down along the S path, zooms into the warehouse roof, opens to an isometric warehouse,
// drops into the aisle and pushes into the black of a forklift. Then the blueprint, the fork blade, the grid of
// rental forklifts, the dark floor and the robots. Reuses the variant 2 drawings in src/variants/v2/art.tsx.
import { memo, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { SceneProps } from '../../clock';
import { ForkliftSide, LoadSide } from '../../../variants/v2/art';
import { W, H, K, LG, WH, clamp01, eout3, ein, io, lerp, range, seg, smooth, start, end } from './frame';
import { Outdoor, GY, TS, axleX, dist, liftAt } from './outdoor';
import { PATH_LEN, TOP_S, TopTruckAt, TopWorld, pathAt } from './topdown';
import { IsoWarehouse } from './iso';
import { Aisle, FrontTruck, SIDE_S, SideRoom, type SideRefs } from './indoor';
import { BP, Blade, Blueprint, Paths, RentalGrid, Robots, Streaks } from './dark';
import './linija.css';

type El = SVGGElement | SVGRectElement | SVGLineElement | null;
type Refs = { wheelF: { current: SVGGElement | null }; wheelR: { current: SVGGElement | null }; inner: { current: SVGGElement | null }; rod: { current: SVGRectElement | null }; chain: { current: SVGLineElement | null }; carriage: { current: SVGGElement | null } };

const useRefs = (): Refs => ({
  wheelF: useRef<SVGGElement>(null),
  wheelR: useRef<SVGGElement>(null),
  inner: useRef<SVGGElement>(null),
  rod: useRef<SVGRectElement>(null),
  chain: useRef<SVGLineElement>(null),
  carriage: useRef<SVGGElement>(null),
});

const set = (el: El, name: string, v: string | number) => el?.setAttribute(name, String(v));

// Wheel turn and mast height, set straight on the nodes so the memoised drawing never re-renders.
function drive(r: Refs, distPx: number, scale: number, lift: number) {
  set(r.wheelF.current, 'transform', `rotate(${((distPx / (31 * scale)) * 180) / Math.PI})`);
  set(r.wheelR.current, 'transform', `rotate(${((distPx / (27 * scale)) * 180) / Math.PI})`);
  const off = Math.max(0, lift - 120);
  set(r.inner.current, 'transform', `translate(0 ${-off})`);
  set(r.rod.current, 'y', -196 - off);
  set(r.rod.current, 'height', off);
  set(r.chain.current, 'y1', -212 - off);
  set(r.chain.current, 'y2', -lift - 40);
  set(r.carriage.current, 'transform', `translate(0 ${-lift - 5})`);
}

const OutTruck = memo(function OutTruck({ refs }: { refs: SideRefs }) {
  return <ForkliftSide parts={refs} load={<LoadSide x={66} y={10} kind="cartons" />} />;
});

// where the path ends, the truck stops with its load at the roof edge
const L_F0 = 420;
const L_R0 = 700;
const L_END = PATH_LEN - 97;
const SIDE_C = { x: 768, y: 468 };
const TOP_C = { x: 980, y: 430 };
const ROOF_FOCUS = { x: 390, y: 1900 };
const Z_SCALE = 3.4;

type Cam = { cx: number; cy: number; sx: number; sy: number; s: number; L: number; rot: number; opacity: number; truckOp: number; d: number };

function topCam(pos: number): Cam {
  const f = seg(pos, 'F');
  const r = range(pos, start('R'), end('R'));
  const zk = seg(pos, 'Z');
  const L = pos < end('F') ? lerp(L_F0, L_R0, io(f)) : lerp(L_R0, L_END, 0.5 * r + 0.5 * io(r));
  const tp = pathAt(L);
  const rotMix = smooth(range(f, 0.28, 0.78));
  let sx = lerp(SIDE_C.x, TOP_C.x, io(f));
  let sy = lerp(SIDE_C.y, TOP_C.y, io(f));
  let s = 2.94 ** (1 - io(range(f, 0.2, 1)));
  let cx = tp.x;
  let cy = tp.y;
  if (pos > end('R')) {
    const z = io(zk);
    cx = lerp(tp.x, ROOF_FOCUS.x, z);
    cy = lerp(tp.y, ROOF_FOCUS.y, z);
    sx = lerp(TOP_C.x, W / 2, z);
    sy = lerp(TOP_C.y, H / 2, z);
    s = Math.exp(Math.log(Z_SCALE) * z);
  }
  const roofFade = 1 - range(pos, start('P'), start('P') + 130);
  return {
    cx,
    cy,
    sx,
    sy,
    s,
    L,
    rot: tp.a * rotMix,
    opacity: (pos < end('F') ? range(f, 0.12, 0.5) : 1) * roofFade,
    truckOp: range(f, 0.38, 0.7),
    d: pos < end('F') ? dist(pos) : 3400 + (L - L_R0),
  };
}

// The aisle camera, how the truck comes at the viewer, as numbers for one frame of the A beat.
const FOCAL = 1000;
const TRUCK_Z0 = 1900;
const TRUCK_Z1 = 395;
function aisleAt(k: number) {
  const low = io(range(k, 0.4, 0.7));
  const hC = lerp(420, 200, low);
  const yH = lerp(380, 300, low);
  const zc = 2400 * io(range(k, 0.4, 1));
  const zT = lerp(TRUCK_Z0, TRUCK_Z1, io(range(k, 0.5, 1)));
  const s = FOCAL / zT;
  return { cam: { hC, yH, zc }, s, foot: yH + hC * s };
}

export default function Linija({ clock }: SceneProps) {
  const [pos, setPos] = useState(() => Math.round(clock.pos.current));
  const out = useRefs();
  const inn = useRefs();
  const cid = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    let id = 0;
    let last = -1;
    const loop = () => {
      const p = Math.round(clock.pos.current);
      if (p !== last) {
        last = p;
        setPos(p);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [clock]);

  const lift = liftAt(pos);
  const dd = dist(pos);
  const ak = seg(pos, 'A');
  const sideAxle = lerp(150, 940, io(range(ak, 0.08, 0.55)));
  useLayoutEffect(() => {
    drive(out, dd, TS, lift);
    drive(inn, sideAxle, SIDE_S, 60);
  });

  const F = seg(pos, 'F');
  const showOut = pos < end('F') + 20;
  const showMap = pos >= start('F') + 100 && pos < start('P') + 140;
  const cam = showMap ? topCam(pos) : null;

  // outdoor side view, flattened as the camera pitches to top down
  const sideSY = 1 - smooth(range(F, 0.05, 0.6));
  const sideOp = 1 - range(F, 0.4, 0.7);

  // the isometric warehouse
  const isoIn = range(pos, start('P') + 0.5 * (end('P') - start('P')), start('P') + 0.93 * (end('P') - start('P')));
  const isoOut = io(range(ak, 0.0, 0.26));
  const showIso = pos >= start('P') + 500 && pos < end('A') - 700;
  const isoOp = smooth(isoIn) * (1 - isoOut);
  const isoScale = lerp(0.88, 1, eout3(isoIn)) * lerp(1, 1.5, isoOut);

  // side room, then the aisle
  const showRoom = pos >= start('A') && pos < start('A') + 0.65 * (end('A') - start('A'));
  const roomOp = smooth(range(ak, 0.1, 0.28)) * (1 - smooth(range(ak, 0.42, 0.6)));
  const roomUp = -170 * io(range(ak, 0.4, 0.64));
  const showAisle = pos >= start('A') + 0.36 * (end('A') - start('A')) && pos < start('S') + 60;
  const aisleOp = smooth(range(ak, 0.38, 0.58));
  const ai = aisleAt(clamp01(ak));
  const bk = seg(pos, 'B');
  const aiEnd = aisleAt(1);
  const bz = Math.exp(Math.log(60) * io(bk));
  const f0 = { x: W / 2, y: aiEnd.foot - 82 * aiEnd.s };
  const ft = { x: lerp(f0.x, W / 2, io(bk)), y: lerp(f0.y, H / 2, io(bk)) };
  const zoomT = bk > 0 ? `translate(${ft.x.toFixed(2)} ${ft.y.toFixed(2)}) scale(${bz.toFixed(3)}) translate(${(-f0.x).toFixed(2)} ${(-f0.y).toFixed(2)})` : '';
  const truckOp = smooth(range(ak, 0.42, 0.55));

  // dark chapters
  const showDark = pos >= start('B') + 300 && pos < start('N') + 40;
  const lK = seg(pos, 'L');
  const shift = Math.max(0, pos - start('S')) * 2.2;
  const wheelBp = shift / (31 * BP.s);
  const draw = io(range(pos, start('S') + 40, start('S') + 460));
  const streakOp = range(pos, start('S') + 60, start('S') + 300) * (1 - range(lK, 0.25, 0.8));
  const bpUp = -150 * io(lK);
  const panelTopL = lerp(H + 168, 0, io(lK));
  const tK = seg(pos, 'T');
  const showPanel = pos >= start('L') && pos < start('T') + 440;
  const panelTop = pos < start('T') ? panelTopL : lerp(0, H + 40, ein(range(tK, 0, 0.8)));
  const nK = seg(pos, 'N');
  const showBlade = pos >= start('L') && pos < start('N');
  const floorTop = lerp(H, 0, io(range(tK, 0.1, 0.95)));
  const showFloor = pos >= start('T');
  const pathP = pos >= end('T') ? 1 : range(tK, 0.35, 1);
  const robotsIn = range(pos, start('AT'), start('AT') + 240);

  return (
    <div className="lj-root" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%" focusable="false">
        <rect x={0} y={0} width={W} height={H} fill={WH} />

        {showOut && (
          <g opacity={sideOp} transform={`translate(0 ${GY}) scale(1 ${Math.max(0.0001, sideSY)}) translate(0 ${-GY})`}>
            <Outdoor pos={pos} />
            <g transform={`translate(${axleX(pos).toFixed(1)} ${GY}) scale(${TS})`}>
              <OutTruck refs={out as unknown as SideRefs} />
            </g>
          </g>
        )}

        {showMap && cam && (
          <g>
            <TopWorld cx={cam.cx} cy={cam.cy} sx={cam.sx} sy={cam.sy} s={cam.s} opacity={cam.opacity} />
            <TopTruckAt
              x={(pathAt(cam.L).x - cam.cx) * cam.s + cam.sx}
              y={(pathAt(cam.L).y - cam.cy) * cam.s + cam.sy}
              rot={cam.rot}
              scale={TOP_S * cam.s}
              d={cam.d}
              opacity={cam.truckOp * cam.opacity}
            />
          </g>
        )}

        {showIso && (
          <g opacity={isoOp} transform={`translate(${W / 2} ${H / 2}) scale(${isoScale.toFixed(4)}) translate(${-W / 2} ${-H / 2})`}>
            <IsoWarehouse t={pos} />
          </g>
        )}

        {showRoom && (
          <g opacity={roomOp} transform={`translate(0 ${roomUp.toFixed(1)})`}>
            <SideRoom axle={sideAxle} refs={inn as unknown as SideRefs} />
          </g>
        )}

        {showAisle && (
          <g opacity={aisleOp}>
            <g transform={zoomT}>
              <Aisle cam={pos >= start('B') ? aiEnd.cam : ai.cam} />
              <g opacity={truckOp} transform={`translate(${W / 2} ${(pos >= start('B') ? aiEnd.foot : ai.foot).toFixed(1)}) scale(${(pos >= start('B') ? aiEnd.s : ai.s).toFixed(4)})`}>
                <FrontTruck />
              </g>
            </g>
            <rect x={0} y={0} width={W} height={H} fill={K} opacity={range(bk, 0.7, 0.96)} />
          </g>
        )}

        {showDark && (
          <g>
            <rect x={0} y={0} width={W} height={H} fill={K} opacity={range(pos, start('B') + 300, start('B') + 380)} />
            <g transform={`translate(0 ${bpUp.toFixed(1)})`}>
              <Streaks shift={shift} opacity={streakOp} />
              <Blueprint wheel={wheelBp} draw={draw} cid={cid} />
            </g>
          </g>
        )}

        {showPanel && (
          <g>
            {pos >= start('T') && <rect x={0} y={0} width={W} height={H} fill={LG} />}
            <g transform={`translate(0 ${panelTop.toFixed(1)})`}>
              <rect x={0} y={0} width={W} height={H + 400} fill={LG} />
              <RentalGrid k={nK} />
            </g>
            {showBlade && <Blade y={panelTop - 168} />}
          </g>
        )}

        {showFloor && (
          <g>
            <rect x={0} y={floorTop} width={W} height={H - floorTop + 2} fill={K} />
            <clipPath id={`${cid}-floor`}>
              <rect x={0} y={floorTop} width={W} height={H} />
            </clipPath>
            <g clipPath={`url(#${cid}-floor)`}>
              <Paths p={pathP} />
              <Robots t={Math.max(0, pos - start('AT'))} appear={robotsIn} />
            </g>
          </g>
        )}

      </svg>
    </div>
  );
}
