/**
 * Motion for bento card D — "Trade every market from one account".
 *
 * Two triggers only, per MOTION.md: a load-in and a loop. No hover, no pointer
 * tracking — this is artwork, not a control.
 *
 *   Load-in  The Phorecast mark settles alone and is given a beat. Then the two
 *            elliptical orbits draw themselves on, the assets dock onto their
 *            paths from the hub outward on a countable stagger, the orange
 *            diamonds snap in, and the cursor walks on last to point at Solana
 *            — the card's best moment, so it gets room.
 *   Loop     The orbits genuinely turn: every tile is sampled onto the real
 *            path with getPointAtLength and translated along it, never rotated,
 *            so the logos stay upright. One full revolution takes 14s. The
 *            cursor keeps working, gliding from asset to asset with the tooltip
 *            wiping through to each new name. A WebGL layer multiplies the
 *            brand's Bayer halftone into the cream as ink, never light.
 *
 * Every entrance tween is a `gsap.from`, so if this module never runs the card
 * is simply the approved static design.
 */
import { gsap } from 'gsap';

type ThreeMod = typeof import('../../../lib/three-lite');

const NS = 'http://www.w3.org/2000/svg';
const REVOLUTION = 14; // seconds for one full lap of an orbit
const PICK_EVERY = 6; // seconds between the resting cursor's moves

/** The shipped orbit-ring path, verbatim from assets/bento/orbit-ring.svg. */
const ORBIT =
  'M249.148 0.379883C317.915 0.379904 380.155 10.8098 425.189 27.6602C447.708 36.0859 465.905 46.1093 478.466 ' +
  '57.2207C491.027 68.3325 497.917 80.5001 497.917 93.2236C497.917 105.947 491.027 118.114 478.466 129.226C465.905 ' +
  '140.337 447.708 150.36 425.189 158.786C380.155 175.637 317.915 186.066 249.148 186.066C180.381 186.066 118.141 ' +
  '175.637 73.1064 158.786C50.5881 150.36 32.3914 140.337 19.8311 129.226C7.27024 118.114 0.380023 105.947 0.379883 ' +
  '93.2236C0.379883 80.5001 7.27011 68.3325 19.8311 57.2207C32.3914 46.1095 50.5881 36.0858 73.1064 ' +
  '27.6602C118.141 10.8097 180.381 0.379883 249.148 0.379883Z';
/** Matches .mk__orbit--a / --b in Bento.css: placed inside .mk__orbits, then
 *  rotated about its own centre. */
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
interface Node extends Rider {
  name: string;
  amp: number;
  per: number;
  ph: number;
  lift: number;
  /** the load-in writes here, never to the element */
  io: number;
  is: number;
}

const q = <T extends Element>(r: Element, s: string) => r.querySelector(s) as T | null;
const qq = <T extends Element>(r: Element, s: string) => Array.from(r.querySelectorAll(s)) as T[];
const damp = (a: number, b: number, k: number) => a + (b - a) * k;
const TAU = Math.PI * 2;

