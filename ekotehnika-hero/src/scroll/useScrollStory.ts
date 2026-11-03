// The scroll clock for every variant. Lenis smooths the page scroll, GSAP ScrollTrigger pins the
// stage for length px and scrubs progress from 0 to 1. Read progress.current inside useFrame or a
// requestAnimationFrame loop, never through React state.
//
// The follow is time based, so it feels the same at 30, 60 and 120 fps, and the story clock has a top speed so a hard
// flick plays the beats through at a steady pace. The page scroll itself is never capped.
//
// ?feel=0 is the old per frame follow with no cap. ?feel=1, 2 and 3 cap the clock at 1500, 2500 and 4000 story px a
// second. ?feel=4, 5 and 6 cap it at 900, 1300 and 1800 and also lock the page to it, see holdWheel below. ?feel=7 is 5
// with stops, a point in each section where its words have arrived, at which the clock waits while the wheel is still being
// turned (round 7, Filip's "us skipping content is not what we want"). ?feel=8 carries the clock from anchor to anchor, one gesture
// a trip, see ANCHORING. No parameter means 7. The parameter is read once, when
// the module loads, by story2/preview.ts, which also holds the panel's way back, a page that a switch reloaded lands on the
// frame it left (restore below).
//
// With reduced motion there is no Lenis, no pin and no scrub. goTo(p) sets a still frame.

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis, { type VirtualScrollData } from 'lenis';
import { FEEL } from '../story2/preview';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

const FEEL_CAPS = [0, 1500, 2500, 4000, 900, 1300, 1800, 1300, 1800];
// Feels 4 to 7 hold the page to the story clock, the wheel can put the page's scroll target no more than LEAD px ahead of
// the clock or behind it. Pin px and story px are 1 to 1.
const LOCKED = FEEL >= 4;
const LEAD = 120;
// Feel 7 stops at the points in STOPS (story2/stops.ts). A clock within ZONE px of a stop is at it. The wheel holds there until no wheel
// event has come for GAP ms, so a hand that keeps turning, or a trackpad that keeps coasting, never carries the clock on, and the next
// gesture does.
const STOPPING = FEEL === 7;
const ZONE = 4;
const GAP = 350;

// Feel 8, anchors, the client's ticket of 3 November, "Testirati scroll sa anchorima". The anchors are the stops, with the top and the
// end of the story. One gesture carries the clock to the next anchor in its direction at the feel's top speed, so every frame on the
// way still plays, and the wheel is dropped on the way. A gesture the other way turns the trip back. At the anchor the next gesture
// starts after GAP ms of quiet, on a rising delta, the hand starting over while a trackpad still coasts, or after DWELL ms there of
// a wheel turning steadily, so no device is ever held at an anchor for good. A swipe dying down is never steady, so one swipe makes
// one trip.
const ANCHORING = FEEL === 8;
const DWELL = 1200;
const RISE_AFTER = 250;

// What the lock looks at, the pinned story that is on the page now, and the story pixels it stops at.
let lock: { st: ScrollTrigger; progress: { current: number }; length: number; jumpUntil: { current: number }; stops: number[] } | null = null;

// The state of the stops. hold is the stop the clock is waiting at, wheel events are dropped while it is set. pass is the stop a gesture
// began on, which that gesture carries the clock past. lastWheel is when the last wheel event came, dropped ones included.
let hold: number | null = null;
let pass: number | null = null;
let lastWheel = -Infinity;

// The state of the anchors. trip is the story pixel the clock is on its way to and dir its direction, from the anchor it left. landed
// is when the clock last reached its anchor, lastAbs the size of the last wheel delta and peak the largest since then.
let trip: number | null = null;
let dir = 0;
let from = 0;
let landed = -Infinity;
let lastAbs = 0;
let peak = 0;

