// Hero slide 3 — "Half this stack is on us."
//
// The slide makes one argument: you put in $200, Phorcast matches it, you trade
// with $400. So the motion tells that, once, and then stops: value leaves the
// deposit stack, travels the dashed connector, and the matched plates take it.
//
// House rules (src/lib/motion.ts, MOTION.md): entrances rise on expo.out and are
// allowed to land before the next thing starts; the loop is one deterministic
// story beat followed by a long rest; `prefers-reduced-motion` reveals
// everything and runs nothing. Two triggers only — the load-in and the loop.
// Nothing here listens to the pointer.
//
// The stacks ship from Figma as one vector layer. It is inlined by SlideBonus
// rather than dropped in an <img> so the individual plates are addressable:
// #deposit-block-01..06 (the left wireframe, bottom first), #balance-block-01..12
// (the right wireframe) and twelve #Vector* paths that make up the four solid
// matched plates — three faces each, grouped in PLATES below. Inside the SVG a
// unit of translation is one viewBox unit, which is 0.9993 CSS px at the 1800px
// content column, so the numbers below read as design pixels either side.

import { gsap } from 'gsap';
import { EASE, REDUCED, all, one } from '../../../lib/motion';

/** The four solid plates, top of the stack first; each is three painted faces. */
const PLATES = [
  ['Vector', 'Vector_3', 'Vector_6'],
  ['Vector_4', 'Vector_7', 'Vector_2'],
  ['Vector_5', 'Vector_11', 'Vector_8'],
  ['Vector_10', 'Vector_12', 'Vector_9'],
] as const;

/** Distance along the dashed connector, start diamond to end diamond, in design px. */
const WIRE = 521.243 - 190.243;
/** The spark's own width in design px, from .sl3__spark. */
const SPARK = 11;
/**
 * The crossing, as a percentage of the spark's own width. Everything in this
 * illustration is laid out in design px times `--u`, and `--u` is a fraction of
 * the content column -- one CSS px at 1920, three quarters of one at 1440. A
 * travel written as 331px would therefore overshoot the connector by a third at
 * any narrower width. The spark is 11 design px wide, so `xPercent` carries the
 * same scaling the layout has and lands on the far diamond at every width.
 */
const TRAVEL = (WIRE / SPARK) * 100;

/** One full turn of the loop, including the rest at the end of it. */
const LOOP_PERIOD = 9;

/**
 * Hand the element back to CSS once it has landed. Without it every part the
 * entrance touched keeps an inline identity transform, and Chromium rasterises
 * a hairline stroke differently with one than without: the settled illustration
 * came out 5.6% of its pixels away from the pre-animation capture, all of it on
 * the stacks' 0.42px strokes. With it the settled state is pixel-identical.
 */
const SETTLE = { clearProps: 'transform,transformOrigin,opacity' } as const;

const byId = <T extends Element>(scope: ParentNode, id: string) =>
  scope.querySelector<T>(`[id="${id}"]`);

/**
 * Runs `run` whenever the slide this element sits in is the active one, and
 * tears it down again when it is not. Every slide stays mounted — the inactive
 * ones are `visibility: hidden` — so without this the sequence would play
 * unseen at page load and the loop would run forever behind another slide.
 * An IntersectionObserver cannot answer this; it does not see `visibility`.
 */
function whileActive(root: HTMLElement, run: (root: HTMLElement) => () => void): () => void {
  const slide = root.closest<HTMLElement>('.hero__slide');
  if (!slide) return run(root);

  let stop: (() => void) | undefined;
  const sync = () => {
    const on = slide.classList.contains('is-active');
    if (on && !stop) stop = run(root);
    else if (!on && stop) { stop(); stop = undefined; }
  };

  const mo = new MutationObserver(sync);
  mo.observe(slide, { attributes: true, attributeFilter: ['class'] });
  sync();

  return () => { mo.disconnect(); stop?.(); };
}

/** The illustration: the two stacks, the connector and the bonus bracket. */
export function slideBonusMotion(root: HTMLElement): () => void {
  if (REDUCED) return () => {};
  return whileActive(root, build);
}

