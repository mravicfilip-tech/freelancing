/**
 * Card two — "Experienced Trader?" — the ambient loop.
 *
 * The illustration is a constellation: five market nodes (BTC / USD, TSLA,
 * DAX 40, EUR / USD, XAU / USD) wired to one self-custody padlock on the right.
 * The card's argument is *many markets, one settlement you hold*, so that is
 * the only thing this beat says.
 *
 * THE STORY — one delivery, every 8.5s
 * ------------------------------------
 *   0.82s  BTC leans a dozen design pixels along its own wire and lets a bead
 *          of value go. It is the farthest market out, so it goes first.
 *   1.0 →  EUR / USD, TSLA, XAU / USD and DAX 40 follow, each at the moment its
 *   2.1s   own distance says it must leave. Every bead travels the wire at the
 *          same speed, so the five departures are a wave whose shape is the
 *          field's real geometry — nearest market last, by 1.12s.
 *   2.75s  All five arrive at the padlock *together*. Five separate markets
 *          resolving into a single place: that convergence is the whole point,
 *          and it is solved, not staggered by eye — the departures are
 *          `arrival − distance / speed`.
 *   2.63s  The lock answers as they touch its rim: it leans into the delivery,
 *          takes it, and seats. SELF-CUSTODY goes brand red for a beat.
 *   3.45 → The circuit cools outward from the lock, nearest market first, and
 *   4.3s   every label, node and bead is back to the Figma frame.
 *   4.3 →  Nothing moves. The card is the design again for four seconds, and
 *   8.5s   for the 0.8s lead of the next cycle — 5.0s of an 8.5s period still.
 *
 * WHAT THE BEADS ARE, AND WHY
 * ---------------------------
 * The wires ship as two `<img>` SVGs — `.bt2__fan` (four straight paths) and
 * `.bt2__main` (BTC's) — so nothing inside them is addressable and
 * `stroke-dashoffset` is off the table: there is no way to put light *on* the
 * stroke the way the fan section does. Rather than fake it with something that
 * moves no pixels (a clip-path window, a mask-position or a background-position
 * all animate a zero-travel bounding box and read as static on this project's
 * own check), this module creates five beads and flies them along the real
 * lines. Each is positioned as a percentage of the card and travels in
 * `xPercent`/`yPercent` of its own box, which is sized in `var(--c)`; both are
 * pure ratios, so the whole beat survives a resize without being rebuilt.
 *
 * They are inserted *behind* the nodes, so a bead leaves from under its market's
 * disc and is taken under the padlock's — it rides the full wire, occluded at
 * both ends, instead of docking at a rim.
 *
 * THE NODES MOVE IN PIXELS, AND THE BEADS IN PERCENT
 * --------------------------------------------------
 * Not an oversight. `.bt2__node` is centred on its mark by a stylesheet
 * `transform: translate(-50%, -50%)`, and GSAP parses that into its own
 * `xPercent`/`yPercent` cache — so a tween that writes `xPercent` REPLACES the
 * centring rather than adding to it, and the node jumps half its own width.
 * Measured: a 12px lean asked for in percent moved BTC 41.7px across and 32px
 * down, which is the 32px half-width of a 64px disc plus the lean. Pixels are
 * added on top of the centring, so the nodes lean in `x`/`y` scaled by the
 * measured design unit. The beads carry no stylesheet transform of their own
 * and so keep the resize-proof percentages.
 *
 * WHAT THIS MUST NOT DO
 * ---------------------
 * 1. No glow, bloom, halo or drop-shadow — standing rule for this site. A bead
 *    is a flat warm capsule; the answer at the lock is scale, position and
 *    colour and nothing else. `filter` is never written here.
 * 2. No `clearProps: 'all'`. Every `.bt2__node` carries its position in inline
 *    custom properties (`--x`, `--y`, `--s`); emptying the style attribute drops
 *    all three and collapses the constellation onto the card's centre. Only
 *    `transform` and `color` are ever cleared, by name.
 * 3. No pointer response of any kind, nothing that floats or breathes between
 *    beats, and no motion at all under `prefers-reduced-motion`.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';

/** The card's design frame. Its `aspect-ratio` locks both axes to one scale. */
const DW = 640;
const DH = 254;

