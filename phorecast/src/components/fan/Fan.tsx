import { useCallback, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { REDUCED, drawPaths, revealUp, useSectionMotion } from '../../lib/motion';
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
   Entrance.

   One timeline. The four sheets of linework draw themselves ring by ring from
   the innermost ellipse outward, sweeping in from the sides as they go; the
   tile lands and the copy rises under it; the six pills arrive in order of
   distance from the tile, on an uneven rhythm so it reads as arrival rather
   than as a stagger; the diamonds twinkle in last, in two loose clusters.

   Every step is a gsap.from off the real design state, so a script that never
   runs leaves the section exactly as the stylesheet renders it.
--------------------------------------------------------------------------- */
const DRAW_DUR = 1.15;
/** Ring offsets open out, so the fan decelerates as it widens. */
const RING_AT = [0, 0.16, 0.34, 0.56];
const SHEET_AT = 0.045;
const DRAW_END = RING_AT[3] + SHEET_AT * 3 + DRAW_DUR;
/** Deliberately uneven: a flat stagger reads like a spreadsheet. */
const PILL_AT = [0, 0.09, 0.16, 0.28, 0.34, 0.44];
const DIAMOND_AT = [0, 0.05, 0.1, 0.14, 0.26, 0.3, 0.34, 0.39, 0.5, 0.54, 0.58, 0.63];
const ENTRANCE_MS = 2400;

function buildEntrance({ el, q, tl }: SectionMotion) {
  const layers = q('.fan__draw');
  const art = Array.from(el.querySelectorAll<HTMLElement>('img.fan__lines'));
  const paths = Array.from(el.querySelectorAll<SVGPathElement>('.fan__draw path'));

  if (layers.length && paths.length) {
    /* getTotalLength needs the subtree out of display:none, and drawPaths
       measures synchronously, so switch the layer on before building. */
    layers.forEach((l) => { l.style.display = 'block'; });

    /* DOM order is left-group-then-right-group, which would draw one side
       before the other. Re-order by each ellipse's index inside its own group,
       so ring 1 of all four sheets draws together and the fan opens outward,
       symmetrically, from the middle of the band. */
    const ring = (p: SVGPathElement) =>
      p.parentElement ? Array.prototype.indexOf.call(p.parentElement.children, p) : 0;
    const sheets = Array.from(el.querySelectorAll('.fan__draw svg'));
    const sheetOf = (p: SVGPathElement) => Math.max(0, sheets.indexOf(p.ownerSVGElement as Element));
    const ordered = paths.slice().sort((a, b) => ring(a) - ring(b) || sheetOf(a) - sheetOf(b));
    const delays = ordered.map((p) => RING_AT[Math.min(3, ring(p))] + sheetOf(p) * SHEET_AT);

    tl.set(art, { opacity: 0 }, 0);
    drawPaths(tl, ordered, {
      duration: DRAW_DUR, ease: 'power2.inOut', at: 0,
      stagger: ((i: number) => delays[i]) as unknown as number,
    });
    /* ...and the two halves sweep in towards each other while they draw. */
    tl.from(layers, { x: (i: number) => (i ? 26 : -26), duration: 1.4, ease: 'expo.out', clearProps: 'transform' }, 0);

    /* Hand the finished linework back to the artwork. Both copies are the same
       picture, so a straight cross-fade holds a constant total. */
    const handoff = DRAW_END - 0.15;
    tl.to(art, { opacity: 1, duration: 0.28, ease: 'none' }, handoff)
      .to(layers, { opacity: 0, duration: 0.28, ease: 'none' }, handoff)
      .set(art, { clearProps: 'opacity' })
      .set(layers, { display: 'none', clearProps: 'opacity,transform' });
  }

  const [tile] = q('.fan__tile');
  if (tile) {
    tl.from(
      tile,
      {
        scale: 0.78, y: 18, opacity: 0, duration: 0.72, ease: 'expo.out',
        transformOrigin: '50% 50%', clearProps: 'transform,transformOrigin,opacity',
      },
      0.4,
    );
  }

  /* The halo only exists when the script is running it, so it is introduced
     here rather than sitting in the stylesheet. */
  const [aura] = q('.fan__aura');
  if (aura && !REDUCED) {
    aura.style.display = 'block';
    tl.fromTo(
      aura,
      { opacity: 0, scale: 1.5 },
      { opacity: 0.42, scale: 2.35, duration: 0.95, ease: 'power2.out' },
      0.5,
    );
  }

  revealUp(tl, q('.fan__title'), { y: 18, duration: 0.6, at: 0.58 });
  revealUp(tl, q('.fan__sub'), { y: 14, duration: 0.55, at: 0.7 });

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
        scale: 0.7, y: 10, opacity: 0, duration: 0.52, ease: 'back.out(1.5)',
        transformOrigin: '50% 50%', clearProps: 'transform,transformOrigin,opacity',
        stagger: ((i: number) => PILL_AT[i] ?? i * 0.08) as unknown as number,
      },
      0.86,
    );
  }

  /* A fixed scatter rather than gsap's random stagger: just as unordered to
     look at, and reproducible frame for frame when reviewing. */
  const diamonds = q('.fan__diamond');
  const twinkle = diamonds
    .map((e, i) => ({ e, k: (i * 7) % (diamonds.length || 1) }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.e);
  if (twinkle.length) {
    tl.from(
      twinkle,
      {
        scale: 0.08, opacity: 0, rotation: '+=80', duration: 0.42, ease: 'power3.out',
        clearProps: 'transform,opacity',
        stagger: ((i: number) => DIAMOND_AT[i] ?? i * 0.05) as unknown as number,
      },
      1.45,
    );
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
