import { gsap } from 'gsap';
import { createHalftone, type HalftoneLayer } from './halftone';

/**
 * Card A — "Open an account in 60 seconds".
 *
 * Three layers of motion, in order of importance:
 *
 * 1. LOAD-IN. The first time the card reaches the viewport the illustration
 *    assembles in distinct beats rather than fading: the grid resolves, the
 *    phone rises into it, the ring lands with weight, the three chips fly in
 *    one per beat and "You're in." arrives last.
 * 2. LOOP. It then never stops. A progress arc picks up exactly where the
 *    static ring-arc ends and closes the remaining 245.7° while the numerals
 *    wind 60 → 00 and back; the chips breathe on three different periods; a
 *    soft light scans down the phone screen; the circuit grid drifts; a
 *    Figma-style halftone field swells behind all of it. Every cycle is
 *    seamless — each one returns to its own start value — and the periods are
 *    deliberately incommensurable, so a frame at 10s and one at 20s differ.
 * 3. REACTION. Hover commits the countdown: the dial loads backwards
 *    (anticipation), races to zero on an expo, the chips lock in with overlap,
 *    and the confirmation lands late as the accent. The pointer tilts the art
 *    in real perspective and separates its layers by depth, damped, never 1:1.
 *
 * Any single frame still reads as the approved static card. Nothing static is
 * restyled, every added element is transparent at rest, and the returned
 * teardown puts the DOM back exactly as React rendered it.
 */
