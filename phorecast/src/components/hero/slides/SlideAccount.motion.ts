/* Hero slide 2 — the "One account. Every market." cluster, in motion.
 *
 * The hero's shared entrance (entrance.ts → slideIn) fades and pops the whole
 * illustration as one block. This module is the detail inside that block: the
 * dashboard's own parts arriving, and then the one story beat it keeps.
 *
 * Written in the house language (src/lib/motion.ts, MOTION.md): entrances rise
 * on expo.out, tightly staggered; nothing overshoots, nothing rotates for
 * effect, nothing floats while idle. Two triggers only — the load-in and the
 * loop. Nothing here listens to the pointer.
 *
 * THE STORY THE LOOP TELLS (one beat, 9s, then it rests)
 *   1. a trade executes            → the toast swaps for a fresh notification
 *   2. it routes to the account    → the connector curves redraw downward and
 *                                    the diamond rides them into the pill
 *   3. the account acknowledges    → the "One Account" pill lifts and settles
 *   4. the market moves            → the XAU sparkline redraws and the price
 *                                    rolls to a new figure with a flash
 *   then ~4.4s of stillness before it happens again.
 *
 * GATING
 *   All four hero slides are mounted at once; only `.hero__slide.is-active` is
 *   visible. Playing on mount would spend the whole load-in behind an invisible
 *   slide, so this watches the slide's class and the illustration's visibility
 *   and only runs while both say it is on screen. Leaving resets everything to
 *   the settled design, so coming back replays the arrival.
 *
 * REST IS THE DESIGN
 *   Every tween is a `from`/`fromTo` that ends on the value CSS already holds,
 *   and clears its props afterwards. If this module never runs — reduced
 *   motion, a throw, an unmount — the illustration reads exactly as the Figma
 *   node does. Teardown puts the ticked price back to its design figure too.
 */

import { gsap } from 'gsap';
import { EASE, REDUCED, all, one } from '../../../lib/motion';
import { tok } from '../../../lib/theme';

/** One full cycle of the loop, in seconds: the beats, then a long rest. The
 *  rest is whatever is left of this after the beats, measured off the built
 *  timeline rather than written down twice — a hand-kept figure had the cycle
 *  running 0.7s short of what this constant claimed. */
const LOOP_PERIOD = 9;

/** How long after the slide goes live the detail starts, in seconds. The block
 *  entrance (slideIn) has the stage until then. */
const LEAD_IN = 0.55;
/** Quiet between the detail landing and the first loop cycle. */
const SETTLE = 0.35;

type Cleanup = () => void;

