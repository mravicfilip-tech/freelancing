// The service van's wrap, drawn into three canvas textures, one for each side and one for the rear, after the 2023 wrap
// guideline from the client's Drive folder (briefs/round6/refs). The side is laid out as in the photo, silver cab and
// front, the LMH red rear behind a convex sweep with two grey stripes ahead of it, the wordmark high on the cargo side,
// SERVIS low on the cab door, the white Linde script and Linde Material Handling on the red. Both sides run front to
// back the same way and the text is never mirrored, so the side that shows the front on the viewer's right is drawn with
// its layout flipped and its words and logos set the right way round. Logos are the files' own paths drawn through
// Path2D, the wordmark of ekotehnika.svg, the white wordmark of ekotehnika-white.svg and the white paths of linde-mh.svg
// without its red box, split into the script and the words by their bounds. The only colours here are the four LMH
// values, white, the logo files' own colours and the scene's blacks and greys.
import * as THREE from 'three';
import { BRAND, G, brandPaths, type BrandPath } from './kit';

const LMH = { red: '#a00020', mid: '#a1a1a1', light: '#d2d2d2', pale: '#e9e9e9' } as const;

/** The side panel's frame in van metres, +x is the front. A panel's uv runs over exactly this box. */
export const SIDE = { x0: -2.14, x1: 2.14, y0: 0.27, y1: 1.82 };
const SIDE_PX = 2048;
const SIDE_PPM = SIDE_PX / (SIDE.x1 - SIDE.x0);
const SIDE_H = Math.round((SIDE.y1 - SIDE.y0) * SIDE_PPM);
const REAR_W = 1280;
const REAR_H = 940;

// The photo (van-side.jpg, front to the left) in metres. The photo is 1200 px from bumper to bumper and 517 px from
// the road to the roof, and everything below is measured on it in px.
const photoX = (px: number) => 2.2 - (px - 100) * (4.4 / 1200);
const photoY = (py: number) => (625 - py) * (1.82 / 517);
const pmm = (px: number) => px * (4.4 / 1200);

/** The brand paths of linde-mh.svg without the red box, the script is the one tall path and the words are the rest. */
function lindePaths() {
  const white = brandPaths(BRAND.linde).filter((p) => p.fill.toLowerCase() === '#ffffff');
  return { script: white.filter((p) => p.y1 - p.y0 > 30), words: white.filter((p) => p.y1 - p.y0 <= 30) };
}

const union = (ps: BrandPath[]) => ({ x0: Math.min(...ps.map((p) => p.x0)), y0: Math.min(...ps.map((p) => p.y0)), x1: Math.max(...ps.map((p) => p.x1)), y1: Math.max(...ps.map((p) => p.y1)) });

/** Draws paths from a brand file with their own fills, their joint box centred on (cx, cy) and w px wide. */
function drawPaths(g: CanvasRenderingContext2D, ps: BrandPath[], cx: number, cy: number, w: number) {
  const b = union(ps);
  const k = w / (b.x1 - b.x0);
  g.save();
  g.translate(cx - (k * (b.x0 + b.x1)) / 2, cy - (k * (b.y0 + b.y1)) / 2);
  g.scale(k, k);
  for (const p of ps) {
    g.fillStyle = p.fill;
    g.fill(new Path2D(p.d));
  }
  g.restore();
}

const FONT = '"Daxline Pro", "Fira Sans", Arial, sans-serif';

// ---- the sides ----------------------------------------------------------------------------------------------

// The red's front edge in the photo, a cubic from the sill behind the cab door to the roof over the rear wheel, convex
// towards the front and the roof, flatter as it climbs. Two stripes of 36 px and 34 px follow it ahead of the red.
const SWEEP = [[660, 548], [790, 350], [1000, 170], [1190, 106]] as const;
const STRIPE_MID = 36;
const STRIPE_LIGHT = 70;

/** The sweep as points in photo px, run on past both ends so its offsets still cross the panel's edges, pushed ahead
 *  of the red by off px along its normal. */
