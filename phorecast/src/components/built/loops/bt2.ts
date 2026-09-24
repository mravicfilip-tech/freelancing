/**
 * The right card's ambient loop ("More markets").
 *
 * Five market nodes (BTC / USD, TSLA, DAX 40, EUR / USD, XAU / USD) wired to
 * one self-custody padlock. The beat says one thing: many markets, one
 * settlement you hold.
 *
 * LANDSCAPE, every 8.5s
 *   0.82s  BTC, the farthest market, leans along its wire and at 1.00s lets
 *          a bead of value go.
 *   1.43 to 2.12s  The other four follow. Every bead travels at one speed and
 *          departures are `arrival - distance / speed`, so the wave's shape
 *          is the real geometry.
 *   2.75s  All five arrive at the padlock together.
 *   2.63s  The lock leans into the delivery as the beads touch its rim and
 *          seats; SELF-CUSTODY goes brand red.
 *   3.45 to 4.3s  The circuit cools outward from the lock, nearest first.
 *   Then rest until 8.5s.
 *
 * PORTRAIT (below 700px; Figma 526:2656)
 * The markets sit round a ring with the padlock at its centre, all the same
 * distance from it, so "farthest leaves first" means nothing. The beat is a
 * circuit instead:
 *   0.82s  A head starts at SELF-CUSTODY and runs clockwise round the ring at
 *          a constant rate. Each market's cue is
 *          `LEAD + (angle travelled / 360) * ORBIT`, measured off live rects.
 *   +0.18s Each touched market leans inward and drops a bead to the padlock;
 *          the arrivals keep the order of the touches.
 *   3.42s  The head closes the circuit and fades.
 *   3.53s  The padlock seats without leaning (the mean of five directions
 *          round a circle has no meaning), with its inner circle;
 *          SELF-CUSTODY goes brand red. Rest from 5.2s.
 *
 * Asked, not assumed: the frame (`--fw`/`--fh`), the ring (`--bt2-ring-*`,
 * declared beside its mask in Built.css), every station's angle, and the
 * leans and bead size (scaled by the frame, the bead with a floor).
 *
 * Beads. The wires are masked spans, so there is no stroke to put light on.
 * This module creates five beads behind the nodes and flies them along the
 * real lines, positioned in percent of the card and moved in
 * `xPercent`/`yPercent` of a `var(--c)` box, so the beat survives a resize.
 * The portrait head hangs at the ring's radius off a zero-sized rotator at
 * the ring's centre; one `rotation` tween carries it round, tangent to the
 * arc.
 *
 * Nodes move in pixels (`x`/`y` scaled by the design unit) on top of an
 * explicit centring; see CENTRED.
 *
 * Do not:
 * 1. Write `filter`, glow or shadow. A bead is a flat capsule.
 * 2. Use `clearProps: 'all'`. Each `.bt2__node` carries both placements in
 *    inline custom properties; emptying the style attribute collapses the
 *    constellation onto the centre. Only `transform` and `color` are cleared,
 *    by name.
 * 3. React to the pointer, move between beats, or run under reduced motion.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { tok } from '../../../lib/theme';

/** Fallback design frame, used only if `--fw`/`--fh` are missing on the
 *  card (Built.css). */
const DW_FALLBACK = 640;
const DH_FALLBACK = 254;

/** One cycle, in GSAP time. Wall-clock is longer whenever lag smoothing bites. */
const PERIOD = 8.5;
/** Stillness at the top of a cycle, before the farthest market moves. */
const LEAD = 0.82;
/** How long the longest wire takes; every other journey is that speed. */
const RUN = 1.75;

/** The send: design px a node leans along its own wire (scaled by the
 *  frame), and the pulse's two halves. */
const LUNGE = 12;
const UP = 0.18;
const BACK = 0.62;
/** Design px the padlock leans into the delivery, scaled the same way and
 *  aimed along the wires. */
const LEAN_IN = 6;

/** The bead, in design px of the 640-wide frame, and its floor in the
 *  frame it lands in: scaled alone it would be about 1.5 device pixels tall
 *  on a phone, too small to see travelling. */
const BEAD_W = 14;
const BEAD_H = 2.6;
const BEAD_W_MIN = 9;
const BEAD_H_MIN = 1.9;

