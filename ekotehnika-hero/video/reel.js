// Ekotehnika showcase reel, studio/clients/ekotehnika/briefs/reel/plan.md. One timeline, two frames, ?f=169 (1920 by 1080)
// or ?f=916 (1080 by 1920). Silent, cut on T-Pain "Church" at 80 BPM, 28 beats, 21.0 s, frame 0 a downbeat.
//
// Ported from filip-portfolio video/reel2.js. Each shot lays a real frame of the shipped site (scripts/reel-capture.mjs)
// flat on a plane, and WebGL projects the plane through a tilted camera. The site's own grid, hairlines with plus marks at
// the crossings, is drawn in the shader so the plane never ends. A raised layer lifts one part of the frame off the page
// on the beat. One post pass adds the whip blur, the punch in, the tilt shift band and a light grain. No glow, flash,
// chromatic split, glitch or fade, per the Ekotehnika taste log. The reel draws no type of its own, every word on screen
// is the site's.
//
//   await window.reelReady
//   await window.seek(t)     // seconds, 0 to DURATION
//
// scripts/render-reel.mjs steps it frame by frame.

const QS = new URLSearchParams(location.search)
const FMT = QS.get('f') === '916' ? '916' : '169'
const W = FMT === '916' ? 1080 : 1920
const H = FMT === '916' ? 1920 : 1080

const BPM = 80
const B = 60 / BPM
const at = (beat) => beat * B
export const DURATION = at(28)

// The plane canvas holds one site frame (1920 by 1080) with room for the guides around it.
const P = 3072
const FX0 = 576 // frame origin on the plane
const FY0 = 996
const F = 2048 // raised layer canvas
const PERSP = 1800
const PITCH = 462 // the site's column pitch at 1920, its lines at x 48 + 462n
const GX = FX0 + 48
const GY = FY0 + 136 // the top rule under the top row

const LIGHT = { ground: [255, 255, 255], ink: [34, 34, 34] }
const DARK = { ground: [11, 11, 11], ink: [255, 255, 255] }

// ── Time helpers ───────────────────────────────────────────────────────
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const prog = (t, a, b) => clamp((t - a) / (b - a))
const snap = (x) => 1 - Math.pow(1 - x, 4)
const lerp = (a, b, k) => a + (b - a) * k
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

// ── Shots ──────────────────────────────────────────────────────────────
// from, to       beats on the reel grid
// frames         [beat from the shot start, frame name], the last one started is shown, so motion inside a panel steps on
//                the grid of the music
// dark           the S ground
// raise          a part of the frame [x0, y0, x1, y1] in frame px that lifts off the page at beat b, h px high
// views          per format, camera keys [beat from the shot start, rect in frame px, rx, rz, options for fit]
// hits           [beat from the shot start, { whip: [dx, dy], punch }]
const seq = (name, ks, step) => ks.map((k, i) => [i * step, `${name}-${k}`])
const STEP16 = 0.25 // a sixteenth note, in beats

