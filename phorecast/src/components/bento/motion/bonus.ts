/**
 * Card C — "Double your capital on first deposit".
 *
 * LOAD-IN (3.3s, after the band's entrance has landed the card)
 *   The measure grid arrives with the card. Everything else is held back so the
 *   chart line can be the lead, and drawing it is the longest tween on the
 *   card: 1.5s tip to tail on `power2.inOut`, which is the house draw. The
 *   marker catches the drawing edge as it passes; the pie and lightning badges
 *   follow 0.18s apart; the pill rises last and the two figures tally to
 *   $200.00, because the money is the point of the sentence.
 *
 * LOOP (4.7s of story, then 7.6s of nothing — 12.3s end to end)
 *   One beat: a deposit charges the curve. A bright segment runs the real path
 *   from its left end up to the marker — sampled off the same geometry, not a
 *   guessed offset — the marker blooms as it arrives, the lightning badge
 *   glints, the pie turns over, and the bonus figure counts itself up to
 *   $200.00 beside the deposit that is already there. Then the card rests.
 *
 * The charge is a second path appended inside the shipped `<svg>`, never a
 * re-parented or cloned one: `stroke="url(#box-bonus-stroke)"` on the design's
 * line resolves against `#box-bonus-stroke` in that svg's own `<defs>`, and
 * moving either of them out of that subtree would silently drop the gradient.
 * The charge carries a flat stroke of its own and so depends on no def at all.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { bandStaged, onSectionReady, pulse, q1, whileVisible } from './shared';

const NS = 'http://www.w3.org/2000/svg';
/** The chart's viewBox width — one user unit is one design pixel. */
const CHART_W = 564.087;
const money = (v: number) => `+$${v.toFixed(2)}`;

/** The arc length at which the path crosses `x`. The curve is monotonic left to
 *  right, so a bisection is exact to within a twentieth of a design pixel. */
