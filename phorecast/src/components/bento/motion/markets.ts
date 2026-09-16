/**
 * Motion for bento card D — "Trade every market from one account".
 *
 * Direction: **Live orbit** — the two crossed ellipses are tracks, so the
 * assets actually ride them. Every tile is sampled onto the real orbit path
 * with getPointAtLength, so nothing ever leaves its rail, and at rest the
 * cursor the design ships keeps working: it glides from asset to asset, the
 * tooltip label wipes through to the new name and the tile lifts. Put your own
 * pointer on the card and you take the controls — the orbit answers your
 * horizontal position, the plane tilts on a real perspective, and the nearest
 * asset is drawn toward you.
 *
 * This is the cream card, so the whole treatment is built for light: cast
 * shadow, lift, depth and printed ink. Nothing here glows.
 *
 * Nothing touches Bento.tsx or Bento.css — every node is created at runtime
 * and removed again by the teardown this returns.
 */
import { gsap } from 'gsap';

type ThreeMod = typeof import('three');

const NS = 'http://www.w3.org/2000/svg';

/** The shipped orbit-ring path, verbatim from assets/bento/orbit-ring.svg. */
const ORBIT =
  'M249.148 0.379883C317.915 0.379904 380.155 10.8098 425.189 27.6602C447.708 36.0859 465.905 46.1093 478.466 ' +
  '57.2207C491.027 68.3325 497.917 80.5001 497.917 93.2236C497.917 105.947 491.027 118.114 478.466 129.226C465.905 ' +
  '140.337 447.708 150.36 425.189 158.786C380.155 175.637 317.915 186.066 249.148 186.066C180.381 186.066 118.141 ' +
  '175.637 73.1064 158.786C50.5881 150.36 32.3914 140.337 19.8311 129.226C7.27024 118.114 0.380023 105.947 0.379883 ' +
  '93.2236C0.379883 80.5001 7.27011 68.3325 19.8311 57.2207C32.3914 46.1095 50.5881 36.0858 73.1064 ' +
  '27.6602C118.141 10.8097 180.381 0.379883 249.148 0.379883Z';
/** Matches .mk__orbit--a / --b in Bento.css: position inside .mk__orbits, then
 *  the element's own rotation about its own centre. */
const ORBIT_TRANSFORMS = [
  'translate(171.5,105) rotate(-20.78 249.148 93.223)',
  'translate(191,110) rotate(135 249.148 93.223)',
];

interface Track {
  path: SVGPathElement;
  len: number;
  m: DOMMatrix;
}
interface Rider {
  el: HTMLElement;
  track: Track;
  len: number;
  dx: number;
  dy: number;
  hx: number;
  hy: number;
}
/** One tile, plus everything currently displacing it. */
interface Node extends Rider {
  name: string;
  z: number;
  amp: number;
  per: number;
  ph: number;
  mx: number;
  my: number;
  tx: number;
  ty: number;
  lift: number;
  liftTo: number;
  ix: number;
  is: number;
}

const q = <T extends Element>(r: Element, s: string) => r.querySelector(s) as T | null;
const qq = <T extends Element>(r: Element, s: string) => Array.from(r.querySelectorAll(s)) as T[];
const damp = (a: number, b: number, k: number) => a + (b - a) * k;