const SHOTS = [
  {
    id: 'hook', from: 0, to: 3,
    frames: [[0, 'H-0.4']],
    raise: { rect: [48, 640, 960, 910], b: 1, h: 120 },
    views: {
      169: [[0, [0, 0, 1920, 1080], 34, -10, { fw: 0.74 }], [1, [0, 130, 1920, 1000], 30, -8, { fw: 0.9 }]],
      916: [[0, [1060, 200, 1900, 640], 34, -14, { fw: 0.96, sy: 0.5 }]],
    },
    hits: [[0, { punch: 0.05 }], [1, { punch: 0.04 }]],
  },
  {
    id: 'drive', from: 3, to: 5,
    frames: seq('D1', [0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9], STEP16),
    views: {
      169: [[0, [0, 0, 1920, 1080], 36, -14, { fw: 0.8 }]],
      916: [[0, [700, 120, 1920, 700], 34, -16, { fw: 1.0, sy: 0.5 }]],
    },
    hits: [[0, { whip: [1, 0] }], [1, { punch: 0.04 }]],
  },
  {
    id: 'company', from: 5, to: 8,
    frames: [[0, 'C1-0.3'], [1, 'C1-0.5'], [2, 'C1-0.7']],
    views: {
      169: [[0, [0, 0, 1920, 1080], 32, -10, { fw: 0.78 }], [2, [0, 0, 1920, 1080], 30, -8, { fw: 0.86 }]],
      916: [[0, [0, 120, 1200, 1000], 36, -18, { fw: 1.05, sy: 0.5 }]],
    },
    hits: [[0, { whip: [0, 1] }], [1, { punch: 0.03 }], [2, { punch: 0.03 }]],
  },
  {
    id: 'yard', from: 8, to: 9,
    frames: [[0, 'F-0.25'], [STEP16, 'F-0.5'], [2 * STEP16, 'F-0.75'], [3 * STEP16, 'R-0.8']],
    views: {
      169: [[0, [0, 0, 1920, 1080], 40, -16, { fw: 0.8 }]],
      916: [[0, [400, 100, 1920, 1000], 40, -20, { fw: 1.1, sy: 0.5 }]],
    },
    hits: [[0, { whip: [-1, 0] }]],
  },
  {
    id: 'sales', from: 9, to: 12,
    frames: [[0, 'P-0.27'], [0.5, 'P-0.39'], [1, 'P-0.61'], [1.5, 'P-0.83']],
    raise: { rect: [48, 160, 960, 520], b: 2, h: 110 },
    views: {
      169: [[0, [0, 0, 1920, 1080], 34, -12, { fw: 0.78 }], [2, [0, 120, 1920, 1000], 30, -10, { fw: 0.9 }]],
      916: [[0, [960, 120, 1880, 880], 34, -14, { fw: 1.0, sy: 0.5 }]],
    },
    hits: [[0, { whip: [1, 0] }], [0.5, { punch: 0.02 }], [1, { punch: 0.02 }], [1.5, { punch: 0.02 }], [2, { punch: 0.04 }]],
  },
  {
    id: 'service', from: 12, to: 15, dark: true,
    frames: [[0, 'S-0.5'], [2, 'S-0.75']],
    raise: { rect: [48, 900, 960, 1010], b: 2, h: 100 },
    views: {
      169: [[0, [960, 120, 1920, 1000], 32, -10, { fw: 0.62, sx: 0.58 }], [1, [0, 0, 1920, 1080], 34, -12, { fw: 0.8 }]],
      916: [[0, [820, 240, 1560, 960], 32, -12, { fw: 0.95, sy: 0.5 }]],
    },
    hits: [[0, { punch: 0.07 }], [1, { punch: 0.03 }], [2, { punch: 0.04 }]],
  },
  {
    id: 'lift', from: 15, to: 16,
    frames: seq('L', [0.15, 0.4, 0.65, 0.9], STEP16),
    views: {
      169: [[0, [0, 0, 1920, 1080], 36, -12, { fw: 0.8 }]],
      916: [[0, [400, 0, 1700, 1080], 36, -18, { fw: 1.1, sy: 0.5 }]],
    },
    hits: [[0, { whip: [0, -1] }]],
  },
  {
    id: 'rent', from: 16, to: 18,
    frames: [[0, 'N-0.3'], [0.5, 'N-0.5'], [1, 'N-0.7'], [1.5, 'N-0.9']],
    views: {
      169: [[0, [0, 0, 1920, 1080], 34, -10, { fw: 0.8 }]],
      916: [[0, [200, 120, 1800, 1000], 36, -18, { fw: 1.1, sy: 0.5 }]],
    },
    hits: [[0, { whip: [0, -1] }], [1, { punch: 0.03 }]],
  },
  {
    id: 'automation', from: 18, to: 20,
    frames: seq('AT', [0.3, 0.42, 0.54, 0.66, 0.78, 0.9], STEP16),
    views: {
      169: [[0, [0, 0, 1920, 1080], 38, -14, { fw: 0.8 }]],
      916: [[0, [700, 120, 1920, 1000], 38, -18, { fw: 1.1, sy: 0.5 }]],
    },
    hits: [[0, { whip: [1, 0] }]],
  },
  {
    id: 'products', from: 20, to: 22,
    frames: [[0, 'sec_.sx-products-0']],
    views: {
      169: [[0, [0, 0, 1920, 1080], 32, -10, { fw: 0.78 }], [1, [0, 0, 1920, 1080], 30, -8, { fw: 0.88 }]],
      916: [[0, [700, 0, 1920, 1080], 34, -16, { fw: 1.1, sy: 0.5 }], [1, [0, 0, 1200, 1080], 34, -16, { fw: 1.1, sy: 0.5 }]],
    },
    hits: [[0, { whip: [0, 1] }], [1, { punch: 0.03 }]],
  },
  {
    id: 'close', from: 22, to: 24,
    frames: [[0, 'sec_.sx-closing--300'], [1, 'sec_.sx-closing-0']],
    views: {
      169: [[0, [0, 0, 1920, 1080], 32, -10, { fw: 0.8 }]],
      916: [[0, [480, 120, 1440, 1000], 34, -14, { fw: 1.1, sy: 0.5 }]],
    },
    hits: [[0, { whip: [-1, 0] }], [1, { punch: 0.04 }]],
  },
  {
    // the end card, the two logos from the top row lifted off the page, as supplied, on the white ground
    id: 'end', from: 24, to: 28,
    frames: [[0, 'H-0.4']],
    raise: { rect: [48, 0, 470, 136], b: 0.5, h: 160 },
    hidePanel: true,
    views: {
      169: [[0, [48, 0, 470, 136], 30, -8, { fw: 0.5 }]],
      916: [[0, [48, 0, 470, 136], 30, -10, { fw: 0.82 }]],
    },
    hits: [[0, { punch: 0.05 }]],
  },
]
const shotAt = (t) => SHOTS.find((s) => t < at(s.to)) || SHOTS[SHOTS.length - 1]
const HITS = SHOTS.flatMap((s) => (s.hits || []).map(([b, h]) => ({ ...h, b: s.from + b })))

