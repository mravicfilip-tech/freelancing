import { gsap } from 'gsap';
import { createHalftone, type HalftoneLayer } from './halftone';

/**
 * Card C — "Double your capital on first deposit".
 *
 * Two triggers only, per MOTION.md: a load-in when the card first reaches the
 * viewport, and a loop that runs forever afterwards. Nothing here responds to
 * the pointer.
 *
 *   LOAD-IN (≈4.0s).  The chart line is the lead and its draw is the longest
 *   tween on the card — 1.6s of travel to exactly where the design parks the
 *   node, with the node riding the drawing edge. It lands, holds for a 0.3s
 *   beat, then blooms; the projection runs on to the card edge; the pie and
 *   bolt badges arrive with a countable 0.2s gap; the pill rises; and the two
 *   figures tally to $200.00 last, because the money is the point.
 *
 *   LOOP (never stops).  A charge cycle every 11s: five particles leave the
 *   deposit wallet, climb onto the real path and ride it up to the node, where
 *   the bolt glints and the projection ahead of the node lights and fades.
 *   Around it a light pulse walks the curve on a 12s cycle, the node breathes on
 *   7.6s, the badges bob on 8.4 / 10.9s, the grid drifts on 6.7 and 9.3s, a
 *   dithered halftone field swells under the curve on 9.3s, and the figures
 *   re-tick on 13.4s — always settling on the number the design ships. No two
 *   periods match, so nothing pulses in step.
 *
 * Entrances animate *from* the shipped state with `gsap.from`, so if this module
 * never runs the card still reads correctly. Ambient amplitude is ≤2px, so any
 * single frame still reads as the approved static design.
 */

/** The path out of assets/bento/chart-line.svg, verbatim. */
const LINE_D = 'M0.587302 195.75L121.594 107.944C123.682 106.429 126.194 105.614 128.773 105.614C131.242 105.614 133.653 104.866 135.688 103.469L139.925 100.562C143.405 98.1739 147.527 96.8958 151.747 96.8958H154.085C157.933 96.8958 161.634 95.42 164.427 92.7725L165.622 91.6393C167.647 89.7194 170.331 88.6492 173.122 88.6492C176.193 88.6492 179.122 89.9448 181.188 92.2174L182.763 93.9506C185.832 97.327 190.184 99.2519 194.747 99.2519H196.911C201.677 99.2519 206.301 97.6307 210.024 94.6547L219.548 87.0402C222.443 84.7262 226.038 83.4656 229.744 83.4656C232.616 83.4656 235.437 82.7083 237.922 81.27L241.707 79.0797C244.904 77.2299 248.532 76.2559 252.225 76.2559H258.797C263.669 76.2559 268.391 74.5614 272.151 71.4627L311.529 39.0151C315.29 35.9164 320.011 34.2219 324.884 34.2219H420.542C425.834 34.2219 430.931 32.2235 434.814 28.6266L451.973 12.7286C455.043 9.8843 459.074 8.3041 463.259 8.3041H464.99C468.292 8.3041 471.459 6.99013 473.792 4.65205C476.125 2.31397 479.292 1 482.595 1H564.087';

const W = 564.087, H = 196.559;
const NS = 'http://www.w3.org/2000/svg';
const money = (v: number) => `${v < 0 ? '-' : '+'}$${Math.abs(v).toFixed(2)}`;

