import { useCallback, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { REDUCED, drawPaths, drift, parallax, revealUp, useSectionMotion } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import fanLower from '../../assets/fan/fan-lower.svg';
import fanUpper from '../../assets/fan/fan-upper.svg';
/* The same two files again as markup, for the entrance only — see `Arcs`. */
import fanLowerRaw from '../../assets/fan/fan-lower.svg?raw';
import fanUpperRaw from '../../assets/fan/fan-upper.svg?raw';
import iconCrypto from '../../assets/fan/icon-crypto.svg';
import iconFinance from '../../assets/fan/icon-finance.svg';
import iconGeopolitics from '../../assets/fan/icon-geopolitics.svg';
import iconTech from '../../assets/fan/icon-tech.svg';
import iconElections from '../../assets/fan/icon-elections.svg';
import iconSportA from '../../assets/fan/icon-sport-a.svg';
import iconSportB from '../../assets/fan/icon-sport-b.svg';
import iconSportC from '../../assets/fan/icon-sport-c.svg';
import tileBg from '../../assets/fan/tile-bg.jpg';
import tileLogo from '../../assets/fan/tile-logo.svg';
import './Fan.css';

/* All coordinates are screenshot space inside the 1920 x 675 frame. */
const DIAMONDS = [
  [23, 351.9, '#f55e22'], [97, 429, '#f55e22'], [440, 91, '#5b5b5a'],
  [401, 480, '#f55e22'], [183.9, 469.5, '#fffbf8'], [337.2, 280.1, '#fffbf8'],
  [1886.1, 430.5, '#f55e22'], [1812.1, 353.3, '#f55e22'], [1508.1, 86.3, '#7c7c7c'],
  [1508.1, 302.3, '#f55e22'], [1725.2, 312.8, '#fffbf8'], [1571.9, 502.3, '#fffbf8'],
] as const;

function SportIcon() {
  return (
    <span className="fan__sport">
      <img src={iconSportA} alt="" className="fan__sport-a" />
      <img src={iconSportB} alt="" className="fan__sport-b" />
      <img src={iconSportC} alt="" className="fan__sport-c" />
    </span>
  );
}

/* Figma fixes the three left pills at 120 and hugs the label on the right three. */
const PILLS = [
  { label: 'Crypto', x: 502, y: 212, w: 120, icon: <img src={iconCrypto} alt="" /> },
  { label: 'Sport', x: 201, y: 536, w: 120, icon: <SportIcon /> },
  { label: 'Finance', x: 553, y: 558, w: 120, icon: <img src={iconFinance} alt="" /> },
  { label: 'Geopolitics', x: 1581, y: 188, w: 149, icon: <img src={iconGeopolitics} alt="" /> },
  { label: 'Tech', x: 1639, y: 512, w: 90, icon: <img src={iconTech} alt="" /> },
  { label: 'Elections', x: 1372, y: 556, w: 132, icon: <img src={iconElections} alt="" /> },
];

/* Chrome rasterises an SVG in an <img> differently from the same SVG inline —
   identical geometry, but the hairlines land on different subpixels. Since the
   arcs have to be real nodes to be stroke-drawn, and the band at rest has to
   stay exactly the design that was signed off, the two are kept separate: the
   <img> pair is the artwork, and an inline copy is switched on only for the
   draw and handed back at the end. Both copies of a file share a document, so
   the Figma ids have to be namespaced or the second resolves its url(#...)
   against the first one's defs. The no-op blur filter is dropped from the
   drawn copy; re-running a full-frame filter for every frame of the draw costs
   real time and its stdDeviation is 0. */
function drawable(raw: string, className: string, suffix: string) {
  return raw
    .replace(/id="([^"]*)"/g, (_m, id: string) => `id="${id}${suffix}"`)
    .replace(/url\(#([^)]*)\)/g, (_m, id: string) => `url(#${id}${suffix})`)
    .replace(/ filter="url\(#[^"]*\)"/, '')
    .replace('<svg ', `<svg class="${className}" `);
}

/** Both arc groups share one 863 x 675 sub-frame; the left one is mirrored. */
function Arcs({ className, side }: { className: string; side: string }) {
  const drawn =
    drawable(fanUpperRaw, 'fan__lines fan__lines--upper', `-${side}u`) +
    drawable(fanLowerRaw, 'fan__lines fan__lines--lower', `-${side}l`);
  return (
    <div className={`fan__arcs ${className}`}>
      <img src={fanUpper} alt="" className="fan__lines fan__lines--upper" />
      <img src={fanLower} alt="" className="fan__lines fan__lines--lower" />
      {/* display:none in CSS; the entrance turns it on and back off again, so a
          script that never runs simply shows the artwork above. */}
      <div className="fan__draw" dangerouslySetInnerHTML={{ __html: drawn }} />
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Entrance. One timeline: the arcs draw themselves from the innermost ellipse
   outward, the tile and copy arrive over the top of it, the pills bloom out
   from the tile, and the diamonds twinkle in last.
   Every step is a gsap.from off the real design state, so a script that never
   runs leaves the section exactly as the CSS renders it.
--------------------------------------------------------------------------- */
const DRAW_DUR = 1.25;
const DRAW_STAGGER = 0.045;
const ENTRANCE_MS = 2300;

function buildEntrance({ el, q, tl }: SectionMotion) {
  const layers = q('.fan__draw');
  const art = Array.from(el.querySelectorAll<HTMLElement>('img.fan__lines'));
  const paths = Array.from(el.querySelectorAll<SVGPathElement>('.fan__draw path'));

  if (layers.length && paths.length) {
    /* getTotalLength needs the subtree out of display:none, and drawPaths
       measures synchronously, so switch the layer on before building. */
    layers.forEach((l) => { l.style.display = 'block'; });

    /* DOM order is left-group-then-right-group, which would draw one side
       before the other. Re-order by each ellipse's index inside its own group
       so ring 1 of all four sheets draws together and the fan opens outward,
       symmetrically. */
    const ring = (p: SVGPathElement) =>
      p.parentElement ? Array.prototype.indexOf.call(p.parentElement.children, p) : 0;
    const ordered = paths.slice().sort((a, b) => ring(a) - ring(b));

    tl.set(art, { opacity: 0 }, 0);
    drawPaths(tl, ordered, { duration: DRAW_DUR, stagger: DRAW_STAGGER, ease: 'power2.inOut', at: 0 });

    /* Hand the finished linework back to the artwork. Both copies are the same
       picture, so a straight cross-fade over black holds a constant total. */
    const handoff = DRAW_DUR + DRAW_STAGGER * (ordered.length - 1) - 0.18;
    tl.to(art, { opacity: 1, duration: 0.25, ease: 'none' }, handoff)
      .to(layers, { opacity: 0, duration: 0.25, ease: 'none' }, handoff)
      .set(art, { clearProps: 'opacity' })
      .set(layers, { display: 'none', clearProps: 'opacity' });
  }

  const [tile] = q('.fan__tile');
  if (tile) {
    tl.from(
      tile,
      {
        scale: 0.8, y: 14, opacity: 0, duration: 0.7, ease: 'expo.out',
        transformOrigin: '50% 50%', clearProps: 'transform,transformOrigin,opacity',
      },
      0.45,
    );
  }

  revealUp(tl, [...q('.fan__title'), ...q('.fan__sub')], {
    y: 16, stagger: 0.09, duration: 0.65, at: 0.62,
  });

  /* Scattered marks read badly left-to-right. Bloom them outward from the tile
     instead, which is where the eye already is when they start. */
  const centre = tile?.getBoundingClientRect();
  const cx = centre ? centre.left + centre.width / 2 : 0;
  const cy = centre ? centre.top + centre.height / 2 : 0;
  const radius = (e: HTMLElement) => {
    const r = e.getBoundingClientRect();
    return Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
  };
  const pills = q('.fan__pill').sort((a, b) => radius(a) - radius(b));
  if (pills.length) {
    tl.from(
      pills,
      {
        scale: 0.74, opacity: 0, duration: 0.5, stagger: 0.055, ease: 'back.out(1.4)',
        transformOrigin: '50% 50%', clearProps: 'transform,transformOrigin,opacity',
      },
      0.78,
    );
  }

  /* A fixed shuffle rather than gsap's random stagger: just as scattered, and
     reproducible frame for frame when reviewing. */
  const diamonds = q('.fan__diamond');
  const twinkle = diamonds
    .map((e, i) => ({ e, k: (i * 7) % (diamonds.length || 1) }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.e);
  if (twinkle.length) {
    tl.from(
      twinkle,
      {
        scale: 0.1, opacity: 0, rotation: '+=70', duration: 0.45, stagger: 0.04,
        ease: 'power3.out', clearProps: 'transform,opacity',
      },
      1.25,
    );
  }
}

/* ---------------------------------------------------------------------------
   Settled behaviour.
--------------------------------------------------------------------------- */

/**
 * Local variant of the shared `drift`. That one always writes `rotate`, which
 * would flatten the diamonds' CSS `rotate(135deg)` back into a square; this one
 * only ever touches y, so each mark keeps the rotation the stylesheet gave it.
 */
function driftY(targets: HTMLElement[], distance: number, duration: number): gsap.core.Tween[] {
  if (REDUCED) return [];
  return targets.map((el, i) =>
    gsap.to(el, {
      y: i % 2 ? distance : -distance,
      duration: duration + (i % 3) * 0.7,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: (i % 5) * 0.4,
    }),
  );
}

/**
 * The only interactive thing in the band: the two sheets of linework lean a few
 * pixels against each other as the cursor crosses, and the diamonds lag along
 * at their own rates. It moves the artwork inside `.fan__arcs`, never the
 * masked box itself, so the top and bottom fade stay pinned to the band.
 */
function attachPointer(el: HTMLElement, lines: HTMLElement[], diamonds: HTMLElement[]): () => void {
  if (REDUCED) return () => {};
  const targets = [
    ...lines.map((n, i) => ({
      to: gsap.quickTo(n, 'x', { duration: 1, ease: 'power3' }),
      amp: i < 2 ? 9 : -9,
    })),
    ...diamonds.map((n, i) => ({
      to: gsap.quickTo(n, 'x', { duration: 1.2, ease: 'power3' }),
      amp: ((i % 4) - 1.5) * 3.2,
    })),
  ];
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    targets.forEach((t) => t.to(((e.clientX - r.left) / (r.width || 1) - 0.5) * t.amp));
  };
  const leave = () => targets.forEach((t) => t.to(0));
  el.addEventListener('pointermove', move, { passive: true });
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    targets.forEach((t) => t.to.tween?.kill());
  };
}

export function Fan() {
  const ref = useSectionMotion<HTMLElement>(useCallback(buildEntrance, []), { threshold: 0.12 });
  const idle = useRef<{ tweens: gsap.core.Tween[]; stops: (() => void)[] }>({ tweens: [], stops: [] });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const store = idle.current;
    let timer = 0;

    const stop = () => {
      if (timer) window.clearTimeout(timer);
      timer = 0;
      store.stops.splice(0).forEach((f) => f());
      store.tweens.splice(0).forEach((t) => t.kill());
      gsap.set(el.querySelectorAll('.fan__diamond, .fan__pill, img.fan__lines, .fan__arcs'), {
        clearProps: 'transform',
      });
    };

    const start = () => {
      timer = 0;
      if (store.tweens.length || store.stops.length) return;
      const pick = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(s));
      const diamonds = pick('.fan__diamond');
      store.tweens.push(...driftY(diamonds, 5, 4.6));
      store.tweens.push(...drift(pick('.fan__pill'), { distance: 4, duration: 5.4 }));
      pick('.fan__arcs').forEach((a) => store.stops.push(parallax(a, 0.05)));
      store.stops.push(attachPointer(el, pick('img.fan__lines'), diamonds));
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) stop();
        else if (!timer && !store.tweens.length && !store.stops.length) {
          timer = window.setTimeout(start, REDUCED ? 0 : ENTRANCE_MS);
        }
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [ref]);

  return (
    <section className="fan" aria-labelledby="fan-title" ref={ref}>
      <div className="fan__frame">
        <div aria-hidden="true">
          <Arcs className="fan__arcs--left" side="l" />
          <Arcs className="fan__arcs--right" side="r" />
          {DIAMONDS.map(([x, y, c], i) => (
            <span key={i} className="fan__diamond" style={{ ['--x' as string]: x, ['--y' as string]: y, background: c }} />
          ))}
          {PILLS.map((p) => (
            <span
              key={p.label}
              className="fan__pill"
              style={{ ['--x' as string]: p.x, ['--y' as string]: p.y, ['--w' as string]: p.w }}
            >
              {p.icon}{p.label}
            </span>
          ))}
        </div>

        <div className="fan__tile" aria-hidden="true">
          <img src={tileBg} alt="" className="fan__tile-bg" />
          <span className="fan__glass"><img src={tileLogo} alt="" /></span>
        </div>
        <h2 id="fan-title" className="fan__title">Your Funds Stay in Your Control</h2>
        <p className="fan__sub">
          Your assets stay under your control through non-custodial infrastructure and transparent on-chain settlement.
        </p>
      </div>
    </section>
  );
}
