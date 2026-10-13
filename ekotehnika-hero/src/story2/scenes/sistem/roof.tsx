// A hall roof seen from above. Two pitches either side of a ridge that runs along x, standing seams down every
// slope, translucent skylight strips in frames, a ridge cap, a gutter along each eave, round roof vents and a rooftop
// unit with louvres and two fans. One component for the warehouse in the roof push and for the halls of the yard.
// Every material is passed back in `mats`. The two pitches can be handed out as groups, so the warehouse can slide them apart
// at the start of P, and the outline can be left off.
import { useMemo } from 'react';
import * as THREE from 'three';
import { G, lam, lit } from './kit';
import { BoxSet, type BoxItem } from './props';

export type RoofSpec = {
  x0: number;
  x1: number;
  z0: number; // far eave
  z1: number; // near eave
  eave: number;
  peak: number;
  /** seam spacing in metres */
  seam?: number;
  /** skylight strip pitch along x, 0 for none */
  sky?: number;
  skyPhase?: number;
  /** round vents, slope side, x, and distance down the slope from the ridge */
  vents?: { side: 1 | -1; x: number; s: number }[];
  /** rooftop units, slope side (1 near, -1 far), x, and distance down the slope from the ridge */
  units?: { side: 1 | -1; x: number; s: number }[];
  transparent?: boolean;
};

export function roofMaterials(transparent: boolean) {
  const t = { transparent, toneMapped: false } as const;
  const mk = (color: string, emissive = 0.5) => new THREE.MeshLambertMaterial({ color: lit(color), emissive: lit(color).multiplyScalar(emissive), ...t });
  return {
    near: mk(G.white, 0.55),
    far: mk(G.pale, 0.5),
    seam: mk(G.light, 0.4),
    frame: mk(G.mid, 0.4),
    glass: mk(G.light, 0.85),
    vent: mk(G.dark, 0.3),
    ventTop: mk(G.pale, 0.5),
    unit: mk(G.white, 0.55),
    unitDark: mk(G.dark, 0.3),
    gutter: mk(G.mid, 0.45),
    line: new THREE.LineBasicMaterial({ color: G.graphite, ...t, opacity: 0.8 }),
  };
}
export type RoofMats = ReturnType<typeof roofMaterials>;

