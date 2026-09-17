/**
 * "Your Funds Stay in Your Control" — the ambient loop.
 *
 * The section's load-in belongs to `Fan.motion.ts`. This file owns what happens
 * *after* it has landed. It reads the markup the component already ships, adds
 * three overlay elements of its own, and removes every one of them on teardown.
 *
 * THE STORY, one beat every 11s
 * -----------------------------
 * The band is a pair of arc fans converging on the vault tile, with the markets
 * the product covers named around the edges. So the beat is the settlement path,
 * once, end to end:
 *
 *   0.00s  A market prints. One category pill lights — CRYPTO, then GEOPOLITICS,
 *          then SPORT, alternating sides so the band never leans.
 *   0.15s  The arcs carry it. A band of light leaves the outer edge of each fan
 *          and runs inward along the lines, both sides at once, 2.5s of travel.
 *   0.4s   The scattered diamonds catch the front as it passes them, outermost
 *          first — they are on the path, so they light in the order it reaches
 *          them and not a frame before.
 *   2.35s  It arrives. The tile's rim, its glass and its red cast all lift, and
 *          a shine crosses the face: the funds landed in your own custody.
 *   2.95s  The light lets go over nearly two seconds. A vault is not a strobe.
 *   ~5.0s  Everything is the Figma frame again, and stays there for 6s.
 *
 * ARCS WITHOUT MARKUP
 * -------------------
 * `Fan.tsx` ships the arcs as `<img>`, so nothing inside them is addressable and
 * no per-path travel is possible. Instead each `.fan__arcs` group gets a sweep
 * window: a narrow, soft-edged, `overflow: hidden` box holding a CLONE of that
 * group's own children, brightened and screened over the originals. The window
 * travels; the clone inside is counter-translated by the same amount, so the
 * copied arcs never move — only the lit part of them does. The clone is made
 * with `cloneNode`, keeps the shipped class names, and is positioned by the
 * shipped CSS, so this survives the arcs becoming inline `<svg>`: it would clone
 * the `<svg>` just as happily. (If they do go inline, the stronger option opens
 * up — a real `stroke-dashoffset` chase per path — and this can be replaced.)
 *
 * MEASURED, at 1600 x 950 (scripts/amplitude.mjs maths, section-relative)
 * ---------------------------------------------------------------------
 *   sweep apertures   1021px of peak travel each, opacity 0 -> 1 -> 0
 *   shine             164px across the tile face, opacity 0 -> 0.95 -> 0
 *   tile box-shadow   alpha 0.10 -> 0.50, blur 33.3 -> 42.1px
 *   tile rim          alpha 0.39 -> 0.82
 *   glass fill        alpha 0.13 -> 0.28
 *   the mark          brightness 1.00 -> 1.45, drop-shadow 0 -> 9px
 *   pill              #000 -> #e5331e, opacity 0.7 -> 1
 *   diamonds          scale 1 -> 2.1, brightness 1 -> 2.4
 * Rest band: one distinct value per element, all of them the design's.
 *
 * Nothing here floats, breathes, drifts, or reacts to the pointer. Reduced
 * motion runs none of it.
 */
import { gsap } from 'gsap';
import { REDUCED } from '../../lib/motion';

/** One full cycle: ~5s of story, the rest of it still. */
const PERIOD = 11;
/** How long after the entrance lands before the first beat. */
const SETTLE = 1.2;

/* Beat marks, in seconds from the top of a cycle. */
const PILL_ON = 0;
const SWEEP_AT = 0.15;
const SWEEP_DUR = 2.5;
const PILL_OFF = 1.9;
const ARRIVE = 2.35;
const SHINE_AT = 2.55;
const RELEASE = 2.95;

/** The brand red, as the diamonds and the arc gradients already use it. */
const HOT = '#e5331e';
const PILL_ON_FG = '#fffbf8';

/** Fraction of a fan's width the travelling light occupies. */
const BAND = 0.42;

const px = (n: number) => `${n}px`;

