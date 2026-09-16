/**
 * Motion for bento card B — "Your funds leave whenever you want".
 *
 * Direction: **Signal relay** — the dotted orbit between the wallet and the
 * market ring is a wire, so the card spends its resting life pushing packets of
 * light down it. On top of that sit a Bayer-dithered WebGL bloom (the same
 * halftone language as the Figma shader stack the static art fakes with blur),
 * a real-perspective parallax that answers the pointer, and a torch that only
 * lights the part of the diagram you are reading.
 *
 * Nothing here touches Bento.tsx or Bento.css. Every node this module adds is
 * created at runtime and removed again by the teardown it returns.
 *
 * Geometry, in the 464 x 215 coordinate space of `.funds__art`:
 *   wallet ring     circle  c(54.5, 107.5)  r 46
 *   dotted orbit    ellipse c(194.5, 108)   r 107 x 58.5
 *   market ring     circle  c(349.5, 107.5) r 107   — the four asset tiles sit on it
 */
import { gsap } from 'gsap';

type ThreeMod = typeof import('three');

const NS = 'http://www.w3.org/2000/svg';

const P_WALLET = 'M8.5 107.5a46 46 0 1 1 92 0a46 46 0 1 1 -92 0';
const P_DOTTED = 'M87.5 108a107 58.5 0 1 1 214 0a107 58.5 0 1 1 -214 0';
const P_RING = 'M242.5 107.5a107 107 0 1 1 214 0a107 107 0 1 1 -214 0';

/** One animated element and everything currently displacing it. */
interface Node {
  el: HTMLElement;
  cx: number;
  cy: number;
  z: number;
  amp: number;
  per: number;
  ph: number;
  mx: number;
  my: number;
  tx: number;
  ty: number;
  lit: number;
  litTo: number;
  isDot: boolean;
  /* the entrance writes here, never to the element, so it cannot fight the
     per-frame compositor below for the transform */
  ix: number;
  is: number;
}

const q = <T extends Element>(root: Element, sel: string) => root.querySelector(sel) as T | null;
const qq = <T extends Element>(root: Element, sel: string) => Array.from(root.querySelectorAll(sel)) as T[];
const damp = (a: number, b: number, k: number) => a + (b - a) * k;

