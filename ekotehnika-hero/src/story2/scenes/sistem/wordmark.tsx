// The EKOTEHNIKA wordmark on the carton of the hero's pallet, moved out of index.tsx in round 8 so the preloader's cartons print the same file
// the same way (loaderscene.tsx). Nothing in it changed.
import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// The EKOTEHNIKA wordmark from public/brand/ekotehnika.svg, the file itself drawn into a texture exactly as supplied,
// its red mark included, never redrawn or recoloured. It prints dark on the light carton.
export const MARK_W = 0.7;
export const MARK_H = (MARK_W * 33.75) / 164.76;
export function useWordmark() {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let off = false;
    fetch('/brand/ekotehnika.svg')
      .then((r) => r.text())
      .then((svg) => {
        const w = 1024;
        const h = Math.round((w * 33.75) / 164.76);
        const img = new Image();
        img.onload = () => {
          if (off) return;
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          c.getContext('2d')!.drawImage(img, 0, 0, w, h);
          const t = new THREE.CanvasTexture(c);
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          setTex(t);
          invalidate();
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg width="${w}" height="${h}" `));
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [invalidate]);
  return tex;
}

// The wordmark printed on both long faces of the carton on the hero's pallet, high on the face above the bin label, in
// the pallet's own frame (Pallet in r3f/Forklift.tsx, carton 1.08 by 0.78 by 0.86 from 0.14 up).
export function CartonMarks({ tex }: { tex: THREE.Texture }) {
  const mat = useRef(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 })).current;
  mat.map = tex;
  mat.needsUpdate = true;
  return (
    <>
      <mesh position={[0, 0.8, 0.4345]} material={mat}>
        <planeGeometry args={[MARK_W, MARK_H]} />
      </mesh>
      <mesh position={[0, 0.8, -0.4345]} rotation={[0, Math.PI, 0]} material={mat}>
        <planeGeometry args={[MARK_W, MARK_H]} />
      </mesh>
    </>
  );
}
