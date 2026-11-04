// The camera of the preloader, round 8, one function of the numbers in loader.ts like every camera of the story. poseAt (camera.tsx) has
// already laid the hero pose into the pose it is given, so this only has to place the loader's own pose and blend the two by go, the one
// move that hands the page over. The blend is made in the orbit parameters (what the camera looks at, how far it stands, its yaw and
// pitch, and the lens shift) and not on the camera's position, so the pull back swings round the load like the story's own flights do and
// never cuts across a corner. A gentle parallax follows the mouse and fades out as the move starts, nothing in it blocks the page.
import type { Pose } from './camera';
import { BAY, loader } from './loader';
import { lerp, rad } from './kit';
import { TALL, isTall } from '../../tall';

// The tall screen's framing, shared with camera.tsx. The lens is 28 degrees vertical, so a frame a metres wide per metre high sees a*T2 metres
// across per metre of distance, and T2 high. fitD is the distance at which a subject ws metres across fills 80 percent of the width and hs
// metres high fills the band between the logo row and the sheet, whichever of the two asks for more. It is a pure function of the stage size.
const T2 = 2 * Math.tan(rad(14));
export const fitD = (ws: number, hs: number, w: number, h: number) => {
  const band = (TALL.sheet * h - TALL.top) / h;
  return Math.max(ws / (0.8 * T2 * (w / h)), hs / (band * T2));
};
/** The lens shift that puts the middle of the subject at TALL.subject of the stage height, a share of the height, negative is up. */
export const TALL_SY = TALL.subject - 0.5;

// Where the carried stack of V1 and V3 stands in the world now, set by the scene's own frame each time it places it. Metres along x, and the
// height the forks have lifted it to, so the camera keeps looking at the load while a truck drives on with it.
export const carried = { x: 1.15, lift: 0.12 };

// How far the mouse turns the camera, in degrees, at the edge of the window.
const PAN = 7;
const TILT = 3;

export function loaderPose(out: Pose, w = 1920, h = 1080) {
  const tall = isTall(w, h);
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
    if (tall) {
      d = fitD(2.6, 2.2, w, h);
      sy = TALL_SY;
    }
  } else if (v === 2) {
    // Regal, the bay from the aisle, a little off square
    x = BAY.x + 0.9;
    y = 1.7;
    z = BAY.z + 0.6;
    d = 13.5;
    yaw = 34;
    pitch = -7;
    shadow = 11;
    if (tall) {
      d = fitD(5.2, 4, w, h);
      sy = TALL_SY;
    }
  } else {
    // Kutija, the carton large in the frame, from the front right
    x = carried.x;
    y = 0.62 + carried.lift - 0.12;
    d = 4.0;
    yaw = 28;
    pitch = -7;
    shadow = 7;
    // the carton and its pallet about 1.4 m across, centred in the band, a longer stand because the frame sees little across
    if (tall) {
      d = fitD(1.5, 1.5, w, h);
      sy = TALL_SY;
    }
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

