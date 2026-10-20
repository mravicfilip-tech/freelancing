import { clamp01, glide, motionOn, onScroll } from './motion';

// Shared loop for the canvas 2D dot fields, the audience cloud and the wave. It sizes the canvas to
// its CSS box at a device pixel ratio capped at 2, maps a vw by vh drawing space onto it with the
// xMidYMid slice the old SVG art used, and runs only while the canvas is on screen and the tab is
// visible. Scroll progress comes from the shared onScroll loop, and a 30 a second timer carries the
// slow idle motion. With motion off it draws one still frame and nothing runs.
//
// A field draws at most 60 times a second, also while the page scrolls, and its canvas holds at most
// MAX_PX pixels. Filip's 2560 wide screen at 1.5 and 240Hz redrew a 7.5 million pixel canvas of a few
// thousand dots on every one of 240 frames a second, and dropped frames on the process and audience
// sections, 20 October 2026. The page scrolls at the screen's rate, the canvas moves with it, and only
// the dots' own motion steps at 60, which the eye does not tell apart.

export type Env = {
  live: boolean;
  tones: string[]; // index 1 to 3, read from --d1 to --d3 on the canvas
  p: number;       // 0 when the canvas top meets the bottom of the viewport, 1 when its bottom leaves the top
  time: number;    // seconds the field has run, only while on screen
  k: number;       // canvas pixels per drawing unit
  w: number;       // CSS pixels of the canvas box
  h: number;
};

const MAX_PX = 4_000_000;
// the shortest gap between two drawn frames, about 60 a second
const MIN_GAP = 15;

export function runField(cv: HTMLCanvasElement, vw: number, vh: number, draw: (ctx: CanvasRenderingContext2D, env: Env) => void) {
  const ctx = cv.getContext('2d');
  if (!ctx) return () => {};
  const live = motionOn();
  const env: Env = { live, tones: ['', '', '', ''], p: 0, time: 0, k: 1, w: 0, h: 0 };
  let last = 0;
  let lastDraw = 0;
  let pTarget = -1; // the scroll's p, env.p glides toward it
  let running = false;
  let onScreen = false;
  let unsub: (() => void) | null = null;
  let idle = 0;

  function fit() {
    const cs = getComputedStyle(cv);
    for (let t = 1; t <= 3; t++) env.tones[t] = cs.getPropertyValue(`--d${t}`).trim() || '#7a7a7a';
    env.w = cv.clientWidth;
    env.h = cv.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAX_PX / Math.max(1, env.w * env.h)));
    cv.width = Math.round(env.w * dpr);
    cv.height = Math.round(env.h * dpr);
    env.k = Math.max(env.w / vw, env.h / vh) * dpr;
  }
  function frame() {
    if (!env.w || !env.h) return;
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, cv.width, cv.height);
    ctx!.setTransform(env.k, 0, 0, env.k, (cv.width - vw * env.k) / 2, (cv.height - vh * env.k) / 2);
    draw(ctx!, env);
    ctx!.globalAlpha = 1;
  }
  function tick(now: number) {
    const dt = last ? Math.min(now - last, 100) : 1000 / 60;
    if (last) env.time += dt / 1000;
    last = now;
    if (pTarget >= 0) env.p = glide(env.p, pTarget, dt);
    lastDraw = now;
    frame();
  }
  function progress() {
    const r = cv.getBoundingClientRect();
    const t = clamp01((window.innerHeight - r.top) / (window.innerHeight + r.height));
    if (pTarget < 0) env.p = t;
    pTarget = t;
  }
  function idleLoop(now: number) {
    idle = requestAnimationFrame(idleLoop);
    // 60 a second while the field still glides to the scroll, then 30 a second for the idle motion
    if (now - lastDraw >= 33 || (pTarget >= 0 && env.p !== pTarget && now - lastDraw >= MIN_GAP)) tick(now);
  }
  function start() {
    if (running) return;
    running = true;
    last = 0;
    // the scroll only moves the target, the loop above draws toward it
    unsub = onScroll(() => {
      progress();
    });
    idle = requestAnimationFrame(idleLoop);
  }
  function stop() {
    if (!running) return;
    running = false;
    unsub?.();
    unsub = null;
    cancelAnimationFrame(idle);
  }
  const sync = () => (onScreen && !document.hidden ? start() : stop());

  fit();
  let io: IntersectionObserver | null = null;
  if (live) {
    progress();
    io = new IntersectionObserver((es) => {
      onScreen = es[es.length - 1].isIntersecting;
      sync();
    });
    io.observe(cv);
    document.addEventListener('visibilitychange', sync);
  }
  const ro = new ResizeObserver(() => {
    fit();
    if (live) progress();
    frame();
  });
  ro.observe(cv);
  frame();

  return () => {
    stop();
    io?.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', sync);
  };
}
