/**
 * "New to Trading? / One market to start." — the left card's ambient loop.
 *
 * The section's scroll-gated entrance belongs to `Built.motion.ts`. This file
 * owns what happens *after* it has landed on the left card only: it reads the
 * markup the component ships, adds one SVG overlay of its own — the light on
 * the wire and the ring that closes around the market — and takes it away
 * again on teardown.
 *
 * THE STORY — one person, one market, every 9.6s
 * ----------------------------------------------
 * The card's argument is a single trader connecting to a single market, so the
 * beat is one connection being made, end to end, and then nothing.
 *
 *   0.30s  "You" answers. The dot takes one pulse and the word under it warms.
 *   0.55s  The light leaves. It is one scalar — distance along a route that
 *          runs from the smear already lit on the line, out along the line, and
 *          then round the market — and everything in the card answers to it.
 *          A short head is painted ON the line with `stroke-dashoffset`, and
 *          the design's own warm smear rides with it as its soft tail.
 *   1.70s  It reaches the lit ring at exactly the point the line ends on. The
 *          smear is absorbed; the coin answers.
 *   1.70s  The wrap. The same light splits and runs both ways round the ring —
 *          two half arcs filling from the point it arrived at — and meets on
 *          the far side at 2.65s. The market is connected.
 *   2.65s  "One market to start." warms as the ring closes.
 *   2.70s  The closed ring lets go: its radius grows from the lit ring's 34.5
 *          out through the mid ring's 49.4 to the outer ring's 66.9, and each
 *          of the three rings takes its own short ripple at the frame the
 *          wavefront's radius is its radius — solved back through the ease, not
 *          staggered by eye, and measured off the live boxes rather than
 *          assumed. The wave thins as it spreads and is gone by 3.45s.
 *   4.45s  Everything is the Figma frame again, and stays there to 9.6s.
 *
 * So 4.45s of story and 5.15s of rest — 54% of the cycle is the design, still.
 *
 * ONE SCALAR, TWO PATHS, NO SECOND CLOCK
 * --------------------------------------
 * `w.s` is distance travelled along the route in design px; `w.r` is the
 * wavefront's radius. `paint()` is the only thing that writes the overlay, so
 * the head on the line, the arc filling round the ring and the wave leaving it
 * cannot disagree about where the light is. The two legs are eased so the
 * speeds match at the junction — `power1.in` leaves the line at 2x its average,
 * `sine.out` enters the wrap at pi/2 x its own — and the light therefore does
 * not stall at the moment it arrives.
 *
 * The wrap and the wave are the SAME two paths. Their `d` is rewritten from
 * `w.r` every frame, so the ring that closes is the ring that then expands;
 * there is no handoff between a closing element and a rippling one to line up.
 *
 * TWO ORIENTATIONS, ONE BEAT
 * --------------------------
 * Below 700px Built.css re-lays this card into a portrait frame: "You" sits
 * above its market rather than beside it, the line stands up, and the light
 * therefore arrives at the ring's NORTH point rather than its west one. Three
 * numbers used to assume the landscape frame and each has been re-derived
 * rather than special-cased:
 *
 *   the overlay's viewBox   was the literal `0 0 299 135`. It is now `--bt1-w`
 *                           from the stylesheet and a height taken from the
 *                           live aspect ratio, so the coordinate system this
 *                           file works in is whatever box it was handed.
 *   the route               was "the line's left edge, along x, to CX - R". It
 *                           is now the line's starting end, along whichever
 *                           axis the line's own rect says it runs, to the point
 *                           (CX + R*EX, CY + R*EY) where it meets the ring.
 *   the head and its trail  were 30 and 20 design px, which is a third of the
 *                           portrait line. They are fractions of the measured
 *                           run, equal to the old numbers at 1600.
 *
 * `DOWN` is a measurement, not a breakpoint: the stylesheet turns the line a
 * quarter turn and a rotated element's client rect is the rotated one, so the
 * question "which way does this line run" is answered by the line.
 *
 * THE TRAP IN `.bt1__ring-disc`
 * -----------------------------
 * Its SVG draws the circle at (96.9, 92.9) inside a 193.8 square viewBox —
 * centred across, four units high, because the export reserves room for a drop
 * shadow — and `Built.css` offsets the box asymmetrically (left -29.4, top
 * -25.4) so the drawn circle lands concentric with the coin. Its box centre is
 * therefore NOT its visual centre, and a scale about `50% 50%` swings the lit
 * ring downward off the coin. Every scale on it here uses
 * `transform-origin: 50% 47.936%` — 92.9/193.8 — which holds the drawn circle
 * still while it grows. Measured in a browser over 1795 frames of the running
 * loop: the disc's drawn centre sits at (351.5078, 126.5079) in the card's own
 * box and never leaves it, 0.008px from the coin's (351.5, 126.5) at rest and
 * 0.0001px of drift through every ripple.
 *
 * NOTHING HERE GLOWS
 * ------------------
 * No shadow, no bloom, no halo, no `filter` is written anywhere in this file.
 * The vocabulary is colour, position, scale and opacity. The one blurred thing
 * that moves — `.bt1__smear` — is the design's own element, travelling along
 * the line it already sits on; nothing soft is added to the card.
 *
 * Nothing floats, bobs, drifts or breathes, nothing reads the pointer, every
 * value the loop touches returns to the one the design ships, and reduced
 * motion runs none of it.
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
const T_GO = 0.55;    /* the light leaves the smear */
const LEG1 = 1.15;    /* along the line */
const T_HIT = T_GO + LEG1;
const LEG2 = 0.95;    /* round the ring */
const T_CLOSE = T_HIT + LEG2;
const T_WAVE = T_CLOSE + 0.05;
const WAVE = 0.75;    /* the closed ring expanding out through the other two */
const WAVE_EASE = 'power2.out';
const T_BACK = 3.3;   /* the line re-lights at the dot, behind the wave */
const T_TIDY = 3.95;  /* and is handed back to the stylesheet */

