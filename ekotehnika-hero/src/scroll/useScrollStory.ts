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

// Feel 8 travels at 600, a third of the 1800 it had, Filip 3 November, "reduce the scroll speed between anchors by like 300%". 9 and 10
// keep that pace.
const FEEL_CAPS = [0, 1500, 2500, 4000, 900, 1300, 1800, 1300, 600, 600, 600];
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
//
// Filip 3 November, "can we somehow optimize the anchors to be better". Feels 8, 9 and 10 are anchors, and in all three the arrow keys,
// Page Up, Page Down and Space go from anchor to anchor too, where they used to scroll the page to anywhere between them. 8 travels at a
// steady speed from its first frame. 9 Glide eases every trip in and out over the time 8 takes, so a trip starts and lands softly, the
// fastest frame about 1.6 times 8's speed. 10 Magnet lets the wheel move the story freely at 8's speed, and when the hand stops between
// two anchors the story carries on to the next one in the same direction, so it always comes to rest on one.
const ANCHORING = FEEL >= 8;
const GLIDING = FEEL === 9;
const MAGNET = FEEL === 10;
const DWELL = 1200;
const RISE_AFTER = 300;
// On a trip a second gesture the same way carries the trip on past its anchor to the next one, so the story does not stop there (Filip
// 3 November, "fix weak spot", a swipe on a four second trip did nothing). A gesture is new after QUEUE_GAP ms with no wheel event, a
// second flick of a mouse, or on a rising delta, a trackpad swipe starting over. The trip may run no more than one anchor past the
// next one ahead of the clock, so a burst of swipes plays the anchors one after the other and never throws the story to its end.
const QUEUE_GAP = 200;
// the shortest glide, in seconds, so a short hop does not twitch
const GLIDE_MIN = 0.9;

// What the lock looks at, the pinned story that is on the page now, and the story pixels it stops at.
let lock: { st: ScrollTrigger; progress: { current: number }; length: number; jumpUntil: { current: number }; stops: number[] } | null = null;

// The state of the stops. hold is the stop the clock is waiting at, wheel events are dropped while it is set. pass is the stop a gesture
// began on, which that gesture carries the clock past. lastWheel is when the last wheel event came, dropped ones included.
let hold: number | null = null;
let pass: number | null = null;
let lastWheel = -Infinity;

// The state of the anchors. trip is the story pixel the clock is on its way to and dir its direction. landed is when the clock last
// reached its anchor and gestureAt when the gesture that set the trip began. lastAbs is the size of the last wheel delta and peak the
// largest since landing.
let trip: number | null = null;
let dir = 0;
let landed = -Infinity;
let gestureAt = -Infinity;
let lastAbs = 0;
let peak = 0;
// feel 9, the trip as a curve from p0 at speed v0, story pixels a second, to p1 at rest, over dur ticker seconds from t0. A trip
// carried on past its anchor starts its new curve at the speed the old one had, so it never slows at the anchor it passes. feel 10,
// the direction the wheel last went, kept until a settle starts from it.
type Glide = { p0: number; v0: number; p1: number; t0: number; dur: number };
let glide: Glide | null = null;
let magnetDir = 0;

// Where a glide is and how fast it moves at ticker time, a cubic from p0 and v0 to p1 at rest.
function glideAt(g: Glide, time: number) {
  const t = Math.min(1, Math.max(0, (time - g.t0) / g.dur));
  const t2 = t * t;
  const t3 = t2 * t;
  const pos = (2 * t3 - 3 * t2 + 1) * g.p0 + (t3 - 2 * t2 + t) * g.dur * g.v0 + (3 * t2 - 2 * t3) * g.p1;
  const vel = ((6 * t2 - 6 * t) * g.p0 + (3 * t2 - 4 * t + 1) * g.dur * g.v0 + (6 * t - 6 * t2) * g.p1) / g.dur;
  return { t, pos, vel };
}

// The anchors, the top of the story, its stops and its end, in story pixels.
const anchorsOf = () => [0, ...lock!.stops, lock!.length];
// The next anchor past pos in direction d.
function anchorAfter(pos: number, d: number) {
  const a = anchorsOf();
  return d > 0 ? a.find((s) => s > pos + ZONE) : [...a].reverse().find((s) => s < pos - ZONE);
}
// The nearest anchor in direction d, the one the clock has just left included, where a trip turned back goes.
function anchorBack(pos: number, d: number) {
  const a = anchorsOf();
  return d > 0 ? a.find((s) => s >= pos - ZONE) : [...a].reverse().find((s) => s <= pos + ZONE);
}
// The anchor a trip in direction d may be carried on to, one past the next anchor ahead of the clock at pos, or none.
function anchorOn(pos: number, d: number) {
  if (trip === null) return undefined;
  const ahead = anchorAfter(pos, d);
  if (ahead === undefined || Math.abs(trip - ahead) > ZONE) return undefined;
  return anchorAfter(trip, d);
}

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
    hold = pass = trip = glide = null;
    return true;
  }
  const { st, progress, length, stops } = lock;
  const at = st.start + progress.current * length;
  const target = lenis.targetScroll;
  let next = target + d;
  if (d > 0 && at < st.end - 0.5) next = Math.min(next, Math.max(at + LEAD, target));
  else if (d < 0 && at > st.start + 0.5) next = Math.max(next, Math.min(at - LEAD, target));
  if (MAGNET && stops.length) {
    // feel 10, the lock of feel 5. A settle on its way is called off and the wheel takes the clock from where it is.
    lastWheel = performance.now();
    magnetDir = Math.sign(d);
    const base = trip !== null ? at : target;
    trip = null;
    let n = base + d;
    if (d > 0 && at < st.end - 0.5) n = Math.min(n, Math.max(at + LEAD, base));
    else if (d < 0 && at > st.start + 0.5) n = Math.max(n, Math.min(at - LEAD, base));
    if (n === target) return drop(event);
    data.deltaY = n - target;
    return true;
  }
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
  const { st } = lock!;
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
    // on the way, a fresh gesture the other way turns back to the nearest anchor that way
    if (Math.sign(d) !== dir && (gap >= GAP || rising)) {
      const back = anchorBack(pos, d);
      return back === undefined ? drop(event) : go(data, back, d, target, st.start, pos, false);
    }
    // a fresh gesture the same way carries the trip on to the next anchor, anything else is dropped
    if (Math.sign(d) === dir && (gap >= QUEUE_GAP || (rising && now - gestureAt > RISE_AFTER))) {
      const on = anchorOn(pos, dir);
      if (on !== undefined) return go(data, on, d, target, st.start, pos, true);
    }
    return drop(event);
  }
  const fresh = gap >= GAP || (rising && now - gestureAt > RISE_AFTER) || (steady && now - landed > DWELL);
  if (!fresh) return drop(event);
  // at the end of the story a fresh gesture down leaves it for the page below
  if (d > 0 && at >= st.end - 0.5) return true;
  const next = anchorAfter(pos, d);
  if (next === undefined) return true;
  return go(data, next, d, target, st.start, pos, false);
}

