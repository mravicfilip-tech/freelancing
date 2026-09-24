/**
 * The left card's ambient loop ("One market").
 *
 * The entrance belongs to Built.motion.ts. This file runs after it has
 * landed, on the left card only: it adds one SVG overlay (the light on the
 * wire and the ring closing around the market) and removes it on teardown.
 *
 * THE BEAT, every 9.6s: one trader connecting to one market.
 *   0.30s  The dot pulses and "You" warms.
 *   0.55s  The light leaves along the line (from the smear or the line's
 *          start; see `rides` in start()).
 *   1.70s  It reaches the lit ring where the line ends; the coin answers.
 *          The light splits and runs both ways round the ring.
 *   2.65s  The ring closes and the note warms.
 *   2.70s  The closed ring expands through the mid and outer rings; each
 *          ring ripples when the wavefront reaches its radius (solved through
 *          the ease). Gone by 3.45s.
 *   4.45s  Back to the Figma frame, at rest until 9.6s.
 *
 * One scalar drives the light: `w.s` is distance along the route in design
 * px and `w.r` is the wavefront's radius. `paint()` is the only writer of the
 * overlay, so the head, the wrap and the wave cannot disagree. The legs are
 * eased so speeds match at the junction (`power1.in` then `sine.out`). The
 * wrap and the wave are the same two paths, so there is no handoff.
 *
 * Orientation is measured, not assumed. Below 700px Built.css re-lays the
 * card (Figma 526:2503) and the line runs diagonally at -124.31 deg, so the
 * direction is a unit vector read off the line's computed matrix and every
 * distance is a projection onto it. Do not replace it with a
 * width-vs-height test: the diagonal line's bounding rect is taller than
 * wide, which would pick the wrong point on the ring without any error.
 *
 * `.bt1__ring-disc` draws its circle off-centre in its box (see DISC_ORIGIN),
 * so every scale on it uses `transform-origin: 50% 47.936%`.
 *
 * No `filter`, glow or shadow is written here; only colour, position, scale
 * and opacity, and every value returns to the stylesheet's. Nothing reads the
 * pointer, and reduced motion runs none of it.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { tok } from '../../../lib/theme';

/** One full cycle, in GSAP time. Wall-clock is longer whenever lag smoothing
 *  is holding the sequence together through a blocked main thread. */
const PERIOD = 9.6;
/** Story, in GSAP time. The remainder of the period is the design at rest. */
const STORY_END = 4.45;
/** How long after the entrance lands before the first cycle. */
const SETTLE = 0.9;

/* The beat, in seconds from the top of a cycle. */
const T_SEND = 0.3;   /* the dot pulses and "You" warms */
const T_GO = 0.55;    /* the light leaves */
const LEG1 = 1.15;    /* along the line */
const T_HIT = T_GO + LEG1;
const LEG2 = 0.95;    /* round the ring */
const T_CLOSE = T_HIT + LEG2;
const T_WAVE = T_CLOSE + 0.05;
const WAVE = 0.75;    /* the closed ring expanding out through the other two */
const WAVE_EASE = 'power2.out';
const T_BACK = 3.3;   /* the smear fades back in, behind the wave */
const T_TIDY = 3.95;  /* and is handed back to the stylesheet */

/** The lit head and its soft tail, as fractions of the run: 30 and 20 design
 *  px of the 173.5px landscape line, so they scale to the shorter portrait
 *  line. Resolved against the measured path length in `start()`. */
const HEAD_F = 30 / 173.5;
const TRAIL_F = 20 / 173.5;

/** The lit stroke's dark fallback for --bt-lit (read in start()). In dark it
 *  is a shade above the ring's #e5331e; on paper the token supplies a stroke
 *  darker than the ring instead. */
const LIT = '#ff8f63';
/** Stroke weight of the wrap at the ring, and of the wave as it dissolves. */
const W_NEAR = 1.6;
const W_FAR = 1;

/** The dark fallback for --bt-warm, the colour "You" and the note warm to.
 *  The resting colour is read off the element. */
const WARM = 'rgb(222, 214, 208)';

/* The drawn circle's centre inside ring-disc.svg, as a fraction of its box:
   96.9/193.8 across, 92.9/193.8 down. */
