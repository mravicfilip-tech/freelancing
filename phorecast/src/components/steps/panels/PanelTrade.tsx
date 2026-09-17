import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import s3Btc from '../../../assets/steps/s3-btc.svg';
import s3Target from '../../../assets/steps/s3-target.svg';
import s3Tesla from '../../../assets/steps/s3-tesla.svg';
import s3Sp500 from '../../../assets/steps/s3-sp500.svg';
import s3Apple from '../../../assets/steps/s3-apple.svg';
import s3GridTall from '../../../assets/steps/s3-grid-tall.svg';
import s3GridShort from '../../../assets/steps/s3-grid-short.svg';
import s3Marker from '../../../assets/steps/s3-marker.svg';
// Raw, not a URL. The graph is one exported vector layer and the loop has to
// reach the line inside it -- nothing inside an <img> is addressable, so there
// is no `stroke-dashoffset` and no per-path access. It paints exactly as the
// <img> did: the export already carries its own 371 x 191 viewBox and
// `preserveAspectRatio="none"`, and PanelTrade.css gives it a box of exactly
// those design pixels.
import chartMarkup from '../../../assets/steps/s3-chart.svg?raw';
import { REDUCED } from '../../../lib/motion';
import { Mark, Glow } from './shared';
import './PanelTrade.css';

/**
 * Namespace the export's internal ids.
 *
 * An inlined SVG's ids are document-global, and Figma numbers them per export
 * session (`paint0_linear_0_17`, `clip0_0_17`, ...), so two panels inlining two
 * exports can collide and silently steal each other's gradients. Only the ids
 * something actually points at with `url(#...)` are renamed, which leaves the
 * layer names -- `Vector 60`, `Detail Point` -- alone for the motion to find.
 * The file on disk stays exactly as Figma exported it.
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

/* Panel 3 -- market picker and price chart (Figma 365:1532) ----------------- */
const TILES = [
  { mod: 'btc', icon: s3Btc, w: 28, h: 28, active: true },
  { mod: 'gold', icon: s3Target, w: 28, h: 28, active: false },
  { mod: 'tesla', icon: s3Tesla, w: 20.8, h: 20.7113, active: false },
  { mod: 'sp', icon: s3Sp500, w: 30, h: 8, active: false },
  { mod: 'apple', icon: s3Apple, w: 28, h: 28, active: false },
];

/** The measure lines drawn over the graph (365:1573-1580), in Figma's order.
 *  Their x, y and height live in PanelTrade.css as `.s3__grid--<key>`. */