function sweepLine(off: number) {
  const [p0, p1, p2, p3] = SWEEP;
  const at = (t: number) => {
    const u = 1 - t;
    return [0, 1].map((i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]);
  };
  const pts: number[][] = [];
  const lead = [p0[0] - p1[0], p0[1] - p1[1]];
  const tail = [p3[0] - p2[0], p3[1] - p2[1]];
  const ln = Math.hypot(lead[0], lead[1]);
  const tn = Math.hypot(tail[0], tail[1]);
  pts.push([p0[0] + (lead[0] / ln) * 220, p0[1] + (lead[1] / ln) * 220]);
  for (let i = 0; i <= 40; i++) pts.push(at(i / 40));
  pts.push([p3[0] + (tail[0] / tn) * 220, p3[1] + (tail[1] / tn) * 220]);
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const n = Math.hypot(tx, ty);
    return [p[0] + (ty / n) * off, p[1] - (tx / n) * off];
  });
}

function paintSide(c: HTMLCanvasElement, mirror: boolean) {
  const g = c.getContext('2d')!;
  // canvas px of a photo point, the layout flips with mirror and nothing drawn at a point is ever flipped
  const px = (X: number) => (mirror ? (SIDE.x1 - X) * SIDE_PPM : (X - SIDE.x0) * SIDE_PPM);
  const py = (Y: number) => (SIDE.y1 - Y) * SIDE_PPM;
  const P = (ph: number[]) => [px(photoX(ph[0])), py(photoY(ph[1]))];
  g.fillStyle = LMH.pale;
  g.fillRect(0, 0, c.width, c.height);
  // the sweep and its two stripes, laid from the outermost, each a region from the line to the rear edge of the panel
  const region = (off: number, color: string) => {
    const line = sweepLine(off).map(P);
    g.fillStyle = color;
    g.beginPath();
    line.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    const far = P([1500, -300]);
    const low = P([1500, 900]);
    g.lineTo(far[0], far[1]);
    g.lineTo(low[0], low[1]);
    g.closePath();
    g.fill();
  };
  region(STRIPE_LIGHT, LMH.light);
  region(STRIPE_MID, LMH.mid);
  region(0, LMH.red);
  // shut lines of the cab door and the sliding door, thin and dark, and the black sill trim along the foot
  g.strokeStyle = 'rgba(0,0,0,0.3)';
  g.lineWidth = 3;
  g.beginPath();
  const seg = (x0: number, y0: number, x1: number, y1: number) => {
    g.moveTo(px(x0), py(y0));
    g.lineTo(px(x1), py(y1));
  };
  seg(0.93, 0.33, 0.93, 1.08);
  seg(0.93, 0.33, -0.17, 0.33);
  seg(-0.17, 0.33, -0.17, 1.62);
  seg(-1.13, 0.33, -1.13, 1.55);
  seg(-1.13, 1.55, -0.17, 1.62);
  g.stroke();
  g.fillStyle = G.black;
  const sill0 = px(0.93);
  const sill1 = px(-0.93);
  g.fillRect(Math.min(sill0, sill1), py(0.34), Math.abs(sill1 - sill0), py(0.27) - py(0.34));
  // the wordmark with its tagline high on the cargo side, above the stripes
  drawPaths(g, brandPaths(BRAND.wordmark), px(photoX(871)), py(photoY(174)), pmm(162) * SIDE_PPM);
  // SERVIS in spaced grey capitals low on the cab door
  const cap = ((1.82 / 517) * 28 * SIDE_PPM) / 0.7;
  g.font = `400 ${cap}px ${FONT}`;
  g.fillStyle = G.graphite;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  const wantW = pmm(154) * SIDE_PPM;
  g.letterSpacing = '0px';
  const natural = g.measureText('SERVIS').width;
  const gap = (wantW - natural) / 5;
  g.letterSpacing = `${gap}px`;
  g.fillText('SERVIS', px(photoX(599)) - wantW / 2, py(photoY(420)));
  g.letterSpacing = '0px';
  // the white Linde script high over the rear wheel and the words just above the rubbing strip, both on the red
  const { script, words } = lindePaths();
  drawPaths(g, script, px(photoX(1132)), py(photoY(244)), pmm(149) * SIDE_PPM);
  drawPaths(g, words, px(photoX(900)), py(photoY(394)), pmm(144) * SIDE_PPM);
}