/* The portrait circuit only. ORBIT is one lap of the ring and sets every
   touch time. HEAD_W is 16 units of arc, a quarter of the closest station
   gap (40.2 deg at r 89), so the head never touches two markets at once; a
   straight capsule departs from the arc by only 0.36 units. HEAD_H matches
   the bead's floor. DROP is the fall from any market to the padlock (all
   radii are equal). */
const ORBIT = 2.6;
const HEAD_W = 16;
const HEAD_H = 1.9;
const DROP = 0.5;

/* The three colours this file writes, as dark fallbacks; each is read from
   its token in the build, where `tok()` sees the current theme.

   BEAD_BG is --accent-lift: a chromatic accent, no flip needed.
   SEALED is --bt-seal: SELF-CUSTODY's lit colour. On paper --accent would
   give too small a step from --ink, so Built.css supplies a lighter red.
   LIT is --ink: a market label lifts from --ink-2 to --ink. A literal
   #fffbf8 would vanish on paper. */
/* The node centring, stated explicitly to work around GSAP. `.bt2__node` is
   centred by a stylesheet `translate(-50%, -50%)`. GSAP recovers that from
   the computed pixel matrix and only recognises it as -50% when rounding
   against the integer `offsetWidth` agrees; at some widths (e.g. a 44.84px
   node at 390) it does not, GSAP stores the offset as `x`, and the lean
   tweens the node off its centre by half its width. Stating xPercent and
   yPercent on every tween makes `x`/`y` purely the lean at every width.
   `clearProps: 'transform'` still hands the element back afterwards. */
const CENTRED = { xPercent: -50, yPercent: -50 } as const;

const BEAD_BG = '#e9513f';
const LIT = '#fffbf8';
const SEALED = '#e5331e';

/** The moment every bead is at the padlock's centre. */
const ARRIVE = LEAD + UP + RUN;
/** The lock answers as the beads reach its rim, a frame or two earlier. */
const SEAL = ARRIVE - 0.12;
/** The cooling wave, and the end of the beat. */
const COOL = SEAL + 0.82;
const STORY = COOL + 0.85;

/** End of the portrait head's lap. The portrait beat closes around 5.2s
 *  against landscape's 4.3s; both fit in PERIOD. */
const ORBIT_END = LEAD + ORBIT;