function lengthAtX(path: SVGPathElement, total: number, x: number): number {
  let lo = 0;
  let hi = total;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).x < x) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function bonus(card: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const chart = card.querySelector<SVGSVGElement>('svg.box-bonus__chart');
  const line = card.querySelector<SVGPathElement>('path.box-bonus__line');
  const marker = q1(card, '.box-bonus__marker');
  const bolt = q1(card, '.box-bonus__badge--bolt');
  const pie = q1(card, '.box-bonus__badge--pie');
  const pill = q1(card, '.box-bonus__pill');
  const deposit = q1(card, '.box-bonus__amt--deposit strong');
  const bonusAmt = q1(card, '.box-bonus__amt--bonus strong');
  if (!chart || !line || !marker || !bolt || !pie || !pill || !deposit || !bonusAmt) return () => {};

  const restingDeposit = deposit.textContent ?? '';
  const restingBonus = bonusAmt.textContent ?? '';

  /* The pie badge already carries `transform: scale(0.7)` from the design, which
     keeps the three wedges' own leaf boxes correct relative to each other. GSAP
     replaces the whole declaration the moment it writes a transform, so its
     resting scale has to be read back and animated around rather than assumed
     to be 1 — otherwise the first tween would settle the badge at full size. */
  const pieTransform = getComputedStyle(pie).transform;
  const pieScale = pieTransform && pieTransform !== 'none' ? new DOMMatrixReadOnly(pieTransform).a : 1;

  const total = line.getTotalLength();

  /* Where the marker's halo sits on the curve, measured off the DOM so it holds
     at every breakpoint rather than assuming the card is at its design width. */
  const u = chart.getBoundingClientRect().width / CHART_W;
  const markerBox = marker.getBoundingClientRect();
  const markerX = (markerBox.left + markerBox.width / 2 - chart.getBoundingClientRect().left) / u;
  const markerLen = lengthAtX(line, total, markerX);

  const charge = document.createElementNS(NS, 'path');
  charge.setAttribute('d', line.getAttribute('d') ?? '');
  charge.setAttribute('fill', 'none');
  // A stop sampled out of the design's own gradient, so the charge reads as the
  // same line lit rather than as a foreign colour laid over it.
  charge.setAttribute('stroke', '#feab8b');
  charge.setAttribute('stroke-width', '3');
  charge.setAttribute('stroke-linecap', 'round');
  charge.style.opacity = '0';
  chart.appendChild(charge);

  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state */
    // An explicit resting `filter` so the loop's brightness pulse has a numeric
    // start to interpolate from; GSAP cannot tween out of the keyword `none`.
    gsap.set(marker, { filter: 'brightness(1)', transformOrigin: '50% 12.7%' });
    gsap.set([bolt, pie], { transformOrigin: '50% 50%' });
    if (staged) {
      gsap.set(line, { strokeDasharray: total, strokeDashoffset: total });
      gsap.set([marker, bolt, pie], { opacity: 0 });
      gsap.set(bolt, { scale: 0.92 });
      gsap.set(pie, { scale: pieScale * 0.92 });
      gsap.set(pill, { opacity: 0, y: 12 });
    }

    const tally = { deposit: 0, bonus: 0 };
    const paintDeposit = () => { deposit.textContent = money(tally.deposit); };
    const paintBonus = () => { bonusAmt.textContent = money(tally.bonus); };
    // Zeroed while the band is still held hidden, so the pill rises already at
    // nothing and the figures are counted up rather than snapping down to zero
    // a beat after they have been read. Skipped entirely if the band is already
    // showing, for exactly that reason.
    if (staged) { paintDeposit(); paintBonus(); }

    /* ---------------------------------------------------------------- loop
       The travelling segment is a dash the length of the run, slid along the
       path by its offset — the same thing a motion path would do, without the
       plugin. It stops exactly on the marker because `markerLen` came off the
       geometry. */
    const RUN = 26;
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 7.6 });
    loop
      .set(charge, { strokeDasharray: `${RUN} ${total}`, strokeDashoffset: 0 }, 0)
      .to(charge, { opacity: 0.95, duration: 0.4, ease: 'sine.out' }, 0)
      .to(charge, { strokeDashoffset: -(markerLen - RUN), duration: 2.6, ease: 'power1.inOut' }, 0)
      .to(charge, { opacity: 0, duration: 0.55, ease: 'sine.inOut' }, 2.35);
    // The halo is at 12.7% down the marker's box — the rest of that box is the
    // drop line to the pill, which must not visibly stretch.
    pulse(loop, marker, 2.3,
      { scale: 1.06, filter: 'brightness(1.4)' },
      { scale: 1, filter: 'brightness(1)' }, 0.36, 0.9);
    pulse(loop, bolt, 2.5, { scale: 1.07 }, { scale: 1 }, 0.36, 0.85);
    pulse(loop, pie, 3.0, { scale: pieScale * 1.07 }, { scale: pieScale }, 0.4, 0.85);
    loop
      .call(() => { tally.bonus = 0; paintBonus(); }, undefined, 3.15)
      .to(tally, { bonus: 200, duration: 1.3, ease: 'power2.out', onUpdate: paintBonus }, 3.2);
    pulse(loop, pill, 3.2,
      { borderColor: 'rgba(229, 51, 30, 0.6)' },
      { borderColor: getComputedStyle(pill).borderTopColor }, 0.45, 0.9);

    /* ------------------------------------------------------------- load-in */
    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro
      .to(line, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0)
      // The drawing edge reaches the marker at markerLen/total of the tween.
      .to(marker, { opacity: 1, duration: 0.5, ease: 'expo.out' }, 1.5 * (markerLen / total))
      .to(pie, { opacity: 1, scale: pieScale, duration: 0.7, ease: 'expo.out' }, 1.65)
      .to(bolt, { opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' }, 1.83)
      .to(pill, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 2.05)
      .to(tally, { deposit: 200, duration: 1.15, ease: 'power2.out', onUpdate: paintDeposit }, 2.25)
      .to(tally, { bonus: 200, duration: 1.15, ease: 'power2.out', onUpdate: paintBonus }, 2.4)
      // Hand the line back to CSS: the dash was only ever a way to draw it.
      .set(line, { clearProps: 'strokeDasharray,strokeDashoffset' });

    if (staged) stopReady = onSectionReady(card, () => intro.play());
    else { intro.progress(1, true); runLoop(); }
  }, card);

  return () => {
    stopReady();
    stopVisible();
    ctx.revert();
    charge.remove();
    deposit.textContent = restingDeposit;
    bonusAmt.textContent = restingBonus;
  };
}