function build(root: HTMLElement): () => void {
  const frame = one<HTMLElement>(root, '.sl3__frame');
  if (!frame) return () => {};

  // One design pixel as the frame is currently drawn: the frame is 964 design px
  // wide. Offsets on the HTML parts are written in design px and multiplied by
  // it, so they keep their proportion to the artwork at every width. The offsets
  // inside the SVG need no such thing -- a viewBox unit already scales with it.
  const u = frame.getBoundingClientRect().width / 964 || 1;

  const svg = one<SVGSVGElement>(frame, '.sl3__stacks svg');
  const deposit = svg ? all<SVGPathElement>(svg, '[id^="deposit-block-"]') : [];
  const balance = svg ? all<SVGPathElement>(svg, '[id^="balance-block-"]') : [];
  // Top plate first in PLATES; the beats below want to run bottom upwards.
  const plates = svg
    ? PLATES.map((ids) => ids.map((id) => byId<SVGPathElement>(svg, id)).filter(Boolean) as SVGPathElement[])
        .filter((g) => g.length)
        .reverse()
    : [];

  const total = one<HTMLElement>(frame, '.sl3__total');
  const bracket = one<HTMLElement>(frame, '.sl3__bracket');
  const addsLabel = one<HTMLElement>(frame, '.sl3__adds span');
  const addsValue = one<HTMLElement>(frame, '.sl3__adds strong');
  const amount = one<HTMLElement>(frame, '.sl3__amount');
  const rule = one<HTMLElement>(frame, '.sl3__rule img');
  const dotStart = one<HTMLElement>(frame, '.sl3__diamond--start');
  const dotEnd = one<HTMLElement>(frame, '.sl3__diamond--end');
  const transfer = one<HTMLElement>(frame, '.sl3__tag--transfer');
  const stock = one<HTMLElement>(frame, '.sl3__tag--stock');
  const capDeposit = one<HTMLElement>(frame, '.sl3__cap--deposit');
  const capTrade = one<HTMLElement>(frame, '.sl3__cap--trade');
  const badges = all<HTMLElement>(frame, '.sl3__badge');

  // The travelling value. Built here rather than in the markup: it belongs to
  // the motion, so if this module never runs the illustration has no stray dot
  // sitting on the connector.
  const spark = document.createElement('span');
  spark.className = 'sl3__spark';
  spark.setAttribute('aria-hidden', 'true');
  frame.appendChild(spark);

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: EASE }, delay: 0.35 });

    // -------------------------------------------------------- the deposit side
    // The left stack is what the sentence starts with, so it arrives alone and
    // is allowed to finish before the connector is drawn.
    if (deposit.length) {
      tl.from(deposit, { y: 28, opacity: 0, duration: 0.95, stagger: 0.085, ...SETTLE }, 0);
    }
    if (capDeposit) tl.from(capDeposit, { y: 14 * u, opacity: 0, duration: 0.8, ...SETTLE }, 0.3);
    if (stock) tl.from(stock, { y: 10 * u, opacity: 0, duration: 0.8, ...SETTLE }, 0.32);

    // --------------------------------------------------------- the connector
    if (rule) {
      tl.from(rule, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.85, ease: 'power2.out', ...SETTLE }, 0.55);
    }
    if (amount) tl.from(amount, { y: 14 * u, opacity: 0, duration: 0.9, ...SETTLE }, 0.55);
    if (transfer) tl.from(transfer, { y: 10 * u, opacity: 0, duration: 0.85, ...SETTLE }, 0.62);
    // Under 12px of travel, which is where the house allows an overshoot.
    if (dotStart) tl.from(dotStart, { scale: 0, duration: 0.5, ease: 'back.out(2)', ...SETTLE }, 0.55);
    if (dotEnd) tl.from(dotEnd, { scale: 0, duration: 0.5, ease: 'back.out(2)', ...SETTLE }, 1.3);

    travel(tl, spark, 0.8, 1.0);

    // ----------------------------------------------------- the matched stack
    if (balance.length) {
      tl.from(balance, { y: 30, opacity: 0, duration: 0.9, stagger: 0.055, ...SETTLE }, 1.3);
    }
    // The four matched plates rise out of the stack they are being added to, so
    // the right stack is seen growing from the deposit's height to twice it.
    plates.forEach((group, i) => {
      tl.from(group, { y: 104, opacity: 0, duration: 1.15, ...SETTLE }, 1.95 + i * 0.13);
    });

    if (total) tl.from(total, { y: 18 * u, opacity: 0, duration: 0.95, ...SETTLE }, 2.35);
    if (bracket) tl.from(bracket, { scaleY: 0.55, opacity: 0, transformOrigin: '50% 0%', duration: 0.9, ...SETTLE }, 2.45);
    if (capTrade) tl.from(capTrade, { y: 14 * u, opacity: 0, duration: 0.8, ...SETTLE }, 2.55);
    if (addsLabel) tl.from(addsLabel, { y: 14 * u, opacity: 0, duration: 0.85, ...SETTLE }, 2.6);
    if (addsValue) tl.from(addsValue, { y: 14 * u, opacity: 0, duration: 0.85, ...SETTLE }, 2.74);
    if (badges.length) {
      tl.from(badges, { y: 12 * u, scale: 0.86, opacity: 0, transformOrigin: '50% 50%', duration: 0.8, stagger: 0.16, ...SETTLE }, 2.8);
    }

    // -------------------------------------------------------------- the loop
    // One beat: the deposit leaves, crosses, and the matched plates take it.
    // The beats run for 2.85s; everything ends exactly where the settled design
    // has it, and the turn spends its remaining six seconds there.
    const loop = gsap.timeline({ repeat: -1, paused: true });

    if (amount) loop.to(amount, { y: -12 * u, duration: 0.4, ease: 'power2.out' }, 0).to(amount, { y: 0, duration: 0.55, ease: 'power2.inOut', clearProps: 'transform,transformOrigin' }, 0.4);
    if (dotStart) pulse(loop, dotStart, 0, 2.4);

    travel(loop, spark, 0.25, 1.15);

    if (dotEnd) pulse(loop, dotEnd, 1.4, 2.4);

    // The wave runs bottom to top through the matched plates: each lifts clear
    // of the one under it and seats again.
    plates.forEach((group, i) => {
      const at = 1.45 + i * 0.12;
      loop.to(group, { y: -26, duration: 0.42, ease: 'expo.out' }, at)
        .to(group, { y: 0, duration: 0.62, ease: 'power2.inOut', clearProps: 'transform,transformOrigin' }, at + 0.42);
    });

    if (total) {
      loop.to(total, { y: -14 * u, scale: 1.05, transformOrigin: '50% 100%', duration: 0.45, ease: 'power2.out' }, 1.55)
        .to(total, { y: 0, scale: 1, duration: 0.65, ease: 'power2.inOut', clearProps: 'transform,transformOrigin' }, 2.0);
    }
    if (addsValue) {
      loop.to(addsValue, { y: -16 * u, scale: 1.08, transformOrigin: '0% 50%', duration: 0.45, ease: 'power2.out' }, 1.7)
        .to(addsValue, { y: 0, scale: 1, duration: 0.65, ease: 'power2.inOut', clearProps: 'transform,transformOrigin' }, 2.15);
    }
    if (bracket) {
      loop.to(bracket, { scaleY: 1.06, transformOrigin: '50% 50%', duration: 0.45, ease: 'power2.out' }, 1.7)
        .to(bracket, { scaleY: 1, duration: 0.7, ease: 'power2.inOut', clearProps: 'transform,transformOrigin' }, 2.15);
    }

    // Whatever the beats above add up to, the turn is a fixed nine seconds, so
    // the rest at the end of it is real rest rather than an accident of timing.
    loop.repeatDelay(Math.max(0, LOOP_PERIOD - loop.duration()));

    // The load-in is allowed to settle for a beat and a half before the loop
    // takes over, so the two never read as one continuous movement.
    tl.call(() => loop.play(0), undefined, tl.duration() + 1.4);
  }, root);

  return () => {
    ctx.revert();
    spark.remove();
    // revert() puts the values back but leaves an identity transform attribute
    // on every path it touched. It paints the same, but it is one step away from
    // how the layer was exported, so the export is handed back as it was found.
    for (const path of [...deposit, ...balance, ...plates.flat()]) {
      path.removeAttribute('transform');
      path.style.removeProperty('transform-origin');
    }
  };
}

