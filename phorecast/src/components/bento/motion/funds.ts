/**
 * Motion for bento card B — "Your funds leave whenever you want".
 *
 * Two triggers only, per MOTION.md: a load-in and a loop. No hover, no pointer
 * tracking — this is artwork, not a control.
 *
 *   Load-in  The wallet lands alone and is given a beat. Then the dotted orbit
 *            draws itself out toward the contracts (the longest travel on the
 *            card), the two chips arrive one at a time, the market ring closes
 *            behind them, and the four assets follow with their labels. The
 *            orange nodes are the last accent.
 *   Loop     Packets of light run the dotted orbit and the market ring on long
 *            10s and 13s laps, lighting each node, chip and asset they pass. A
 *            WebGL layer prints the brand's Bayer halftone as a bloom riding
 *            with the leading packet — the shader language the static PNG fakes
 *            with a blur. Everything breathes on its own period and phase.
 *
 * Every entrance tween is a `gsap.from`, so if this module never runs the card
 * is simply the approved static design.
 *
 * Geometry, in the 464 x 215 space of `.funds__art`:
 *   wallet ring   circle  c(54.5, 107.5)  r 46
 *   dotted orbit  ellipse c(194.5, 108)   r 107 x 58.5
 *   market ring   circle  c(349.5, 107.5) r 107  — the four asset tiles sit on it
 */
import { gsap } from 'gsap';

type ThreeMod = typeof import('../../../lib/three-lite');

const NS = 'http://www.w3.org/2000/svg';
const P_WALLET = 'M8.5 107.5a46 46 0 1 1 92 0a46 46 0 1 1 -92 0';
const P_DOTTED = 'M87.5 108a107 58.5 0 1 1 214 0a107 58.5 0 1 1 -214 0';
const P_RING = 'M242.5 107.5a107 107 0 1 1 214 0a107 107 0 1 1 -214 0';

const LAP_DOTTED = 10; // seconds for one lap of the dotted orbit
const LAP_RING = 13; // and one of the market ring

/** One element the loop breathes, plus the offsets the load-in writes. */
interface Node {
  el: HTMLElement;
  cx: number;
  cy: number;
  amp: number;
  per: number;
  ph: number;
  /** the load-in writes here, never to the element, so the two never fight */
  ix: number;
  is: number;
  isDot: boolean;
  lit: number;
}

const q = <T extends Element>(r: Element, s: string) => r.querySelector(s) as T | null;
const qq = <T extends Element>(r: Element, s: string) => Array.from(r.querySelectorAll(s)) as T[];
const TAU = Math.PI * 2;

