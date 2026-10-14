import { clamp01, motionOn, onScroll } from './motion';

// Shared loop for the canvas 2D dot fields, the audience cloud and the wave. It sizes the canvas to
// its CSS box at a device pixel ratio capped at 2, maps a vw by vh drawing space onto it with the
// xMidYMid slice the old SVG art used, and runs only while the canvas is on screen and the tab is
// visible. Scroll progress comes from the shared onScroll loop, and a 30 a second timer carries the
// slow idle motion. With motion off it draws one still frame and nothing runs.

export type Env = {
  live: boolean;
  tones: string[]; // index 1 to 3, read from --d1 to --d3 on the canvas
  p: number;       // 0 when the canvas top meets the bottom of the viewport, 1 when its bottom leaves the top
  time: number;    // seconds the field has run, only while on screen
  k: number;       // canvas pixels per drawing unit
  w: number;       // CSS pixels of the canvas box
  h: number;
};

export function runField(cv: HTMLCanvasElement, vw: number, vh: number, draw: (ctx: CanvasRenderingContext2D, env: Env) => void) {
  const ctx = cv.getContext('2d');
  if (!ctx) return () => {};
  const live = motionOn();
  const env: Env = { live, tones: ['', '', '', ''], p: 0, time: 0, k: 1, w: 0, h: 0 };
  let last = 0;
  let lastDraw = 0;
  let running = false;
  let onScreen = false;
  let unsub: (() => void) | null = null;
  let idle = 0;

  function fit() {
    const cs = getComputedStyle(cv);
    for (let t = 1; t <= 3; t++) env.tones[t] = cs.getPropertyValue(`--d${t}`).trim() || '#7a7a7a';
    env.w = cv.clientWidth;
    env.h = cv.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    if (last) env.time += Math.min(now - last, 100) / 1000;
    last = now;
    lastDraw = now;
    frame();
  }
  function progress() {
    const r = cv.getBoundingClientRect();
    env.p = clamp01((window.innerHeight - r.top) / (window.innerHeight + r.height));
  }
  function idleLoop(now: number) {
    idle = requestAnimationFrame(idleLoop);
    if (now - lastDraw >= 33) tick(now);
  }
  function start() {
    if (running) return;
    running = true;
    last = 0;
    unsub = onScroll(() => {
      progress();
      return () => tick(performance.now());
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