// ── Camera maths ───────────────────────────────────────────────────────
// screen = centre + R·(s·(p − c)) · d / (d − z), with R = rotX · rotZ, as reel2.
function project(c, x, y) {
  const rz = (c.rz * Math.PI) / 180
  const rx = (c.rx * Math.PI) / 180
  const px = (x - c.cx) * c.s
  const py = (y - c.cy) * c.s
  const qx = px * Math.cos(rz) - py * Math.sin(rz)
  const qy = px * Math.sin(rz) + py * Math.cos(rz)
  const ry = qy * Math.cos(rx)
  const rzz = qy * Math.sin(rx)
  const k = PERSP / (PERSP - rzz)
  return [W / 2 + qx * k, H / 2 + ry * k]
}
// The camera that fits a frame rect into fw by fh of the screen, centred on sx, sy.
function fit(r, rx, rz, o = {}) {
  const { fw = 0.8, fh = 0.86, sx = 0.5, sy = 0.5, maxS = 2.4 } = o
  const x0 = r[0] + FX0
  const y0 = r[1] + FY0
  const x1 = r[2] + FX0
  const y1 = r[3] + FY0
  const c = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s: 0.5, rx, rz }
  const a = (rz * Math.PI) / 180
  for (let i = 0; i < 14; i++) {
    const pts = [project(c, x0, y0), project(c, x1, y0), project(c, x0, y1), project(c, x1, y1)]
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const bw = Math.max(...xs) - Math.min(...xs)
    const bh = Math.max(...ys) - Math.min(...ys)
    const k = Math.min((fw * W) / bw, (fh * H) / bh)
    c.s = Math.min(maxS, c.s * Math.pow(k, 0.9))
    const dx = (Math.max(...xs) + Math.min(...xs)) / 2 - sx * W
    const dy = ((Math.max(...ys) + Math.min(...ys)) / 2 - sy * H) / Math.cos((rx * Math.PI) / 180)
    c.cx += ((dx * Math.cos(a) + dy * Math.sin(a)) / c.s) * 0.9
    c.cy += ((-dx * Math.sin(a) + dy * Math.cos(a)) / c.s) * 0.9
  }
  return c
}
// In 16 by 9 the raised part lifts straight up from where it sits. In 9 by 16 the whole page does not fit, so the camera
// holds the subject large and the raised part flies to just under it, at least its own size, and the camera opens to
// hold both on the same beat.
for (const s of SHOTS) {
  const views = s.views[FMT].slice()
  if (s.raise && FMT === '916' && !s.hidePanel) {
    const [b0, subj, rx, rz, o] = views[0]
    const [x0, y0, x1, y1] = s.raise.rect
    const sc = clamp((subj[2] - subj[0]) / (x1 - x0), 1, 1.8)
    const w = (x1 - x0) * sc
    const h = (y1 - y0) * sc
    const dx = (subj[0] + subj[2]) / 2 - w / 2
    const dy = subj[3] + 70
    s.raise.dest = { x: dx, y: dy, sc }
    const u = [Math.min(subj[0], dx), subj[1], Math.max(subj[2], dx + w), dy + h]
    views.push([s.raise.b, u, rx, rz, { ...o, fw: 0.94, fh: 0.8, sy: 0.56 }])
    views.sort((a, b) => a[0] - b[0])
    void b0
  }
  s.keys = views.map(([b, r, rx, rz, o]) => ({ t: at(s.from + b), ...fit(r, rx, rz, o) }))
}
// Each key starts a move at its beat that takes 0.2 s with snap easing, then the camera drifts in 2 percent over the shot.
function camAt(s, t) {
  const c = { ...s.keys[0] }
  for (let i = 1; i < s.keys.length; i++) {
    const k = s.keys[i]
    if (t < k.t) break
    const p = snap(prog(t, k.t, k.t + 0.2))
    for (const key of ['cx', 'cy', 's', 'rx', 'rz']) c[key] = lerp(c[key], k[key], p)
  }
  c.s *= 1 + 0.02 * prog(t, at(s.from), at(s.to))
  return c
}

