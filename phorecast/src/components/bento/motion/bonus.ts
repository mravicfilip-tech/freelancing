/**
 * Card C — "Double your capital on first deposit".
 *
 * LOAD-IN (2.5s, after the band's entrance has landed the card)
 *   The measure grid arrives with the card. Everything else is held back so the
 *   chart line can be the lead, and drawing it is the longest tween here: 1.0s
 *   tip to tail on `power2.inOut`, the house draw. The marker catches the
 *   drawing edge as it passes, the pie and lightning badges follow, the pill
 *   rises last and both figures tally to $200.00 — the money is the point of
 *   the sentence.
 *
 *   This was the longest of the four at 3.0s, and it is queued behind the
 *   band's own entrance: on a phone the figures were still counting past five
 *   seconds from the scroll. The draw loses 0.3s, the badges and the pill close
 *   up behind it, and the two tallies overlap by the same 0.12s they always
 *   did. Same beats, same order, same eases.
 *
 * LOOP (5.3s of story, then 4.4s of nothing — 9.7s end to end)
 *   The card's whole claim is growth, so the loop is the line growing. After a
 *   beat the curve retracts right to left in half a second, then draws itself
 *   back over 2.2s with a lit dot riding the drawing edge — 560 design pixels of
 *   travel, the full width of the artwork. The marker blooms as the edge reaches
 *   it, the lightning badge and the pie lift, the pill lifts with them and the
 *   bonus figure counts itself up to $200.00 beside the deposit. Then the card
 *   rests, settled on exactly the artwork the design ships.
 *
 * THE CROP (and why the draw is not simply "the whole path")
 *   The landscape card hangs the 563-wide chart well off its right edge only,
 *   so all but the last eight design pixels of the curve are on the card. The
 *   PHONE frame (Figma 526:261) hangs the same well 110 design pixels off the
 *   LEFT edge as well as 61 off the right, which puts roughly a third of the
 *   path outside the card. Drawn tip to tail, the loop would then spend its
 *   first half second and its last quarter second growing a line nobody can
 *   see, and the lit dot would fade in off the card and fade out off it again.
 *   So the draw is measured against the card's own clip and runs over the
 *   VISIBLE arc: same beats, same durations, same easing, just mapped onto the
 *   part of the curve a person is looking at. Where the crop is negligible --
 *   the landscape card, inside EDGE_TOL below -- the measurement collapses to
 *   0 and `total` and every tween here is the one that shipped, which is why
 *   the desktop card is byte-identical rather than merely close.
 *
 * Nothing is re-parented or cloned out of the shipped `<svg>`: the design's line
 * carries `stroke="url(#box-bonus-stroke)"`, which resolves against
 * `#box-bonus-stroke` in that svg's own `<defs>`, and moving either out of that
 * subtree would drop the gradient silently. The added dot lives inside the same
 * svg and carries a flat fill, so it depends on no def at all.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../../lib/motion';
import { tok } from '../../../lib/theme';
import { bandStaged, onSectionReady, pct, pulse, q1, unitOf, whileVisible } from './shared';

const NS = 'http://www.w3.org/2000/svg';
/** The chart's viewBox width — one user unit is one design pixel. */
const CHART_W = 564.087;
const money = (v: number) => `+$${v.toFixed(2)}`;

/** How much of the path may be cropped before the draw is remapped, as a
 *  fraction of its length. The landscape card loses 8.5 design px of flat tail
 *  at its right edge and half a pixel at its left -- about 1.4% and 0.08% of
 *  the arc -- and remapping for that would retime a tween that has nothing
 *  wrong with it. A phone loses 20% at one end and 11% at the other. Three per
 *  cent sits an order of magnitude clear of both. */
