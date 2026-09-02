import * as THREE from 'three';
import type { PlanetConfig } from './config';
import { makeBadgeTexture, makeLabelTexture } from './badges';
import billboardVert from './shaders/billboard.vert.glsl?raw';
import glowFrag from './shaders/glow.frag.glsl?raw';
import outlineFrag from './shaders/outline.frag.glsl?raw';

export interface Site {
  name: string;
  dir: THREE.Vector3;
  lastUsed: number;
}

interface Popup {
  site: Site;
  group: THREE.Group;
  sprite: THREE.Sprite;
  label: THREE.Sprite | null;
  marker: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  rings: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[];
  stem: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> | null;
  spawnedAt: number;
  hold: number;
  leaving: number | null;
}

export const backOut = (t: number, s = 1.9) => {
  const u = t - 1;
  return u * u * ((s + 1) * u + s) + 1;
};
export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function buildSites(cfg: PlanetConfig): Site[] {
  return cfg.popupSites.map(([name, lat, lon]) => {
    const la = (lat * Math.PI) / 180;
    const lo = (lon * Math.PI) / 180;
    return { name, dir: new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)), lastUsed: -Infinity };
  });
}

/** Flat disc on the surface (anti-aliased edge only). Not depth-tested: landings are always on the facing side. */
export function makeMarker(quad: THREE.PlaneGeometry, size: number, color: string) {
  const m = new THREE.Mesh(
    quad,
    new THREE.ShaderMaterial({
      vertexShader: billboardVert,
      fragmentShader: glowFrag,
      uniforms: {
        uSize: { value: size },
        uAspect: { value: 1 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 0 },
        uInner: { value: 0.86 },
        uFalloff: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  );
  m.renderOrder = 5;
  m.frustumCulled = false;
  return m;
}

export function makeRing(quad: THREE.PlaneGeometry, size: number, color: string) {
  const m = new THREE.Mesh(
    quad,
    new THREE.ShaderMaterial({
      vertexShader: billboardVert,
      fragmentShader: outlineFrag,
      uniforms: {
        uSize: { value: size },
        uAspect: { value: 1 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 0 },
        uRadius: { value: 0.1 },
        uWidth: { value: 0.01 },
        uSweep: { value: 1 },
        uStart: { value: 0 },
        uPulse: { value: 0 },
        uPulseLen: { value: 0 },
        uPulseColor: { value: new THREE.Color(color) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }),
  );
  m.renderOrder = 5;
  m.frustumCulled = false;
  return m;
}

/** Label chip sprite anchored so it sits to the right of the coin. */
export function makeLabel(title: string, subtitle: string, height: number) {
  const { texture, aspect } = makeLabelTexture(title, subtitle);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, opacity: 0 }));
  s.scale.set(height * aspect, height, 1);
  s.center.set(-0.12, 0.5);
  s.renderOrder = 7;
  return s;
}

/** Drives ring expansion for a landing: `rings` fade a beat apart. Returns nothing. */
export function animateRings(rings: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[], age: number, period: number, vis: number) {
  rings.forEach((ring, i) => {
    const t = Math.min(1, Math.max(0, (age - i * 0.3) / period));
    const e = 1 - Math.pow(1 - t, 2);
    ring.material.uniforms.uRadius.value = 0.06 + 0.42 * e;
    ring.material.uniforms.uOpacity.value = (t > 0 && t < 1 ? 1 - e : 0) * 0.9 * Math.min(1, vis);
  });
}

/**
 * Coins that pop up at real cities on the globe's surface, hold for a moment, then leave —
 * payments landing around the world. Instances live in the rotating group so they turn with
 * the globe; only sites facing the camera are chosen.
 */
export class CoinPopups {
  private readonly sites: Site[];
  private readonly textures: THREE.Texture[];
  private readonly live: Popup[] = [];
  private lastSpawn = -Infinity;
  private coinIndex = 0;
  private readonly tmp = new THREE.Vector3();
  private readonly IN = 0.55;
  private readonly OUT = 0.4;

  constructor(
    private readonly cfg: PlanetConfig,
    private readonly parent: THREE.Object3D,
    private readonly camera: THREE.Camera,
    private readonly quad: THREE.PlaneGeometry,
  ) {
    this.sites = buildSites(cfg);
    this.textures = cfg.coins.map((c) => makeBadgeTexture(c, cfg.badgeTexturePx, cfg.badgeStyle, cfg.badgeMonoColor));
  }

  private facing(site: Site) {
    this.tmp.copy(site.dir).transformDirection(this.parent.matrixWorld).transformDirection(this.camera.matrixWorldInverse);
    return this.tmp.z;
  }

  private spawn(now: number, instant: boolean) {
    const C = this.cfg;
    const candidates = this.sites.filter(
      (s) => this.facing(s) > C.popupMinFacing && now - s.lastUsed > C.popupSiteCooldownSec && !this.live.some((p) => p.site === s),
    );
    if (!candidates.length) return;
    const site = candidates[Math.floor(Math.random() * candidates.length)];
    site.lastUsed = now;
    const coin = C.coins[this.coinIndex % C.coins.length];
    const texture = this.textures[this.coinIndex % this.textures.length];
    this.coinIndex++;
    const accent = C.popupMarkerColor ?? (C.badgeStyle === 'mono' ? C.badgeMonoColor : coin.color);

    const group = new THREE.Group();
    group.position.copy(site.dir);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), site.dir);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false }));
    sprite.renderOrder = 6;
    const marker = makeMarker(this.quad, C.popupMarkerSize, accent);
    marker.position.z = 0.004;
    const rings: Popup['rings'] = [];
    for (let i = 0; i < C.popupRings; i++) {
      const r = makeRing(this.quad, C.popupPingSize, accent);
      r.position.z = 0.05;
      rings.push(r);
    }
    group.add(marker, ...rings, sprite);
    let stem: Popup['stem'] = null;
    if (C.popupStem) {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0.01), new THREE.Vector3(0, 0, 0.02)]);
      stem = new THREE.Line(g, new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0, depthTest: false }));
      stem.renderOrder = 5;
      stem.frustumCulled = false;
      group.add(stem);
    }
    let label: Popup['label'] = null;
    if (C.popupLabels) {
      label = makeLabel(site.name, `${coin.symbol} to ${C.siteCurrency[site.name] ?? 'local'}`, C.popupLabelHeight);
      group.add(label);
    }
    this.parent.add(group);

    const hold = C.popupHoldSec[0] + Math.random() * (C.popupHoldSec[1] - C.popupHoldSec[0]);
    this.live.push({ site, group, sprite, label, marker, rings, stem, spawnedAt: instant ? now - this.IN : now, hold, leaving: null });
    this.lastSpawn = now;
  }

  private remove(p: Popup) {
    this.parent.remove(p.group);
    p.sprite.material.dispose();
    p.marker.material.dispose();
    for (const r of p.rings) r.material.dispose();
    if (p.stem) {
      p.stem.geometry.dispose();
      p.stem.material.dispose();
    }
    if (p.label) {
      p.label.material.map?.dispose();
      p.label.material.dispose();
    }
  }

  /** @param appear 0..1 entrance gate; @param frozen static pose (reduced motion) */
  update(now: number, appear: number, frozen: boolean) {
    const C = this.cfg;
    if (appear > 0.05 && this.live.length < C.popupVisible && now - this.lastSpawn > C.popupSpawnGapSec) {
      this.spawn(now, frozen);
      if (frozen) {
        while (this.live.length < C.popupVisible) {
          const n = this.live.length;
          this.spawn(now, true);
          if (this.live.length === n) break;
        }
      }
    }
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      const age = now - p.spawnedAt;
      const face = smooth(C.popupMinFacing * 0.5, C.popupMinFacing, this.facing(p.site));
      if (p.leaving === null && !frozen && (age > this.IN + p.hold || face < 0.4)) p.leaving = now;
      let s: number;
      if (p.leaving !== null) {
        const t = (now - p.leaving) / this.OUT;
        if (t >= 1) {
          this.remove(p);
          this.live.splice(i, 1);
          continue;
        }
        s = 1 - t * t;
      } else {
        s = backOut(Math.min(1, age / this.IN));
      }
      const vis = s * appear * Math.max(face, p.leaving !== null ? 0 : 0.4);
      const lift = C.popupLift * Math.min(1, s) + 0.02;
      p.sprite.position.z = lift;
      p.sprite.scale.setScalar(Math.max(0.0001, C.badgeSize * s));
      p.sprite.material.opacity = Math.min(1, vis);
      p.marker.material.uniforms.uOpacity.value = Math.min(1, vis);
      if (p.stem) {
        const pos = p.stem.geometry.attributes.position as THREE.BufferAttribute;
        pos.setZ(1, Math.max(0.012, lift - (C.badgeSize * s) / 2));
        pos.needsUpdate = true;
        p.stem.material.opacity = 0.7 * Math.min(1, vis);
      }
      if (p.label) {
        p.label.position.set(C.badgeSize * 0.55, 0, lift);
        p.label.material.opacity = Math.min(1, vis) * smooth(0.6, 1, s);
      }
      animateRings(p.rings, age, C.popupPingSec, vis);
    }
  }

  dispose() {
    for (const p of this.live) this.remove(p);
    this.live.length = 0;
    for (const t of this.textures) t.dispose();
  }
}
