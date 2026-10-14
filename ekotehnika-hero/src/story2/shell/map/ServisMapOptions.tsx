// The servis map section, three design options for Filip's pick before anything animates (round 5, 14 October). Each is a
// still frame of the section in the real shell, the top row, the page grid and the Servis pure black ground, at 1440 by 900.
// The copy and the layout are the same in all three, only the map differs, so the pick is about the map.
//   ?servismap=1  Mreža, the outline, the rivers and a road from the nearer centre to every district town, Filip's pick, its
//                 road treatments on a board of five with &road=1 to 5 (roads.tsx), the map 30 percent over its first size
//   ?servismap=2  Pokrivenost, Serbia as a field of squares on the page grid's rhythm, each lit by the centre that covers it
//   ?servismap=3  Reljef, Serbia as a lit slab in the scene's 3D world, arcs from the two centres to every district town
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HeroFrame } from '../../../ui/HeroFrame';
import { Grid } from '../Grid';
import { Btn, Fill, Marker, TitleLines, between } from '../ui';
import { markers, servisMap } from '../../copy';
import { BASES, MAP, TOWNS, fit, inSerbia, nearest, pathOf, type LonLat, type Pt } from './geo';
import { Roads } from './roads';
import '../shell.css';
import './map.css';

const OPT = (() => {
  const n = Number(new URLSearchParams(window.location.search).get('servismap'));
  return n >= 1 && n <= 3 ? n : 1;
})();

// the map's box on a 1440 by 900 stage, from the centre grid line to the right one, between the top and bottom rules
// the map runs from the top rule to the foot of the frame, so Serbia stands 30 percent taller than in the first options
const BOX = { w: 659, h: 764 };

export function ServisMapOptions() {
  const stage = useRef<HTMLElement>(null);
  useEffect(() => {
    const s = stage.current;
    if (!s) return;
    s.querySelectorAll<HTMLElement>('.s2-grid, .s2-plus').forEach((g) => (g.dataset.tone = 'white'));
  }, []);
  return (
    <div className="s2 sm" data-tone="light">
      <section ref={stage} className="s2-stage s2-still sm-stage" data-ink="dark" aria-label="Servis, mapa">
        <div className="s2-scene sm-ground" aria-hidden="true" />
        <Grid />
        <div className="s2-layer" data-ink="dark" style={{ opacity: 1 }}>
          <MapPane />
        </div>
        <HeroFrame tone="white" />
      </section>
    </div>
  );
}

function MapPane() {
  const c = servisMap;
  return (
    <div className="s2-pane sm-pane">
      <div className="blk stack" style={{ ...between(1, 3), top: 168 }}>
        <Marker m={markers.s} order={0} />
        <TitleLines lines={c.title} order={1} />
        <Fill text={c.text} />
        <Btn href={c.cta.href} order={5} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <ul className="sm-bases blk at-bottom" style={between(1, 3)} data-rule="t">
        {c.bases.map((b) => (
          <li key={b.id}>
            <i className="p-dot sm-dot" aria-hidden="true" />
            <b className="lab">{b.label}</b>
            <span className="line">{b.line}</span>
          </li>
        ))}
      </ul>
      <figure className={`sm-fig sm-opt-${OPT}`} style={between(3, 5)} aria-label="Mapa Srbije sa servisnim centrima u Vrčinu i Čurugu">
        {OPT === 1 && <Network />}
        {OPT === 2 && <Field />}
        {OPT === 3 && <Relief />}
      </figure>
    </div>
  );
}

// the base markers and their names, laid over any of the three maps from projected points
function Bases({ at }: { at: (ll: LonLat) => Pt | null }) {
  return (
    <>
      {BASES.map((b) => {
        const p = at(b.ll);
        if (!p) return null;
        const right = b.id === 'curug';
        return (
          <div key={b.id} className={`sm-base${right ? ' is-right' : ''}`} style={{ left: p[0], top: p[1] } as CSSProperties}>
            <i className="p-dot sm-dot" />
            <span className="sm-name">{b.name}</span>
          </div>
        );
      })}
    </>
  );
}

