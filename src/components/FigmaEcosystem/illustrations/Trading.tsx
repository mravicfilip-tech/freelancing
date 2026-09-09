import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, count, isMobile, one, roll, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

const N = 40;
const BASE = 96840;

/**
 * The chart's box in each layout, so the markup, the path maths and the crosshair all read the
 * same numbers. `foot` is the gap kept under the lowest point, `span` the vertical travel a value
 * of 0..1 gets; `tipW` is set only where the tooltip has to be kept inside the frame.
 *
 * The portrait box is not the landscape one squashed: it is a fresh 345x176 (aspect 1.96 against
 * the desk's 3.91), which is what a day's shape needs to stay legible when it only has a phone's
 * width to run across. The series is identical, so both layouts draw the same day.
 */
type Geo = { w: number; h: number; foot: number; span: number; tipW: number };
const LAND: Geo = { w: 704, h: 180, foot: 12, span: 150, tipW: 0 };
const PORT: Geo = { w: 345, h: 176, foot: 14, span: 138, tipW: 84 };
const geoOf = (il: HTMLElement) => (isMobile(il) ? PORT : LAND);
const yAt = (g: Geo, v: number) => g.h - g.foot - v * g.span;
const vAt = (g: Geo, y: number) => (g.h - g.foot - y) / g.span;

/** A day's shape for the chart, deterministic so the scene is the same on every visit. */
const series = (shift = 0) =>
  Array.from({ length: N }, (_, i) => {
    const t = i + shift;
    return 0.5 + Math.sin(t * 0.34) * 0.19 + Math.sin(t * 0.11) * 0.24 + Math.sin(t * 0.77) * 0.06;
  });
const priceAt = (v: number) => Math.round(BASE * (0.972 + v * 0.055));
/** Nine to five in five ticks on a desk; the phone keeps the ends and the middle of the same day. */
const HOURS = ['09:00', '11:00', '13:00', '15:00', '17:00'];
const HOURS_M = ['09:00', '13:00', '17:00'];
const MARKETS: [string, string, string][] = [
  ['ETH / EUR', '3,412.80', '+1.24%'],
  ['SOL / EUR', '184.36', '-0.41%'],
  ['USDT / EUR', '0.9184', '+0.02%'],
];

/**
 * Trading: the live market, not a swap form. A day's chart with a crosshair that reads it back,
 * the headline pair above and the other markets below, all ticking against the same rate.
 *
 * The phone gets its own composition rather than the landscape one fitted into 361px — at that
 * scale the axis labels land near 5px and the third rate card falls off the edge. Same parts,
 * same class names, so the motion below re-aims itself by reading `isMobile` instead of forking.
 */
export function Trading({ mobile = false }: { mobile?: boolean } = {}) {
  return mobile ? <TradingPortrait /> : <TradingLandscape />;
}

/** The headline: which pair, what it costs right now, and why that number is the whole product. */
function Head() {
  return (
    <>
      <span className="ec-trade__pair">
        BTC / EUR
        <i className="ec-live">
          <i />
          Live
        </i>
      </span>
      <span className="ec-trade__price">
        <b data-count="price">€96,840</b>
        <em className="ec-trade__delta" data-count="delta">
          +0.42%
        </em>
      </span>
      <span className="ec-trade__sub">Market rate · no exchange account · no spread</span>
    </>
  );
}

/** The chart itself: grid, area, line, crosshair and the tooltip that rides it, all at `g`'s size. */
function Chart({ g, hours }: { g: Geo; hours: string[] }) {
  return (
    <>
      <svg viewBox={`0 0 ${g.w} ${g.h}`} width={g.w} height={g.h} aria-hidden="true">
        <defs>
          <linearGradient id="ec-tr-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4042d1" stopOpacity="0.20" />
            <stop offset="1" stopColor="#4042d1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} className="ec-trade__grid" x1="0" x2={g.w} y1={(g.h / 3) * i} y2={(g.h / 3) * i} />
        ))}
        <path className="ec-trade__area" fill="url(#ec-tr-fill)" d="" />
        <path className="ec-trade__line" d="" />
        <line className="ec-trade__cross" y1="0" y2={g.h} />
        <circle className="ec-trade__dot" r="5" />
      </svg>
      <span className="ec-trade__tip">
        <b className="il-mono" data-count="tip">
          €96,840
        </b>
        <small data-count="tiptime">13:20</small>
      </span>
      <span className="ec-trade__axis">
        {hours.map((h) => (
          <em key={h}>{h}</em>
        ))}
      </span>
    </>
  );
}

