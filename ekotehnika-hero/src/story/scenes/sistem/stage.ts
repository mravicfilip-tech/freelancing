// The Sistem stage. Everything in the dark studio lives here as plain three objects, and update(beat, k)
// puts all of it where that moment of the story needs it. Nothing is stored between frames, so any
// still clock gives the right picture, and each beat ends where the next one begins.
//
// World. Metres, ground y = 0, forks point +x, the camera looks from +z. The story walks along +x
// after the renewal rings, so every beat has its own patch of floor.
import * as THREE from 'three';
import { setPose, type ForkliftApi } from '../../../r3f/Forklift';
import { C } from '../../../tokens';
import * as S from '../../../variants/v5/shaders';
import { buildCloud } from './cloud';
import { checkBadge, columnTexture, numberBadge, pinTexture, radialTexture, ringTexture, sealTexture, tagTexture, textTexture, warnTexture } from './labels';
import { along, mapData, ribbon } from './map';
import { BED, PalletSet, buildDeliveryTruck, buildLift, buildPalletTruck, buildPicker, buildReach, buildVan, type Built } from './models';
import { clamp01, ease, inOut, lerp, out, range, smooth, track } from './tracks';
import { makeWear, prepare } from './wear';

const col = (hex: string) => new THREE.Color().setStyle(hex, THREE.NoColorSpace);
const WHITE = col(C.white);
const LIGHT = col(C.lightGrey);

// ---------------------------------------------------------------------------------------------
// Layout, in metres.
const PILE_X = 3.4; // centre of the first pallet in a pile row
const LANE_Z = -4.6; // the delivery truck lane, behind the pile
const PILE_Z = 0.2;
const HERO_Z = 1.9;
const TRUCK_REAR = 3.4; // where the delivery truck parks, its rear edge
const TRUCK_OUT = 6.9; // where the delivered forklift stops
const RING_X = (i: number) => -12.35 + 1.9 * i;
const PAD_X = (j: number) => 4.4 * j;
const PIN_X = 19.6;
const K1_X = [26.2, 30.2, 34.2, 38.4];
const FIRST_RACK = 12;
const CARRIED = 60;

// A pile of twelve, five then four then three, bottom row first.
function pilePos(i: number): [number, number, number] {
  if (i < 5) return [PILE_X + i * 1.0, 0, PILE_Z];
  if (i < 9) return [PILE_X + 0.5 + (i - 5) * 1.0, 0.93, PILE_Z];
  return [PILE_X + 1.0 + (i - 9) * 1.0, 1.86, PILE_Z];
}

// ---------------------------------------------------------------------------------------------
// Camera and light tracks over u, the beat index plus k. Camera is target, distance, elevation and
// azimuth, so a move is one key per change and the lens never flips.
type Cam = { tx: number; ty: number; tz: number; d: number; el: number; az: number };
const cam = (...keys: [number, number, number, number, number, number, number][]) => {
  const f = (i: number) => track(keys.map((k) => [k[0], k[i]]));
  const t = ['tx', 'ty', 'tz', 'd', 'el', 'az'].map((_, i) => f(i + 1));
  return (u: number): Cam => ({ tx: t[0](u), ty: t[1](u), tz: t[2](u), d: t[3](u), el: t[4](u), az: t[5](u) });
};
// [u, tx, ty, tz, d, el, az]
const CAMERA = cam(
  [0.0, 1.8, 1.1, 1.5, 14.5, 13, 16],
  [0.6, 1.9, 1.1, 1.4, 15, 14, 14],
  [1.0, 3.1, 1.1, 0.9, 19, 18, 10],
  [2.0, 3.9, 1.0, 0.6, 21, 26, 8],
  [2.6, 3.4, 1.0, -1.6, 24, 38, 3],
  [3.0, 3.5, 1.0, -2.0, 24, 40, 0],
  [3.8, 3.5, 1.0, -2.0, 24, 40, 0],
  [4.0, -12.7, 1.1, 0.2, 15.5, 14, 14],
  [5.0, -12.7, 1.1, 0.2, 15, 16, 10],
  [5.4, -5.2, 1.0, 0.0, 30, 20, 0],
  [6.0, -5.0, 1.0, 0.0, 30, 22, 0],
  [6.5, 0.7, 1.7, 0.0, 15, 18, 24],
  [7.0, 0.7, 1.5, 0.0, 17, 22, 12],
  [8.0, 0.7, 2.2, 0.0, 29, 24, 6],
  [8.1, 0.9, 1.8, 0.0, 26, 22, 6],
  [8.3, 4.2, 1.8, 0.0, 26, 22, 6],
  [8.62, 5.2, 1.8, 0.0, 26, 22, 6],
  [8.74, 9.4, 1.8, 0.0, 26, 22, 6],
  [8.84, 9.7, 1.8, 0.0, 26, 22, 6],
  [8.94, 13.8, 1.8, 0.0, 26, 22, 6],
  [9.0, 13.9, 1.8, 0.0, 26, 22, 6],
  [9.35, 14.6, 1.0, 0.0, 12, 19, 12],
  [10.0, 17.0, 1.0, 0.0, 12.5, 18, 14],
  [10.5, 20.0, 2.5, 0.0, 16, 14, 14],
  [11.0, 20.2, 2.7, 0.0, 16, 14, 12],
  [11.45, 17.7, 0.0, -2.4, 37, 62, 0],
  [12.0, 17.7, 0.0, -2.3, 36, 62, 0],
  [12.35, 20.6, 1.6, 0.0, 19, 22, 14],
  [13.0, 26.0, 1.0, 0.0, 17, 17, 10],
  [13.5, 32.4, 1.4, 0.0, 35, 25, 0],
  [14.0, 32.4, 1.4, 0.0, 36, 25, 0],
);

// Spot level, spot cone, flat light mix, key light mix, floor pool size and glow, dust.
const SPOT = track([
  [0, 0], [0.3, 1], [3.9, 1], [3.99, 0.05], [4.2, 0.7], [5.0, 0.7], [5.4, 1], [10.3, 1], [10.9, 0.3], [11.0, 0.3], [11.5, 0.45], [12.0, 0.45], [12.4, 1], [13.0, 1], [13.6, 1.25], [14, 1.25],
]);
const FLAT = track([[0, 0], [3.95, 0], [4.15, 1], [5.0, 1], [5.45, 0], [14, 0]]);
const KEY = track([[0, 0], [6.0, 0], [6.25, 1], [7.0, 1], [7.4, 0], [14, 0]]);
const DUSTO = track([[0, 0.2], [0.5, 0.45], [4.0, 0.45], [11.0, 0.45], [11.6, 0.1], [12.2, 0.1], [12.6, 0.4], [14, 0.4]]);

export type StageParts = {
  hero: THREE.Group;
  heroLift: THREE.Group;
  heroApi: ForkliftApi;
  k1: THREE.Group;
  k1Api: ForkliftApi;
};

type Hero = {
  x: number; y: number; z: number; ry: number; rz: number; lift: number;
  w: [number, number, number, number];
  cut: number; glow: number; band: number; scatter: number; cloud: number; visible: boolean; onLift: boolean;
};

const textSprite = (text: string, height: number, weight = 500, alpha = 1, opts: Partial<THREE.SpriteMaterialParameters> = {}) => {
  const tex = textTexture(text, weight, alpha);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, ...opts }));
  s.scale.set(height * (tex.userData.aspect as number), height, 1);
  return s;
};
const sprite = (tex: THREE.Texture, w: number, h: number, opts: Partial<THREE.SpriteMaterialParameters> = {}) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, ...opts }));
  s.scale.set(w, h, 1);
  return s;
};

