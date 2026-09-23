/* Hero slide 2 — the "One account. Your keys." cluster, in motion.
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
 *   then 5.40s of stillness before it happens again (desktop; the phone's
 *   shorter beats rest 6.30s).
 *
 * THE DESKTOP BEAT SHEET, in seconds from the slide going live
 *   The carousel leaves every slide at 7.00 (AUTOPLAY_MS in Hero.tsx), and
 *   leaving stops the loop and snaps whatever is mid-flight back to rest in
 *   full view of the cross-fade. So the first cycle has to land, all of it,
 *   with a breath to spare. It used to run to 7.55: the chart was half drawn
 *   and the new price a third of the way in when the slide left.
 *
 *     0.55        the detail entrance starts (slideIn's block pop has 0.55)
 *     2.70–3.12   the old toast drops away   ← the first cycle opens 0.35s
 *                                              before the entrance ends, as
 *                                              the diamond lands
 *     3.05        the entrance's last beat (the diamond) is down
 *     3.20–4.15   the fresh toast rises
 *     3.42–4.02   the bolt pops
 *     3.80–4.71   the curves redraw downward
 *     3.85–4.75   the diamond rides them into the pill
 *     4.70–5.15   the pill lifts
 *     5.15–5.95   the pill settles
 *     5.15–6.30   the XAU sparkline redraws  ← the market moves at the top
 *                                              of the lift
 *     5.30–5.56   the price rolls out, the new figure at 5.56
 *     5.58–6.08   the price rolls in
 *     6.30–7.00   still: 0.70s of rest before the slide changes
 *
 *   It was fitted by closing gaps, not by speeding anything up: every beat
 *   keeps the duration and ease it had. The settle between the entrance and
 *   the loop became an overlap (-0.70), the curves leave once the fresh toast
 *   has landed rather than when its tween formally ends (-0.35), and the chart
 *   starts at the top of the pill's lift rather than 0.2s into its settle
 *   (-0.20).
 *
 * TWO COMPOSITIONS, TWO SEQUENCES
 *   Below 720px SlideAccount.css does not shrink the illustration, it drops
 *   most of it: the prediction card, the two event cards and the action bar go
 *   (the argument is written out over THE PHONE COMPOSITION in that file), and
 *   what is left is the two market cards, the two connector curves, the
 *   diamond and the pill. The dropped parts are dropped with `display: none`,
 *   so they are still IN THE DOM and every `querySelector` here still finds
 *   them -- which is exactly how this module came to be timing beats nothing
 *   could see. Measured at 390 before the phone branch existed: the first
 *   visible movement was 768ms after the sequence started, the two market
 *   cards never moved at all, and the loop spent its first 1435ms on a toast
 *   swap and a bolt pop that are not on the page. So the cast is asked of the
 *   layout (see `onPhone`) and each timeline is built for the cast that is
 *   actually there. The phone got its own beats rather than a trimmed copy
 *   of the desktop's, and the two timetables are kept apart below.
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
 *  running 0.7s short of what this constant claimed. Only a held slide (the
 *  pause control, keyboard focus in the carousel) ever sees a second cycle;
 *  the running carousel leaves at 7s, inside the first one's rest. */
const LOOP_PERIOD = 9;

/** How long after the slide goes live the detail starts, in seconds. The block
 *  entrance (slideIn) has the stage until then. */
const LEAD_IN = 0.55;
/** Where the first loop cycle starts, in seconds from the END of the detail's
 *  entrance, per composition. The phone rests a beat first. The desktop
 *  cannot afford to: its cycle is 0.9s longer, and resting here pushed its
 *  last beats past the carousel's 7s. So its first beat, the old toast
 *  dropping away, starts under the entrance's last one instead. That exit is
 *  power2.in, so it has barely moved 0.15s in, which puts the toast visibly
 *  leaving just as the diamond lands at the entrance's end, not beside it. */