/** The lit head, and its soft tail, AS FRACTIONS OF THE RUN THEY RIDE.
 *
 *  They were 30 and 20 design px, which is right for exactly one line: the
 *  173.5px one in the landscape frame. The portrait frame's line is 96 long, so
 *  a 30px head would be a third of it and a 20px trail would put the smear's
 *  centre outside the line it is supposed to be lying on. 0.17291 and 0.11527
 *  are 30/173.5 and 20/173.5 — the same head and the same trail at 1600, to
 *  three decimals, and a head and a trail that mean the same thing anywhere
 *  else. Both are resolved against the measured path length in `start()`. */
const HEAD_F = 30 / 173.5;
const TRAIL_F = 20 / 173.5;

/** The lit stroke, and the DARK FALLBACK for --bt-lit.
 *
 *  Flat brand warm, a shade above the ring's own #e5331e -- light on a line.
 *  That is the one thing a light theme cannot copy: nothing on paper reads as
 *  lit by being paler than what it sits on. So the real value is read from
 *  --bt-lit inside start() (see LIT_TOK there), where dark keeps this exact
 *  hex and light supplies a stroke DARKER than the ring instead. This constant
 *  stays as the fallback: a missing custom property then yields today's dark
 *  value, which is the safest failure mode for the regression gate. */
const LIT = '#ff8f63';
/** Stroke weight of the wrap at the ring, and of the wave as it dissolves. */
const W_NEAR = 1.6;
const W_FAR = 1;

/** What the two grey lines warm to, and the DARK FALLBACK for --bt-warm.
 *
 *  Same flip: in dark the lift is towards white, 6.2:1 -> 11.7:1 against the
 *  card. On paper the same lift has to go the other way, towards ink, and
 *  Built.css supplies it. Rest is read off the element either way, so only the
 *  lit end needed a token. */
const WARM = 'rgb(222, 214, 208)';

