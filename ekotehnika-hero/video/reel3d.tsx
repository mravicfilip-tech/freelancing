// Ekotehnika showcase reel v2, studio/clients/ekotehnika/briefs/reel/plan.md. The site's own Sistem scene, mounted here
// with a story clock the reel drives, so every frame of the real 3D world is rendered, never a screenshot of the page.
// ?f=169 (1920 by 1080) or ?f=916 (1080 by 1920), ?at=H keeps the scene's load in build skipped. Silent, cut on T-Pain
// "Church" at 80 BPM, frame 0 a downbeat.
//
//   await window.reelReady
//   await window.seek(t)     // seconds, 0 to DURATION
import '../src/styles.css';
import { createRoot } from 'react-dom/client';
import { Suspense } from 'react';
import Scene from '../src/story2/scenes/sistem';
import { TIMELINE } from '../src/story2/timeline';
import type { StoryClock } from '../src/story2/clock';

const QS = new URLSearchParams(location.search);
const FMT = QS.get('f') === '916' ? '916' : '169';
const W = FMT === '916' ? 1080 : 1920;
const H = FMT === '916' ? 1920 : 1080;
const B = 60 / 80;
const at = (beat: number) => beat * B;
export const DURATION = at(28);

// Each shot plays a stretch of the story, u from u0 to u1 (beat index plus k, H is 0, AT ends at 15), at an even speed.
// lines are the site's own words, each rising letter by letter at beat b (counted on the reel grid). panel puts a 2D
// layer over the scene from beat pb, the Prodaja models or the end card. frame916 renders the scene wider than the tall
// frame and shows the part from x, at its own resolution, where the site's camera leaves the subject at an edge.
type Cls = 'kicker' | 'title' | 'lede' | 'fact' | 'label';
type Line = { text: string; b: number; cls: Cls; count?: number; suffix?: string; cls916?: Cls; only169?: boolean; only916?: boolean };
type Shot = {
  id: string; from: number; to: number; u0: number; u1: number;
  lines?: Line[]; dark?: boolean; top916?: boolean; top?: boolean; push?: number; panel?: 'products' | 'end'; pb?: number; frame916?: { w: number; x: number };
};
export const SHOTS: Shot[] = [
  { id: 'hook', from: 0, to: 2, u0: 0.15, u1: 0.95, push: 0.06, lines: [
    { text: 'Zvanični Linde partner za Srbiju i Crnu Goru', b: 0, cls: 'kicker' },
    { text: 'Linde viljuškari.', b: 0, cls: 'title' },
    { text: 'Prodaja, najam i servis na jednom mestu.', b: 1, cls: 'lede' },
  ] },
  { id: 'drive', from: 2, to: 4, u0: 1.0, u1: 1.95, lines: [{ text: 'Snaga koja pokreće', b: 2, cls: 'title' }] },
  { id: 'company', from: 4, to: 7, u0: 2.05, u1: 2.95, lines: [
    { text: 'Od 1997.', b: 4, cls: 'title' },
    { text: '1.000+ klijenata', b: 5, cls: 'lede', count: 1000, suffix: '+ klijenata' },
  ] },
  { id: 'flip', from: 7, to: 9, u0: 3.3, u1: 5.0 },
  { id: 'yard', from: 9, to: 10, u0: 5.0, u1: 5.9, frame916: { w: 1920, x: 760 }, lines: [{ text: 'Servis je srce naše firme.', b: 9, cls: 'lede', only169: true }] },
  { id: 'sales', from: 10, to: 13, u0: 6.0, u1: 7.4, panel: 'products', pb: 11, lines: [
    { text: 'Prodaja Linde', b: 10, cls: 'title' },
    { text: 'viljuškara', b: 10.5, cls: 'title' },
  ] },
  { id: 'aisle', from: 13, to: 16, u0: 8.0, u1: 9.98 },
  { id: 'service', from: 16, to: 19, u0: 10.0, u1: 10.95, dark: true, top916: true, lines: [
    { text: 'Servis', b: 16, cls: 'title', only169: true },
    { text: 'viljuškara', b: 16.5, cls: 'title', only169: true },
    { text: 'Servis viljuškara', b: 16, cls: 'title', only916: true },
    { text: 'Hitan servis', b: 17.5, cls: 'label' },
    { text: '+381 60 300 20 50', b: 17.5, cls: 'fact', cls916: 'lede' },
  ] },
  { id: 'lift', from: 19, to: 20, u0: 11.0, u1: 11.98 },
  { id: 'rent', from: 20, to: 22, u0: 12.0, u1: 12.95, top: true, lines: [
    { text: 'Najam viljuškara', b: 20, cls: 'title' },
    { text: '24 sata', b: 21, cls: 'fact', count: 24, suffix: ' sata' },
    { text: 'Isporuka', b: 21, cls: 'label' },
  ] },
  { id: 'automation', from: 22, to: 25, u0: 13.4, u1: 14.95, lines: [
    { text: 'Automatizacija', b: 22, cls: 'title' },
    { text: 'skladišta', b: 22.5, cls: 'title' },
    { text: 'Mali roboti nose kutije, a vi radite posao.', b: 23.5, cls: 'lede' },
  ] },
  { id: 'end', from: 25, to: 28, u0: 14.95, u1: 14.99, panel: 'end', pb: 25 },
];
export const shotAt = (t: number) => SHOTS.find((s) => t < at(s.to)) ?? SHOTS[SHOTS.length - 1];
export const uAt = (t: number) => {
  const s = shotAt(t);
  const p = Math.min(1, Math.max(0, (t - at(s.from)) / (at(s.to) - at(s.from))));
  return s.u0 + (s.u1 - s.u0) * p;
};

