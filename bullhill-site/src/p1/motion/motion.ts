import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

// Shared motion for Foundry, briefs/website/site-motion-story.md. Two kinds of beat.
//   once    an element gets data-in="yes" the first time it enters, CSS runs the move
//   scroll  an element gets a CSS variable 0 to 1 from its place in the viewport, on one shared
//           requestAnimationFrame loop, so a scroll burst costs one read per element per frame
// Motion is off for reduced motion, for ?motion=off, and under automation (navigator.webdriver),
// so full page shots and /uireview see the settled page. ?motion=on forces it on for motion shots.
// With motion off every element is marked in at once and no variable is written, so CSS must
// read each variable with its settled value as the fallback, var(--sp, 1).

export function motionOn(): boolean {
  if (typeof window === 'undefined') return false;
  const m = new URLSearchParams(window.location.search).get('motion');
  if (m === 'off') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (m === 'on') return true;
  return !navigator.webdriver;
}

let io: IntersectionObserver | null = null;
function observer() {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.in = 'yes';
        io?.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  return io;
}

// Once beat. Marks the element in the first time it is 12 percent inside the viewport.
export function useInView(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!motionOn()) {
      el.dataset.in = 'yes';
      return;
    }
    el.dataset.in = 'no';
    const o = observer();
    o.observe(el);
    return () => o.unobserve(el);
  }, [ref]);
}

// A job reads the page and may return a write. Every job reads first and every write runs after,
// so a frame lays the page out once however many jobs run.
// A job gets the frame's dt in ms too, for the glide below.
type Write = () => void;
type Job = (vh: number, dt: number) => Write | void;
const jobs = new Set<Job>();
let raf = 0;
let bound = false;
let t0 = 0;
function run(now: number) {
  raf = 0;
  const vh = window.innerHeight;
  // the first frame after a pause counts as one frame
  const gap = t0 ? now - t0 : 0;
  const dt = gap > 0 && gap < 100 ? gap : 1000 / 60;
  t0 = now;
  const writes: Write[] = [];
  jobs.forEach((j) => {
    const w = j(vh, dt);
    if (w) writes.push(w);
  });
  for (const w of writes) w();
}
function ask() {
  if (!raf) raf = requestAnimationFrame(run);
}

// The glide. A scroll linked value closes a share of the gap to the scroll each frame, so wheel
// notches arrive as one continuous move, the same time constants as the hero (hero6/progress.ts).
const TAU = 70; // short, the page itself glides on a wheel since 15 October 2026 (smoothScroll.ts)
export function glide(cur: number, target: number, dt: number) {
  const v = cur + (target - cur) * (1 - Math.exp(-dt / TAU));
  return Math.abs(target - v) < 2e-4 ? target : v;
}
// a job still gliding asks for the next frame, scroll or not
export const again = ask;

// Scroll beat, the low level form. fn runs once a frame while the page scrolls or resizes. It reads,
// and returns what it writes, so its writes wait for every other job's reads.
export function onScroll(fn: Job) {
  if (!bound) {
    window.addEventListener('scroll', ask, { passive: true });
    window.addEventListener('resize', ask);
    bound = true;
  }
  jobs.add(fn);
  ask();
  return () => {
    jobs.delete(fn);
  };
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Scroll beat. Writes `name` on the element, 0 when its top edge sits at `start` of the viewport
// height and 1 when it sits at `end`, so start 1 and end 0.5 runs from the bottom edge to the middle.
export function useScrollVar(ref: RefObject<HTMLElement | null>, name: string, start = 1, end = 0.5) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !motionOn()) return;
    let last = -1;
    let cur = -1;
    return onScroll((vh, dt) => {
      const top = el.getBoundingClientRect().top;
      const target = clamp01((start * vh - top) / ((start - end) * vh));
      cur = cur < 0 ? target : glide(cur, target, dt);
      if (cur !== target) again();
      if (Math.abs(cur - last) < 5e-4) return;
      last = cur;
      const v = cur;
      return () => el.style.setProperty(name, v.toFixed(4));
    });
  }, [ref, name, start, end]);
}