/**
 * The value crossing the connector — the one long move in the slide.
 *
 * `immediateRender: false` on both fromTos, because a fromTo writes its start
 * values the moment the timeline is built rather than when the playhead reaches
 * it. In a repeating timeline that means the start state is re-applied at the
 * top of every turn and held until the tween's own turn comes round — the loop
 * would spend its first quarter-second with the spark already parked at the left
 * end. It reads as rest here only because the spark rests invisible; it is still
 * the wrong thing to ask for, and it is what put slide 2's connectors in the
 * wrong state for a third of its cycle.
 */
function travel(tl: gsap.core.Timeline, spark: HTMLElement, at: number, duration: number) {
  tl.fromTo(
    spark,
    { xPercent: 0, scale: 0.5, rotation: 45 },
    { xPercent: TRAVEL, scale: 1, rotation: 45, duration, ease: 'power2.inOut', immediateRender: false },
    at,
  )
    .fromTo(spark, { opacity: 0 }, { opacity: 1, duration: duration * 0.22, ease: 'none', immediateRender: false }, at)
    .to(spark, { opacity: 0, duration: duration * 0.28, ease: 'none' }, at + duration * 0.72);
}

/** A diamond taking, or releasing, the value. Six design px, so it needs the scale. */
function pulse(tl: gsap.core.Timeline, el: HTMLElement, at: number, to: number) {
  tl.to(el, { scale: to, duration: 0.3, ease: 'power2.out' }, at)
    .to(el, { scale: 1, duration: 0.5, ease: 'power2.inOut', clearProps: 'transform,transformOrigin' }, at + 0.3);
}

