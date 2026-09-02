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
          uInner: { value: 0.55 },
          uFalloff: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
      }),
    );
    marker.renderOrder = 5;
    marker.frustumCulled = false;
    const ping = new THREE.Mesh(
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
          uWidth: { value: 0.02 },
        },
        transparent: true,
        depthWrite: false,
      }),
    );
    ping.renderOrder = 5;
    ping.frustumCulled = false;
    // marker and ping sit on the surface; the coin floats above it along the normal (local +z)
    marker.position.z = 0.004;
    ping.position.z = 0.045;
    group.add(marker, ping, sprite);
    this.parent.add(group);

    const hold = this.cfg.popupHoldSec[0] + Math.random() * (this.cfg.popupHoldSec[1] - this.cfg.popupHoldSec[0]);
    this.live.push({ site, group, sprite, marker, ping, spawnedAt: instant ? now - this.IN : now, hold, leaving: null });
    this.lastSpawn = now;
  }

  private remove(p: Popup) {
    this.parent.remove(p.group);
    p.sprite.material.dispose();
    p.marker.material.dispose();
    p.ping.material.dispose();
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
      p.sprite.position.z = C.popupLift * Math.min(1, s) + 0.02;
      p.sprite.scale.setScalar(Math.max(0.0001, C.badgeSize * s));
      p.sprite.material.opacity = Math.min(1, vis);
      p.marker.material.uniforms.uOpacity.value = 0.9 * Math.min(1, vis);
      // ping: a ring that expands and fades right after the pop
      const pingT = Math.min(1, age / C.popupPingSec);
      p.ping.material.uniforms.uRadius.value = 0.08 + 0.4 * pingT;
      p.ping.material.uniforms.uWidth.value = 0.03 * (1 - pingT) + 0.006;
      p.ping.material.uniforms.uOpacity.value = 0.7 * (1 - pingT) * (1 - pingT) * Math.min(1, vis);
    }
  }

  dispose() {
    for (const p of this.live) this.remove(p);
    this.live.length = 0;
    for (const t of this.textures) t.dispose();
  }
}
