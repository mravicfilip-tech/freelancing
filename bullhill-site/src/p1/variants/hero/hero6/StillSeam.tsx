import type { View } from './geometry';

// Beat 4 on phones and wherever WebGL does not run. Two stills from the same camera, all schematic
// under all render, and the render still's clip follows p, so the seam slides in CSS. Stub until
// the phone slice lands, it shows the current still.
export function StillSeam({ view, p, alt }: { view: Exclude<View, 'wide'> | 'wide'; p: number; alt: string }) {
  void p;
  return <img className="h6-poster" src={`/render/hero6-${view}.webp`} alt={alt} />;
}