/** One cycle, in GSAP time. Wall-clock is longer whenever lag smoothing bites. */
const PERIOD = 8.5;
/** Stillness at the top of a cycle, before the farthest market moves. */
const LEAD = 0.82;
/** How long the longest wire takes; every other journey is that speed. */
const RUN = 1.75;

/** The send: design px a node leans along its own wire, and the pulse's halves. */
const LUNGE = 12;
const UP = 0.18;
const BACK = 0.62;
/** Design px the padlock leans into the delivery as the beads reach it. */
const LEAN_IN = 6;

/** The bead, in design px, and the brand warm it is painted (`--orange-300`). */
const BEAD_W = 14;
const BEAD_H = 2.6;
const BEAD_BG = '#e9513f';

/** `--white-font`: a market's label while its value is in flight. */
const LIT = '#fffbf8';
/** `--orange-100`: SELF-CUSTODY at the moment it takes the delivery. */
const SEALED = '#e5331e';

/** The moment every bead is at the padlock's centre. */
const ARRIVE = LEAD + UP + RUN;
/** The lock answers as the beads reach its rim, a frame or two earlier. */
const SEAL = ARRIVE - 0.12;
/** The cooling wave, and the end of the beat. */
const COOL = SEAL + 0.82;
const STORY = COOL + 0.85;

