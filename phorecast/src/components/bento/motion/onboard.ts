import { gsap } from 'gsap';
import { createHalftone, type HalftoneLayer } from './halftone';

/**
 * Card A — "Open an account in 60 seconds".
 *
 * Two triggers only, per MOTION.md: a load-in when the card first reaches the
 * viewport, and a loop that runs forever afterwards. Nothing here responds to
 * the pointer.
 *
 *   LOAD-IN (≈4.0s).  One object arrives and is allowed to land before anything
 *   else moves. The phone is the lead — it rises 24px over 1.4s on a long
 *   deceleration and holds the stage alone for a 0.3s beat. Then the circuit
 *   grid resolves behind it, the ring settles, the three chips check in one at a
 *   time with a 0.18s gap you can count, and "You're in." is the last thing to
 *   arrive. The countdown starts itself as the card finishes assembling.
 *
 *   LOOP (12s, never stops).  A progress arc picks up exactly where the static
 *   ring-arc ends and closes the remaining 245.7° while the numerals wind
 *   60 → 00, then recharges over 2.6s. Under it the chips breathe on 7.3 / 9.1 /
 *   11.2s periods, the ring on 10.4s, the circuit drifts on 6.5 and 8.7s, a soft
 *   band scans the phone screen on 11s and a dithered halftone field swells on
 *   9.7s. No two periods match, so the group never pulses in lockstep, and every
 *   cycle returns to its own start value, so there is no seam.
 *
 * Entrances animate *from* the shipped state with `gsap.from`, so if this module
 * never runs the card still reads correctly. Ambient amplitude is ≤2px and
 * ≤1.2% of scale, so any single frame still reads as the approved static design.
 */