// Sets the trip to the anchor at story pixel to by moving the page's scroll target there. The clock follows the target at the feel's
// top speed, or along the glide in feel 9, see the tick below. clock is where the clock is now, in story pixels, and carry keeps the
// glide's speed, for a trip carried on past its anchor.
function go(data: VirtualScrollData, to: number, d: number, target: number, start: number, clock: number, carry: boolean) {
  data.deltaY = start + to - target;
  if (data.deltaY === 0) return drop(data.event);
  begin(to, d, clock, carry);
  return true;
}

function begin(to: number, d: number, clock: number, carry: boolean) {
  const now = gsap.ticker.time;
  const v0 = carry && glide ? glideAt(glide, now).vel : 0;
  trip = to;
  dir = Math.sign(d);
  gestureAt = performance.now();
  glide = GLIDING ? { p0: clock, v0, p1: to, t0: now, dur: Math.max(GLIDE_MIN, Math.abs(to - clock) / FEEL_CAPS[FEEL]) } : null;
}

// The keys of feels 8 to 10, the arrows, Page Up, Page Down and Space, Shift and Space going up. Inside the story they take the clock to
// the next anchor, a key the same way on a trip carries it on to the next one, a key the other way turns it back. A key held down
// repeats only at rest. Outside the story, or leaving it at either end, they scroll the page as always. A key typed into a field, Space
// on a link or a button, and a key with a modifier are left alone.
function anchorKey(e: KeyboardEvent) {
  if (!lock || !lenis || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !lock.stops.length) return;
  const el = e.target as HTMLElement | null;
  const tag = el?.tagName ?? '';
  if (el?.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const space = e.key === ' ';
  if (space && (tag === 'A' || tag === 'BUTTON')) return;
  const d =
    e.key === 'ArrowDown' || e.key === 'PageDown' || (space && !e.shiftKey) ? 1 : e.key === 'ArrowUp' || e.key === 'PageUp' || (space && e.shiftKey) ? -1 : 0;
  if (!d) return;
  const { st, progress, length } = lock;
  const target = lenis.targetScroll;
  if (target > st.end + 0.5 || target < st.start - 0.5) return;
  const pos = progress.current * length;
  if ((d > 0 && pos >= length - 0.5) || (d < 0 && pos <= 0.5)) return;
  e.preventDefault();
  if (trip !== null) {
    const to = d !== dir ? anchorBack(pos, d) : e.repeat ? undefined : anchorOn(pos, d);
    if (to !== undefined) {
      lenis.scrollTo(st.start + to);
      begin(to, d, pos, d === dir);
    }
    return;
  }
  const next = anchorAfter(pos, d);
  if (next === undefined) return;
  magnetDir = 0;
  lenis.scrollTo(st.start + next);
  begin(next, d, pos, false);
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
    hold = pass = trip = glide = null;
    if (ANCHORING) window.addEventListener('keydown', anchorKey);
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
      // feel 9, a trip runs on its curve, and the follow waits until it has landed
      if (GLIDING && glide) {
        const { t, pos } = glideAt(glide, time);
        progress.current = pos / length;
        if (t >= 1) {
          glide = trip = null;
          landed = performance.now();
          peak = 0;
        }
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
      // feels 8 and 10, the clock has caught up with the page's target, the trip is over and the clock is on its anchor
      const caught = Math.abs(goal - progress.current) * length <= ZONE;
      if (ANCHORING && trip !== null && caught) {
        trip = null;
        landed = performance.now();
        peak = 0;
      }
      // feel 10, the hand stopped GAP ms ago and the clock has caught up between two anchors, so it carries on to the next one
      if (MAGNET && magnetDir !== 0 && trip === null && caught && lenis && st && lock && performance.now() - lastWheel > GAP) {
        const pos = progress.current * length;
        const anchors = [0, ...lock.stops, length];
        const next = anchors.some((s) => Math.abs(s - pos) <= ZONE)
          ? undefined
          : magnetDir > 0
            ? anchors.find((s) => s > pos)
            : [...anchors].reverse().find((s) => s < pos);
        magnetDir = 0;
        if (next !== undefined && pos > 0 && pos < length) {
          trip = next;
          lenis.scrollTo(st.start + next);
        }
      }
    };
    gsap.ticker.add(tick);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('keydown', anchorKey);
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
    hold = pass = trip = glide = null;
    magnetDir = 0;
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