// Lenis asks this for every wheel event before it moves the scroll target. The part of the delta past the lead is dropped,
// never queued, so when the hand stops the page stops within LEAD px of the clock. Inside the pin only, and the lock lets go
// once the clock is at the end of the story, or at its start when going up, so the page leaves the story freely. A jump
// from goTo lifts it. Keys and a dragged scrollbar scroll natively and are not held, the clock cap still applies to them.
function holdWheel(data: VirtualScrollData) {
  const event = data.event;
  if (!lock || !lenis || !LOCKED || !event.type.includes('wheel') || (event as WheelEvent).ctrlKey) return true;
  const d = data.deltaY;
  if (d === 0 || gsap.ticker.time <= lock.jumpUntil.current) {
    // a jump from goTo ignores the stops and lets the next gesture start clean
    hold = pass = trip = null;
    return true;
  }
  const { st, progress, length, stops } = lock;
  const at = st.start + progress.current * length;
  const target = lenis.targetScroll;
  let next = target + d;
  if (d > 0 && at < st.end - 0.5) next = Math.min(next, Math.max(at + LEAD, target));
  else if (d < 0 && at > st.start + 0.5) next = Math.max(next, Math.min(at - LEAD, target));
  if (ANCHORING && stops.length) return anchorWheel(data, d, at, target);
  if (STOPPING && stops.length && d < 0) {
    // Going back up the stops do not hold, the words above have been read. A trackpad that keeps coasting never leaves the GAP of
    // quiet a stop waits for, so it held the page at the first Najam stop for good, the client's ticket of 3 November, "Ne može
    // se skrolovati nazad iz ove sekcije".
    lastWheel = performance.now();
    hold = pass = null;
  } else if (STOPPING && stops.length) {
    const now = performance.now();
    const gap = now - lastWheel;
    lastWheel = now;
    // no wheel event for GAP ms, this is a new gesture
    if (gap >= GAP) hold = pass = null;
    if (hold !== null) return drop(event);
    const pos = at - st.start;
    const here = stops.find((s) => Math.abs(s - pos) <= ZONE);
    if (here !== undefined) {
      // a gesture that begins on a stop carries on past it, one that arrives at a stop with the wheel still turning waits there
      if (gap >= GAP) pass = here;
      else if (pass !== here) {
        hold = here;
        return drop(event);
      }
    } else pass = null;
    // the clock may not be taken past the next stop in the direction of the wheel, so it arrives there and waits
    const beyond = d > 0 ? stops.find((s) => s > pos + ZONE) : [...stops].reverse().find((s) => s < pos - ZONE);
    if (beyond !== undefined) next = d > 0 ? Math.min(next, st.start + beyond) : Math.max(next, st.start + beyond);
  }
  if (next === target) return drop(event);
  data.deltaY = next - target;
  return true;
}

// Feel 8. at is the clock and target the page's scroll target, both in page pixels.
function anchorWheel(data: VirtualScrollData, d: number, at: number, target: number) {
  const { st, length, stops } = lock!;
  const event = data.event;
  const now = performance.now();
  const gap = now - lastWheel;
  const abs = Math.abs(d);
  const rising = abs > lastAbs * 1.3 + 2;
  peak = Math.max(peak, abs);
  const steady = abs > 2 && abs >= peak * 0.7;
  lastWheel = now;
  lastAbs = abs;
  // past the end of the story the page scrolls freely, and on the way back up it comes to rest on the end
  if (target > st.end + 0.5) {
    if (d < 0) data.deltaY = Math.max(d, st.end - target);
    return true;
  }
  const pos = at - st.start;
  if (trip !== null) {
    // on the way, a fresh gesture the other way turns back to the anchor the trip left, anything else is dropped
    if (Math.sign(d) !== dir && (gap >= GAP || rising)) return go(data, from, trip, d, target, st.start);
    return drop(event);
  }
  const fresh = gap >= GAP || (rising && now - landed > RISE_AFTER) || (steady && now - landed > DWELL);
  if (!fresh) return drop(event);
  // at the end of the story a fresh gesture down leaves it for the page below
  if (d > 0 && at >= st.end - 0.5) return true;
  const anchors = [0, ...stops, length];
  const next = d > 0 ? anchors.find((s) => s > pos + ZONE) : [...anchors].reverse().find((s) => s < pos - ZONE);
  if (next === undefined) return true;
  return go(data, next, pos, d, target, st.start);
}

// Sets the trip to the anchor at story pixel to, leaving the one at story pixel leaving, by moving the page's scroll target
// there. The clock follows the target at the feel's top speed, see the tick below.
function go(data: VirtualScrollData, to: number, leaving: number, d: number, target: number, start: number) {
  data.deltaY = start + to - target;
  if (data.deltaY === 0) return drop(data.event);
  trip = to;
  from = leaving;
  dir = Math.sign(d);
  return true;
}

// Lenis lets the browser scroll on its own when it gets no delta, so the event is stopped here.
function drop(event: Event) {
  if (event.cancelable) event.preventDefault();
  return false;
}
// Seconds the speed cap stays lifted after goTo, the 1.4 s jump plus the time the follow takes to catch up.
const JUMP_HOLD = 1.8;

// One Lenis for the page, driven by the GSAP ticker so ScrollTrigger and Lenis share a clock.
function startLenis() {
  if (lenis) return lenis;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, virtualScroll: holdWheel });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export type ScrollStory = {
  length: number;
  reduced: boolean;
  // progress points where the scroll comes to rest, 0 to 1, leave empty for free scroll
  snap?: number[];
  // a second, smoothed progress that eases toward the scroll, for camera moves
  smoothing?: number;
  // progress, 0 to 1, to land on at once when the story starts, with no animation, for a page that a switch reloaded
  restore?: number | null;
  // story pixels where the clock waits while the wheel is still turned, ascending, used by feel 7 only (story2/stops.ts)
  stops?: number[];
};

