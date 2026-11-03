// The camera of the preloader, round 8, one function of the numbers in loader.ts like every camera of the story. poseAt (camera.tsx) has
// already laid the hero pose into the pose it is given, so this only has to place the loader's own pose and blend the two by go, the one
// move that hands the page over. The blend is made in the orbit parameters (what the camera looks at, how far it stands, its yaw and
// pitch, and the lens shift) and not on the camera's position, so the pull back swings round the load like the story's own flights do and
// never cuts across a corner. A gentle parallax follows the mouse and fades out as the move starts, nothing in it blocks the page.
import type { Pose } from './camera';
import { BAY, loader } from './loader';
import { lerp, rad } from './kit';

// Where the carried stack of V1 and V3 stands in the world now, set by the scene's own frame each time it places it. Metres along x, and the
// height the forks have lifted it to, so the camera keeps looking at the load while a truck drives on with it.
export const carried = { x: 1.15, lift: 0.12 };

// How far the mouse turns the camera, in degrees, at the edge of the window.
const PAN = 7;
const TILT = 3;

export function loaderPose(out: Pose) {
  const v = loader.version;
  const go = loader.go;
  let x = 0;
  let y = 0.7;
  let z = 0;
  let d = 5;
  let yaw = 38;
  let pitch = -8;
  let sx = 0;
  let sy = 0;
  let shadow = 8;
  let fov = 28;
  if (v === 1) {
    // Utovar, the forks and the pallet in front of the cab, seen from the front right
    x = carried.x - 0.2;
    y = 0.74 + carried.lift - 0.12;
    d = 5.6;
    yaw = 40;
    pitch = -9;
    sy = 0;
    shadow = 8;
  } else if (v === 2) {
    // Regal, the bay from the aisle, a little off square
    x = BAY.x + 0.9;
    y = 1.7;
    z = BAY.z + 0.6;
    d = 13.5;
    yaw = 34;
    pitch = -7;
    shadow = 11;
  } else {
    // Kutija, the carton large in the frame, from the front right
    x = carried.x;
    y = 0.62 + carried.lift - 0.12;
    d = 4.0;
    yaw = 28;
    pitch = -7;
    shadow = 7;
  }
  // the mouse, eased by the shell, Kutija turns its carton instead of the camera
  const follow = v === 3 ? 0 : 1 - go;
  yaw += loader.mx * PAN * follow;
  pitch -= loader.my * TILT * follow;
  const t = out.target;
  t.set(lerp(x, t.x, go), lerp(y, t.y, go), lerp(z, t.z, go));
  out.d = lerp(d, out.d, go);
  out.yaw = lerp(yaw, out.yaw, go);
  out.pitch = lerp(pitch, out.pitch, go);
  out.sx = lerp(sx, out.sx, go);
  out.sy = lerp(sy, out.sy, go);
  out.shadow = lerp(shadow, out.shadow, go);
  out.fov = lerp(fov, out.fov, go);
  const a = rad(out.yaw);
  const p = rad(out.pitch);
  out.pos.set(t.x + out.d * Math.sin(a) * Math.cos(p), t.y - out.d * Math.sin(p), t.z + out.d * Math.cos(a) * Math.cos(p));
}