const clock: StoryClock = { beat: { current: 0 }, k: { current: 0 }, pos: { current: 0 }, still: false };
function setU(u: number) {
  const b = Math.min(TIMELINE.length - 1, Math.max(0, Math.floor(u)));
  const k = Math.min(1, Math.max(0, u - b));
  const span = TIMELINE[b];
  clock.beat.current = b;
  clock.k.current = k;
  clock.pos.current = span.start + (span.end - span.start) * k;
}
setU(uAt(0));

const host = document.getElementById('reel')!;
Object.assign(document.documentElement.style, { margin: '0', background: '#fff', overflow: 'hidden' });
Object.assign(document.body.style, { margin: '0', overflow: 'hidden' });
Object.assign(host.style, { position: 'relative', width: `${W}px`, height: `${H}px`, overflow: 'hidden' });
const stage = document.createElement('div');
Object.assign(stage.style, { position: 'absolute', top: '0', bottom: '0', left: '0', width: `${W}px`, transformOrigin: '50% 50%' });
host.appendChild(stage);
createRoot(stage).render(
  <Suspense fallback={null}>
    <Scene clock={clock} />
  </Suspense>,
);

// ── The content layer ───────────────────────────────────────────────────
const INK = '#222222';
const RED = '#a00020';
const TALL = FMT === '916';
const PAD = TALL ? 72 : 96;
const SIZE = TALL
  ? { kicker: 26, title: 116, lede: 44, fact: 104, label: 26 }
  : { kicker: 22, title: 136, lede: 46, fact: 112, label: 22 };
