import lines from './svg/imgGroup2085662421.svg?raw';
import { B, Layer, Stage, Strokes } from './Stage';
import { all, bob, count, draw, one, pop, rand, roll, traveller, type IllustrationMotion } from './motion';

/**
 * "Crypto-to-fiat payments made simple" (Figma 2409:2462, 747×334): BTC flows along a line through
 * the Remittix hub and an exchange into a bank receipt, over a lavender blob ringed by orbits.
 */
export function Simple() {
  return (
    <Stage id="simple" width={747} height={334} className="ff__art ff__art--simple il-simple">
      <Layer className="il-simple__blob" src={B('imgGroup2085662428.svg')} x={-71} y={-537} w={949} h={1050} />
      <span className="il-simple__ring il-ring" style={{ left: 143, top: -93, width: 395, height: 395 }} />
      <Layer className="il-simple__haze" src={B('ellipse3438.webp')} x={219} y={-190} w={584} h={584} />
      <span className="il-simple__ring il-ring il-ring--bold" style={{ left: 258, top: -154, width: 443, height: 443 }} />

      <Strokes className="il-simple__lines" svg={lines} x={132} y={138} w={272} h={121.75} />

      <div className="il-simple__btc il-simple__node" style={{ left: 17, top: 239 }}>
        <img src={B('imgFrame2085662026.svg')} alt="" width={30.8} height={30.8} />
        <span>0.0128 BTC</span>
      </div>
      <Layer className="il-simple__logo" src={B('imgFrame2085662273.svg')} x={257} y={31} w={80} h={32} />
      <Layer className="il-simple__logo" src={B('imgFrame2085662272.svg')} x={149} y={80} w={106} h={36} />
      <div className="il-simple__wise il-simple__logo" style={{ left: 112, top: 151 }}>
        <span style={{ maskImage: `url(${B('imgRectangle34624647.png')})`, WebkitMaskImage: `url(${B('imgRectangle34624647.png')})` }} />
      </div>
      <div className="il-simple__hub il-simple__node" style={{ left: 242, top: 166 }}>
        <img src={B('imgGroup3.svg')} alt="" width={35.5} height={18.3} />
      </div>
      <div className="il-simple__swap" style={{ left: 410, top: 130 }}>
        <img src={B('imgMoveHorizontal.svg')} alt="" width={16} height={13.4} />
      </div>

      <div className="il-simple__stack" style={{ left: 425, top: 34 }}>
        <div className="il-rc">
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
          <div className="il-rc__row il-rc__line"><span>Rate</span><span className="il-mono">1 BTC = €96,840</span></div>
          <div className="il-rc__row il-rc__line"><span>FX fee</span><span className="il-mono">0.00</span></div>
          <div className="il-rc__row il-rc__line"><span>Arrived in</span><span className="il-mono" data-count="arrived">4.2 sec</span></div>
        </div>
        <div className="il-toast">
          <img src={B('imgFrame2085662288.svg')} alt="" width={20} height={20} />
          <span>
            Credited to bank account
            <small className="il-mono" data-count="time">TODAY · 14:02</small>
          </span>
        </div>
      </div>
    </Stage>
  );
}

export const simpleMotion: IllustrationMotion = {
  build(tl, il, at, gsap) {
    tl.from(one(il, '.il-simple__blob'), { opacity: 0, scale: 0.85, duration: 1.4, ease: 'power2.out', transformOrigin: '40% 60%' }, at);
    tl.from(all(il, '.il-simple__ring, .il-simple__haze'), { opacity: 0, scale: 0.7, duration: 1.2, stagger: 0.12, ease: 'power2.out', transformOrigin: '50% 50%' }, at + 0.1);
    pop(tl, one(il, '.il-simple__btc'), at + 0.3);
    draw(tl, gsap, all<SVGGeometryElement>(il, '.il-simple__lines path'), at + 0.5, 1.1);
    const dots = all<SVGCircleElement>(il, '.il-simple__lines circle').sort((a, b) => Number(a.getAttribute('cx')) - Number(b.getAttribute('cx')));
    dots.forEach((dot, i) => pop(tl, dot, at + 0.75 + i * 0.35, { scale: 0, duration: 0.45 }));
    pop(tl, one(il, '.il-simple__hub'), at + 0.95, { scale: 0, rotation: -40, duration: 0.7 });
    tl.from(all(il, '.il-simple__logo'), { y: 14, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' }, at + 0.6);
    pop(tl, one(il, '.il-simple__swap'), at + 1.4, { scale: 0, rotation: -180, duration: 0.7 });
    tl.from(one(il, '.il-rc'), { x: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, at + 1.5);
    tl.from(all(il, '.il-rc__row'), { y: 10, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, at + 1.65);
    count(tl, one(il, '[data-count="eur"]'), 0, 1240, at + 1.8, 0.9, (n) => `€${Math.round(n).toLocaleString('en-US')}`);
    pop(tl, one(il, '.il-rc__badge'), at + 2.5, { scale: 0.4 });
    tl.from(one(il, '.il-toast'), { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' }, at + 2.6);
  },
  idle(gsap, il) {
    all(il, '.il-simple__logo').forEach((l, i) => bob(gsap, l, 4, 3.2 + i * 0.5, i * 0.7));
    all(il, '.il-simple__ring').forEach((r, i) => gsap.to(r, { rotation: i ? -360 : 360, duration: 60 + i * 20, repeat: -1, ease: 'none', transformOrigin: '50% 50%' }));
    gsap.to(one(il, '.il-simple__blob'), { x: 14, y: 8, duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    bob(gsap, one(il, '.il-toast'), 2, 3.8, 1);
    // Every few seconds a payment travels the line from BTC through the hub to the bank: the hub
    // tips as it passes, the exchange flips, another €10 lands on the receipt with a flick, the
    // arrival time re-measures, the toast's clock ticks on a minute, and the badge nods.
    const svg = one<SVGSVGElement>(il, '.il-simple__lines svg');
    const path = one<SVGPathElement>(svg, 'path');
    const dot = traveller(svg, '#4042d1', 3.5);
    const hub = one(il, '.il-simple__hub');
    const swap = one(il, '.il-simple__swap');
    const amount = one(il, '[data-count="eur"]');
    const arrived = one(il, '[data-count="arrived"]');
    const clock = one(il, '[data-count="time"]');
    const badge = one(il, '.il-rc__badge');
    let eur = 1240;
    let minutes = 14 * 60 + 2;
    const send = () => {
      gsap
        .timeline()
        .set(dot, { opacity: 1 })
        .to(dot, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1.6, ease: 'power1.inOut' })
        .to(dot, { opacity: 0, duration: 0.2 })
        .fromTo(hub, { rotation: 0 }, { rotation: -12, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0.8)
        .to(swap, { rotation: '+=180', duration: 0.6, ease: 'back.out(1.5)', transformOrigin: '50% 50%' }, 1.4)
        .add(() => {
          eur += 10;
          minutes += 1;
          roll(gsap, amount, `€${eur.toLocaleString('en-US')}`);
          arrived.textContent = `${rand(3.6, 4.9).toFixed(1)} sec`;
          clock.textContent = `TODAY · ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
        }, 1.65)
        .fromTo(amount, { color: '#4042d1' }, { color: '#000', duration: 1.4, ease: 'power1.out' }, 1.95)
        .fromTo(badge, { scale: 1 }, { scale: 1.15, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 1.8)
        .fromTo(one(il, '.il-toast'), { x: 0 }, { x: -4, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 2.1);
      gsap.delayedCall(rand(4.5, 6.5), send);
    };
    gsap.delayedCall(1.2, send);
  },
};
