/**
 * Card A — "Open an account in 60 seconds".
 *
 * LOAD-IN (1.6s, after the band's entrance has landed the card)
 *   The phone and the circuit grid behind it arrive with the card itself, as
 *   part of the section's own entrance — they are context, and the card should
 *   never appear as an empty orange rectangle. What this module holds back is
 *   the interface drawn on top of them. The 60s ring is the lead and takes the
 *   stage alone for 0.45s: ten pixels of rise and a hair of scale on `expo.out`,
 *   no overshoot. The three promises follow it, 0.14s apart so you can count
 *   them, and "You're in." lands last.
 *
 * LOOP (7.9s of story, then 3.6s of nothing — 11.5s end to end)
 *   One beat, and it is the card's own claim acted out: the dial runs. The arc
 *   the design already draws on the ring is the hand — it turns one full
 *   revolution on `none`, which is the one place linear belongs, because it is
 *   a clock — while the numerals wind 60 down to 00. Each promise lights as the
 *   count reaches it, a third of the way apart. At zero "You're in." flares and
 *   the ring breathes once; then the dial recharges to 60 over 1.2s and the
 *   whole card sits perfectly still for three and a half seconds before going
 *   again.
 *
 * Nothing here responds to the pointer, and every value the loop touches is
 * returned to the one the design ships, so the resting frame is the design.
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

  /* Build-time colour reads; see the note in funds.ts. This card is the one
     that does NOT flip, and these three values are why it is worth saying so
     out loud: a lit pill stroke and a flare around "You're in." are white
     because the plate under them is a saturated red-to-peach gradient, in both
     themes. White on that plate is still the lit thing on paper, so
     --bento-onb-* is absent from the light block in Bento.css and these three
     resolve to the same values on either page. Read through `tok` anyway, so
     the claim is checkable in one place rather than buried as a literal. */
  const C = {
    pillLit: tok('--bento-onb-lit', 'rgba(255, 251, 248, 0.95)'),
    flare: tok('--bento-onb-flare', '0 0 16px rgba(255, 251, 248, 0.9)'),
    flare0: tok('--bento-onb-flare-0', '0 0 0px rgba(255, 251, 248, 0)'),
  };

  const restingSeconds = seconds.textContent ?? '60s';
  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state
       Written while the band is still held at `data-motion="pending"`, so none
       of it is ever painted. `set`, not `from`: see shared.ts. */
    /* Transform origins live in the pulses that need them rather than being
       parked here, because a resting element must carry NO inline style of ours
       at all -- see `pulse` in shared.ts for what a stray inline transform does
       to text inside a `backdrop-filter` chip. */
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
       rotate, defaulting to 0deg, so the resting render is untouched. */
    const dial = { deg: 0, s: 60 };
    const paintArc = () => arcBox.style.setProperty('--onb-spin', `${dial.deg.toFixed(2)}deg`);
    // Geist Mono is monospaced, so the pad keeps the glyph box from shifting.
    const paintCount = () => { seconds.textContent = `${String(Math.round(dial.s)).padStart(2, '0')}s`; };

    /* ---------------------------------------------------------------- loop */
    const RUN = 6;
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 3.6 });
    loop
      .to(dial, { s: 0, duration: RUN, ease: 'none', onUpdate: paintCount }, 0.3)
      .to(dial, { deg: 360, duration: RUN, ease: 'none', onUpdate: paintArc }, 0.3);

    // One promise ticks off per third of the count: it slides a step out of the
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
      .to(ring, { opacity: 1, y: 0, scale: 1, duration: 0.95, ease: 'expo.out' }, 0)
      .to(pills, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.14 }, 0.45)
      .to(inLabel, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 1.0)
      // Hand the three back to CSS the moment they have landed: an inline
      // `opacity: 1` and identity transform are not visually free on a chip that
      // paints with `backdrop-filter` — measured at 818 differing pixels against
      // the static render before this line existed.
      .set([ring, ...pills, inLabel], { clearProps: 'transform,transformOrigin,opacity' });

    if (staged) stopReady = onSectionReady(card, () => intro.play());
    else { intro.progress(1, true); runLoop(); }
  }, card);

  return () => {
    stopReady();
    stopVisible();
    ctx.revert();
    // `revert` puts the inline styles back; the text content is ours to undo.
    seconds.textContent = restingSeconds;
    arcBox.style.removeProperty('--onb-spin');
  };
}