// ── Cuts and hits ──────────────────────────────────────────────────────
// A whip pushes the frame out along its direction before the cut and pulls the next one in after it. A punch in settles
// in 0.15 s.
const WHIP_OUT = 0.1
const WHIP_IN = 0.17
const WHIP_PX = FMT === '916' ? 900 : 1100
function whipOff(t) {
  let x = 0
  let y = 0
  for (const h of HITS) {
    if (!h.whip) continue
    const T = at(h.b)
    let m = 0
    if (t >= T - WHIP_OUT && t < T) m = Math.pow(prog(t, T - WHIP_OUT, T), 3)
    else if (t >= T && t < T + WHIP_IN) m = -(1 - snap(prog(t, T, T + WHIP_IN)))
    x += h.whip[0] * m * WHIP_PX
    y += h.whip[1] * m * WHIP_PX
  }
  return [x, y]
}
function punchAt(t) {
  let p = 0
  for (const h of HITS) {
    const dt = t - at(h.b)
    if (h.punch && dt >= 0 && dt < 0.5) p += h.punch * Math.exp(-dt / 0.05)
  }
  return p
}
function fullCam(t) {
  const s = shotAt(t)
  const c = camAt(s, t)
  c.s *= 1 + punchAt(t)
  const [ox, oy] = whipOff(t)
  c.ox = ox
  c.oy = oy
  return { c, s }
}

// ── Assets ─────────────────────────────────────────────────────────────
const imgs = {}
const loadImg = (name) =>
  new Promise((res, rej) => {
    const i = new Image()
    i.onload = () => res((imgs[name] = i))
    i.onerror = () => rej(new Error(`missing frame ${name}, run scripts/reel-capture.mjs`))
    i.src = `/video/frames/${name}.png`
  })
const frameName = (s, t) => {
  let name = s.frames[0][1]
  for (const [b, n] of s.frames) if (t >= at(s.from + b) - 1e-6) name = n
  return name
}
const frameAt = (s, t) => imgs[frameName(s, t)]

// ── The plane ──────────────────────────────────────────────────────────
const plane = document.createElement('canvas')
plane.width = plane.height = P
const pg = plane.getContext('2d')
const raised = document.createElement('canvas')
raised.width = raised.height = F
const rg = raised.getContext('2d')
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

