// Paints hero 7's four ground tiles off the main thread, the same painter and seeds as the page
// (hero6/groundPaint.ts), and hands back each tile's pixels, rows bottom first, the way a DataTexture
// reads them. On the page the four took about half a second of one task on Filip's machine, 20 October
// 2026, a hitch as the hero started.
import { paintGround, type Kind } from '../hero6/groundPaint';

const make = (w: number, h: number) => new OffscreenCanvas(w, h);

self.onmessage = (e: MessageEvent<{ kinds: Kind[]; w: number; h: number }>) => {
  const { kinds, w, h } = e.data;
  for (const kind of kinds) {
    const cv = paintGround(kind, make, w, h) as OffscreenCanvas;
    const src = (cv.getContext('2d') as OffscreenCanvasRenderingContext2D).getImageData(0, 0, w, h).data;
    const out = new Uint8Array(w * h * 4);
    const row = w * 4;
    for (let y = 0; y < h; y++) out.set(src.subarray((h - 1 - y) * row, (h - y) * row), y * row);
    (self as unknown as Worker).postMessage({ kind, data: out }, [out.buffer]);
  }
};
