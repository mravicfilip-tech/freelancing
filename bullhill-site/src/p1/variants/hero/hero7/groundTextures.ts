import * as THREE from 'three';
import type { Kind } from '../hero6/groundPaint';

// Hero 7's ground tiles as textures that fill in when their pixels arrive. The pixels are painted in a
// worker (groundWorker.ts), so starting the hero never blocks the page. Without workers or OffscreenCanvas
// they are painted on the page after a frame, as they always were. `ready` settles once all four are in,
// and the scene shows nothing until then. Only the colour maps, hero 7 has never used a bump map.
const W = 1024;
const H = 512;
const KINDS: Kind[] = ['backfill', 'asphalt', 'gravel', 'sand'];

export type GroundMaps = { maps: Record<Kind, THREE.DataTexture>; ready: Promise<void>; dispose(): void };

function texture() {
  const t = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

export function groundMaps(): GroundMaps {
  const maps = Object.fromEntries(KINDS.map((k) => [k, texture()])) as Record<Kind, THREE.DataTexture>;
  const fill = (kind: Kind, data: Uint8Array) => {
    const t = maps[kind];
    t.image = { data, width: W, height: H };
    t.needsUpdate = true;
  };
  let worker: Worker | null = null;
  const ready = new Promise<void>((done) => {
    let left = KINDS.length;
    const got = (kind: Kind, data: Uint8Array) => {
      fill(kind, data);
      if (--left === 0) done();
    };
    // the old path, on the page, the canvas flipped the way a CanvasTexture reads it
    const onPage = async () => {
      const { paintGround } = await import('../hero6/groundPaint');
      for (const kind of KINDS) {
        await new Promise((r) => setTimeout(r, 0));
        const cv = paintGround(kind, (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h }), W, H) as HTMLCanvasElement;
        const src = cv.getContext('2d')!.getImageData(0, 0, W, H).data;
        const out = new Uint8Array(W * H * 4);
        const row = W * 4;
        for (let y = 0; y < H; y++) out.set(src.subarray((H - 1 - y) * row, (H - y) * row), y * row);
        got(kind, out);
      }
    };
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
      void onPage();
      return;
    }
    try {
      worker = new Worker(new URL('./groundWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<{ kind: Kind; data: Uint8Array }>) => got(e.data.kind, e.data.data);
      worker.onerror = () => {
        worker?.terminate();
        worker = null;
        left = KINDS.length;
        void onPage();
      };
      worker.postMessage({ kinds: KINDS, w: W, h: H });
    } catch {
      void onPage();
    }
  }).then(() => {
    worker?.terminate();
    worker = null;
  });
  return {
    maps,
    ready,
    dispose() {
      worker?.terminate();
      for (const t of Object.values(maps)) t.dispose();
    },
  };
}