export class Stage {
  root = new THREE.Group();
  private parts!: StageParts;
  private wear = makeWear();
  private radial = radialTexture();
  // lights
  private spot = new THREE.SpotLight(0xffffff, 0, 60, 0.42, 1, 2);
  private spotTarget = new THREE.Object3D();
  private rim = new THREE.DirectionalLight(0xffffff, 1.8);
  private fill = new THREE.DirectionalLight(0xffffff, 0.55);
  // ground
  private pool: THREE.Mesh;
  private vig!: THREE.Mesh;
  private vigMat!: THREE.MeshBasicMaterial;
  private poolMat: THREE.MeshBasicMaterial;
  private tiles: THREE.InstancedMesh;
  private tileMat: THREE.ShaderMaterial;
  private tileGroup = new THREE.Group();
  private dust: THREE.Points;
  private dustMat: THREE.ShaderMaterial;
  private dustGroup = new THREE.Group();
  private wellRing: THREE.Mesh;
  // props
  private pallets = new PalletSet(64);
  private truck = buildDeliveryTruck();
  private truckGroup = new THREE.Group();
  private streaks: THREE.Mesh[] = [];
  private rings: { g: THREE.Group; ring: THREE.Mesh; halo: THREE.Mesh; sheet: THREE.Mesh; on: THREE.Sprite; off: THREE.Sprite; sheetMat: THREE.ShaderMaterial; ringMat: THREE.MeshBasicMaterial; haloMat: THREE.MeshBasicMaterial }[] = [];
  private pads: { g: THREE.Group; ring: THREE.Mesh; disc: THREE.Mesh; label: THREE.Sprite; bar: THREE.Mesh; ringMat: THREE.MeshBasicMaterial; discMat: THREE.MeshBasicMaterial; labelMat: THREE.SpriteMaterial; barMat: THREE.MeshBasicMaterial }[] = [];
  private racks: { x: number; z: number; ry: number; glow: THREE.Mesh; glowMat: THREE.MeshBasicMaterial }[] = [];
  private rackUp: THREE.InstancedMesh;
  private rackBeam: THREE.InstancedMesh;
  private rackDeep: THREE.InstancedMesh;
  private map = new THREE.Group();
  private mapData = mapData();
  private mapParts: { fillMat: THREE.MeshBasicMaterial; serbia: THREE.Mesh[]; nb: THREE.Mesh[]; solid: THREE.Mesh; solidLen: number; dots: THREE.Points; dotsMat: THREE.PointsMaterial; labels: THREE.Sprite[]; pins: THREE.Sprite[]; runner: THREE.Sprite; runnerCore: THREE.Sprite; serbiaMat: THREE.MeshBasicMaterial; nbMat: THREE.MeshBasicMaterial; solidMat: THREE.MeshBasicMaterial };
  private lift = buildLift();
  private checks: { on: THREE.Sprite; off: THREE.Sprite }[] = [];
  private warn: THREE.Sprite;
  private warnRings: THREE.Sprite[] = [];
  private seal: THREE.Sprite;
  private sealGlow: THREE.Sprite;
  private shock: THREE.Mesh;
  private shockMat: THREE.MeshBasicMaterial;
  private reach2: Built = buildReach();
  private van: Built = buildVan();
  private tags: THREE.Sprite[] = [];
  private leaders: THREE.Points[] = [];
  private seal2: THREE.Sprite;
  private forms: Built[] = [];
  private cloud: THREE.Points | null = null;
  private k1b!: THREE.Group;
  private flashRing: THREE.Mesh;
  private flashMat: THREE.MeshBasicMaterial;
  ready = false;

  constructor(private dpr: number) {
    const R = this.root;
    // lights
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(2048, 2048);
    this.spot.shadow.bias = -0.0004;
    this.spot.shadow.camera.near = 2;
    this.spot.shadow.camera.far = 40;
    this.spot.penumbra = 1;
    this.spot.target = this.spotTarget;
    R.add(this.spot, this.spotTarget, this.rim, this.fill);
    this.rim.position.set(-4, 3, -8);
    this.fill.position.set(7, 4, 9);

    // floor, tiles and the pool of light on it
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: new THREE.Color(C.ink).multiplyScalar(0.7), roughness: 0.9, metalness: 0, envMapIntensity: 0.12 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    R.add(floor);

    const GRID = 60;
    const tg = new THREE.PlaneGeometry(1, 1);
    tg.rotateX(-Math.PI / 2);
    const phase = new Float32Array(GRID * GRID);
    for (let i = 0; i < phase.length; i++) phase[i] = Math.random();
    tg.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
    this.tileMat = new THREE.ShaderMaterial({
      vertexShader: S.tileVert,
      fragmentShader: S.tileFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uReveal: { value: 1 },
        uOpacity: { value: 1 },
        uTime: { value: 0 },
        uSweep: { value: new THREE.Vector2(0, 0) },
        uSweepOn: { value: 1 },
        uEdge: { value: 0.16 },
        uSweep2: { value: LIGHT },
        uFace: { value: col(C.ink).multiplyScalar(0.55) },
      },
    });
    this.tiles = new THREE.InstancedMesh(tg, this.tileMat, GRID * GRID);
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (let x = 0; x < GRID; x++) for (let z = 0; z < GRID; z++) m4.makeTranslation(x - GRID / 2, 0.006, z - GRID / 2 + 0.5), this.tiles.setMatrixAt(n++, m4);
    this.tiles.frustumCulled = false;
    this.tiles.renderOrder = -4;
    this.tileGroup.add(this.tiles);
    R.add(this.tileGroup);

