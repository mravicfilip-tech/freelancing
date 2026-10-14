// The --record mode of shoot.mjs. Records one route at one width as an mp4 the way a person scrolls
// it, plus a strip of stills for a reader who cannot watch video.
//
// Time is virtual. Before any page script runs, the page's clock, timers, animation frames, Date,
// CSS and Web Animations and playing videos are frozen, and each video frame steps them by exactly
// 1000 / fps ms. A slow machine makes the recording take longer, never makes it stutter, so easing,
// order and timing in the file are the page's own. The flip side, jank cannot show up in a
// recording, so it is never judged from one. Iframes, workers and the compositor's own smooth scroll
// stay on real time, so the browser runs with smooth scrolling off and wheel steps land at once.
//
// The path. Hold on the top for 1.5s, then scroll 80 percent of a viewport with the mouse wheel over
// 1s, eased in and out, and pause 0.8s, until the bottom, then hold 1s. Wheel input, not scrollTo,
// so smooth scroll libraries and scroll hijacks see what a person would send. It stops at the
// bottom, at the seconds cap, or when two scroll steps in a row move nothing.
//
// Needs ffmpeg on the PATH, or FFMPEG_PATH. Without it the frames are written as jpgs and the
// command that joins them is returned instead of a video.

import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const HOLD_MS = 1500, SCROLL_MS = 1000, PAUSE_MS = 800, TAIL_MS = 1000, STEP_OF_VIEWPORT = 0.8, STRIP_CELLS = 16;

// Runs inside the page before any page script. Installs window.__rec, the frozen clock and the stepper.
export function installClock() {
  if (window.__rec || window !== window.top) return;
  const W = window, P = W.performance;
  const real = { now: P.now.bind(P), raf: W.requestAnimationFrame.bind(W), st: W.setTimeout.bind(W), Date: W.Date };
  let vt = real.now();
  const base = real.Date.now() - vt;
  P.now = () => vt;
  const RD = real.Date;
  function D(...a) { if (!new.target) return new RD(base + vt).toString(); return a.length ? new RD(...a) : new RD(base + vt); }
  D.prototype = RD.prototype; D.now = () => Math.floor(base + vt); D.parse = RD.parse; D.UTC = RD.UTC;
  W.Date = D;

  let seq = 1;
  const timers = new Map();
  const add = (fn, ms, args, every) => {
    const id = seq++;
    ms = Math.max(0, Number(ms) || 0);
    timers.set(id, { fn: typeof fn === 'function' ? fn : () => (0, eval)(String(fn)), args, due: vt + ms, every: every ? Math.max(4, ms) : 0 });
    return id;
  };
  W.setTimeout = (fn, ms, ...a) => add(fn, ms, a, false);
  W.setInterval = (fn, ms, ...a) => add(fn, ms, a, true);
  W.clearTimeout = W.clearInterval = (id) => { timers.delete(id); };
  let rseq = 1, rq = new Map();
  W.requestAnimationFrame = (cb) => { const id = rseq++; rq.set(id, cb); return id; };
  W.cancelAnimationFrame = (id) => { rq.delete(id); };
  const raise = (e) => real.st(() => { throw e; });

  const describe = (el) => {
    if (!el || el.nodeType !== 1) return 'unknown';
    const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return `${el.tagName.toLowerCase()}${cls}`;
  };
  const shifts = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput || !e.value) continue;
        shifts.push({ ms: vt, value: e.value, sources: (e.sources || []).slice(0, 3).map((s) => describe(s.node)) });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch { /* no layout shift API */ }

  const held = new Set();
  W.__rec = {
    now: () => vt,
    shifts,
    // Two real frames, so scroll events and intersection observer callbacks from the last input have run.
    settle: () => new Promise((r) => real.raf(() => real.raf(() => r()))),
    scroller() {
      const de = document.scrollingElement || document.documentElement;
      if (de.scrollHeight > innerHeight + 1) return de;
      let best = de, area = 0;
      for (const e of document.body.querySelectorAll('*')) {
        if (!/(auto|scroll)/.test(getComputedStyle(e).overflowY) || e.scrollHeight <= e.clientHeight + 1) continue;
        const r = e.getBoundingClientRect();
        if (r.width * r.height > area && r.width * r.height > innerWidth * innerHeight * 0.4) { best = e; area = r.width * r.height; }
      }
      return best;
    },
    position() {
      const sc = W.__rec.scroller();
      return { y: Math.round(sc.scrollTop), max: Math.max(0, Math.round(sc.scrollHeight - sc.clientHeight)) };
    },
    // Timers first, then animations, then animation frames, the order a real frame runs them in.
    async step(dt) {
      const target = vt + dt;
      for (let guard = 0; guard < 5000; guard++) {
        let next = null;
        for (const [id, t] of timers) if (t.due <= target && (!next || t.due < next[1].due)) next = [id, t];
        if (!next) break;
        const [id, t] = next;
        vt = Math.max(vt, t.due);
        if (t.every) t.due += t.every; else timers.delete(id);
        try { t.fn.apply(W, t.args); } catch (e) { raise(e); }
      }
      vt = target;
      for (const a of document.getAnimations()) {
        if (a.playState === 'running') a.currentTime = (Number(a.currentTime) || 0) + dt * a.playbackRate;
      }
      const q = rq;
      rq = new Map();
      for (const cb of q.values()) { try { cb(vt); } catch (e) { raise(e); } }
      const seeks = [];
      for (const v of document.querySelectorAll('video')) {
        if (!held.has(v)) { if (v.paused || v.ended) continue; held.add(v); }
        if (!v.paused) v.pause();
        let t = v.currentTime + dt / 1000;
        if (v.duration && t >= v.duration) t = v.loop ? t % v.duration : v.duration;
        seeks.push(new Promise((r) => { v.addEventListener('seeked', r, { once: true }); real.st(r, 400); }));
        v.currentTime = t;
      }
      await Promise.all(seeks);
      return vt;
    },
  };
}