export function onboard(card: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];
  const teardown = () => { while (cleanups.length) cleanups.pop()!(); };

  const ring = card.querySelector<HTMLElement>('.onboard__ring');
  const seconds = card.querySelector<HTMLElement>('.onboard__seconds');
  const phone = card.querySelector<HTMLElement>('.onboard__phone');
  const grid = card.querySelector<HTMLElement>('.onboard__grid');
  const gridImg = grid?.querySelector<HTMLElement>('img') ?? null;
  const inLabel = card.querySelector<HTMLElement>('.onboard__in');
  const chips = Array.from(card.querySelectorAll<HTMLElement>('.onboard__chip'));
  if (!ring || !seconds || !phone || !grid || !gridImg || !inLabel || chips.length < 3) return teardown;

  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return teardown;           // the shipped design is the fallback

  /* ------------------------------------------------------------ added layers */

  const NS = 'http://www.w3.org/2000/svg';
  // The disc is 128.01 wide inset 14.95 / 15.03 inside a 157.9 × 158.8 ring box,
  // so it and the static arc share the centre (78.8, 79.4) with r = 64.4.
  const CX = 78.8, CY = 79.4, R = 64.4;
  const CIRC = 2 * Math.PI * R;
  const ARC_SWEEP = 114.3;                // degrees the static arc already covers
  const LEN = CIRC * ((360 - ARC_SWEEP) / 360);

  const sweep = document.createElementNS(NS, 'svg');
  sweep.setAttribute('viewBox', '0 0 157.9 158.8');
  sweep.setAttribute('aria-hidden', 'true');
  Object.assign(sweep.style, {
    position: 'absolute', left: '0', top: '0', width: '157.9px', height: '158.8px',
    overflow: 'visible', pointerEvents: 'none',
  });
  const dialArc = document.createElementNS(NS, 'circle');
  dialArc.setAttribute('cx', String(CX));
  dialArc.setAttribute('cy', String(CY));
  dialArc.setAttribute('r', String(R));
  dialArc.setAttribute('fill', 'none');
  dialArc.setAttribute('stroke', '#fffbf8');
  dialArc.setAttribute('stroke-width', '4');
  dialArc.setAttribute('transform', `rotate(15.8 ${CX} ${CY})`);
  dialArc.style.strokeDasharray = `${LEN} ${CIRC}`;
  dialArc.style.strokeDashoffset = String(LEN);
  sweep.append(dialArc);
  ring.insertBefore(sweep, seconds);
  cleanups.push(() => sweep.remove());

  // Something alive inside the phone: a soft band scanning the screen, clipped
  // to the same box the circuit grid occupies.
  const scanHost = document.createElement('span');
  const scan = document.createElement('span');
  Object.assign(scanHost.style, {
    position: 'absolute', left: '219px', top: '109px', width: '196px', height: '312px',
    overflow: 'hidden', pointerEvents: 'none', borderRadius: '18px',
  });
  Object.assign(scan.style, {
    position: 'absolute', left: '0', right: '0', height: '140px', top: '-140px', opacity: '0',
    background: 'linear-gradient(180deg, rgba(255,251,248,0), rgba(255,251,248,.13) 48%, rgba(255,251,248,0))',
  });
  scanHost.append(scan);
  grid.after(scanHost);
  cleanups.push(() => scanHost.remove());

  // "60s" becomes two runs so the number can change without touching the unit.
  const secondsHTML = seconds.innerHTML;
  const num = document.createElement('span');
  const unit = document.createElement('span');
  num.textContent = '60';
  unit.textContent = 's';
  seconds.textContent = '';
  seconds.append(num, unit);
  cleanups.push(() => { seconds.innerHTML = secondsHTML; });

  // The Figma glow stack — halftone dots, then a 16×16 Bayer dither — as a
  // slowly drifting field. Ambient only: the pointer inputs are never fed.
  const glow: HalftoneLayer | null = createHalftone(card, {
    color: [1, 0.984, 0.973],             // off-white over the orange card
    cell: 5.4, alpha: 0.36, ambient: 0.24, lens: 0,
  });
  if (glow) cleanups.push(() => glow.dispose());

  /* ------------------------------------------------------------ float engine
     One rAF owns `transform` on the illustration's layers so the ambient float
     and the load-in offsets compose instead of fighting over one property.
     GSAP owns everything else, plus the scalars read here. */

  type Layer = {
    el: HTMLElement;
    ax: number; ay: number;
    /** seconds per cycle — deliberately mismatched across the group */
    px: number; py: number; ph: number;
    s: { v: number };
    /** offset owned by a timeline; the load-in flies elements in through it */
    o: { x: number; y: number };
  };
  const layer = (el: HTMLElement, ax: number, ay: number, px: number, py: number, ph: number): Layer =>
    ({ el, ax, ay, px, py, ph, s: { v: 1 }, o: { x: 0, y: 0 } });

  const L_GRID = 0, L_PHONE = 1, L_RING = 2, L_CHIP = 3, L_IN = 6;
  const layers: Layer[] = [
    // context barely moves; support a little; the accent group a little more
    layer(grid, 0, 0, 0, 0, 0),
    layer(phone, 0.7, 1.1, 12.6, 15.1, 0.4),
    layer(ring, 0.9, 1.4, 10.4, 13.3, 1.1),
    layer(chips[0], 1.5, 2.0, 7.3, 9.4, 0),
    layer(chips[1], 1.7, 2.2, 9.1, 11.9, 2.1),
    layer(chips[2], 1.4, 1.9, 11.2, 8.6, 4.2),
    layer(inLabel, 1.0, 1.5, 8.9, 12.1, 3.3),
  ];
  const chipLayers = [layers[L_CHIP], layers[L_CHIP + 1], layers[L_CHIP + 2]];

  /* ---------------------------------------------------------------- the dial */

  const dial = { t: 0 };
  const paintDial = () => {
    dialArc.style.strokeDashoffset = String(LEN * (1 - dial.t));
    num.textContent = String(Math.round(60 * (1 - dial.t))).padStart(2, '0');
  };
  const accent = { v: 0 };                // 0…1, the "You're in." flare

  /* ----------------------------------------------------------- 1 · LOAD-IN
     Lead 1.4s, a 0.3s beat, then followers at 0.7–1.3s with a 0.18s stagger. */

  let intro: gsap.core.Timeline | null = null;
  const playIntro = () => {
    intro = gsap.timeline({ onComplete: startLoop })
      /* ---- LEAD: the phone, alone ---- */
      .from(layers[L_PHONE].o, { y: 24, duration: 1.4, ease: 'power3.out' }, 0)
      .from(phone, { opacity: 0, duration: 0.85, ease: 'power2.out' }, 0)

      /* ---- beat (0.3s) — nothing moves ---- */

      /* ---- CONTEXT: the circuit resolves behind it ---- */
      .from(grid, { opacity: 0, duration: 1.1, ease: 'power2.out' }, 1.7)
      .from(layers[L_GRID].s, { v: 1.028, duration: 1.3, ease: 'power2.out' }, 1.7)

      /* ---- SUPPORT: the ring settles ---- */
      .from(ring, { opacity: 0, duration: 0.8, ease: 'power2.out' }, 1.95)
      .from(layers[L_RING].s, { v: 0.968, duration: 1.2, ease: 'power3.out' }, 1.95)

      /* ---- ACCENT: the three promises, one at a time ---- */
      .from(chips, { opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.18 }, 2.25)
      .from(chipLayers.map((l) => l.o), { x: -16, duration: 1.05, ease: 'power3.out', stagger: 0.18 }, 2.25)
      // a chip settling is a sub-12px accent, which is the one place back belongs
      .from(chipLayers.map((l) => l.s), { v: 0.972, duration: 0.9, ease: 'back.out(1.4)', stagger: 0.18 }, 2.25)

      /* ---- and the confirmation last ---- */
      .from(inLabel, { opacity: 0, duration: 0.8, ease: 'power2.out' }, 2.95)
      .from(layers[L_IN].o, { y: 12, duration: 1.05, ease: 'power3.out' }, 2.95)
      .to(accent, { v: 1, duration: 0.6, ease: 'power2.out' }, 3.05)
      .to(accent, { v: 0, duration: 1.0, ease: 'sine.inOut' }, 3.65);
  };

  /* -------------------------------------------------------------- 2 · LOOP
     12s round trip: 8.4s counting down, a beat at zero, 2.6s recharging. It
     ends on the value it started from, so there is no seam. */

  const ambient = gsap.timeline({ repeat: -1, paused: true })
    // a travelling dash offset is the one place linear is right — it is a clock
    .to(dial, { t: 1, duration: 8.4, ease: 'none', onUpdate: paintDial }, 0)
    .to(accent, { v: 1, duration: 0.6, ease: 'sine.inOut' }, 8.4)
    .to(accent, { v: 0, duration: 1.2, ease: 'sine.inOut' }, 9.0)
    .to(dial, { t: 0, duration: 2.6, ease: 'sine.inOut', onUpdate: paintDial }, 9.4);

  // The screen scan runs on its own 11s clock, against the dial's 12s.
  const scanLoop = gsap.timeline({ repeat: -1, repeatDelay: 3.2, paused: true })
    .fromTo(scan, { y: 0, opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 0)
    .to(scan, { y: 452, duration: 7.8, ease: 'sine.inOut' }, 0)
    .to(scan, { opacity: 0, duration: 1.6, ease: 'sine.inOut' }, 6.2);

  const floats: Array<gsap.core.Tween | gsap.core.Timeline> = [];
  const startLoop = () => {
    if (floats.length) return;
    // the ring breathes — amplitude small enough that a still frame is the design
    floats.push(gsap.to(layers[L_RING].s, { v: 1.012, duration: 5.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    // the circuit drifts inside its clip: a slow current, never a scroll
    floats.push(gsap.to(gridImg, { x: 7, duration: 6.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    floats.push(gsap.to(gridImg, { y: -5, duration: 8.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    if (glow) floats.push(gsap.to(glow.swell, { value: 0.42, duration: 4.85, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    floats.push(scanLoop);
    floats.push(ambient);
    if (visible) floats.forEach((f) => f.play());
  };

  /* ---------------------------------------------------------------- the rAF */

  let raf = 0;
  let visible = true;
  const t0 = performance.now();

  const frame = (now: number) => {
    const t = (now - t0) / 1000;

    for (const l of layers) {
      const fx = l.px ? l.ax * Math.sin((t / l.px) * Math.PI * 2 + l.ph) : 0;
      const fy = l.py ? l.ay * Math.sin((t / l.py) * Math.PI * 2 + l.ph * 1.7) : 0;
      l.el.style.transform =
        `translate3d(${(fx + l.o.x).toFixed(2)}px, ${(fy + l.o.y).toFixed(2)}px, 0) `
        + `scale(${l.s.v.toFixed(4)})`;
    }

    const a = accent.v;
    inLabel.style.textShadow = a > 0.002 ? `0 0 ${(13 * a).toFixed(1)}px rgba(255,251,248,${(0.85 * a).toFixed(3)})` : '';

    glow?.render(t);
    raf = requestAnimationFrame(frame);
  };

  const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  let introDone = false;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      start();
      if (!introDone) { introDone = true; playIntro(); }
      else floats.forEach((f) => f.play());
    } else {
      stop();
      floats.forEach((f) => f.pause());
    }
  }, { rootMargin: '100px' });
  io.observe(card);
  cleanups.push(() => io.disconnect());

  const onResize = () => glow?.resize();
  window.addEventListener('resize', onResize);
  cleanups.push(() => window.removeEventListener('resize', onResize));

  start();

  cleanups.push(() => {
    stop();
    intro?.kill();
    ambient.kill();
    scanLoop.kill();
    floats.forEach((f) => f.kill());
    gsap.killTweensOf([...chips, grid, phone, ring, inLabel, gridImg, scan,
      ...layers.map((l) => l.s), ...layers.map((l) => l.o), dial, accent]);
    for (const l of layers) { l.el.style.transform = ''; l.el.style.opacity = ''; }
    inLabel.style.textShadow = '';
    gridImg.style.transform = '';
  });

  return teardown;
}