export function fanLoop(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const q = (sel: string) => root.querySelector<HTMLElement>(sel);
  const qa = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));

  /* ------------------------------------------------------------- handles
     Every one of these is optional. A sibling agent is rewriting the markup
     under this file; a missing hook costs its own beat and nothing else. */
  const arcGroups = qa('.fan__arcs');
  const pills = qa('.fan__pill');
  const diamonds = qa('.fan__diamond');
  const frame = q('.fan__frame') ?? root;
  const tile = q('.fan__tile');
  const glass = q('.fan__glass');
  const logo = glass?.querySelector<HTMLElement>('img') ?? null;

  let ctx: gsap.Context | undefined;
  let driver: gsap.core.Timeline | undefined;
  let story: gsap.core.Timeline | undefined;
  let io: IntersectionObserver | undefined;
  let ro: ResizeObserver | undefined;
  let watcher: MutationObserver | undefined;
  let ready = 0;
  let probe = 0;
  let started = false;
  let stopped = false;
  const mine: HTMLElement[] = [];
  const heard = () => open();

  /* ------------------------------------------------------- the sweep windows
     One per fan. `win` is the moving aperture, `inner` holds the bright copy
     and is dragged back by exactly as much as `win` goes forward. */
  interface Sweep {
    group: HTMLElement;
    win: HTMLElement;
    inner: HTMLElement;
    inward: 1 | -1;
    w: number;
    band: number;
  }
  const sweeps: Sweep[] = [];

  const buildSweeps = () => {
    arcGroups.forEach((group) => {
      const kids = Array.from(group.children) as HTMLElement[];
      if (!kids.length) return;

      const inner = document.createElement('div');
      inner.setAttribute('aria-hidden', 'true');
      inner.style.cssText =
        'position:absolute;left:0;top:0;pointer-events:none;' +
        // The copy is the same arcs, run hot: the red gradient pushed toward
        // white and desaturated a touch so the band reads as light on the line
        // rather than a second, redder line laid over the first.
        'filter:brightness(2.9) saturate(0.5);will-change:transform;';
      kids.forEach((k) => inner.appendChild(k.cloneNode(true)));

      const win = document.createElement('div');
      win.setAttribute('aria-hidden', 'true');
      win.style.cssText =
        'position:absolute;left:0;top:0;overflow:hidden;pointer-events:none;opacity:0;' +
        'mix-blend-mode:screen;will-change:transform,opacity;' +
        // Soft on both sides, so the light has no edge of its own.
        '-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 38%,#000 62%,transparent 100%);' +
        'mask-image:linear-gradient(90deg,transparent 0%,#000 38%,#000 62%,transparent 100%);';
      win.appendChild(inner);
      group.appendChild(win);
      mine.push(win);

      sweeps.push({
        group,
        win,
        inner,
        inward: group.classList.contains('fan__arcs--right') ? -1 : 1,
        w: 0,
        band: 0,
      });
    });
  };

  /** Sizes are read from the live group, so a resize needs no timeline rebuild. */
  const layout = () => {
    sweeps.forEach((s) => {
      const w = s.group.clientWidth;
      const h = s.group.clientHeight;
      if (!w || !h) return;
      s.w = w;
      s.band = Math.round(w * BAND);
      s.win.style.width = px(s.band);
      s.win.style.height = px(h);
      s.inner.style.width = px(w);
      s.inner.style.height = px(h);
    });
    // Mid-sweep a re-park would teleport the light; the aperture is already
    // being driven frame by frame and will pick the new width up next cycle.
    if (!story?.isActive()) park();
  };

  /** Both ends of a sweep, in window-x. Inward means toward the tile. */
  const from = (s: Sweep) => (s.inward === 1 ? -s.band : s.w);
  const to = (s: Sweep) => (s.inward === 1 ? s.w : -s.band);

  /** Off-beat the aperture sits at its start mark, invisible. */
  const park = () => {
    sweeps.forEach((s) => {
      gsap.set(s.win, { x: from(s), opacity: 0 });
      gsap.set(s.inner, { x: -from(s) });
    });
  };

  /* ------------------------------------------------------------- the shine
     A single pane of light crossing the tile face. It lives inside `.fan__tile`,
     whose own `overflow: hidden` and radius clip it to the tile. */
  let shine: HTMLElement | null = null;
  const buildShine = () => {
    if (!tile) return;
    const el = document.createElement('span');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText =
      'position:absolute;left:0;top:-30%;width:48%;height:160%;opacity:0;pointer-events:none;' +
      'mix-blend-mode:screen;will-change:transform,opacity;' +
      'background:linear-gradient(90deg,rgba(255,251,248,0) 0%,rgba(255,251,248,0.45) 50%,rgba(255,251,248,0) 100%);';
    tile.appendChild(el);
    mine.push(el);
    shine = el;
    gsap.set(el, { rotation: 16, xPercent: -170, transformOrigin: '50% 50%' });
  };

  /* ---------------------------------------------------------------- the story */
  const start = () => {
    if (started || stopped) return;
    started = true;

    buildSweeps();
    buildShine();
    layout();

    // Resting values are read now, with the entrance finished and its
    // `clearProps` already run, so a lift has something true to return to.
    const css = (el: HTMLElement | null, prop: 'color' | 'backgroundColor' | 'boxShadow' | 'borderColor' | 'opacity') =>
      (el ? getComputedStyle(el)[prop] : '') || '';
    const pillBg = css(pills[0] ?? null, 'backgroundColor');
    const pillFg = css(pills[0] ?? null, 'color');
    const pillOp = css(pills[0] ?? null, 'opacity') || '1';
    const tileShadow = css(tile, 'boxShadow');
    const tileBorder = css(tile, 'borderColor');
    const glassBg = css(glass, 'backgroundColor');

    // One design pixel, so the lit shadow scales with the band exactly as the
    // resting one does.
    const f = tile ? tile.clientWidth / 100 : 1;
    const tileLit =
      `rgba(229, 51, 30, 0.5) 0px ${24 * f}px ${52 * f}px 0px, ` +
      `rgba(255, 214, 205, 0.34) 0px 0px ${30 * f}px ${5 * f}px`;

    // Where each diamond sits across the band, as a fraction — used only to
    // decide WHEN the front reaches it. Outermost first on both sides.
    const frameW = frame.clientWidth || 1;
    const fronts = diamonds.map((d) => {
      const rel = (d.getBoundingClientRect().left - frame.getBoundingClientRect().left) / frameW;
      const p = rel < 0.5 ? rel / 0.5 : (1 - rel) / 0.5;
      return Math.min(0.96, Math.max(0.04, p));
    });

    // Pills alternate sides: left, right, left, right. Figma lists the three
    // left pills first, so the order is simply interleaved.
    const half = Math.ceil(pills.length / 2);
    const order = pills.map((_, i) => (i % 2 === 0 ? i / 2 : half + (i - 1) / 2))
      .filter((i) => Number.isInteger(i) && i < pills.length);

    let phase = 0;

    ctx = gsap.context(() => {
      const runCycle = () => {
        const tl = gsap.timeline();
        story = tl;

        /* 1 — a market prints. */
        const pill = pills[order[phase % (order.length || 1)] ?? 0];
        if (pill && pillBg) {
          tl.to(pill, {
            backgroundColor: HOT, color: PILL_ON_FG, opacity: 1,
            duration: 0.45, ease: 'sine.out',
          }, PILL_ON)
            .to(pill, {
              backgroundColor: pillBg, color: pillFg, opacity: Number(pillOp),
              duration: 1.0, ease: 'sine.inOut',
              onComplete: () => gsap.set(pill, { clearProps: 'backgroundColor,color,opacity' }),
            }, PILL_OFF);
        }

        /* 2 — the arcs carry it inward. The aperture travels a fan's width plus
           its own; the copy inside is dragged back by the same amount, so the
           arcs hold still and only the light on them moves. */
        sweeps.forEach((s) => {
          const walk = { v: 0 };
          // Both ends are read on the frame they are used, not when the cycle is
          // built, so a window resized mid-sweep still finishes at its own edge.
          const at = (v: number) => {
            const x = from(s) + (to(s) - from(s)) * v;
            gsap.set(s.win, { x });
            gsap.set(s.inner, { x: -x });
          };
          tl.to(walk, {
            v: 1, duration: SWEEP_DUR, ease: 'sine.inOut',
            onUpdate: () => at(walk.v),
            // Back to the outer edge the instant it is invisible, so the rest
            // band holds one value per element rather than two.
            onComplete: () => at(0),
          }, SWEEP_AT)
            // It kindles at the outer edge and hands off to the tile rather than
            // running out of room, so neither end of the travel is a hard cut.
            .to(s.win, { opacity: 1, duration: 0.45, ease: 'sine.out' }, SWEEP_AT)
            .to(s.win, { opacity: 0, duration: 0.6, ease: 'sine.in' }, SWEEP_AT + SWEEP_DUR - 0.6);
        });

        /* 3 — the diamonds on the path catch the front as it reaches them. */
        diamonds.forEach((d, i) => {
          const at = SWEEP_AT + fronts[i] * SWEEP_DUR;
          // `immediateRender: false`: a fromTo writes its start values when the
          // timeline is BUILT, not when the playhead arrives. Without it every
          // diamond would be pinned at scale 1 / brightness 1 from t=0 — here
          // that happens to be the resting look, but the habit is the point:
          // the tile's filter below parks a real offset.
          tl.fromTo(d, { scale: 1, filter: 'brightness(1)' }, {
            scale: 2.1, filter: 'brightness(2.4)',
            duration: 0.22, ease: 'sine.out', immediateRender: false,
          }, at)
            .to(d, {
              scale: 1, filter: 'brightness(1)',
              duration: 0.6, ease: 'sine.inOut',
              onComplete: () => gsap.set(d, { clearProps: 'transform,transformOrigin,filter' }),
            }, at + 0.22);
        });

        /* 4 — it arrives, and the vault lights. A ramp of half a second and a
           fall of nearly two: a light, not a flash. */
        if (tile && tileShadow) {
          tl.to(tile, {
            boxShadow: tileLit, borderColor: 'rgba(255, 255, 255, 0.82)',
            duration: 0.55, ease: 'sine.out',
          }, ARRIVE)
            .to(tile, {
              boxShadow: tileShadow, borderColor: tileBorder,
              duration: 1.9, ease: 'sine.inOut',
              onComplete: () => gsap.set(tile, { clearProps: 'boxShadow,borderColor' }),
            }, RELEASE);
        }
        if (glass && glassBg) {
          tl.to(glass, { backgroundColor: 'rgba(255, 255, 255, 0.28)', duration: 0.55, ease: 'sine.out' }, ARRIVE)
            .to(glass, {
              backgroundColor: glassBg, duration: 1.9, ease: 'sine.inOut',
              onComplete: () => gsap.set(glass, { clearProps: 'backgroundColor' }),
            }, RELEASE);
        }
        if (logo) {
          // Both ends stated, because the resting value is `filter: none` and
          // there is nothing there to interpolate from. Delayed, so
          // `immediateRender: false` is mandatory — otherwise the mark carries a
          // drop-shadow from the instant the cycle is built.
          tl.fromTo(logo,
            { filter: 'brightness(1) drop-shadow(0px 0px 0px rgba(255, 251, 248, 0))' },
            {
              filter: 'brightness(1.45) drop-shadow(0px 0px 9px rgba(255, 251, 248, 0.8))',
              duration: 0.55, ease: 'sine.out', immediateRender: false,
            }, ARRIVE)
            .to(logo, {
              filter: 'brightness(1) drop-shadow(0px 0px 0px rgba(255, 251, 248, 0))',
              duration: 1.9, ease: 'sine.inOut',
              onComplete: () => gsap.set(logo, { clearProps: 'filter,transform,transformOrigin' }),
            }, RELEASE);
        }

        /* 5 — and a shine crosses the face. */
        if (shine) {
          tl.fromTo(shine, { xPercent: -170 },
            { xPercent: 250, duration: 1.0, ease: 'sine.inOut', immediateRender: false }, SHINE_AT)
            .fromTo(shine, { opacity: 0 },
              { opacity: 0.95, duration: 0.3, ease: 'sine.out', immediateRender: false }, SHINE_AT)
            .to(shine, { opacity: 0, duration: 0.42, ease: 'sine.in' }, SHINE_AT + 0.58);
        }

        phase += 1;
      };

      // A clock the cycles hang off, rather than one repeating timeline whose
      // tweens would have to be rebuilt in place every pass: each cycle knows
      // which pill is printing, so it is built with real targets and discarded.
      driver = gsap.timeline({ repeat: -1, paused: true })
        .call(runCycle)
        .to({}, { duration: PERIOD });
      driver.play();
    }, root);

    /* Off screen the loop costs nothing — but only the clock between beats is
       stopped, never a beat halfway through. Pausing mid-sweep would strand the
       band on a lit pill and a bright aperture parked in the middle of a fan for
       as long as it took someone to scroll back, and a still of that is not the
       design. The beat is five seconds; it is allowed to finish. */
    io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) driver?.play();
      else driver?.pause();
    }, { rootMargin: '120px' });
    io.observe(root);

    ro = new ResizeObserver(() => layout());
    ro.observe(frame);
  };

  /* -------------------------------------------------------------- the gate
     The loop must not open over the entrance, and it is wired in two ways that
     look different from in here. `useSectionMotion` passes this function as its
     `idle` option, which it calls from the entrance timeline's `onComplete` —
     one line *after* `done()`, so the `motion:done` event a listener here would
     wait for has already gone by. What `done()` leaves behind is the flag, and
     that is the path this takes in production: `data-motion-done` is already
     set by the time this function runs, so the first branch below fires at
     once. Called any earlier (a direct call, a lab harness) the event is still
     ahead of us and is the best signal there is.

     So both are watched, and under them sits the question that is true either
     way: is anything still animating inside this section? Once the band has
     dropped `data-motion="pending"` — i.e. is demonstrably running rather than
     waiting to be scrolled to — the section is sampled four times a second and
     counted quiet only after three consecutive still samples. Whichever answers
     first opens the loop, and the first beat lands SETTLE later. */
  const open = () => {
    if (stopped || ready) return;
    window.clearInterval(probe);
    probe = 0;
    watcher?.disconnect();
    root.removeEventListener('motion:done', heard);
    ready = window.setTimeout(start, SETTLE * 1000);
  };

  let quiet = 0;
  let waited = 0;
  const busy = () =>
    gsap.globalTimeline.getChildren(true, true, true).some((a) => {
      if (!a.isActive()) return false;
      const targets = (a as gsap.core.Tween).targets?.() ?? [];
      return targets.some((t) => t instanceof Node && (t === root || root.contains(t)));
    });
  const watch = () => {
    probe = window.setInterval(() => {
      waited += 1;
      quiet = busy() ? 0 : quiet + 1;
      // The cap is a backstop, not the plan: something in the section looping
      // already would otherwise hold this closed forever.
      if (quiet >= 3 || waited >= 40) { window.clearInterval(probe); probe = 0; open(); }
    }, 250);
  };

  root.addEventListener('motion:done', heard);

  if (root.dataset.motionDone) open();
  else if (root.dataset.motion !== 'pending') watch();
  else {
    watcher = new MutationObserver(() => {
      if (root.dataset.motion !== 'pending') { watcher?.disconnect(); watch(); }
    });
    watcher.observe(root, { attributes: true, attributeFilter: ['data-motion'] });
  }

  return () => {
    stopped = true;
    window.clearTimeout(ready);
    window.clearInterval(probe);
    root.removeEventListener('motion:done', heard);
    watcher?.disconnect();
    io?.disconnect();
    ro?.disconnect();
    story?.kill();
    driver?.kill();
    // Reverts every transform, colour and filter this loop wrote, then the three
    // overlay elements go with it, so the section is left exactly as the design
    // shipped it and with nothing of this file's in the tree.
    ctx?.revert();

    // Then each target is handed back explicitly, and only the properties this
    // file ever wrote. A blanket `clearProps` list is not safe here: the
    // diamonds carry their colour in an inline `background` shorthand from
    // `Fan.tsx`, and clearing `backgroundColor` on them expands that shorthand
    // and drops the colour with it.
    const give = (el: Element | null, props: string) => {
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: props });
    };
    pills.forEach((el) => give(el, 'backgroundColor,color,opacity,transform,transformOrigin,filter'));
    diamonds.forEach((el) => give(el, 'transform,transformOrigin,filter'));
    give(tile, 'boxShadow,borderColor');
    give(glass, 'backgroundColor');
    give(logo, 'filter,transform,transformOrigin');

    mine.forEach((el) => el.remove());
    mine.length = 0;
  };
}