export function findFfmpeg() {
  const bin = process.env.FFMPEG_PATH || 'ffmpeg';
  try { return spawnSync(bin, ['-version'], { stdio: 'ignore' }).status === 0 ? bin : null; } catch { return null; }
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Records one route at one width. Never throws, returns the record block for report.json.
export async function recordRoute(browser, { url, width, height, fps = 30, seconds = 90, wait = 0, out, name }) {
  const dt = 1000 / fps;
  const cap = Math.round(seconds * fps);
  const base = join(out, `${name}_${width}`);
  const rec = { fps, seconds: 0, frames: 0, video: null, framesDir: null, strip: null, stopped: null, scroll: null, layoutShift: { total: 0, atLoad: 0, events: [] }, console: [], renderSeconds: 0 };
  const t0 = Date.now();
  const ff = findFfmpeg();
  let page = null, enc = null;
  try {
    page = await browser.newPage();
    page.on('console', (m) => { if (m.type() === 'error') rec.console.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => rec.console.push(String(e.message || e).slice(0, 200)));
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    const cdp = await page.createCDPSession();
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await page.evaluateOnNewDocument(installClock);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    if (!(await page.evaluate(() => !!window.__rec))) throw new Error('the frozen clock did not install');
    await page.mouse.move(Math.round(width / 2), Math.round(height / 2));
    // The clock stood still through load, so shifts from load are told apart by count, not by time.
    const { startMs, startShift } = await page.evaluate(() => ({ startMs: window.__rec.now(), startShift: window.__rec.shifts.length }));

    if (ff) {
      rec.video = `${base}.mp4`;
      enc = spawn(ff, ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'veryfast', '-movflags', '+faststart', rec.video], { stdio: ['pipe', 'ignore', 'pipe'] });
      enc.stderr.on('data', (d) => { rec.ffmpegError = String(d).trim().slice(0, 200); });
      enc.stdin.on('error', () => { /* reported through the exit code */ });
      enc.on('error', (e) => { rec.ffmpegError = String(e.message || e).slice(0, 200); });
    } else {
      rec.framesDir = `${base}_frames`;
      mkdirSync(rec.framesDir, { recursive: true });
    }

    const keep = [];
    const every = Math.max(1, Math.round(fps / 4));
    let frame = 0, carry = 0;
    const shoot = async (y) => {
      const jpg = await page.screenshot({ type: 'jpeg', quality: 85, optimizeForSpeed: true });
      if (enc) { if (!enc.stdin.write(jpg)) await Promise.race([once(enc.stdin, 'drain'), once(enc.stdin, 'close')]); }
      else writeFileSync(join(rec.framesDir, `${String(frame).padStart(6, '0')}.jpg`), jpg);
      if (frame % every === 0) keep.push({ frame, y, jpg });
      frame++;
    };
    const tick = async (delta) => {
      if (delta) await page.mouse.wheel({ deltaY: delta });
      const pos = await page.evaluate(async (ms) => { await window.__rec.settle(); await window.__rec.step(ms); return window.__rec.position(); }, dt);
      await shoot(pos.y);
      return pos;
    };
    const hold = async (ms) => { let pos; for (let i = 0; i < Math.round(ms / dt) && frame < cap; i++) pos = await tick(0); return pos; };

    let pos = await page.evaluate(() => window.__rec.position());
    rec.scroll = { start: pos.y, end: pos.y, max: pos.max };
    await shoot(pos.y);
    pos = (await hold(HOLD_MS)) || pos;
    let stuck = 0, stopped = null;
    while (frame < cap) {
      if (pos.y >= pos.max - 2) { stopped = 'bottom'; break; }
      const dist = Math.min(height * STEP_OF_VIEWPORT, pos.max - pos.y);
      const n = Math.max(1, Math.round(SCROLL_MS / dt));
      const from = pos.y;
      for (let i = 1; i <= n && frame < cap; i++) {
        const want = dist * (ease(i / n) - ease((i - 1) / n)) + carry;
        const d = Math.round(want);
        carry = want - d;
        pos = await tick(d);
      }
      pos = (await hold(PAUSE_MS)) || pos;
      stuck = pos.y === from ? stuck + 1 : 0;
      if (stuck >= 2) { stopped = 'scroll did not move, the page may drive its own scroll'; break; }
    }
    if (stopped === 'bottom') pos = (await hold(TAIL_MS)) || pos;
    rec.stopped = stopped || `seconds cap ${seconds}`;
    rec.scroll.end = pos.y;
    rec.scroll.max = pos.max;
    rec.frames = frame;
    rec.seconds = Math.round((frame / fps) * 10) / 10;

    const all = await page.evaluate(() => window.__rec.shifts);
    const shifts = all.slice(startShift);
    rec.layoutShift.atLoad = Math.round(all.slice(0, startShift).reduce((t, x) => t + x.value, 0) * 10000) / 10000;
    rec.layoutShift.total = Math.round(shifts.reduce((t, x) => t + x.value, 0) * 10000) / 10000;
    rec.layoutShift.events = shifts.sort((a, b) => b.value - a.value).slice(0, 5)
      .map((x) => ({ at: `${((x.ms - startMs) / 1000).toFixed(1)}s`, value: Math.round(x.value * 10000) / 10000, sources: x.sources }));

    if (enc) {
      enc.stdin.end();
      const [code] = await once(enc, 'exit');
      enc = null;
      if (code !== 0) throw new Error(`ffmpeg exited ${code}${rec.ffmpegError ? `, ${rec.ffmpegError}` : ''}`);
    } else {
      rec.joinWith = `ffmpeg -framerate ${fps} -i "${join(rec.framesDir, '%06d.jpg')}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -pix_fmt yuv420p "${base}.mp4"`;
    }

    const picks = [];
    for (let i = 0; i < Math.min(STRIP_CELLS, keep.length); i++) picks.push(keep[Math.round((i * (keep.length - 1)) / Math.max(1, Math.min(STRIP_CELLS, keep.length) - 1))]);
    rec.strip = `${base}_strip.png`;
    await strip(browser, [...new Set(picks)], fps, width, rec.strip);
  } catch (e) {
    rec.error = String(e.message || e).slice(0, 200);
    if (enc) { try { enc.stdin.destroy(); enc.kill(); } catch { /* already gone */ } }
  } finally {
    if (page) await page.close().catch(() => {});
  }
  rec.renderSeconds = Math.round((Date.now() - t0) / 100) / 10;
  return rec;
}

// Up to 16 stills from the recording, evenly spaced, 4 across, each labelled with its time and
// scroll position. The browser lays it out as an html page and screenshots it.
async function strip(browser, picks, fps, width, file) {
  const cols = 4, pad = 24, gap = 16, sheetW = 1920;
  const cellW = Math.floor((sheetW - pad * 2 - gap * (cols - 1)) / cols);
  const cells = picks.map((p) => `<figure><div class="n">${(p.frame / fps).toFixed(2)}s, y ${p.y}</div><img src="data:image/jpeg;base64,${Buffer.from(p.jpg).toString('base64')}"></figure>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:#f4f4f5;font-family:Arial,sans-serif}
    .sheet{width:${sheetW}px;padding:${pad}px;display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:${gap}px}
    figure{margin:0}.n{font-size:22px;font-weight:700;color:#111;margin:0 0 6px}
    img{display:block;width:${Math.min(cellW, width)}px;height:auto;border:2px solid #111}
  </style><div class="sheet">${cells}</div>`;
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: sheetW, height: 600, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null))));
    await page.screenshot({ path: file, fullPage: true });
  } finally {
    await page.close();
  }
}
