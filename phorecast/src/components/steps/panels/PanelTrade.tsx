import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { gsap } from 'gsap';
import s3Btc from '../../../assets/steps/s3-btc.svg';
import s3Target from '../../../assets/steps/s3-target.svg';
import s3Tesla from '../../../assets/steps/s3-tesla.svg';
import s3Sp500 from '../../../assets/steps/s3-sp500.svg';
import s3Apple from '../../../assets/steps/s3-apple.svg';
import s3GridTall from '../../../assets/steps/s3-grid-tall.svg';
import s3GridShort from '../../../assets/steps/s3-grid-short.svg';
// Raw, not a URL: the loop needs the paths inside the graph, which an <img>
// would hide. The export keeps its own 371 x 191 viewBox and
// `preserveAspectRatio="none"`, and PanelTrade.css sizes the box to match.
import chartMarkup from '../../../assets/steps/s3-chart.svg?raw';
import { REDUCED } from '../../../lib/motion';
import { Icon } from '../../Icon';
import { Mark, Glow } from './shared';
import './PanelTrade.css';

/**
 * Namespace the export's internal ids.
 *
 * An inlined SVG's ids are document-global, and Figma's generated ids
 * (`paint0_linear_0_17`, `clip0_0_17`, ...) can collide across exports and
 * silently swap gradients. Only ids referenced by `url(#...)` are renamed, so
 * layer names (`Vector 60`, `Detail Point`) stay findable. PanelTrade.css
 * targets the `s3-` prefixed ids. The file on disk is unchanged.
 */
