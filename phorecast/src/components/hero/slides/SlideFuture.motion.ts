/**
 * Slide 4 — "The Future of Trading": the orbit/network illustration's own motion.
 *
 * The slide's argument is that many markets route through one place. The motion
 * makes that argument once, then rests:
 *
 *   LOAD-IN  the three rings expand out of the hub, the dashed track draws
 *            itself around the circuit from the diamond clockwise (both halves
 *            starting at their own seam), the five market badges arrive in the
 *            order the circuit reaches them, and the BTC/USD pill slides in
 *            from the left to plug into the diamond.
 *
 *   LOOP     one deterministic beat, 8.0s. The diamond fires, the rings ripple
 *            outward from it, a single order travels the whole circuit
 *            clockwise — leaning each badge toward the hub and lighting it as
 *            it is reached, ticking SPORT on the way up and ELECTIONS on the
 *            way back — reaches the mark's feed dot, and settles back into the
 *            diamond. Then 2.7s of rest.
 *
 * CONSTRAINT: every part of the illustration is an `<img src="*.svg">`, so
 * there is no `<path>` in the document to put a `stroke-dashoffset` on. The
 * track is therefore *drawn* with a clip-path wipe rather than a dash offset,
 * and the travelling order is a real DOM element positioned frame by frame
 * along a copy of `dashed-path.svg`'s geometry, sampled from an off-screen
 * `<path>` this module builds and owns. The geometry constants below are read
 * straight off that asset and off SlideFuture.css; they are not new design.
 *
 * Two triggers only: the slide becoming active, and the loop. Nothing listens
 * to the pointer. `prefers-reduced-motion` gets the settled design and no
 * timelines at all.
 */
import { gsap } from 'gsap';
import { REDUCED, all, one } from '../../../lib/motion';

/* ── geometry, in the stage's design units (see SlideFuture.css) ──────────── */

/** `Vector 75` out of assets/hero/slide4/dashed-path.svg, verbatim. */
const TRACK_D =
  'M0 248H101.807C119.911 248 135.758 235.84 140.444 218.353L190.873 30.1472C195.559 12.6599 211.406 0.5 229.511 0.5H642.431C653.04 0.5 663.214 4.71427 670.716 12.2157L719.284 60.7843C726.786 68.2857 731 78.4599 731 89.0685V248';

const STAGE_W = 1264;
const TRACK_X = 373.5;          // .sl4__track left
const TRACK_SX = 731 / 731.5;   // painted width / viewBox width (preserveAspectRatio: none)
const TRACK_TOP = 170;          // .sl4__track--top top
/** .sl4__track--bottom is the same export at top 430 with scaleY(-1), so local y maps to 430 + 248.5 - y. */
const TRACK_BOTTOM_FLIP = 678.5;

/** Centre of the 370 x 370 mark slot — the hub every badge leans toward. */
const HUB = { x: 919, y: 427 };

const SAMPLE = 2;               // viewBox units between samples
const BADGE_LEAN = 9;           // design units a badge travels toward the hub when it fires

type Pt = { x: number; y: number };

interface Circuit {
  pts: Pt[];
  cum: number[];
  total: number;
}

/** Sample the track's own path twice — once as the top half, once mirrored as the bottom — into one closed circuit. */
function buildCircuit(host: HTMLElement): { circuit: Circuit; dispose: () => void } {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;pointer-events:none';
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', TRACK_D);
  svg.appendChild(path);
  host.appendChild(svg);

  const pts: Pt[] = [];
  const len = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0;

  if (len > 0) {
    // Top half: the path runs from the left seam (0, 248) clockwise to the right seam (731, 248).
    for (let d = 0; d <= len; d += SAMPLE) {
      const q = path.getPointAtLength(Math.min(d, len));
      pts.push({ x: TRACK_X + q.x * TRACK_SX, y: TRACK_TOP + q.y });
    }
    // Bottom half: the same export, mirrored, walked backwards so the travel stays clockwise.
    for (let d = len; d >= 0; d -= SAMPLE) {
      const q = path.getPointAtLength(Math.max(d, 0));
      pts.push({ x: TRACK_X + q.x * TRACK_SX, y: TRACK_BOTTOM_FLIP - q.y });
    }
    pts.push({ ...pts[0] }); // close it: the seam sits under the diamond
  }

  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }

  return {
    circuit: { pts, cum, total: cum[cum.length - 1] ?? 0 },
    dispose: () => svg.remove(),
  };
}