const css = document.createElement('style');
css.textContent = `
  .rl { position: absolute; inset: 0; pointer-events: none; font-family: 'Daxline Pro', sans-serif; color: ${INK}; }
  .rl-block { position: absolute; left: ${PAD}px; ${TALL ? 'bottom: 470px' : 'bottom: 104px'}; right: ${PAD}px; }
  .rl-ln { display: block; overflow: hidden; padding: 0.06em 0 0.14em; margin: -0.06em 0 -0.14em; white-space: nowrap; }
  .rl-ch { display: inline-block; will-change: transform; }
  .rl-kicker { font-size: ${SIZE.kicker}px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 18px; }
  .rl-title { font-size: ${SIZE.title}px; font-weight: 350; line-height: 1.0; letter-spacing: -0.01em; }
  .rl-lede { font-size: ${SIZE.lede}px; font-weight: 350; line-height: 1.2; margin-top: 22px; white-space: normal; }
  .rl-fact { font-size: ${SIZE.fact}px; font-weight: 350; line-height: 1.0; margin-top: 34px; }
  .rl-label { font-size: ${SIZE.label}px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 30px; margin-bottom: -18px; }
  .rl-dark { color: #ffffff; }
  .rl-panel { position: absolute; inset: 0; background: #ffffff; }
  .rl-grid { position: absolute; inset: 0; }
  .rl-model { position: absolute; will-change: transform; }
  .rl-model img { position: absolute; object-fit: contain; }
  .rl-cap { position: absolute; font-family: 'Daxline Pro', sans-serif; color: ${INK}; }
  .rl-btn { position: absolute; display: flex; height: 96px; font: 500 34px 'Daxline Pro', sans-serif; color: #fff; }
  .rl-btn span { background: ${RED}; display: flex; align-items: center; padding: 0 44px; }
  .rl-btn i { background: #000; width: 96px; display: flex; align-items: center; justify-content: center; font-style: normal; font-weight: 350; font-size: 52px; }
`;
document.head.appendChild(css);
const layer = document.createElement('div');
layer.className = 'rl';
host.appendChild(layer);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const RISE = 0.34; // s a letter takes to rise
const STAGGER = 0.016; // s between letters

// A line of letters, each in its own span, so it rises letter by letter as the site's text does.
function lineEl(l: Line) {
  const el = document.createElement('span');
  el.className = `rl-ln rl-${l.cls}`;
  for (const ch of l.text) {
    const c = document.createElement('span');
    c.className = 'rl-ch';
    c.textContent = ch === ' ' ? '\u00a0' : ch;
    el.appendChild(c);
  }
  return el;
}
const fmtCount = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

type Built = { shot: Shot; block: HTMLElement; lines: { l: Line; el: HTMLElement }[] };
const built: Built[] = SHOTS.filter((s) => s.lines).map((shot) => {
  const block = document.createElement('div');
  block.className = `rl-block${shot.dark ? ' rl-dark' : ''}`;
  if (shot.top || (TALL && shot.top916)) Object.assign(block.style, { top: TALL ? '280px' : '170px', bottom: 'auto' });
  const lines = shot.lines!.filter((l) => !(TALL && l.only169) && !(!TALL && l.only916)).map((l) => {
    const el = lineEl(TALL && l.cls916 ? { ...l, cls: l.cls916 } : l);
    block.appendChild(el);
    return { l, el };
  });
  layer.appendChild(block);
  return { shot, block, lines };
});

function riseLine(el: HTMLElement, t: number, t0: number) {
  const chs = el.children;
  for (let i = 0; i < chs.length; i++) {
    const p = outCubic(clamp01((t - t0 - i * STAGGER) / RISE));
    (chs[i] as HTMLElement).style.transform = `translateY(${((1 - p) * 112).toFixed(2)}%)`;
  }
}
function setCount(el: HTMLElement, l: Line, t: number, t0: number) {
  const p = outCubic(clamp01((t - t0 - 0.1) / 0.7));
  const text = fmtCount((l.count ?? 0) * p) + (l.suffix ?? '');
  // the count keeps one span per character, rebuilt only when the text changes
  if (el.dataset.txt !== text) {
    el.dataset.txt = text;
    el.replaceChildren(...[...text].map((ch) => {
      const c = document.createElement('span');
      c.className = 'rl-ch';
      c.textContent = ch === ' ' ? '\u00a0' : ch;
      return c;
    }));
  }
}

// The site's grid, hairlines on the column lines with plus marks at the crossings, for the panels.
function gridSvg() {
  const cols = 4;
  const xs = Array.from({ length: cols + 1 }, (_, i) => 48 + (i * (W - 96)) / cols);
  const ys = TALL ? [136, 760, 1360, H - 64] : [136, H - 64];
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'rl-grid');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const add = (d: string, w: number, o: number) => {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    p.setAttribute('stroke', INK);
    p.setAttribute('stroke-width', String(w));
    p.setAttribute('stroke-opacity', String(o));
    p.setAttribute('fill', 'none');
    svg.appendChild(p);
  };
  add(xs.map((x) => `M${x} 0V${H}`).join('') + ys.map((y) => `M0 ${y}H${W}`).join(''), 1, 0.14);
  add(xs.flatMap((x) => ys.map((y) => `M${x - 9} ${y}H${x + 9}M${x} ${y - 9}V${y + 9}`)).join(''), 1.5, 0.7);
  return svg;
}