export function useScrollStory({ length, reduced, snap, smoothing = 0.08, restore = null, stops }: ScrollStory) {
  const stageRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const raw = useRef(0);
  const stRef = useRef<ScrollTrigger | null>(null);
  // ticker time until which the speed cap is lifted, set by goTo
  const jumpUntil = useRef(0);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;
    startLenis();
    const ctx = gsap.context(() => {
      stRef.current = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: `+=${length}`,
        pin: true,
        anticipatePin: 1,
        scrub: true,
        snap: snap?.length
          ? {
              snapTo: (v: number) => snap.reduce((b, r) => (Math.abs(r - v) < Math.abs(b - v) ? r : b), snap[0]),
              duration: { min: 0.3, max: 1.1 },
              delay: 0.12,
              ease: 'power2.inOut',
            }
          : undefined,
        onUpdate: (self) => {
          // The pin start can sit a fraction of a pixel off the top, so the ends are snapped to land on exactly 0 and 1.
          const p = self.progress;
          raw.current = FEEL !== 0 && p * length < 0.05 ? 0 : FEEL !== 0 && (1 - p) * length < 0.05 ? 1 : p;
        },
      });
    }, stage);
    if (stRef.current) lock = { st: stRef.current, progress, length, jumpUntil, stops: stops ?? [] };
    hold = pass = trip = null;
    // a reload from the panel lands on the frame it left, straight there, the clock and the page scroll both
    if (restore !== null && stRef.current) {
      const st = stRef.current;
      raw.current = restore;
      progress.current = restore;
      const y = st.start + (st.end - st.start) * restore;
      if (restore > 0) {
        // the pin spacer is in, so measure the page again before asking for a scroll that far down
        ScrollTrigger.refresh();
        lenis?.resize();
        window.scrollTo(0, y);
        lenis?.scrollTo(y, { immediate: true, force: true });
      }
    }
    // The old factor per frame was smoothing * 2.2 at 60 fps. The same follow as a rate per second, so a frame of any
    // length moves the same share of the distance.
    const rate = -60 * Math.log(1 - Math.min(smoothing * 2.2, 0.999));
    const cap = FEEL_CAPS[FEEL];
    const tick = (time: number, deltaTime: number) => {
      if (FEEL === 0) {
        progress.current += (raw.current - progress.current) * smoothing * 2.2;
        if (Math.abs(raw.current - progress.current) < 0.00005) progress.current = raw.current;
        return;
      }
      // Under the lock the clock follows the page's scroll target, which holds within LEAD px of it. The page itself is
      // eased by Lenis and trails its target by about 0.2 s, and following that as well would cap the clock near 400 px/s.
      const st = stRef.current;
      const goal =
        LOCKED && lenis && st && time > jumpUntil.current ? clamp01((lenis.targetScroll - st.start) / (st.end - st.start)) : raw.current;
      const dt = Math.min(deltaTime / 1000, 0.1);
      let step = (goal - progress.current) * (1 - Math.exp(-rate * dt));
      if (time > jumpUntil.current) {
        const max = (cap * dt) / length;
        step = Math.max(-max, Math.min(max, step));
      }
      progress.current += step;
      if (Math.abs(goal - progress.current) < 0.00005) progress.current = goal;
      // feel 8, the clock has caught up with the page's target, the trip is over and the clock is on its anchor
      if (ANCHORING && trip !== null && Math.abs(goal - progress.current) * length <= ZONE) {
        trip = null;
        landed = performance.now();
        peak = 0;
      }
    };
    gsap.ticker.add(tick);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      gsap.ticker.remove(tick);
      lock = null;
      stRef.current = null;
      ctx.revert();
    };
  }, [length, reduced, smoothing]);

  const goTo = (p: number) => {
    const st = stRef.current;
    if (!st || reduced) {
      raw.current = p;
      progress.current = p;
      return;
    }
    const y = st.start + (st.end - st.start) * p;
    jumpUntil.current = gsap.ticker.time + JUMP_HOLD;
    hold = pass = trip = null;
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return { stageRef, progress, raw, goTo };
}

// Helpers for mapping progress onto chapters.
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
// 0 before a, rising to 1 at b
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
// rises over [a, b], holds, falls over [c, d]
export const band = (p: number, a: number, b: number, c: number, d: number) => smooth(range(p, a, b)) * (1 - smooth(range(p, c, d)));
