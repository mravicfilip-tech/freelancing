// Things that live on the screen, not in the world. A ScreenSpace group is glued to the camera and scaled so one
// unit is the height of the screen, x runs plus and minus half the aspect, y plus and minus a half. It follows the
// view offset the rig sets, so what you place at (0, 0) lands at the middle of the actual picture.
import { useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const m = new THREE.Matrix4();
const sc = new THREE.Matrix4();
const tr = new THREE.Matrix4();

export function ScreenSpace({ dist = 10, children }: { dist?: number; children?: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { camera, size } = useThree();
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const cam = camera as THREE.PerspectiveCamera;
    cam.updateMatrixWorld();
    const hh = dist * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    const v = cam.view;
    const sx = v && v.enabled ? -v.offsetX / v.fullWidth : 0;
    const sy = v && v.enabled ? -v.offsetY / v.fullHeight : 0;
    // content moves right and down by sx, sy of the screen, so the origin of the picture sits at (-sx, +sy) in screen units
    const aspect = size.width / size.height;
    tr.makeTranslation(-sx * 2 * hh * aspect, sy * 2 * hh, -dist);
    sc.makeScale(2 * hh, 2 * hh, 2 * hh);
    m.copy(cam.matrixWorld).multiply(tr).multiply(sc);
    g.matrixAutoUpdate = false;
    g.matrix.copy(m);
    g.matrixWorldNeedsUpdate = true;
  });
  return <group ref={ref}>{children}</group>;
}