// ---- the rear -----------------------------------------------------------------------------------------------

function paintRear(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!;
  // the photo (van-rear.jpg) puts the body at x 160 to 725 and y 12 to 468, laid over the whole canvas
  const X = (p: number) => ((p - 160) / 565) * REAR_W;
  const Y = (p: number) => ((p - 12) / 456) * REAR_H;
  const S = REAR_W / 565;
  g.fillStyle = LMH.red;
  g.fillRect(0, 0, REAR_W, REAR_H);
  // the two door windows under the red film, darker, in black seals, and the centre seam between the doors
  const pane = (x0: number, x1: number) => {
    g.beginPath();
    g.roundRect(X(x0), Y(42), X(x1) - X(x0), Y(240) - Y(42), 26);
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fill();
    g.lineWidth = 7;
    g.strokeStyle = G.black;
    g.stroke();
  };
  pane(207, 482);
  pane(487, 668);
  g.strokeStyle = 'rgba(0,0,0,0.38)';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(X(485), Y(12));
  g.lineTo(X(485), Y(468));
  g.moveTo(X(172), Y(255));
  g.lineTo(X(712), Y(255));
  g.stroke();
  // the high brake lamp over the windows, the black handle bar, a plain round badge in place of the maker's
  g.fillStyle = G.black;
  g.fillRect(X(378), Y(20), X(442) - X(378), Y(34) - Y(20));
  g.fillStyle = LMH.red;
  for (let i = 0; i < 6; i++) g.fillRect(X(383 + i * 10), Y(24), 6 * S, Y(30) - Y(24));
  g.fillStyle = G.black;
  g.beginPath();
  g.roundRect(X(215), Y(293), X(463) - X(215), Y(317) - Y(293), 12);
  g.fill();
  g.fillStyle = G.pale;
  g.beginPath();
  g.arc(X(430), Y(305), 4 * S, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = G.graphite;
  g.beginPath();
  g.arc(X(536), Y(342), 25 * S, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = G.mid;
  g.stroke();
  // the white Linde script and Linde Material Handling on the left window, the white wordmark and the web address
  // on the right door, the wordmark as the white file supplies it
  const { script, words } = lindePaths();
  drawPaths(g, script, X(350), Y(199), 164 * S);
  drawPaths(g, words, X(357.5), Y(119), 179 * S);
  drawPaths(g, brandPaths(BRAND.wordmarkWhite), X(585.5), Y(283), 161 * S);
  g.fillStyle = G.white;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `400 ${26 * S}px ${FONT}`;
  g.fillText('www.ekotehnika.rs', X(585), Y(450));
  g.textAlign = 'left';
}

// ---- the textures -------------------------------------------------------------------------------------------

export type VanSkins = { plus: THREE.CanvasTexture; minus: THREE.CanvasTexture; rear: THREE.CanvasTexture; ready: Promise<void> };
let skins: VanSkins | undefined;

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const texture = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

/** The three wrap textures, drawn once and shared by every van. plus is the +z side, which shows the front on the right
 *  of the viewer, minus is the -z side with the front on the left as in the photo. They are drawn at once with the
 *  fallback face and drawn again as soon as Daxline Pro has loaded, ready resolves then. */
export function vanSkins(): VanSkins {
  if (skins) return skins;
  const cs = [canvas(SIDE_PX, SIDE_H), canvas(SIDE_PX, SIDE_H), canvas(REAR_W, REAR_H)];
  const paint = () => {
    paintSide(cs[0], false);
    paintSide(cs[1], true);
    paintRear(cs[2]);
  };
  paint();
  const [plus, minus, rear] = cs.map(texture);
  const ready = (document.fonts ? document.fonts.load('400 64px "Daxline Pro"').then(() => document.fonts.ready) : Promise.resolve())
    .then(() => {
      paint();
      [plus, minus, rear].forEach((t) => (t.needsUpdate = true));
    })
    .catch(() => {});
  skins = { plus, minus, rear, ready: ready as Promise<unknown> as Promise<void> };
  return skins;
}

export const REAR_ASPECT = REAR_W / REAR_H;
