// Renders the four footer trucks, MT15, H30, R16 and N20, once, as sharp still images with a transparent background.
// The stills are what the footer shows (src/story2/shell/sections.tsx), so there is no live WebGL scene on that page.
//
//   node scripts/render-footer-trucks.mjs [outDir]       default outDir is public/footer
//
// Needs playwright-core and a Chromium. Set CHROMIUM to the browser binary (default /opt/pw-browsers/chromium) and, when
// playwright-core is not installed in this project, PLAYWRIGHT_CORE to its folder. Nothing else is installed or changed.
//
// The look is the story's own, read from src/story2/scenes/sistem. Same lens (fov 28), same studio environment at 0.6, same
// key, rim and hemisphere lights as the hero beat, same ACES tone mapping, the same tuning of the Linde materials and the same
// soft blob under each truck. The camera is one shared three quarter view, seen from the front right and slightly above, with
// the forks toward the right as in the hero. All four trucks share one camera distance, so the scale between them is the real
// one, and one canvas, so their ground lines sit on the same pixel row. The widest truck takes 88 percent of the canvas width.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(process.argv[2] ?? join(ROOT, 'public/footer'));
const CHROMIUM = process.env.CHROMIUM ?? '/opt/pw-browsers/chromium';

// Output size in pixels. The footer shows the image at up to about 600 css px wide, so 1200 is 2x there.
const W = 1200;
const VIEW = { fov: 28, yaw: 32, pitch: -11 };

// The footer order, with the file stem, the model file and how the model is placed so its forks point +x, from models.tsx SPEC.
const TRUCKS = [
  { id: 'mt15c', glb: 'mt15c', yaw: 0, ground: 0, foot: [2.6, 1.3, 0.1] },
  { id: 'h30d', glb: 'h30d', yaw: Math.PI, ground: 0.34, foot: [5.2, 2.7, -0.3] },
  { id: 'r16', glb: 'r16', yaw: Math.PI, ground: 0, foot: [4.0, 2.4, 0] },
  { id: 'n20', glb: 'n20', yaw: Math.PI, ground: 0, foot: [5.0, 2.0, 0] },
];

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.html': 'text/html' };

const PAGE = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const { W, VIEW, TRUCKS } = window.CFG;
const rad = (d) => (d * Math.PI) / 180;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // the react three fiber default the story runs on
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const hdr = await new RGBELoader().loadAsync('/hdri/studio_small_03_1k.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromEquirectangular(hdr).texture;
scene.environmentIntensity = 0.6;

// The blob under a truck, from kit.ts blobMaterial
const blobTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(34,34,34,1)');
  grd.addColorStop(0.45, 'rgba(34,34,34,0.55)');
  grd.addColorStop(1, 'rgba(34,34,34,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();

// The Linde materials as the story tunes them, models.tsx tune
function tune(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (!m.isMeshStandardMaterial) return;
      m.envMapIntensity = 1.5;
      m.roughness = Math.min(Math.max(m.roughness, 0.4), 0.7);
      m.metalness = Math.min(m.metalness, 0.3);
    });
  });
}

// The light rig of the hero beat, camera.tsx Lights, turned with the camera yaw so the light falls the same way on screen.
const rotY = (v, a) => new THREE.Vector3(v.x * Math.cos(a) + v.z * Math.sin(a), v.y, -v.x * Math.sin(a) + v.z * Math.cos(a));
const yawR = rad(VIEW.yaw);
const key = new THREE.DirectionalLight('#fff5e4', 1.7);
key.position.copy(rotY(new THREE.Vector3(-5, 9 + 10 * 0.4, 7 + 10 * 0.3), yawR));
key.castShadow = true;
key.shadow.mapSize.set(4096, 4096);
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.03;
key.shadow.radius = 4;
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 60 });
const rim = new THREE.DirectionalLight('#ffffff', 0.5);
rim.position.copy(rotY(new THREE.Vector3(6, 4, -9), yawR));
const hemi = new THREE.HemisphereLight('#ffffff', '#e9e9e9', 1.1);
scene.add(key, key.target, rim, rim.target, hemi);

// The ground only receives the key light's shadow, the rest of it stays transparent.
const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.3 }));
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.receiveShadow = true;
scene.add(shadowCatcher);

const loader = new GLTFLoader();
const stage = new THREE.Group();
scene.add(stage);

async function load(t) {
  const gltf = await loader.loadAsync('/models/linde/' + t.glb + '.glb');
  tune(gltf.scene);
  const inner = new THREE.Group();
  inner.position.y = t.ground;
  inner.rotation.y = t.yaw;
  inner.add(gltf.scene);
  const g = new THREE.Group();
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(t.foot[0], t.foot[1]),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: 0.34, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.set(t.foot[2], 0.03, 0);
  blob.renderOrder = 1;
  g.add(blob, inner);
  g.updateMatrixWorld(true);
  // the box of the truck itself, the blob not counted
  const box = new THREE.Box3().setFromObject(inner);
  return { t, g, box, verts: collect(inner) };
}

// every vertex in world space, to project for the bounds
function collect(root) {
  const pts = [];
  const v = new THREE.Vector3();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const p = o.geometry.getAttribute('position');
    const step = Math.max(1, Math.floor(p.count / 6000));
    for (let i = 0; i < p.count; i += step) pts.push(v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).clone());
  });
  return pts;
}

