import { gsap } from 'gsap';
import { createHalftone, type HalftoneLayer } from './halftone';

/**
 * Card C — "Double your capital on first deposit", motion direction 03: Charge
 * transfer.
 *
 * The first time the card comes into view the line draws itself in with the
 * node riding the edge and the two figures tally to $200.00 — the money
 * arriving. After that the card never stops: a light pulse runs the curve on a
 * 3.4s loop, the node's halo breathes on a different period, the bolt glints,
 * the badges bob, and a halftone field swells under the curve.
 *
 * Hover tells the story: the pill dips (anticipation), particles leave the
 * deposit wallet, climb onto the real path and ride it up to the node;
 * overlapping their landing, the bolt fires and the projection *ahead* of the
 * node lights up; the shine crossing the pill is the late accent.
 *
 * Nothing static is restyled — every layer added here is transparent at rest
 * and the returned teardown removes all of it.
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
  if (!chart || !line || !marker || !grid || !gridImg || !pill || !wallet || !bolt || !pie || amounts.length < 2) return teardown;

  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return teardown;           // the shipped design is the fallback

  /* ---------------------------------------------------------------- layers */

  // An overlay sitting exactly on top of the line image: it carries the moving
  // pulse, the lit projection and the particles. The static stroke stays the
  // shipped <img>, untouched.
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  Object.assign(svg.style, {
    position: 'absolute', left: '-0.5px', top: '16px', width: '564px', height: '196.6px',
    overflow: 'visible', pointerEvents: 'none', zIndex: '0',
  });

  const mk = (cls: string, stroke: string, width: string) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', LINE_D);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', stroke);
    p.setAttribute('stroke-width', width);
    p.setAttribute('stroke-linecap', 'round');
    p.dataset.role = cls;
    return p;
  };
  const projection = mk('projection', '#ff8a4f', '2');
  projection.style.opacity = '0';
  projection.style.filter = 'drop-shadow(0 0 6px rgba(255,138,79,.65))';
  const pulse = mk('pulse', '#ffd2b4', '2.4');
  pulse.style.filter = 'drop-shadow(0 0 7px rgba(255,180,130,.9))';

  const FX = 6;
  const dots: SVGCircleElement[] = [];
  for (let i = 0; i < FX; i++) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '2.4');
    c.setAttribute('fill', '#ffd8bd');
    c.setAttribute('opacity', '0');
    dots.push(c);
  }
  // A measuring path that is never painted — getPointAtLength needs a real node.
  const ruler = mk('ruler', 'none', '0');
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
  // 17.94) inside a 36.36 box at (335.1, 28.6) in chart space, and the line
  // sits at (-0.5, 16) in that same space.
  const NODE_L = lengthAtX(335.1 + 18.42 + 0.5);
  const NODE = ruler.getPointAtLength(NODE_L);

  const halo = document.createElement('span');
  Object.assign(halo.style, {
    position: 'absolute', left: '335.1px', top: '28.6px', width: '36.36px', height: '36.36px',
    borderRadius: '50%', pointerEvents: 'none', opacity: '0', zIndex: '0',
  });
  marker.after(halo);
  cleanups.push(() => halo.remove());

  const shineWrap = document.createElement('span');
  const shine = document.createElement('span');
  Object.assign(shineWrap.style, {
    position: 'absolute', inset: '0', borderRadius: '30px', overflow: 'hidden', pointerEvents: 'none',
  });
  Object.assign(shine.style, {
    position: 'absolute', top: '0', bottom: '0', left: '-45%', width: '45%', opacity: '0',
    background: 'linear-gradient(90deg, rgba(255,251,248,0), rgba(255,251,248,.16), rgba(255,251,248,0))',
  });
  shineWrap.append(shine);
  pill.append(shineWrap);
  cleanups.push(() => shineWrap.remove());

  // Curve heights for the shader, so the glow is clipped by the real line.
  const heights = new Float32Array(256);
  for (let i = 0; i < 256; i++) heights[i] = ruler.getPointAtLength(lengthAtX((i / 255) * W)).y / H;

  const glowHost = document.createElement('div');
  Object.assign(glowHost.style, {
    position: 'absolute', left: '-0.5px', top: '16px', width: '564px', height: '196.6px',
    pointerEvents: 'none', zIndex: '0',
  });
  chart.prepend(glowHost);
  cleanups.push(() => glowHost.remove());

  const glow: HalftoneLayer | null = createHalftone(glowHost, {
    color: [0.961, 0.369, 0.133],         // #f55e22
    cell: 4.6, alpha: 0.62, ambient: 0.22, reach: 190, lens: 0.3, heights,
  });
  if (glow) cleanups.push(() => glow.dispose());

  /* -------------------------------------------------- pointer + float engine */

  type Layer = {
    el: HTMLElement; depth: number;
    ax: number; ay: number; wx: number; wy: number; ph: number;
    s: { v: number }; base: string;
    /** offset owned by a timeline (the intro walks the node along here) */
    o: { x: number; y: number };
  };
  const layer = (el: HTMLElement, depth: number, ax: number, ay: number, wx: number, wy: number, ph: number): Layer =>
    ({ el, depth, ax, ay, wx, wy, ph, s: { v: 1 }, base: '', o: { x: 0, y: 0 } });

  const layers: Layer[] = [
    layer(grid, 0.012, 0, 0, 0, 0, 0),
    layer(chart, 0.02, 0, 0, 0, 0, 0),
    layer(marker, 0.046, 0.6, 1.0, 0.23, 0.19, 0.8),
    layer(pie, 0.07, 1.6, 2.4, 0.29, 0.23, 2.4),
    layer(bolt, 0.086, 1.9, 2.9, 0.34, 0.27, 4.6),
    layer(pill, 0.03, 0.5, 0.9, 0.17, 0.15, 1.6),
  ];

  let cardW = card.clientWidth || 1;
  let cardH = card.clientHeight || 1;
  const measure = () => {
    for (const l of layers) {
      l.el.style.transform = '';
      const m = getComputedStyle(l.el).transform;
      l.base = m && m !== 'none' ? `${m} ` : '';
    }
    cardW = card.clientWidth || 1;
    cardH = card.clientHeight || 1;
  };
  measure();

  const pointer = { tx: 0, ty: 0, x: 0, y: 0, tilt: 0 };
  let onCard = false;

  const onMove = (e: PointerEvent) => {
    const r = card.getBoundingClientRect();
    pointer.tx = (e.clientX - r.left) / r.width - 0.5;
    pointer.ty = (e.clientY - r.top) / r.height - 0.5;
    const g = glowHost.getBoundingClientRect();
    glow?.setPointer(e.clientX - g.left, e.clientY - g.top);
  };
  card.addEventListener('pointermove', onMove);
  cleanups.push(() => card.removeEventListener('pointermove', onMove));

  /* --------------------------------------------------------------- ambient */

  // The travelling pulse: a short dash walking the path, seamless because the
  // offset simply wraps.
  const PULSE_LEN = 46;
  pulse.style.strokeDasharray = `0 0 ${PULSE_LEN} ${TOTAL}`;
  const walker = { p: 0 };
  const paintPulse = () => {
    const head = walker.p * (TOTAL + PULSE_LEN * 2);
    const gap = Math.max(0, head - PULSE_LEN);
    const len = Math.min(PULSE_LEN, head, TOTAL - gap);
    pulse.style.strokeDasharray = `0 ${gap} ${Math.max(0, len)} ${TOTAL}`;
    pulse.style.opacity = String(0.55 * Math.sin(Math.PI * Math.min(1, Math.max(0, walker.p))) ** 0.6);
  };
  paintPulse();

  const haloBreath = { v: 0 };
  const boltGlint = { v: 0 };

  const ambient = gsap.timeline({ repeat: -1, paused: true })
    .fromTo(walker, { p: 0 }, { p: 1, duration: 2.1, ease: 'power1.inOut', onUpdate: paintPulse }, 0)
    .to({}, { duration: 1.3 }, 2.1);      // breathing room between pulses

  const floats: Array<gsap.core.Tween | gsap.core.Timeline> = [];
  const startLoop = () => {
    if (floats.length) return;
    // the node breathes
    floats.push(gsap.to(haloBreath, { v: 1, duration: 1.45, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    // the bolt glints every few seconds
    floats.push(gsap.fromTo(boltGlint, { v: 0 }, {
      v: 1, duration: 0.55, ease: 'power2.inOut', repeat: -1, repeatDelay: 4.7, yoyo: true,
    }));
    // the circuit grid drifts inside its clip — a slow current, not a scroll
    floats.push(gsap.to(gridImg, { x: 8, duration: 7.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    floats.push(gsap.to(gridImg, { y: -5, duration: 9.7, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    // the figures re-tick now and then, the way a live balance does. It always
    // settles on the number the design ships: +$200.00.
    floats.push(gsap.timeline({ repeat: -1, repeatDelay: 5.6 })
      .fromTo(tally, { v: 198.4 }, { v: 200, duration: 0.62, ease: 'power2.out', onUpdate: writeTally }));
    if (glow) floats.push(gsap.to(glow.swell, { value: 0.36, duration: 3.9, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    floats.push(ambient);
    if (visible) floats.forEach((f) => f.play());
  };

  /* ------------------------------------------------- first-sight draw-on */

  const tally = { v: 200 };
  const writeTally = () => { for (const a of amounts) a.textContent = money(tally.v); };
  const reveal = { p: 1 };
  const paintReveal = () => {
    const cut = reveal.p;
    line.style.clipPath = cut >= 1 ? '' : `inset(0 ${((1 - cut) * 100).toFixed(2)}% 0 0)`;
    // the rAF owns marker's transform, so the walk feeds it an offset
    if (cut >= 1) { layers[2].o.x = 0; layers[2].o.y = 0; return; }
    const q = ruler.getPointAtLength(lengthAtX(cut * W));
    layers[2].o.x = q.x - NODE.x;
    layers[2].o.y = q.y - NODE.y;
  };

  let intro: gsap.core.Timeline | null = null;
  const playIntro = () => {
    gsap.set(reveal, { p: 0 });
    gsap.set(tally, { v: 0 });
    gsap.set([pie, bolt, pill, marker], { opacity: 0 });
    gsap.set(grid, { opacity: 0 });
    layers[3].s.v = 0.7; layers[4].s.v = 0.7;
    layers[5].o.y = 16;
    paintReveal();

    intro = gsap.timeline({ onComplete: startLoop })
      // the grid resolves first — the ground the curve is drawn on
      .to(grid, { opacity: 0.2, duration: 0.5, ease: 'power2.out' }, 0)
      .fromTo(gridImg, { x: -14 }, { x: 0, duration: 0.8, ease: 'power3.out' }, 0)
      // then the line draws itself up to where the design parks the node…
      .to(reveal, { p: 335.6 / W, duration: 0.6, ease: 'power2.out', onUpdate: paintReveal }, 0.14)
      // …the node lands there and blooms…
      .to(marker, { opacity: 1, duration: 0.22, ease: 'power2.out' }, 0.66)
      .fromTo(haloBreath, { v: 3.4 }, { v: 1, duration: 0.8, ease: 'power2.out' }, 0.66)
      // …and the projection runs on to the edge
      .to(reveal, { p: 1, duration: 0.46, ease: 'power2.inOut', onUpdate: paintReveal }, 0.7)
      // the pill rises and tallies
      .to(pill, { opacity: 1, duration: 0.42, ease: 'power3.out' }, 0.66)
      .to(layers[5].o, { y: 0, duration: 0.7, ease: 'back.out(1.6)' }, 0.66)
      .to(tally, { v: 200, duration: 0.6, ease: 'power2.out', onUpdate: writeTally }, 0.7)
      // badges pop last, one after the other
      .to([pie, bolt], { opacity: 1, duration: 0.3, ease: 'power2.out', stagger: 0.11 }, 0.82)
      .to([layers[3].s, layers[4].s], { v: 1, duration: 0.62, ease: 'back.out(2.2)', stagger: 0.11 }, 0.82)
      .fromTo(boltGlint, { v: 0 }, { v: 1.6, duration: 0.24, ease: 'power2.out' }, 1.06)
      .to(boltGlint, { v: 0, duration: 0.6, ease: 'power2.inOut' }, 1.3);
  };

  /* ------------------------------------------------------- charge transfer */

  const walletCentre = () => {
    const w = wallet.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    // svg is 564 css px wide showing a W-unit viewBox, so the scale is ~1:1
    const sx = W / (s.width || W), sy = H / (s.height || H);
    return { x: (w.left + w.width / 2 - s.left) * sx, y: (w.top + w.height / 2 - s.top) * sy };
  };

  const JOIN_L = lengthAtX(240);
  const placeDot = (d: SVGCircleElement, t: number, from: { x: number; y: number }) => {
    const join = ruler.getPointAtLength(JOIN_L);
    let x: number, y: number;
    if (t < 0.4) {                         // a quadratic hop from the wallet
      const u = t / 0.4, m = 1 - u;
      const cx = (from.x + join.x) / 2 - 26, cy = Math.min(from.y, join.y) - 44;
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

  const seg = { len: 0 };
  const paintProjection = () => {
    projection.style.strokeDasharray = `0 ${NODE_L} ${seg.len} ${TOTAL}`;
  };
  paintProjection();

  let charge: gsap.core.Timeline | null = null;

  const play = () => {
    charge?.kill();
    const from = walletCentre();
    const tl = gsap.timeline();
    // anticipation — the pill gathers itself before it sends anything
    tl.to(layers[5].s, { v: 0.988, duration: 0.13, ease: 'power2.in' }, 0)
      .to(wallet, { scale: 0.93, duration: 0.13, ease: 'power2.in' }, 0)
      .to(layers[5].s, { v: 1, duration: 0.5, ease: 'back.out(2.4)' }, 0.13)
      .to(wallet, { scale: 1, duration: 0.5, ease: 'back.out(2.8)' }, 0.13);

    dots.forEach((d, i) => {
      const prox = { t: 0 };
      tl.fromTo(prox, { t: 0 }, {
        t: 1, duration: 0.66, ease: 'power2.inOut',
        onStart() { d.setAttribute('opacity', '1'); },
        onUpdate() { placeDot(d, prox.t, from); },
        onComplete() { gsap.to(d, { attr: { opacity: 0 }, duration: 0.18 }); },
      }, 0.12 + i * 0.07);
    });

    const landed = 0.12 + 0.66 + (FX - 1) * 0.07;
    tl.to(haloBreath, { v: 3.2, duration: 0.5, ease: 'power2.out' }, landed - 0.12)
      .to(haloBreath, { v: 1, duration: 0.7, ease: 'power2.inOut' }, landed + 0.4)
      // the bolt fires as the last particle lands — overlapping, not after
      .to(boltGlint, { v: 2.4, duration: 0.16, ease: 'power2.out' }, landed - 0.04)
      .to(boltGlint, { v: 0, duration: 0.6, ease: 'power2.inOut' }, landed + 0.14)
      .to(layers[4].s, { v: 1.11, duration: 0.16, ease: 'power2.out' }, landed - 0.04)
      .to(layers[4].s, { v: 1, duration: 0.55, ease: 'back.out(2.6)' }, landed + 0.14)
      // and the projection ahead of the node lights up
      .set(projection, { opacity: 1 }, landed - 0.02)
      .fromTo(seg, { len: 0 }, { len: TOTAL - NODE_L, duration: 0.52, ease: 'power3.out', onUpdate: paintProjection }, landed)
      // late accent: the shine crosses the pill last
      .fromTo(shine, { opacity: 1, x: 0 }, {
        x: (pill.clientWidth || 297) + 140, duration: 0.66, ease: 'power2.inOut',
        onComplete() { gsap.set(shine, { opacity: 0, x: 0 }); },
      }, landed + 0.1);

    charge = tl;
  };

  const release = () => {
    charge?.kill();
    charge = null;
    gsap.to(dots, { attr: { opacity: 0 }, duration: 0.2, overwrite: true });
    gsap.to(projection, { opacity: 0, duration: 0.3, overwrite: true });
    gsap.to(layers[4].s, { v: 1, duration: 0.35, ease: 'power3.out', overwrite: true });
    gsap.to(layers[5].s, { v: 1, duration: 0.35, ease: 'power3.out', overwrite: true });
    gsap.to(wallet, { scale: 1, duration: 0.3, overwrite: true });
    gsap.to(boltGlint, { v: 0, duration: 0.3, overwrite: true });
    gsap.set(shine, { opacity: 0, x: 0 });
    gsap.killTweensOf(haloBreath);
    if (floats.length) floats[0].resume();
  };

  const onEnter = () => {
    onCard = true;
    if (floats.length) floats[0].pause();
    play();
    if (glow) gsap.to(glow.hover, { value: 1, duration: 0.55, ease: 'power2.out' });
  };
  const onLeave = () => {
    onCard = false;
    release();
    if (glow) gsap.to(glow.hover, { value: 0, duration: 0.5, ease: 'power2.out' });
  };
  const onClick = (e: MouseEvent) => {
    const g = glowHost.getBoundingClientRect();
    glow?.ripple(e.clientX - g.left, e.clientY - g.top);
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

  /* ------------------------------------------------------------- the loop */

  let raf = 0;
  let visible = true;
  let last = performance.now();
  const t0 = last;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;

    const k = 1 - Math.exp(-dt * 7);
    pointer.x += ((onCard ? pointer.tx : 0) - pointer.x) * k;
    pointer.y += ((onCard ? pointer.ty : 0) - pointer.y) * k;
    pointer.tilt += ((onCard ? 1 : 0) - pointer.tilt) * k;

    for (const l of layers) {
      const fx = l.ax * Math.sin(t * l.wx * Math.PI * 2 + l.ph);
      const fy = l.ay * Math.sin(t * l.wy * Math.PI * 2 + l.ph * 1.7);
      const px = pointer.x * cardW * l.depth;
      const py = pointer.y * cardH * l.depth;
      const z = l.depth * pointer.tilt * 26;
      l.el.style.transform = `${l.base}perspective(1000px) `
        + `translate3d(${(fx + px + l.o.x).toFixed(2)}px, ${(fy + py + l.o.y).toFixed(2)}px, ${z.toFixed(2)}px) `
        + `rotateY(${(pointer.x * 4 * pointer.tilt).toFixed(3)}deg) `
        + `rotateX(${(-pointer.y * 3 * pointer.tilt).toFixed(3)}deg) `
        + `scale(${l.s.v.toFixed(4)})`;
    }

    const hb = haloBreath.v;
    halo.style.boxShadow =
      `0 0 0 ${(2 + hb * 2.5).toFixed(2)}px rgba(245,94,34,${(0.1 + hb * 0.12).toFixed(3)}), `
      + `0 0 ${(14 + hb * 16).toFixed(1)}px ${(3 + hb * 5).toFixed(1)}px rgba(245,94,34,${(0.16 + hb * 0.2).toFixed(3)})`;
    halo.style.opacity = String(Math.min(1, 0.35 + hb * 0.4));

    const bg = boltGlint.v;
    bolt.style.boxShadow = bg > 0.002
      ? `0 0 ${(10 + bg * 22).toFixed(1)}px ${(bg * 5).toFixed(1)}px rgba(245,94,34,${(bg * 0.5).toFixed(3)})`
      : '';
    bolt.style.backgroundColor = bg > 0.002 ? `rgb(${230 + Math.min(25, bg * 25)},${230 + Math.min(21, bg * 21)},${230 + Math.min(18, bg * 18)})` : '';

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
    charge?.kill();
    ambient.kill();
    floats.forEach((f) => f.kill());
    gsap.killTweensOf([wallet, shine, projection, gridImg, grid, pill, pie, bolt, marker,
      ...dots, ...layers.map((l) => l.s), ...layers.map((l) => l.o),
      tally, reveal, walker, haloBreath, boltGlint, seg]);
    for (const l of layers) { l.el.style.transform = ''; l.el.style.opacity = ''; }
    gridImg.style.transform = '';
    grid.style.opacity = '';
    marker.style.opacity = '';
    halo.style.boxShadow = '';
    line.style.clipPath = '';
    marker.style.transform = '';
    bolt.style.boxShadow = '';
    bolt.style.backgroundColor = '';
    pill.style.opacity = '';
    pie.style.opacity = '';
    bolt.style.opacity = '';
    wallet.style.transform = '';
    tally.v = 200;
    writeTally();
  });

  return teardown;
}