function Slope({ spec, side, mats }: { spec: RoofSpec; side: 1 | -1; mats: RoofMats }) {
  const { x0, x1, z0, z1, eave, peak } = spec;
  const zc = (z0 + z1) / 2;
  const half = side > 0 ? z1 - zc : zc - z0;
  const rise = peak - eave;
  const L = Math.hypot(half, rise);
  const theta = Math.atan2(rise, half);
  const W = x1 - x0;
  const seam = spec.seam ?? 0.62;
  const set = useMemo(() => {
    const seams: BoxItem[] = [];
    const frame: BoxItem[] = [];
    const glass: BoxItem[] = [];
    const n = Math.floor(W / seam);
    const off = -W / 2 + (W - n * seam) / 2;
    for (let i = 0; i <= n; i++) seams.push([off + i * seam, 0.035, L / 2, 0.035, 0.07, L]);
    if (spec.sky) {
      const step = Math.max(2, Math.round(spec.sky / seam));
      for (let j = Math.round((spec.skyPhase ?? 2.4) / seam); j + 2 <= n - 2; j += step) {
        const w = seam * 2;
        const a = L * 0.2;
        const b = L * 0.72;
        const xc = off + j * seam + seam;
        glass.push([xc, 0.05, (a + b) / 2, w - 0.1, 0.05, b - a]);
        frame.push([xc - w / 2 + 0.04, 0.07, (a + b) / 2, 0.06, 0.09, b - a + 0.1], [xc + w / 2 - 0.04, 0.07, (a + b) / 2, 0.06, 0.09, b - a + 0.1]);
        frame.push([xc, 0.07, a, w, 0.09, 0.07], [xc, 0.07, b, w, 0.09, 0.07], [xc, 0.07, (a + b) / 2, w - 0.1, 0.05, 0.04]);
      }
    }
    // the ridge cap, the eave gutter and its lip
    const edge: BoxItem[] = [[0, 0.07, 0.12, W + 0.4, 0.14, 0.34]];
    const gut: BoxItem[] = [[0, -0.02, L + 0.08, W + 0.3, 0.2, 0.34], [0, 0.1, L + 0.2, W + 0.3, 0.08, 0.06]];
    return { seams, frame, glass, edge, gut };
  }, [W, x0, L, seam, spec.sky, spec.skyPhase, x1]);
  const units = (spec.units ?? []).filter((u) => u.side === side);
  const vents = (spec.vents ?? []).filter((v) => v.side === side);
  const cx = (x0 + x1) / 2;
  return (
    <group position={[cx, peak, (z0 + z1) / 2]} rotation={side > 0 ? [theta, 0, 0] : [-theta, Math.PI, 0]}>
      <mesh position={[0, 0, L / 2]} rotation={[-Math.PI / 2, 0, 0]} material={side > 0 ? mats.near : mats.far} receiveShadow>
        <planeGeometry args={[W, L]} />
      </mesh>
      <BoxSet items={set.seams} mat={mats.seam} cast />
      <BoxSet items={set.glass} mat={mats.glass} />
      <BoxSet items={set.frame} mat={mats.frame} cast />
      <BoxSet items={set.edge} mat={mats.seam} cast />
      <BoxSet items={set.gut} mat={mats.gutter} cast />
      {vents.map((v, i) => {
        const lx = side > 0 ? v.x - cx : -(v.x - cx);
        return (
          <group key={`v${i}`} position={[lx, 0, v.s]}>
            <mesh position={[0, 0.3, 0]} material={mats.vent} castShadow>
              <cylinderGeometry args={[0.52, 0.6, 0.6, 20]} />
            </mesh>
            <mesh position={[0, 0.66, 0]} material={mats.ventTop} castShadow>
              <cylinderGeometry args={[0.7, 0.7, 0.08, 20]} />
            </mesh>
            <mesh position={[0, 0.46, 0]} material={mats.unitDark}>
              <cylinderGeometry args={[0.62, 0.62, 0.05, 20]} />
            </mesh>
            <mesh position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.vent}>
              <ringGeometry args={[0.18, 0.3, 16]} />
            </mesh>
          </group>
        );
      })}
      {units.map((u, i) => {
        const lx = (side > 0 ? u.x - cx : -(u.x - cx));
        return (
          <group key={`u${i}`} position={[lx, 0, u.s]}>
            {/* platform rails, the unit body, louvre bands and two fans on the top */}
            <BoxSet items={[[0, 0.15, 0, 4.6, 0.12, 2.6]]} mat={mats.gutter} cast />
            <BoxSet items={[[0, 0.95, 0, 4.2, 1.5, 2.2]]} mat={mats.unit} cast />
            <BoxSet items={Array.from({ length: 7 }, (_, k) => [-1.4 + k * 0.45, 0.95, 1.12, 0.3, 1.0, 0.04] as BoxItem)} mat={mats.unitDark} />
            <BoxSet items={[[0, 1.72, 0, 4.3, 0.1, 2.3]]} mat={mats.seam} cast />
            {[-1.0, 1.0].map((fx) => (
              <group key={fx} position={[fx, 1.77, 0]}>
                <mesh material={mats.unitDark} castShadow>
                  <cylinderGeometry args={[0.72, 0.72, 0.14, 24]} />
                </mesh>
                <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.unit}>
                  <ringGeometry args={[0.52, 0.7, 24]} />
                </mesh>
                <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.unitDark}>
                  <circleGeometry args={[0.52, 24]} />
                </mesh>
                <BoxSet items={[[0, 0.1, 0, 1.04, 0.02, 0.05], [0, 0.1, 0, 0.05, 0.02, 1.04], [0, 0.1, 0, 0.5, 0.025, 0.04]]} mat={mats.unit} receive={false} />
              </group>
            ))}
            {/* a duct and a pipe run away from the unit */}
            <BoxSet items={[[2.9, 0.5, 0.2, 1.4, 0.7, 0.7], [3.9, 0.3, 0.2, 0.6, 0.12, 0.12]]} mat={mats.unit} cast />
          </group>
        );
      })}
    </group>
  );
}

export type RoofSlopes = { near?: React.Ref<THREE.Group>; far?: React.Ref<THREE.Group> };

export function Roof({ spec, mats, slopes, outline: withOutline = true }: { spec: RoofSpec; mats: RoofMats; slopes?: RoofSlopes; outline?: boolean }) {
  const zc = (spec.z0 + spec.z1) / 2;
  const outline = useMemo(() => {
    const pts = [[spec.x0, spec.eave, spec.z1], [spec.x1, spec.eave, spec.z1], [spec.x1, spec.eave, spec.z0], [spec.x0, spec.eave, spec.z0], [spec.x0, spec.eave, spec.z1]].map((p) => new THREE.Vector3(...(p as [number, number, number])));
    const ridge = [new THREE.Vector3(spec.x0, spec.peak, zc), new THREE.Vector3(spec.x1, spec.peak, zc)];
    return [new THREE.BufferGeometry().setFromPoints(pts), new THREE.BufferGeometry().setFromPoints(ridge)];
  }, [spec.x0, spec.x1, spec.z0, spec.z1, spec.eave, spec.peak, zc]);
  return (
    <group>
      <group ref={slopes?.near}>
        <Slope spec={spec} side={1} mats={mats} />
      </group>
      <group ref={slopes?.far}>
        <Slope spec={spec} side={-1} mats={mats} />
      </group>
      {withOutline && <lineLoop geometry={outline[0]} material={mats.line} />}
      {withOutline && <lineSegments geometry={outline[1]} material={mats.line} />}
    </group>
  );
}

export { lam };
