import { useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { REDUCED, drawPaths, useSectionMotion } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';
import { createFanField, sampleArcs } from './fan-field';
import type { FanField, SampledArc } from './fan-field';
import { startConductor } from './fan-ambient';
import type { Conductor } from './fan-ambient';
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
   identical geometry, but the hairlines land on different subpixels. The arcs
   have to be real nodes to be stroke-drawn and to be sampled for the field,
   and the band at rest has to stay exactly the design that was signed off, so
   the two are kept apart: the <img> pair is the artwork, and an inline copy is
   switched on only to be drawn and measured, then handed back. Both copies of
   a file share one document, so the Figma ids are namespaced or the second
   resolves its url(#...) against the first one's defs. The no-op blur filter
   (stdDeviation 0) is dropped from the drawn copy — re-running a full-frame
   filter for every frame of the draw costs real time and changes nothing. */
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
   Entrance — built to MOTION.md.

   The app tile is what this section is about, so it lands first and entirely
   alone, over 1.25s. A beat of 0.3s follows; only then does anything else
   move. The arcs are the longest tween on the page — four rings of linework
   drawing themselves outward over two seconds on `expo.out`, which is the
   right curve for a line that crosses the whole viewport. The heading and its
   subtitle rise under the tile while that is still happening, the six pills
   arrive in order of distance from the tile on a stagger you can count, and
   the diamonds twinkle in last. They are the only thing here small enough for
   `back.out`: nothing structural overshoots.

   Every step is a gsap.from off the real design state, so a script that never
   runs leaves the section exactly as the stylesheet renders it. Opacity always
   finishes ahead of position, so nothing is still fading while it still moves.
--------------------------------------------------------------------------- */
const TILE_AT = 0;
const TILE_DUR = 1.25;
const BEAT = 0.3;                       // the pause that makes it feel directed
const ARCS_AT = TILE_AT + TILE_DUR + BEAT;
const ARCS_DUR = 2;
const RING_STAGGER = 0.12;              // four concentric rings, opening outward
const ARCS_END = ARCS_AT + RING_STAGGER * 3 + ARCS_DUR;
const HANDOFF_AT = ARCS_END - 0.16;
const HANDOFF_DUR = 0.35;
const TITLE_AT = 2.05;
const SUB_AT = 2.22;
const PILLS_AT = 2.3;
const PILL_STAGGER = 0.14;              // countable, six of them
const DIAMONDS_AT = 2.6;
const DIAMOND_STAGGER = 0.07;           // twelve accents, so tighter than siblings
/** The whole thing, plus a little air before the ambient layer takes over. */
const ENTRANCE_MS = 4400;

function buildEntrance({ el, q, tl }: SectionMotion) {
  /* --- the accent, alone ------------------------------------------------- */
  const [tile] = q('.fan__tile');
  if (tile) {
    tl.from(tile, {
      y: 24, scale: 0.965, duration: TILE_DUR, ease: 'power3.out',
      transformOrigin: '50% 50%', clearProps: 'transform,transformOrigin',
    }, TILE_AT)
      .from(tile, { opacity: 0, duration: 0.8, ease: 'power2.out', clearProps: 'opacity' }, TILE_AT);
  }

  /* The halo only exists while the script is running it, so it is introduced
     here rather than sitting in the stylesheet. */
  const [aura] = q('.fan__aura');
  if (aura && !REDUCED) {
    aura.style.display = 'block';
    tl.fromTo(aura,
      { opacity: 0, scale: 1.9 },
      { opacity: 0.34, scale: 2.35, duration: 1.6, ease: 'power2.out' },
      TILE_AT + 0.2);
  }

  /* --- then, after the beat, the linework draws itself ------------------- */
  const layers = q('.fan__draw');
  const art = Array.from(el.querySelectorAll<HTMLElement>('img.fan__lines'));
  const paths = Array.from(el.querySelectorAll<SVGPathElement>('.fan__draw path'));

  if (layers.length && paths.length) {
    /* getTotalLength needs the subtree out of display:none, and drawPaths
       measures synchronously, so switch the layer on before building. */
    layers.forEach((l) => { l.style.display = 'block'; });

    /* DOM order is left-group-then-right-group, which would draw one side
       before the other. Order by each ellipse's index inside its own group so
       all four sheets draw ring 1 together and the fan opens outward from the
       middle of the band, perfectly mirrored. */
    const ring = (p: SVGPathElement) =>
      p.parentElement ? Math.min(3, Array.prototype.indexOf.call(p.parentElement.children, p)) : 0;
    const ordered = paths.slice().sort((a, b) => ring(a) - ring(b));
    const delays = ordered.map((p) => ring(p) * RING_STAGGER);

    tl.set(art, { opacity: 0 }, ARCS_AT);
    drawPaths(tl, ordered, {
      duration: ARCS_DUR, ease: 'expo.out', at: ARCS_AT,
      stagger: ((i: number) => delays[i]) as unknown as number,
    });
    /* ...and the two halves travel in towards each other while they draw. */
    tl.from(layers, {
      x: (i: number) => (i ? 34 : -34), duration: ARCS_DUR + 0.3, ease: 'expo.out',
      clearProps: 'transform',
    }, ARCS_AT);

    /* Hand the finished linework back to the artwork. Both copies are the same
       picture, so a straight cross-fade holds a constant total; it overlaps the
       flat tail of the expo curve, where nothing perceptible is left to draw. */
    tl.to(art, { opacity: 1, duration: HANDOFF_DUR, ease: 'power1.inOut' }, HANDOFF_AT)
      .to(layers, { opacity: 0, duration: HANDOFF_DUR, ease: 'power1.inOut' }, HANDOFF_AT)
      .set(art, { clearProps: 'opacity' })
      .set(layers, { display: 'none', clearProps: 'opacity,transform' });
  }

  /* --- the copy rises under the tile ------------------------------------- */
  const [title] = q('.fan__title');
  if (title) {
    tl.from(title, { y: 24, duration: 1.05, ease: 'power3.out', clearProps: 'transform' }, TITLE_AT)
      .from(title, { opacity: 0, duration: 0.7, ease: 'power2.out', clearProps: 'opacity' }, TITLE_AT);
  }
  const [sub] = q('.fan__sub');
  if (sub) {
    tl.from(sub, { y: 20, duration: 0.95, ease: 'power3.out', clearProps: 'transform' }, SUB_AT)
      .from(sub, { opacity: 0, duration: 0.65, ease: 'power2.out', clearProps: 'opacity' }, SUB_AT);
  }

  /* --- six pills, blooming outward from the tile ------------------------- */
  /* Scattered marks read badly left to right. Ordering them by distance from
     the tile sends them outward from where the eye already is. */
  const centre = tile?.getBoundingClientRect();
  const cx = centre ? centre.left + centre.width / 2 : 0;
  const cy = centre ? centre.top + centre.height / 2 : 0;
  const radius = (e: HTMLElement) => {
    const r = e.getBoundingClientRect();
    return Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
  };
  const pills = q('.fan__pill').sort((a, b) => radius(a) - radius(b));
  if (pills.length) {
    tl.from(pills, {
      y: 18, scale: 0.965, duration: 0.95, ease: 'power2.out', stagger: PILL_STAGGER,
      transformOrigin: '50% 50%', clearProps: 'transform,transformOrigin',
    }, PILLS_AT)
      .from(pills, {
        opacity: 0, duration: 0.6, ease: 'power2.out', stagger: PILL_STAGGER,
        clearProps: 'opacity',
      }, PILLS_AT);
  }

  /* --- and the diamonds twinkle in last ---------------------------------- */
  /* A fixed scatter rather than gsap's random stagger: just as unordered to
     look at, and reproducible frame for frame when reviewing. These are 9px
     marks, which is the one place an overshoot is not cheap. */
  const diamonds = q('.fan__diamond');
  const twinkle = diamonds
    .map((e, i) => ({ e, k: (i * 7) % (diamonds.length || 1) }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.e);
  if (twinkle.length) {
    tl.from(twinkle, {
      scale: 0.3, rotation: '+=45', duration: 0.7, ease: 'back.out(1.5)',
      stagger: DIAMOND_STAGGER, clearProps: 'transform',
    }, DIAMONDS_AT)
      .from(twinkle, {
        opacity: 0, duration: 0.45, ease: 'power2.out', stagger: DIAMOND_STAGGER,
        clearProps: 'opacity',
      }, DIAMONDS_AT);
  }
}

/* ---------------------------------------------------------------------------
   Lifecycle for everything that runs after the entrance.
--------------------------------------------------------------------------- */

/**
 * Measures the arcs off the draw layer. `visibility: hidden` still has layout,
 * so the geometry is readable without ever painting the inline copy over the
 * artwork — which matters on resize, long after the hand-off.
 */
function measureArcs(section: HTMLElement): SampledArc[] {
  const layers = Array.from(section.querySelectorAll<HTMLElement>('.fan__draw'));
  const prev = layers.map((l) => [l.style.display, l.style.visibility] as const);
  layers.forEach((l) => { l.style.display = 'block'; l.style.visibility = 'hidden'; });
  try {
    return sampleArcs(section);
  } catch {
    return [];
  } finally {
    layers.forEach((l, i) => { l.style.display = prev[i][0]; l.style.visibility = prev[i][1]; });
  }
}

export function Fan() {
  const ref = useSectionMotion<HTMLElement>(useCallback(buildEntrance, []), { threshold: 0.12 });

  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED) return;

    let conductor: Conductor | null = null;
    let field: FanField | null = null;
    let samples: SampledArc[] = [];
    let dead = false;
    let boot = 0;
    let resizeTimer = 0;

    const frameEl = () => el.querySelector<HTMLElement>('.fan__frame');
    const hosts = () => ({
      section: el,
      arcs: Array.from(el.querySelectorAll<HTMLElement>('.fan__arcs')),
      lines: Array.from(el.querySelectorAll<HTMLElement>('img.fan__lines')),
      diamonds: Array.from(el.querySelectorAll<HTMLElement>('.fan__diamond')),
      pills: Array.from(el.querySelectorAll<HTMLElement>('.fan__pill')),
      tile: el.querySelector<HTMLElement>('.fan__tile'),
      aura: el.querySelector<HTMLElement>('.fan__aura'),
      field: el.querySelector<HTMLElement>('.fan__field'),
    });

    const start = () => {
      boot = 0;
      if (dead || conductor) return;
      conductor = startConductor(hosts(), field);

      if (field) return;
      const host = el.querySelector<HTMLElement>('.fan__field');
      const box = frameEl()?.getBoundingClientRect();
      if (!host || !box) return;
      samples = measureArcs(el);
      if (!samples.length) return;
      /* three is an await away, and the section is already alive without it. */
      void createFanField(host).then((f) => {
        if (dead || !f) { f?.dispose(); return; }
        field = f;
        const b = frameEl()?.getBoundingClientRect();
        f.resize(b?.width || box.width, b?.height || box.height, samples);
        host.style.display = 'block';
        gsap.fromTo(host, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' });
        conductor?.attachField(f);
      });
    };

    const stop = () => {
      if (boot) window.clearTimeout(boot);
      boot = 0;
      conductor?.stop();
      conductor = null;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) stop();
        else if (!conductor && !boot) boot = window.setTimeout(start, ENTRANCE_MS);
      },
      { threshold: 0.05 },
    );
    io.observe(el);

    const ro = new ResizeObserver(() => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeTimer = 0;
        if (dead || !conductor) return;
        const b = frameEl()?.getBoundingClientRect();
        if (!b) return;
        samples = measureArcs(el);
        conductor.remeasure(samples, b.width, b.height);
      }, 180);
    });
    ro.observe(el);

    return () => {
      dead = true;
      io.disconnect();
      ro.disconnect();
      if (resizeTimer) window.clearTimeout(resizeTimer);
      stop();
      field?.dispose();
      field = null;
      const host = el.querySelector<HTMLElement>('.fan__field');
      if (host) { host.style.display = ''; host.style.opacity = ''; }
      const aura = el.querySelector<HTMLElement>('.fan__aura');
      if (aura) { aura.style.display = ''; aura.style.opacity = ''; aura.style.transform = ''; }
    };
  }, [ref]);

  return (
    <section className="fan" aria-labelledby="fan-title" ref={ref}>
      <div className="fan__frame">
        <div aria-hidden="true">
          <Arcs className="fan__arcs--left" side="l" />
          <Arcs className="fan__arcs--right" side="r" />
          {/* Host for the WebGL arc field. Empty and display:none until the
              layer has a context; nothing here is part of the static design. */}
          <div className="fan__field" />
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
          <div className="fan__aura" />
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
