import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, count, one, roll, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

const W = 704;
const H = 180;
const N = 40;
const BASE = 96840;
/** A day's shape for the chart, deterministic so the scene is the same on every visit. */
const series = (shift = 0) =>
  Array.from({ length: N }, (_, i) => {
    const t = i + shift;
    return 0.5 + Math.sin(t * 0.34) * 0.19 + Math.sin(t * 0.11) * 0.24 + Math.sin(t * 0.77) * 0.06;
  });
const priceAt = (v: number) => Math.round(BASE * (0.972 + v * 0.055));
const HOURS = ['09:00', '11:00', '13:00', '15:00', '17:00'];
const MARKETS: [string, string, string][] = [
  ['ETH / EUR', '3,412.80', '+1.24%'],
  ['SOL / EUR', '184.36', '-0.41%'],
  ['USDT / EUR', '0.9184', '+0.02%'],
];

/**
 * Trading: the live market, not a swap form. A day's chart with a crosshair that reads it back,
 * the headline pair above and the other markets below, all ticking against the same rate.
 */
export function Trading() {
  return (
    <Stage id="ec-trading" width={800} height={640} className="ec-il ec-trade">
      <div className="ec-trade__head" style={{ left: 48, top: 96 }}>
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
      </div>

      <div className="ec-trade__chart" style={{ left: 48, top: 258 }}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
          <defs>
            <linearGradient id="ec-tr-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4042d1" stopOpacity="0.20" />
              <stop offset="1" stopColor="#4042d1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((i) => (
            <line key={i} className="ec-trade__grid" x1="0" x2={W} y1={(H / 3) * i} y2={(H / 3) * i} />
          ))}
          <path className="ec-trade__area" fill="url(#ec-tr-fill)" d="" />
          <path className="ec-trade__line" d="" />
          <line className="ec-trade__cross" y1="0" y2={H} />
          <circle className="ec-trade__dot" r="5" />
        </svg>
        <span className="ec-trade__tip">
          <b className="il-mono" data-count="tip">€96,840</b>
          <small data-count="tiptime">13:20</small>
        </span>
        <span className="ec-trade__axis">
          {HOURS.map((h) => (
            <em key={h}>{h}</em>
          ))}
        </span>
      </div>

      <div className="ec-trade__markets" style={{ left: 48, top: 494 }}>
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
      </div>
    </Stage>
  );
}

const paint = (il: HTMLElement, vs: number[]) => {
  const pts = vs.map((v, i) => [(i / (N - 1)) * W, H - 12 - v * (H - 30)] as const);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  one<SVGPathElement>(il, '.ec-trade__line').setAttribute('d', d);
  one<SVGPathElement>(il, '.ec-trade__area').setAttribute('d', `M 0 ${H} ${d.slice(1)} L ${W} ${H} Z`);
  return pts;
};

export const tradingMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    const pts = paint(il, series());
    tl.from(all(il, '.ec-trade__head > *'), { ...RISE, y: 10, stagger: 0.08 }, at);
    tl.from(all(il, '.ec-trade__grid'), { opacity: 0, duration: 0.5, stagger: 0.05 }, at + 0.2);
    const line = one<SVGPathElement>(il, '.ec-trade__line');
    const len = line.getTotalLength();
    tl.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, at + 0.3);
    tl.from(one(il, '.ec-trade__area'), { opacity: 0, duration: 0.9 }, at + 0.9);
    count(tl, one(il, '[data-count="price"]'), BASE * 0.986, priceAt(pts.length ? 0.5 : 0.5), at + 0.3, 1.0, (n) => `€${Math.round(n).toLocaleString('en-US')}`);
    tl.from(all(il, '.ec-trade__axis em'), { ...RISE, y: 6, duration: 0.5, stagger: 0.05 }, at + 1.0);
    tl.from(all(il, '.ec-trade__market'), { ...RISE, y: 10, stagger: 0.08 }, at + 1.05);
    // The crosshair only appears once the line has finished drawing.
    const i = Math.round(N * 0.62);
    gsap.set(one(il, '.ec-trade__cross'), { x: pts[i][0] });
    gsap.set(one(il, '.ec-trade__dot'), { x: pts[i][0], y: pts[i][1] });
    gsap.set(one(il, '.ec-trade__tip'), { x: pts[i][0] - 44, y: pts[i][1] - 58 });
    tl.from([one(il, '.ec-trade__cross'), one(il, '.ec-trade__dot'), one(il, '.ec-trade__tip')], { opacity: 0, duration: 0.5, ease: EASE }, at + 1.4);
  },
  idle(gsap, il) {
    // The crosshair walks the day and reads the price back; every few steps the market moves on,
    // the line redraws to the new shape and the other pairs follow.
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
    let pts = paint(il, series(shift));
    let k = Math.round(N * 0.62);
    const idle = gsap.timeline();

    const step = gsap.timeline({ repeat: -1, repeatDelay: 0.55, delay: 0.9 });
    step.add(() => {
      k = (k + 1) % N;
      const [x, y] = pts[k];
      const v = (H - 12 - y) / (H - 30);
      gsap.to(cross, { x, duration: 0.5, ease: 'power2.inOut' });
      gsap.to(dot, { x, y, duration: 0.5, ease: 'power2.inOut' });
      gsap.to(tip, { x: x - 44, y: y - 58, duration: 0.5, ease: 'power2.inOut' });
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
      const prev = pts.map((p) => (H - 12 - p[1]) / (H - 30));
      const mix = { p: 0 };
      gsap.to(mix, {
        p: 1,
        duration: 0.9,
        ease: 'power2.inOut',
        onUpdate: () => {
          pts = paint(il, prev.map((v, i) => v + (next[i] - v) * mix.p));
          const [x, y] = pts[k];
          gsap.set(cross, { x });
          gsap.set(dot, { x, y });
          gsap.set(tip, { x: x - 44, y: y - 58 });
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