/** The other pairs, ticking against the same rate. */
function Markets() {
  return (
    <>
      {MARKETS.map(([pair, price, delta]) => (
        <span key={pair} className="ec-trade__market">
          <b>{pair}</b>
          <span className="il-mono" data-market-price>
            {price}
          </span>
          <em className={delta.startsWith('-') ? 'is-down' : ''} data-market-delta>
            {delta}
          </em>
        </span>
      ))}
    </>
  );
}

function TradingLandscape() {
  return (
    <Stage id="ec-trading" width={800} height={640} className="ec-il ec-trade">
      <div className="ec-trade__head" style={{ left: 48, top: 96 }}>
        <Head />
      </div>
      <div className="ec-trade__chart" style={{ left: 48, top: 258, width: LAND.w }}>
        <Chart g={LAND} hours={HOURS} />
      </div>
      <div className="ec-trade__markets" style={{ left: 48, top: 494 }}>
        <Markets />
      </div>
    </Stage>
  );
}

/**
 * Portrait, 361x486 — the width a pillar's scene actually gets on a phone, so the composition is
 * drawn at 1:1 and every label renders at the size it was designed at.
 *
 * Two decisions carry it. The chart is re-cut at 345x176: a narrow frame has no room for a 3.9:1
 * ribbon, and standing it up gives the day's swing enough height to still be a shape rather than a
 * wobble. And the three rate cards, which at 361px would be 112px boxes with their figures wrapping,
 * become a full-width list — pair, price, change on one line each. That is the form a phone already
 * uses for a watchlist, it gives every figure the whole width to sit on, and it means the third
 * pair is simply there instead of hanging off the right edge. The axis drops to its three
 * load-bearing ticks (open, midday, close) because five at this width sit on top of each other.
 */
function TradingPortrait() {
  return (
    <Stage id="ec-trading" width={361} height={486} layout="mobile" className="ec-il ec-trade ec-trade--m">
      <div className="ec-trade__head" style={{ left: 0, top: 0 }}>
        <Head />
      </div>
      {/* Inset by the dot's radius so the crosshair's head is never cut at either end of the day. */}
      <div className="ec-trade__chart" style={{ left: 8, top: 108, width: PORT.w }}>
        <Chart g={PORT} hours={HOURS_M} />
      </div>
      <div className="ec-trade__markets" style={{ left: 0, top: 330, width: 361 }}>
        <Markets />
      </div>
    </Stage>
  );
}

const paint = (il: HTMLElement, g: Geo, vs: number[]) => {
  const pts = vs.map((v, i) => [(i / (N - 1)) * g.w, yAt(g, v)] as const);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  one<SVGPathElement>(il, '.ec-trade__line').setAttribute('d', d);
  one<SVGPathElement>(il, '.ec-trade__area').setAttribute('d', `M 0 ${g.h} ${d.slice(1)} L ${g.w} ${g.h} Z`);
  return pts;
};

/**
 * Where the tooltip sits over a point. On a desk it simply hangs above it; on a phone the frame is
 * only 345 wide, so it is held inside the chart at the ends of the day and flips below the point
 * when the market has run high enough that there is no room above it.
 */
const tipXY = (g: Geo, x: number, y: number) => {
  if (!g.tipW) return { x: x - 44, y: y - 58 };
  return { x: Math.min(Math.max(x - g.tipW / 2, 0), g.w - g.tipW), y: y < 64 ? y + 16 : y - 58 };
};

