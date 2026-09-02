import * as THREE from 'three';
import type { PlanetConfig } from './config';
import { makeBadgeTexture } from './badges';
import { animateRings, buildSites, makeLabel, makeMarker, makeRing, smooth, type Site } from './popups';

interface Corridor {
  from: Site;
  to: Site;
  arc: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  points: THREE.Vector3[];
  coin: THREE.Sprite;
  label: THREE.Sprite | null;
  origin: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  dest: THREE.Group;
  destMarker: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  rings: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[];
  spawnedAt: number;
  leaving: number | null;
}

const SEG = 56;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * A coin travels a hairline arc from one city to another and lands with a ring: the payment
 * itself is the motion. Both ends must face the camera.
 */
export class CoinCorridors {
  private readonly sites: Site[];
  private readonly textures: THREE.Texture[];
  private readonly live: Corridor[] = [];
  private lastSpawn = -Infinity;
  private coinIndex = 0;
  private readonly tmp = new THREE.Vector3();

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
    const busy = new Set(this.live.flatMap((c) => [c.from, c.to]));
    const open = this.sites.filter((s) => this.facing(s) > C.popupMinFacing && now - s.lastUsed > C.popupSiteCooldownSec && !busy.has(s));
    if (open.length < 2) return;
    const pairs: [Site, Site][] = [];
    for (const a of open) for (const b of open) {
      if (a === b) continue;
      const deg = (a.dir.angleTo(b.dir) * 180) / Math.PI;
      if (deg >= C.corridorMinDeg && deg <= C.corridorMaxDeg) pairs.push([a, b]);
    }
    if (!pairs.length) return;
    const [from, to] = pairs[Math.floor(Math.random() * pairs.length)];
    from.lastUsed = now;
    to.lastUsed = now;
    const coin = C.coins[this.coinIndex % C.coins.length];
    const texture = this.textures[this.coinIndex % this.textures.length];
    this.coinIndex++;
    const accent = C.popupMarkerColor ?? (C.badgeStyle === 'mono' ? C.badgeMonoColor : coin.color);

    // Arc: renormalised lerp lifted by a sine, higher for longer corridors.
    const lift = C.corridorLift * (0.6 + 0.4 * Math.min(1, from.dir.angleTo(to.dir) / 1.2));
    const points: THREE.Vector3[] = [];
    for (let k = 0; k <= SEG; k++) {
      const t = k / SEG;
      points.push(from.dir.clone().lerp(to.dir, t).normalize().multiplyScalar(1.006 + Math.sin(t * Math.PI) * lift));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    geo.setDrawRange(0, 0);
    const arc = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0, depthTest: false }));
    arc.renderOrder = 5;
    arc.frustumCulled = false;

    const coinSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false, opacity: 0 }));
    coinSprite.renderOrder = 6;
    coinSprite.scale.setScalar(C.badgeSize);

    const origin = makeMarker(this.quad, C.popupMarkerSize, accent);
    origin.position.copy(from.dir).multiplyScalar(1.004);

    const dest = new THREE.Group();
    dest.position.copy(to.dir);
    dest.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), to.dir);
    const destMarker = makeMarker(this.quad, C.popupMarkerSize, accent);
    destMarker.position.z = 0.004;
    const rings: Corridor['rings'] = [];
    for (let i = 0; i < C.popupRings; i++) {
      const r = makeRing(this.quad, C.popupPingSize, accent);
      r.position.z = 0.05;
      rings.push(r);
    }
    dest.add(destMarker, ...rings);
    let label: Corridor['label'] = null;
    if (C.popupLabels) {
      label = makeLabel(`${from.name} to ${to.name}`, `${coin.symbol} to ${C.siteCurrency[to.name] ?? 'local'}`, C.popupLabelHeight);
      dest.add(label);
      label.position.set(C.badgeSize * 0.55, 0, C.popupLift + 0.02);
    }

    this.parent.add(arc, coinSprite, origin, dest);
    this.live.push({ from, to, arc, points, coin: coinSprite, label, origin, dest, destMarker, rings, spawnedAt: instant ? now - C.corridorTravelSec : now, leaving: null });
    this.lastSpawn = now;
  }

  private remove(c: Corridor) {
    this.parent.remove(c.arc, c.coin, c.origin, c.dest);
    c.arc.geometry.dispose();
    c.arc.material.dispose();
    c.coin.material.dispose();
    c.origin.material.dispose();
    c.destMarker.material.dispose();
    for (const r of c.rings) r.material.dispose();
    if (c.label) {
      c.label.material.map?.dispose();
      c.label.material.dispose();
    }
  }

  update(now: number, appear: number, frozen: boolean) {
    const C = this.cfg;
    if (appear > 0.05 && this.live.length < C.corridorVisible && now - this.lastSpawn > C.popupSpawnGapSec * 1.6) {
      this.spawn(now, frozen);
      if (frozen) {
        while (this.live.length < C.corridorVisible) {
          const n = this.live.length;
          this.spawn(now, true);
          if (this.live.length === n) break;
        }
      }
    }
    const OUT = 0.5;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const c = this.live[i];
      const age = now - c.spawnedAt;
      const travel = Math.min(1, age / C.corridorTravelSec);
      const p = easeInOut(travel);
      const faceTo = smooth(C.popupMinFacing * 0.5, C.popupMinFacing, this.facing(c.to));
      const faceFrom = smooth(C.popupMinFacing * 0.4, C.popupMinFacing * 0.8, this.facing(c.from));
      const face = Math.min(faceTo, Math.max(faceFrom, p));
      if (c.leaving === null && !frozen && (age > C.corridorTravelSec + C.corridorHoldSec || face < 0.35)) c.leaving = now;
      let fade = 1;
      if (c.leaving !== null) {
        const t = (now - c.leaving) / OUT;
        if (t >= 1) {
          this.remove(c);
          this.live.splice(i, 1);
          continue;
        }
        fade = 1 - t * t;
      }
      const vis = appear * fade * Math.max(face, 0.25);

      // draw the arc up to the coin, and move the coin along it
      const head = p * SEG;
      c.arc.geometry.setDrawRange(0, Math.max(2, Math.ceil(head) + 1));
      c.arc.material.opacity = 0.75 * vis;
      const idx = Math.min(SEG - 1, Math.floor(head));
      const frac = head - idx;
      c.coin.position.copy(c.points[idx]).lerp(c.points[idx + 1], frac);
      c.coin.position.multiplyScalar(1 + 0.015 / c.coin.position.length());
      const appearScale = Math.min(1, age / 0.35);
      c.coin.scale.setScalar(Math.max(0.0001, C.badgeSize * appearScale));
      c.coin.material.opacity = vis;
      c.origin.material.uniforms.uOpacity.value = vis;
      c.destMarker.material.uniforms.uOpacity.value = vis * smooth(0.85, 1, p);
      animateRings(c.rings, age - C.corridorTravelSec, C.popupPingSec, vis * (p >= 1 ? 1 : 0));
      if (c.label) c.label.material.opacity = vis * smooth(0.9, 1, p);
    }
  }

  dispose() {
    for (const c of this.live) this.remove(c);
    this.live.length = 0;
    for (const t of this.textures) t.dispose();
  }
}
