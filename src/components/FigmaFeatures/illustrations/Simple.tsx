import lines from './svg/imgGroup2085662421.svg?raw';
import { Layer, Stage, Strokes, part } from './Stage';
import { all, bob, count, draw, one, pop, type IllustrationMotion } from './motion';

/** "Crypto-to-fiat payments made simple" (Figma 2348:1733, 709×334): BTC flows through Remittix into a bank receipt. */
export function Simple() {
  return (
    <Stage id="simple" width={709} height={334} className="ff__art ff__art--simple il-simple">
      <Layer className="il-simple__decor" src="imgEllipse3440.svg" x={258.4} y={-330.6} w={489.2} h={489.2} />
      <Layer className="il-simple__decor il-simple__lime" src="imgEllipse3441.svg" x={198.4} y={179.4} w={489.2} h={489.2} />
      <Layer className="il-simple__decor" src="imgEllipse3437.svg" x={143} y={-93} w={395} h={395} />
      <Layer className="il-simple__decor" src="imgEllipse3437.svg" x={190} y={-150} w={395} h={395} />
      <Layer className="il-simple__decor" src="imgEllipse3437.svg" x={277} y={-237} w={395} h={395} />

      <Strokes className="il-simple__lines" svg={lines} x={132} y={140} w={269} h={119.5} />

      <div className="il-pill il-simple__btc il-simple__node" style={{ left: 17, top: 239 }}>
        <span className="il-pill__coin">
          <img src={part('imgFrame2085662026.svg')} alt="" width={30.8} height={30.8} />
        </span>
        <span className="il-pill__text">0.0128 BTC</span>
      </div>
      <Layer className="il-simple__logo" src="imgFrame2085662273.svg" x={257} y={31} w={80} h={32} />
      <Layer className="il-simple__logo" src="imgFrame2085662272.svg" x={149} y={80} w={106} h={36} />
      <div className="il-simple__wise il-simple__logo" style={{ left: 112, top: 151 }}>
        <span style={{ maskImage: `url(${part('imgRectangle34624647.png')})`, WebkitMaskImage: `url(${part('imgRectangle34624647.png')})` }} />
      </div>
      <div className="il-simple__remittix il-simple__node" style={{ left: 258, top: 155 }}>
        <img src={part('imgGroup3.svg')} alt="" width={15.4} height={8} />
        <span>Remittix</span>
      </div>
      <div className="il-swap il-swap--lime il-simple__swap" style={{ left: 410, top: 130 }}>
        <img src={part('imgUilExchange1.svg')} alt="" width={14} height={14} />
      </div>

      <div className="il-rc" style={{ left: 425, top: 32 }}>
        <div className="il-rc__row il-rc__head">
          <span className="il-rc__bank">
            <img src={part('imgFrame2085662286.svg')} alt="" width={24} height={24} />
            <span>
              <b>New Bank</b>
              <small>EUR ····4417</small>
            </span>
          </span>
          <span className="il-rc__badge">
            <img src={part('imgEllipse3432.svg')} alt="" width={2.7} height={2.7} />
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
        <div className="il-rc__row il-rc__line"><span>Arrived in</span><span className="il-mono">4.2 sec</span></div>
      </div>
      <div className="il-toast" style={{ left: 425, top: 251 }}>
        <img src={part('imgFrame2085662288.svg')} alt="" width={20} height={20} />
        <span>
          Credited to bank account
          <small className="il-mono">TODAY · 14:02</small>
        </span>
      </div>
    </Stage>
  );
}

export const simpleMotion: IllustrationMotion = {
  build(tl, il, at, gsap) {
    tl.from(all(il, '.il-simple__decor'), { opacity: 0, duration: 1.0, stagger: 0.1, ease: 'power1.out' }, at);
    pop(tl, one(il, '.il-simple__btc'), at + 0.1);
    draw(tl, gsap, all<SVGGeometryElement>(il, '.il-simple__lines path'), at + 0.3, 1.1);
    const dots = all<SVGCircleElement>(il, '.il-simple__lines circle').sort((a, b) => Number(a.getAttribute('cx')) - Number(b.getAttribute('cx')));
    dots.forEach((dot, i) => pop(tl, dot, at + 0.55 + i * 0.35, { scale: 0, duration: 0.45 }));
    pop(tl, one(il, '.il-simple__remittix'), at + 0.75);
    tl.from(all(il, '.il-simple__logo'), { y: 12, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' }, at + 0.4);
    pop(tl, one(il, '.il-simple__swap'), at + 1.2, { scale: 0, rotation: -180, duration: 0.7 });
    tl.from(one(il, '.il-rc'), { x: 40, opacity: 0, duration: 0.8, ease: 'power3.out' }, at + 1.3);
    tl.from(all(il, '.il-rc__row'), { y: 10, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, at + 1.45);
    count(tl, one(il, '[data-count="eur"]'), 0, 1240, at + 1.6, 0.9, (n) => `€${Math.round(n).toLocaleString('en-US')}`);
    pop(tl, one(il, '.il-rc__badge'), at + 2.3, { scale: 0.4 });
    tl.from(one(il, '.il-toast'), { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' }, at + 2.4);
  },
  idle(gsap, il) {
    all(il, '.il-simple__logo').forEach((l, i) => bob(gsap, l, 4, 3.2 + i * 0.5, i * 0.7));
    gsap.to(one(il, '.il-simple__swap'), { rotation: '+=180', duration: 0.7, ease: 'back.out(1.5)', repeat: -1, repeatDelay: 4.3, repeatRefresh: true });
    gsap.fromTo(one(il, '.il-simple__lime'), { opacity: 0.75 }, { opacity: 1, duration: 3.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    bob(gsap, one(il, '.il-toast'), 2, 3.8, 1);
  },
};
