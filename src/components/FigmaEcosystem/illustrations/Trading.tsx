import { B, Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, count, one, roll, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

const S = (n: string) => `/figma/simple/${n}`;
const RATE = 96840;
const N = 26;
const seed = () => Array.from({ length: N }, (_, i) => 52 + Math.sin(i * 0.55) * 14 + Math.sin(i * 1.7) * 6);

/** Trading: a swap at the live market rate, with a sparkline that keeps moving. */
export function Trading() {
  return (
    <Stage id="ec-trading" width={800} height={640} className="ec-il ec-trade">
      <div className="ec-card ec-trade__card" style={{ left: 180, top: 130 }}>
        <div className="ec-card__head">
          <b>Swap</b>
          <span className="ec-live">
            <i />
            Live rate
          </span>
        </div>
        <div className="ec-trade__rate">
          <span className="il-mono" data-count="rate">1 BTC = €96,840</span>
          <span className="ec-trade__delta" data-count="delta">+0.42%</span>
        </div>
        <svg className="ec-trade__spark" viewBox="0 0 392 90" width={392} height={90} aria-hidden="true">
          <defs>
            <linearGradient id="ec-spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4042d1" stopOpacity="0.22" />
              <stop offset="1" stopColor="#4042d1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="ec-trade__area" fill="url(#ec-spark-fill)" d="" />
          <polyline className="ec-trade__poly" points="" />
          <circle className="ec-trade__tip" r="4" />
        </svg>
        <div className="ec-trade__rows">
          <div className="ec-row">
            <span className="ec-row__label">Pay</span>
            <span className="ec-row__amount"><b className="il-count" data-count="pay">320</b><i>.00</i></span>
            <span className="ec-row__coin">
              <img src={S('imgGroup1.svg')} alt="" width={22} height={22} />
              USD
            </span>
          </div>
          <span className="ec-trade__swap">
            <img src={B('imgUilExchange.svg')} alt="" width={18} height={18} />
          </span>
          <div className="ec-row">
            <span className="ec-row__label">Receive</span>
            <span className="ec-row__amount"><b className="il-count" data-count="receive">0.004174</b><i>.00</i></span>
            <span className="ec-row__coin">
              <img src={B('imgFrame2085662025.svg')} alt="" width={22} height={22} />
              BTC
            </span>
          </div>
        </div>
      </div>
      <span className="ec-caption" style={{ left: 180, top: 522 }}>Market rate · no exchange account · no spread</span>
    </Stage>
  );
}

const drawSpark = (il: HTMLElement, ys: number[]) => {
  const pts = ys.map((y, i) => `${((i / (N - 1)) * 392).toFixed(1)},${y.toFixed(1)}`);
  one<SVGPolylineElement>(il, '.ec-trade__poly').setAttribute('points', pts.join(' '));
  one<SVGPathElement>(il, '.ec-trade__area').setAttribute('d', `M0 90 L ${pts.join(' L ')} L 392 90 Z`);
  const tip = one<SVGCircleElement>(il, '.ec-trade__tip');
  tip.setAttribute('cx', '392');
  tip.setAttribute('cy', ys[N - 1].toFixed(1));
};

export const tradingMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    const ys = seed();
    drawSpark(il, ys);
    tl.from(one(il, '.ec-trade__card'), { y: 24, opacity: 0, duration: 0.9, ease: EASE }, at);
    tl.from(all(il, '.ec-card__head, .ec-trade__rate'), { ...RISE, y: 8, duration: 0.6, stagger: 0.08 }, at + 0.2);
    const poly = one<SVGPolylineElement>(il, '.ec-trade__poly');
    const len = poly.getTotalLength();
    tl.fromTo(poly, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, at + 0.4);
    tl.from(one(il, '.ec-trade__area'), { opacity: 0, duration: 0.8 }, at + 0.9);
    tl.from(one(il, '.ec-trade__tip'), { scale: 0, opacity: 0, duration: 0.4, ease: EASE, transformOrigin: '50% 50%' }, at + 1.3);
    tl.from(all(il, '.ec-row'), { ...RISE, y: 10, stagger: 0.1 }, at + 0.6);
    tl.from(one(il, '.ec-trade__swap'), { scale: 0.6, opacity: 0, duration: 0.6, ease: EASE, transformOrigin: '50% 50%' }, at + 0.8);
    count(tl, one(il, '[data-count="pay"]'), 0, 320, at + 0.8, 0.8, (n) => String(Math.round(n)));
    count(tl, one(il, '[data-count="receive"]'), 0, 0.004174, at + 0.9, 1.0, (n) => n.toFixed(6));
    tl.from(one(il, '.ec-caption'), { ...RISE, y: 6 }, at + 1.4);
    void gsap;
  },
  idle(gsap, il) {
    // The market keeps moving: every couple of seconds the sparkline slides on a point, the rate
    // rolls to the new price, the BTC figure follows, and every third tick the swap turns.
    let ys = seed();
    let rate = RATE;
    let k = 0;
    const rateEl = one(il, '[data-count="rate"]');
    const delta = one(il, '.ec-trade__delta');
    const receive = one(il, '[data-count="receive"]');
    const swap = one(il, '.ec-trade__swap');
    const idle = gsap.timeline();
    const tick = gsap.timeline({ repeat: -1, repeatDelay: 1.4, delay: 1.2 });
    tick.add(() => {
      k += 1;
      const next = [...ys.slice(1), 52 + Math.sin((k + N) * 0.55) * 14 + Math.sin((k + N) * 1.7) * 6];
      const prev = ys;
      const mix = { p: 0 };
      gsap.to(mix, { p: 1, duration: 0.6, ease: 'power2.out', onUpdate: () => drawSpark(il, prev.map((y, i) => y + (next[i] - y) * mix.p)) });
      ys = next;
      const change = (ys[N - 1] - ys[N - 2]) * -12; // up on the chart is a higher price
      rate = Math.round(rate + change);
      roll(gsap, rateEl, `1 BTC = €${rate.toLocaleString('en-US')}`);
      const pct = ((rate - RATE) / RATE) * 100;
      delta.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      delta.style.color = pct >= 0 ? '#02774d' : '#c0392b';
      roll(gsap, receive, (320 / (rate * 1.0725)).toFixed(6));
      gsap.fromTo(receive, { color: '#4042d1' }, { color: '#2c2e31', duration: 1.0, ease: 'power1.out', delay: 0.3 });
      if (k % 3 === 0) gsap.to(swap, { rotation: '+=180', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' });
    }, 0);
    tick.to({}, { duration: 0.1 }, 0);
    idle.add(tick, 0);
    return idle;
  },
};