    {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const g = c.getContext('2d')!;
      const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      grd.addColorStop(0, 'rgba(10,10,11,0)');
      grd.addColorStop(0.07, 'rgba(10,10,11,0.05)');
      grd.addColorStop(0.15, 'rgba(10,10,11,0.62)');
      grd.addColorStop(0.24, 'rgba(10,10,11,0.95)');
      grd.addColorStop(0.3, 'rgba(10,10,11,1)');
      grd.addColorStop(1, 'rgba(10,10,11,1)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 256, 256);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      this.vigMat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false });
      this.vig = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.vigMat);
      this.vig.rotation.x = -Math.PI / 2;
      this.vig.position.y = 0.009;
      this.vig.renderOrder = -3.5;
      this.vig.scale.set(190, 190, 1);
      R.add(this.vig);
    }
    this.poolMat = new THREE.MeshBasicMaterial({ map: this.radial, color: LIGHT, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.poolMat);
    this.pool.rotation.x = -Math.PI / 2;
    this.pool.position.y = 0.012;
    this.pool.renderOrder = -3;
    R.add(this.pool);

    // the well, a thin ring of light around where the truck rises
    this.flashMat = new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    this.flashRing = new THREE.Mesh(new THREE.RingGeometry(0.97, 1.0, 96), this.flashMat);
    this.flashRing.rotation.x = -Math.PI / 2;
    this.flashRing.position.y = 0.02;
    R.add(this.flashRing);
    this.wellRing = new THREE.Mesh(new THREE.RingGeometry(2.95, 3.0, 96), new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.wellRing.rotation.x = -Math.PI / 2;
    this.wellRing.position.y = 0.02;
    R.add(this.wellRing);

    // dust
    const dn = 2200;
    const dp = new Float32Array(dn * 3);
    const dr = new Float32Array(dn * 3);
    const dc = new Float32Array(dn * 3);
    for (let i = 0; i < dn; i++) {
      dp[i * 3] = (Math.random() * 2 - 1) * 20;
      dp[i * 3 + 1] = Math.random() * 9 + 0.1;
      dp[i * 3 + 2] = (Math.random() * 2 - 1) * 18 - 2;
      dr.set([Math.random(), Math.random(), Math.random()], i * 3);
      (Math.random() < 0.12 ? col(C.tonedTextGrey) : WHITE).toArray(dc, i * 3);
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('color', new THREE.BufferAttribute(dc, 3));
    dg.setAttribute('aRand', new THREE.BufferAttribute(dr, 3));
    dg.setAttribute('aTarget', new THREE.BufferAttribute(dp.slice(), 3));
    this.dustMat = new THREE.ShaderMaterial({
      vertexShader: S.pointVert,
      fragmentShader: S.pointFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uScatter: { value: 1 }, uSwirl: { value: 0.3 }, uSettle: { value: 0 }, uSize: { value: 22 }, uDpr: { value: dpr }, uOpacity: { value: 0.3 } },
    });
    this.dust = new THREE.Points(dg, this.dustMat);
    this.dust.frustumCulled = false;
    this.dustGroup.add(this.dust);
    R.add(this.dustGroup);

    // pallets
    R.add(this.pallets.group);

    // delivery truck
    this.truckGroup.add(this.truck.root);
    R.add(this.truckGroup);
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      m.visible = false;
      this.streaks.push(m);
      R.add(m);
    }

    // seven gantry rings
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      g.position.set(RING_X(i), 0, 0);
      const ringMat = new THREE.MeshBasicMaterial({ color: LIGHT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.028, 10, 90), ringMat);
      ring.rotation.y = 1.2;
      ring.position.y = 1.2;
      const haloMat = new THREE.MeshBasicMaterial({ color: LIGHT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.16, 10, 90), haloMat);
      halo.rotation.y = 1.2;
      halo.position.y = 1.2;
      const sheetMat = new THREE.ShaderMaterial({ vertexShader: S.beamVert, fragmentShader: S.sheetFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uOpacity: { value: 0 } } });
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), sheetMat);
      sheet.rotation.y = 1.2;
      sheet.position.y = 1.2;
      const on = sprite(numberBadge(i + 1, true), 1.0, 1.0);
      const off = sprite(numberBadge(i + 1, false), 1.0, 1.0);
      on.position.set(0, 3.5, 0);
      off.position.set(0, 3.5, 0);
      g.add(halo, ring, sheet, off, on);
      g.visible = false;
      this.rings.push({ g, ring, halo, sheet, on, off, sheetMat, ringMat, haloMat });
      R.add(g);
    }

    // four pads
    const labels = ['Dvorište', 'Regali', 'Utovar', 'Prolaz'];
    for (let j = 0; j < 4; j++) {
      const g = new THREE.Group();
      g.position.set(PAD_X(j), 0, 0);
      const ringMat = new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.03, 80), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      const discMat = new THREE.MeshBasicMaterial({ map: this.radial, color: LIGHT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const disc = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), discMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = 0.016;
      const label = textSprite(labels[j], 0.62, 500, 1, { opacity: 0 });
      const labelMat = label.material;
      label.position.set(0, 0.4, 3.5);
      const barMat = new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.07), barMat);
      bar.rotation.x = -Math.PI / 2;
      bar.position.set(0, 0.03, 2.7);
      g.add(disc, ring, bar, label);
      g.visible = false;
      this.pads.push({ g, ring, disc, label, bar, ringMat, discMat, labelMat, barMat });
      R.add(g);
    }

    // racks made of light
    const rackDefs = [
      { x: -4.2, z: -3.4, ry: 0 },
      { x: -1.4, z: -3.4, ry: 0 },
      { x: 1.4, z: -3.4, ry: 0 },
      { x: 4.2, z: -3.4, ry: 0 },
      { x: -5.6, z: -0.6, ry: Math.PI / 2 },
      { x: 6.0, z: -0.6, ry: Math.PI / 2 },
    ];
    const rackMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.textGrey), emissive: new THREE.Color(C.tonedTextGrey), emissiveIntensity: 0.55, roughness: 0.5, metalness: 0.3 });
    this.rackUp = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 1, 0.07), rackMat, rackDefs.length * 4);
    this.rackBeam = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 0.07, 0.07), rackMat, rackDefs.length * 8);
    this.rackDeep = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 1.1), rackMat, rackDefs.length * 8);
    for (const m of [this.rackUp, this.rackBeam, this.rackDeep]) {
      m.frustumCulled = false;
      m.castShadow = true;
      R.add(m);
    }
    const colTex = columnTexture();
    for (const d of rackDefs) {
      const gm = new THREE.MeshBasicMaterial({ map: colTex, color: LIGHT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const geo = new THREE.PlaneGeometry(2.7, 1);
      geo.translate(0, 0.5, 0);
      const mesh = new THREE.Mesh(geo, gm);
      mesh.position.set(d.x, 0, d.z + 0.56);
      mesh.rotation.y = d.ry;
      mesh.visible = false;
      this.racks.push({ ...d, glow: mesh, glowMat: gm });
      R.add(mesh);
    }

    // the map
    {
      const md = this.mapData;
      const g = this.map;
      const fillMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#33363c'), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
      for (const f of md.fills) {
        const m = new THREE.Mesh(f, fillMat);
        m.position.y = 0.01;
        g.add(m);
      }
      const serbiaMat = new THREE.MeshBasicMaterial({ color: LIGHT, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      const nbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.tonedTextGrey), transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      const serbia = md.serbiaRings.map((r) => new THREE.Mesh(ribbon(r, 0.075, true), serbiaMat));
      const nb = md.neighbourRings.map((r) => new THREE.Mesh(ribbon(r, 0.04, true), nbMat));
      [...serbia, ...nb].forEach((m) => {
        m.frustumCulled = false;
        g.add(m);
      });
      // the road, dotted ahead, solid behind the point of light
      const dotsGeo = new THREE.BufferGeometry().setFromPoints(md.route);
      const dotsMat = new THREE.PointsMaterial({ color: LIGHT, size: 0.1, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false, sizeAttenuation: true });
      const dots = new THREE.Points(dotsGeo, dotsMat);
      dots.frustumCulled = false;
      g.add(dots);
      const solidMat = new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 1, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
      const solidGeo = ribbon(md.route, 0.14, false);
      const solid = new THREE.Mesh(solidGeo, solidMat);
      solid.frustumCulled = false;
      g.add(solid);
      const runner = sprite(this.radial, 1.7, 1.7, { blending: THREE.AdditiveBlending, color: WHITE });
      const runnerCore = sprite(this.radial, 0.5, 0.5, { blending: THREE.AdditiveBlending, color: WHITE });
      g.add(runner, runnerCore);
      const labelSprites: THREE.Sprite[] = [];
      const addLabel = (text: string, pos: THREE.Vector3, left: boolean, weight = 500, alpha = 0.85) => {
        const s = textSprite(text, 0.58, weight, alpha, { opacity: 0 });
        s.center.set(left ? 1 : 0, 0.5);
        s.position.set(pos.x + (left ? -0.28 : 0.28), 0.05, pos.z);
        g.add(s);
        labelSprites.push(s);
        const dot = sprite(this.radial, 0.22, 0.22, { opacity: 0, color: LIGHT });
        dot.position.set(pos.x, 0.05, pos.z);
        g.add(dot);
        labelSprites.push(dot);
      };
      for (const p of md.places) addLabel(p.name, p.pos, p.left);
      const sb = textSprite('Srbija', 0.58, 500, 0.8, { opacity: 0 });
      sb.position.set(md.name.x, 0.05, md.name.z);
      g.add(sb);
      labelSprites.push(sb);
      const vr = textSprite('Vrčin', 0.6, 500, 1, { opacity: 0 });
      vr.center.set(1, 0.5);
      vr.position.set(md.start.x - 0.55, 0.05, md.start.z);
      g.add(vr);
      const sk = textSprite('vaše skladište', 0.6, 500, 1, { opacity: 0 });
      sk.center.set(0.5, 0.5);
      sk.position.set(md.end.x, 0.05, md.end.z + 1.65);
      g.add(sk);
      labelSprites.push(vr, sk);
      const pinTex = pinTexture();
      const pins = [md.start, md.end].map((p) => {
        const s = sprite(pinTex, 0.62, 0.93, { opacity: 0 });
        s.center.set(0.5, 0.0);
        s.position.set(p.x, 0.04, p.z);
        g.add(s);
        return s;
      });
      g.visible = false;
      R.add(g);
      this.mapParts = { fillMat, serbia, nb, solid, solidLen: md.route.length - 1, dots, dotsMat, labels: labelSprites, pins, runner, runnerCore, serbiaMat, nbMat, solidMat };
    }

    // the pit stop rig and its five checks
    this.lift.root.visible = false;
    R.add(this.lift.root);
    for (let i = 0; i < 5; i++) {
      const on = sprite(checkBadge(true), 1.0, 1.0);
      const off = sprite(checkBadge(false), 1.0, 1.0);
      on.visible = false;
      off.visible = false;
      this.checks.push({ on, off });
      R.add(on, off);
    }

    // warning, seal, shock ring
    this.warn = sprite(warnTexture(), 2.5, 2.5);
    this.warn.visible = false;
    R.add(this.warn);
    const rt = ringTexture();
    for (const s of [5.4, 4.0]) {
      const r = sprite(rt, s, s);
      r.visible = false;
      this.warnRings.push(r);
      R.add(r);
    }
    const st = sealTexture();
    this.seal = sprite(st, 1.8, 2.25);
    this.seal.center.set(0.5, 0.5);
    this.sealGlow = sprite(this.radial, 5, 5, { blending: THREE.AdditiveBlending, color: WHITE });
    this.seal.visible = false;
    this.sealGlow.visible = false;
    R.add(this.sealGlow, this.seal);
    this.seal2 = sprite(st, 0.9, 1.125, { opacity: 0 });
    this.seal2.visible = false;
    R.add(this.seal2);
    this.shockMat = new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    this.shock = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 96), this.shockMat);
    this.shock.rotation.x = -Math.PI / 2;
    this.shock.position.y = 0.025;
    R.add(this.shock);

    // closing frame extras
    this.reach2.root.visible = false;
    this.van.root.visible = false;
    R.add(this.reach2.root, this.van.root);
    ['Najam', 'Novi', 'Polovni', 'Servis'].forEach((name) => {
      const t = sprite(tagTexture(name), 3.2, 0.88, { opacity: 0 });
      t.visible = false;
      this.tags.push(t);
      R.add(t);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 18; i++) pts.push(new THREE.Vector3(0, i * 0.2, 0));
      const lp = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: LIGHT, size: 0.07, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
      lp.visible = false;
      lp.frustumCulled = false;
      this.leaders.push(lp);
      R.add(lp);
    });
  }

  // Called once the forklift groups exist. Builds the forms and the particle cloud.
  attach(parts: StageParts) {
    this.parts = parts;
    const { hero, heroLift, heroApi, k1, k1Api } = parts;
    const reach = buildReach();
    const pallet = buildPalletTruck();
    const picker = buildPicker();
    this.forms = [{ root: heroApi.root, wheels: heroApi.wheels }, reach, pallet, picker];
    heroLift.add(reach.root, pallet.root, picker.root);
    reach.root.visible = false;
    pallet.root.visible = false;
    picker.root.visible = false;
    hero.updateMatrixWorld(true);
    this.cloud = buildCloud(this.forms.map((f) => f.root), 13000, this.dpr);
    hero.add(this.cloud);
    // own the materials now the cloud has seen the red shell
    prepare(heroApi.root, { wear: this.wear });
    this.k1b = k1;
    void k1Api;
    this.ready = true;
  }

  dispose() {
    const shared = new Set<THREE.BufferGeometry>(this.mapData.fills);
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry && !shared.has(m.geometry)) m.geometry.dispose();
    });
  }

  // -------------------------------------------------------------------------------------------
  // Where the hero truck is, and what shape it is, for a point in the story.
  private heroAt(beat: number, k: number): Hero {
    const h: Hero = { x: 1, y: 0, z: HERO_Z, ry: 0, rz: 0, lift: 0.32, w: [1, 0, 0, 0], cut: -99, glow: 0, band: 0, scatter: 0, cloud: 0.18, visible: true, onLift: false };
    const form = (a: number, b: number, t: number) => {
      const w: [number, number, number, number] = [0, 0, 0, 0];
      w[a] += 1 - t;
      w[b] += t;
      return w;
    };
    switch (beat) {
      case 0: {
        // U1, the truck rises out of the floor in its pool of light and rolls a little forward
        h.y = -2.9 * (1 - ease(range(k, 0.04, 0.6)));
        h.x = lerp(0.1, 1.0, ease(range(k, 0.45, 1)));
        h.scatter = (1 - ease(range(k, 0, 0.5))) * 1.0;
        h.cloud = 0.18 + 0.7 * Math.sin(Math.PI * range(k, 0.0, 0.75));
        break;
      }
      case 1: {
        break;
      }
      case 2: {
        // N2, the truck sinks, a delivery truck brings another one in its bed
        const rear = this.truckRear(2, k);
        if (k < 0.12) {
          h.y = -2.9 * ease(range(k, 0.0, 0.1));
          h.cloud = 0.18 + 0.5 * Math.sin(Math.PI * range(k, 0, 0.1));
          h.scatter = 0.6 * Math.sin(Math.PI * range(k, 0, 0.1));
        } else {
          this.carry(h, rear, range(k, 0.64, 0.94));
        }
        break;
      }
      case 3: {
        h.x = TRUCK_OUT;
        h.z = LANE_Z + 1.0;
        h.ry = -0.45;
        const rear = this.truckRear(3, k);
        if (k < 0.5) {
          // waits while the pile goes
        } else if (k < 0.78) {
          // turns back to the ramp, then reverses up it
          const t = ease(range(k, 0.5, 0.62));
          h.z = lerp(LANE_Z + 1.0, LANE_Z, t);
          h.ry = lerp(-0.45, 0, t);
          this.carry(h, rear, 1 - ease(range(k, 0.62, 0.78)), true);
        } else {
          h.x = rear - 2.5;
          h.z = LANE_Z;
          h.ry = 0;
          h.y = BED;
        }
        break;
      }
      case 4: {
        // P1, a worn truck rolls in under flat light
        h.x = lerp(-21, -13.3, out(range(k, 0.0, 0.62)));
        h.z = 0;
        h.cut = 99;
        h.cloud = 0.04;
        break;
      }
      case 5: {
        // P2, through seven rings, rebuilt ring by ring
        h.x = -13.3 + 13.3 * k;
        h.z = 0;
        let f = 0;
        for (let i = 0; i < 7; i++) f += smooth(range(k, (i + 0.5) / 7 - 0.035, (i + 0.5) / 7 + 0.035));
        f /= 7;
        h.cut = lerp(2.5, -1.9, f);
        h.glow = 1;
        h.band = 1;
        let pulse = 0;
        for (let i = 0; i < 7; i++) pulse = Math.max(pulse, Math.exp(-Math.pow((k - (i + 0.5) / 7) / 0.03, 2)));
        h.scatter = 0.35 * pulse;
        h.cloud = 0.7;
        if (k >= 1) {
          h.cut = -1.9;
          h.glow = 0;
        }
        break;
      }
      case 6: {
        // P3, the seal lands and the truck turns under a key light
        h.x = 0;
        h.z = 0;
        h.ry = Math.PI * 2 * inOut(range(k, 0.2, 0.96));
        h.glow = 0;
        h.band = 0;
        h.cut = -1.9;
        h.cloud = 0.3 * (1 - range(k, 0, 0.3)) + 0.18;
        break;
      }
      case 7: {
        h.x = 0;
        h.z = 0;
        h.ry = Math.PI * 2;
        break;
      }
      case 8: {
        // V2, the particles reform into each model in turn, pad to pad
        h.z = 0;
        h.x = track([[0, 0], [0.1, 0], [0.24, 4.4], [0.62, 4.4], [0.74, 8.8], [0.84, 8.8], [0.94, 13.2], [1, 13.2]])(k);
        h.ry = Math.PI * 2;
        if (k < 0.1) h.w = [1, 0, 0, 0];
        else if (k < 0.24) h.w = form(0, 1, ease(range(k, 0.1, 0.24)));
        else if (k < 0.62) h.w = [0, 1, 0, 0];
        else if (k < 0.74) h.w = form(1, 2, ease(range(k, 0.62, 0.74)));
        else if (k < 0.84) h.w = [0, 0, 1, 0];
        else if (k < 0.94) h.w = form(2, 3, ease(range(k, 0.84, 0.94)));
        else h.w = [0, 0, 0, 1];
        break;
      }
      case 9: {
        // V3, the pallet truck takes a pallet across the lit disc
        h.z = 0;
        h.ry = Math.PI * 2;
        h.x = 13.2 + 3.0 * ease(range(k, 0.3, 1));
        h.w = form(3, 2, ease(range(k, 0, 0.25)));
        break;
      }
      case 10: {
        // S1, back to the counterbalance truck, it drives on and stops mid aisle
        h.z = 0;
        h.ry = Math.PI * 2;
        h.x = lerp(16.2, PIN_X, out(range(k, 0, 0.5)));
        h.w = form(2, 0, ease(range(k, 0, 0.25)));
        break;
      }
      case 11: {
        // S2, it dissolves into the map, and re forms on the pit stop rig at the pin
        h.z = 0;
        h.ry = Math.PI * 2;
        h.x = PIN_X;
        const away = ease(range(k, 0.0, 0.2));
        const back = ease(range(k, 0.8, 1.0));
        const liftH = 1.0 * ease(range(k, 0.8, 1.0));
        h.onLift = true;
        h.y = 0.28 + liftH;
        h.scatter = Math.max(away * (1 - back), (1 - back) * away);
        if (k < 0.2) h.scatter = away;
        else if (k < 0.8) h.scatter = 1;
        else h.scatter = 1 - back;
        h.cloud = k < 0.2 ? 0.18 + 0.7 * away : k < 0.8 ? 0.9 * (1 - ease(range(k, 0.2, 0.42))) : 0.9 * ease(range(k, 0.8, 0.9)) * (1 - 0.8 * back);
        h.visible = k < 0.03 || k > 0.995;
        if (k < 0.03) h.y = 0;
        break;
      }
      case 12: {
        // S3, on the rig, five checks, then it drives off
        h.z = 0;
        h.ry = Math.PI * 2;
        const o = clamp01((k - 0.66) * 3);
        const dx = 6.6 * ease(o);
        h.x = PIN_X + dx;
        const liftH = lerp(1.0, 0, ease(o));
        h.y = lerp(0.28 + liftH, 0, smooth(range(dx, 2.2, 3.0)));
        h.onLift = true;
        break;
      }
      case 13: {
        h.z = 0;
        h.ry = Math.PI * 2;
        h.x = K1_X[0];
        break;
      }
    }
    h.cloud = Math.max(h.cloud, 0.18 + 0.75 * (1 - Math.max(...h.w)));
    return h;
  }

  // The delivery truck's rear edge, by beat and k.
  private truckRear(beat: number, k: number) {
    if (beat === 2) {
      const t = range(k, 0.06, 0.52);
      return TRUCK_REAR + 22.6 * Math.pow(1 - t, 3);
    }
    if (beat === 3) {
      const t = range(k, 0.84, 1.0);
      return TRUCK_REAR - 40 * Math.pow(t, 2.1);
    }
    return TRUCK_REAR;
  }

  // The hero riding the delivery truck, and rolling down its ramp. s is the roll out progress.
  private carry(h: Hero, rear: number, s: number, backwards = false) {
    const inside = rear - 2.5;
    const x = lerp(inside, TRUCK_OUT, ease(s));
    h.x = x;
    h.z = LANE_Z;
    const slope = BED / 2.7;
    const ys = 1 - clamp01((x - (rear + 0.3)) / 2.7);
    h.y = BED * ys;
    h.rz = -Math.atan(slope) * smooth(range(x, rear + 0.1, rear + 0.7)) * (1 - smooth(range(x, rear + 2.4, rear + 3.1)));
    if (!backwards || s < 1) {
      const turn = ease(range(x, rear + 2.9, TRUCK_OUT));
      h.z = lerp(LANE_Z, LANE_Z + 1.0, turn);
      h.ry = -0.45 * turn;
    }
  }

  // -------------------------------------------------------------------------------------------
  update(beat: number, k0: number, time: number, camera: THREE.PerspectiveCamera, width: number, height: number, still: boolean) {
    if (!this.parts) return;
    // The Najam still would be an empty floor, the truck has left by the end of N3. A still holds the
    // moment the loaded truck stands ready, ramp up, and the camera stays on it.
    const rest = still && beat === 3 && k0 > 0.86;
    const k = rest ? 0.86 : k0;
    const u = rest ? 3.8 : beat + k;
    const t = still ? 2.0 : time;
    const { hero, heroLift, heroApi } = this.parts;
    const h = this.heroAt(beat, k);

    // ----- camera
    const c = CAMERA(u);
    const aspect = width / height;
    const dist = c.d * Math.max(1, 1.6 / aspect);
    const el = (c.el * Math.PI) / 180;
    const az = (c.az * Math.PI) / 180 + (still ? 0 : Math.sin(t * 0.21) * 0.012);
    camera.fov = 28;
    camera.position.set(c.tx + Math.sin(az) * Math.cos(el) * dist, c.ty + Math.sin(el) * dist, c.tz + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(c.tx, c.ty, c.tz);
    // The shell's panel covers the left third, so the subject sits at 66 percent of the width.
    camera.setViewOffset(width, height, -0.16 * width, 0, width, height);

    // ----- hero
    hero.position.set(h.x, 0, h.z);
    hero.rotation.set(0, h.ry, h.rz);
    heroLift.position.y = h.y;
    hero.visible = h.visible;
    const travel = h.x + h.z * 0.0;
    const solidIdx = h.w.findIndex((w) => w > 0.985);
    this.forms.forEach((f, i) => {
      f.root.visible = solidIdx === i && h.scatter < 0.6;
      if (i > 0) for (const w of f.wheels) w.g.rotation.z = -travel / w.r;
    });
    setPose(heroApi, { lift: h.lift, roll: travel });
    this.wear.uCut.value = h.cut;
    this.wear.uGlow.value = h.glow;
    if (this.cloud) {
      const cu = (this.cloud.material as THREE.ShaderMaterial).uniforms;
      cu.uW.value.set(h.w[0], h.w[1], h.w[2], h.w[3]);
      cu.uScatter.value = h.scatter;
      cu.uBand.value = h.band;
      cu.uCutX.value = h.cut;
      cu.uTime.value = t;
      cu.uSize.value = 3.6 * dist;
      cu.uOpacity.value = h.cloud;
      this.cloud.position.y = -0.0;
    }

    // ----- light
    const flat = FLAT(u);
    const key = KEY(u);
    const focus = this.focus(beat, h);
    const I = SPOT(u);
    this.spot.angle = lerp(lerp(0.42, 0.95, flat), 0.3, key);
    this.spot.intensity = 300 * I * lerp(1, 0.75, flat) * lerp(1, 1.6, key) * (beat === 13 ? 2.2 : 1);
    const hgt = beat === 13 ? 17 : beat === 11 ? 12 : 10.5;
    this.spot.position.set(focus.x + lerp(2.2, -3.2, key), hgt, focus.z + lerp(3.6, 4.5, key));
    this.spotTarget.position.set(focus.x, 0, focus.z);
    this.spotTarget.updateMatrixWorld();
    this.rim.intensity = lerp(1.8, 0.6, flat) * lerp(1, 1.5, key);
    this.fill.intensity = lerp(0.3, 1.0, flat);
    this.rim.position.set(focus.x - 4, 3, focus.z - 8);
    this.fill.position.set(focus.x + 7, 4, focus.z + 9);
    this.vig.position.x = focus.x;
    this.vig.position.z = focus.z;
    const vs = beat === 13 ? 330 : beat === 11 ? 280 : lerp(190, 260, flat);
    this.vig.scale.set(vs, vs, 1);
    this.pool.position.x = focus.x;
    this.pool.position.z = focus.z;
    const poolS = beat === 13 ? 26 : lerp(9, 15, flat);
    this.pool.scale.set(poolS, poolS, 1);
    this.poolMat.opacity = (beat === 13 ? 0.16 : lerp(0.12, 0.1, flat)) * I;
    this.tileGroup.position.x = Math.round(c.tx);
    this.tileGroup.position.z = Math.round(c.tz);
    this.tileMat.uniforms.uSweep.value.set(focus.x, focus.z);
    this.tileMat.uniforms.uTime.value = t;
    this.tileMat.uniforms.uOpacity.value = 1 - 0.9 * smooth(range(u, 11.0, 11.5)) * (1 - smooth(range(u, 12.3, 12.7)));
    this.dustGroup.position.set(c.tx, 0, c.tz);
    this.dustMat.uniforms.uTime.value = t;
    this.dustMat.uniforms.uOpacity.value = DUSTO(u);

    // ----- props
    this.updateWell(beat, k, u, h);
    this.updatePallets(beat, k, h);
    this.updateTruck(beat, k, h);
    this.updateRings(beat, k, h);
    this.updateRacks(beat, k);
    this.updatePads(beat, k, h);
    this.updateServis(beat, k, h, camera);
    this.updateClosing(beat, k, h, camera, t);
    this.updateSeal(beat, k, h);
    this.pallets.flush();
  }

  // Where the light pools for this moment.
  private focus(beat: number, h: Hero) {
    const o = { x: h.x + 0.6, z: h.z };
    if (beat === 1) {
      o.x = 3.2;
      o.z = -0.4;
    }
    if (beat === 2 || beat === 3) {
      o.x = 3.4;
      o.z = -2.2;
    }
    if (beat === 5) o.x = h.x + 0.6;
    if (beat === 11) {
      o.x = PIN_X;
      o.z = 0;
    }
    if (beat === 13) {
      o.x = 33;
      o.z = 0;
    }
    return o;
  }

  private updateWell(beat: number, k: number, u: number, h: Hero) {
    // The first appearance, a ring of light opens on the floor where the truck rises.
    const rise = beat === 0 ? range(k, 0.0, 0.7) : 1;
    const o = beat === 0 ? Math.sin(Math.PI * range(k, 0.02, 0.9)) : 0;
    this.wellRing.position.x = 1.0;
    this.wellRing.position.z = HERO_Z;
    (this.wellRing.material as THREE.MeshBasicMaterial).opacity = o * 0.8;
    this.wellRing.scale.setScalar(lerp(0.4, 1, ease(rise)));
    // A shock ring used for arrivals, the stamp, the pit stop.
    let fo = 0;
    let fs = 1;
    let fx = h.x;
    let fz = h.z;
    if (beat === 0) {
      fo = 0.9 * (1 - range(k, 0.1, 0.7)) * (k > 0.03 ? 1 : 0);
      fs = lerp(0.8, 5.5, out(range(k, 0.05, 0.7)));
      fx = 1.0;
      fz = HERO_Z;
    } else if (beat === 6) {
      const t = range(k, 0.28, 0.7);
      fo = 0.85 * (1 - t) * (k > 0.28 ? 1 : 0);
      fs = lerp(0.6, 8, out(t));
      fx = 0;
      fz = 0;
    }
    void u;
    this.flashMat.opacity = fo;
    this.flashRing.scale.set(fs, fs, fs);
    this.flashRing.position.x = fx;
    this.flashRing.position.z = fz;
  }

  private updatePallets(beat: number, k: number, h: Hero) {
    const P = this.pallets;
    // Piles. Count 12 once N1 is done, and away again in N3.
    for (let i = 0; i < 12; i++) {
      const [x, y0, z] = pilePos(i);
      let y = y0;
      let s = 1;
      let show = false;
      if (beat === 0) {
        if (i < 3) {
          const land = 0.62 + i * 0.12;
          const f = range(k, land - 0.12, land);
          show = f > 0;
          y = y0 + 9 * (1 - fallEase(f));
        }
      } else if (beat === 1) {
        if (i < 3) show = true;
        else {
          const land = (i - 2.5) / 9;
          const f = range(k, land - 0.11, land);
          show = f > 0;
          y = y0 + 9 * (1 - fallEase(f));
        }
      } else if (beat === 2) show = true;
      else if (beat === 3) {
        const gone = (12 - (i + 0.5)) / 24;
        const f = range(k, gone - 0.07, gone);
        show = f < 1;
        y = y0 + 9 * ease(f);
        s = 1 - f * 0.2;
      }
      P.set(i, x, y, z, Math.PI / 2, show ? s : 0);
    }
    // the carried pallet, on the MT15 forks
    let cs = 0;
    let cy = 0;
    let cx = 0;
    if (beat === 9) {
      const f = range(k, 0.08, 0.26);
      cs = f > 0 ? 1 : 0;
      cy = 0.115 + 6 * (1 - fallEase(f));
      cx = h.x + 0.74;
    } else if (beat === 10) {
      const f = ease(range(k, 0.0, 0.3));
      cs = 1 - f;
      cy = 0.115 + 6 * f;
      cx = h.x + 0.74;
    }
    P.set(CARRIED, cx, cy, 0, 0, cs);
  }

  private updateTruck(beat: number, k: number, h: Hero) {
    const g = this.truckGroup;
    let rear = TRUCK_REAR;
    let ramp = Math.PI / 2;
    let show = false;
    let speed = 0;
    if (beat === 2) {
      rear = this.truckRear(2, k);
      show = true;
      ramp = lerp(Math.PI / 2, -Math.asin((BED - 0.02) / this.truck.RL), ease(range(k, 0.5, 0.64)));
      const dk = 0.004;
      speed = Math.abs(this.truckRear(2, k + dk) - this.truckRear(2, Math.max(0, k - dk))) / (2 * dk);
    } else if (beat === 3) {
      rear = this.truckRear(3, k);
      show = rear > -30;
      ramp = lerp(-Math.asin((BED - 0.02) / this.truck.RL), Math.PI / 2, ease(range(k, 0.78, 0.86)));
      const dk = 0.004;
      speed = Math.abs(this.truckRear(3, Math.min(1, k + dk)) - this.truckRear(3, Math.max(0, k - dk))) / (2 * dk);
    }
    g.visible = show;
    g.position.set(rear, 0, LANE_Z);
    this.truck.ramp.rotation.z = ramp;
    // wheels roll with the truck
    for (const w of this.truck.wheels) w.g.rotation.z = rear / w.r;
    // light streaks trail the delivery truck while it moves fast, and the forklift in S1
    let hs = 0;
    if (beat === 10) {
      const dk = 0.004;
      hs = Math.abs(this.heroAt(10, Math.min(1, k + dk)).x - this.heroAt(10, Math.max(0, k - dk)).x) / (2 * dk);
    }
    if (show) this.streak(rear, clamp01(speed / 40), 1, LANE_Z);
    else this.streak(h.x - 1.9, clamp01(hs / 9) * (1 - smooth(range(k, 0.3, 0.5))), -1, 0);
  }

  // Thin additive lines trailing behind something that moves fast. t is the way the trail runs, +1 is
  // toward +x, anchor is the trailing end of the thing.
  private streak(anchor: number, sp: number, t: number, zc: number) {
    this.streaks.forEach((m, i) => {
      const mat = m.material as THREE.MeshBasicMaterial;
      const on = sp > 0.02;
      m.visible = on;
      if (!on) return;
      const a = (i * 0.6180339) % 1;
      const b = (i * 0.381966 + 0.17) % 1;
      const len = (1.5 + 7 * a) * (0.35 + sp);
      const start = anchor + t * (0.4 + a * 3.5);
      m.position.set(start + t * (len / 2), 0.35 + b * 3.0, zc + (i % 2 ? 1 : -1) * (0.7 + b * 1.5));
      m.scale.set(len, 0.035 + 0.04 * a, 1);
      mat.opacity = 0.5 * sp * (0.4 + 0.6 * a);
    });
  }

  private updateRings(beat: number, k: number, h: Hero) {
    const appear = beat === 5 ? smooth(range(k, 0.0, 0.3)) : beat === 6 ? 1 - smooth(range(k, 0.0, 0.3)) : 0;
    this.rings.forEach((r, i) => {
      r.g.visible = appear > 0.001;
      if (!r.g.visible) return;
      const x = RING_X(i);
      const d = h.x - x;
      const near = beat === 5 ? Math.exp(-Math.pow(d / 0.9, 2)) : 0;
      const done = beat === 6 ? 1 : beat === 5 ? smooth(range(h.x, x - 0.25, x + 0.25)) : 0;
      const rise = smooth(range(appear, i * 0.04, 0.55 + i * 0.05));
      r.g.scale.set(1, lerp(0.05, 1, rise), 1);
      r.ringMat.opacity = appear * (0.3 + 0.35 * done + 0.5 * near);
      r.haloMat.opacity = appear * (0.03 + 0.05 * done + 0.2 * near);
      r.sheetMat.uniforms.uOpacity.value = appear * near * 1.2;
      r.sheet.visible = near > 0.02;
      r.on.material.opacity = appear * done;
      r.off.material.opacity = appear * (1 - done);
      const lift = 0.1 * near;
      r.on.position.y = 3.5 + lift;
      r.off.position.y = 3.5 + lift;
      r.ring.scale.setScalar(1 + 0.04 * near);
    });
  }

  private updateRacks(beat: number, k: number) {
    const grow = beat === 7 ? smooth(range(k, 0.0, 1.0)) : beat === 8 ? 1 - smooth(range(k, 0.0, 0.3)) : beat === 6 ? 0 : 0;
    const hgt = lerp(0.001, 6.2, grow) * 1.0 + (beat === 7 ? 0 : 0);
    const H = beat === 7 ? lerp(3.3, 6.2, smooth(range(k, 0.0, 1))) : beat === 8 ? lerp(6.2, 3.3, smooth(range(k, 0, 0.3))) : 3.3;
    const alive = beat === 7 ? 1 : beat === 8 ? 1 - smooth(range(k, 0.05, 0.3)) : 0;
    void hgt;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    let iu = 0;
    let ib = 0;
    let id = 0;
    const grown = beat === 7 ? smooth(range(k, 0.0, 0.35)) : alive;
    this.racks.forEach((r, ri) => {
      const hh = Math.max(0.001, H * (beat === 7 ? lerp(0.0, 1, grown) : alive));
      r.glow.visible = alive > 0.01;
      r.glow.scale.set(1, hh, 1);
      r.glowMat.opacity = alive * 0.9;
      q.setFromEuler(e.set(0, r.ry, 0));
      const cs = Math.cos(r.ry);
      const sn = Math.sin(r.ry);
      const local = (lx: number, lz: number): [number, number] => [r.x + lx * cs + lz * sn, r.z - lx * sn + lz * cs];
      for (const [lx, lz] of [[-1.3, -0.55], [1.3, -0.55], [-1.3, 0.55], [1.3, 0.55]]) {
        const [wx, wz] = local(lx, lz);
        p.set(wx, hh / 2, wz);
        s.set(1, hh, 1);
        m.compose(p, q, s);
        this.rackUp.setMatrixAt(iu++, m);
      }
      for (let l = 0; l < 4; l++) {
        const y = hh * ((l + 1) / 4) - 0.04;
        for (const lz of [-0.55, 0.55]) {
          const [wx, wz] = local(0, lz);
          p.set(wx, y, wz);
          s.set(1, 1, 1);
          m.compose(p, q, s);
          this.rackBeam.setMatrixAt(ib++, m);
        }
        for (const lx of [-1.3, 1.3]) {
          const [wx, wz] = local(lx, 0);
          p.set(wx, y, wz);
          m.compose(p, q, s);
          this.rackDeep.setMatrixAt(id++, m);
        }
      }
      // two loaded pallets on every level that fits
      for (let l = 0; l < 4; l++) {
        const y = l === 0 ? 0 : hh * (l / 4) + 0.03;
        for (let sl = 0; sl < 2; sl++) {
          const [wx, wz] = local(sl === 0 ? -0.65 : 0.65, 0);
          const fits = y + 0.95 < hh * ((l + 1) / 4) + 0.05;
          this.pallets.set(FIRST_RACK + ri * 8 + l * 2 + sl, wx, y, wz, r.ry, alive > 0.01 && fits && ((ri * 3 + l * 5 + sl * 2) % 7 !== 0) ? 0.9 : 0);
        }
      }
    });
    this.rackUp.instanceMatrix.needsUpdate = true;
    this.rackBeam.instanceMatrix.needsUpdate = true;
    this.rackDeep.instanceMatrix.needsUpdate = true;
    const vis = alive > 0.01;
    this.rackUp.visible = vis;
    this.rackBeam.visible = vis;
    this.rackDeep.visible = vis;
  }

  private updatePads(beat: number, k: number, h: Hero) {
    const on = beat === 8 ? smooth(range(k, 0.0, 0.18)) : beat === 9 ? 1 : beat === 10 ? 1 - smooth(range(k, 0.0, 0.35)) : 0;
    const act = (j: number) => {
      const d = Math.abs(h.x - PAD_X(j));
      return Math.exp(-Math.pow(d / 1.8, 2));
    };
    this.pads.forEach((p, j) => {
      p.g.visible = on > 0.001 && (beat === 8 || j === 3);
      if (!p.g.visible) return;
      if (beat === 8) {
        const a = act(j);
        p.g.position.x = PAD_X(j);
        p.g.scale.setScalar(1);
        p.ringMat.opacity = on * (0.18 + 0.7 * a);
        p.discMat.opacity = on * (0.05 + 0.35 * a);
        p.labelMat.opacity = on * (0.45 + 0.55 * a);
        p.barMat.opacity = on * (0.28 + 0.72 * a);
      } else {
        // V3 and S1, the active pad opens into one wide lit disc the pallet truck crosses
        const m = beat === 9 ? ease(range(k, 0.0, 0.3)) : 1;
        p.g.position.x = lerp(PAD_X(3), 14.9, m);
        p.g.scale.setScalar(lerp(1, 1.6, m));
        p.ringMat.opacity = on * 0.5;
        p.discMat.opacity = on * 0.4;
        p.labelMat.opacity = on * (1 - m) * 0.9;
        p.barMat.opacity = on * (1 - m);
      }
    });
  }

  private updateServis(beat: number, k: number, h: Hero, camera: THREE.PerspectiveCamera) {
    // warning over the stopped truck
    const warnOn = beat === 10 ? smooth(range(k, 0.36, 0.56)) : beat === 11 ? 1 - smooth(range(k, 0, 0.12)) : 0;
    const pulse = beat === 10 && k >= 1 ? 1 : 0;
    this.warn.visible = warnOn > 0.01;
    this.warnRings.forEach((r) => (r.visible = warnOn > 0.01));
    if (warnOn > 0.01) {
      const bob = 1 + 0.04 * Math.sin(k * 40) * 0 + pulse * 0.0;
      this.warn.position.set(h.x + 0.4, 3.9, 0.3);
      this.warn.scale.set(1.6 * bob * lerp(0.7, 1, warnOn), 1.6 * bob * lerp(0.7, 1, warnOn), 1);
      this.warn.material.opacity = warnOn;
      this.warnRings[0].position.copy(this.warn.position);
      this.warnRings[1].position.copy(this.warn.position);
      this.warnRings[0].material.opacity = warnOn * 0.45;
      this.warnRings[1].material.opacity = warnOn * 0.65;
      const s = lerp(0.8, 1, warnOn);
      this.warnRings[0].scale.set(3.8 * s, 3.8 * s, 1);
      this.warnRings[1].scale.set(2.8 * s, 2.8 * s, 1);
    }
    // the map
    const md = this.mapData;
    const mp = this.mapParts;
    const mapOn = beat === 11 ? 1 : beat === 12 ? 1 - smooth(range(k, 0.0, 0.3)) : 0;
    this.map.visible = mapOn > 0.001;
    if (this.map.visible) {
      // Pin the map so the customer's pin sits where the stopped truck is.
      this.map.position.set(PIN_X - md.end.x, 0, 0 - md.end.z);
      const reveal = beat === 11 ? smooth(range(k, 0.02, 0.34)) : 1;
      const nbReveal = beat === 11 ? smooth(range(k, 0.0, 0.3)) : 1;
      mp.fillMat.opacity = 0.8 * reveal * mapOn;
      mp.serbiaMat.opacity = mapOn;
      mp.nbMat.opacity = 0.5 * mapOn;
      mp.serbia.forEach((m) => {
        const idx = m.geometry.index!.count;
        m.geometry.setDrawRange(0, Math.floor((idx / 6) * reveal) * 6);
      });
      mp.nb.forEach((m) => {
        const idx = m.geometry.index!.count;
        m.geometry.setDrawRange(0, Math.floor((idx / 6) * nbReveal) * 6);
      });
      const travel = beat === 11 ? range(k, 0.2, 0.97) : 1;
      const run = along(md.route, travel);
      const seg = Math.min(mp.solidLen, run.seg + 1);
      mp.solid.geometry.setDrawRange(0, seg * 6);
      mp.solidMat.opacity = mapOn;
      mp.dotsMat.opacity = 0.55 * mapOn * reveal;
      mp.runner.position.copy(run.p);
      mp.runner.position.y = 0.1;
      mp.runnerCore.position.copy(run.p);
      mp.runnerCore.position.y = 0.12;
      const rOn = beat === 11 ? smooth(range(k, 0.12, 0.3)) * (1 - 0.0) : 0;
      mp.runner.material.opacity = rOn * mapOn;
      mp.runnerCore.material.opacity = rOn * mapOn;
      mp.labels.forEach((l) => (l.material.opacity = (l.scale.y > 0.59 ? 1 : 0.85) * smooth(range(reveal, 0.5, 1)) * mapOn));
      mp.pins.forEach((p) => (p.material.opacity = smooth(range(reveal, 0.4, 0.9)) * mapOn));
      mp.pins[1].visible = true;
    }
    // the rig and its five checks
    const rigY = beat === 11 ? -0.5 * (1 - ease(range(k, 0.78, 0.9))) : beat === 12 ? -0.5 * ease(range(k, 0.9, 1.0)) : -1;
    const rigOn = (beat === 11 && k > 0.76) || (beat === 12 && k < 0.995);
    this.lift.root.visible = rigOn;
    if (rigOn) {
      const o = beat === 12 ? clamp01((k - 0.66) * 3) : 0;
      const lh = beat === 11 ? ease(range(k, 0.8, 1.0)) * 1.0 : lerp(1.0, 0, ease(o));
      this.lift.setLift(lh);
      this.lift.root.position.set(PIN_X + 0.4, rigY, 0);
    }
    const done = beat === 12 ? Math.round(Math.min(1, k * 1.5) * 5) : 0;
    const arc: [number, number][] = [[-2.6, 2.2], [-1.45, 3.0], [0, 3.4], [1.45, 3.0], [2.6, 2.2]];
    const chkOn = beat === 12 ? smooth(range(k, 0.0, 0.1)) * (1 - smooth(range(k, 0.92, 0.99))) : 0;
    this.checks.forEach((c, i) => {
      c.on.visible = c.off.visible = chkOn > 0.01;
      const bx = PIN_X + 0.4 + arc[i][0];
      const by = arc[i][1] + 1.3;
      const dn = i < done ? 1 : 0;
      c.on.position.set(bx, by, 0.5);
      c.off.position.set(bx, by, 0.5);
      c.on.material.opacity = chkOn * dn;
      c.off.material.opacity = chkOn * (1 - dn);
    });
    void camera;
  }

  private updateClosing(beat: number, k: number, h: Hero, camera: THREE.PerspectiveCamera, t: number) {
    const on = beat === 13;
    const reveal = (i: number) => (on ? smooth(range(k, [0, 1 / 6, 0.5, 5 / 6][i] - (i === 0 ? 0 : 0.12), [0, 1 / 6, 0.5, 5 / 6][i] + 0.0)) : 0);
    // slot 1, the reach truck, slot 2, a second counterbalance, slot 3, the van
    const slots: { b: THREE.Object3D; x: number; ry: number }[] = [
      { b: this.reach2.root, x: K1_X[1], ry: 0 },
      { b: this.k1b, x: K1_X[2], ry: 0 },
      { b: this.van.root, x: K1_X[3], ry: 0 },
    ];
    slots.forEach((s, i) => {
      const r = reveal(i + 1);
      s.b.visible = on && r > 0.001;
      s.b.position.set(s.x, -2.9 * (1 - r), 0);
      s.b.rotation.y = 0;
      const wheels = i === 0 ? this.reach2.wheels : i === 2 ? this.van.wheels : [];
      for (const w of wheels) w.g.rotation.z = -s.x / w.r;
      if (i === 1 && this.parts) setPose(this.parts.k1Api, { lift: 0.32, roll: s.x });
    });
    // tags above each truck
    const tagTop = [2.5, 4.5, 2.5, 2.3];
    const tagX = [K1_X[0] + 0.4, K1_X[1] + 0.6, K1_X[2] + 0.4, K1_X[3]];
    this.tags.forEach((tg, i) => {
      const r = i === 0 ? smooth(range(k, 0.0, 0.1)) : reveal(i);
      const vis = on && r > 0.01;
      tg.visible = vis;
      this.leaders[i].visible = vis;
      if (!vis) return;
      tg.position.set(tagX[i], 6.4 + (1 - r) * 0.4, 0.3);
      tg.material.opacity = r;
      const lp = this.leaders[i];
      lp.position.set(tagX[i], 0, 0.3);
      lp.scale.set(1, (6.4 - 0.6 - (tagTop[i] + 0.3)) / 3.4, 1);
      (lp.material as THREE.PointsMaterial).opacity = 0.7 * r;
      lp.position.y = tagTop[i] + 0.3;
    });
    this.seal2.visible = on && reveal(2) > 0.5;
    this.seal2.position.set(K1_X[2] + 1.4, 3.2, 0.4);
    this.seal2.material.opacity = reveal(2);
    void h;
    void camera;
    void t;
  }

  private updateSeal(beat: number, k: number, h: Hero) {
    const on = beat === 6 || (beat === 7 && k < 0.2);
    this.seal.visible = on;
    this.sealGlow.visible = on;
    if (!on) return;
    const f = beat === 6 ? k : 1;
    const drop = out(range(f, 0.0, 0.3));
    const settle = beat === 6 ? range(f, 0.3, 0.55) : 1;
    const bounce = 1 + 0.2 * Math.exp(-Math.pow((f - 0.32) / 0.07, 2)) * (beat === 6 ? 1 : 0);
    const size = lerp(0.55, 1, out(range(f, 0, 0.5))) * bounce;
    const fade = beat === 7 ? 1 - smooth(range(k, 0.0, 0.2)) : 1;
    this.seal.position.set(h.x + 0.5, lerp(6.2, 3.7, drop), 0.5);
    this.seal.scale.set(1.9 * size, 2.37 * size, 1);
    this.seal.material.opacity = fade * smooth(range(f, 0, 0.05));
    this.sealGlow.position.copy(this.seal.position);
    this.sealGlow.scale.set(5 * size, 5 * size, 1);
    this.sealGlow.material.opacity = fade * (0.25 + 0.6 * Math.exp(-Math.pow((f - 0.32) / 0.08, 2)) * (beat === 6 ? 1 : 0));
    void settle;
  }
}

// A fall that speeds up, lands and settles with a small bounce.
function fallEase(t: number) {
  const x = clamp01(t);
  if (x < 0.8) return Math.pow(x / 0.8, 2) * 1.0;
  const b = (x - 0.8) / 0.2;
  return 1 - 0.05 * Math.sin(b * Math.PI) * (1 - b);
}
