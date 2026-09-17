/**
 * Card D — "Trade every market from one account".
 *
 * The artwork is an orbit field: thirteen badged logo tiles and a drift of
 * unbadged ghost tiles arranged around the ringed Phorecast mark, with a cursor
 * resting on Solana. The card's claim is that the one mark in the middle reaches
 * all of them, so that is what the motion says and nothing else.
 *
 * LOAD-IN (2.6s, after the band's entrance has landed the card)
 *   The measure grid, the two orbit ellipses and the ghost tiles arrive with the
 *   card — they are the field, and the card must never read as blank cream. The
 *   hub is the lead and has the stage alone for half a second. The badged tiles
 *   then dock in order of their distance from it, nearest first, 0.055s apart:
 *   thirteen arrivals inside three quarters of a second, a wave rather than a
 *   list. The orange diamonds on the orbit paths, the cursor and finally the
 *   tooltip close it out.
 *
 * LOOP (4.0s of story, then 8.5s of nothing — 12.5s end to end)
 *   The hub pulses once and the pulse travels out through the field in the same
 *   distance order — each tile lifts three pixels and settles — passing the two
 *   diamonds on its way. The cursor answers with a click and Solana, the market
 *   it has picked, confirms with its tooltip. Then the card is completely still
 *   for eight and a half seconds.
 *
 * Two things this module must not do
 * ----------------------------------
 * 1. Write `boxShadow` on a tile. The tiles paint their sub-pixel rings with an
 *    INSET box-shadow, because Chrome snaps a used `border-width` to a whole
 *    pixel and would both thicken every hairline and drag the glyphs off their
 *    marks. A previous version of this file wrote a lift shadow on every frame
 *    and silently replaced the rings: measured `rgba(0,0,0,0.09) 0 0 0 0.74px
 *    inset` at 1.2s had become `rgba(22,12,9,0.14) 0 4px 11px -8px` by 6s. The
 *    lift here is scale and translation only, which are paint transforms and
 *    leave the shadow untouched.
 * 2. Look tiles up by index. DOM order changed when the box was rebuilt and it
 *    can change again; every badged tile carries `data-market`, so that is the
 *    key. The ordering below is computed from measured geometry, not assumed.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { bandStaged, onSectionReady, pulse, q1, qa, whileVisible } from './shared';

/** The market the cursor rests on in the design; it gets the closing beat. */
const PICKED = 'Solana';

export function markets(card: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const hub = q1(card, '.mk__hub');
  const cursor = q1(card, '.mk__cursor');
  const tooltip = q1(card, '.mk__tooltip');
  const diamonds = qa(card, '.mk__diamond');
  const tiles = qa(card, '.mk__tile[data-market]');
  if (!hub || !cursor || !tooltip || tiles.length === 0) return () => {};

  const picked = tiles.find((t) => t.dataset.market === PICKED) ?? null;

  /* Several tiles are dimmed in the design (0.3 to 0.8 inline), so each one has
     to come back to its own resting opacity rather than to 1 — and that value
     lives in the style attribute React wrote, which is why it is never handed to
     `clearProps`: clearing it would delete the design's own dimming. */
  const rest = new Map<HTMLElement, string>();
  for (const el of tiles) rest.set(el, el.style.opacity);
  const restOpacity = (el: HTMLElement) => parseFloat(getComputedStyle(el).opacity) || 1;
  const settled = new Map<HTMLElement, number>();
  for (const el of tiles) settled.set(el, restOpacity(el));

  /* Distance from the hub, measured rather than assumed. The field is laid out
     in the card's container unit, so pixel geometry is the only honest source
     at any breakpoint. */
  const centre = (el: Element) => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  };
  const hubC = centre(hub);
  const byDistance = [...tiles].sort((a, b) => {
    const ca = centre(a);
    const cb = centre(b);
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
      gsap.set(hub, { opacity: 0, y: 10, scale: 0.92 });
      for (const el of tiles) gsap.set(el, { opacity: 0, y: 8, scale: 0.94 });
      // The diamonds already carry `transform: rotate(45deg)`; restating it keeps
      // GSAP's decomposition honest rather than trusting it to be read back.
      gsap.set(diamonds, { opacity: 0, scale: 0.6, rotation: 45 });
      gsap.set(cursor, { opacity: 0, x: 16, y: 13 });
      gsap.set(tooltip, { opacity: 0, clipPath: 'inset(0 100% 0 0)' });
    }

    /* ---------------------------------------------------------------- loop */
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 8.5 });
    pulse(loop, hub, 0, { scale: 1.04 }, { scale: 1 }, 0.45, 0.9);
    byDistance.forEach((tile, i) => {
      pulse(loop, tile, 0.3 + i * 0.085, { y: -3, scale: 1.045 }, { y: 0, scale: 1 }, 0.38, 0.62);
    });
    diamonds.forEach((d, i) => {
      pulse(loop, d, 0.95 + i * 0.3, { scale: 1.3 }, { scale: 1 }, 0.3, 0.6);
    });
    // The cursor's click, then the market it has picked answering it.
    loop
      .to(cursor, { scale: 0.88, duration: 0.16, ease: 'power2.in' }, 2.6)
      .to(cursor, { scale: 1, duration: 0.42, ease: 'power3.out' }, 2.76);
    if (picked) pulse(loop, picked, 2.7, { y: -4, scale: 1.07 }, { y: 0, scale: 1 }, 0.4, 0.8);
    pulse(loop, tooltip, 2.78, { y: -3 }, { y: 0 }, 0.35, 0.7);

    /* ------------------------------------------------------------- load-in */
    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro.to(hub, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'expo.out' }, 0);
    byDistance.forEach((tile, i) => {
      intro.to(tile, {
        opacity: settled.get(tile) ?? 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out',
      }, 0.55 + i * 0.055);
    });
    intro
      .to(diamonds, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out', stagger: 0.12 }, 1.45)
      .to(cursor, { opacity: 1, x: 0, y: 0, duration: 0.85, ease: 'expo.out' }, 1.7)
      .to(tooltip, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'power2.out' }, 2.05)
      // The wipe was only a way in; the pill's own corner radius owns its shape.
      .set(tooltip, { clearProps: 'clipPath' });

    if (staged) stopReady = onSectionReady(card, () => intro.play());
    else { intro.progress(1, true); runLoop(); }
  }, card);

  return () => {
    stopReady();
    stopVisible();
    ctx.revert();
    // `revert` hands the style attribute back as GSAP found it, but the dimmed
    // tiles are restated anyway: their opacity is design, not animation.
    for (const [el, value] of rest) {
      if (value) el.style.opacity = value; else el.style.removeProperty('opacity');
    }
  };
}
