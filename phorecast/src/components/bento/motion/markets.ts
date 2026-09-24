/**
 * Card D: "Forecast Global Markets in One Place".
 *
 * The artwork is an orbit field: thirteen badged logo tiles and unbadged ghost
 * tiles around the ringed Phorcast mark, with a cursor resting on Solana. The
 * motion says one thing: the mark in the middle reaches all of them.
 *
 * LOAD-IN (about 1.8s, after the band's entrance has landed the card)
 *   The grid, the orbit ellipses and the ghost tiles arrive with the card, so
 *   it never reads as blank. The hub leads alone for a third of a second, then
 *   the badged tiles dock in order of distance from it, nearest first (a wave,
 *   not a list). The diamonds, the cursor and the tooltip close it out.
 *
 * LOOP (about 6.2s of motion, then 3.9s still)
 *   The hub pulses and the pulse travels out through the field in distance
 *   order, each tile pushed 16 design px out along its own radius and back: a
 *   ring expanding through the orbit. Then the cursor leaves Solana, crosses
 *   the field to Gold, the tooltip relabels and Gold answers; then it returns
 *   and Solana answers.
 *
 * Two things this module must not do
 * ----------------------------------
 * 1. Write `boxShadow` on a tile. The tiles paint their sub-pixel rings with an
 *    inset box-shadow (see BoxMarkets.css); writing a shadow replaces the ring.
 *    Every displacement here is a transform.
 * 2. Look tiles up by index. DOM order can change; every badged tile carries
 *    `data-market`, which is the key, and the ordering below is computed from
 *    measured geometry.
 *
 * Nothing here reads the pointer. The cursor follows a scripted path.
 *
 * TWO LAYOUTS, ONE TIMELINE
 * -------------------------
 * At 720 and under the card is Figma 526:394: the field is recomposed
 * portrait, the dark plates and unbadged tints are `display: none`, and the
 * remaining badged tiles move. The beats and timings are unchanged; what
 * changes is what they are measured against. Three places where a desktop
 * assumption would fail silently:
 *
 *   1. Which tiles. A `display: none` tile measures 0 x 0 at the origin: it
 *      would sort as if on the hub, take a slot in the wave, and make
 *      `radial()` divide by zero. Hidden tiles are dropped before measuring.
 *   2. The design pixel. It is taken from the hub (82 design px in both
 *      layouts), not from the field, whose design width differs per layout.
 *   3. Layout changes. Percentages survive a resize but not a tile moving
 *      because a media query started matching, so crossing the breakpoint
 *      rebuilds the timeline (and nothing else does).
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { bandStaged, onSectionReady, pulse, q1, qa, whileVisible } from './shared';

/** The market the cursor rests on in the design, and the one it visits. */
const HOME = 'Solana';
const VISIT = 'Gold';

/** The breakpoint BoxMarkets.css recomposes the field at. Matched, not
 *  measured: the stylesheet is the thing that decides, so asking it directly is
 *  the only way this cannot drift away from it. */
const PHONE = '(max-width: 720px)';

export function markets(card: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const layout = window.matchMedia(PHONE);
  let stop = attach(card);
  // Tear the old timeline down BEFORE reading the card again: teardown puts the
  // tooltip's label and the dimmed tiles' opacities back, and the rebuild reads
  // both as its resting state.
  const again = () => { stop(); stop = attach(card); };
  layout.addEventListener('change', again);

  return () => {
    layout.removeEventListener('change', again);
    stop();
  };
}