// The construction move on every cut. The panel's edges shoot out along the plane as guides, and a plus mark lands on each
// corner. Then the guides stay, faint, as part of the grid.
function construct(s, t, tone) {
  const t0 = at(s.from)
  const p = snap(prog(t, t0, t0 + 0.22))
  const x0 = FX0
  const y0 = FY0
  const x1 = FX0 + 1920
  const y1 = FY0 + 1080
  const a = lerp(0.55, 0.3, prog(t, t0 + 0.2, t0 + 0.5))
  pg.save()
  pg.strokeStyle = rgba(tone.ink, a)
  pg.lineWidth = 2
  pg.beginPath()
  const reach = 1400 * p
  pg.moveTo(x0, y0); pg.lineTo(x0 - reach, y0)
  pg.moveTo(x0, y0); pg.lineTo(x0, y0 - reach)
  pg.moveTo(x1, y0); pg.lineTo(x1 + reach, y0)
  pg.moveTo(x1, y0); pg.lineTo(x1, y0 - reach)
  pg.moveTo(x0, y1); pg.lineTo(x0 - reach, y1)
  pg.moveTo(x0, y1); pg.lineTo(x0, y1 + reach)
  pg.moveTo(x1, y1); pg.lineTo(x1 + reach, y1)
  pg.moveTo(x1, y1); pg.lineTo(x1, y1 + reach)
  pg.stroke()
  // the plus marks land a sixteenth after the cut, 1.6 times their size, and settle
  const q = snap(prog(t, t0 + 0.06, t0 + 0.24))
  if (q > 0) {
    const r = 18 * lerp(1.6, 1, q)
    pg.strokeStyle = rgba(tone.ink, 0.9 * q)
    pg.lineWidth = 3
    pg.beginPath()
    for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
      pg.moveTo(x - r, y); pg.lineTo(x + r, y)
      pg.moveTo(x, y - r); pg.lineTo(x, y + r)
    }
    pg.stroke()
  }
  pg.restore()
}

let planeKey = ''
let raisedKey = ''
// Draws the plane and the raised layer for time t, returns the raised placement or null. Uploads only what changed.
function drawShot(s, t, tone) {
  const img = frameAt(s, t)
  const t0 = at(s.from)
  const lift = s.raise ? snap(prog(t, t0 + at(s.raise.b), t0 + at(s.raise.b) + 0.22)) : 0
  const cons = Math.round(prog(t, t0, t0 + 0.5) * 60)
  const pk = `${s.id}|${frameName(s, t)}|${cons}|${lift > 0}`
  let planeDirty = false
  if (pk !== planeKey) {
    planeKey = pk
    planeDirty = true
    pg.setTransform(1, 0, 0, 1, 0, 0)
    pg.clearRect(0, 0, P, P)
    if (!s.hidePanel) {
      pg.drawImage(img, FX0, FY0)
      // a hairline edge so the frame reads as a sheet on the plane
      pg.strokeStyle = rgba(tone.ink, 0.35)
      pg.lineWidth = 2
      pg.strokeRect(FX0, FY0, 1920, 1080)
      // the part that lifts leaves the frame's own ground behind
      if (s.raise && lift > 0) {
        const [x0, y0, x1, y1] = s.raise.rect
        const d = pg.getImageData(FX0 + x0 + 2, FY0 + y1 - 2, 1, 1).data
        pg.fillStyle = `rgb(${d[0]},${d[1]},${d[2]})`
        pg.fillRect(FX0 + x0, FY0 + y0, x1 - x0, y1 - y0)
      }
    }
    construct(s, t, tone)
  }
  let r = null
  if (s.raise && (lift > 0 || s.hidePanel)) {
    const [x0, y0, x1, y1] = s.raise.rect
    const w = x1 - x0
    const h = y1 - y0
    const size = Math.max(w, h)
    const rk = `${s.id}|${frameName(s, t)}`
    if (rk !== raisedKey) {
      raisedKey = rk
      rg.setTransform(1, 0, 0, 1, 0, 0)
      rg.clearRect(0, 0, F, F)
      const sc = F / size
      rg.drawImage(img, x0, y0, w, h, 0, 0, w * sc, h * sc)
      r = { dirty: true }
    } else r = { dirty: false }
    const d = s.raise.dest
    const k = d ? lift : 0
    Object.assign(r, {
      x: FX0 + lerp(x0, d ? d.x : x0, k),
      y: FY0 + lerp(y0, d ? d.y : y0, k),
      size: size * lerp(1, d ? d.sc : 1, k),
      h: s.raise.h * (s.hidePanel ? lerp(0.4, 1, lift) : d ? Math.sin(Math.PI * lift) + 0.25 * lift : lift),
    })
  }
  return { planeDirty, r }
}