/* The drawn circle's centre inside `ring-disc.svg`, as a fraction of its own
   box — the whole point of the trap above. 96.9/193.8 across, 92.9/193.8 down. */
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
  /* The overlay needs the line to sit on and the coin to turn about; without
     either there is no beat to run. Everything else costs its own accent. */
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

  /* The entrance leaves an explicit `transform-origin` in the style attribute
     of the dot, the line, the three rings and the coin. This file overwrites it
     while it scales something and puts back exactly what it found, rather than
     clearing it and quietly deciding the entrance's business for it. */
  const origins = new Map<HTMLElement, string>();
  const keepOrigin = (el: HTMLElement) => {
    if (!origins.has(el)) origins.set(el, el.style.transformOrigin);
  };
  const giveOrigin = (el: HTMLElement) => {
    const held = origins.get(el);
    if (held) el.style.transformOrigin = held;
    else el.style.removeProperty('transform-origin');
  };

  /* Every inline value this file writes, taken off again BY NAME. A blanket
     `clearProps: 'all'` is not safe in this band: it empties the style
     attribute, and that attribute is where the right card's nodes keep their
     `--x`/`--y` and where this card's entrance leaves its transform-origin. */
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

  /** Geometry, in the design px of the `.bt1` box. Measured off live rects,
   *  because the card is laid out in container units and a pixel read is the
   *  only honest source of truth at any breakpoint.
   *
   *  DW is that box's own design width, read from `--bt1-w`: 299 in the
   *  landscape frame, where `.bt1` is a sub-box of the card, and 320 in the
   *  portrait one, where it IS the card. DH is derived from the live aspect
   *  ratio rather than stated, so the overlay cannot be stretched by a frame
   *  that is no longer 299 x 135. */
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

  /** WHICH WAY THE LIGHT RUNS, and it is the only thing about this beat that
   *  the layout decides. `DOWN` is true when the line stands up — the portrait
   *  frame, where "You" is above its market rather than beside it. Everything
   *  below is written once and reads these two numbers: (EX, EY) is the unit
   *  vector from the ring's centre to the point the light ARRIVES at, which is
   *  the ring's west point when the line runs across and its north point when
   *  the line runs down. */
  let DOWN = false;
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
      // The head occupies path length [l - HEAD, l], so it walks off the end of
      // the line by itself as the light moves onto the ring — no second rule
      // for when to switch it off.
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

    // The line's OWN box says which way it runs. In the portrait frame the
    // stylesheet turns it a quarter turn, and a rotated element's client rect
    // is the rotated one, so this is a measurement rather than a breakpoint
    // test -- and it is taken every time the loop is built.
    const l = box(line);
    DOWN = l.height > l.width;
    EX = DOWN ? 0 : -1;
    EY = DOWN ? -1 : 0;

    // The route: from the line's starting end, along the line, to the point on
    // the lit ring the line runs into. The line's own cross-axis and the ring's
    // centre are about one design px apart, so the wire is drawn as the shallow
    // ramp between them -- it sits on the line for its whole length and still
    // meets the ring exactly.
    const p0 = DOWN
      ? { x: X(l.left + l.width / 2), y: Y(l.top) }
      : { x: X(l.left), y: Y(l.top + l.height / 2) };
    const p1 = { x: CX + DISC_R * EX, y: CY + DISC_R * EY };

    // Where the light starts: the far edge of the smear the design already has
    // lit on the line, so it emerges from it rather than beside it. "Far" is
    // the smear's right edge when the light runs across and its bottom edge
    // when it runs down.
    const sb = smear ? box(smear) : null;
    const s0 = sb
      ? (DOWN ? Y(sb.bottom) : X(sb.right))
      : (DOWN ? p0.y : p0.x) + 57.5;

    return { p0, p1, s0, u, smearBox: sb };
  };

  /* ------------------------------------------------------------- the cycle */
  const start = () => {
    if (started || stopped) return;
    started = true;

    const g = measure();

    /* The two colours this file writes, read here rather than at module scope.
       `tok()` is getComputedStyle(documentElement), so it must run after the
       theme is on the document and inside the build -- which is also what
       makes it re-read when useSectionMotion rebuilds the band on a theme
       change. Both are direction flips; see the notes on LIT and WARM. */
    const litTok = tok('--bt-lit', LIT);
    const warmTok = tok('--bt-warm', WARM);

    /* One overlay, built here rather than shipped in the markup because it is
       the beat and not the design. It is sized in percentages of `.bt1`, whose
       aspect ratio the viewBox matches exactly, so it needs no resize handling
       and no `will-change`. */
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

    // The route's own length, and where along it the light starts and stops.
    // Solved on the axis the line runs down rather than on x, so the portrait
    // frame needs no second arithmetic -- only the axis to project onto.
    const a0 = DOWN ? g.p0.y : g.p0.x;
    const a1 = DOWN ? g.p1.y : g.p1.x;
    LEN = wire.getTotalLength() || Math.abs(a1 - a0);
    const span = Math.max(Math.abs(a1 - a0), 1);
    LEAD = (LEN * Math.abs(g.s0 - a0)) / span;
    TRAVEL = Math.max(LEN - LEAD, 1);
    HEAD = LEN * HEAD_F;
    TRAIL = LEN * TRAIL_F;
    wire.setAttribute('stroke-dasharray', `${HEAD.toFixed(3)} ${LEN.toFixed(3)}`);
    rest();

    /* Resting values are read now, with the entrance finished and its own
       clears already run, so every lift has something true to return to. */
    const css = (el: HTMLElement | null, prop: string) =>
      (el ? getComputedStyle(el).getPropertyValue(prop) : '') || '';
    const youRest = css(you, 'color');
    const noteRest = css(note, 'color');

    /* The smear rides `TRAIL` design px behind the head's tip. */
    // On the axis the light runs down: the smear's own length along that axis,
    // its resting centre, and how far it has to travel written as a percentage
    // of its own box. A percentage of the element's own box is the only
    // distance here that survives a resize untouched, because the element
    // scales with the card exactly as the distance does.
    const smearLen = g.smearBox
      ? (DOWN ? g.smearBox.height : g.smearBox.width) / g.u
      : 0;
    const rideTo = (DOWN ? g.p1.y : g.p1.x) - TRAIL;
    const ride = smearLen > 0 ? ((rideTo - (g.s0 - smearLen / 2)) / smearLen) * 100 : 0;

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

      /* 1 — "You" answers: the dot takes one pulse and the word warms. */
      ripple(dot, T_SEND, 1.22, '50% 50%', 0.26, 0.62);
      warm(you, T_SEND, youRest, 0.26, 0.8);

      /* 2 — the light leaves, along the line and then round the ring. Both legs
         are `fromTo` with `immediateRender: false`: a delayed `fromTo` writes
         its start value when the timeline is BUILT, not when the playhead
         arrives, so without the flag the wrap would slam the light back to the
         ring at t=0 and hold it there through the whole outbound leg. */
      tl.fromTo(w, { s: 0 }, {
        s: TRAVEL, duration: LEG1, ease: 'power1.in', immediateRender: false, onUpdate: paint,
      }, T_GO)
        .fromTo(w, { s: TRAVEL }, {
          s: TRAVEL + ARC0, duration: LEG2, ease: 'sine.out', immediateRender: false, onUpdate: paint,
        }, T_HIT)
        .fromTo(group, { opacity: 0 }, {
          opacity: 1, duration: 0.22, ease: 'sine.out', immediateRender: false,
        }, T_GO);

      /* 3 — the design's own smear is the light's soft tail, and is absorbed at
         the ring. Its transform is reset while it is invisible, so the return
         is a fade at home rather than a slide back. */
      if (smear && ride > 0) {
        tl.fromTo(smear, DOWN ? { yPercent: 0 } : { xPercent: 0 }, {
          [DOWN ? 'yPercent' : 'xPercent']: ride,
          duration: LEG1, ease: 'power1.in', immediateRender: false,
        }, T_GO)
          .to(smear, { opacity: 0, duration: 0.32, ease: 'sine.in' }, T_HIT - 0.26)
          .set(smear, DOWN ? { yPercent: 0 } : { xPercent: 0 }, T_HIT + 0.4)
          .to(smear, { opacity: 1, duration: 0.55, ease: 'sine.out' }, T_BACK)
          .set(smear, { clearProps: 'transform,opacity' }, T_TIDY);
      }

      /* 4 — the market answers as the light lands, and the sentence beside it
         as the ring closes. */
      ripple(coin, T_HIT, 1.18, '50% 50%', 0.24, 0.62);
      warm(note, T_CLOSE, noteRest);

      /* 5 — the closed ring lets go. `w.r` is the wavefront's radius; each ring
         fires at the frame that radius is its own, solved back through the ease
         rather than staggered by eye. The disc is where the wave starts, so it
         goes with the closure itself. */
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

      /* A repeating timeline rewinds by rendering every tween it has passed at
         progress 0, which WRITES their start values inline: an identity
         `transform: translate(0px, 0px)` on the rings and the resting colour on
         the two grey lines. Identical to the design to look at, and still this
         file's inline style sitting on an element the stylesheet owns -- and it
         would sit there until each pulse's own clear came round again, up to
         four seconds later. `onRepeat` is too early to help, because GSAP does
         that render after it; a call two frames in is the first point at which
         they can be taken off, and nothing here has moved by then.

         The rest band itself is measured clean either way: 600 frames of it
         hold exactly one value per element and no inline style at all. */
      tl.call(clearInline, undefined, 0.04);

      /* The rest of the cycle is rest. Off screen the loop stops here rather
         than wherever the scroll happened to leave it, so the card is never
         parked with a half-drawn ring round the coin for as long as it takes
         someone to come back. A beat is four seconds; it is allowed to finish. */
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

  /* ---------------------------------------------------------------- the gate
     `useSectionMotion` passes this as its `idle` option and calls it from the
     entrance's `onComplete`, one line after the section's `done()` — so
     `data-motion-done` is already set and the first branch fires at once.
     Called any earlier (a direct call, a harness) the `motion:done` event is
     still ahead of us and is the best signal there is; under both sits the
     question that is true either way: is anything still animating in here? */
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
    // Reverts every transform, colour and opacity this loop tweened, whatever
    // the playhead was in the middle of.
    ctx?.revert();

    /* Then each target again, by name. A blanket `clearProps: 'all'` is not
       safe in this band: it empties the style attribute, and that attribute is
       where the right card's nodes keep their `--x`/`--y` — and where this
       card's entrance leaves its `transform-origin`. */
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