function attach(card: HTMLElement): () => void {
  const hub = q1(card, '.mk__hub');
  const cursor = q1(card, '.mk__cursor');
  const tooltip = q1(card, '.mk__tooltip');
  const field = q1(card, '.mk__field');
  /* Rendered, not merely present. See note 1 in the header: a `display: none`
     tile measures 0 x 0 at the viewport origin, which is not a position, not a
     distance and not a divisor. */
  const rendered = (el: HTMLElement) => {
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0;
  };
  const diamonds = qa(card, '.mk__diamond').filter(rendered);
  const tiles = qa(card, '.mk__tile[data-market]').filter(rendered);
  if (!hub || !cursor || !tooltip || !field || tiles.length === 0) return () => {};

  const byName = (name: string) => tiles.find((t) => t.dataset.market === name) ?? null;
  const home = byName(HOME);
  const visit = byName(VISIT);
  const restingTip = tooltip.textContent ?? HOME;

  /* Several tiles are dimmed in the design (0.3 to 0.8 inline), so each one has
     to come back to its own resting opacity rather than to 1, and that value
     lives in the style attribute React wrote, which is why it is never handed to
     `clearProps`: clearing it would delete the design's own dimming. */
  const restOpacity = new Map<HTMLElement, string>();
  const settled = new Map<HTMLElement, number>();
  for (const el of tiles) {
    restOpacity.set(el, el.style.opacity);
    settled.set(el, parseFloat(getComputedStyle(el).opacity) || 1);
  }

  /* Geometry, measured rather than assumed: the field is laid out in the card's
     container unit, so pixel rects are the only honest source at any breakpoint.
     Everything below is then converted to a percentage of the moving element's
     own box, which is scale-invariant and so survives a resize without the
     timeline being rebuilt. */
  const box = (el: Element) => el.getBoundingClientRect();
  const mid = (el: Element) => { const b = box(el); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; };
  const hubC = mid(hub);
  const byDistance = [...tiles].sort((a, bEl) => {
    const ca = mid(a);
    const cb = mid(bEl);
    return Math.hypot(ca.x - hubC.x, ca.y - hubC.y) - Math.hypot(cb.x - hubC.x, cb.y - hubC.y);
  });

  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state */
    gsap.set([hub, ...tiles, ...diamonds], { transformOrigin: '50% 50%' });
    gsap.set(cursor, { transformOrigin: '12% 10%' });
    if (staged) {
      gsap.set(hub, { opacity: 0, y: 12, scale: 0.9 });
      for (const el of tiles) gsap.set(el, { opacity: 0, y: 10, scale: 0.92 });
      // The diamonds already carry `transform: rotate(45deg)`; restating it keeps
      // GSAP's decomposition honest rather than trusting it to be read back.
      gsap.set(diamonds, { opacity: 0, scale: 0.55, rotation: 45 });
      gsap.set(cursor, { opacity: 0, x: 18, y: 15 });
      gsap.set(tooltip, { opacity: 0, clipPath: 'inset(0 100% 0 0)' });
    }

    /* ---------------------------------------------------------------- loop */
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 3.9 });

    // 1. The hub, then a ring expanding out through the field
    pulse(loop, hub, 0, { yPercent: -10, scale: 1.09 }, { yPercent: 0, scale: 1 }, 0.5, 0.9, 'transform');
    // Design pixels, straight out along each tile's own radius. The tiles keep
    // their design sizes in both layouts, so the same 16 is the same fraction
    // of a tile on a phone as it is on a desktop.
    const OUT = 16;
    // One design pixel, measured from the hub (see note 2 in the header).
    const u = box(hub).width / 82;
    const radial = (el: HTMLElement, px: number) => {
      const c = mid(el);
      const dx = c.x - hubC.x;
      const dy = c.y - hubC.y;
      const d = Math.hypot(dx, dy) || 1;
      const b = box(el);
      return { xPercent: ((px * u * dx) / d / b.width) * 100, yPercent: ((px * u * dy) / d / b.height) * 100 };
    };
    byDistance.forEach((tile, i) => {
      pulse(loop, tile, 0.25 + i * 0.07,
        { ...radial(tile, OUT), scale: 1.08 },
        { xPercent: 0, yPercent: 0, scale: 1 }, 0.4, 0.66, 'transform');
    });
    diamonds.forEach((d, i) => {
      pulse(loop, d, 0.8 + i * 0.25,
        { ...radial(d, 14), scale: 1.8 }, { xPercent: 0, yPercent: 0, scale: 1 }, 0.34, 0.66, 'transform');
    });

    // 2. The cursor: Solana, across the field to Gold, and back
    if (home && visit) {
      const target = box(visit);
      const from = box(cursor);
      // land the arrow's tip inside the visited tile rather than on its corner
      const dx = target.left + target.width * 0.78 - from.left;
      const dy = target.top + target.height * 0.7 - from.top;
      const move = (el: HTMLElement, out: boolean) => ({
        xPercent: out ? (dx / box(el).width) * 100 : 0,
        yPercent: out ? (dy / box(el).height) * 100 : 0,
      });
      const GO = 2.25;
      const BACK = 3.95;
      const glide = (at: number, out: boolean) => {
        loop.to(cursor, { ...move(cursor, out), duration: 1, ease: 'power2.inOut' }, at)
          .to(tooltip, { ...move(tooltip, out), duration: 1, ease: 'power2.inOut' }, at);
      };
      const relabel = (at: number, text: string) => {
        loop.to(tooltip, { opacity: 0.15, duration: 0.18, ease: 'power2.in' }, at)
          .call(() => { tooltip.textContent = text; }, undefined, at + 0.18)
          .to(tooltip, { opacity: 1, duration: 0.3, ease: 'power2.out' }, at + 0.18);
      };
      glide(GO, true);
      relabel(GO + 0.35, VISIT);
      // the click, and the market answering it
      loop.to(cursor, { scale: 0.82, duration: 0.14, ease: 'power2.in' }, GO + 1)
        .to(cursor, { scale: 1, duration: 0.4, ease: 'power3.out' }, GO + 1.14);
      pulse(loop, visit, GO + 1.05, { yPercent: -26, scale: 1.14 }, { yPercent: 0, scale: 1 }, 0.4, 0.8, 'transform');

      glide(BACK, false);
      relabel(BACK + 0.35, restingTip);
      loop.to(cursor, { scale: 0.82, duration: 0.14, ease: 'power2.in' }, BACK + 1)
        .to(cursor, { scale: 1, duration: 0.4, ease: 'power3.out' }, BACK + 1.14)
        // hand the cursor and its label back to CSS, so the card rests with no
        // inline transform on them at all
        .set([cursor, tooltip], { clearProps: 'transform' }, BACK + 1.54);
      pulse(loop, home, BACK + 1.05, { yPercent: -26, scale: 1.14 }, { yPercent: 0, scale: 1 }, 0.4, 0.8, 'transform');
    }

    /* ------------------------------------------------------------- load-in */
    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro.to(hub, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out' }, 0);
    byDistance.forEach((tile, i) => {
      intro.to(tile, {
        opacity: settled.get(tile) ?? 1, y: 0, scale: 1, duration: 0.6, ease: 'expo.out',
      }, 0.34 + i * 0.05);
    });
    intro
      .to(diamonds, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out', stagger: 0.1 }, 0.95)
      .to(cursor, { opacity: 1, x: 0, y: 0, duration: 0.7, ease: 'expo.out' }, 1.1)
      .to(tooltip, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'power2.out' }, 1.3)
      // The wipe was only a way in; the pill's own corner radius owns its shape.
      .set(tooltip, { clearProps: 'clipPath' });

    if (staged) stopReady = onSectionReady(card, () => intro.play());
    else { intro.progress(1, true); runLoop(); }
  }, card);

  return () => {
    stopReady();
    stopVisible();
    ctx.revert();
    tooltip.textContent = restingTip;
    // `revert` hands the style attribute back as GSAP found it, but the dimmed
    // tiles are restated anyway: their opacity is design, not animation.
    for (const [el, value] of restOpacity) {
      if (value) el.style.opacity = value; else el.style.removeProperty('opacity');
    }
  };
}