// ── WebGL ──────────────────────────────────────────────────────────────
const canvas = document.getElementById('out')
canvas.width = W
canvas.height = H
const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false })
const aniso = gl.getExtension('EXT_texture_filter_anisotropic')
const VS = `#version 300 es
in vec2 a;
uniform vec4 uCam;
uniform vec2 uRot;
uniform vec2 uOff;
uniform float uElev;
uniform vec4 uRect;
out vec2 vP;
out vec2 vUV;
void main() {
  vec2 p = (a - uCam.xy) * uCam.z;
  float h = uElev * uCam.z;
  float cz = cos(uRot.y), sz = sin(uRot.y);
  vec2 q = vec2(p.x * cz - p.y * sz, p.x * sz + p.y * cz);
  float cx = cos(uRot.x), sx = sin(uRot.x);
  float y = q.y * cx - h * sx;
  float z = q.y * sx + h * cx;
  float w = (${PERSP.toFixed(1)} - z) / ${PERSP.toFixed(1)};
  vec2 scr = vec2(q.x, y) + uOff * w;
  gl_Position = vec4(scr.x / ${(W / 2).toFixed(1)}, -scr.y / ${(H / 2).toFixed(1)}, w - 0.1, w);
  vP = a;
  vUV = (a - uRect.xy) / uRect.zw;
}`
// The site's grid on the plane, hairlines every column pitch, plus marks at the crossings, the ground and ink of the shot.
const FS_SCENE = `#version 300 es
precision highp float;
in vec2 vP;
in vec2 vUV;
uniform sampler2D uTex;
uniform float uGrid;
uniform vec3 uGround;
uniform vec3 uInk;
out vec4 o;
void main() {
  vec4 c = texture(uTex, vUV);
  float inside = step(0.0, vUV.x) * step(vUV.x, 1.0) * step(0.0, vUV.y) * step(vUV.y, 1.0);
  c *= inside;
  if (uGrid < 0.5) { o = c; return; }
  vec2 f = vP - vec2(${GX.toFixed(1)}, ${GY.toFixed(1)});
  vec2 m = f - ${PITCH.toFixed(1)} * floor(f / ${PITCH.toFixed(1)} + 0.5);
  float fw = max(fwidth(vP.x), fwidth(vP.y));
  float hair = max(clamp((0.9 - abs(m.x)) / max(fw, 0.001) + 0.5, 0.0, 1.0), clamp((0.9 - abs(m.y)) / max(fw, 0.001) + 0.5, 0.0, 1.0));
  float arm = 14.0;
  float plus = max(
    clamp((1.2 - abs(m.x)) / max(fw, 0.001) + 0.5, 0.0, 1.0) * step(abs(m.y), arm),
    clamp((1.2 - abs(m.y)) / max(fw, 0.001) + 0.5, 0.0, 1.0) * step(abs(m.x), arm));
  // lines thin out as they recede, so the far plane does not turn grey
  float fade = 1.0 - smoothstep(1.5, 6.0, fw);
  vec3 bg = mix(uGround, uInk, (0.12 * hair + 0.55 * plus) * fade);
  o = vec4(c.rgb + bg * (1.0 - c.a), 1.0);
}`
const VS_POST = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }`
const FS_POST = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uTilt, uBandC, uBandW, uGrain, uFrame;
uniform vec2 uBlur;
out vec4 o;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 px = 1.0 / uRes;
  vec2 uv = gl_FragCoord.xy * px;
  float yTop = 1.0 - uv.y;
  float lod = uTilt * 2.6 * smoothstep(uBandW, uBandW + 0.34, abs(yTop - uBandC));
  vec2 bv = vec2(uBlur.x, -uBlur.y) * px;
  int n = int(clamp(length(uBlur) / 5.0, 1.0, 28.0));
  vec3 c = vec3(0.0);
  for (int i = 0; i < 28; i++) {
    if (i >= n) break;
    float f = n == 1 ? 0.0 : float(i) / float(n - 1) - 0.5;
    c += textureLod(uScene, uv + bv * f, lod).rgb;
  }
  c /= float(n);
  c += (hash(gl_FragCoord.xy + uFrame * 17.13) - 0.5) * uGrain;
  o = vec4(c, 1.0);
}`
function program(vs, fs) {
  const p = gl.createProgram()
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
    gl.attachShader(p, s)
  }
  gl.bindAttribLocation(p, 0, 'a')
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p))
  const u = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name
    u[name] = gl.getUniformLocation(p, name)
  }
  return { p, u }
}
const scene = program(VS, FS_SCENE)
const post = program(VS_POST, FS_POST)
const quadBuf = gl.createBuffer()
const quad = (x0, y0, x1, y1) => {
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1]), gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
}
function texture(w, h, mip) {
  const t = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, t)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  if (aniso && mip) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8)
  return t
}
const planeTex = texture(P, P, true)
const raisedTex = texture(F, F, true)
const sceneTex = texture(W, H, true)
const fbo = gl.createFramebuffer()
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0)
gl.bindFramebuffer(gl.FRAMEBUFFER, null)
function upload(tex, cv) {
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv)
  gl.generateMipmap(gl.TEXTURE_2D)
}

