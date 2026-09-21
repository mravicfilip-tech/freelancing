/**
 * Card D — "Trade every market from one account".
 *
 * The artwork is an orbit field: thirteen badged logo tiles and a drift of
 * unbadged ghost tiles arranged around the ringed Phorcast mark, with a cursor
 * resting on Solana. The card's claim is that the one mark in the middle reaches
 * all of them, so that is what the motion says and nothing else.
 *
 * LOAD-IN (1.8s, after the band's entrance has landed the card)
 *   The measure grid, the two orbit ellipses and the ghost tiles arrive with the
 *   card — it must never read as blank cream. The hub is the lead and has the
 *   stage alone for a third of a second. The badged tiles then dock in order of
 *   their distance from it, nearest first: thirteen arrivals inside two thirds
 *   of a second, a wave rather than a list. The diamonds on the orbit paths, the
 *   cursor and the tooltip close it out.
 *
 *   It was 2.2s, behind the band's own entrance. Same beats, same order, same
 *   eases, 20% quicker.
 *
 * LOOP (5.8s of story, then 3.9s of nothing — 9.7s end to end)
 *   The hub pulses and the pulse travels out through the field in the same
 *   distance order, each tile pushed sixteen design pixels straight out along its
 *   own radius and drawn back — a ring expanding through the orbit rather than a
 *   row of things blinking. Then the cursor does the card's job: it leaves Solana,
 *   crosses two hundred and thirty six design pixels of the field to Gold, the
 *   tooltip re-labels itself and Gold answers; then it comes back and Solana
 *   answers. The card is then completely still for nearly four seconds.
 *
 * Two things this module must not do
 * ----------------------------------
 * 1. Write `boxShadow` on a tile. The tiles paint their sub-pixel rings with an
 *    INSET box-shadow, because Chrome snaps a used `border-width` to a whole
 *    pixel and would both thicken every hairline and drag the glyphs off their
 *    marks. A previous version of this file wrote a lift shadow on every frame
 *    and silently replaced the rings: measured `rgba(0,0,0,0.09) 0 0 0 0.74px
 *    inset` at 1.2s had become `rgba(22,12,9,0.14) 0 4px 11px -8px` by 6s. Every
 *    displacement here is a transform, which is a paint operation and leaves the
 *    computed shadow untouched.
 * 2. Look tiles up by index. DOM order changed when the box was rebuilt and it
 *    can change again; every badged tile carries `data-market`, so that is the
 *    key, and the ordering below is computed from measured geometry.
 *
 * Nothing here reads the pointer. The cursor is a drawn object following a
 * scripted path, the same on every machine.
 *
 * TWO LAYOUTS, ONE TIMELINE
 * -------------------------
 * At 720 and under the card is Figma 526:394: the field is recomposed
 * portrait, the six dark plates and the eight unbadged tints are
 * `display: none`, and eight
 * badged tiles sit somewhere else entirely. Nothing about the beats changes --
 * the hub still leads, the ring still expands out through the field in distance
 * order, the cursor still leaves Solana at 2.25 and is back by 3.95, and the
 * loop is still 5.8s of story on a 9.7s cycle. What changes is what those beats
 * are measured AGAINST, and all three places that could have been hard-coded to
 * the desktop field are named here because getting any of them wrong is silent:
 *
 *   1. WHICH TILES. `display: none` is not "a tile that happens to be
 *      invisible": its rect is 0 x 0 at the origin, so it sorts as though it
 *      were on top of the hub, it takes a slot in the wave that then plays to
 *      an empty stage, and `radial()` divides its push by a zero width and
 *      hands GSAP an Infinity. Hidden tiles are dropped before anything is
 *      measured.
 *   2. THE DESIGN PIXEL. It used to come from the field's own width over
 *      727.454, which is the DESKTOP field's design width. On the phone the
 *      field is 394 wide, so the same expression under-read the unit by 46%
 *      and every radial push came out a little under half the size it was
 *      written as. It is taken off the hub instead: 82 design pixels in both
 *      layouts, and the one element guaranteed to be present.
 *   3. WHEN THE LAYOUT CHANGES. Percentages survive a resize; they do not
 *      survive a tile moving 200 pixels because a media query started matching.
 *      Crossing the breakpoint -- turning a phone on its side is the real case
 *      -- rebuilds, and nothing else does.
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
     to come back to its own resting opacity rather than to 1 — and that value
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

    // 1 — the hub, then a ring expanding out through the field
    pulse(loop, hub, 0, { yPercent: -10, scale: 1.09 }, { yPercent: 0, scale: 1 }, 0.5, 0.9, 'transform');
    // Design pixels, straight out along each tile's own radius. The tiles keep
    // their design sizes in both layouts, so the same 16 is the same fraction
    // of a tile on a phone as it is on a desktop.
    const OUT = 16;
    // One design pixel, off the hub. See note 2 in the header: the field's own
    // width is 727.454 design pixels on a desktop and 394 on a phone, so
    // dividing by either one is right in one layout and wrong in the other.
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

    // 2 — the cursor works: Solana, across the field to Gold, and back
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