// Prodaja, the four Linde cut outs the site shows, one per half beat, with the site's own name, range and capacity.
const MODELS = [
  { img: '/products/ceoni-dizel-h30d.webp', name: 'Čeoni viljuškari', range: 'Linde H20 do H35', cap: '2,0 do 3,5 t' },
  { img: '/products/retrak-r16.webp', name: 'Retrak viljuškari', range: 'Linde R14 do R25', cap: '1,4 do 2,5 t' },
  { img: '/products/paletar-t20r.webp', name: 'Paletari i slagači', range: 'Linde T20 do T25', cap: '2,0 do 2,5 t' },
  { img: '/products/komisioner-n20c.webp', name: 'Komisioneri', range: 'Linde N20 do N25 C', cap: '2,0 do 2,5 t' },
];
const products = document.createElement('div');
products.className = 'rl-panel';
products.appendChild(gridSvg());
const prodHead = lineEl({ text: '96 Linde modela', b: 0, cls: 'title' });
Object.assign(prodHead.style, { position: 'absolute', left: `${PAD}px`, top: TALL ? '300px' : '196px' });
products.appendChild(prodHead);
const modelEls = MODELS.map((m) => {
  const box = document.createElement('div');
  box.className = 'rl-model';
  const img = document.createElement('img');
  img.src = m.img;
  const iw = TALL ? 900 : 980;
  const ih = TALL ? 820 : 700;
  Object.assign(box.style, TALL ? { left: '90px', top: '640px', width: `${iw}px`, height: `${ih}px` } : { left: '820px', top: '230px', width: `${iw}px`, height: `${ih}px` });
  Object.assign(img.style, { left: '0', top: '0', width: '100%', height: '100%' });
  box.appendChild(img);
  const cap = document.createElement('div');
  cap.className = 'rl-cap';
  Object.assign(cap.style, TALL ? { left: `${PAD}px`, top: '1500px' } : { left: `${PAD}px`, top: '640px' });
  const n = lineEl({ text: m.name, b: 0, cls: 'lede' });
  const r = lineEl({ text: m.range, b: 0, cls: 'label' });
  const c = lineEl({ text: m.cap, b: 0, cls: 'fact' });
  cap.append(n, r, c);
  products.append(box, cap);
  return { box, cap, lines: [n, r, c] };
});
layer.appendChild(products);

// The end card, the two logos as supplied at the co-branding proportion (Linde 160 by 96, the wordmark as wide), the
// address and the one primary, on the site's grid.
const end = document.createElement('div');
end.className = 'rl-panel';
end.appendChild(gridSvg());
const LOGO = TALL ? 400 : 440;
const lmh = document.createElement('img');
lmh.src = '/brand/linde-mh.svg';
const eko = document.createElement('img');
eko.src = '/brand/ekotehnika.svg';
const lx = TALL ? (W - LOGO) / 2 : W / 2 - LOGO - 60;
const ly = TALL ? 560 : 300;
Object.assign(lmh.style, { position: 'absolute', left: `${lx}px`, top: `${ly}px`, width: `${LOGO}px`, height: `${LOGO * 0.6}px`, objectFit: 'contain' });
Object.assign(eko.style, TALL
  ? { position: 'absolute', left: `${lx}px`, top: `${ly + LOGO * 0.6 + 70}px`, width: `${LOGO}px` }
  : { position: 'absolute', left: `${W / 2 + 60}px`, top: `${ly + LOGO * 0.3 - 45}px`, width: `${LOGO}px` });
const url = lineEl({ text: 'ekotehnika.rs', b: 0, cls: 'lede' });
Object.assign(url.style, { position: 'absolute', left: '0', right: '0', textAlign: 'center', top: TALL ? '1150px' : '640px', margin: '0' });
const btn = document.createElement('div');
btn.className = 'rl-btn';
btn.innerHTML = '<span>Zatražite ponudu</span><i>+</i>';
end.append(lmh, eko, url, btn);
layer.appendChild(end);