const DISC_ORIGIN = `50% ${((92.9 / 193.8) * 100).toFixed(3)}%`;
/** Drawn radius of each ring, as a fraction of that ring's own box. */
const DISC_RF = 34.5 / 193.8;
const MID_RF = 49.375 / 100;
const OUTER_RF = 66.875 / 135;

const NS = 'http://www.w3.org/2000/svg';

/** Inverse of a GSAP ease: the progress p where ease(p) === v. */
function invEase(name: string, v: number): number {
  const e = gsap.parseEase(name);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (e(mid) < v) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function bt1Loop(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const card = root.querySelector<HTMLElement>('.bt-card--one');
  if (!card) return () => {};

  const q = (sel: string) => card.querySelector<HTMLElement>(sel);
  const bt1 = q('.bt1');
  const dot = q('.bt1__dot');
  const line = q('.bt1__line');
  const smear = q('.bt1__smear');
  const you = q('.bt1__you');
  const coin = q('.bt1__coin');
  const disc = q('.bt1__ring-disc');
  const mid = q('.bt1__ring-mid');
  const outer = q('.bt1__ring-outer');
  const note = q('.bt1__note');
  /* Without the line or the coin there is no beat; any other missing piece
     only drops its own accent. */
  if (!bt1 || !line || !coin) return () => {};

  let ctx: gsap.Context | undefined;
  let cycle: gsap.core.Timeline | undefined;
  let io: IntersectionObserver | undefined;
  let watcher: MutationObserver | undefined;
  let probe = 0;
  let ready = 0;
  let started = false;
  let stopped = false;
  let offscreen = false;
  let svg: SVGSVGElement | null = null;

  /* The entrance may leave an inline `transform-origin` on the dot, the line,
     the rings and the coin. This file overwrites it while scaling and then
     restores what it found. */
  const origins = new Map<HTMLElement, string>();
  const keepOrigin = (el: HTMLElement) => {
    if (!origins.has(el)) origins.set(el, el.style.transformOrigin);
  };
  const giveOrigin = (el: HTMLElement) => {
    const held = origins.get(el);
    if (held) el.style.transformOrigin = held;
    else el.style.removeProperty('transform-origin');
  };

  /* Every inline value this file writes, cleared by name. Never
     `clearProps: 'all'`: it empties the style attribute, where the right
     card's nodes keep `--x`/`--y` and the entrance leaves transform-origin. */
  const clearInline = () => {
    if (smear) gsap.set(smear, { clearProps: 'transform,opacity' });
    for (const el of [dot, coin, disc, mid, outer]) {
      if (!el) continue;
      gsap.set(el, { clearProps: 'transform,transformOrigin' });
      giveOrigin(el);
    }
    for (const el of [you, note]) if (el) gsap.set(el, { clearProps: 'color' });
  };

  /* ----------------------------------------------------------- the overlay */
  let group: SVGGElement | null = null;
  let wire: SVGPathElement | null = null;
  const arcs: SVGPathElement[] = [];

  /** Geometry, in design px of the `.bt1` box, measured off live rects
   *  because the card is laid out in container units. DW is read from
   *  `--bt1-w` (299 landscape, 334 portrait); DH follows the live aspect
   *  ratio, so the overlay is never stretched. */
  let DW = 299;
  let DH = 135;
  let CX = 231.5;
  let CY = 67.5;
  let DISC_R = 34.5;
  let MID_R = 49.375;
  let OUT_R = 66.875;
  let LEN = 173.5;   /* the wire path's own length */
  let LEAD = 57.5;   /* where along it the light starts */
  let TRAVEL = 116;  /* how far along it the light goes */
  let ARC0 = Math.PI * 34.5;
  let HEAD = 30;     /* resolved from HEAD_F once LEN is known */
  let TRAIL = 20;

  /** Which way the light runs. (UX, UY) is the line's own +x in the card's
   *  space, read off its computed matrix; (EX, EY) is the reverse, the unit
   *  vector from the ring's centre to where the light arrives. An
   *  untransformed line gives (1, 0); a `rotate(90deg)` one gives (0, 1). */
  let UX = 1;
  let UY = 0;
  let EX = -1;
  let EY = 0;

  const w = { s: 0, r: 34.5 };

  /** Half the ring, from the point the light arrives at to the point opposite.
   *  Two of these, sweeping opposite ways, are the wrap; the same two with a
   *  growing radius are the wave. */
  const arcD = (rad: number, up: boolean) =>
    `M${(CX + rad * EX).toFixed(3)} ${(CY + rad * EY).toFixed(3)}`
    + ` A${rad.toFixed(3)} ${rad.toFixed(3)} 0 0 ${up ? 1 : 0}`
    + ` ${(CX - rad * EX).toFixed(3)} ${(CY - rad * EY).toFixed(3)}`;

  /** The only thing that writes the overlay. */
  const paint = () => {
    const s = w.s;
    const rad = w.r;

    if (wire) {
      // The head occupies path length [l - HEAD, l], so it walks off the end
      // of the line by itself as the light moves onto the ring.
      const l = LEAD + s;
      wire.setAttribute('stroke-dashoffset', (HEAD - l).toFixed(2));
      wire.style.opacity = l - HEAD < LEN ? '1' : '0';
    }

    const al = Math.PI * rad;
    const drawn = Math.min(Math.max(s - TRAVEL, 0), ARC0) / ARC0;
    const weight = W_NEAR - (W_NEAR - W_FAR)
      * Math.min(Math.max((rad - DISC_R) / Math.max(OUT_R - DISC_R, 1), 0), 1);
    arcs.forEach((p, i) => {
      p.setAttribute('d', arcD(rad, i === 0));
      p.setAttribute('stroke-dasharray', `${al.toFixed(3)} ${al.toFixed(3)}`);
      p.setAttribute('stroke-dashoffset', (al * (1 - drawn)).toFixed(3));
      p.setAttribute('stroke-width', weight.toFixed(2));
    });
  };

  /** The card exactly as the stylesheet has it, with nothing of this file on it. */
  const rest = () => {
    w.s = 0;
    w.r = DISC_R;
    if (group) group.style.opacity = '0';
    paint();
  };

  const measure = () => {
    const B = bt1.getBoundingClientRect();
    DW = Number(getComputedStyle(bt1).getPropertyValue('--bt1-w')) || 299;
    DH = B.width > 0 ? (DW * B.height) / B.width : 135;
    const u = B.width / DW || 1;
    const X = (v: number) => (v - B.left) / u;
    const Y = (v: number) => (v - B.top) / u;
    const box = (el: Element) => el.getBoundingClientRect();

    const c = box(coin);
    CX = X(c.left + c.width / 2);
    CY = Y(c.top + c.height / 2);
    DISC_R = disc ? (box(disc).width / u) * DISC_RF : 34.5;
    MID_R = mid ? (box(mid).width / u) * MID_RF : 49.375;
    OUT_R = outer ? (box(outer).width / u) * OUTER_RF : 66.875;
    ARC0 = Math.PI * DISC_R;

    /** A rotated element's two ends. Its client rect is the rotated bounding
     *  box, which cannot say which corners are the ends. With a rotation
     *  about the centre, the rect's centre, `offsetWidth` (the untransformed
     *  length) and the matrix's first column give both ends at any angle. */
    const spine = (el: HTMLElement) => {
      const r = box(el);
      const t = getComputedStyle(el).transform;
      const m = t && t !== 'none' ? new DOMMatrixReadOnly(t) : new DOMMatrixReadOnly();
      const k = Math.hypot(m.a, m.b) || 1;
      const ux = m.a / k;
      const uy = m.b / k;
      const half = el.offsetWidth / 2 / u;
      return {
        cx: X(r.left + r.width / 2), cy: Y(r.top + r.height / 2),
        ux, uy, half, len: half * 2,
      };
    };

    // The line's own +x is also the direction of its `to right` gradient and
    // of the entrance's `scaleX`, so all three agree on the starting end.
    const ln = spine(line);
    UX = ln.ux;
    UY = ln.uy;
    EX = -UX;
    EY = -UY;

    // The route: from the line's starting end to the point on the lit ring
    // the line runs into. The line's axis and the ring's centre are a design
    // px or two apart, so the wire is the shallow ramp between them.
    const p0 = { x: ln.cx - ln.ux * ln.half, y: ln.cy - ln.uy * ln.half };
    const p1 = { x: CX + DISC_R * EX, y: CY + DISC_R * EY };

    /** Distance of a point from p0 along the line. */
    const along = (x: number, y: number) => (x - p0.x) * UX + (y - p0.y) * UY;

    // Candidate start: the smear's far end along the run (the smear turns
    // with the line, so this is a projection, not a right or bottom edge).
    const sm = smear ? spine(smear) : null;
    const s0 = sm
      ? Math.max(
        along(sm.cx + sm.ux * sm.half, sm.cy + sm.uy * sm.half),
        along(sm.cx - sm.ux * sm.half, sm.cy - sm.uy * sm.half),
      )
      : 57.5;

    return { p0, p1, s0, u, smear: sm, along };
  };

  /* ------------------------------------------------------------- the cycle */
  const start = () => {
    if (started || stopped) return;
    started = true;

    const g = measure();

    /* Read here rather than at module scope: `tok()` reads the document's
       computed style, so it must run after the theme is applied, and it
       re-reads when useSectionMotion rebuilds the band on a theme change. */
    const litTok = tok('--bt-lit', LIT);
    const warmTok = tok('--bt-warm', WARM);

    /* The overlay is sized in percentages of `.bt1` and its viewBox matches
       that box's aspect ratio, so it needs no resize handling. */
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${DW.toFixed(3)} ${DH.toFixed(3)}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('fill', 'none');
    svg.style.cssText = 'left:0;top:0;width:100%;height:100%;pointer-events:none';

    group = document.createElementNS(NS, 'g');
    group.style.opacity = '0';

    wire = document.createElementNS(NS, 'path');
    wire.setAttribute('d', `M${g.p0.x.toFixed(3)} ${g.p0.y.toFixed(3)} L${g.p1.x.toFixed(3)} ${g.p1.y.toFixed(3)}`);
    wire.setAttribute('stroke', litTok);
    wire.setAttribute('stroke-width', String(W_NEAR));
    wire.setAttribute('stroke-linecap', 'round');
    group.appendChild(wire);

    for (let i = 0; i < 2; i += 1) {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('stroke', litTok);
      p.setAttribute('stroke-linecap', 'round');
      arcs.push(p);
      group.appendChild(p);
    }

    svg.appendChild(group);
    bt1.appendChild(svg);

    /* Where the light leaves from. At 1600 the smear sits a third of the way
       along the run, so the light leaves the smear. In the portrait frame it
       sits past halfway, which would leave too short a journey, so the light
       leaves from the line's start (the dot) instead. One measured threshold,
       no breakpoint. */
    LEN = wire.getTotalLength() || Math.hypot(g.p1.x - g.p0.x, g.p1.y - g.p0.y);
    LEAD = g.s0 < LEN / 2 ? Math.max(g.s0, 0) : 0;
    TRAVEL = Math.max(LEN - LEAD, 1);
    HEAD = LEN * HEAD_F;
    TRAIL = LEN * TRAIL_F;
    wire.setAttribute('stroke-dasharray', `${HEAD.toFixed(3)} ${LEN.toFixed(3)}`);
    rest();

    /* Resting colours, read after the entrance has finished and cleared. */
    const css = (el: HTMLElement | null, prop: string) =>
      (el ? getComputedStyle(el).getPropertyValue(prop) : '') || '';
    const youRest = css(you, 'color');
    const noteRest = css(note, 'color');

    /* The smear either rides or flares, decided by the same `LEAD > 0` test.
     *
     *  Rides: when it is the source (landscape), it travels with the head as
     *  its soft tail and is absorbed at the ring.
     *  Flares: when the light starts behind it (portrait), riding would put
     *  it ahead of the head, so it stays put and takes a scale pulse along
     *  its own axis as the head passes.
     *
     *  The ride is two percentages because GSAP's translate is applied in
     *  the card's axes, outside the element's rotation; at 1600 `yPct` is 0. */
    const smearLen = g.smear ? g.smear.len : 0;
    const smearMid = g.smear ? g.along(g.smear.cx, g.smear.cy) : 0;
    const rideDist = LEN - TRAIL - smearMid;
    const rides = !!smear && smearLen > 0 && LEAD > 0 && rideDist > 0;
    const xPct = rides && smear ? (rideDist * UX * g.u * 100) / smear.offsetWidth : 0;
    const yPct = rides && smear ? (rideDist * UY * g.u * 100) / smear.offsetHeight : 0;
    /* The flare time: when the head reaches the smear's centre, solved back
       through the `power1.in` ease. */
    const flareAt = T_GO + LEG1 * invEase('power1.in',
      Math.min(Math.max((smearMid - LEAD) / Math.max(TRAVEL, 1), 0), 1));

    ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, paused: true });
      cycle = tl;

      /** A scale pulse that hands the transform back when it lands. */
      const ripple = (el: HTMLElement | null, at: number, to: number, origin: string,
        up = 0.28, down = 0.66) => {
        if (!el) return;
        keepOrigin(el);
        tl.to(el, { scale: to, transformOrigin: origin, duration: up, ease: 'sine.out' }, at)
          .to(el, { scale: 1, duration: down, ease: 'sine.inOut' }, at + up)
          .call(() => {
            gsap.set(el, { clearProps: 'transform,transformOrigin' });
            giveOrigin(el);
          }, undefined, at + up + down);
      };

      /** A colour lift and its return. Nothing moves. */
      const warm = (el: HTMLElement | null, at: number, from: string,
        up = 0.34, down = 1.1) => {
        if (!el || !from) return;
        tl.to(el, { color: warmTok, duration: up, ease: 'sine.out' }, at)
          .to(el, {
            color: from, duration: down, ease: 'sine.inOut',
            onComplete: () => gsap.set(el, { clearProps: 'color' }),
          }, at + up);
      };

      /* 1. "You" answers: the dot pulses and the word warms. */
      ripple(dot, T_SEND, 1.22, '50% 50%', 0.26, 0.62);
      warm(you, T_SEND, youRest, 0.26, 0.8);

      /* 2. The light leaves, along the line and round the ring. Both legs are
         `fromTo` with `immediateRender: false`: a delayed `fromTo` writes its
         start value at build time, which would park the light on the ring. */
      tl.fromTo(w, { s: 0 }, {
        s: TRAVEL, duration: LEG1, ease: 'power1.in', immediateRender: false, onUpdate: paint,
      }, T_GO)
        .fromTo(w, { s: TRAVEL }, {
          s: TRAVEL + ARC0, duration: LEG2, ease: 'sine.out', immediateRender: false, onUpdate: paint,
        }, T_HIT)
        .fromTo(group, { opacity: 0 }, {
          opacity: 1, duration: 0.22, ease: 'sine.out', immediateRender: false,
        }, T_GO);

      /* 3. The design's own smear (see `rides`). It is absorbed at the ring,
         reset while invisible so it fades back in place, and its stylesheet
         `transform` is handed back at T_TIDY. */
      if (smear) {
        if (rides) {
          tl.fromTo(smear, { xPercent: 0, yPercent: 0 }, {
            xPercent: xPct, yPercent: yPct,
            duration: LEG1, ease: 'power1.in', immediateRender: false,
          }, T_GO);
        } else {
          /* `scaleX` composes inside the element's rotation, so the pulse
             stretches the bar along the line it lies on. */
          tl.to(smear, { scaleX: 1.22, duration: 0.24, ease: 'sine.out' }, flareAt)
            .to(smear, { scaleX: 1, duration: 0.5, ease: 'sine.inOut' }, flareAt + 0.24);
        }
        tl.to(smear, { opacity: 0, duration: 0.32, ease: 'sine.in' }, T_HIT - 0.26)
          .set(smear, { xPercent: 0, yPercent: 0, scaleX: 1 }, T_HIT + 0.4)
          .to(smear, { opacity: 1, duration: 0.55, ease: 'sine.out' }, T_BACK)
          .set(smear, { clearProps: 'transform,opacity' }, T_TIDY);
      }

      /* 4. The coin answers as the light lands, the note as the ring
         closes. */
      ripple(coin, T_HIT, 1.18, '50% 50%', 0.24, 0.62);
      warm(note, T_CLOSE, noteRest);

      /* 5. The closed ring expands. Each ring ripples at the frame the
         wavefront reaches its radius, solved through the ease. The disc is
         where the wave starts, so it goes with the closure. */
      tl.fromTo(w, { r: DISC_R }, {
        r: OUT_R, duration: WAVE, ease: WAVE_EASE, immediateRender: false, onUpdate: paint,
      }, T_WAVE)
        .to(group, { opacity: 0, duration: 0.5, ease: 'sine.in' }, T_WAVE + WAVE - 0.45);

      const when = (radius: number) => {
        const v = (radius - DISC_R) / Math.max(OUT_R - DISC_R, 1);
        if (v <= 0) return T_WAVE;
        if (v >= 1) return T_WAVE + WAVE;
        return T_WAVE + WAVE * invEase(WAVE_EASE, v);
      };
      ripple(disc, T_CLOSE - 0.05, 1.08, DISC_ORIGIN);
      ripple(mid, when(MID_R), 1.1, '50% 50%');
      ripple(outer, when(OUT_R), 1.08, '50% 50%');

      /* On repeat, GSAP renders every passed tween at progress 0, which
         writes identity transforms and resting colours inline. `onRepeat`
         runs before that render, so the clear runs slightly into the cycle,
         before anything has moved. */
      tl.call(clearInline, undefined, 0.04);

      /* Off screen the loop pauses here, at rest, rather than wherever the
         scroll left it; a beat in progress is allowed to finish. */
      tl.call(() => {
        rest();
        clearInline();
        if (offscreen) tl.pause();
      }, undefined, STORY_END);
      tl.to({}, { duration: 0.01 }, PERIOD - 0.01);

      tl.play();
    }, card);

    io = new IntersectionObserver(([entry]) => {
      offscreen = !entry.isIntersecting;
      if (!offscreen) cycle?.play();
      else if (cycle && !inBeat(cycle.time())) cycle.pause();
    }, { rootMargin: '140px' });
    io.observe(card);
  };

  /** Is the playhead inside the beat rather than in the rest band? */
  const inBeat = (t: number) => t > T_SEND - 0.1 && t < STORY_END;

  /* ----------------------------------------------------------- the start
     `useSectionMotion` calls this as its `idle` from the entrance's
     `onComplete`, after `done()`, so `data-motion-done` is already set and
     the first branch fires. Called earlier, the `motion:done` event is still
     ahead; failing both, it polls until nothing in the section is
     animating. */
  const heard = () => open();
  const open = () => {
    if (stopped || ready) return;
    window.clearInterval(probe);
    probe = 0;
    watcher?.disconnect();
    root.removeEventListener('motion:done', heard);
    ready = window.setTimeout(start, SETTLE * 1000);
  };

  let quiet = 0;
  let waited = 0;
  const busy = () =>
    gsap.globalTimeline.getChildren(true, true, true).some((a) => {
      if (!a.isActive()) return false;
      const targets = (a as gsap.core.Tween).targets?.() ?? [];
      return targets.some((t) => t instanceof Node && (t === root || root.contains(t)));
    });
  const watch = () => {
    probe = window.setInterval(() => {
      waited += 1;
      quiet = busy() ? 0 : quiet + 1;
      if (quiet >= 3 || waited >= 40) { window.clearInterval(probe); probe = 0; open(); }
    }, 250);
  };

  root.addEventListener('motion:done', heard);
  if (root.dataset.motionDone) open();
  else if (root.dataset.motion !== 'pending') watch();
  else {
    watcher = new MutationObserver(() => {
      if (root.dataset.motion !== 'pending') { watcher?.disconnect(); watch(); }
    });
    watcher.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  }

  return () => {
    stopped = true;
    window.clearTimeout(ready);
    window.clearInterval(probe);
    root.removeEventListener('motion:done', heard);
    watcher?.disconnect();
    io?.disconnect();
    cycle?.kill();
    // Reverts every value this loop tweened, wherever the playhead was.
    ctx?.revert();

    /* Then each target by name. Never `clearProps: 'all'` (see
       clearInline). */
    for (const el of [smear, dot, you, coin, disc, mid, outer, note]) {
      if (el) gsap.killTweensOf(el);
    }
    clearInline();

    // Everything this file created, removed.
    svg?.remove();
    svg = null;
    group = null;
    wire = null;
    arcs.length = 0;
  };
}