export function funds(card: HTMLElement): () => void {
  const art = q<HTMLElement>(card, '.funds__art');
  if (!art) return () => {};
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const glow = q<HTMLElement>(art, '.funds__glow');
  const ringO = q<HTMLElement>(art, '.funds__ring-orange');
  const ringW = q<HTMLElement>(art, '.funds__ring-wallet');
  const disc = q<HTMLElement>(art, '.funds__wallet-disc');
  const walletIcon = q<HTMLElement>(art, '.funds__wallet-icon');
  const pills = qq<HTMLElement>(art, '.funds__pill');
  const tiles = qq<HTMLElement>(art, '.funds__tile');
  const labels = qq<HTMLElement>(art, '.funds__label:not(.funds__label--wallet)');
  const dots = qq<HTMLElement>(art, '.funds__node');

  const unbind: Array<() => void> = [];

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
  const line = (d: string, stroke: string, w: string, op: string) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.style.cssText = `fill:none;stroke:${stroke};stroke-width:${w};opacity:${op};stroke-linecap:round`;
    svg.appendChild(p);
    return p;
  };
  // Stand-ins for the two shipped <img> rings, stroke for stroke, so the
  // load-in can draw them. The originals only stand down once these exist.
  const ghostW = line(P_WALLET, '#D9D9D9', '1', '0.2');
  const ghostR = line(P_RING, '#FF632A', '1', '0.22');
  const cometD = line(P_DOTTED, '#ff7a3c', '1.6', '0.5');
  const cometR = line(P_RING, '#ff7a3c', '1.6', '0.5');
  const head = () => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '2.6');
    c.style.cssText = 'fill:#ff8a4d;opacity:.8';
    svg.appendChild(c);
    return c;
  };
  const headD = head();
  const headR = head();
  // Behind the chips and the assets, where the dotted path and the ring sit.
  art.insertBefore(svg, disc ?? art.firstChild);
  gsap.set([ringO, ringW], { autoAlpha: 0 });

  /* ----------------------------------------------------------------- the loop */
  const centre = (el: HTMLElement) => ({
    x: parseFloat(el.style.left || '0') + el.offsetWidth / 2,
    y: parseFloat(el.style.top || '0') + el.offsetHeight / 2,
  });
  const node = (el: HTMLElement, amp: number, per: number, i: number, isDot = false): Node => {
    const c = centre(el);
    return { el, cx: c.x, cy: c.y, amp, per, ph: i * 2.3, ix: 0, is: 1, isDot, lit: 0 };
  };
  const nPills = pills.map((el, i) => node(el, 1.1, 11.5, i));
  const nAssets = [
    ...tiles.map((el, i) => node(el, 1.4, 9.5, i + 2)),
    ...labels.map((el, i) => node(el, 1.1, 10.5, i + 2)),
  ];
  const nDots = dots.map((el, i) => node(el, 0.8, 13, i + 6, true));
  const nodes = [...nPills, ...nAssets, ...nDots];

  /* ------------------------------------------------------------- the load-in */
  if (glow) {
    // Declared here because Bento.css is not ours to touch.
    const wipe = 'linear-gradient(90deg,#000 var(--wipe,100%),transparent calc(var(--wipe,100%) + 7%))';
    glow.style.setProperty('--wipe', '100%');
    glow.style.setProperty('-webkit-mask-image', wipe);
    glow.style.setProperty('mask-image', wipe);
  }
  const lenW = ghostW.getTotalLength();
  const lenR = ghostR.getTotalLength();
  ghostW.style.strokeDasharray = String(lenW);
  ghostR.style.strokeDasharray = String(lenR);

  /* Settled values. The entrance is built entirely from `gsap.from`, so these
     are the rest state and the timeline animates back to them. */
  const relay = { on: 1 };
  const discIn = { s: 1 };

  // tile and its label travel in together, one asset every 0.15s
  const assetOrder: HTMLElement[] = [];
  const assetNodes: Node[] = [];
  tiles.forEach((el, i) => {
    assetOrder.push(el);
    assetNodes.push(nAssets[i]);
    if (labels[i]) {
      assetOrder.push(labels[i]);
      assetNodes.push(nAssets[tiles.length + i]);
    }
  });

  const intro = gsap.timeline({
    paused: true,
    defaults: { ease: 'power3.out', immediateRender: true },
  });
  intro
    // LEAD — the wallet, alone
    .from([disc, walletIcon], { autoAlpha: 0, duration: 0.85 }, 0)
    .from(discIn, { s: 0.94, duration: 1.25 }, 0)
    .from(ghostW, { strokeDashoffset: lenW, duration: 1.3, ease: 'expo.out' }, 0.08)
    // ——— beat ———
    // the wire draws itself out of the wallet: the longest travel on the card
    .from(glow, { '--wipe': '0%', duration: 1.45, ease: 'expo.out' }, 1.65)
    // the two contracts arrive one at a time
    .from(pills, { autoAlpha: 0, duration: 0.7, stagger: 0.2 }, 2.1)
    .from(nPills, { ix: -24, duration: 1.15, ease: 'expo.out', stagger: 0.2 }, 2.1)
    // the market ring closes behind them
    .from(ghostR, { strokeDashoffset: lenR, duration: 1.3, ease: 'expo.out' }, 2.4)
    // then the four assets with their labels, 0.15s apart — countable
    .from(assetOrder, { autoAlpha: 0, duration: 0.7, stagger: 0.075 }, 2.8)
    .from(assetNodes, { ix: 22, duration: 1, ease: 'power2.out', stagger: 0.075 }, 2.8)
    // accent — the nodes, the only overshoot here, and under 7px of it
    .from(dots, { autoAlpha: 0, duration: 0.4, stagger: 0.18 }, 3.6)
    .from(nDots, { is: 0.72, duration: 0.55, ease: 'back.out(1.7)', stagger: 0.18 }, 3.6)
    // and the relay fades up into its resting loop
    .from(relay, { on: 0, duration: 1.2, ease: 'sine.inOut' }, 3.9);

  /* ------------------------------------------------------- packets and pulses */
  const lenDot = cometD.getTotalLength();
  const lenRing = cometR.getTotalLength();
  cometD.style.strokeDasharray = `54 ${lenDot - 54}`;
  cometR.style.strokeDasharray = `74 ${lenRing - 74}`;

  let raf = 0;
  let running = false;
  let t0 = 0;
  let glTick: ((t: number, dot: DOMPoint) => void) | null = null;

  const frame = (now: number) => {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;

    /* Packets: a dash segment sliding the path plus a head sampled off it,
       which is what MotionPathPlugin would do if we had it. Both laps are
       whole cycles, so the loop has no seam. */
    const pd = (t / LAP_DOTTED) % 1;
    const pr = 1 - ((t / LAP_RING) % 1);
    cometD.style.strokeDashoffset = String(-pd * lenDot);
    cometR.style.strokeDashoffset = String(-pr * lenRing);
    const o = relay.on;
    cometD.style.opacity = String(0.5 * o);
    cometR.style.opacity = String(0.5 * o);
    const a = cometD.getPointAtLength(pd * lenDot);
    const b = cometR.getPointAtLength(pr * lenRing);
    headD.setAttribute('cx', String(a.x));
    headD.setAttribute('cy', String(a.y));
    headR.setAttribute('cx', String(b.x));
    headR.setAttribute('cy', String(b.y));
    headD.style.opacity = String(0.85 * o);
    headR.style.opacity = String(0.85 * o);

    nodes.forEach((n) => {
      // each element on its own phase and period, so the group never pulses in
      // lockstep, and every cycle is a sine
      const by = Math.sin((t / n.per) * TAU + n.ph) * n.amp;
      const bx = Math.cos((t / (n.per * 1.37)) * TAU + n.ph) * n.amp * 0.5;
      // and everything lights a little as a packet goes past it
      const d = Math.min(Math.hypot(n.cx - a.x, n.cy - a.y), Math.hypot(n.cx - b.x, n.cy - b.y));
      const reach = n.isDot ? 34 : 30;
      const want = Math.max(0, 1 - d / reach) * o;
      n.lit += (want - n.lit) * 0.09;
      gsap.set(n.el, {
        x: bx + n.ix,
        y: by,
        scale: n.is,
        transformOrigin: '50% 50%',
        filter: n.lit > 0.01 ? `brightness(${(1 + n.lit * 0.75).toFixed(3)})` : 'none',
      });
    });
    gsap.set(disc, { scale: discIn.s * (1 + Math.sin((t / 9) * TAU) * 0.016), transformOrigin: '50% 50%' });

    glTick?.(t, a);
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

  /* -------------------------------------------------------- WebGL dither bloom
     The Figma glow is a halftone + ordered-dither stack the static PNG fakes
     with a blur. This is the real thing: a 4x4 Bayer threshold over a warm
     field that travels with the leading packet and breathes with the wallet. */
  let disposeGl: (() => void) | null = null;
  let disposed = false;

  void (async () => {
    let THREE: ThreeMod;
    try {
      THREE = await import('../../../lib/three-lite');
    } catch {
      return; // no module — the SVG relay is the whole show
    }
    if (disposed) return;
    let renderer: import('three').WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch {
      return; // no context — same graceful result
    }

    const uniforms = {
      uTime: { value: 0 },
      uCell: { value: 1 },
      uComet: { value: new THREE.Vector2(-999, -999) },
      uWallet: { value: new THREE.Vector2(-999, -999) },
      uOn: { value: 0 },
      uWarm: { value: new THREE.Color('#ff8a4d') },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthTest: false,
      vertexShader: 'void main(){ gl_Position = vec4(position, 1.0); }',
      fragmentShader: `
        precision highp float;
        uniform vec2  uComet, uWallet;
        uniform float uTime, uCell, uOn;
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
          // the bloom riding with the leading packet
          float a = smoothstep(96.0, 0.0, distance(f, uComet)) * 0.46;
          // and a slow breath around the wallet, on an 11s cycle
          a += smoothstep(150.0, 0.0, distance(f, uWallet))
             * (0.16 + 0.08 * sin(uTime * 0.5712));
          a = clamp(a * uOn, 0.0, 1.0);
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
    addEventListener('resize', resize);
    unbind.push(() => removeEventListener('resize', resize));
    gsap.set(canvas, { opacity: 1 });

    glTick = (t, dotPoint) => {
      const ab = art.getBoundingClientRect();
      const cb = card.getBoundingClientRect();
      const d = dpr();
      const h = card.clientHeight;
      const ox = ab.left - cb.left;
      const oy = ab.top - cb.top;
      uniforms.uTime.value = t;
      uniforms.uOn.value = relay.on;
      // gl_FragCoord counts up from the bottom; the DOM counts down from the top
      uniforms.uComet.value.set((ox + dotPoint.x) * d, (h - (oy + dotPoint.y)) * d);
      uniforms.uWallet.value.set((ox + 54.5) * d, (h - (oy + 107.5)) * d);
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
    unbind.forEach((f) => f());
    disposeGl?.();
    gsap.killTweensOf([disc, walletIcon, relay, discIn, ...pills, ...tiles, ...labels, ...dots, ...nodes]);
    gsap.set([disc, walletIcon, ...pills, ...tiles, ...labels, ...dots], {
      clearProps: 'transform,filter,opacity,visibility',
    });
    gsap.set([ringO, ringW], { clearProps: 'opacity,visibility' });
    if (glow) {
      glow.style.removeProperty('--wipe');
      glow.style.removeProperty('-webkit-mask-image');
      glow.style.removeProperty('mask-image');
    }
    canvas.remove();
    svg.remove();
  };
}