function pointAt(c: Circuit, s: number): Pt {
  const { pts, cum } = c;
  if (pts.length < 2) return { x: 0, y: 0 };
  const t = Math.min(Math.max(s, 0), c.total);
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= t) lo = mid; else hi = mid;
  }
  const span = cum[hi] - cum[lo] || 1;
  const f = (t - cum[lo]) / span;
  return { x: pts[lo].x + (pts[hi].x - pts[lo].x) * f, y: pts[lo].y + (pts[hi].y - pts[lo].y) * f };
}

/** Arclength of the circuit point closest to `p`. */
function nearestS(c: Circuit, p: Pt): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < c.pts.length; i++) {
    const d = (c.pts[i].x - p.x) ** 2 + (c.pts[i].y - p.y) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return c.cum[best];
}

/* ── the module ───────────────────────────────────────────────────────────── */

export function slideFutureMotion(root: HTMLElement): () => void {
  const stage = one<HTMLElement>(root, '.sl4__stage');
  if (!stage) return () => {};

  const rings = ['.sl4__ring--sm', '.sl4__ring--md', '.sl4__ring--lg']
    .map((s) => one<HTMLElement>(root, s))
    .filter((el): el is HTMLElement => !!el);
  const trackTop = one<HTMLElement>(root, '.sl4__track--top');
  const trackBottom = one<HTMLElement>(root, '.sl4__track--bottom');
  const badges = all<HTMLElement>(root, '.sl4__badge');
  const coin = one<HTMLElement>(root, '.sl4__coin');
  const glyph = one<HTMLElement>(root, '.sl4__coin-glyph');
  const pill = one<HTMLElement>(root, '.sl4__pill');
  const stub = one<HTMLElement>(root, '.sl4__stub');
  const diamond = one<HTMLElement>(root, '.sl4__diamond');
  const tags = all<HTMLElement>(root, '.sl4__tag');
  const tagDots = tags
    .map((t) => one<HTMLElement>(t, 'img'))
    .filter((el): el is HTMLElement => !!el);
  const nodes = all<HTMLElement>(root, '.sl4__node');
  const feed = nodes[nodes.length - 1]; // the orange dot at 731,419 — the mark's input
  const pillGroup = [coin, glyph, pill].filter((el): el is HTMLElement => !!el);

  // Everything the illustration is made of is already visible in CSS; reduced
  // motion simply leaves it exactly there and starts nothing.
  if (REDUCED) return () => {};

  /* elements this module owns, and removes again on teardown */
  const pulse = document.createElement('span');
  pulse.className = 'sl4__pulse';
  pulse.setAttribute('aria-hidden', 'true');
  stage.appendChild(pulse);

  const glows = badges.map((b) => {
    const g = document.createElement('i');
    g.className = 'sl4__badge-glow';
    b.insertBefore(g, b.firstChild);
    return g;
  });

  const { circuit, dispose: disposeCircuit } = buildCircuit(stage);

  /* one design unit in CSS pixels; `--u` is derived the same way (stage is 1264 wide) */
  let u = 1;
  const measureUnit = () => {
    const w = stage.getBoundingClientRect().width;
    if (w > 0) u = w / STAGE_W;
  };
  measureUnit();

  /** Centre of `el` in stage design units. Scale-invariant, so an entrance
   *  transform on an ancestor cannot poison it. */
  const centre = (el: Element): Pt => {
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const k = s.width / STAGE_W || 1;
    return { x: (r.left + r.width / 2 - s.left) / k, y: (r.top + r.height / 2 - s.top) / k };
  };

  const badgeInfo = badges.map((el, i) => {
    const c = centre(el);
    const dx = HUB.x - c.x;
    const dy = HUB.y - c.y;
    const m = Math.hypot(dx, dy) || 1;
    return { el, glow: glows[i], s: nearestS(circuit, c), lean: { x: (dx / m) * BADGE_LEAN, y: (dy / m) * BADGE_LEAN } };
  });

  const tagInfo = tagDots.map((dot, i) => ({ dot, tag: tags[i], s: nearestS(circuit, centre(dot)) }));

  /* ── spawned accent timelines, tracked so teardown can kill them ────────── */
  const spawned = new Set<gsap.core.Timeline>();
  const spawn = (build: (tl: gsap.core.Timeline) => void) => {
    const tl = gsap.timeline({ onComplete: () => spawned.delete(tl) });
    build(tl);
    spawned.add(tl);
  };

  const fireBadge = (b: (typeof badgeInfo)[number]) => spawn((tl) => {
    tl.fromTo(b.el, { x: 0, y: 0, scale: 1 }, { x: b.lean.x * u, y: b.lean.y * u, scale: 1.16, duration: 0.26, ease: 'power2.out' }, 0)
      .fromTo(b.glow, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 0)
      .to(b.el, { x: 0, y: 0, scale: 1, duration: 0.78, ease: 'power2.out' }, 0.26)
      .to(b.glow, { opacity: 0, duration: 0.72, ease: 'power2.out' }, 0.3);
  });

  const fireTag = (t: (typeof tagInfo)[number]) => spawn((tl) => {
    tl.fromTo(t.dot, { scale: 1 }, { scale: 2.1, duration: 0.24, ease: 'power2.out' }, 0)
      .to(t.dot, { scale: 1, duration: 0.8, ease: 'power2.out' }, 0.24);
  });

  /** Everything that fires as the order passes it, in the order it is passed. */
  const stops = [
    ...badgeInfo.map((b) => ({ s: b.s, fire: () => fireBadge(b) })),
    ...tagInfo.map((t) => ({ s: t.s, fire: () => fireTag(t) })),
  ].sort((a, b) => a.s - b.s);

  /** Hand every design element back to CSS, exactly as it is drawn in Figma. */
  const moved = [...rings, ...badges, ...pillGroup, ...tags, ...tagDots, ...nodes, stub, diamond, trackTop, trackBottom]
    .filter((el): el is HTMLElement => !!el);
  const settleProps = () => { gsap.set(moved, { clearProps: 'transform,opacity,clipPath' }); };

  // Before anything is built. An earlier instance killed part-way through its
  // load-in -- StrictMode's mount/cleanup/mount, or a hot reload -- can leave an
  // inline `scale(0.72)` behind, and a `from` tween built against that reads it
  // as the element's natural value and strands it there forever (the same trap
  // lib/motion.ts documents on `pop`). Every entrance below states both ends
  // explicitly as well, so neither half of that can happen.
  settleProps();

  /* ── timelines ──────────────────────────────────────────────────────────── */

  const travel = { s: 0 };
  let next = 0;

  const placePulse = () => {
    const p = pointAt(circuit, travel.s);
    gsap.set(pulse, { x: p.x * u, y: p.y * u });
  };

  /** Every repeat starts the beat from scratch, so a stop can never be skipped. */
  const rearm = () => { next = 0; travel.s = 0; placePulse(); };

  const loop = gsap.timeline({ paused: true, repeat: -1, onRepeat: rearm });

  loop.call(rearm, undefined, 0);

  // 1. The diamond fires — the order is placed at the BTC/USD desk.
  if (diamond) {
    loop.fromTo(diamond, { scale: 1, rotation: 45 }, { scale: 1.5, rotation: 45, duration: 0.26, ease: 'power2.out', immediateRender: false }, 0)
        .to(diamond, { scale: 1, rotation: 45, duration: 0.5, ease: 'power2.out' }, 0.26);
  }
  if (coin) {
    loop.fromTo(coin, { scale: 1 }, { scale: 1.12, duration: 0.26, ease: 'power2.out', immediateRender: false }, 0.06)
        .to(coin, { scale: 1, duration: 0.5, ease: 'power2.out' }, 0.32);
  }

  // 2. The rings ripple outward from it — smallest first.
  rings.forEach((ring, i) => {
    const at = 0.1 + i * 0.14;
    loop.fromTo(ring, { scale: 1 }, { scale: 1.055, duration: 0.5, ease: 'sine.inOut', immediateRender: false }, at)
        .to(ring, { scale: 1, duration: 0.6, ease: 'sine.inOut' }, at + 0.5);
  });

  // 3. The order travels the whole circuit, clockwise, lighting what it reaches.
  loop.fromTo(pulse, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out', immediateRender: false }, 0.34)
      .fromTo(
        travel,
        { s: 0 },
        {
          s: circuit.total,
          duration: 4.0,
          ease: 'power1.inOut',
          immediateRender: false,
          onUpdate: () => {
            placePulse();
            while (next < stops.length && travel.s >= stops[next].s) stops[next++].fire();
          },
        },
        0.4,
      )
      .to(pulse, { opacity: 0, duration: 0.28, ease: 'power2.in' }, 4.32);

  // 4. It reaches the mark's feed, then settles back into the diamond.
  if (feed) {
    loop.fromTo(feed, { scale: 1 }, { scale: 2.6, duration: 0.22, ease: 'power2.out', immediateRender: false }, 4.45)
        .to(feed, { scale: 1, duration: 0.55, ease: 'power2.out' }, 4.67);
  }
  if (diamond) {
    loop.fromTo(diamond, { scale: 1, rotation: 45 }, { scale: 1.35, rotation: 45, duration: 0.22, ease: 'power2.out', immediateRender: false }, 4.55)
        .to(diamond, { scale: 1, rotation: 45, duration: 0.5, ease: 'power2.out' }, 4.77);
  }

  // 5. Rest, so the beat reads as one event rather than a conveyor belt. The
  //    props are handed back to CSS first, so a still taken during the rest is
  //    byte-identical to the design with no script running at all -- no inline
  //    `matrix(1,0,0,1,0,0)` left behind to re-rasterise a hairline stroke.
  loop.call(() => settleProps(), undefined, 5.7);
  loop.to({}, { duration: 0.01 }, 8.0);

  const loadIn = gsap.timeline({ paused: true, onComplete: () => { settleProps(); loop.restart(true); } });
  const B = 0.3; // the shared hero entrance is still fading the visual up until ~1.6s

  // Every tween below is `immediateRender: false`, and the start states are
  // parked by these `set`s at position 0 instead. A delayed `fromTo` renders
  // its FROM value the moment the timeline is BUILT, not when the playhead
  // reaches it -- so with the default the illustration would be parked half
  // assembled from mount until slide 4 is first shown, which on this carousel
  // can be twenty seconds of a slide nobody is looking at yet, and any lag in
  // the load-in holds it there on screen. Parking at frame 0 means the
  // illustration is untouched until the load-in actually runs, and each part
  // is hidden for exactly its own tween.
  if (rings.length) loadIn.set(rings, { scale: 0.88, opacity: 0, transformOrigin: '50% 50%' }, 0);
  if (pillGroup.length) loadIn.set(pillGroup, { x: -22 * u, opacity: 0 }, 0);
  if (badges.length) loadIn.set(badges, { scale: 0.72, opacity: 0, transformOrigin: '50% 50%' }, 0);
  if (tags.length) loadIn.set(tags, { y: 12 * u, opacity: 0 }, 0);
  if (nodes.length) loadIn.set(nodes, { scale: 0.4, opacity: 0, transformOrigin: '50% 50%' }, 0);
  if (stub) loadIn.set(stub, { scaleX: 0, transformOrigin: '0% 50%' }, 0);
  if (diamond) loadIn.set(diamond, { scale: 0, rotation: 45 }, 0);
  if (trackTop) loadIn.set(trackTop, { clipPath: 'inset(0% 100% 0% 0%)' }, 0);
  if (trackBottom) loadIn.set(trackBottom, { clipPath: 'inset(0% 0% 0% 100%)' }, 0);

  if (rings.length) {
    loadIn.fromTo(rings,
      { scale: 0.88, opacity: 0, transformOrigin: '50% 50%' },
      { scale: 1, opacity: 1, duration: 1.0, stagger: 0.14, ease: 'expo.out', immediateRender: false }, B);
  }
  // The track is an <img>, so it cannot be drawn with a dash offset. A clip
  // wipe from each half's own seam reads the same way: the circuit traces
  // itself clockwise, top half left-to-right, bottom half right-to-left.
  if (trackTop) loadIn.fromTo(trackTop, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'power2.inOut', immediateRender: false }, B + 0.1);
  if (trackBottom) loadIn.fromTo(trackBottom, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.05, ease: 'power2.inOut', immediateRender: false }, B + 0.35);

  if (pillGroup.length) {
    loadIn.fromTo(pillGroup,
      { x: -22 * u, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.85, stagger: 0.07, ease: 'expo.out', immediateRender: false }, B + 0.2);
  }
  // Badges arrive in the order the circuit reaches them, not in document order.
  const arrivalOrder = [...badgeInfo].sort((a, b) => a.s - b.s).map((b) => b.el);
  if (arrivalOrder.length) {
    loadIn.fromTo(arrivalOrder,
      { scale: 0.72, opacity: 0, transformOrigin: '50% 50%' },
      { scale: 1, opacity: 1, duration: 0.7, stagger: 0.13, ease: 'expo.out', immediateRender: false }, B + 0.45);
  }
  if (tags.length) loadIn.fromTo(tags, { y: 12 * u, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, stagger: 0.12, ease: 'expo.out', immediateRender: false }, B + 0.55);
  if (stub) loadIn.fromTo(stub, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.45, ease: 'expo.out', immediateRender: false }, B + 0.62);
  if (diamond) loadIn.fromTo(diamond, { scale: 0, rotation: 45 }, { scale: 1, rotation: 45, duration: 0.6, ease: 'expo.out', immediateRender: false }, B + 0.8);
  if (nodes.length) loadIn.fromTo(nodes, { scale: 0.4, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'expo.out', immediateRender: false }, B + 0.7);

  /* ── when it runs: the slide is active AND the hero is on screen ────────── */

  const slide = root.closest<HTMLElement>('.hero__slide');
  let isActive = slide ? slide.classList.contains('is-active') : true;
  let onScreen = true;
  let running = false;

  const halt = () => {
    // No `running` guard: if this is reached before anything played, settling is
    // a no-op, and if it is reached mid-load-in it is the only thing that puts
    // a half-assembled illustration back to the design.
    running = false;
    window.clearTimeout(guard);
    loadIn.pause();
    loop.pause();
    spawned.forEach((tl) => tl.kill());
    spawned.clear();
    gsap.set(pulse, { opacity: 0 });
    settleProps();
  };

  // If the load-in stalls -- a blocked main thread while the WebGL mark
  // compiles, a tab throttled in the background -- settle it rather than leave
  // the illustration half assembled on screen. A fixed deadline cannot tell
  // "stuck" from "slow", because lag smoothing makes an honest sequence take
  // longer in wall time than its own duration, so sample past the deadline and
  // only force the end once progress has actually stopped moving. Same shape as
  // the guard in lib/motion.ts.
  let guard = 0;
  const watchLoadIn = () => {
    let seen = -1;
    const watch = () => {
      const now = loadIn.progress();
      if (now >= 1 || !running) return;
      if (now === seen) { loadIn.progress(1); return; }
      seen = now;
      guard = window.setTimeout(watch, 500);
    };
    guard = window.setTimeout(watch, (loadIn.duration() + 2) * 1000);
  };

  const start = () => {
    if (running) return;
    running = true;
    measureUnit();
    loop.pause(0);
    loadIn.restart(true);
    window.clearTimeout(guard);
    watchLoadIn();
  };

  const sync = () => { if (isActive && onScreen) start(); else halt(); };

  let classObserver: MutationObserver | undefined;
  if (slide) {
    classObserver = new MutationObserver(() => {
      const now = slide.classList.contains('is-active');
      if (now === isActive) return;
      isActive = now;
      sync();
    });
    classObserver.observe(slide, { attributes: true, attributeFilter: ['class'] });
  }

  const io = new IntersectionObserver(([entry]) => {
    const now = entry.isIntersecting;
    if (now === onScreen) return;
    onScreen = now;
    sync();
  }, { threshold: 0 });
  io.observe(root);

  const onResize = () => { measureUnit(); if (running) placePulse(); };
  window.addEventListener('resize', onResize, { passive: true });

  sync();

  return () => {
    window.clearTimeout(guard);
    window.removeEventListener('resize', onResize);
    classObserver?.disconnect();
    io.disconnect();
    spawned.forEach((tl) => tl.kill());
    spawned.clear();
    loadIn.kill();
    loop.kill();
    settleProps();
    disposeCircuit();
    pulse.remove();
    glows.forEach((g) => g.remove());
  };
}