export const tradingMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    const g = geoOf(il);
    const pts = paint(il, g, series());
    tl.from(all(il, '.ec-trade__head > *'), { ...RISE, y: 10, stagger: 0.08 }, at);
    tl.from(all(il, '.ec-trade__grid'), { opacity: 0, duration: 0.5, stagger: 0.05 }, at + 0.2);
    const line = one<SVGPathElement>(il, '.ec-trade__line');
    const len = line.getTotalLength();
    tl.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, at + 0.3);
    tl.from(one(il, '.ec-trade__area'), { opacity: 0, duration: 0.9 }, at + 0.9);
    count(tl, one(il, '[data-count="price"]'), BASE * 0.986, priceAt(0.5), at + 0.3, 1.0, (n) => `€${Math.round(n).toLocaleString('en-US')}`);
    tl.from(all(il, '.ec-trade__axis em'), { ...RISE, y: 6, duration: 0.5, stagger: 0.05 }, at + 1.0);
    tl.from(all(il, '.ec-trade__market'), { ...RISE, y: 10, stagger: 0.08 }, at + 1.05);
    // The crosshair only appears once the line has finished drawing.
    const i = Math.round(N * 0.62);
    const tip = tipXY(g, pts[i][0], pts[i][1]);
    gsap.set(one(il, '.ec-trade__cross'), { x: pts[i][0] });
    gsap.set(one(il, '.ec-trade__dot'), { x: pts[i][0], y: pts[i][1] });
    gsap.set(one(il, '.ec-trade__tip'), { x: tip.x, y: tip.y });
    tl.from([one(il, '.ec-trade__cross'), one(il, '.ec-trade__dot'), one(il, '.ec-trade__tip')], { opacity: 0, duration: 0.5, ease: EASE }, at + 1.4);
  },
  idle(gsap, il) {
    // The crosshair walks the day and reads the price back; every few steps the market moves on,
    // the line redraws to the new shape and the other pairs follow. Both layouts get the same
    // beats — only the geometry underneath them changes.
    const g = geoOf(il);
    const cross = one(il, '.ec-trade__cross');
    const dot = one(il, '.ec-trade__dot');
    const tip = one(il, '.ec-trade__tip');
    const tipVal = one(il, '[data-count="tip"]');
    const tipTime = one(il, '[data-count="tiptime"]');
    const price = one(il, '[data-count="price"]');
    const delta = one(il, '[data-count="delta"]');
    const mPrices = all(il, '[data-market-price]');
    const mDeltas = all(il, '[data-market-delta]');
    let shift = 0;
    let pts = paint(il, g, series(shift));
    let k = Math.round(N * 0.62);
    const idle = gsap.timeline();

    const step = gsap.timeline({ repeat: -1, repeatDelay: 0.55, delay: 0.9 });
    step.add(() => {
      k = (k + 1) % N;
      const [x, y] = pts[k];
      const v = vAt(g, y);
      const t = tipXY(g, x, y);
      gsap.to(cross, { x, duration: 0.5, ease: 'power2.inOut' });
      gsap.to(dot, { x, y, duration: 0.5, ease: 'power2.inOut' });
      gsap.to(tip, { x: t.x, y: t.y, duration: 0.5, ease: 'power2.inOut' });
      tipVal.textContent = `€${priceAt(v).toLocaleString('en-US')}`;
      const mins = 9 * 60 + Math.round((k / (N - 1)) * 8 * 60);
      tipTime.textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    }, 0);
    step.to({}, { duration: 0.1 }, 0);
    idle.add(step, 0);

    const move = gsap.timeline({ repeat: -1, repeatDelay: 4.6, delay: 3.4 });
    move.add(() => {
      shift += 3;
      const next = series(shift);
      const prev = pts.map((p) => vAt(g, p[1]));
      const mix = { p: 0 };
      gsap.to(mix, {
        p: 1,
        duration: 0.9,
        ease: 'power2.inOut',
        onUpdate: () => {
          pts = paint(il, g, prev.map((v, i) => v + (next[i] - v) * mix.p));
          const [x, y] = pts[k];
          const t = tipXY(g, x, y);
          gsap.set(cross, { x });
          gsap.set(dot, { x, y });
          gsap.set(tip, { x: t.x, y: t.y });
        },
      });
      const p = priceAt(next[N - 1]);
      roll(gsap, price, `€${p.toLocaleString('en-US')}`);
      const pct = ((p - BASE) / BASE) * 100;
      delta.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      delta.classList.toggle('is-down', pct < 0);
      mPrices.forEach((el, i) => {
        const base = [3412.8, 184.36, 0.9184][i];
        const drift = Math.sin((shift + i * 5) * 0.4) * [26, 2.4, 0.0026][i];
        el.textContent = (base + drift).toLocaleString('en-US', { minimumFractionDigits: i === 2 ? 4 : 2, maximumFractionDigits: i === 2 ? 4 : 2 });
        const d = (drift / base) * 100;
        mDeltas[i].textContent = `${d >= 0 ? '+' : ''}${d.toFixed(2)}%`;
        mDeltas[i].classList.toggle('is-down', d < 0);
      });
    }, 0);
    move.to({}, { duration: 0.1 }, 0);
    idle.add(move, 0);
    return idle;
  },
};