export function funds(card: HTMLElement): () => void {
  const art = q<HTMLElement>(card, '.funds__art');
  if (!art) return () => {};

  const kill: Array<() => void> = [];
  const on = <K extends keyof HTMLElementEventMap>(
    t: HTMLElement | Window,
    k: K | string,
    fn: (e: never) => void,
  ) => {
    t.addEventListener(k as string, fn as EventListener);
    kill.push(() => t.removeEventListener(k as string, fn as EventListener));
  };

  const glow = q<HTMLElement>(art, '.funds__glow');
  const ringO = q<HTMLElement>(art, '.funds__ring-orange');
  const ringW = q<HTMLElement>(art, '.funds__ring-wallet');
  const disc = q<HTMLElement>(art, '.funds__wallet-disc');
  const walletIcon = q<HTMLElement>(art, '.funds__wallet-icon');
  const pills = qq<HTMLElement>(art, '.funds__pill');
  const tiles = qq<HTMLElement>(art, '.funds__tile');
  const labels = qq<HTMLElement>(art, '.funds__label:not(.funds__label--wallet)');
  const dots = qq<HTMLElement>(art, '.funds__node');

  /* Under prefers-reduced-motion the signed-off static card is the whole
     deliverable: add nothing, animate nothing, hand back a no-op. */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  /* ------------------------------------------------------------------ layers */
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0;mix-blend-mode:screen';
  card.insertBefore(canvas, card.firstChild);

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 464 215');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;left:0;top:0;width:464px;height:215px;overflow:visible;pointer-events:none';
  const path = (d: string, stroke: string, w: string, op: string) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.style.cssText = `fill:none;stroke:${stroke};stroke-width:${w};opacity:${op};stroke-linecap:round`;
    svg.appendChild(p);
    return p;
  };
  // Stand-ins for the two shipped <img> rings, stroke for stroke, so they can
  // be drawn on. The originals are only hidden once these exist.
  const ghostW = path(P_WALLET, '#D9D9D9', '1', '0.2');
  const ghostR = path(P_RING, '#FF632A', '1', '0.22');
  const cometD = path(P_DOTTED, '#ff7a3c', '1.6', '0');
  const cometR = path(P_RING, '#ff7a3c', '1.6', '0');
  const head = (): SVGCircleElement => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '2.6');
    c.style.cssText = 'fill:#ff8a4d;opacity:0';
    svg.appendChild(c);
    return c;
  };
  const headD = head();
  const headR = head();
  // Behind the pills and the tiles, exactly where the dotted path and the ring
  // sit in the static art.
  art.insertBefore(svg, disc ?? art.firstChild);

  const torch = document.createElement('span');
  torch.style.cssText =
    'position:absolute;inset:-60px;pointer-events:none;opacity:0;mix-blend-mode:plus-lighter;' +
    'background:radial-gradient(150px circle at var(--tx,50%) var(--ty,50%),' +
    'rgba(255,138,77,.16),rgba(255,138,77,.05) 38%,transparent 66%)';
  art.appendChild(torch);

  const added = [canvas, svg, torch];

  /* ------------------------------------------------------------- compositor */
  const centre = (el: HTMLElement) => ({
    x: parseFloat(el.style.left || '0') + el.offsetWidth / 2,
    y: parseFloat(el.style.top || '0') + el.offsetHeight / 2,
  });
  const node = (el: HTMLElement, z: number, amp: number, per: number, i: number): Node => {
    const c = centre(el);
    return { el, cx: c.x, cy: c.y, z, amp, per, ph: i * 1.7, mx: 0, my: 0, tx: 0, ty: 0, lit: 0, litTo: 0, ix: 0, is: 1, isDot: false };
  };
  const nodes: Node[] = [
    ...pills.map((el, i) => node(el, 30, 1.5, 4.1, i)),
    ...tiles.map((el, i) => node(el, 40, 2.1, 3.3, i + 2)),
    ...labels.map((el, i) => node(el, 26, 1.7, 3.6, i + 2)),
    ...dots.map((el, i) => ({ ...node(el, 34, 1.1, 5.2, i + 6), isDot: true })),
  ];
  gsap.set([glow], { z: -34 });
  gsap.set([ringO, ringW, svg], { z: -10 });
  gsap.set([disc, walletIcon], { z: 18 });
  gsap.set(art, { xPercent: -50, yPercent: -50, transformStyle: 'preserve-3d' });
  const prevPerspective = card.style.perspective;
  card.style.perspective = '1100px';

  /* --------------------------------------------------------------- entrance */
  const lenW = ghostW.getTotalLength();
  const lenR = ghostR.getTotalLength();
  ghostW.style.strokeDasharray = String(lenW);
  ghostR.style.strokeDasharray = String(lenR);
  gsap.set([ringO, ringW], { autoAlpha: 0 });

  /* The wipe that grows the dotted orbit out of the wallet. Declared here in
     JS because Bento.css is not ours to touch. */
  if (glow) {
    const wipe = 'linear-gradient(90deg,#000 var(--wipe,100%),transparent calc(var(--wipe,100%) + 7%))';
    glow.style.setProperty('-webkit-mask-image', wipe);
    glow.style.setProperty('mask-image', wipe);
  }

  const nPills = nodes.slice(0, pills.length);
  const nAssets = nodes.slice(pills.length, pills.length + tiles.length + labels.length);
  const nDots = nodes.slice(pills.length + tiles.length + labels.length);
  const ambient = { comet: 0 };
  const discIn = { s: 0.84 };

  const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  intro
    .set([ghostW, ghostR], { strokeDashoffset: (i: number) => (i ? lenR : lenW) })
    .set(glow, { '--wipe': '0%' })
    .set([...pills, ...tiles, ...labels, ...dots, disc, walletIcon], { autoAlpha: 0 })
    .set(nPills, { ix: -16 })
    .set(nAssets, { ix: 20 })
    .set(nDots, { is: 0 })
    // lead — the wallet arrives first, with a little anticipation
    .to([disc, walletIcon], { autoAlpha: 1, duration: 0.34 })
    .to(discIn, { s: 1, duration: 0.5, ease: 'back.out(2.1)' }, '<')
    .to(ghostW, { strokeDashoffset: 0, duration: 0.46 }, '-=0.4')
    // the wire grows out of the wallet, the market ring closes behind it
    .to(glow, { '--wipe': '100%', duration: 0.54 }, '-=0.26')
    .to(ghostR, { strokeDashoffset: 0, duration: 0.56 }, '-=0.34')
    // overlap — the two contracts slide in from the wallet side
    .to(pills, { autoAlpha: 1, duration: 0.4, stagger: 0.07 }, '-=0.46')
    .to(nPills, { ix: 0, duration: 0.52, stagger: 0.07 }, '<')
    // late accent — the assets land from outside the ring and settle
    .to([...tiles, ...labels], { autoAlpha: 1, duration: 0.38, stagger: 0.045 }, '-=0.34')
    .to(nAssets, { ix: 0, duration: 0.54, stagger: 0.045 }, '<')
    .to(dots, { autoAlpha: 1, duration: 0.3, stagger: 0.09 }, '-=0.3')
    .to(nDots, { is: 1, duration: 0.42, ease: 'back.out(2.6)', stagger: 0.09 }, '<')
    .to(ambient, { comet: 1, duration: 0.7 }, '-=0.4');

  /* -------------------------------------------------------------- interaction */
  const level = { v: 0.34, flash: 0 };
  const tilt = { rx: 0, ry: 0, x: 0, y: 0, tRx: 0, tRy: 0, tX: 0, tY: 0 };
  let pointer: { x: number; y: number } | null = null;

  on(card, 'pointermove', (e: PointerEvent) => {
    const b = card.getBoundingClientRect();
    const nx = (e.clientX - b.left) / b.width - 0.5;
    const ny = (e.clientY - b.top) / b.height - 0.5;
    tilt.tRy = nx * 11;
    tilt.tRx = -ny * 9;
    tilt.tX = nx * -12;
    tilt.tY = ny * -8;
    const a = art.getBoundingClientRect();
    torch.style.setProperty('--tx', `${e.clientX - a.left + 60}px`);
    torch.style.setProperty('--ty', `${e.clientY - a.top + 60}px`);
    pointer = { x: e.clientX, y: e.clientY };
  });
  on(card, 'pointerenter', () => {
    gsap.to(level, { v: 1, flash: 1, duration: 0.5, ease: 'power3.out' });
    gsap.to(torch, { opacity: 1, duration: 0.45, ease: 'power3.out' });
  });
  on(card, 'pointerleave', () => {
    pointer = null;
    tilt.tRx = tilt.tRy = tilt.tX = tilt.tY = 0;
    gsap.to(level, { v: 0.34, flash: 0, duration: 0.7, ease: 'power3.out' });
    gsap.to(torch, { opacity: 0, duration: 0.55, ease: 'power3.out' });
    nodes.forEach((n) => {
      n.litTo = 0;
      n.tx = 0;
      n.ty = 0;
    });
  });

  /* the asset a packet is passing gets a short flash, once per pass */
  const flashing = new WeakSet<HTMLElement>();
  const flash = (el: HTMLElement, strength: number) => {
    if (flashing.has(el)) return;
    flashing.add(el);
    gsap.fromTo(
      el,
      { boxShadow: '0 0 0 0 rgba(255,122,60,0)' },
      {
        boxShadow: `0 0 18px -2px rgba(255,122,60,${(0.2 + strength * 0.35).toFixed(2)})`,
        duration: 0.22,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.set(el, { clearProps: 'boxShadow' });
          flashing.delete(el);
        },
      },
    );
  };

  /* --------------------------------------------------------------- the loop */
  const lenDot = cometD.getTotalLength();
  const lenRing = cometR.getTotalLength();
  cometD.style.strokeDasharray = `54 ${lenDot - 54}`;
  cometR.style.strokeDasharray = `74 ${lenRing - 74}`;

  let raf = 0;
  let running = false;
  let t0 = 0;
  let glTick: ((t: number, dot: DOMPoint, heat: number) => void) | null = null;

  const frame = (now: number) => {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;

    // packets — a dash segment sliding the path plus a sampled head, which is
    // what MotionPathPlugin would do if we had it
    const pd = (t / 3.4) % 1;
    const pr = 1 - ((t / 5.2) % 1);
    const o = level.v * ambient.comet;
    cometD.style.strokeDashoffset = String(-pd * lenDot);
    cometR.style.strokeDashoffset = String(-pr * lenRing);
    cometD.style.opacity = String(o);
    cometR.style.opacity = String(o);
    const a = cometD.getPointAtLength(pd * lenDot);
    const b = cometR.getPointAtLength(pr * lenRing);
    headD.setAttribute('cx', String(a.x));
    headD.setAttribute('cy', String(a.y));
    headR.setAttribute('cx', String(b.x));
    headR.setAttribute('cy', String(b.y));
    const ho = String(Math.min(1, o * 1.6));
    headD.style.opacity = ho;
    headR.style.opacity = ho;

    // damped pointer parallax on a real perspective
    tilt.rx = damp(tilt.rx, tilt.tRx, 0.08);
    tilt.ry = damp(tilt.ry, tilt.tRy, 0.08);
    tilt.x = damp(tilt.x, tilt.tX, 0.07);
    tilt.y = damp(tilt.y, tilt.tY, 0.07);
    gsap.set(art, { rotationX: tilt.rx, rotationY: tilt.ry, x: tilt.x, y: tilt.y });

    const pb = pointer ? art.getBoundingClientRect() : null;
    nodes.forEach((n) => {
      if (pointer && pb) {
        const ex = pb.left + n.cx;
        const ey = pb.top + n.cy;
        const d = Math.hypot(ex - pointer.x, ey - pointer.y);
        n.litTo = Math.max(0, 1 - d / 165);
        const pull = d < 130 ? (1 - d / 130) * 7 : 0;
        n.tx = ((pointer.x - ex) / (d || 1)) * pull;
        n.ty = ((pointer.y - ey) / (d || 1)) * pull;
      }
      // the orange nodes also answer a passing packet, hover or not
      const packet = n.isDot
        ? Math.max(0, 1 - Math.min(Math.hypot(n.cx - a.x, n.cy - a.y), Math.hypot(n.cx - b.x, n.cy - b.y)) / 34)
        : 0;
      n.lit = Math.max(damp(n.lit, n.litTo, 0.12), packet * 0.85);
      n.mx = damp(n.mx, n.tx, 0.1);
      n.my = damp(n.my, n.ty, 0.1);
      // every element breathes on its own period, so a frame at 10s never
      // matches a frame at 20s, and the loop has no seam to catch
      const bx = Math.cos(t / (n.per * 1.37) + n.ph) * n.amp * 0.5;
      const by = Math.sin(t / n.per + n.ph) * n.amp;
      gsap.set(n.el, {
        x: n.mx + bx + n.ix,
        y: n.my + by,
        z: n.z,
        scale: (1 + n.lit * 0.05) * n.is,
        transformOrigin: '50% 50%',
        filter: n.lit > 0.01 ? `brightness(${(1 + n.lit * 0.55).toFixed(3)})` : 'none',
      });
    });
    gsap.set(disc, { scale: discIn.s * (1 + Math.sin(t / 2.6) * 0.022), transformOrigin: '50% 50%' });

    /* The nodes pulse as a packet goes by — always, not only on hover; the
       pointer just turns the pulse up. */
    const near = (el: HTMLElement, px: number, py: number, r: number) => {
      const c = centre(el);
      return Math.hypot(c.x - px, c.y - py) < r;
    };
    tiles.forEach((el) => near(el, b.x, b.y, 26) && flash(el, level.flash));
    pills.forEach((el) => near(el, a.x, a.y, 30) && flash(el, level.flash));


    glTick?.(t, a, level.v);
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    t0 = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  let introduced = false;
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        if (!introduced) {
          introduced = true;
          intro.play();
        }
        start();
      } else {
        stop();
      }
    },
    { rootMargin: '120px' },
  );
  io.observe(card);

  /* ------------------------------------------------------- WebGL dither bloom
     The Figma glows are a halftone + ordered-dither shader stack that the
     static art approximates with a blurred PNG. This is the real thing: a
     4x4 Bayer threshold over a warm field that pools under the pointer, rings
     out on entry and rides along with the relay packet. */
  let disposeGl: (() => void) | null = null;
  let disposed = false;

  void (async () => {
    let THREE: ThreeMod;
    try {
      THREE = await import('three');
    } catch {
      return; // no module: the GSAP relay above is the whole show
    }
    if (disposed) return;

    let renderer: import('three').WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch {
      return; // no WebGL context: same graceful result
    }

    const uniforms = {
      uTime: { value: 0 },
      uHeat: { value: 0 },
      uCell: { value: 1 },
      uPointer: { value: new THREE.Vector2(-999, -999) },
      uComet: { value: new THREE.Vector2(-999, -999) },
      uRing: { value: new THREE.Vector2(-999, -999) },
      uRingT: { value: -999 },
      uWarm: { value: new THREE.Color('#ff8a4d') },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthTest: false,
      vertexShader: 'void main(){ gl_Position = vec4(position, 1.0); }',
      fragmentShader: `
        precision highp float;
        uniform vec2  uPointer, uComet, uRing;
        uniform float uTime, uHeat, uCell, uRingT;
        uniform vec3  uWarm;

        float bayer(vec2 p){
          int x = int(mod(p.x, 4.0)); int y = int(mod(p.y, 4.0));
          int i = x + y * 4;
          float m[16];
          m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
          m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
          m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
          m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
          for(int k=0;k<16;k++){ if(k==i) return (m[k]+0.5)/16.0; }
          return 0.5;
        }

        void main(){
          vec2 f = gl_FragCoord.xy;
          float a = 0.0;

          a += uHeat * smoothstep(210.0, 0.0, distance(f, uPointer)) * 0.85;
          a += smoothstep(74.0, 0.0, distance(f, uComet)) * (0.30 + uHeat * 0.40);

          float t = uTime - uRingT;
          if(uRingT > -900.0 && t >= 0.0 && t < 1.5){
            float r = t * 420.0;
            a += smoothstep(58.0, 0.0, abs(distance(f, uRing) - r)) * (1.0 - t / 1.5) * 0.7;
          }

          a = clamp(a, 0.0, 1.0);
          a = step(bayer(f / uCell), a) * a;
          if(a <= 0.003) discard;
          gl_FragColor = vec4(uWarm, a * 0.42);
        }`,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.Camera();

    const dpr = () => Math.min(devicePixelRatio, 2);
    const resize = () => {
      const b = card.getBoundingClientRect();
      renderer.setPixelRatio(dpr());
      renderer.setSize(b.width, b.height, false);
      uniforms.uCell.value = dpr();
    };
    resize();
    on(window, 'resize', resize);
    gsap.set(canvas, { opacity: 1 });

    const toGl = (x: number, y: number): [number, number] => [x * dpr(), (card.clientHeight - y) * dpr()];

    on(card, 'pointermove', (e: PointerEvent) => {
      const b = card.getBoundingClientRect();
      const [gx, gy] = toGl(e.clientX - b.left, e.clientY - b.top);
      uniforms.uPointer.value.set(gx, gy);
    });
    on(card, 'pointerenter', (e: PointerEvent) => {
      const b = card.getBoundingClientRect();
      const [gx, gy] = toGl(e.clientX - b.left, e.clientY - b.top);
      uniforms.uRing.value.set(gx, gy);
      uniforms.uRingT.value = uniforms.uTime.value;
    });

    glTick = (t, dotPoint, heat) => {
      uniforms.uTime.value = t;
      uniforms.uHeat.value = heat;
      const ab = art.getBoundingClientRect();
      const cb = card.getBoundingClientRect();
      const [gx, gy] = toGl(ab.left - cb.left + dotPoint.x, ab.top - cb.top + dotPoint.y);
      uniforms.uComet.value.set(gx, gy);
      renderer.render(scene, camera);
    };

    disposeGl = () => {
      glTick = null;
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  })();

  /* -------------------------------------------------------------- teardown */
  return () => {
    disposed = true;
    stop();
    io.disconnect();
    intro.kill();
    kill.forEach((f) => f());
    disposeGl?.();
    gsap.killTweensOf([
      art,
      disc,
      walletIcon,
      torch,
      level,
      tilt,
      ambient,
      discIn,
      ...nodes,
      ...pills,
      ...tiles,
      ...labels,
      ...dots,
    ]);
    gsap.set([art, disc, walletIcon, ...pills, ...tiles, ...labels, ...dots], { clearProps: 'transform,filter,boxShadow,opacity,visibility' });
    gsap.set([ringO, ringW], { clearProps: 'opacity,visibility' });
    if (glow) {
      glow.style.removeProperty('--wipe');
      glow.style.removeProperty('-webkit-mask-image');
      glow.style.removeProperty('mask-image');
    }
    card.style.perspective = prevPerspective;
    added.forEach((el) => el.remove());
  };
}