// the outer border of Serbia with Kosovo as one line: a stroke twice the width, then the fill on top, so only the outer
// half of the stroke stays and the line between the two shapes is covered from both sides
function Outline({ P, fill, line, width }: { P: (ll: LonLat) => Pt; fill: string; line: string; width: number }) {
  const d = pathOf([...MAP.serbia, ...MAP.kosovo], P);
  return (
    <>
      <path d={d} fill="none" stroke={line} strokeWidth={width * 2} strokeLinejoin="round" />
      <path d={d} fill={fill} />
    </>
  );
}

function Neighbours({ P }: { P: (ll: LonLat) => Pt }) {
  return <path d={pathOf(MAP.neighbours, P)} fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth={1} strokeLinejoin="round" />;
}

function Rivers({ P, alpha }: { P: (ll: LonLat) => Pt; alpha: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {MAP.rivers.map((r, i) => (
        <path key={i} d={pathOf([r.pts], P, false)} stroke={`rgb(255 255 255 / ${r.name === 'Danube' ? alpha * 1.5 : alpha})`} strokeWidth={r.name === 'Danube' ? 1.5 : 1} />
      ))}
    </g>
  );
}

// 1, Mreža
function Network() {
  const P = useMemo(() => fit(BOX.w, BOX.h, 0), []);
  return (
    <div className="sm-map">
      <svg width={BOX.w} height={BOX.h} viewBox={`0 0 ${BOX.w} ${BOX.h}`}>
        <defs>
          <clipPath id="sm-box">
            <rect width={BOX.w} height={BOX.h} />
          </clipPath>
        </defs>
        <g clipPath="url(#sm-box)">
          <Neighbours P={P} />
        </g>
        <Outline P={P} fill="#000" line="rgb(255 255 255 / 0.92)" width={1} />
        <Rivers P={P} alpha={0.22} />
        <Roads P={P} />
        <g stroke="#fff" strokeWidth={1}>
          {TOWNS.map((t) => {
            const [x, y] = P(t.ll).map((v) => Math.round(v) + 0.5);
            return <path key={t.name} d={`M${x - 4} ${y}H${x + 5}M${x} ${y - 4}V${y + 5}`} />;
          })}
        </g>
      </svg>
      <Bases at={P} />
    </div>
  );
}

// 2, Pokrivenost, a 12px pitch of 4px squares, white where Vrčin covers, grey where Čurug covers
function Field() {
  const P = useMemo(() => fit(BOX.w, BOX.h, 56), []);
  const cells = useMemo(() => {
    // invert the projection on a regular pixel lattice, so the squares sit on whole pixels
    const out: { x: number; y: number; base: string }[] = [];
    const pitch = 12;
    const a = P([18, 47]);
    const b = P([24, 41]);
    const lon = (x: number) => 18 + ((x - a[0]) / (b[0] - a[0])) * 6;
    const lat = (y: number) => 47 - ((y - a[1]) / (b[1] - a[1])) * 6;
    for (let y = 6; y < BOX.h; y += pitch)
      for (let x = 6; x < BOX.w; x += pitch) {
        const ll: LonLat = [lon(x + 2), lat(y + 2)];
        if (inSerbia(ll)) out.push({ x, y, base: nearest(ll).id });
      }
    return out;
  }, [P]);
  return (
    <div className="sm-map">
      <svg width={BOX.w} height={BOX.h} viewBox={`0 0 ${BOX.w} ${BOX.h}`}>
        <defs>
          <clipPath id="sm-box2">
            <rect width={BOX.w} height={BOX.h} />
          </clipPath>
        </defs>
        <g clipPath="url(#sm-box2)">
          <Neighbours P={P} />
        </g>
        <path d={pathOf([...MAP.serbia, ...MAP.kosovo], P)} fill="none" stroke="rgb(255 255 255 / 0.3)" strokeWidth={1} strokeLinejoin="round" />
        {cells.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={4} height={4} fill={c.base === 'vrcin' ? 'rgb(255 255 255 / 0.9)' : 'rgb(255 255 255 / 0.42)'} />
        ))}
      </svg>
      <Bases at={P} />
      <ul className="sm-key">
        <li>
          <i className="sm-sw" style={{ background: 'rgb(255 255 255 / 0.9)' }} />
          Iz Vrčina
        </li>
        <li>
          <i className="sm-sw" style={{ background: 'rgb(255 255 255 / 0.42)' }} />
          Iz Čuruga
        </li>
      </ul>
    </div>
  );
}