const GRID = [
  { key: 'a', src: s3GridTall, h: 116 },
  { key: 'b', src: s3GridShort, h: 71 },
  { key: 'c', src: s3Marker, h: 64.5 },
  { key: 'd', src: s3GridShort, h: 71 },
  { key: 'e', src: s3GridTall, h: 116 },
  { key: 'f', src: s3GridShort, h: 71 },
  { key: 'g', src: s3GridTall, h: 116 },
  { key: 'h', src: s3GridShort, h: 71 },
];

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
          {GRID.map((g) => (
            <img key={g.key} src={g.src} alt="" width={1} height={g.h} className={`s3__grid s3__grid--${g.key}`} />
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
 * The panel's story is "pick a market, watch its price move", so the loop is
 * exactly that and nothing else: the BTC tile lifts as though it had just been
 * chosen, the curve winds back to nothing and grows again left to right with a
 * lit dot on its drawing edge, the fill follows the dot, and the figure counts
 * up from the -2.41% base to the price the design ships. Then it rests on the
 * design for a second and a half and goes round again.
 *
 * Timing is quoted in GSAP seconds. `gsap.ticker.lagSmoothing` is on (see
 * lib/motion.ts), so on a slow machine a turn takes longer in wall time than
 * the numbers below; the sequence is the same either way. The turn is 5.8s, so
 * a whole beat fits inside the stepper's 6s dwell.
 *
 * Nothing here listens to the pointer, nothing floats, and the design's
 * `62,894.00` is written back verbatim at the end of every count so the figure
 * cannot drift. `prefers-reduced-motion` returns before a single value is set.
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
  /* The marker's drop line is drawn twice in the design: once inside the graph
     export, once as a separate layer over it (365:1575). The loose one has to
     come and go with the rest of the marker, or it is left hanging over an
     empty card while the curve is redrawn. */
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

  /* One design pixel in real CSS pixels. `--p` is written in container-query
     units and cannot be read back as a length, so it comes off the box: the
     price card is 424 design px wide. */
  const u = card.getBoundingClientRect().width / 424 || 1;

  const restInt = intEl.textContent ?? '';
  const restDec = decEl.textContent ?? '';

  /* The wipe that carries the fill's right edge along with the drawing line.
     A clipPath, because the fill is one closed path and there is no honest way
     to grow it otherwise; the dot below is what actually travels. */
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

  /* The lit dot that rides the drawing edge. Inside the same <svg>, last in the
     graph group so it paints over the fill, and a flat colour so it depends on
     none of the export's gradients. It belongs to the motion, so if this module
     never runs the artwork has no stray dot sitting on the curve.

     Its colour is a class, not a `fill` attribute and not `tok()`: this panel
     is built on mount and never rebuilt, so a value read in JS here would
     freeze against whichever palette was live at the time, where a CSS rule
     re-resolves the moment the theme changes. `.s3__head` is in
     PanelTrade.css, which this module imports. */
  const head = document.createElementNS(NS, 'circle');
  head.setAttribute('r', '4.2');
  head.setAttribute('class', 's3__head');
  head.setAttribute('cx', '-20');
  head.setAttribute('cy', '-20');
  head.style.opacity = '0';
  group.appendChild(head);

  const total = line.getTotalLength();
  /* Where the design's own marker sits on the curve, so it can come back the
     instant the drawing edge reaches it rather than on a guessed cue. */
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
  /* The design's figure, written back verbatim rather than re-derived, so a
     rounding difference can never leave the panel resting on 62,893.99. */
  const restMoney = () => { intEl.textContent = restInt; decEl.textContent = restDec; };

  /* The dash and the clip exist only while the curve is being drawn. Outside the
     beat the export is handed back untouched, so the long rest at the end of
     every turn is the shipped artwork and not a styled copy of it. */
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

    /* The curve winds back right to left, then grows again. Both are `fromTo`
       with `immediateRender: false`: a fromTo writes its START value when the
       timeline is BUILT, not when the playhead arrives, so without the flag the
       panel would paint its very first frame with the curve already erased and
       sit there until the beat came round. */
    loop
      .fromTo(edge, { p: 1 },
        { p: 0, duration: RETRACT, ease: 'power2.in', onUpdate: paintEdge, immediateRender: false }, LEAD)
      .fromTo(edge, { p: 0 },
        { p: 1, duration: DRAW, ease: 'power2.inOut', onUpdate: paintEdge, immediateRender: false }, DRAW_AT)
      .fromTo(head, { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'sine.out', immediateRender: false }, DRAW_AT)
      .to(head, { opacity: 0, duration: 0.35, ease: 'sine.in' }, DRAW_END - 0.35);

    /* The price flag leaves with the curve and lands back on it the instant the
       drawing edge reaches its x -- measured off the path, not cued by guess. */
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

    /* The readout is stacked with no gaps by design -- the label sits directly
       on the price's ascenders -- so nothing in that column can be lifted
       without colliding with the line above it. The figure's answer is the
       count itself, which swings its own box more than twenty pixels wide as
       the digits change, and the tile and the flag carry the travel. */

    // Whatever the beats add up to, a turn is a fixed 5.8s, so the rest at the
    // end of it is real rest rather than an accident of timing -- and the whole
    // beat lands inside the stepper's six-second dwell.
    loop.repeatDelay(Math.max(0, PERIOD - loop.duration()));

    /* A loop below the fold costs nothing. The panel is unmounted on every step
       change anyway, but the stepper stops advancing the moment anyone touches
       the section, and a paused panel should not keep painting off screen. */
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
    // revert() puts the values back but leaves the properties it wrote behind on
    // SVG nodes; the export is handed back exactly as it was found.
    disarm();
    marker.removeAttribute('transform');
    marker.style.removeProperty('opacity');
    restMoney();
    gsap.set([tile, price, delta], { clearProps: 'all' });
  };
}