export function onboard(card: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];
  const teardown = () => { while (cleanups.length) cleanups.pop()!(); };

  const art = card.querySelector<HTMLElement>('.bcard__art');
  const ring = card.querySelector<HTMLElement>('.onboard__ring');
  const seconds = card.querySelector<HTMLElement>('.onboard__seconds');
  const phone = card.querySelector<HTMLElement>('.onboard__phone');
  const grid = card.querySelector<HTMLElement>('.onboard__grid');
  const gridImg = grid?.querySelector<HTMLElement>('img') ?? null;
  const inLabel = card.querySelector<HTMLElement>('.onboard__in');
  const chips = Array.from(card.querySelectorAll<HTMLElement>('.onboard__chip'));
  if (!art || !ring || !seconds || !phone || !grid || !gridImg || !inLabel || chips.length < 3) return teardown;

  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return teardown;           // the shipped design is the fallback

  /* ------------------------------------------------------------ added layers */

  const NS = 'http://www.w3.org/2000/svg';
  // The disc is 128.01 wide inset 14.95/15.03 in a 157.9 × 158.8 ring box, so
  // it and the static arc share the centre (78.8, 79.4) with r = 64.4.
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

  // Something alive inside the phone: a soft band scanning the screen area,
  // clipped to the same box the circuit grid occupies.
  const scanHost = document.createElement('span');
  const scan = document.createElement('span');
  Object.assign(scanHost.style, {
    position: 'absolute', left: '219px', top: '109px', width: '196px', height: '312px',
    overflow: 'hidden', pointerEvents: 'none', borderRadius: '18px',
  });
  Object.assign(scan.style, {
    position: 'absolute', left: '0', right: '0', height: '120px', top: '-120px', opacity: '0',
    background: 'linear-gradient(180deg, rgba(255,251,248,0), rgba(255,251,248,.16) 46%, rgba(255,251,248,0))',
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

  const glow: HalftoneLayer | null = createHalftone(card, {
    color: [1, 0.984, 0.973],             // off-white over the orange card
    cell: 5.4, alpha: 0.4, ambient: 0.26, reach: 230, lens: 0.38,
  });
  if (glow) cleanups.push(() => glow.dispose());

  /* ------------------------------------------------- pointer + float engine
     One rAF owns `transform` on the parallax layers so the ambient float, the
     load-in offsets and the pointer parallax compose instead of fighting over
     one property. GSAP owns everything else plus the scalars read here. */

  type Layer = {
    el: HTMLElement; depth: number;
    ax: number; ay: number; wx: number; wy: number; ph: number;
    s: { v: number };
    /** offset owned by a timeline — the load-in flies elements in through it */
    o: { x: number; y: number };
  };
  const layer = (el: HTMLElement, depth: number, ax: number, ay: number, wx: number, wy: number, ph: number): Layer =>
    ({ el, depth, ax, ay, wx, wy, ph, s: { v: 1 }, o: { x: 0, y: 0 } });

  const L_GRID = 0, L_PHONE = 1, L_RING = 2, L_CHIP = 3, L_IN = 6;
  const layers: Layer[] = [
    layer(grid, 0.014, 0, 0, 0, 0, 0),
    layer(phone, 0.024, 0.8, 1.1, 0.19, 0.13, 0.4),
    layer(ring, 0.05, 1.2, 1.8, 0.27, 0.21, 1.1),
    layer(chips[0], 0.072, 2.2, 3.0, 0.41, 0.33, 0),
    layer(chips[1], 0.088, 2.6, 3.6, 0.35, 0.29, 2.1),
    layer(chips[2], 0.104, 2.0, 3.2, 0.47, 0.37, 4.2),
    layer(inLabel, 0.064, 1.4, 2.2, 0.31, 0.25, 3.3),
  ];
  const chipLayers = [layers[L_CHIP], layers[L_CHIP + 1], layers[L_CHIP + 2]];

  const pointer = { tx: 0, ty: 0, x: 0, y: 0, tilt: 0 };
  let onCard = false;

  // .bcard__art carries a transform of its own under 720px; read it before we
  // ever write one so the tilt composes with it instead of wiping it out.
  let artBase = '';
  let cardW = card.clientWidth || 1;
  let cardH = card.clientHeight || 1;
  const measure = () => {
    art.style.transform = '';
    const m = getComputedStyle(art).transform;
    artBase = m && m !== 'none' ? `${m} ` : '';
    cardW = card.clientWidth || 1;
    cardH = card.clientHeight || 1;
  };
  measure();

  const onMove = (e: PointerEvent) => {
    const r = card.getBoundingClientRect();
    pointer.tx = (e.clientX - r.left) / r.width - 0.5;
    pointer.ty = (e.clientY - r.top) / r.height - 0.5;
    glow?.setPointer(e.clientX - r.left, e.clientY - r.top);
  };
  card.addEventListener('pointermove', onMove);
  cleanups.push(() => card.removeEventListener('pointermove', onMove));

  /* ---------------------------------------------------------------- the dial */

  const dial = { t: 0 };
  const paintDial = () => {
    dialArc.style.strokeDashoffset = String(LEN * (1 - dial.t));
    num.textContent = String(Math.round(60 * (1 - dial.t))).padStart(2, '0');
  };
  const accent = { v: 0 };                // 0…1, the "You're in." flare

  /* ----------------------------------------------------------- 1 · LOAD-IN */

  let intro: gsap.core.Timeline | null = null;
  const playIntro = () => {
    gsap.set([grid, phone, ring, inLabel, ...chips], { opacity: 0 });
    layers[L_GRID].s.v = 1.05;
    layers[L_PHONE].o.y = 30;
    layers[L_RING].s.v = 0.84;
    chipLayers.forEach((l) => { l.o.x = -20; });
    layers[L_IN].o.y = 10;

    intro = gsap.timeline({ onComplete: startLoop })
      // the circuit resolves first — the ground the rest lands on
      .to(grid, { opacity: 0.2, duration: 0.55, ease: 'power2.out' }, 0)
      .to(layers[L_GRID].s, { v: 1, duration: 0.7, ease: 'power3.out' }, 0)
      // the phone rises into it
      .to(phone, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.1)
      .to(layers[L_PHONE].o, { y: 0, duration: 0.72, ease: 'power3.out' }, 0.1)
      // the ring lands with weight
      .to(ring, { opacity: 1, duration: 0.34, ease: 'power2.out' }, 0.32)
      .to(layers[L_RING].s, { v: 1, duration: 0.66, ease: 'back.out(1.7)' }, 0.32)
      // then the three promises, one per beat
      .to(chips, { opacity: 1, duration: 0.3, ease: 'power2.out', stagger: 0.1 }, 0.46)
      .to(chipLayers.map((l) => l.o), { x: 0, duration: 0.56, ease: 'power3.out', stagger: 0.1 }, 0.46)
      // and the confirmation arrives last
      .to(inLabel, { opacity: 1, duration: 0.34, ease: 'power2.out' }, 0.86)
      .to(layers[L_IN].o, { y: 0, duration: 0.5, ease: 'power3.out' }, 0.86)
      .to(accent, { v: 1, duration: 0.3, ease: 'power2.out' }, 0.92)
      .to(accent, { v: 0, duration: 0.6, ease: 'power2.inOut' }, 1.22);
  };

  /* -------------------------------------------------------------- 2 · LOOP */

  // 8.6s round trip: 6.4s counting down, a beat at zero, 1.3s winding back —
  // it ends where it began, so there is no seam.
  const ambient = gsap.timeline({ repeat: -1, paused: true })
    .to(dial, { t: 1, duration: 6.4, ease: 'none', onUpdate: paintDial }, 0)
    .to(accent, { v: 1, duration: 0.34, ease: 'power2.out' }, 6.4)
    .to(accent, { v: 0, duration: 0.8, ease: 'power2.inOut' }, 7.0)
    .to(dial, { t: 0, duration: 1.3, ease: 'power2.inOut', onUpdate: paintDial }, 7.3);

  // The screen scan runs on its own clock, 7.3s, prime-ish against the dial.
  const scanLoop = gsap.timeline({ repeat: -1, repeatDelay: 2.4, paused: true })
    .fromTo(scan, { y: 0, opacity: 0 }, { opacity: 0.9, duration: 0.5, ease: 'power1.out' }, 0)
    .to(scan, { y: 432, duration: 4.9, ease: 'none' }, 0)
    .to(scan, { opacity: 0, duration: 0.6, ease: 'power1.in' }, 4.3);

  const floats: Array<gsap.core.Tween | gsap.core.Timeline> = [];
  const startLoop = () => {
    if (floats.length) return;
    // the ring breathes
    floats.push(gsap.to(layers[L_RING].s, { v: 1.016, duration: 2.9, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    // the circuit drifts inside its clip — a slow current, never a scroll
    floats.push(gsap.to(gridImg, { x: 9, duration: 6.1, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    floats.push(gsap.to(gridImg, { y: -6, duration: 8.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    if (glow) floats.push(gsap.to(glow.swell, { value: 0.44, duration: 4.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    floats.push(scanLoop);
    if (visible) { ambient.play(); floats.forEach((f) => f.play()); }
  };

  /* ---------------------------------------------------------- 3 · REACTION */

  let commit: gsap.core.Timeline | null = null;

  const play = () => {
    if (intro && intro.isActive()) return;   // never interrupt the assembly
    commit?.kill();
    ambient.pause();
    const from = dial.t;
    commit = gsap.timeline()
      // anticipation: the dial loads backwards before it runs
      .to(dial, { t: Math.max(0, from - 0.035), duration: 0.11, ease: 'power2.in', onUpdate: paintDial }, 0)
      .to(chipLayers.map((l) => l.s), { v: 0.985, duration: 0.11, ease: 'power2.in' }, 0)
      // …then commits to zero
      .to(dial, { t: 1, duration: 0.56, ease: 'expo.out', onUpdate: paintDial }, 0.11)
      // chips lock in on their own beat, overlapping the dial rather than
      // queueing behind it
      .to(chipLayers.map((l) => l.s), { v: 1.055, duration: 0.24, ease: 'back.out(3)', stagger: 0.07 }, 0.17)
      .to(chipLayers.map((l) => l.s), { v: 1, duration: 0.42, ease: 'power3.out', stagger: 0.07 }, 0.34)
      .to(chips, {
        backgroundColor: 'rgba(255,255,255,0.34)', borderColor: 'rgba(255,251,248,0.9)',
        duration: 0.2, ease: 'power2.out', stagger: 0.07,
      }, 0.17)
      .to(layers[L_RING].s, { v: 1.045, duration: 0.2, ease: 'power2.out' }, 0.44)
      .to(layers[L_RING].s, { v: 1, duration: 0.5, ease: 'back.out(2.2)' }, 0.64)
      // late accent — the confirmation is the last thing to arrive
      .to(accent, { v: 1, duration: 0.36, ease: 'power3.out' }, 0.52);
  };

  const release = () => {
    commit?.kill();
    commit = null;
    gsap.to(chips, {
      backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(238,238,238,0.49)',
      duration: 0.4, ease: 'power2.out', overwrite: true,
    });
    gsap.to(chipLayers.map((l) => l.s), { v: 1, duration: 0.4, ease: 'power3.out', overwrite: true });
    gsap.to(accent, { v: 0, duration: 0.5, ease: 'power2.inOut', overwrite: true });
    // hand back to the loop at the phase matching the dial, so the sweep never
    // jumps when the pointer leaves
    ambient.progress((dial.t * 6.4) / 8.6, true);
    if (visible && floats.length) ambient.play();
  };

  const onEnter = () => {
    onCard = true;
    play();
    if (glow) gsap.to(glow.hover, { value: 1, duration: 0.5, ease: 'power2.out' });
  };
  const onLeave = () => {
    onCard = false;
    release();
    if (glow) gsap.to(glow.hover, { value: 0, duration: 0.55, ease: 'power2.out' });
  };
  const onClick = (e: MouseEvent) => {
    const r = card.getBoundingClientRect();
    glow?.ripple(e.clientX - r.left, e.clientY - r.top);
    play();
  };

  card.addEventListener('pointerenter', onEnter);
  card.addEventListener('pointerleave', onLeave);
  card.addEventListener('focusin', onEnter);
  card.addEventListener('focusout', onLeave);
  card.addEventListener('click', onClick);
  cleanups.push(() => {
    card.removeEventListener('pointerenter', onEnter);
    card.removeEventListener('pointerleave', onLeave);
    card.removeEventListener('focusin', onEnter);
    card.removeEventListener('focusout', onLeave);
    card.removeEventListener('click', onClick);
  });

  /* ---------------------------------------------------------------- the rAF */

  let raf = 0;
  let visible = true;
  let last = performance.now();
  const t0 = last;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;

    // damped follow, so the parallax lags the cursor instead of tracking it
    const k = 1 - Math.exp(-dt * 7.5);
    pointer.x += ((onCard ? pointer.tx : 0) - pointer.x) * k;
    pointer.y += ((onCard ? pointer.ty : 0) - pointer.y) * k;
    pointer.tilt += ((onCard ? 1 : 0) - pointer.tilt) * k;

    art.style.transform = artBase
      + `perspective(900px) rotateX(${(-pointer.y * 7.5 * pointer.tilt).toFixed(3)}deg) `
      + `rotateY(${(pointer.x * 10 * pointer.tilt).toFixed(3)}deg)`;

    for (const l of layers) {
      const fx = l.ax * Math.sin(t * l.wx * Math.PI * 2 + l.ph);
      const fy = l.ay * Math.sin(t * l.wy * Math.PI * 2 + l.ph * 1.7);
      const px = pointer.x * cardW * l.depth;
      const py = pointer.y * cardH * l.depth;
      l.el.style.transform =
        `translate3d(${(fx + px + l.o.x).toFixed(2)}px, ${(fy + py + l.o.y).toFixed(2)}px, 0) `
        + `scale(${l.s.v.toFixed(4)})`;
    }

    const a = accent.v;
    inLabel.style.textShadow = a > 0.002 ? `0 0 ${(14 * a).toFixed(1)}px rgba(255,251,248,${(0.9 * a).toFixed(3)})` : '';

    glow?.render(t);
    raf = requestAnimationFrame(frame);
  };

  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  let introDone = false;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      start();
      if (!introDone) { introDone = true; playIntro(); }
      else if (floats.length) {
        floats.forEach((f) => f.play());
        if (!commit) ambient.play();
      }
    } else {
      stop();
      ambient.pause();
      floats.forEach((f) => f.pause());
    }
  }, { rootMargin: '100px' });
  io.observe(card);
  cleanups.push(() => io.disconnect());

  const onResize = () => { measure(); glow?.resize(); };
  window.addEventListener('resize', onResize);
  cleanups.push(() => window.removeEventListener('resize', onResize));

  start();

  cleanups.push(() => {
    stop();
    intro?.kill();
    commit?.kill();
    ambient.kill();
    floats.forEach((f) => f.kill());
    scanLoop.kill();
    gsap.killTweensOf([...chips, grid, phone, ring, inLabel, gridImg, scan,
      ...layers.map((l) => l.s), ...layers.map((l) => l.o), dial, accent]);
    for (const l of layers) { l.el.style.transform = ''; l.el.style.opacity = ''; }
    art.style.transform = '';
    inLabel.style.textShadow = '';
    gridImg.style.transform = '';
    for (const c of chips) { c.style.backgroundColor = ''; c.style.borderColor = ''; }
  });

  return teardown;
}