const CHART_MARKUP = (() => {
  const refs = new Set<string>();
  for (const m of chartMarkup.matchAll(/url\(#([^)]+)\)/g)) refs.add(m[1]);
  let out = chartMarkup;
  for (const id of refs) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out
      .replace(new RegExp(`id="${esc}"`, 'g'), `id="s3-${id}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, 'g'), `url(#s3-${id})`);
  }
  return out;
})();

/* Panel 3: market picker and price chart (Figma 365:1532) ------------------ */
const TILES = [
  { mod: 'btc', icon: s3Btc, w: 28, h: 28, active: true },
  { mod: 'gold', icon: s3Target, w: 28, h: 28, active: false },
  { mod: 'tesla', icon: s3Tesla, w: 20.8, h: 20.7113, active: false },
  { mod: 'sp', icon: s3Sp500, w: 30, h: 8, active: false },
  { mod: 'apple', icon: s3Apple, w: 28, h: 28, active: false },
];

/** The measure lines drawn over the graph (365:1573-1580), in Figma's order.
 *  Their x, y and height live in PanelTrade.css as `.s3__grid--<key>`.
 *
 *  Seven are one faint white stroke, drawn as masks so their colour can flip
 *  to ink in light. The eighth, `c`, is the price marker's drop line: a
 *  two-stop gradient that a mask would flatten, so it has no file here and
 *  PanelTrade.css paints it (and reverses it in light). */
const GRID: { key: string; src: string | null; h: number }[] = [
  { key: 'a', src: s3GridTall, h: 116 },
  { key: 'b', src: s3GridShort, h: 71 },
  { key: 'c', src: null, h: 64.5 },
  { key: 'd', src: s3GridShort, h: 71 },
  { key: 'e', src: s3GridTall, h: 116 },
  { key: 'f', src: s3GridShort, h: 71 },
  { key: 'g', src: s3GridTall, h: 116 },
  { key: 'h', src: s3GridShort, h: 71 },
];

/** Every glyph in this panel is sized by PanelTrade.css off `--p`. */
const CSS_SIZED: CSSProperties = { width: undefined, height: undefined };

export function PanelTrade() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? tradeMotion(ref.current) : undefined), []);

  return (
    <div className="panel panel--3" ref={ref}>
      <Mark className="steps__mark--corner" />
      <Glow className="steps__glow--corner" />
      <div className="s3" aria-hidden="true">
        <div className="s3__tiles">
          {TILES.map((t) => (
            <span key={t.mod} className={`s3__tile s3__tile--${t.mod}${t.active ? ' is-active' : ''}`}>
              <img src={t.icon} alt="" width={t.w} height={t.h} />
            </span>
          ))}
        </div>
        <div className="s3__chart-card">
          <p className="s3__label">Market price</p>
          <div className="s3__money">
            <p className="s3__price">
              <span className="s3__price-int">62,894.</span>
              <span className="s3__price-dec">00</span>
            </p>
            <p className="s3__delta">+2.41%</p>
          </div>
          <span className="s3__chart" dangerouslySetInnerHTML={{ __html: CHART_MARKUP }} />
          {GRID.map((g) => (g.src
            ? <Icon key={g.key} src={g.src} w={1} h={g.h} className={`s3__grid s3__grid--${g.key}`} style={CSS_SIZED} />
            : <span key={g.key} aria-hidden="true" className={`s3__grid s3__grid--${g.key}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The loop                                                                    */
/* -------------------------------------------------------------------------- */
/**
 * "Pick a market, watch its price move": the BTC tile lifts as if just
 * chosen, the curve winds back and redraws left to right with a lit dot on its
 * edge, the fill follows the dot, and the figure counts up from 2.41% below
 * the design price. Then it rests on the design and repeats.
 *
 * Times are GSAP seconds (`lagSmoothing` in lib/motion.ts can stretch wall
 * time on a slow machine). One turn is 5.8s, inside the stepper's 6s dwell.
 *
 * No pointer handling. The design's `62,894.00` is written back verbatim after
 * every count. Reduced motion returns before anything is set.
 */
const NS = 'http://www.w3.org/2000/svg';

const LEAD = 0.30;
const RETRACT = 0.55;
const DRAW = 2.30;
const DRAW_AT = LEAD + RETRACT;
const DRAW_END = DRAW_AT + DRAW;
/** One full turn of the loop, the rest at the end of it included. */
const PERIOD = 5.8;

/** The price the design rests on, and the base it is 2.41% up from. */
const REST_VALUE = 62894;
const BASE_VALUE = REST_VALUE / 1.0241;

/** Unique per mount, so a re-mount can never point at a clip path being torn down. */
let wipeSeq = 0;

/** The arc length at which `path` crosses `x`; the curve runs left to right, so
 *  a bisection is exact to a twentieth of a design pixel. */
function lengthAtX(path: SVGPathElement, total: number, x: number): number {
  let lo = 0;
  let hi = total;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).x < x) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function tradeMotion(root: HTMLElement): () => void {
  if (REDUCED) return () => {};

  const svg = root.querySelector<SVGSVGElement>('.s3__chart svg');
  const group = svg?.querySelector<SVGGElement>('[id="Graph Container"]') ?? null;
  const line = svg?.querySelector<SVGPathElement>('[id="Vector 60"]') ?? null;
  const area = svg?.querySelector<SVGPathElement>('[id="Vector 6"]') ?? null;
  const marker = svg?.querySelector<SVGGElement>('[id="Detail Point"]') ?? null;
  /* The marker's drop line exists twice: inside the graph export and as a
     separate layer over it (365:1575). The separate one must fade with the
     marker. */
  const markerRule = root.querySelector<HTMLElement>('.s3__grid--c');
  const tile = root.querySelector<HTMLElement>('.s3__tile.is-active');
  const price = root.querySelector<HTMLElement>('.s3__price');
  const intEl = root.querySelector<HTMLElement>('.s3__price-int');
  const decEl = root.querySelector<HTMLElement>('.s3__price-dec');
  const delta = root.querySelector<HTMLElement>('.s3__delta');
  const card = root.querySelector<HTMLElement>('.s3');
  if (!svg || !group || !line || !area || !marker || !markerRule || !tile || !price || !intEl || !decEl || !delta || !card) {
    return () => {};
  }

  /* One design pixel in CSS pixels, measured from the 424 design px price
     card (`--p` is in container-query units and cannot be read back). */
  const u = card.getBoundingClientRect().width / 424 || 1;

  const restInt = intEl.textContent ?? '';
  const restDec = decEl.textContent ?? '';

  /* A clipPath wipe that carries the fill's right edge with the drawing line;
     the fill is one closed path and cannot be grown otherwise. */
  const wipeId = `s3-wipe-${(wipeSeq += 1)}`;
  const defs = svg.querySelector('defs') ?? svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
  const clip = document.createElementNS(NS, 'clipPath');
  clip.setAttribute('id', wipeId);
  const rect = document.createElementNS(NS, 'rect');
  rect.setAttribute('x', '-1');
  rect.setAttribute('y', '-1');
  rect.setAttribute('height', '193');
  rect.setAttribute('width', '373');
  clip.appendChild(rect);
  defs.appendChild(clip);

  /* The lit dot on the drawing edge: last in the graph group so it paints
     over the fill, and created here so it only exists while the motion runs.

     Its colour comes from the `.s3__head` class in PanelTrade.css, not a
     `fill` attribute or `tok()`: this panel is not rebuilt on a theme change,
     so a value read in JS would go stale, whereas a CSS rule follows the
     theme. */
  const head = document.createElementNS(NS, 'circle');
  head.setAttribute('r', '4.2');
  head.setAttribute('class', 's3__head');
  head.setAttribute('cx', '-20');
  head.setAttribute('cy', '-20');
  head.style.opacity = '0';
  group.appendChild(head);

  const total = line.getTotalLength();
  /* Where the design's marker sits on the curve, so it returns exactly when
     the drawing edge reaches it. */
  const markerAt = lengthAtX(line, total, 253.8) / total;

  const edge = { p: 1 };
  const paintEdge = () => {
    const pt = line.getPointAtLength(edge.p * total);
    head.setAttribute('cx', String(pt.x));
    head.setAttribute('cy', String(pt.y));
    // Two design px of lead so the fill's edge sits under the dot rather than
    // trailing it, and so a finished draw covers the fill's last column.
    rect.setAttribute('width', String(Math.max(0, pt.x + 2)));
    line.style.strokeDashoffset = String(total * (1 - edge.p));
  };

  const money = { v: REST_VALUE };
  const paintMoney = () => {
    const s = money.v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dot = s.lastIndexOf('.');
    intEl.textContent = s.slice(0, dot + 1);
    decEl.textContent = s.slice(dot + 1);
  };
  /* The design's figure, written back verbatim so rounding can never leave
     it at 62,893.99. */
  const restMoney = () => { intEl.textContent = restInt; decEl.textContent = restDec; };

  /* The dash and the clip exist only while the curve is drawn; at rest the
     export is untouched. */
  const arm = () => {
    line.style.strokeDasharray = String(total);
    area.setAttribute('clip-path', `url(#${wipeId})`);
  };
  const disarm = () => {
    line.style.removeProperty('stroke-dasharray');
    line.style.removeProperty('stroke-dashoffset');
    area.removeAttribute('clip-path');
    rect.setAttribute('width', '373');
    // `clearProps` on an SVG node drops the transform but leaves the
    // transform-origin GSAP wrote beside it; the export carries neither.
    marker.style.removeProperty('transform-origin');
    marker.removeAttribute('data-svg-origin');
  };

  let io: IntersectionObserver | undefined;

  const ctx = gsap.context(() => {
    const loop = gsap.timeline({ repeat: -1, paused: true, delay: 0.45 });

    // The market is picked: the active tile lifts clear of the row and seats.
    loop
      .to(tile, { y: -14 * u, duration: 0.42, ease: 'expo.out' }, 0)
      .to(tile, { y: 0, duration: 0.62, ease: 'power2.inOut', clearProps: 'transform' }, 0.42);

    loop.call(arm, undefined, 0.02);

    /* The curve winds back, then grows again. These `fromTo`s need
       `immediateRender: false`: otherwise the start value is written when the
       timeline is BUILT and the first frame shows the curve already erased. */
    loop
      .fromTo(edge, { p: 1 },
        { p: 0, duration: RETRACT, ease: 'power2.in', onUpdate: paintEdge, immediateRender: false }, LEAD)
      .fromTo(edge, { p: 0 },
        { p: 1, duration: DRAW, ease: 'power2.inOut', onUpdate: paintEdge, immediateRender: false }, DRAW_AT)
      .fromTo(head, { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'sine.out', immediateRender: false }, DRAW_AT)
      .to(head, { opacity: 0, duration: 0.35, ease: 'sine.in' }, DRAW_END - 0.35);

    /* The price flag leaves with the curve and lands when the drawing edge
       reaches its x (measured off the path). */
    const LAND = DRAW_AT + DRAW * markerAt;
    loop
      .to(marker, { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, LEAD)
      .to(markerRule, { opacity: 0, duration: 0.3, ease: 'power2.in' }, LEAD)
      .to(marker, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', clearProps: 'transform,transformOrigin,opacity' }, LAND)
      .to(markerRule, { opacity: 1, duration: 0.45, ease: 'power2.out', clearProps: 'opacity' }, LAND + 0.1);

    // The figure answers the curve: up from the -2.41% base to the design's own.
    loop
      .call(() => { money.v = BASE_VALUE; paintMoney(); }, undefined, DRAW_AT + 0.1)
      .to(money, { v: REST_VALUE, duration: 1.9, ease: 'power2.out', onUpdate: paintMoney }, DRAW_AT + 0.12)
      .call(restMoney, undefined, DRAW_END - 0.2);

    loop.call(disarm, undefined, DRAW_END + 0.02);

    /* The readout column has no gaps (the label sits on the price's
       ascenders), so nothing in it is lifted; the count itself is its motion. */

    // A turn is a fixed PERIOD (5.8s) whatever the beats add up to, so the
    // rest is deliberate and the beat fits the stepper's 6s dwell.
    loop.repeatDelay(Math.max(0, PERIOD - loop.duration()));

    /* Pause while the panel is off screen. On desktop the panel remounts on
       each step change, but on the phone all three slides stay mounted. */
    io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loop.play(); else loop.pause(); },
      { rootMargin: '150px' },
    );
    io.observe(root);
  }, root);

  return () => {
    io?.disconnect();
    ctx.revert();
    head.remove();
    clip.remove();
    // revert() leaves the properties it wrote on SVG nodes, so clean them up.
    disarm();
    marker.removeAttribute('transform');
    marker.style.removeProperty('opacity');
    restMoney();
    gsap.set([tile, price, delta], { clearProps: 'all' });
  };
}
