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
type Write = () => void;
type Job = (vh: number) => Write | void;
const jobs = new Set<Job>();
let raf = 0;
let bound = false;
function run() {
  raf = 0;
  const vh = window.innerHeight;
  const writes: Write[] = [];
  jobs.forEach((j) => {
    const w = j(vh);
    if (w) writes.push(w);
  });
  for (const w of writes) w();
}
function ask() {
  if (!raf) raf = requestAnimationFrame(run);
}

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
    return onScroll((vh) => {
      const top = el.getBoundingClientRect().top;
      const p = clamp01((start * vh - top) / ((start - end) * vh));
      if (Math.abs(p - last) < 1e-3) return;
      last = p;
      return () => el.style.setProperty(name, p.toFixed(4));
    });
  }, [ref, name, start, end]);
}