const SETTLE = { phone: 0.35, desktop: -0.35 };

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

  /* The two market cards. They are in BOTH compositions, and on a phone they
     are the largest thing left, so that is where the phone's entrance starts.
     The desktop never tweens them — its lead is the prediction card's odds —
     and nothing below changes that. */
  const cardNfl = one(root, '.sl2-mc--nfl');
  const cardXau = one(root, '.sl2-mc--xau');

  /* The three groups the phone drops, held so the question below can be put to
     the layout instead of to a copy of the breakpoint. */
  const pred = one(root, '.sl2-pred');
  const minisWrap = one(root, '.sl2__minis');
  const actions = one(root, '.sl2__toasts');

  /* Does this element have boxes? `display: none` is the only thing that takes
     them away, and it is exactly what the phone block uses; the inactive slide
     is `visibility: hidden` and the hero's pending gate is `visibility: hidden`
     too, so both keep their boxes and neither can be mistaken for a drop. */
  const shown = (el: Element | null) => !!el && el.getClientRects().length > 0;

  /* WHICH COMPOSITION, asked of the layout rather than of a media query. A
     `matchMedia('(max-width: 720px)')` here would be a second copy of
     SlideAccount.css's breakpoint, free to drift from it the day the
     breakpoint moves; whether the parts are on the page cannot drift from the
     stylesheet, because it IS the stylesheet's answer.

     The `shown(cardXau)` clause is not decoration. Without it an illustration
     hidden wholesale — a display:none ancestor, a detached subtree, a browser
     that has not laid out yet — reads as "the dropped parts are missing" and a
     desktop would be handed the phone's beats. The market cards survive both
     compositions, so they are the proof that there is a composition at all. */
  const onPhone = () => shown(cardXau) && !shown(pred) && !shown(minisWrap) && !shown(actions);

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
    .concat(odds, charts, minis, bars, tiles, conns, [toast, diamond, pill, disc, price, cardNfl, cardXau])
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
    /* The phone's lead. A market card is 200 design units wide and renders
       around 188px there, so 22px is the same proportion of its own body that
       oddsRise is of a row of odds — short travel over a long duration, the
       house's whole point. */
    cardRise: 22,
  };

  /* --------------------------------------------------- load-in, the phone
     The desktop's lead — the prediction card's odds — is not on the page here,
     and neither are the minis, the bars, the toast or the tiles, so five of its
     ten beats animate nothing. This is the same arrival re-cast for the six
     objects that remain, in the order the eye reads them: the left card, the
     right card, their two sparklines, the two curves that fall away from them,
     and the account they fall into.

       0.00  NFL card rises            1.25s   ← the lead, alone on the stage
       0.38  XAU card rises            1.10s   ← the pause MOTION.md asks for
       0.60  NFL sparkline sweeps      1.15s
       0.84  XAU sparkline sweeps      1.15s
       1.30  left curve draws down     1.00s
       1.40  right curve draws down    1.00s
       1.62  One Account pill rises    1.00s
       1.70  its disc settles open     0.90s
       2.20  the diamond lands         0.50s   ends 2.70

     2.7s end to end, inside the 2.5–4s the house asks for, and every one of
     its beats is on something the phone can actually show. */
  function phoneIn(tl: gsap.core.Timeline): gsap.core.Timeline {
    // One object arrives and is allowed to land. The NFL card is leftmost, so
    // it is read first, and on a phone it is half the illustration — the
    // largest single thing the slide has left. It leads; the gold card follows
    // it a third of a second later rather than beside it.
    if (cardNfl) tl.from(cardNfl, { y: D.cardRise, opacity: 0, duration: 1.25, clearProps: 'transform,opacity' }, 0);
    if (cardXau) tl.from(cardXau, { y: D.cardRise, opacity: 0, duration: 1.1, clearProps: 'transform,opacity' }, 0.38);

    // Then each card's own line draws inside it, in the order the cards
    // arrived. `charts` is [NFL, XAU], which is that order.
    charts.forEach((c, i) => {
      tl.fromTo(c,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'power2.inOut', clearProps: 'clipPath' },
        0.6 + i * 0.24);
    });

    // The curves fall away from the cards, left one first — it hangs under the
    // NFL card, the right one under the gold card, so the pair carries the
    // same left-to-right reading down to the pill.
    conns.forEach((c, i) => {
      tl.fromTo(c,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: 'power2.inOut', clearProps: 'clipPath' },
        1.3 + i * 0.1);
    });

    // The destination. Same three beats as the desktop, and the same values —
    // only their places in the cycle differ.
    if (pill) tl.from(pill, { y: D.pillRise, opacity: 0, duration: 1.0, clearProps: 'transform,opacity' }, 1.62);
    if (disc) tl.from(disc, { scale: 0.84, duration: 0.9, transformOrigin: '50% 50%', clearProps: 'transform' }, 1.7);
    // 6px of accent, which is the only place back.out belongs.
    if (diamond) {
      tl.fromTo(diamond,
        { opacity: 0, scale: 0.4 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', transformOrigin: '50% 50%', clearProps: 'opacity,scale' },
        2.2);
    }

    return tl;
  }

  /* ------------------------------------------------------------- load-in */
  function buildIn(): gsap.core.Timeline {
    const tl = gsap.timeline({ paused: true, defaults: { ease: EASE } });

    if (onPhone()) return phoneIn(tl);

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

    /* WHERE THE BEATS SIT, per composition. Beat 1 is the action bar, which
       the phone does not have, so the phone opens on the route beat at 0.

       The desktop column is its own, not the phone's plus an offset, and it
       is tighter in two places, both to fit the first cycle inside the
       carousel's 7s (the beat sheet at the top of this file):
         - the curves leave at 1.10, not when the fresh toast's tween formally
           ends at 1.45. It is expo.out: within 2px of home by 0.90 and 0.4px
           by 1.10, so the last 0.35s of that tween moves nothing anyone can
           see, and the curves still wait a beat after the toast reads as
           landed.
         - the chart starts at the top of the pill's lift (settle), not 0.2s
           into its way back down. The account acknowledges and the market
           moves on it; the sweep is power2.inOut, so its first 0.2s draws
           only a sliver and the move reads as following the lift.
       Everything between keeps its spacing: the diamond 0.05 behind the
       curves, the lift 0.05 before the diamond lands, the price 0.15 into
       the chart. The phone column is untouched: its first cycle already ends
       inside the 7s, and it is the phone's own. */
    const phone = onPhone();
    const at = phone
      ? { conn: 0, diamond: 0.05, lift: 0.9, settle: 1.35, chart: 1.55, priceOut: 1.7, tick: 1.96, priceIn: 1.98 }
      : { conn: 1.1, diamond: 1.15, lift: 2.0, settle: 2.45, chart: 2.45, priceOut: 2.6, tick: 2.86, priceIn: 2.88 };

    // 1 — a trade executes. The old notification drops away and the new one
    //     arrives. 0.4s of the 9s cycle is the only time the toast is not
    //     sitting exactly where the design puts it.
    //
    //     Skipped on a phone: the action bar is dropped there, so this beat
    //     and the bolt's below used to open every cycle with 1.45s in which
    //     nothing on the page moved. The route beat leads instead.
    if (!phone && toast) {
      tl.to(toast, { y: D.toastSwap, opacity: 0, duration: 0.42, ease: 'power2.in' }, 0)
        .fromTo(toast,
          { y: D.toastSwap, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.95, ease: EASE, immediateRender: false, clearProps: 'transform,opacity' },
          0.5);
    }
    if (!phone && bolt) {
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
        at.conn + i * 0.06);
    });
    if (diamond) {
      tl.fromTo(diamond,
        { y: -D.diamondRide, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power2.inOut', immediateRender: false, clearProps: 'transform,opacity' },
        at.diamond);
    }

    // 3 — the account acknowledges: one lift, then back down to rest.
    if (pill) {
      tl.to(pill, { y: -D.pillLift, duration: 0.45, ease: 'power2.out' }, at.lift)
        .to(pill, { y: 0, duration: 0.8, ease: 'sine.inOut', clearProps: 'transform' }, at.settle);
    }
    if (disc) {
      tl.to(disc, { scale: 1.08, duration: 0.45, ease: 'power2.out', transformOrigin: '50% 50%' }, at.lift)
        .to(disc, { scale: 1, duration: 0.8, ease: 'sine.inOut', clearProps: 'transform' }, at.settle);
    }

    // 4 — and the market moves on it. The gold sparkline redraws and the price
    //     rolls to a new figure, flashed in the direction it went.
    if (chartXau) {
      tl.fromTo(chartXau,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'power2.inOut', immediateRender: false, clearProps: 'clipPath' },
        at.chart);
    }
    if (price && priceNode) {
      tl.fromTo(price,
        { yPercent: 0, opacity: 1 },
        { yPercent: -60, opacity: 0, duration: 0.26, ease: 'power2.in', immediateRender: false },
        at.priceOut)
        // The flash is spawned rather than written into the timeline: which way
        // the price went is decided in this callback, and a tween built once
        // would replay the first cycle's colour for ever.
        .call(() => {
          const flash = tickPrice();
          if (flash) spawn(gsap.fromTo(price, { color: flash }, { color: priceInk, duration: 0.9, ease: 'power2.out', clearProps: 'color' }));
        }, undefined, at.tick)
        .fromTo(price,
          { yPercent: 60, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', immediateRender: false, clearProps: 'transform,opacity' },
          at.priceIn);
    }

    /* Rest fills the cycle out to its full period. Both compositions keep the
       same 9s period, so the phone — whose beats run 2.70s against the
       desktop's 3.60 — rests 6.30s where the desktop rests 5.40. Neither
       reaches the end of that rest while the carousel is running: it moves on
       after 7s (AUTOPLAY_MS in Hero.tsx) and leaving the slide stops the loop,
       so what either shows is its beats finishing about 6.3s into the slide's
       7s and a breath of stillness before the slide changes. The full rest is
       only ever seen by a reader holding the hero, which is where a long rest
       belongs. Tightening the desktop's first cycle did not shorten its
       period: the cycle after it still starts 9s after it did. Shorten the
       phone's period deliberately if that ever needs to match the desktop's
       rest; do not shorten LOOP_PERIOD, which both compositions read. */
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
    // Asked when the entrance is built, the same moment buildIn asks. A
    // composition that flips later restarts the whole run (see the
    // ResizeObserver below), so the two answers cannot disagree.
    const settle = onPhone() ? SETTLE.phone : SETTLE.desktop;
    startTimer = window.setTimeout(() => {
      tlIn?.play(0);
      loopTimer = window.setTimeout(() => {
        if (dead) return;
        tlLoop = buildLoop();
        tlLoop.play(0);
      }, Math.max(0, (tlIn?.duration() ?? 0) + settle) * 1000);
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

  /* Which cast exists is decided when each timeline is BUILT, so a composition
     that changes under a running sequence — a phone turned on its side, a
     desktop window dragged past 720, a zoom — has to rebuild or it goes on
     playing the other composition's beats. The thing that changes is the
     illustration's own box, so that is what is watched: a ResizeObserver on
     `.sl2` cannot disagree with the breakpoint the way a `matchMedia` list
     could. It fires on every width, not only on a crossing, so the flip is
     what is compared and a plain resize costs one `getClientRects` and
     nothing else.
     `stop()` then `sync()` is the same restart the carousel's class toggle
     takes, so the new composition gets its entrance from the top exactly as it
     would have on a fresh load. */
  let cast = onPhone();
  let ro: ResizeObserver | undefined;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      const now = onPhone();
      if (now === cast) return;
      cast = now;
      if (!running) return;
      stop();
      sync();
    });
    ro.observe(root);
  }

  sync();

  return () => {
    dead = true;
    mo?.disconnect();
    io?.disconnect();
    ro?.disconnect();
    stop();
  };
}