function drawLayer(t: number) {
  const s = shotAt(t);
  for (const b of built) {
    const on = b.shot === s;
    b.block.style.display = on ? '' : 'none';
    if (!on) continue;
    // a block hides from the beat its panel covers the scene
    if (s.panel && s.pb !== undefined && t >= at(s.pb)) {
      b.block.style.display = 'none';
      continue;
    }
    for (const { l, el } of b.lines) {
      const t0 = at(l.b);
      if (l.count !== undefined) setCount(el, l, t, t0);
      riseLine(el, t, t0);
    }
  }
  const pOn = s.panel === 'products' && t >= at(s.pb!);
  products.style.display = pOn ? '' : 'none';
  if (pOn) {
    const t0 = at(s.pb!);
    riseLine(prodHead, t, t0 + at(1));
    const step = Math.min(3, Math.floor((t - t0) / at(0.5)));
    modelEls.forEach((m, i) => {
      const on = i === step;
      m.box.style.display = on ? '' : 'none';
      m.cap.style.display = on ? '' : 'none';
      if (!on) return;
      const ts = t0 + i * at(0.5);
      const p = outCubic(clamp01((t - ts) / 0.22));
      m.box.style.transform = `translateY(${((1 - p) * 60).toFixed(1)}px)`;
      m.lines.forEach((el, j) => riseLine(el, t, ts + j * 0.04));
    });
  }
  const eOn = s.panel === 'end' && t >= at(s.pb!);
  end.style.display = eOn ? '' : 'none';
  if (eOn) {
    const t0 = at(s.pb!);
    const p1 = outCubic(clamp01((t - t0) / 0.3));
    const p2 = outCubic(clamp01((t - t0 - at(0.5)) / 0.3));
    lmh.style.transform = `translateY(${((1 - p1) * 80).toFixed(1)}px)`;
    eko.style.transform = `translateY(${((1 - p2) * 80).toFixed(1)}px)`;
    lmh.style.opacity = p1 > 0 ? '1' : '0';
    eko.style.opacity = p2 > 0 ? '1' : '0';
    riseLine(url, t, t0 + at(1));
    const p3 = outCubic(clamp01((t - t0 - at(1.5)) / 0.3));
    const bw = 380 + 96;
    Object.assign(btn.style, { left: `${(W - bw) / 2}px`, top: `${TALL ? 1270 : 730}px`, transform: `translateY(${((1 - p3) * 60).toFixed(1)}px)`, opacity: p3 > 0 ? '1' : '0' });
  }
  // the scene: a punch in on every shot's first beat that settles in 0.15 s, and the wider render for a tall crop
  const dt = t - at(s.from);
  // a still beat on the site gets a slow push in over the shot, so the frame never stands still
  const slow = 1 + (s.push ?? 0) * Math.min(1, Math.max(0, dt / (at(s.to) - at(s.from))));
  const punch = slow * (1 + 0.04 * Math.exp(-Math.max(dt, 0) / 0.06));
  const f = TALL ? s.frame916 : undefined;
  Object.assign(stage.style, f
    ? { left: `${-f.x}px`, width: `${f.w}px`, right: 'auto', transform: `scale(${punch})` }
    : { left: '0', width: `${W}px`, right: 'auto', transform: `scale(${punch})` });
}

const frames = (n: number) => new Promise<void>((r) => {
  const step = (i: number) => (i <= 0 ? r() : requestAnimationFrame(() => step(i - 1)));
  step(n);
});
const w = window as unknown as Record<string, unknown>;
w.reelReady = (async () => {
  await document.fonts.ready;
  // the models, the environment and the bake load once, then every frame is drawn from the clock
  await new Promise((r) => setTimeout(r, 12000));
  await frames(3);
})();
w.seek = async (t: number) => {
  const tt = Math.min(Math.max(t, 0), DURATION - 1e-4);
  setU(uAt(tt));
  drawLayer(tt);
  await frames(2);
};
w.seekU = async (u: number) => {
  setU(u);
  await frames(2);
};
w.DURATION = DURATION;