export function bt2Loop(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const card = root.querySelector<HTMLElement>('.bt-card--two');
  if (!card) return () => {};

  const stage = card.querySelector<HTMLElement>('.bt2');
  const lock = card.querySelector<HTMLElement>('.bt2__node--lock');
  const lockLabel = lock?.querySelector<HTMLElement>('.bt2__label');
  const nodes = Array.from(card.querySelectorAll<HTMLElement>('.bt2__node:not(.bt2__node--lock)'));
  /* `.bt2__fan`: four wires in landscape, the faint inner circle in
     portrait. Only the circle answers, so its tween is portrait-gated. */
  const inner = card.querySelector<HTMLElement>('.bt2__fan');
  if (!stage || !lock || !lockLabel || nodes.length === 0) return () => {};

  /* ------------------------------------------------------------- geometry
     Measured off live rects (the card is laid out in container units) and
     divided back into design units of the current frame. */
  const cb = card.getBoundingClientRect();
  const cs = getComputedStyle(card);
  const DW = Number(cs.getPropertyValue('--fw')) || DW_FALLBACK;
  const DH = Number(cs.getPropertyValue('--fh')) || DH_FALLBACK;
  const u = cb.width / DW;
  if (!(u > 0)) return () => {};

  /* Which beat: asked of the frame's shape rather than a media query, so it
     cannot drift from Built.css's breakpoint. */
  const portrait = DH > DW;

  /* Stated distances are for the 640-wide frame, so proportions are scaled
     here. Measured distances are already in the frame's units. */
  const S = DW / 640;
  const lunge = LUNGE * S;
  const leanIn = LEAN_IN * S;
  const beadW = Math.max(BEAD_W * S, BEAD_W_MIN);
  const beadH = Math.max(BEAD_H * S, BEAD_H_MIN);

  const centre = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - cb.left + r.width / 2) / u,
      y: (r.top - cb.top + r.height / 2) / u,
    };
  };

  const hub = centre(lock);
  const markets = nodes.map((el) => {
    const c = centre(el);
    const dx = hub.x - c.x;
    const dy = hub.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    /* Portrait hides the market names (Built.css). Asked of the stylesheet,
       so a hidden label is never lit. */
    const named = el.querySelector<HTMLElement>('.bt2__label');
    const label = named && getComputedStyle(named).display !== 'none' ? named : null;
    return {
      el,
      label,
      // Cools back to the stylesheet's colour, read rather than assumed.
      cool: label ? getComputedStyle(label).color : '',
      c,
      dx,
      dy,
      d,
      ux: dx / d,
      uy: dy / d,
    };
  });
  const lockCool = getComputedStyle(lockLabel).color;

  /* The mean direction the delivery arrives from, as a unit vector, for the
     lock's lean. */
  const aim = (() => {
    const sx = markets.reduce((a, m) => a + m.ux, 0) / markets.length;
    const sy = markets.reduce((a, m) => a + m.uy, 0) / markets.length;
    const len = Math.hypot(sx, sy) || 1;
    return { x: sx / len, y: sy / len };
  })();

  /* Read in the build, so a theme switch rebuild picks up the new values. */
  const beadBg = tok('--accent-lift', BEAD_BG);
  const litInk = tok('--ink', LIT);
  const sealed = tok('--bt-seal', SEALED);

  /* One speed for every wire, set by the longest. */
  const longest = markets.reduce((m, n) => Math.max(m, n.d), 0);
  const speed = longest / RUN;

  /* ------------------------------------------------------------ the circuit
     The ring is a mask, so its centre and radius are read from the custom
     properties declared beside it in Built.css (fallbacks are the frame's
     values). Every angle, including SELF-CUSTODY's, is measured, so the order
     round the ring is never hardcoded. */
  const ringX = DW / 2 + (Number(cs.getPropertyValue('--bt2-ring-x')) || 0);
  const ringY = DH / 2 + (Number(cs.getPropertyValue('--bt2-ring-y')) || 0);
  const ringR = Number(cs.getPropertyValue('--bt2-ring-r')) || Math.min(DW, DH) / 2;
  /* Degrees clockwise from twelve, which is where the head sits at rotation 0. */
  const bearing = (x: number, y: number) => ((Math.atan2(x - ringX, ringY - y) * 180) / Math.PI + 360) % 360;
  const startA = bearing(
    (lockLabel.getBoundingClientRect().left - cb.left + lockLabel.getBoundingClientRect().width / 2) / u,
    (lockLabel.getBoundingClientRect().top - cb.top + lockLabel.getBoundingClientRect().height / 2) / u,
  );
  /* The lap fraction at which the head reaches each market. */
  const turns = markets.map((m) => ((bearing(m.c.x, m.c.y) - startA + 360) % 360) / 360);
  const lastTurn = turns.reduce((a, b) => Math.max(a, b), 0);

  /* ---------------------------------------------------------------- beads
     Removed on teardown. Sized in `var(--c)` and centred by negative
     margins, so the GSAP transform is purely the animation. */
  const beads: HTMLElement[] = [];
  const firstNode = nodes[0];
  for (const m of markets) {
    const bead = document.createElement('span');
    bead.className = 'bt2__bead';
    bead.setAttribute('aria-hidden', 'true');
    bead.style.cssText = [
      'position:absolute',
      `left:${(m.c.x / DW) * 100}%`,
      `top:${(m.c.y / DH) * 100}%`,
      `width:calc(${beadW} * var(--c))`,
      `height:calc(${beadH} * var(--c))`,
      `margin:calc(${-beadH / 2} * var(--c)) 0 0 calc(${-beadW / 2} * var(--c))`,
      `border-radius:calc(${beadH / 2} * var(--c))`,
      `background:${beadBg}`,
      'opacity:0',
      'pointer-events:none',
    ].join(';');
    stage.insertBefore(bead, firstNode);
    beads.push(bead);
  }

  /* ------------------------------------------------------------- the head
     A zero-sized rotator at the ring's centre (offset a unit from both the
     card's and the padlock's), with the head at the ring's radius at twelve
     o'clock. All in `var(--c)`, so a resize needs no rebuild. Inserted
     behind the marks, like the beads. */
  let orbit: HTMLElement | undefined;
  let head: HTMLElement | undefined;
  if (portrait) {
    orbit = document.createElement('span');
    orbit.className = 'bt2__orbit';
    orbit.setAttribute('aria-hidden', 'true');
    orbit.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'width:0',
      'height:0',
      `margin:calc(${ringY - DH / 2} * var(--c)) 0 0 calc(${ringX - DW / 2} * var(--c))`,
      'pointer-events:none',
    ].join(';');
    head = document.createElement('span');
    head.className = 'bt2__head';
    head.style.cssText = [
      'position:absolute',
      `left:calc(${-HEAD_W / 2} * var(--c))`,
      `top:calc(${-ringR - HEAD_H / 2} * var(--c))`,
      `width:calc(${HEAD_W} * var(--c))`,
      `height:calc(${HEAD_H} * var(--c))`,
      `border-radius:calc(${HEAD_H / 2} * var(--c))`,
      `background:${beadBg}`,
      'opacity:0',
      'pointer-events:none',
    ].join(';');
    orbit.appendChild(head);
    stage.insertBefore(orbit, firstNode);
  }

  /* The beat's length differs by frame: landscape from wire lengths, portrait
     from one lap plus the last fall. Both fit inside PERIOD. */
  const lastLand = LEAD + lastTurn * ORBIT + UP + DROP;
  const sealAt = portrait ? lastLand - 0.12 : SEAL;
  const coolAt = sealAt + 0.82;
  const storyEnd = portrait ? coolAt + 0.85 : STORY;

  let offscreen = false;
  let loop: gsap.core.Timeline | undefined;
  const inBeat = (t: number) => t > LEAD - 0.1 && t < storyEnd + 0.1;

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ paused: true, repeat: -1 });
    loop = tl;

    /* The resting frame, restated rather than trusted. */
    beads.forEach((b, i) => {
      gsap.set(b, {
        xPercent: 0,
        yPercent: 0,
        scaleX: 1,
        opacity: 0,
        rotation: (Math.atan2(markets[i].dy, markets[i].dx) * 180) / Math.PI,
        transformOrigin: '50% 50%',
      });
    });

    /* 0. Portrait only: the head goes round at a constant rate, so each
       station's cue is simply its fraction of the lap. */
    if (portrait && orbit && head) {
      tl.set(orbit, { rotation: startA, transformOrigin: '0 0' }, 0)
        .to(orbit, { rotation: startA + 360, duration: ORBIT, ease: 'none' }, LEAD)
        .to(head, { opacity: 1, duration: 0.22, ease: 'power1.out' }, LEAD)
        .to(head, { opacity: 0, duration: 0.24, ease: 'power2.in' }, ORBIT_END - 0.24)
        .set(head, { opacity: 0 }, ORBIT_END + 0.02)
        .set(orbit, { clearProps: 'transform' }, ORBIT_END + 0.02);
    }

    markets.forEach((m, i) => {
      const bead = beads[i];
      /* Landscape: one speed, timed backward from a single arrival. Portrait:
         the head's passage is the cue and the fall is one duration. */
      const travel = portrait ? DROP : m.d / speed;
      const lean = portrait ? LEAD + turns[i] * ORBIT : ARRIVE - travel - UP;
      const depart = lean + UP;

      /* 1. The market leans along its wire and lets the value go. The
         transform goes back to the stylesheet afterwards: an inline identity
         transform would keep the node on its own layer. */
      tl.to(m.el, {
        ...CENTRED,
        x: lunge * m.ux * u,
        y: lunge * m.uy * u,
        scale: 1.07,
        duration: UP,
        ease: 'sine.out',
      }, lean)
        .to(m.el, {
          ...CENTRED, x: 0, y: 0, scale: 1, duration: BACK, ease: 'sine.inOut',
        }, lean + UP)
        .set(m.el, { clearProps: 'transform' }, lean + UP + BACK + 0.02);

      if (m.label) {
        tl.to(m.label, { color: litInk, duration: 0.26, ease: 'sine.out' }, lean);
      }

      /* 2. The bead rides the wire. `fromTo` states both ends so a stranded
         value cannot leak between cycles, with `immediateRender: false` so
         beads are not parked at the padlock from build time. */
      tl.set(bead, { xPercent: 0, yPercent: 0, scaleX: 0.55, opacity: 0 }, depart)
        .fromTo(bead,
          { xPercent: 0, yPercent: 0 },
          {
            xPercent: (m.dx / beadW) * 100,
            yPercent: (m.dy / beadH) * 100,
            duration: travel,
            ease: 'none',
            immediateRender: false,
          }, depart)
        .to(bead, { opacity: 1, scaleX: 1, duration: Math.min(0.22, travel * 0.4), ease: 'power1.out' }, depart)
        // Taken under the padlock's disc: it does not stop at the rim, it goes in.
        .to(bead, { opacity: 0, duration: 0.14, ease: 'power2.in' }, depart + travel - 0.14)
        .set(bead, { xPercent: 0, yPercent: 0, scaleX: 1, opacity: 0 }, depart + travel + 0.02);
    });

    /* 3. The lock takes the delivery: it seats and its label goes brand red.

       Landscape: it leans along `aim`, the mean of the wires. Portrait: the
       mean of directions round a circle is meaningless, so it scales only,
       and the inner circle seats with it at a third of the step.

       In portrait the seat applies to `.bt2__whole` (the padlock image), not
       the node: SELF-CUSTODY is the node's child but sits as a pill on the
       lower arc, and scaling the node would swing and grow it. The image has
       no stylesheet transform, so CENTRED does not apply. */
    const mark = portrait ? lock.querySelector<HTMLElement>('.bt2__whole') : null;
    const seat: HTMLElement = mark ?? lock;
    const seats: gsap.TweenVars = mark
      ? { scale: 1.13 }
      : { ...CENTRED, x: -leanIn * aim.x * u, y: -leanIn * aim.y * u, scale: 1.13 };
    const rests: gsap.TweenVars = mark ? { scale: 1 } : { ...CENTRED, x: 0, y: 0, scale: 1 };
    tl.to(seat, { ...seats, duration: 0.2, ease: 'sine.out' }, sealAt)
      .to(seat, { ...rests, duration: BACK, ease: 'sine.inOut' }, sealAt + 0.2)
      .set(seat, { clearProps: 'transform' }, sealAt + 0.2 + BACK + 0.02)
      .to(lockLabel, { color: sealed, duration: 0.2, ease: 'sine.out' }, sealAt)
      .to(lockLabel, {
        color: lockCool, duration: 0.5, ease: 'sine.inOut',
        onComplete: () => gsap.set(lockLabel, { clearProps: 'color' }),
      }, coolAt + 0.2);

    if (portrait && inner) {
      tl.to(inner, { scale: 1.05, duration: 0.2, ease: 'sine.out' }, sealAt)
        .to(inner, { scale: 1, duration: BACK, ease: 'sine.inOut' }, sealAt + 0.2)
        .set(inner, { clearProps: 'transform' }, sealAt + 0.2 + BACK + 0.02);
    }

    /* 4. The labels cool outward from the lock, nearest first. Portrait has
       no market names, so this loop does nothing there. */
    [...markets]
      .sort((a, b) => a.d - b.d)
      .forEach((m, i) => {
        if (!m.label) return;
        const label = m.label;
        tl.to(label, {
          color: m.cool, duration: 0.4, ease: 'sine.inOut',
          onComplete: () => gsap.set(label, { clearProps: 'color' }),
        }, coolAt + i * 0.09);
      });

    /* Off screen the loop pauses here, at rest; a beat in progress is
       allowed to finish. */
    tl.call(() => { if (offscreen) tl.pause(); }, undefined, storyEnd + 0.1);
    tl.to({}, { duration: 0.01 }, PERIOD - 0.01);
  }, card);

  /* Pause off screen, wake on return. The margin keeps a beat from being
     caught half-open on the way in. */
  const io = new IntersectionObserver(([entry]) => {
    offscreen = !entry.isIntersecting;
    if (!offscreen) loop?.play();
    else if (loop && !inBeat(loop.time())) loop.pause();
  }, { rootMargin: '120px' });
  io.observe(card);

  return () => {
    io.disconnect();
    // Reverts every tween this module built, restoring each style attribute
    // as it was found, mid-beat included.
    ctx.revert();
    for (const bead of beads) bead.remove();
    beads.length = 0;
    orbit?.remove();
  };
}