// ── A frame ────────────────────────────────────────────────────────────
function render(t) {
  t = clamp(t, 0, DURATION - 1e-4)
  const { c, s } = fullCam(t)
  const tone = s.dark ? DARK : LIGHT
  // motion blur, where the point now at the centre was half a frame ago
  const dt = 1 / 60
  let blur = [0, 0]
  if (t - dt >= 0 && shotAt(t - dt) === s) {
    const prev = fullCam(t - dt).c
    const [px0, py0] = project(prev, c.cx, c.cy)
    blur = [W / 2 + c.ox - (px0 + prev.ox), H / 2 + c.oy - (py0 + prev.oy)]
  }
  const { planeDirty, r } = drawShot(s, t, tone)
  if (planeDirty) upload(planeTex, plane)
  if (r?.dirty) upload(raisedTex, raised)

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.viewport(0, 0, W, H)
  gl.useProgram(scene.p)
  gl.uniform4f(scene.u.uCam, c.cx, c.cy, c.s, 0)
  gl.uniform2f(scene.u.uRot, (c.rx * Math.PI) / 180, (c.rz * Math.PI) / 180)
  gl.uniform2f(scene.u.uOff, c.ox, c.oy)
  gl.uniform3f(scene.u.uGround, ...tone.ground.map((v) => v / 255))
  gl.uniform3f(scene.u.uInk, ...tone.ink.map((v) => v / 255))
  gl.activeTexture(gl.TEXTURE0)
  gl.uniform1i(scene.u.uTex, 0)
  gl.disable(gl.BLEND)
  gl.bindTexture(gl.TEXTURE_2D, planeTex)
  gl.uniform1f(scene.u.uGrid, 1)
  gl.uniform1f(scene.u.uElev, 0)
  gl.uniform4f(scene.u.uRect, 0, 0, P, P)
  quad(-14000, -14000, 17000, 17000)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
  if (r) {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.bindTexture(gl.TEXTURE_2D, raisedTex)
    gl.uniform1f(scene.u.uGrid, 0)
    gl.uniform1f(scene.u.uElev, r.h)
    gl.uniform4f(scene.u.uRect, r.x, r.y, r.size, r.size)
    quad(r.x, r.y, r.x + r.size, r.y + r.size)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.disable(gl.BLEND)
  }
  gl.bindTexture(gl.TEXTURE_2D, sceneTex)
  gl.generateMipmap(gl.TEXTURE_2D)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, W, H)
  gl.useProgram(post.p)
  gl.uniform1i(post.u.uScene, 0)
  gl.uniform2f(post.u.uRes, W, H)
  gl.uniform1f(post.u.uTilt, 0.55)
  gl.uniform1f(post.u.uBandC, 0.5)
  gl.uniform1f(post.u.uBandW, FMT === '916' ? 0.26 : 0.3)
  gl.uniform1f(post.u.uGrain, 0.018)
  gl.uniform1f(post.u.uFrame, Math.floor(t * 30))
  gl.uniform2f(post.u.uBlur, blur[0], blur[1])
  quad(-1, -1, 1, 1)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

// A missing frame is listed in window.reelMissing and drawn as a blank sheet, so stills of one shot render before every
// frame is captured. The render script refuses to encode while the list is not empty.
window.reelMissing = []
window.reelReady = (async () => {
  const names = [...new Set(SHOTS.flatMap((s) => s.frames.map((f) => f[1])))]
  await Promise.all(names.map((n) => loadImg(n).catch(() => {
    window.reelMissing.push(n)
    const c = document.createElement('canvas')
    c.width = 1920
    c.height = 1080
    imgs[n] = c
  })))
  render(0)
})()
window.seek = async (t) => {
  render(t)
  gl.finish()
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
}
window.DURATION = DURATION
window.FORMAT = FMT