// 3, Reljef, the slab in three quarter view, lit like the servis forklift, arcs from each centre to its towns
function Relief() {
  const [pts, setPts] = useState<Record<string, Pt>>({});
  return (
    <div className="sm-map">
      <Canvas
        style={{ width: BOX.w, height: BOX.h }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{ fov: 28, near: 0.1, far: 200, position: [0, 24, 22] }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 1)}
      >
        <Slab onBases={setPts} />
      </Canvas>
      <Bases at={(ll) => pts[`${ll[0]},${ll[1]}`] ?? null} />
    </div>
  );
}

// Serbia in world units, 1 unit to 0.33 degree, centred
const W = (() => {
  const P = fit(12, 12 / 0.7);
  return (ll: LonLat): [number, number] => {
    const [x, y] = P(ll);
    return [x - 6, y - 6 / 0.7];
  };
})();

function Slab({ onBases }: { onBases: (p: Record<string, Pt>) => void }) {
  const { camera, size } = useThree();
  const geo = useMemo(() => {
    const shapes = [...MAP.serbia, ...MAP.kosovo].map((r) => new THREE.Shape(r.map((ll) => new THREE.Vector2(W(ll)[0], -W(ll)[1]))));
    const g = new THREE.ExtrudeGeometry(shapes, { depth: 0.5, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const outline = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (const r of [...MAP.serbia, ...MAP.kosovo]) for (let i = 0; i < r.length - 1; i++) {
      const a = W(r[i]);
      const b = W(r[i + 1]);
      pts.push(new THREE.Vector3(a[0], 0.531, a[1]), new THREE.Vector3(b[0], 0.531, b[1]));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const rivers = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (const r of MAP.rivers) for (let i = 0; i < r.pts.length - 1; i++) {
      if (!inSerbia(r.pts[i]) || !inSerbia(r.pts[i + 1])) continue;
      const a = W(r.pts[i]);
      const b = W(r.pts[i + 1]);
      pts.push(new THREE.Vector3(a[0], 0.535, a[1]), new THREE.Vector3(b[0], 0.535, b[1]));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const arcs = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (const t of TOWNS) {
      const a = W(nearest(t.ll).ll);
      const b = W(t.ll);
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0], 0.54, a[1]), new THREE.Vector3((a[0] + b[0]) / 2, 0.54 + d * 0.32, (a[1] + b[1]) / 2), new THREE.Vector3(b[0], 0.54, b[1]));
      const s = c.getPoints(24);
      for (let i = 0; i < s.length - 1; i++) pts.push(s[i], s[i + 1]);
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  useEffect(() => {
    camera.lookAt(0, 0, 0.6);
    camera.updateMatrixWorld();
    const out: Record<string, Pt> = {};
    for (const b of BASES) {
      const [x, z] = W(b.ll);
      const v = new THREE.Vector3(x, 0.54, z).project(camera);
      out[`${b.ll[0]},${b.ll[1]}`] = [((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height];
    }
    onBases(out);
  }, [camera, size, onBases]);
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[-8, 14, 10]} intensity={2.2} />
      <directionalLight position={[10, 6, -8]} intensity={0.8} />
      <mesh geometry={geo}>
        <meshStandardMaterial color="#e9e9e9" roughness={0.85} metalness={0} />
      </mesh>
      <lineSegments geometry={outline}>
        <lineBasicMaterial color="#ffffff" />
      </lineSegments>
      <lineSegments geometry={rivers}>
        <lineBasicMaterial color="#a1a1a1" />
      </lineSegments>
      <lineSegments geometry={arcs}>
        <lineBasicMaterial color="#4d4d4d" />
      </lineSegments>
    </>
  );
}
