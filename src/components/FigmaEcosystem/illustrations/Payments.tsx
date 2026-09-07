import { B, Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, count, draw, one, roll, traveller, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

const RAILS = ['USD', 'EUR · IBAN', 'BRL · Pix', 'ARS'];

/** Payments: crypto in, fiat out. BTC runs through the hub into a bank receipt; local rails feed the hub. */
export function Payments() {
  return (
    <Stage id="ec-payments" width={800} height={640} className="ec-il ec-pay">
      <svg className="ec-lines" viewBox="0 0 800 640" width={800} height={640} style={{ left: 0, top: 0 }} aria-hidden="true">
        <path className="ec-pay__line" d="M232 318 C 290 318, 300 316, 310 316 C 460 316, 440 232, 508 232" />
        <path className="ec-pay__rail" d="M228 452 C 260 420, 300 380, 322 350" />
        <path className="ec-pay__rail" d="M334 452 C 336 420, 338 380, 338 350" />
        <path className="ec-pay__rail" d="M452 452 C 420 420, 380 380, 356 350" />
        <path className="ec-pay__rail" d="M560 452 C 500 420, 420 380, 366 346" />
      </svg>
      <div className="ec-pill ec-pay__btc" style={{ left: 76, top: 296 }}>
        <img src={B('imgFrame2085662026.svg')} alt="" width={30.8} height={30.8} />
        <span>0.0128 BTC</span>
      </div>
      <div className="ec-hub" style={{ left: 309, top: 285 }}>
        <i className="ec-hub__halo" />
        <img src={B('imgGroup3.svg')} alt="" width={35.5} height={18.3} />
      </div>
      <div className="il-rc ec-pay__rc" style={{ left: 508, top: 128 }}>
        <div className="il-rc__row il-rc__head">
          <span className="il-rc__bank">
            <img src={B('imgFrame2085662286.svg')} alt="" width={24} height={24} />
            <span>
              <b>New Bank</b>
              <small>EUR ····4417</small>
            </span>
          </span>
          <span className="il-rc__badge">
            <img src={B('imgEllipse3432.svg')} alt="" width={2.7} height={2.7} />
            Settled
          </span>
        </div>
        <div className="il-rc__row">
          <span className="il-rc__label">Recipient receives</span>
          <span className="il-rc__amount">
            <b className="il-count" data-count="eur">€1,240</b>
            <i>.00</i>
          </span>
        </div>
        <div className="il-rc__row il-rc__rule" />
        <div className="il-rc__row il-rc__line"><span>FX fee</span><span className="il-mono">0.00</span></div>
        <div className="il-rc__row il-rc__line"><span>Arrived in</span><span className="il-mono" data-count="arrived">4.2 sec</span></div>
      </div>
      {RAILS.map((r, i) => (
        <span key={r} className="ec-chip ec-pay__chip" style={{ left: [180, 282, 404, 522][i], top: 452 }}>
          <img src={B('imgLandmark.svg')} alt="" width={16} height={16} />
          {r}
        </span>
      ))}
      <span className="ec-caption" style={{ left: 180, top: 508 }}>Local rails · same-day settlement · zero FX</span>
    </Stage>
  );
}

export const paymentsMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    tl.from(one(il, '.ec-pay__btc'), { ...RISE, y: 12 }, at);
    draw(tl, gsap, [one<SVGPathElement>(il, '.ec-pay__line')], at + 0.15, 1.0);
    tl.from(one(il, '.ec-hub'), { scale: 0.9, opacity: 0, duration: 0.7, ease: EASE, transformOrigin: '50% 50%' }, at + 0.5);
    draw(tl, gsap, all<SVGPathElement>(il, '.ec-pay__rail'), at + 0.7, 0.6, 0.08);
    tl.set(all(il, '.ec-pay__rail'), { strokeDasharray: '3 4' }, at + 1.6);
    tl.from(all(il, '.ec-pay__chip'), { ...RISE, stagger: 0.07 }, at + 0.8);
    tl.from(one(il, '.ec-pay__rc'), { y: 24, opacity: 0, duration: 0.9, ease: EASE }, at + 0.9);
    tl.from(all(il, '.ec-pay__rc .il-rc__row'), { ...RISE, y: 8, duration: 0.6, stagger: 0.06 }, at + 1.1);
    count(tl, one(il, '[data-count="eur"]'), 0, 1240, at + 1.2, 0.9, (n) => `€${Math.round(n).toLocaleString('en-US')}`);
    tl.from(one(il, '.ec-caption'), { ...RISE, y: 6 }, at + 1.5);
  },
  idle(gsap, il) {
    // A payment every few seconds: the coin sends, the packet runs through the hub to the bank, a
    // local rail lights as the hub routes it, and the receipt takes another €10.
    const svg = one<SVGSVGElement>(il, '.ec-lines svg') ?? one<SVGSVGElement>(il, 'svg');
    const line = one<SVGPathElement>(il, '.ec-pay__line');
    const rails = all<SVGPathElement>(il, '.ec-pay__rail');
    const chips = all(il, '.ec-pay__chip');
    const dot = traveller(svg, '#4042d1', 3.5);
    const halo = one(il, '.ec-hub__halo');
    const amount = one(il, '[data-count="eur"]');
    const arrived = one(il, '[data-count="arrived"]');
    const badgeDot = one(il, '.il-rc__badge img');
    let eur = 1240;
    let n = 0;
    const idle = gsap.timeline();
    const story = gsap.timeline({ repeat: -1, repeatDelay: 2.8, delay: 0.8, onRepeat: () => { n = (n + 1) % rails.length; } });
    story.add(() => {
      const b = gsap.timeline();
      b.fromTo(one(il, '.ec-pay__btc img'), { rotation: 0 }, { rotation: 360, duration: 0.7, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0)
        .set(dot, { opacity: 1 }, 0.2)
        .to(dot, { motionPath: { path: line, align: line, alignOrigin: [0.5, 0.5] }, duration: 1.6, ease: 'power2.inOut' }, 0.2)
        .to(dot, { opacity: 0, duration: 0.2 }, 1.75)
        .fromTo(halo, { scale: 1, opacity: 0.5 }, { scale: 1.7, opacity: 0, duration: 0.9, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.7)
        .to(rails[n], { stroke: '#4042d1', opacity: 1, duration: 0.25 }, 0.6)
        .to(rails[n], { strokeDashoffset: '+=28', duration: 1.0, ease: 'none' }, 0.6)
        .to(chips[n], { backgroundColor: '#4042d1', color: '#ffffff', duration: 0.3 }, 0.6)
        .to(chips[n].querySelector('img'), { filter: 'brightness(0) invert(1)', duration: 0.3 }, 0.6)
        .to(rails[n], { stroke: 'rgba(64,66,209,0.35)', duration: 0.6 }, 1.8)
        .to(chips[n], { backgroundColor: '#ffffff', color: '#2c2e31', duration: 0.6 }, 1.9)
        .to(chips[n].querySelector('img'), { filter: 'none', duration: 0.6 }, 1.9)
        .add(() => {
          eur += 10;
          roll(gsap, amount, `€${eur.toLocaleString('en-US')}`);
          roll(gsap, arrived, `${(3.6 + ((eur / 10) % 7) * 0.2).toFixed(1)} sec`);
          gsap.fromTo(amount, { color: '#4042d1' }, { color: '#000', duration: 1.2, ease: 'power1.out', delay: 0.35 });
        }, 1.85)
        .fromTo(badgeDot, { opacity: 1 }, { opacity: 0.15, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 1.95);
    }, 0);
    story.to({}, { duration: 2.6 }, 0);
    idle.add(story, 0);
    return idle;
  },
};