export function markets(card: HTMLElement): () => void {
  const orbits = q<HTMLElement>(card, '.mk__orbits');
  const field = q<HTMLElement>(card, '.mk__field');
  if (!orbits || !field) return () => {};

  const grid = q<HTMLElement>(card, '.mk__grid');
  const hub = q<HTMLElement>(field, '.mk__hub');
  const mark = q<HTMLElement>(field, '.mk__hub img');
  const tiles = qq<HTMLElement>(field, '.mk__tile--light, .mk__tile--solana');
  const darks = qq<HTMLElement>(field, '.mk__tile--dark');
  const diamonds = qq<HTMLElement>(field, '.mk__diamond');
  const cursor = q<HTMLElement>(field, '.mk__cursor');
  const tip = q<HTMLElement>(field, '.mk__tooltip');
  const tipText = tip?.firstElementChild instanceof HTMLElement ? tip.firstElementChild : null;
  const orbitImgs = qq<HTMLElement>(orbits, '.mk__orbit');

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const kill: Array<() => void> = [];
  const on = (t: HTMLElement | Window, k: string, fn: (e: never) => void) => {
    t.addEventListener(k, fn as EventListener);
    kill.push(() => t.removeEventListener(k, fn as EventListener));
  };

  /* Asset names, read off the shipped tile order so the tooltip never lies. */
  const NAMES = ['Gold', 'Nikkei', 'Apple', 'DAX', 'S&P 500', 'Tesla', 'Solana'];

  /* ------------------------------------------------------------------ layers */
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0;mix-blend-mode:multiply';
  card.insertBefore(canvas, card.firstChild);

  /* The tracks live inside .mk__orbits, so they inherit whatever offset and
     scale the responsive rules give that box. */
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 716 380');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;left:0;top:0;width:716px;height:380px;overflow:visible;pointer-events:none';
  const paths: SVGPathElement[] = [];
  const ghosts: SVGPathElement[] = [];
  ORBIT_TRANSFORMS.forEach((tf) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', tf);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', ORBIT);
    p.style.cssText = 'fill:none;stroke:none';
    g.appendChild(p);
    // a ghost that matches the shipped orbit image stroke for stroke, so the
    // entrance can draw it on
    const ghost = document.createElementNS(NS, 'path');
    ghost.setAttribute('d', ORBIT);
    ghost.style.cssText = 'fill:none;stroke:#D9D9D9;stroke-width:0.759259';
    g.appendChild(ghost);
    svg.appendChild(g);
    paths.push(p);
    ghosts.push(ghost);
  });
  orbits.appendChild(svg);
  const added: Element[] = [canvas, svg];

  /* ------------------------------------------------- orbit ↔ field geometry */
  const tracks: Track[] = paths.map((p) => ({ path: p, len: p.getTotalLength(), m: p.getCTM() as DOMMatrix }));
  let map = (x: number, y: number) => ({ x, y });
  const remap = () => {
    const ob = orbits.getBoundingClientRect();
    const fb = field.getBoundingClientRect();
    const so = orbits.offsetWidth ? ob.width / orbits.offsetWidth : 1;
    const sf = field.offsetWidth ? fb.width / field.offsetWidth : 1;
    map = (x, y) => ({ x: (ob.left + x * so - fb.left) / sf, y: (ob.top + y * so - fb.top) / sf });
  };
  remap();

  /** A point on a track, expressed in .mk__field's own coordinates. */
  const at = (t: Track, len: number) => {
    const p = t.path.getPointAtLength(((len % t.len) + t.len) % t.len);
    return map(t.m.a * p.x + t.m.c * p.y + t.m.e, t.m.b * p.x + t.m.d * p.y + t.m.f);
  };

  const home = (el: HTMLElement) => ({
    x: parseFloat(el.style.left || '0') + el.offsetWidth / 2,
    y: parseFloat(el.style.top || '0') + el.offsetHeight / 2,
  });

  /** Bind an element to the closest point on the closest track. The stored
   *  delta keeps it exactly where the design put it when travel is zero. */
  const bind = (el: HTMLElement): Rider => {
    const h = home(el);
    let best = { d: Infinity, t: tracks[0], len: 0 };
    tracks.forEach((t) => {
      const N = 720;
      for (let i = 0; i < N; i++) {
        const len = (i / N) * t.len;
        const p = at(t, len);
        const d = Math.hypot(p.x - h.x, p.y - h.y);
        if (d < best.d) best = { d, t, len };
      }
    });
    const p = at(best.t, best.len);
    return { el, track: best.t, len: best.len, dx: h.x - p.x, dy: h.y - p.y, hx: h.x, hy: h.y };
  };

  const nodes: Node[] = tiles.map((el, i) => ({
    ...bind(el),
    name: NAMES[i] ?? 'Market',
    z: 0,
    amp: 1.6 + (i % 3) * 0.6,
    per: 3.1 + (i % 4) * 0.7,
    ph: i * 1.9,
    mx: 0,
    my: 0,
    tx: 0,
    ty: 0,
    lift: 0,
    liftTo: 0,
    ix: 0,
    is: 1,
  }));
  const gems: Rider[] = diamonds.map(bind);

  // depth: the hub floats forward of its tracks, the outer assets sit back
  const hubHome = hub ? home(hub) : { x: 0, y: 0 };
  nodes.forEach((n) => {
    const d = Math.hypot(n.hx - hubHome.x, n.hy - hubHome.y);
    n.z = 44 - Math.min(1, d / 260) * 62;
  });
  const prevPerspective = card.style.perspective;
  card.style.perspective = '1050px';
  gsap.set([orbits, field], { transformStyle: 'preserve-3d' });
  gsap.set(hub, { z: 56, boxShadow: '0 14px 30px -10px rgba(23,14,8,.26)' });

  /* The tracks and the assets are two separate boxes with different centres.
     Give them one shared pivot — the centre of the card — so the tilt turns
     them as a single plane instead of shearing them apart. */
  const setPivot = () => {
    const px = card.clientWidth / 2;
    const py = card.clientHeight / 2;
    [orbits, field].forEach((el) => {
      gsap.set(el, { transformOrigin: `${px - el.offsetLeft}px ${py - el.offsetTop}px` });
    });
  };
  setPivot();

  /* the tooltip is a fixed 76px in the design; let longer names keep one line */
  const prevTip = tip ? { w: tip.style.width, ws: tip.style.whiteSpace, mw: tip.style.minWidth } : null;
  if (tip) {
    tip.style.width = 'max-content';
    tip.style.minWidth = '76px';
    tip.style.whiteSpace = 'nowrap';
    tip.style.overflow = 'hidden';
  }

  /* --------------------------------------------------------------- entrance */
  const lens = ghosts.map((g) => {
    const L = g.getTotalLength();
    g.style.strokeDasharray = String(L);
    return L;
  });
  const hubIn = { s: 0.7 };
  const cursorIn = { x: 26, y: 26 };
  const ambient = { drift: 0 };
  const darkOpacity = darks.map((d) => Number(d.style.opacity || 1));

  const byDistance = [...nodes].sort(
    (a, b) => Math.hypot(a.hx - hubHome.x, a.hy - hubHome.y) - Math.hypot(b.hx - hubHome.x, b.hy - hubHome.y),
  );

  const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  intro
    .set(ghosts, { strokeDashoffset: (i: number) => lens[i] })
    .set(grid, { autoAlpha: 0 })
    .set([...tiles, ...darks, ...diamonds, cursor, tip, hub], { autoAlpha: 0 })
    .set(nodes, { is: 0.62 })
    .set(tip, { clipPath: 'inset(0 100% 0 0)' })
    // the ground comes up first
    .to(grid, { autoAlpha: 0.2, duration: 0.5 })
    // lead — the mark, with anticipation
    .to(hub, { autoAlpha: 1, duration: 0.3 }, '-=0.36')
    .to(hubIn, { s: 1, duration: 0.5, ease: 'back.out(1.8)' }, '<')
    // the tracks draw outward from it
    .to(ghosts, { strokeDashoffset: 0, duration: 0.8, stagger: 0.1 }, '-=0.34')
    // overlap — assets arrive in order of distance from the hub
    .to(byDistance.map((n) => n.el), { autoAlpha: 1, duration: 0.38, stagger: 0.05 }, '-=0.54')
    .to(byDistance, { is: 1, duration: 0.44, ease: 'back.out(1.6)', stagger: 0.05 }, '<')
    .to(darks, { autoAlpha: (i: number) => darkOpacity[i], duration: 0.4, stagger: 0.03 }, '-=0.44')
    // late accent — the track markers snap in, then the cursor walks on
    .to(diamonds, { autoAlpha: 1, rotation: 45, scale: 1, duration: 0.42, ease: 'back.out(2.4)', stagger: 0.07 }, '-=0.34')
    .fromTo(diamonds, { rotation: 0, scale: 0 }, { rotation: 45, scale: 1, duration: 0.42, ease: 'back.out(2.4)', stagger: 0.07 }, '<')
    .to(cursor, { autoAlpha: 1, duration: 0.4 }, '-=0.2')
    .to(cursorIn, { x: 0, y: 0, duration: 0.44 }, '<')
    .to(tip, { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.42 }, '-=0.18')
    .to(ambient, { drift: 1, duration: 0.8 }, '-=0.3');

  gsap.set(orbitImgs, { autoAlpha: 0 }); // the ghosts have taken over

  /* ------------------------------------------------ the live cursor at rest */
  const CURSOR_OFF = { x: 15, y: 5 };
  const TIP_OFF = { x: 60, y: 21 };
  const solanaIndex = Math.max(0, nodes.findIndex((n) => n.name === 'Solana'));
  let picked = solanaIndex;
  let userDriven = false;
  let pressRing: ((x: number, y: number) => void) | null = null;

  const setLabel = (text: string) => {
    if (!tipText || tipText.textContent === text) return;
    gsap
      .timeline()
      .to(tipText, { yPercent: -110, opacity: 0, duration: 0.16, ease: 'power2.in' })
      .set(tipText, { yPercent: 110, onComplete: () => { tipText.textContent = text; } })
      .to(tipText, { yPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out' });
  };

  const pick = (i: number) => {
    if (i === picked) return;
    picked = i;
    const n = nodes[i];
    setLabel(n.name);
    const p = livePos(n);
    pressRing?.(p.x, p.y);
  };

  let demo: gsap.core.Tween | null = null;
  const armDemo = () => {
    demo?.kill();
    // every few seconds the resting card picks the next asset by itself
    demo = gsap.to({}, {
      duration: 3.4,
      repeat: -1,
      onRepeat: () => { if (!userDriven) pick((picked + 1) % nodes.length); },
    });
  };

  /* ------------------------------------------------------------- interaction */
  const REACH = 108;
  const tilt = { rx: 0, ry: 0, tRx: 0, tRy: 0 };
  let travel = 0;
  let travelTo = 0;
  let pointer: { x: number; y: number } | null = null;
  let lean = 0;

  on(card, 'pointermove', (e: PointerEvent) => {
    const b = card.getBoundingClientRect();
    const nx = (e.clientX - b.left) / b.width - 0.5;
    const ny = (e.clientY - b.top) / b.height - 0.5;
    travelTo = nx * 2 * REACH;
    tilt.tRy = nx * 13;
    tilt.tRx = -ny * 10;
    pointer = { x: e.clientX, y: e.clientY };
  });
  on(card, 'pointerenter', () => { userDriven = true; });
  on(card, 'pointerleave', () => {
    userDriven = false;
    pointer = null;
    travelTo = 0;
    tilt.tRx = 0;
    tilt.tRy = 0;
    nodes.forEach((n) => { n.liftTo = 0; n.tx = 0; n.ty = 0; });
    gsap.delayedCall(0.4, () => { if (!userDriven) pick(solanaIndex); });
  });

  nodes.forEach((n, i) => {
    n.el.style.pointerEvents = 'auto';
    on(n.el, 'pointerenter', () => { pick(i); });
  });
  on(window, 'resize', () => { remap(); setPivot(); });

  /** Where a node actually is this frame, in field coordinates. */
  const livePos = (n: Node) => {
    const p = at(n.track, n.len + travel);
    return { x: p.x + n.dx + n.mx + n.ix, y: p.y + n.dy + n.my };
  };

  /* --------------------------------------------------------------- the loop */
  let raf = 0;
  let running = false;
  let t0 = 0;
  let glTick: ((t: number, heat: number) => void) | null = null;
  let heat = 0;

  const frame = (now: number) => {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;

    // the orbit never stops: a slow base rate, plus whatever the pointer asks
    // for, damped so it can never snap
    const base = ambient.drift * t * 9;
    travel = damp(travel, travelTo, 0.06);
    const total = base + travel;
    const rate = total - lastTotal;
    lastTotal = total;

    tilt.rx = damp(tilt.rx, tilt.tRx, 0.08);
    tilt.ry = damp(tilt.ry, tilt.tRy, 0.08);
    gsap.set([orbits, field], { rotationX: tilt.rx, rotationY: tilt.ry });

    const fb = pointer ? field.getBoundingClientRect() : null;
    const sf = fb && field.offsetWidth ? fb.width / field.offsetWidth : 1;

    nodes.forEach((n, i) => {
      const p = at(n.track, n.len + total);
      if (pointer && fb) {
        const ex = fb.left + (p.x + n.dx) * sf;
        const ey = fb.top + (p.y + n.dy) * sf;
        const d = Math.hypot(ex - pointer.x, ey - pointer.y);
        const pull = d < 150 ? (1 - d / 150) * 16 : 0;
        const push = d >= 150 && d < 260 ? -(1 - (d - 150) / 110) * 5 : 0;
        const k = (pull + push) / (d || 1);
        n.tx = (pointer.x - ex) * k;
        n.ty = (pointer.y - ey) * k;
      }
      n.mx = damp(n.mx, n.tx, 0.09);
      n.my = damp(n.my, n.ty, 0.09);
      n.liftTo = i === picked ? 1 : 0;
      n.lift = damp(n.lift, n.liftTo, 0.1);
      // each tile breathes on its own period — a frame at 10s never matches
      // one at 20s, and there is no seam to catch
      const by = Math.sin(t / n.per + n.ph) * n.amp;
      const bx = Math.cos(t / (n.per * 1.4) + n.ph) * n.amp * 0.5;
      const sh = n.lift;
      gsap.set(n.el, {
        x: p.x + n.dx - n.hx + n.mx + bx + n.ix,
        y: p.y + n.dy - n.hy + n.my + by,
        z: n.z + n.lift * 26,
        scale: n.is * (1 + n.lift * 0.06),
        transformOrigin: '50% 50%',
        boxShadow: `0 ${(5 + sh * 9).toFixed(1)}px ${(13 + sh * 15).toFixed(1)}px -8px rgba(23,14,8,${(0.18 + sh * 0.18).toFixed(3)})`,
      });
    });

    gems.forEach((g, i) => {
      const p = at(g.track, g.len + total);
      gsap.set(g.el, {
        x: p.x + g.dx - g.hx,
        y: p.y + g.dy - g.hy,
        rotation: 45,
        scale: 1 + Math.sin(t / 2.4 + i * 2) * 0.07,
      });
    });

    // the cursor keeps working: it follows whichever asset is selected
    const sel = nodes[picked];
    const sp = livePos(sel);
    const halfW = sel.el.offsetWidth / 2;
    const halfH = sel.el.offsetHeight / 2;
    if (cursor) {
      gsap.set(cursor, {
        x: sp.x + halfW + CURSOR_OFF.x - (cursorHome.x) + cursorIn.x,
        y: sp.y + halfH + CURSOR_OFF.y - (cursorHome.y) + cursorIn.y,
      });
    }
    if (tip) {
      const half = tip.offsetWidth / 2;
      let tx = sp.x + halfW + TIP_OFF.x;
      if (tx + half > field.offsetWidth - 6) tx = sp.x - halfW - 14 - half; // flip, never clip
      tipX = damp(tipX, tx, 0.16);
      tipY = damp(tipY, sp.y + halfH + TIP_OFF.y, 0.16);
      gsap.set(tip, { x: tipX - tipHome.x + cursorIn.x, y: tipY - tipHome.y + cursorIn.y });
    }

    lean = damp(lean, rate * 2.2, 0.1);
    gsap.set(hub, { scale: hubIn.s * (1 + Math.sin(t / 3.1) * 0.012), transformOrigin: '50% 50%' });
    gsap.set(mark, { rotation: Math.max(-9, Math.min(9, lean)) });

    heat = damp(heat, pointer ? 1 : 0, 0.08);
    glTick?.(t, heat);
    raf = requestAnimationFrame(frame);
  };

  const cursorHome = cursor ? home(cursor) : { x: 0, y: 0 };
  const tipHome = tip ? home(tip) : { x: 0, y: 0 };
  let tipX = tipHome.x;
  let tipY = tipHome.y;
  let lastTotal = 0;

  const start = () => {
    if (running) return;
    running = true;
    t0 = 0;
    armDemo();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    demo?.kill();
    demo = null;
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

  /* --------------------------------------------------------- WebGL halftone
     The Figma glow is a halftone + Bayer dither stack. On cream it has to be
     ink, not light: dark dots multiplied into the paper, warming to orange
     where the pointer is, with a ring pressed out of each asset as it is
     picked. */
  let disposeGl: (() => void) | null = null;
  let disposed = false;

  void (async () => {
    let THREE: ThreeMod;
    try {
      THREE = await import('three');
    } catch {
      return;
    }
    if (disposed) return;
    let renderer: import('three').WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch {
      return;
    }

    const uniforms = {
      uTime: { value: 0 },
      uHeat: { value: 0 },
      uCell: { value: 1 },
      uPointer: { value: new THREE.Vector2(-999, -999) },
      uPress: { value: new THREE.Vector2(-999, -999) },
      uPressT: { value: -999 },
      uHub: { value: new THREE.Vector2(0, 0) },
      uInk: { value: new THREE.Color('#171008') },
      uWarm: { value: new THREE.Color('#f55e22') },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthTest: false,
      vertexShader: 'void main(){ gl_Position = vec4(position, 1.0); }',
      fragmentShader: `
        precision highp float;
        uniform vec2  uPointer, uPress, uHub;
        uniform float uTime, uHeat, uCell, uPressT;
        uniform vec3  uInk, uWarm;

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

          float wave = 0.5 + 0.5 * sin((f.x * 0.010) - (f.y * 0.004) - uTime * 0.7);
          float body = smoothstep(560.0, 90.0, distance(f, uHub)) * wave * 0.30;

          float warm = uHeat * smoothstep(170.0, 0.0, distance(f, uPointer));
          float t = uTime - uPressT;
          if(uPressT > -900.0 && t >= 0.0 && t < 1.2){
            float r = t * 380.0;
            warm += smoothstep(46.0, 0.0, abs(distance(f, uPress) - r)) * (1.0 - t / 1.2) * 0.8;
          }

          float a = clamp(body + warm * 0.8, 0.0, 0.72);
          a = step(bayer(f / uCell), a) * a;
          if(a <= 0.004) discard;

          vec3 col = mix(uInk, uWarm, clamp(warm * 1.5, 0.0, 1.0));
          gl_FragColor = vec4(mix(vec3(1.0), col, a * 0.34), 1.0);
        }`,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.Camera();

    const dpr = () => Math.min(devicePixelRatio, 2);
    const toGl = (x: number, y: number): [number, number] => [x * dpr(), (card.clientHeight - y) * dpr()];
    const fieldToCard = (x: number, y: number) => {
      const fb = field.getBoundingClientRect();
      const cb = card.getBoundingClientRect();
      const sf = field.offsetWidth ? fb.width / field.offsetWidth : 1;
      return { x: fb.left - cb.left + x * sf, y: fb.top - cb.top + y * sf };
    };
    const resize = () => {
      const b = card.getBoundingClientRect();
      renderer.setPixelRatio(dpr());
      renderer.setSize(b.width, b.height, false);
      uniforms.uCell.value = dpr();
      const h = fieldToCard(hubHome.x, hubHome.y);
      const [hx, hy] = toGl(h.x, h.y);
      uniforms.uHub.value.set(hx, hy);
    };
    resize();
    on(window, 'resize', resize);
    gsap.set(canvas, { opacity: 1 });

    on(card, 'pointermove', (e: PointerEvent) => {
      const b = card.getBoundingClientRect();
      const [gx, gy] = toGl(e.clientX - b.left, e.clientY - b.top);
      uniforms.uPointer.value.set(gx, gy);
    });

    pressRing = (x, y) => {
      const c = fieldToCard(x, y);
      const [gx, gy] = toGl(c.x, c.y);
      uniforms.uPress.value.set(gx, gy);
      uniforms.uPressT.value = uniforms.uTime.value;
    };

    glTick = (t, h) => {
      uniforms.uTime.value = t;
      uniforms.uHeat.value = h;
      renderer.render(scene, camera);
    };

    disposeGl = () => {
      glTick = null;
      pressRing = null;
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
      ...tiles, ...darks, ...diamonds, ...nodes, cursor, tip, tipText, hub, mark, grid,
      hubIn, cursorIn, ambient, tilt,
    ]);
    gsap.set([...tiles, ...darks, ...diamonds, cursor, tip, tipText, hub, mark, grid, orbits, field], {
      clearProps: 'transform,opacity,visibility,boxShadow,clipPath',
    });
    gsap.set(orbitImgs, { clearProps: 'opacity,visibility' });
    nodes.forEach((n) => n.el.style.removeProperty('pointer-events'));
    if (tip && prevTip) {
      tip.style.width = prevTip.w;
      tip.style.minWidth = prevTip.mw;
      tip.style.whiteSpace = prevTip.ws;
      tip.style.removeProperty('overflow');
    }
    darks.forEach((d, i) => { d.style.opacity = String(darkOpacity[i]); });
    card.style.perspective = prevPerspective;
    added.forEach((el) => el.remove());
  };
}
