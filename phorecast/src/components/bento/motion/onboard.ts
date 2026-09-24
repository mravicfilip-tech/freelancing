/**
 * Card A: "Make Your First Forecast in 60 Seconds".
 *
 * LOAD-IN (about 1.2s, after the band's entrance has landed the card)
 *   The phone and the grid arrive with the card as part of the section's
 *   entrance, so the card never appears as an empty orange rectangle. This
 *   module holds back the interface on top: the 60s ring leads alone for
 *   0.32s (a small rise and scale on `expo.out`, no overshoot), the three
 *   pills follow 0.11s apart, and "You're in." lands last. Keep it short: it
 *   plays only after the band's entrance has finished.
 *
 * LOOP (about 8.6s of motion, then 3.6s still)
 *   The dial runs: the arc on the ring turns one full revolution on `none`
 *   (linear, because it is a clock) while the numerals count 60 down to 00.
 *   Each pill lights in turn as the count runs. At zero "You're in." flares and
 *   the ring breathes once; then the dial recharges to 60 over 1.2s and the
 *   card rests for 3.6s.
 *
 * Nothing here responds to the pointer, and every value the loop touches is
 * returned to the design's, so the resting frame is the design.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { tok } from '../../../lib/theme';
import { bandStaged, onSectionReady, pct, pulse, q1, qa, unitOf, whileVisible } from './shared';

/** The resting stroke of `.onb__pill`, restated so the loop's highlight can
 *  return to it exactly. It is read off the element rather than hard-coded. */
const readBorder = (el: HTMLElement) => getComputedStyle(el).borderTopColor;

export function onboard(card: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const ring = q1(card, '.onb__ring');
  const arcBox = q1(card, '.onb__arc-box');
  const seconds = q1(card, '.onb__seconds');
  const inLabel = q1(card, '.onb__in');
  const pills = qa(card, '.onb__pill');
  const art = q1(card, '.onb__art');
  if (!ring || !arcBox || !seconds || !inLabel || !art || pills.length < 3) return () => {};

  const u = unitOf(art, 474);

  /* Build-time colour reads; see the note in funds.ts. These do not change
     with the theme (the plate is the same red gradient in both), but are read
     through `tok` so every loop colour is declared in one place (Bento.css). */
  const C = {
    pillLit: tok('--bento-onb-lit', 'rgba(255, 251, 248, 0.95)'),
    flare: tok('--bento-onb-flare', '0 0 16px rgba(255, 251, 248, 0.9)'),
    flare0: tok('--bento-onb-flare-0', '0 0 0px rgba(255, 251, 248, 0)'),
  };

  // One cell per digit (see BoxOnboard.css); the "s" is not a cell. The resting
  // value is read from the markup rather than restated here.
  const digits = Array.from(seconds.querySelectorAll<HTMLElement>('.onb__digit'));
  const restingSeconds = digits.map((d) => d.textContent ?? '0');
  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state
       Written while the band is still held at `data-motion="pending"`, so none
       of it is ever painted. `set`, not `from`: see shared.ts. */
    /* Transform origins live in the pulses that need them, not here: a resting
       element must carry no inline style of ours (see `pulse` in shared.ts). */
    if (staged) {
      gsap.set(ring, { opacity: 0, y: 10, scale: 0.965 });
      gsap.set(pills, { opacity: 0, y: 8 });
      gsap.set(inLabel, { opacity: 0, y: 6 });
    }

    /* ------------------------------------------------------------- the dial
       The arc is turned through a CSS variable rather than by GSAP writing
       `transform`, because the element's own transform already carries the
       centring translate and the design's 15.8 degree tilt; overwriting it
       would resolve those percentages to pixels and freeze them against the
       card's container unit. BoxOnboard.css folds `--onb-spin` into the same
       rotate, defaulting to 0deg. */
    const dial = { deg: 0, s: 60 };
    const paintArc = () => arcBox.style.setProperty('--onb-spin', `${dial.deg.toFixed(2)}deg`);
    // The count must be the same width at every value, or the numerals shift
    // sideways. BoxOnboard.css gives each digit a fixed cell; the pad keeps the
    // count at exactly two digits, so always exactly two cells.
    const paintCount = () => {
      const s = String(Math.round(dial.s)).padStart(2, '0');
      for (let i = 0; i < digits.length; i++) digits[i].textContent = s[i] ?? '0';
    };

    /* ---------------------------------------------------------------- loop */
    const RUN = 6;
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 3.6 });
    loop
      .to(dial, { s: 0, duration: RUN, ease: 'none', onUpdate: paintCount }, 0.3)
      .to(dial, { deg: 360, duration: RUN, ease: 'none', onUpdate: paintArc }, 0.3);

    // Each pill ticks off in turn during the count: it slides a step out of the
    // phone and its stroke lights, then settles back.
    pills.slice(0, 3).forEach((pill, i) => {
      pulse(loop, pill, 1.5 + i * (RUN / 3.4),
        { xPercent: pct(pill, -16, u, 'x'), scale: 1.06, transformOrigin: '100% 50%',
          borderColor: C.pillLit },
        { xPercent: 0, scale: 1, borderColor: readBorder(pill) }, 0.42, 0.8,
        'transform,transformOrigin,borderColor');
    });

    // Zero: the confirmation flares and the ring takes one breath.
    const ZERO = 0.3 + RUN;
    pulse(loop, inLabel, ZERO,
      { yPercent: -70, scale: 1.2, transformOrigin: '0% 50%', textShadow: C.flare },
      { yPercent: 0, scale: 1, textShadow: C.flare0 }, 0.42, 0.9,
      'transform,transformOrigin,textShadow');
    pulse(loop, ring, ZERO + 0.05, { scale: 1.05, transformOrigin: '50% 50%' }, { scale: 1 },
      0.5, 0.95, 'transform,transformOrigin');

    // 360 degrees is 0 degrees, so the hand can be put back without moving.
    loop.call(() => { dial.deg = 0; paintArc(); }, undefined, ZERO + 1.1)
      .to(dial, { s: 60, duration: 1.2, ease: 'power2.out', onUpdate: paintCount }, ZERO + 1.1);

    /* ------------------------------------------------------------- load-in */
    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro
      .to(ring, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out' }, 0)
      .to(pills, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.11 }, 0.32)
      .to(inLabel, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, 0.72)
      // Hand these back to CSS once they have landed: an inline `opacity: 1`
      // and identity transform change text rendering on a `backdrop-filter`
      // chip (see `pulse` in shared.ts).
      .set([ring, ...pills, inLabel], { clearProps: 'transform,transformOrigin,opacity' });

    if (staged) stopReady = onSectionReady(card, () => intro.play());
    else { intro.progress(1, true); runLoop(); }
  }, card);

  return () => {
    stopReady();
    stopVisible();
    ctx.revert();
    // `revert` puts the inline styles back; the text content is ours to undo.
    digits.forEach((d, i) => { d.textContent = restingSeconds[i] ?? '0'; });
    arcBox.style.removeProperty('--onb-spin');
  };
}