export function bonus(card: HTMLElement): () => void {
  const cleanups: Array<() => void> = [];
  const teardown = () => { while (cleanups.length) cleanups.pop()!(); };

  const chart = card.querySelector<HTMLElement>('.bonus__chart');
  const line = card.querySelector<HTMLElement>('.bonus__line');
  const marker = card.querySelector<HTMLElement>('.bonus__marker');
  const grid = card.querySelector<HTMLElement>('.bonus__grid');
  const gridImg = grid?.querySelector<HTMLElement>('img') ?? null;
  const pill = card.querySelector<HTMLElement>('.bonus__pill');
  const wallet = card.querySelector<HTMLElement>('.bonus__pill > img');
  const amounts = Array.from(card.querySelectorAll<HTMLElement>('.bonus__amt strong'));
  const tiles = Array.from(card.querySelectorAll<HTMLElement>('.bonus__tile'));
  const bolt = tiles.find((t) => !t.classList.contains('bonus__tile--pie')) ?? null;
  const pie = tiles.find((t) => t.classList.contains('bonus__tile--pie')) ?? null;
  if (!chart || !line || !marker || !grid || !gridImg || !pill || !wallet || !bolt || !pie
    || amounts.length < 2) return teardown;

  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return teardown;           // the shipped design is the fallback

  /* ------------------------------------------------------------ added layers */

  // An overlay sitting exactly on the line image, carrying the walking pulse,
  // the lit projection and the charge particles. The static stroke stays the
  // shipped <img>, untouched.
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  Object.assign(svg.style, {
    position: 'absolute', left: '-0.5px', top: '16px', width: '564px', height: '196.6px',
    overflow: 'visible', pointerEvents: 'none', zIndex: '0',
  });

  const mkPath = (stroke: string, width: string) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', LINE_D);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-width', width);
    p.setAttribute('stroke-linecap', 'round');
    return p;
  };
  const projection = mkPath('#ff8a4f', '2');
  projection.style.opacity = '0';
  projection.style.filter = 'drop-shadow(0 0 6px rgba(255,138,79,.6))';
  const pulse = mkPath('#ffd2b4', '2.2');
  pulse.style.filter = 'drop-shadow(0 0 7px rgba(255,180,130,.85))';
  pulse.style.opacity = '0';

  const FX = 5;
  const dots: SVGCircleElement[] = [];
  for (let i = 0; i < FX; i++) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '2.3');
    c.setAttribute('fill', '#ffd8bd');
    c.setAttribute('opacity', '0');
    dots.push(c);
  }
  // A measuring path that is never painted — getPointAtLength needs a real node.
  const ruler = mkPath('none', '0');
  ruler.style.visibility = 'hidden';
  svg.append(ruler, projection, pulse, ...dots);
  line.after(svg);
  cleanups.push(() => svg.remove());

  const TOTAL = ruler.getTotalLength();
  const SAMPLES = 320;
  const lut: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const p = ruler.getPointAtLength((i / SAMPLES) * TOTAL);
    lut.push({ x: p.x, y: p.y });
  }
  const lengthAtX = (x: number) => {
    let lo = 0, hi = SAMPLES;
    while (lo < hi) { const m = (lo + hi) >> 1; if (lut[m].x < x) lo = m + 1; else hi = m; }
    return (lo / SAMPLES) * TOTAL;
  };
  // Where the design parks the node: the marker's circle centre is (18.42,
  // 17.94) inside a 36.36 box at (335.1, 28.6) in chart space, and the line sits
  // at (-0.5, 16) in that same space.
  const NODE_X = 335.1 + 18.42 + 0.5;
  const NODE_L = lengthAtX(NODE_X);
  const NODE = ruler.getPointAtLength(NODE_L);
  const NODE_F = NODE_X / W;              // node position as a fraction of width

  const halo = document.createElement('span');
  Object.assign(halo.style, {
    position: 'absolute', left: '335.1px', top: '28.6px', width: '36.36px', height: '36.36px',
    borderRadius: '50%', pointerEvents: 'none', zIndex: '0',
  });
  marker.after(halo);
  cleanups.push(() => halo.remove());

  // The curve's own height, so the shader glow is clipped by the real line.
  const heights = new Float32Array(256);
  for (let i = 0; i < 256; i++) heights[i] = ruler.getPointAtLength(lengthAtX((i / 255) * W)).y / H;

  const glowHost = document.createElement('div');
  Object.assign(glowHost.style, {
    position: 'absolute', left: '-0.5px', top: '16px', width: '564px', height: '196.6px',
    pointerEvents: 'none', zIndex: '0',
  });
  chart.prepend(glowHost);
  cleanups.push(() => glowHost.remove());

  // Halftone dots then a 16×16 Bayer dither — the Figma glow stack, drifting.
  // Ambient only: the pointer inputs are never fed.
  const glow: HalftoneLayer | null = createHalftone(glowHost, {
    color: [0.961, 0.369, 0.133],         // #f55e22
    cell: 4.6, alpha: 0.5, ambient: 0.2, lens: 0, heights,
  });
  if (glow) cleanups.push(() => glow.dispose());

  /* ------------------------------------------------------------ float engine */

  type Layer = {
    el: HTMLElement;
    ax: number; ay: number; px: number; py: number; ph: number;
    s: { v: number }; base: string;
    o: { x: number; y: number };
  };
  const layer = (el: HTMLElement, ax: number, ay: number, px: number, py: number, ph: number): Layer =>
    ({ el, ax, ay, px, py, ph, s: { v: 1 }, base: '', o: { x: 0, y: 0 } });

  const L_NODE = 1, L_PIE = 2, L_BOLT = 3, L_PILL = 4;
  const layers: Layer[] = [
    layer(grid, 0, 0, 0, 0, 0),                    // context: drift only, inside
    layer(marker, 0.5, 0.9, 9.6, 12.7, 0.8),       // accent
    layer(pie, 1.2, 1.9, 8.4, 11.3, 2.4),          // support
    layer(bolt, 1.4, 2.1, 10.9, 8.1, 4.6),         // support
    layer(pill, 0.4, 0.8, 12.4, 9.9, 1.6),         // support
  ];

  const measure = () => {
    for (const l of layers) {
      l.el.style.transform = '';
      const m = getComputedStyle(l.el).transform;
      l.base = m && m !== 'none' ? `${m} ` : '';
    }
  };
  measure();

  /* ----------------------------------------------------------- shared state */

  const tally = { v: 200 };
  const writeTally = () => { for (const a of amounts) a.textContent = money(tally.v); };

  // 1 = the shipped line, drawn end to end. The load-in animates from 0.
  const reveal = { p: 1 };
  const paintReveal = () => {
    const cut = reveal.p;
    line.style.clipPath = cut >= 1 ? '' : `inset(0 ${((1 - cut) * 100).toFixed(2)}% 0 0)`;
    // the node rides the drawing edge until it reaches where the design parks it
    const at = Math.min(cut, NODE_F);
    const q = ruler.getPointAtLength(lengthAtX(at * W));
    layers[L_NODE].o.x = q.x - NODE.x;
    layers[L_NODE].o.y = q.y - NODE.y;
  };

  const haloBreath = { v: 1 };
  const boltGlint = { v: 0 };
  const seg = { len: 0 };
  const paintProjection = () => {
    projection.style.strokeDasharray = `0 ${NODE_L} ${seg.len} ${TOTAL}`;
  };
  paintProjection();

  // The travelling pulse: a short dash walking the path, seamless because it
  // enters and leaves through zero length.
  const PULSE_LEN = 44;
  const walker = { p: 0 };
  const paintPulse = () => {
    const head = walker.p * (TOTAL + PULSE_LEN * 2);
    const gap = Math.max(0, head - PULSE_LEN);
    const len = Math.max(0, Math.min(PULSE_LEN, head, TOTAL - gap));
    pulse.style.strokeDasharray = `0 ${gap} ${len} ${TOTAL}`;
    pulse.style.opacity = String(0.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, walker.p))));
  };
  paintPulse();

  /* ----------------------------------------------------------- 1 · LOAD-IN */

  let intro: gsap.core.Timeline | null = null;
  const playIntro = () => {
    intro = gsap.timeline({ onComplete: startLoop })
      /* ---- LEAD: the line draws itself. The longest tween on the card. ---- */
      .from(reveal, { p: 0, duration: 1.6, ease: 'power2.out', onUpdate: paintReveal }, 0)
      /* ---- CONTEXT: the grid resolves under it, barely ---- */
      .from(grid, { opacity: 0, duration: 1.3, ease: 'power2.out' }, 0.1)
      .from(gridImg, { x: -10, duration: 1.5, ease: 'power2.out' }, 0.1)

      /* ---- beat (0.3s) ---- */

      /* ---- the node lands where the draw left it, and blooms ---- */
      .from(marker, { opacity: 0, duration: 0.55, ease: 'power2.out' }, 1.35)
      .fromTo(haloBreath, { v: 3.2 }, { v: 1, duration: 1.2, ease: 'power2.out' }, 1.4)
      /* ---- and the projection runs on to the edge ---- */
      .to(reveal, { p: 1, duration: 1.15, ease: 'power2.out', onUpdate: paintReveal }, 1.9)

      /* ---- SUPPORT: the badges, one then the other ---- */
      .from([pie, bolt], { opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.2 }, 2.15)
      .from([layers[L_PIE].s, layers[L_BOLT].s], { v: 0.965, duration: 1.05, ease: 'power3.out', stagger: 0.2 }, 2.15)

      /* ---- the pill rises ---- */
      .from(pill, { opacity: 0, duration: 0.8, ease: 'power2.out' }, 2.55)
      .from(layers[L_PILL].o, { y: 18, duration: 1.2, ease: 'power3.out' }, 2.55)
      /* ---- and the money is the last thing to settle ---- */
      .fromTo(tally, { v: 0 }, { v: 200, duration: 1.25, ease: 'power2.out', onUpdate: writeTally }, 2.75)
      .fromTo(boltGlint, { v: 0 }, { v: 1.4, duration: 0.55, ease: 'power2.out' }, 3.1)
      .to(boltGlint, { v: 0, duration: 0.9, ease: 'sine.inOut' }, 3.65);
  };

  /* -------------------------------------------------------------- 2 · LOOP */

  const walletCentre = () => {
    const w = wallet.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    const sx = W / (s.width || W), sy = H / (s.height || H);
    return { x: (w.left + w.width / 2 - s.left) * sx, y: (w.top + w.height / 2 - s.top) * sy };
  };

  const JOIN_L = lengthAtX(232);
  const placeDot = (d: SVGCircleElement, t: number, from: { x: number; y: number }) => {
    const join = ruler.getPointAtLength(JOIN_L);
    let x: number, y: number;
    if (t < 0.4) {                         // a quadratic hop from the wallet
      const u = t / 0.4, m = 1 - u;
      const cx = (from.x + join.x) / 2 - 26, cy = Math.min(from.y, join.y) - 42;
      x = m * m * from.x + 2 * m * u * cx + u * u * join.x;
      y = m * m * from.y + 2 * m * u * cy + u * u * join.y;
    } else {                               // then it rides the real path
      const u = (t - 0.4) / 0.6;
      const q = ruler.getPointAtLength(JOIN_L + (NODE_L - JOIN_L) * u);
      x = q.x; y = q.y;
    }
    d.setAttribute('cx', x.toFixed(2));
    d.setAttribute('cy', y.toFixed(2));
  };

  /** One charge: wallet → curve → node → bolt → projection. 4.6s of travel. */
  const buildCharge = () => {
    const from = walletCentre();
    const tl = gsap.timeline();
    dots.forEach((d, i) => {
      const prox = { t: 0 };
      tl.fromTo(prox, { t: 0 }, {
        t: 1, duration: 2.4, ease: 'sine.inOut',
        onStart() { gsap.to(d, { attr: { opacity: 0.95 }, duration: 0.4, ease: 'sine.out' }); },
        onUpdate() { placeDot(d, prox.t, from); },
        onComplete() { gsap.to(d, { attr: { opacity: 0 }, duration: 0.45, ease: 'sine.inOut' }); },
      }, i * 0.22);
    });
    const landed = 2.4 + (FX - 1) * 0.22;   // 3.28s
    tl.to(haloBreath, { v: 2.6, duration: 0.9, ease: 'sine.inOut' }, landed - 0.5)
      .to(haloBreath, { v: 1, duration: 1.4, ease: 'sine.inOut' }, landed + 0.4)
      .to(boltGlint, { v: 1.8, duration: 0.6, ease: 'power2.out' }, landed - 0.1)
      .to(boltGlint, { v: 0, duration: 1.2, ease: 'sine.inOut' }, landed + 0.5)
      .to(layers[L_BOLT].s, { v: 1.05, duration: 0.6, ease: 'power2.out' }, landed - 0.1)
      .to(layers[L_BOLT].s, { v: 1, duration: 0.9, ease: 'power2.out' }, landed + 0.5)
      .set(projection, { opacity: 1 }, landed - 0.05)
      .fromTo(seg, { len: 0 }, { len: TOTAL - NODE_L, duration: 1.3, ease: 'expo.out', onUpdate: paintProjection }, landed)
      .to(projection, { opacity: 0, duration: 1.4, ease: 'sine.inOut' }, landed + 1.5);
    return tl;
  };

  const floats: Array<gsap.core.Tween | gsap.core.Timeline> = [];
  const startLoop = () => {
    if (floats.length) return;

    // the charge cycle, every 11s — the card's ambient story
    floats.push(gsap.timeline({ repeat: -1, repeatDelay: 4.6 }).add(buildCharge()));

    // a light pulse walks the curve on a 12s cycle
    floats.push(gsap.timeline({ repeat: -1, repeatDelay: 5.4 })
      .fromTo(walker, { p: 0 }, { p: 1, duration: 6.6, ease: 'sine.inOut', onUpdate: paintPulse }));

    // the node breathes
    floats.push(gsap.to(haloBreath, { v: 1.55, duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    // the circuit grid drifts inside its clip: a slow current, never a scroll
    floats.push(gsap.to(gridImg, { x: 7, duration: 6.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    floats.push(gsap.to(gridImg, { y: -5, duration: 9.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    // the figures re-tick the way a live balance does, always settling on the
    // number the design ships: +$200.00
    floats.push(gsap.timeline({ repeat: -1, repeatDelay: 12.2 })
      .fromTo(tally, { v: 198.15 }, { v: 200, duration: 1.2, ease: 'power2.out', onUpdate: writeTally }));
    if (glow) floats.push(gsap.to(glow.swell, { value: 0.34, duration: 4.65, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

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
      l.el.style.transform = `${l.base}`
        + `translate3d(${(fx + l.o.x).toFixed(2)}px, ${(fy + l.o.y).toFixed(2)}px, 0) `
        + `scale(${l.s.v.toFixed(4)})`;
    }

    const hb = haloBreath.v;
    halo.style.boxShadow =
      `0 0 0 ${(1.5 + hb * 2).toFixed(2)}px rgba(245,94,34,${(0.05 + hb * 0.07).toFixed(3)}), `
      + `0 0 ${(12 + hb * 14).toFixed(1)}px ${(2 + hb * 4).toFixed(1)}px rgba(245,94,34,${(0.08 + hb * 0.13).toFixed(3)})`;

    const bg = boltGlint.v;
    bolt.style.boxShadow = bg > 0.002
      ? `0 0 ${(10 + bg * 20).toFixed(1)}px ${(bg * 4).toFixed(1)}px rgba(245,94,34,${(bg * 0.4).toFixed(3)})`
      : '';

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
  }, { rootMargin: '80px' });
  io.observe(card);
  cleanups.push(() => io.disconnect());

  const onResize = () => { measure(); glow?.resize(); };
  window.addEventListener('resize', onResize);
  cleanups.push(() => window.removeEventListener('resize', onResize));

  start();

  cleanups.push(() => {
    stop();
    intro?.kill();
    floats.forEach((f) => f.kill());
    gsap.killTweensOf([gridImg, grid, pill, pie, bolt, marker, projection,
      ...dots, ...layers.map((l) => l.s), ...layers.map((l) => l.o),
      tally, reveal, walker, haloBreath, boltGlint, seg]);
    for (const l of layers) { l.el.style.transform = ''; l.el.style.opacity = ''; }
    gridImg.style.transform = '';
    grid.style.opacity = '';
    marker.style.opacity = '';
    line.style.clipPath = '';
    bolt.style.boxShadow = '';
    tally.v = 200;
    writeTally();
  });

  return teardown;
}