const TILE_UNITS = [60, 24, 60] as const;

/**
 * The limited-time bonus block in the copy column. It is a clock, so it reads as
 * one: the minutes tile rolls over on a fixed beat, carrying into hours and days
 * the way a real countdown does, and the colons keep time between rolls.
 */
export function bonusCountdownMotion(root: HTMLElement): () => void {
  if (REDUCED) return () => {};
  return whileActive(root, buildCountdown);
}

/** How often the minutes tile rolls. The house ceiling for a loop turn. */
const TICK_MS = 6000;

function buildCountdown(root: HTMLElement): () => void {
  const label = one<HTMLElement>(root, '.sl3-countdown__label');
  const gift = one<HTMLElement>(root, '.sl3-countdown__gift');
  const tiles = all<HTMLElement>(root, '.sl3-countdown__tile');
  // A tile is 100 design px wide; the block's own --u is clamped against the
  // viewport, so read it back rather than assume one CSS px.
  const u = tiles.length ? tiles[0].getBoundingClientRect().width / 100 || 1 : 1;
  const colons = all<HTMLElement>(root, '.sl3-countdown__colon');
  const values = all<HTMLElement>(root, '.sl3-countdown__value');
  const settled = values.map((el) => el.textContent ?? '');

  const rolls: gsap.core.Timeline[] = [];
  let timer = 0;

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: EASE }, delay: 0.35 });
    if (label) tl.from(label, { y: 12 * u, opacity: 0, duration: 0.8, ...SETTLE }, 0);
    if (gift) tl.from(gift, { scale: 0.5, opacity: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2)', ...SETTLE }, 0.1);
    if (tiles.length) tl.from(tiles, { y: 20 * u, scale: 0.94, opacity: 0, transformOrigin: '50% 100%', duration: 0.9, stagger: 0.16, ...SETTLE }, 0.3);
    if (colons.length) tl.from(colons, { opacity: 0, duration: 0.6, stagger: 0.16 }, 0.45);

    // Read before the two endless parts below are added, because a child that
    // repeats forever takes the timeline's duration with it and both of these
    // would then be scheduled past the end of time.
    const intro = tl.duration();

    // The colons keep time. Zero travel by design — the roll below is the beat,
    // this only says the clock is running.
    if (colons.length) {
      tl.to(colons, { opacity: 0.35, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 }, intro);
    }

    // The first minute goes shortly after the tiles have landed, then every
    // TICK_MS. It has to be early: the carousel holds a slide for 7s, so a clock
    // whose first move came a tick after the tiles would never be seen moving by
    // anyone who did not stop the carousel.
    tl.call(() => {
      tick();
      timer = window.setInterval(tick, TICK_MS);
    }, undefined, intro + 2.6);
  }, root);

  /** Take one minute off the clock, carrying into hours and days. */
  function tick() {
    const read = values.map((el) => Number(el.textContent));
    if (read.some((n) => !Number.isFinite(n))) return;
    let [days, hours, minutes] = read;
    if (days === 0 && hours === 0 && minutes === 0) return;

    minutes -= 1;
    if (minutes < 0) { minutes = TILE_UNITS[2] - 1; hours -= 1; }
    if (hours < 0) { hours = TILE_UNITS[1] - 1; days -= 1; }
    const next = [days, hours, minutes];

    read.forEach((was, i) => {
      if (was === next[i]) return;
      rolls.push(rollDigit(values[i], String(next[i]).padStart(2, '0')));
    });
  }

  return () => {
    window.clearInterval(timer);
    rolls.forEach((r) => r.kill());
    ctx.revert();
    // The clock ran while it was on screen; put the approved figures back so a
    // re-entry starts from the design rather than from wherever it got to.
    values.forEach((el, i) => { el.textContent = settled[i]; gsap.set(el, { clearProps: 'all' }); });
  };
}

/**
 * The house roll — the old figure leaves upward, the new one arrives from below.
 *
 * `immediateRender: false` for the reason above: without it the arrival's start
 * values land the instant the timeline is built, so the figure is already 45%
 * down and invisible before the departure has run, and the old figure vanishes
 * instead of leaving. Only the second half of the roll was visible.
 */
function rollDigit(el: HTMLElement, next: string): gsap.core.Timeline {
  return gsap.timeline()
    .to(el, { yPercent: -45, opacity: 0, duration: 0.24, ease: 'power2.in' })
    .add(() => { el.textContent = next; })
    .fromTo(
      el,
      { yPercent: 45, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out', immediateRender: false, clearProps: 'transform,transformOrigin,opacity' },
    );
}