const cam = new THREE.PerspectiveCamera(VIEW.fov, 1, 0.1, 200);

// Place the camera on the ground centre of a truck at distance d. Returns the pixel bounds of the truck on a W by H canvas.
function aim(item, d, H) {
  const c = new THREE.Vector3();
  item.box.getCenter(c);
  c.y = Math.min(item.box.max.y * 0.35, 1.2);
  const y = rad(VIEW.yaw);
  const p = rad(VIEW.pitch);
  cam.aspect = W / H;
  cam.position.set(c.x + d * Math.sin(y) * Math.cos(p), c.y - d * Math.sin(p), c.z + d * Math.cos(y) * Math.cos(p));
  cam.lookAt(c);
  cam.clearViewOffset();
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  const v = new THREE.Vector3();
  for (const q of item.verts) {
    v.copy(q).project(cam);
    const px = (v.x * 0.5 + 0.5) * W;
    const py = (0.5 - v.y * 0.5) * H;
    if (px < x0) x0 = px;
    if (px > x1) x1 = px;
    if (py < y0) y0 = py;
    if (py > y1) y1 = py;
  }
  return { x0, x1, y0, y1, c };
}

window.run = async () => {
  const items = [];
  for (const t of TRUCKS) items.push(await load(t));
  // Find the camera distance, shared by all, at which the widest truck takes 88 percent of the canvas width, so the soft shadow fades out before the edge.
  const H0 = 800;
  let d = 14;
  for (let i = 0; i < 4; i++) {
    const widest = Math.max(...items.map((it) => { const b = aim(it, d, H0); return b.x1 - b.x0; }));
    d *= widest / (W * 0.88);
  }
  // The canvas height takes the tallest truck, with a margin above for the highest edge and under for the shadow.
  const MARGIN_TOP = 14;
  const SHADOW = 22;
  const spans = items.map((it) => { const b = aim(it, d, H0); return b.y1 - b.y0; });
  const H = Math.ceil((Math.max(...spans) + MARGIN_TOP + SHADOW) / 2) * 2; // even, so the 1x size is whole
  // pixels per metre grow with the canvas height at a fixed lens, so move the camera back to keep the scale found above
  d *= H / H0;
  renderer.setSize(W, H, false);
  const out = [];
  for (const it of items) {
    stage.clear();
    stage.add(it.g);
    key.target.position.copy(it.box.getCenter(new THREE.Vector3())).setY(0);
    key.position.copy(rotY(new THREE.Vector3(-5, 13, 10), yawR)).add(key.target.position);
    rim.target.position.copy(key.target.position);
    rim.position.copy(rotY(new THREE.Vector3(6, 4, -9), yawR)).add(key.target.position);
    shadowCatcher.position.set(key.target.position.x, 0, key.target.position.z);
    const b = aim(it, d, H);
    // shift the picture so the truck is centred across and its lowest point is SHADOW px above the bottom edge
    const dx = (W - (b.x1 - b.x0)) / 2 - b.x0;
    const dy = H - SHADOW - b.y1;
    cam.setViewOffset(W, H, -dx, -dy, W, H);
    renderer.render(scene, cam);
    const src = renderer.domElement;
    const c2 = document.createElement('canvas');
    c2.width = W;
    c2.height = H;
    c2.getContext('2d').drawImage(src, 0, 0);
    const blob = await new Promise((r) => c2.toBlob(r, 'image/webp', 0.94));
    const buf = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    out.push({ id: it.t.id, b64: btoa(s), metres: it.box.getSize(new THREE.Vector3()).toArray().map((n) => +n.toFixed(2)), minY: +it.box.min.y.toFixed(3) });
  }
  return { W, H, d, shadow: SHADOW, out };
};
window.ready = true;
</script>`;

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  try {
    if (url === '/') {
      res.writeHead(200, { 'content-type': 'text/html' }).end(PAGE);
      return;
    }
    const file = url.startsWith('/three/') ? join(ROOT, 'node_modules/three', url.slice(7)) : join(ROOT, 'public', url);
    if (!file.startsWith(join(ROOT, 'node_modules/three')) && !file.startsWith(join(ROOT, 'public'))) throw new Error('outside');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const require = createRequire(import.meta.url);
const pw = process.env.PLAYWRIGHT_CORE ? await import(pathToFileURL(require.resolve(process.env.PLAYWRIGHT_CORE)).href) : await import('playwright-core');
const { chromium } = pw.chromium ? pw : pw.default;

const browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => console.error('page error', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('console', m.text()));
  await page.addInitScript((cfg) => { window.CFG = cfg; }, { W, VIEW, TRUCKS });
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForFunction(() => window.ready, null, { timeout: 60000 });
  const r = await page.evaluate(() => window.run());
  await mkdir(OUT, { recursive: true });
  for (const o of r.out) {
    await writeFile(join(OUT, `${o.id}.webp`), Buffer.from(o.b64, 'base64'));
    console.log(o.id, 'size in metres', o.metres.join(' x '), 'lowest point', o.minY);
  }
  console.log(`canvas ${r.W} x ${r.H}, camera distance ${r.d.toFixed(2)} m, written to ${OUT}`);
} finally {
  await browser.close();
  server.close();
}
