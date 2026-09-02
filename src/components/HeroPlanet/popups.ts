import * as THREE from 'three';
import type { PlanetConfig } from './config';
import { makeBadgeTexture } from './badges';
import billboardVert from './shaders/billboard.vert.glsl?raw';
import glowFrag from './shaders/glow.frag.glsl?raw';
import outlineFrag from './shaders/outline.frag.glsl?raw';

interface Site {
  name: string;
  dir: THREE.Vector3;
  lastUsed: number;
}

interface Popup {
  site: Site;
  group: THREE.Group;
  sprite: THREE.Sprite;
  marker: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  ping: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  ping2: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  stem: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> | null;
  spawnedAt: number;
  hold: number;
  leaving: number | null;
}

const backOut = (t: number, s = 1.9) => {
  const u = t - 1;
  return u * u * ((s + 1) * u + s) + 1;
};
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Coins that pop up at real cities on the globe's surface, hold for a moment with a ping, then
 * leave — payments landing around the world. Instances live in the rotating group so they turn
 * with the globe; only sites facing the camera are chosen.
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
    this.sites = cfg.popupSites.map(([name, lat, lon]) => {
      const la = (lat * Math.PI) / 180;
      const lo = (lon * Math.PI) / 180;
      return { name, dir: new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)), lastUsed: -Infinity };
    });
    this.textures = cfg.coins.map((c) => makeBadgeTexture(c, cfg.badgeTexturePx));
  }

  private facing(site: Site) {
    this.tmp.copy(site.dir).transformDirection(this.parent.matrixWorld).transformDirection(this.camera.matrixWorldInverse);
    return this.tmp.z;
  }

  private spawn(now: number, instant: boolean) {
    const candidates = this.sites.filter(
      (s) => this.facing(s) > this.cfg.popupMinFacing && now - s.lastUsed > this.cfg.popupSiteCooldownSec && !this.live.some((p) => p.site === s),
    );
    if (!candidates.length) return;
    const site = candidates[Math.floor(Math.random() * candidates.length)];
    site.lastUsed = now;
    const coin = this.cfg.coins[this.coinIndex % this.cfg.coins.length];
    const texture = this.textures[this.coinIndex % this.textures.length];
    this.coinIndex++;

    const group = new THREE.Group();
    group.position.copy(site.dir);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), site.dir);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.renderOrder = 6;
    const marker = new THREE.Mesh(
      this.quad,
      new THREE.ShaderMaterial({
        vertexShader: billboardVert,
        fragmentShader: glowFrag,
        uniforms: {
          uSize: { value: this.cfg.popupMarkerSize },
          uAspect: { value: 1 },
          uColor: { value: new THREE.Color(coin.color) },
          uOpacity: { value: 0 },
          uInner: { value: 0.86 }, // flat disc, anti-aliased edge only
          uFalloff: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
      }),
    );
    marker.renderOrder = 5;
    marker.frustumCulled = false;
    const makeRing = () => {
      const m = new THREE.Mesh(
        this.quad,
        new THREE.ShaderMaterial({
          vertexShader: billboardVert,
          fragmentShader: outlineFrag,
          uniforms: {
            uSize: { value: this.cfg.popupPingSize },
            uAspect: { value: 1 },
            uColor: { value: new THREE.Color(coin.color) },
            uOpacity: { value: 0 },
            uRadius: { value: 0.1 },
            uWidth: { value: 0.01 },
            uSweep: { value: 1 },
            uStart: { value: 0 },
          },
          transparent: true,
          depthWrite: false,
        }),
      );
      m.renderOrder = 5;
      m.frustumCulled = false;
      m.position.z = 0.05;
      return m;
    };
    const ping = makeRing();
    const ping2 = makeRing();
    marker.position.z = 0.004;
    group.add(marker, ping, ping2, sprite);
    let stem: Popup['stem'] = null;
    if (this.cfg.popupStem) {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0.01), new THREE.Vector3(0, 0, 0.02)]);
      stem = new THREE.Line(g, new THREE.LineBasicMaterial({ color: coin.color, transparent: true, opacity: 0 }));
      stem.renderOrder = 5;
      stem.frustumCulled = false;
      group.add(stem);
    }
    this.parent.add(group);

    const hold = this.cfg.popupHoldSec[0] + Math.random() * (this.cfg.popupHoldSec[1] - this.cfg.popupHoldSec[0]);
    this.live.push({ site, group, sprite, marker, ping, ping2, stem, spawnedAt: instant ? now - this.IN : now, hold, leaving: null });
    this.lastSpawn = now;
  }

  private remove(p: Popup) {
    this.parent.remove(p.group);
    p.sprite.material.dispose();
    p.marker.material.dispose();
    p.ping.material.dispose();
    p.ping2.material.dispose();
    if (p.stem) {
      p.stem.geometry.dispose();
      p.stem.material.dispose();
    }
  }

  /** @param appear 0..1 entrance gate; @param frozen static pose (reduced motion) */
  update(now: number, appear: number, frozen: boolean) {
    const C = this.cfg;
    if (appear > 0.05 && this.live.length < C.popupVisible && now - this.lastSpawn > C.popupSpawnGapSec) {
      this.spawn(now, frozen);
      if (frozen) while (this.live.length < C.popupVisible) { const n = this.live.length; this.spawn(now, true); if (this.live.length === n) break; }
    }
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      const age = now - p.spawnedAt;
      const face = smooth(C.popupMinFacing * 0.5, C.popupMinFacing, this.facing(p.site));
      if (p.leaving === null && !frozen && (age > this.IN + p.hold || face < 0.4)) p.leaving = now;
      let s: number;
      if (p.leaving !== null) {
        const t = (now - p.leaving) / this.OUT;
        if (t >= 1) { this.remove(p); this.live.splice(i, 1); continue; }
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
      // two clean rings expand from the marker and fade, the second a beat behind
      const rings: [THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>, number][] = [[p.ping, 0], [p.ping2, 0.3]];
      for (const [ring, delay] of rings) {
        const t = Math.min(1, Math.max(0, (age - delay) / C.popupPingSec));
        const e = 1 - Math.pow(1 - t, 2);
        ring.material.uniforms.uRadius.value = 0.06 + 0.42 * e;
        ring.material.uniforms.uOpacity.value = (t > 0 && t < 1 ? 1 - e : 0) * 0.9 * Math.min(1, vis);
      }
    }
  }

  dispose() {
    for (const p of this.live) this.remove(p);
    this.live.length = 0;
    for (const t of this.textures) t.dispose();
  }
}