export function bt2Loop(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const card = root.querySelector<HTMLElement>('.bt-card--two');
  if (!card) return () => {};

  const stage = card.querySelector<HTMLElement>('.bt2');
  const lock = card.querySelector<HTMLElement>('.bt2__node--lock');
  const lockLabel = lock?.querySelector<HTMLElement>('.bt2__label');
  const nodes = Array.from(card.querySelectorAll<HTMLElement>('.bt2__node:not(.bt2__node--lock)'));
  if (!stage || !lock || !lockLabel || nodes.length === 0) return () => {};

  /* ------------------------------------------------------------- geometry
     Measured, never assumed: the illustration is laid out in the card's own
     container unit, so live rects are the only honest source at any width.
     Everything is divided back into the 640 x 254 design frame, where the
     numbers are the ones in Figma and are the same at every breakpoint. */
  const cb = card.getBoundingClientRect();
  const u = cb.width / DW;
  if (!(u > 0)) return () => {};

  const centre = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - cb.left + r.width / 2) / u,
      y: (r.top - cb.top + r.height / 2) / u,
      w: r.width / u,
      h: r.height / u,
    };
  };

  const hub = centre(lock);
  const markets = nodes.map((el) => {
    const c = centre(el);
    const dx = hub.x - c.x;
    const dy = hub.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    return {
      el,
      label: el.querySelector<HTMLElement>('.bt2__label'),
      c,
      dx,
      dy,
      d,
      ux: dx / d,
      uy: dy / d,
    };
  });

  /* One speed for every wire, set by the longest of them. The departures fall
     out of it: a market leaves early exactly in proportion to how far it is. */
  const longest = markets.reduce((m, n) => Math.max(m, n.d), 0);
  const speed = longest / RUN;

  /* ---------------------------------------------------------------- beads
     Created here, removed in the teardown. Sized in `var(--c)` so the box
     scales with the card, and centred by negative margins rather than a
     translate, which keeps the transform GSAP writes purely the animation. */
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
      `width:calc(${BEAD_W} * var(--c))`,
      `height:calc(${BEAD_H} * var(--c))`,
      `margin:calc(${-BEAD_H / 2} * var(--c)) 0 0 calc(${-BEAD_W / 2} * var(--c))`,
      `border-radius:calc(${BEAD_H / 2} * var(--c))`,
      `background:${BEAD_BG}`,
      'opacity:0',
      'pointer-events:none',
    ].join(';');
    stage.insertBefore(bead, firstNode);
    beads.push(bead);
  }

  let offscreen = false;
  let loop: gsap.core.Timeline | undefined;
  const inBeat = (t: number) => t > LEAD - 0.1 && t < STORY + 0.1;

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

    markets.forEach((m, i) => {
      const bead = beads[i];
      const travel = m.d / speed;
      const depart = ARRIVE - travel;
      const lean = depart - UP;

      /* 1 — the market leans along its own wire and lets the value go. Both
         ends of the lean are stated, and the transform goes back to the
         stylesheet afterwards: an inline identity transform still promotes the
         node to its own layer, and these discs carry a backdrop filter. */
      tl.to(m.el, {
        x: LUNGE * m.ux * u,
        y: LUNGE * m.uy * u,
        scale: 1.07,
        duration: UP,
        ease: 'sine.out',
      }, lean)
        .to(m.el, {
          x: 0, y: 0, scale: 1, duration: BACK, ease: 'sine.inOut',
        }, lean + UP)
        .set(m.el, { clearProps: 'transform' }, lean + UP + BACK + 0.02);

      if (m.label) {
        tl.to(m.label, { color: LIT, duration: 0.26, ease: 'sine.out' }, lean);
      }

      /* 2 — the bead rides the wire. `fromTo` states both ends so a stranded
         value from an earlier cycle cannot poison it, and `immediateRender` is
         off because GSAP writes a fromTo's start the moment it is BUILT, not
         when the playhead arrives — without it every bead would sit parked at
         the padlock from the first frame. */
      tl.set(bead, { xPercent: 0, yPercent: 0, scaleX: 0.55, opacity: 0 }, depart)
        .fromTo(bead,
          { xPercent: 0, yPercent: 0 },
          {
            xPercent: (m.dx / BEAD_W) * 100,
            yPercent: (m.dy / BEAD_H) * 100,
            duration: travel,
            ease: 'none',
            immediateRender: false,
          }, depart)
        .to(bead, { opacity: 1, scaleX: 1, duration: Math.min(0.22, travel * 0.4), ease: 'power1.out' }, depart)
        // Taken under the padlock's disc: it does not stop at the rim, it goes in.
        .to(bead, { opacity: 0, duration: 0.14, ease: 'power2.in' }, ARRIVE - 0.14)
        .set(bead, { xPercent: 0, yPercent: 0, scaleX: 1, opacity: 0 }, ARRIVE + 0.02);
    });

    /* 3 — the lock takes the delivery: it leans into the incoming line, seats,
       and its label goes brand red for the length of the settlement. */
    tl.to(lock, {
      x: -LEAN_IN * u,
      scale: 1.13,
      duration: 0.2,
      ease: 'sine.out',
    }, SEAL)
      .to(lock, { x: 0, scale: 1, duration: BACK, ease: 'sine.inOut' }, SEAL + 0.2)
      .set(lock, { clearProps: 'transform' }, SEAL + 0.2 + BACK + 0.02)
      .to(lockLabel, { color: SEALED, duration: 0.2, ease: 'sine.out' }, SEAL)
      .to(lockLabel, {
        color: LIT, duration: 0.5, ease: 'sine.inOut',
        onComplete: () => gsap.set(lockLabel, { clearProps: 'color' }),
      }, COOL + 0.2);

    /* 4 — the circuit cools outward from the lock, nearest market first, so the
       beat closes in the same measured order it opened in, reversed. */
    [...markets]
      .sort((a, b) => a.d - b.d)
      .forEach((m, i) => {
        if (!m.label) return;
        const label = m.label;
        tl.to(label, {
          color: 'rgb(157, 157, 157)', duration: 0.4, ease: 'sine.inOut',
          onComplete: () => gsap.set(label, { clearProps: 'color' }),
        }, COOL + i * 0.09);
      });

    /* Off screen the loop stops here rather than wherever the scroll left it,
       so the card is never parked mid-delivery. A beat is under four seconds;
       it is allowed to finish. */
    tl.call(() => { if (offscreen) tl.pause(); }, undefined, STORY + 0.1);
    tl.to({}, { duration: 0.01 }, PERIOD - 0.01);
  }, card);

  /* Pause the moment the card leaves the screen, wake when it comes back. The
     margin is generous so the beat is not caught half-open on the way in. */
  const io = new IntersectionObserver(([entry]) => {
    offscreen = !entry.isIntersecting;
    if (!offscreen) loop?.play();
    else if (loop && !inBeat(loop.time())) loop.pause();
  }, { rootMargin: '120px' });
  io.observe(card);

  return () => {
    io.disconnect();
    // Reverts every tween this module built, which hands each element's style
    // attribute back exactly as it was found — mid-beat included.
    ctx.revert();
    for (const bead of beads) bead.remove();
    beads.length = 0;
  };
}