const EDGE_TOL = 0.03;
/** How long the line takes to draw itself on the way in. */
const INTRO_DRAW = 1.0;

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

  /* Build-time colour reads; see the note in funds.ts. Two of the three mean
     "lit", and both invert on paper: the dot riding the drawing edge has to
     beat the line it is drawing for 560 design pixels, and the marker's bloom
     has to press into the card rather than off it. */
  const C = {
    head: tok('--bento-bn-head', '#ffd0b8'),
    pillLit: tok('--bento-bn-pill-lit', 'rgba(255, 138, 92, 0.75)'),
    markerLit: tok('--bento-bn-marker-lit', 'brightness(1.5)'),
  };

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
  const u = unitOf(chart, CHART_W);
  const chartLeft = chart.getBoundingClientRect().left;

  /* Where the marker's halo sits on the curve, measured off the DOM so it holds
     at every breakpoint rather than assuming the card is at its design width. */
  const markerX = (marker.getBoundingClientRect().left + marker.getBoundingClientRect().width / 2
    - chartLeft) / u;
  const markerLen = lengthAtX(line, total, markerX);

  /* The visible arc. Two boxes clip this curve -- the card and the artwork well
     inside it -- and which of them bites is the whole difference between the
     two frames, so the window is their intersection measured off the DOM rather
     than a breakpoint the script would have to be told about. Both edges are
     snapped to the ends of the path when the crop is under EDGE_TOL, so the
     landscape card produces exactly 0 and `total`. */
  const art = q1(card, '.box-bonus__art');
  const clip = card.getBoundingClientRect();
  const well = art ? art.getBoundingClientRect() : clip;
  const drawFromRaw = lengthAtX(line, total, (Math.max(clip.left, well.left) - chartLeft) / u);
  const drawToRaw = lengthAtX(line, total, (Math.min(clip.right, well.right) - chartLeft) / u);
  const drawFrom = drawFromRaw < total * EDGE_TOL ? 0 : drawFromRaw;
  const drawTo = drawToRaw > total * (1 - EDGE_TOL) ? total : drawToRaw;
  const span = Math.max(drawTo - drawFrom, 1);
  /* `stroke-dasharray` stays the whole path in both states; only the offset
     moves. At `total - drawFrom` the drawn run ends where the card's left edge
     begins, so the card reads empty; at `total - drawTo` it reaches the right
     edge, so the card reads complete. On desktop these are `total` and 0. */
  const OFF_HIDDEN = total - drawFrom;
  const OFF_SHOWN = total - drawTo;
  /** Where along the DRAW the edge passes arc length `len`, 0..1. */
  const at = (len: number) => Math.min(Math.max((len - drawFrom) / span, 0), 1);
  const markerAt = at(markerLen);

  /* The lit dot that rides the drawing edge. Same svg, flat fill, no def. */
  const head = document.createElementNS(NS, 'circle');
  head.setAttribute('r', '5');
  head.setAttribute('fill', C.head);
  head.style.opacity = '0';
  chart.appendChild(head);

  const staged = bandStaged(card);
  let stopReady: () => void = () => {};
  let stopVisible: () => void = () => {};

  const ctx = gsap.context(() => {
    /* -------------------------------------------------------- start state */
    gsap.set(marker, { filter: 'brightness(1)', transformOrigin: '50% 12.7%' });
    gsap.set([bolt, pie], { transformOrigin: '50% 50%' });
    if (staged) {
      gsap.set(line, { strokeDasharray: total, strokeDashoffset: OFF_HIDDEN });
      gsap.set([marker, bolt, pie], { opacity: 0 });
      gsap.set(bolt, { scale: 0.92 });
      gsap.set(pie, { scale: pieScale * 0.92 });
      gsap.set(pill, { opacity: 0, y: 14 });
    }

    const tally = { deposit: 0, bonus: 0 };
    const paintDeposit = () => { deposit.textContent = money(tally.deposit); };
    const paintBonus = () => { bonusAmt.textContent = money(tally.bonus); };
    // Zeroed while the band is still held hidden, so the pill rises already at
    // nothing and the figures are counted up rather than snapping down to zero
    // a beat after they have been read. Skipped if the band is already showing.
    if (staged) { paintDeposit(); paintBonus(); }

    const edge = { p: 1 };
    const rideEdge = () => {
      const pt = line.getPointAtLength(drawFrom + edge.p * span);
      head.setAttribute('cx', String(pt.x));
      head.setAttribute('cy', String(pt.y));
    };
    rideEdge();

    /* ---------------------------------------------------------------- loop */
    const DRAW_AT = 0.8;
    const DRAW = 2.2;
    /* Every `fromTo` below states `immediateRender: false`.
       A `fromTo` renders its FROM value the moment it is created, even inside a
       paused timeline, which is right for an entrance and catastrophic here: the
       loop is built during the same call that parks the artwork at its start
       state, so a `fromTo` starting at "line fully drawn" quietly undid the
       "line not drawn yet" the load-in was about to animate away from. Measured:
       the card's first painted frame showed the curve already complete and the
       load-in's draw then tweened 0 to 0. */
    const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 4.4 });
    loop
      // a beat, then the curve pulls back — right to left, so it reads as the
      // chart winding back rather than as the artwork being switched off
      .set(line, { strokeDasharray: total }, 0)
      .fromTo(line, { strokeDashoffset: OFF_SHOWN },
        { strokeDashoffset: OFF_HIDDEN, duration: 0.55, ease: 'power2.in', immediateRender: false }, DRAW_AT)
      .to(marker, { opacity: 0, duration: 0.3, ease: 'power2.in' }, DRAW_AT)
      // and grows back, with the lit dot on its tip
      .to(line, { strokeDashoffset: OFF_SHOWN, duration: DRAW, ease: 'power2.inOut' }, DRAW_AT + 0.55)
      .fromTo(edge, { p: 0 }, { p: 1, duration: DRAW, ease: 'power2.inOut', onUpdate: rideEdge, immediateRender: false }, DRAW_AT + 0.55)
      .fromTo(head, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'sine.out', immediateRender: false }, DRAW_AT + 0.55)
      .to(head, { opacity: 0, duration: 0.4, ease: 'sine.inOut' }, DRAW_AT + 0.55 + DRAW - 0.3)
      // the marker is back on the line as soon as the edge passes its x
      .to(marker, { opacity: 1, duration: 0.45, ease: 'power2.out' },
        DRAW_AT + 0.55 + DRAW * markerAt);

    const after = DRAW_AT + 0.55 + DRAW;
    pulse(loop, marker, after - 0.15,
      { scale: 1.22, filter: C.markerLit },
      { scale: 1, filter: 'brightness(1)' }, 0.38, 0.9, 'transform');
    pulse(loop, bolt, after,
      { yPercent: pct(bolt, -16, u), scale: 1.12 }, { yPercent: 0, scale: 1 }, 0.4, 0.85, 'transform');
    pulse(loop, pie, after + 0.3,
      { yPercent: pct(pie, -14, u), scale: pieScale * 1.15 }, { yPercent: 0, scale: pieScale }, 0.4, 0.85, 'transform');
    pulse(loop, pill, after + 0.35,
      { yPercent: pct(pill, -14, u), borderColor: C.pillLit },
      { yPercent: 0, borderColor: getComputedStyle(pill).borderTopColor }, 0.45, 0.9, 'transform,borderColor');
    loop
      .call(() => { tally.bonus = 0; paintBonus(); }, undefined, after + 0.4)
      .to(tally, { bonus: 200, duration: 1.3, ease: 'power2.out', onUpdate: paintBonus }, after + 0.45);

    /* ------------------------------------------------------------- load-in */
    const runLoop = () => { stopVisible = whileVisible(card, loop); };
    const intro = gsap.timeline({ paused: true, onComplete: runLoop });
    intro
      .to(line, { strokeDashoffset: OFF_SHOWN, duration: INTRO_DRAW, ease: 'power2.inOut' }, 0)
      // The drawing edge reaches the marker at markerAt of the tween.
      .to(marker, { opacity: 1, duration: 0.4, ease: 'expo.out' }, INTRO_DRAW * markerAt)
      .to(pie, { opacity: 1, scale: pieScale, duration: 0.55, ease: 'expo.out' }, 1.05)
      .to(bolt, { opacity: 1, scale: 1, duration: 0.55, ease: 'expo.out' }, 1.18)
      .to(pill, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 1.32)
      .to(tally, { deposit: 200, duration: 0.95, ease: 'power2.out', onUpdate: paintDeposit }, 1.42)
      .to(tally, { bonus: 200, duration: 0.95, ease: 'power2.out', onUpdate: paintBonus }, 1.54);

    if (staged) stopReady = onSectionReady(card, () => intro.play());
    else { intro.progress(1, true); runLoop(); }
  }, card);

  return () => {
    stopReady();
    stopVisible();
    ctx.revert();
    head.remove();
    deposit.textContent = restingDeposit;
    bonusAmt.textContent = restingBonus;
    // The dash was only ever a way to draw the line; CSS owns it at rest.
    line.style.removeProperty('stroke-dasharray');
    line.style.removeProperty('stroke-dashoffset');
  };
}
