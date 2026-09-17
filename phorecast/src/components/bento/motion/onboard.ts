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
 * LOOP (9.6s of story, then 4.2s of nothing — 13.8s end to end)
 *   One beat, and it is the card's own claim acted out: the dial runs. The arc
 *   the design already draws on the ring is the hand — it turns one full
 *   revolution on `none`, which is the one place linear belongs, because it is
 *   a clock — while the numerals wind 60 down to 00. Each promise lights as the
 *   count reaches it, a third of the way apart. At zero "You're in." flares and
 *   the ring breathes once; then the dial recharges to 60 over 1.2s and the
 *   whole card sits perfectly still for four seconds before going again.
 *
 * Nothing here responds to the pointer, and every value the loop touches is
 * returned to the one the design ships, so the resting frame is the design.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { bandStaged, onSectionReady, pulse, q1, qa, whileVisible } from './shared';

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
  if (!ring || !arcBox || !seconds || !inLabel || pills.length < 3) return () => {};

  const restingSeconds = seconds.textContent ?? '60s';
  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state
       Written while the band is still held at `data-motion="pending"`, so none
       of it is ever painted. `set`, not `from`: see shared.ts. */
    gsap.set(pills, { transformOrigin: '100% 50%' });
    gsap.set(inLabel, { transformOrigin: '0% 50%' });
    gsap.set(ring, { transformOrigin: '50% 50%' });
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
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 4.2 });
    loop
      .to(dial, { s: 0, duration: 7, ease: 'none', onUpdate: paintCount }, 0.3)
      .to(dial, { deg: 360, duration: 7, ease: 'none', onUpdate: paintArc }, 0.3);

    // One promise ticks off per third of the count.
    pills.slice(0, 3).forEach((pill, i) => {
      const lit = 'rgba(255, 251, 248, 0.92)';
      pulse(loop, pill, 1.9 + i * 2.3,
        { scale: 1.04, borderColor: lit },
        { scale: 1, borderColor: readBorder(pill) }, 0.4, 0.75);
    });

    // Zero: the confirmation flares and the ring takes one breath.
    pulse(loop, inLabel, 7.3,
      { scale: 1.07, textShadow: '0 0 14px rgba(255, 251, 248, 0.85)' },
      { scale: 1, textShadow: '0 0 0px rgba(255, 251, 248, 0)' }, 0.42, 0.9);
    pulse(loop, ring, 7.35, { scale: 1.014 }, { scale: 1 }, 0.5, 0.95);

    // 360 degrees is 0 degrees, so the hand can be put back without moving.
    loop.call(() => { dial.deg = 0; paintArc(); }, undefined, 8.4)
      .to(dial, { s: 60, duration: 1.2, ease: 'power2.out', onUpdate: paintCount }, 8.4);

    /* ------------------------------------------------------------- load-in */
    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro
      .to(ring, { opacity: 1, y: 0, scale: 1, duration: 0.95, ease: 'expo.out' }, 0)
      .to(pills, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.14 }, 0.45)
      .to(inLabel, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 1.0);

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