export function slideAccountMotion(root: HTMLElement): Cleanup {
  // Reduced motion: the settled design is already on screen, so there is
  // nothing to reveal and nothing to run.
  if (REDUCED) return () => {};

  const slide = root.closest<HTMLElement>('.hero__slide');

  /* ---------------------------------------------------------------- parts */
  const odds = all(root, '.sl2-pred__odds li');
  const chartNfl = one(root, '.sl2-mc--nfl .sl2-mc__chart');
  const chartXau = one(root, '.sl2-mc--xau .sl2-mc__chart');
  const charts = [chartNfl, chartXau].filter(Boolean) as HTMLElement[];
  const minis = all(root, '.sl2-mini');
  const bars = all(root, '.sl2-mini__bar span');
  const toast = one(root, '.sl2-toast');
  const tiles = all(root, '.sl2__tile');
  const bolt = one(root, '.sl2__tile--bolt');
  const conns = all(root, '.sl2__conn');
  const diamond = one(root, '.sl2__diamond');
  const pill = one(root, '.sl2__pill');
  const disc = one(root, '.sl2__pill-disc');
  const price = one(root, '.sl2-mc--xau .sl2-mc__price');

  /* The ticking price. Only the leading text node moves — the dim decimals in
     the <span> are left as designed — and the original figure is kept so
     teardown can hand the verified number back. */
  const priceNode = price?.firstChild?.nodeType === Node.TEXT_NODE ? (price.firstChild as Text) : null;
  const priceBase = priceNode?.nodeValue ?? '';
  const priceValue = Number(priceBase.replace(/,/g, ''));

  /* The flash, read from :root at build time next to the priceInk read below,
     which is what tok() is for. SlideAccount re-runs this module when the theme
     epoch changes (see SlideAccount.tsx), so both are re-read together and the
     flash can never be the other theme's colour. The hardcoded values stay as
     the fallbacks. On paper #00c950 is 2.15:1 -- a price rise nobody can see --
     so light collapses the pair onto --pos and --neg. */
  const flashUp = tok('--hero-sl2-up', '#00c950');
  const flashDown = tok('--hero-sl2-down', '#e7000b');

  function tickPrice(): '' | string {
    if (!priceNode || !Number.isFinite(priceValue) || priceValue === 0) return '';
    const next = priceValue * (1 + (Math.random() - 0.45) * 0.0035);
    priceNode.nodeValue = next.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return next >= priceValue ? flashUp : flashDown;
  }

  /* Everything this module may write an inline style to, so teardown can hand
     all of it back to CSS in one call. */
  const parts = ([] as (Element | null)[])
    .concat(odds, charts, minis, bars, tiles, conns, [toast, diamond, pill, disc, price])
    .filter(Boolean) as Element[];

  /* The settled ink of the price, read before anything is tweened, so the
     flash has somewhere exact to return to. */
  const priceInk = price ? getComputedStyle(price).color : '';

  /* Tweens started from inside a callback, which no timeline owns, held so
     teardown can kill them. Finished ones are dropped as new ones arrive —
     otherwise a page left open all day collects one per cycle. */
  const spawned: gsap.core.Tween[] = [];
  const spawn = (t: gsap.core.Tween) => {
    for (let i = spawned.length - 1; i >= 0; i--) if (!spawned[i].isActive()) spawned.splice(i, 1);
    spawned.push(t);
    return t;
  };

  /* Distances are CSS pixels, not design units, so the beat reads the same on a
     laptop and on a 4K panel. They are the house's travel (10–30px) at the top
     of its range: this cluster is the largest thing on the slide and a 4px
     nudge inside it is invisible. */
  const D = {
    oddsRise: 18,
    miniRise: 20,
    toastRise: 26,
    toastSwap: 34,
    pillRise: 22,
    pillLift: 12,
    diamondRide: 58,
  };

  /* ------------------------------------------------------------- load-in */
  function buildIn(): gsap.core.Timeline {
    const tl = gsap.timeline({ paused: true, defaults: { ease: EASE } });

    // The prediction card's odds resolve first: it is the one card a person
    // reads, so it gets the stage before anything else moves.
    if (odds.length) {
      tl.from(odds, { y: D.oddsRise, opacity: 0, duration: 0.9, stagger: 0.16, clearProps: 'transform,opacity' }, 0);
    }

    // Sparklines draw left to right. They are <img> SVGs, so there is no path
    // to dash — a clip-path sweep is the same gesture without inlining the
    // artwork.
    charts.forEach((c, i) => {
      tl.fromTo(c,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'power2.inOut', clearProps: 'clipPath' },
        0.25 + i * 0.2);
    });

    if (minis.length) {
      tl.from(minis, { y: D.miniRise, opacity: 0, duration: 0.95, stagger: 0.14, clearProps: 'transform,opacity' }, 0.3);
    }

    // The two market bars fill from their left edge, which is the number the
    // card is actually about.
    if (bars.length) {
      tl.fromTo(bars,
        { scaleX: 0, transformOrigin: '0% 50%' },
        { scaleX: 1, duration: 0.9, stagger: 0.12, ease: EASE, clearProps: 'transform' },
        0.7);
    }

    // The toast is a notification: it arrives from below rather than fading up
    // where it already sits.
    if (toast) tl.from(toast, { y: D.toastRise, opacity: 0, duration: 1.0, clearProps: 'transform,opacity' }, 0.95);
    if (tiles.length) {
      tl.from(tiles, { scale: 0.72, opacity: 0, duration: 0.7, stagger: 0.12, transformOrigin: '50% 50%', clearProps: 'transform,opacity' }, 1.1);
    }

    // The link to the account draws downward, tip to tail — both curves run
    // from the cards at the top to the pill at the bottom, so a vertical wipe
    // is the direction the ink travels.
    conns.forEach((c, i) => {
      tl.fromTo(c,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power2.inOut', clearProps: 'clipPath' },
        1.2 + i * 0.08);
    });

    if (pill) tl.from(pill, { y: D.pillRise, opacity: 0, duration: 1.0, clearProps: 'transform,opacity' }, 1.45);
    if (disc) tl.from(disc, { scale: 0.84, duration: 0.9, transformOrigin: '50% 50%', clearProps: 'transform' }, 1.5);
    // 6px of accent, which is the only place back.out belongs.
    if (diamond) {
      tl.fromTo(diamond,
        { opacity: 0, scale: 0.4 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', transformOrigin: '50% 50%', clearProps: 'opacity,scale' },
        2.0);
    }

    return tl;
  }

  /* ---------------------------------------------------------------- loop */
  function buildLoop(): gsap.core.Timeline {
    // Every fromTo here carries immediateRender: false. Without it GSAP writes
    // each tween's start value the instant the timeline is built, not when the
    // playhead reaches it: the cycle opened with the connectors clipped to
    // nothing, the sparkline erased and the diamond parked 58px high, all of it
    // holding for seconds before its turn came. A still of the illustration has
    // to read as the approved design at every moment except the one it is
    // actually animating through.
    const tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: EASE } });

    // 1 — a trade executes. The old notification drops away and the new one
    //     arrives. 0.4s of the 9s cycle is the only time the toast is not
    //     sitting exactly where the design puts it.
    if (toast) {
      tl.to(toast, { y: D.toastSwap, opacity: 0, duration: 0.42, ease: 'power2.in' }, 0)
        .fromTo(toast,
          { y: D.toastSwap, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.95, ease: EASE, immediateRender: false, clearProps: 'transform,opacity' },
          0.5);
    }
    if (bolt) {
      tl.fromTo(bolt,
        { scale: 0.86 },
        { scale: 1, duration: 0.6, ease: EASE, transformOrigin: '50% 50%', immediateRender: false, clearProps: 'transform' },
        0.72);
    }

    // 2 — it routes into the account. The curves redraw downward and the
    //     diamond rides them the last stretch into the pill.
    conns.forEach((c, i) => {
      tl.fromTo(c,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power2.inOut', immediateRender: false, clearProps: 'clipPath' },
        1.45 + i * 0.06);
    });
    if (diamond) {
      tl.fromTo(diamond,
        { y: -D.diamondRide, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power2.inOut', immediateRender: false, clearProps: 'transform,opacity' },
        1.5);
    }

    // 3 — the account acknowledges: one lift, then back down to rest.
    if (pill) {
      tl.to(pill, { y: -D.pillLift, duration: 0.45, ease: 'power2.out' }, 2.35)
        .to(pill, { y: 0, duration: 0.8, ease: 'sine.inOut', clearProps: 'transform' }, 2.8);
    }
    if (disc) {
      tl.to(disc, { scale: 1.08, duration: 0.45, ease: 'power2.out', transformOrigin: '50% 50%' }, 2.35)
        .to(disc, { scale: 1, duration: 0.8, ease: 'sine.inOut', clearProps: 'transform' }, 2.8);
    }

    // 4 — and the market moves on it. The gold sparkline redraws and the price
    //     rolls to a new figure, flashed in the direction it went.
    if (chartXau) {
      tl.fromTo(chartXau,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'power2.inOut', immediateRender: false, clearProps: 'clipPath' },
        3.0);
    }
    if (price && priceNode) {
      tl.fromTo(price,
        { yPercent: 0, opacity: 1 },
        { yPercent: -60, opacity: 0, duration: 0.26, ease: 'power2.in', immediateRender: false },
        3.15)
        // The flash is spawned rather than written into the timeline: which way
        // the price went is decided in this callback, and a tween built once
        // would replay the first cycle's colour for ever.
        .call(() => {
          const flash = tickPrice();
          if (flash) spawn(gsap.fromTo(price, { color: flash }, { color: priceInk, duration: 0.9, ease: 'power2.out', clearProps: 'color' }));
        }, undefined, 3.41)
        .fromTo(price,
          { yPercent: 60, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', immediateRender: false, clearProps: 'transform,opacity' },
          3.43);
    }

    // Rest fills the cycle out to its full period.
    tl.repeatDelay(Math.max(0, LOOP_PERIOD - tl.duration()));
    return tl;
  }

  /* -------------------------------------------------------- run / suspend */
  let tlIn: gsap.core.Timeline | undefined;
  let tlLoop: gsap.core.Timeline | undefined;
  let startTimer = 0;
  let loopTimer = 0;
  let running = false;
  let dead = false;

  function stop(): void {
    window.clearTimeout(startTimer);
    window.clearTimeout(loopTimer);
    startTimer = 0;
    loopTimer = 0;
    tlLoop?.kill();
    tlIn?.kill();
    tlLoop = undefined;
    tlIn = undefined;
    spawned.splice(0).forEach((t) => t.kill());
    // Killing a tween leaves its target wherever it stood, so the settled
    // design is restored by hand: every inline property any of this could have
    // written, cleared. The rest state lives in CSS, so clearing IS the reset —
    // including the CSS transforms on the mirrored connector and the diamond,
    // which are never inline and so survive untouched.
    if (parts.length) gsap.set(parts, { clearProps: 'transform,opacity,clipPath,color,willChange' });
    if (priceNode && priceBase) priceNode.nodeValue = priceBase;
    delete root.dataset.sl2Motion;
    running = false;
  }

  function play(): void {
    if (running || dead) return;
    running = true;
    root.dataset.sl2Motion = 'on';

    tlIn = buildIn();
    startTimer = window.setTimeout(() => {
      tlIn?.play(0);
      loopTimer = window.setTimeout(() => {
        if (dead) return;
        tlLoop = buildLoop();
        tlLoop.play(0);
      }, ((tlIn?.duration() ?? 0) + SETTLE) * 1000);
    }, LEAD_IN * 1000);
  }

  /* On screen means: this slide is the carousel's active one, and the hero
     itself is in the viewport. */
  let visible = true;
  const isLive = () => (!slide || slide.classList.contains('is-active')) && visible;

  const sync = () => { if (isLive()) play(); else stop(); };

  // The carousel toggles `is-active` on the slide; nothing dispatches an event
  // for it, so the class itself is the signal.
  const mo = slide ? new MutationObserver(sync) : undefined;
  mo?.observe(slide as HTMLElement, { attributes: true, attributeFilter: ['class'] });

  // Scrolled past the hero, the loop has no audience. Killing it there is the
  // house rule and keeps the tab cheap.
  let io: IntersectionObserver | undefined;
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: 0 });
    io.observe(root);
  }

  sync();

  return () => {
    dead = true;
    mo?.disconnect();
    io?.disconnect();
    stop();
  };
}