export function markets(card: HTMLElement): () => void {
  const orbits = q<HTMLElement>(card, '.mk__orbits');
  const field = q<HTMLElement>(card, '.mk__field');
  if (!orbits || !field) return () => {};
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

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

  /** DOM order of .mk__tile--light / --solana in Bento.tsx. */
  const NAMES = ['Gold', 'Nikkei', 'Apple', 'DAX', 'S&P 500', 'Tesla', 'Solana'];
  const unbind: Array<() => void> = [];

  /* ------------------------------------------------------------------ layers */
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0;mix-blend-mode:multiply';
  card.insertBefore(canvas, card.firstChild);

  /* The tracks live inside .mk__orbits so they inherit whatever offset and
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
    // a ghost matching the shipped orbit image stroke for stroke, so the
    // load-in can draw it
    const ghost = document.createElementNS(NS, 'path');
    ghost.setAttribute('d', ORBIT);
    ghost.style.cssText = 'fill:none;stroke:#D9D9D9;stroke-width:0.759259';
    g.appendChild(ghost);
    svg.appendChild(g);
    paths.push(p);
    ghosts.push(ghost);
  });
  orbits.appendChild(svg);
  gsap.set(orbitImgs, { autoAlpha: 0 }); // the ghosts have taken over

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
  addEventListener('resize', remap);
  unbind.push(() => removeEventListener('resize', remap));

  /** A point on a track, in .mk__field's own coordinates. */
  const at = (t: Track, len: number) => {
    const p = t.path.getPointAtLength(((len % t.len) + t.len) % t.len);
    return map(t.m.a * p.x + t.m.c * p.y + t.m.e, t.m.b * p.x + t.m.d * p.y + t.m.f);
  };
  const home = (el: HTMLElement) => ({
    x: parseFloat(el.style.left || '0') + el.offsetWidth / 2,
    y: parseFloat(el.style.top || '0') + el.offsetHeight / 2,
  });

  /** Bind an element to the closest point on the closest track. The stored
   *  delta keeps it exactly where the design put it at travel zero. */
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
    amp: 1.1 + (i % 3) * 0.3,
    per: 8.5 + (i % 4) * 1.4,
    ph: i * 2.1,
    lift: 0,
    io: 0,
    is: 1,
  }));
  const gems: Rider[] = diamonds.map(bind);
  const hubHome = hub ? home(hub) : { x: 0, y: 0 };

  /* the tooltip is a fixed 76px in the design; let longer names keep one line */
  const prevTip = tip ? { w: tip.style.width, ws: tip.style.whiteSpace, mw: tip.style.minWidth } : null;
  if (tip) {
    tip.style.width = 'max-content';
    tip.style.minWidth = '76px';
    tip.style.whiteSpace = 'nowrap';
    tip.style.overflow = 'hidden';
  }

  /* ------------------------------------------------------------- the load-in */
  const lens = ghosts.map((g) => {
    const L = g.getTotalLength();
    g.style.strokeDasharray = String(L);
    return L;
  });
  // settled values — the timeline is all `from`, so it animates back to these
  const hubIn = { s: 1 };
  const walkIn = { x: 0, y: 0 };
  const loop = { on: 1 };

  // assets dock from the hub outward, which is how the eye reads the card
  const byDistance = [...nodes].sort(
    (a, b) => Math.hypot(a.hx - hubHome.x, a.hy - hubHome.y) - Math.hypot(b.hx - hubHome.x, b.hy - hubHome.y),
  );

  const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out', immediateRender: true } });
  intro
    // context first, barely there
    .from(grid, { autoAlpha: 0, duration: 1.5, ease: 'sine.out' }, 0)
    // LEAD — the mark, alone
    .from(hub, { autoAlpha: 0, duration: 0.85 }, 0.1)
    .from(hubIn, { s: 0.94, duration: 1.3 }, 0.1)
    // ——— beat ———
    // the two tracks draw themselves on
    .from(ghosts, { strokeDashoffset: (i: number) => lens[i], duration: 1.45, ease: 'expo.out', stagger: 0.2 }, 1.75)
    // the assets dock onto them, hub outward, 0.16s apart — countable
    .from(byDistance.map((n) => n.el), { autoAlpha: 0, duration: 0.75, stagger: 0.16 }, 2.35)
    .from(byDistance, { io: -26, is: 0.95, duration: 1.15, ease: 'expo.out', stagger: 0.16 }, 2.35)
    .from(darks, { autoAlpha: 0, duration: 0.8, stagger: 0.12 }, 2.5)
    // accent — the track markers, under 5px of overshoot
    .from(diamonds, { autoAlpha: 0, scale: 0.55, duration: 0.55, ease: 'back.out(1.6)', stagger: 0.18 }, 3.4)
    // and the cursor walks on last, then opens the tooltip
    .from(cursor, { autoAlpha: 0, duration: 0.7 }, 3.85)
    .from(walkIn, { x: 34, y: 30, duration: 1.15, ease: 'expo.out' }, 3.85)
    .from(tip, { autoAlpha: 0, clipPath: 'inset(0 100% 0 0)', duration: 0.8, ease: 'power2.out' }, 4.35)
    .from(loop, { on: 0, duration: 1.2, ease: 'sine.inOut' }, 3.6);

  /* --------------------------------------------- the cursor, still working */
  const CURSOR_OFF = { x: 15, y: 5 };
  const TIP_OFF = { x: 60, y: 21 };
  const solanaIndex = Math.max(0, nodes.findIndex((n) => n.name === 'Solana'));
  let picked = solanaIndex;
  let nextPick = PICK_EVERY * 2; // let the load-in settle before it starts walking
  let pressRing: ((x: number, y: number) => void) | null = null;

  const setLabel = (text: string) => {
    if (!tipText || tipText.textContent === text) return;
    gsap
      .timeline()
      .to(tipText, { yPercent: -110, opacity: 0, duration: 0.26, ease: 'power2.in' })
      .set(tipText, { yPercent: 110, onComplete: () => { tipText.textContent = text; } })
      .to(tipText, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power2.out' });
  };

  /* --------------------------------------------------------------- the loop */
  let raf = 0;
  let running = false;
  let t0 = 0;
  let tipX = tip ? home(tip).x : 0;
  let tipY = tip ? home(tip).y : 0;
  const cursorHome = cursor ? home(cursor) : { x: 0, y: 0 };
  const tipHome = tip ? home(tip) : { x: 0, y: 0 };
  let glTick: ((t: number) => void) | null = null;

  const frame = (now: number) => {
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;

    if (t > nextPick) {
      nextPick = t + PICK_EVERY;
      picked = (picked + 1) % nodes.length;
      setLabel(nodes[picked].name);
      const n = nodes[picked];
      const p = at(n.track, n.len + (t / REVOLUTION) * n.track.len);
      pressRing?.(p.x + n.dx, p.y + n.dy);
    }

    // one full revolution every 14s, per track, linear — the only place a
    // constant rate is right
    const turn = (t / REVOLUTION) * loop.on;

    nodes.forEach((n, i) => {
      const p = at(n.track, n.len + turn * n.track.len);
      // translated along the path, never rotated, so every logo stays upright
      const by = Math.sin((t / n.per) * TAU + n.ph) * n.amp;
      const bx = Math.cos((t / (n.per * 1.4)) * TAU + n.ph) * n.amp * 0.5;
      n.lift = damp(n.lift, i === picked ? 1 : 0, 0.05);
      gsap.set(n.el, {
        x: p.x + n.dx - n.hx + bx + n.io,
        y: p.y + n.dy - n.hy + by,
        scale: n.is * (1 + n.lift * 0.04),
        transformOrigin: '50% 50%',
        // cream reads depth as a cast shadow, never as a glow
        boxShadow: `0 ${(4 + n.lift * 9).toFixed(1)}px ${(11 + n.lift * 16).toFixed(1)}px -8px rgba(22, 12, 9,${(
          0.14 + n.lift * 0.2
        ).toFixed(3)})`,
      });
    });

    gems.forEach((g, i) => {
      const p = at(g.track, g.len + turn * g.track.len);
      gsap.set(g.el, {
        x: p.x + g.dx - g.hx,
        y: p.y + g.dy - g.hy,
        rotation: 45,
        scale: 1 + Math.sin((t / 9) * TAU + i * 2.4) * 0.05,
      });
    });

    // the cursor follows whichever asset is selected, and the tooltip follows it
    const sel = nodes[picked];
    const sp = at(sel.track, sel.len + turn * sel.track.len);
    const sx = sp.x + sel.dx;
    const sy = sp.y + sel.dy;
    const halfW = sel.el.offsetWidth / 2;
    const halfH = sel.el.offsetHeight / 2;
    if (cursor) {
      cursorX = damp(cursorX, sx + halfW + CURSOR_OFF.x, 0.045);
      cursorY = damp(cursorY, sy + halfH + CURSOR_OFF.y, 0.045);
      gsap.set(cursor, { x: cursorX - cursorHome.x + walkIn.x, y: cursorY - cursorHome.y + walkIn.y });
    }
    if (tip) {
      const half = tip.offsetWidth / 2;
      let tx = sx + halfW + TIP_OFF.x;
      if (tx + half > field.offsetWidth - 6) tx = sx - halfW - 14 - half; // flip, never clip
      tipX = damp(tipX, tx, 0.04);
      tipY = damp(tipY, sy + halfH + TIP_OFF.y, 0.04);
      gsap.set(tip, { x: tipX - tipHome.x + walkIn.x, y: tipY - tipHome.y + walkIn.y });
    }

    gsap.set(hub, { scale: hubIn.s * (1 + Math.sin((t / 11) * TAU) * 0.01), transformOrigin: '50% 50%' });
    gsap.set(mark, { rotation: Math.sin((t / 13) * TAU) * 2.5 });

    glTick?.(t);
    raf = requestAnimationFrame(frame);
  };

  let cursorX = cursorHome.x;
  let cursorY = cursorHome.y;

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

  /* --------------------------------------------------------- WebGL halftone
     On cream the Figma glow has to be ink, not light: dark Bayer-dithered dots
     multiplied into the paper, drifting on a long wave, warming to orange
     around whichever asset the cursor has just picked. */
  let disposeGl: (() => void) | null = null;
  let disposed = false;

  void (async () => {
    let THREE: ThreeMod;
    try {
      THREE = await import('../../../lib/three-lite');
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
      uCell: { value: 1 },
      uOn: { value: 0 },
      uPress: { value: new THREE.Vector2(-999, -999) },
      uPressT: { value: -999 },
      uHub: { value: new THREE.Vector2(0, 0) },
      uInk: { value: new THREE.Color('#160e09') },
      uWarm: { value: new THREE.Color('#e5331e') },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthTest: false,
      vertexShader: 'void main(){ gl_Position = vec4(position, 1.0); }',
      fragmentShader: `
        precision highp float;
        uniform vec2  uPress, uHub;
        uniform float uTime, uCell, uPressT, uOn;
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

          // a long, lazy wave of grey ink across the orbit field
          float wave = 0.5 + 0.5 * sin((f.x * 0.009) - (f.y * 0.004) - uTime * 0.42);
          float a = smoothstep(560.0, 90.0, distance(f, uHub)) * wave * 0.28;

          // and a ring pressed out of the asset the cursor just picked
          float warm = 0.0;
          float t = uTime - uPressT;
          if(uPressT > -900.0 && t >= 0.0 && t < 1.8){
            float r = t * 260.0;
            warm = smoothstep(52.0, 0.0, abs(distance(f, uPress) - r)) * (1.0 - t / 1.8) * 0.75;
          }

          a = clamp((a + warm * 0.8) * uOn, 0.0, 0.72);
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
    const fieldToCard = (x: number, y: number) => {
      const fb = field.getBoundingClientRect();
      const cb = card.getBoundingClientRect();
      const sf = field.offsetWidth ? fb.width / field.offsetWidth : 1;
      return { x: fb.left - cb.left + x * sf, y: fb.top - cb.top + y * sf };
    };
    const toGl = (x: number, y: number): [number, number] => [x * dpr(), (card.clientHeight - y) * dpr()];
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
    addEventListener('resize', resize);
    unbind.push(() => removeEventListener('resize', resize));
    gsap.set(canvas, { opacity: 1 });

    pressRing = (x, y) => {
      const c = fieldToCard(x, y);
      const [gx, gy] = toGl(c.x, c.y);
      uniforms.uPress.value.set(gx, gy);
      uniforms.uPressT.value = uniforms.uTime.value;
    };

    glTick = (t) => {
      uniforms.uTime.value = t;
      uniforms.uOn.value = loop.on;
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
    unbind.forEach((f) => f());
    disposeGl?.();
    gsap.killTweensOf([
      ...tiles, ...darks, ...diamonds, ...nodes, cursor, tip, tipText, hub, mark, grid, hubIn, walkIn, loop,
    ]);
    gsap.set([...tiles, ...darks, ...diamonds, cursor, tip, tipText, hub, mark, grid], {
      clearProps: 'transform,opacity,visibility,boxShadow,clipPath',
    });
    gsap.set(orbitImgs, { clearProps: 'opacity,visibility' });
    if (tip && prevTip) {
      tip.style.width = prevTip.w;
      tip.style.minWidth = prevTip.mw;
      tip.style.whiteSpace = prevTip.ws;
      tip.style.removeProperty('overflow');
    }
    canvas.remove();
    svg.remove();
  };
}
