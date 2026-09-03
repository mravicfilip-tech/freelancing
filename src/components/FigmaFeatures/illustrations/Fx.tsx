import { Layer, Stage, part } from './Stage';
import { all, bob, count, one, pop, wipe, type IllustrationMotion } from './motion';

/** "Zero FX fees" (Figma 2354:693, 435×244): a 0% pill, a forked arrow, and a wallet card and bank card. */
export function Fx() {
  return (
    <Stage id="fx" width={435} height={244} className="ff__art ff__art--fx il-fx">
      <div className="il-fx__pill" style={{ left: 187.8, top: 0 }}>
        <span className="il-count" data-count="fee">0%</span>
      </div>
      <span className="il-fx__fee" style={{ left: 179.3, top: 34.2 }}>FX Fee</span>
      <Layer className="il-fx__arrows" src="imgVector1683.svg" x={87.6} y={57.7} w={259.7} h={40} />

      <div className="il-fx__card il-fx__card--wallet" style={{ left: 10.6, top: 112 }}>
        <Layer className="il-fx__glow" src="imgEllipse3425.svg" x={-75.9} y={-84.7} w={202.6} h={202.6} />
        <Layer className="il-fx__hatch" src="imgGroup2085662419.svg" x={-55.8} y={-71.4} w={636.6} h={266.4} />
        <span className="il-fx__chip" style={{ left: 13.7, top: 7.1 }} />
        <Layer src="imgFrame2085662232.svg" x={147.9} y={7.3} w={31.8} h={8.5} />
        <span className="il-fx__icon il-fx__tag" style={{ left: 93.3, top: 85.9 }}>
          <img src={part('imgFi9756779.svg')} alt="" width={10} height={10} />
        </span>
        <span className="il-fx__label il-fx__tag" style={{ left: 118.8, top: 84.3 }}>Wallet</span>
      </div>

      <div className="il-fx__card il-fx__card--bank" style={{ left: 237.6, top: 112 }}>
        <Layer className="il-fx__glow" src="imgEllipse3426.svg" x={54.3} y={-44.4} w={232} h={232} style={{ transform: 'rotate(95.55deg)' }} />
        <Layer className="il-fx__hatch" src="imgGroup2085662420.svg" x={-55.8} y={-77.5} w={636.6} h={266.4} style={{ transform: 'rotate(-2deg)' }} />
        <Layer src="imgFrame2085662233.svg" x={147.9} y={7.2} w={31.8} h={8.5} />
        <span className="il-fx__bar" style={{ left: 13.3, top: 7, width: 74.3 }} />
        <span className="il-fx__bar" style={{ left: 13.2, top: 17.6, width: 31.8 }} />
        <span className="il-fx__icon il-fx__tag" style={{ left: 13.2, top: 89.2 }}>
          <img src={part('imgIcon.svg')} alt="" width={10} height={10} />
        </span>
        <span className="il-fx__label il-fx__tag" style={{ left: 39.1, top: 86.8 }}>Bank</span>
      </div>
    </Stage>
  );
}

export const fxMotion: IllustrationMotion = {
  build(tl, il, at) {
    const [wallet, bank] = all(il, '.il-fx__card');
    tl.fromTo(wallet, { y: 44, opacity: 0, rotation: -5 }, { y: 0, opacity: 1, rotation: -1, duration: 0.9, ease: 'power3.out' }, at);
    tl.fromTo(bank, { y: 44, opacity: 0, rotation: 5 }, { y: 0, opacity: 1, rotation: 1, duration: 0.9, ease: 'power3.out' }, at + 0.15);
    tl.from(one(il, '.il-fx__pill'), { y: -36, opacity: 0, duration: 0.8, ease: 'back.out(2)' }, at + 0.5);
    count(tl, one(il, '[data-count="fee"]'), 3, 0, at + 0.6, 1.0, (n) => (n < 0.05 ? '0%' : `${n.toFixed(1)}%`));
    tl.from(one(il, '.il-fx__fee'), { y: 6, opacity: 0, duration: 0.5, ease: 'power2.out' }, at + 0.95);
    wipe(tl, one(il, '.il-fx__arrows'), at + 1.0, 0.7, 'inset(0 50% 0 50%)');
    pop(tl, all(il, '.il-fx__tag'), at + 1.2, { stagger: 0.1 });
  },
  idle(gsap, il) {
    bob(gsap, one(il, '.il-fx__pill'), 3, 3);
    const [wallet, bank] = all(il, '.il-fx__card');
    bob(gsap, wallet, 3, 4);
    bob(gsap, bank, -3, 4.6, 0.8);
    // The hatching drifts across the cards' faces.
    all(il, '.il-fx__hatch').forEach((h, i) => gsap.fromTo(h, { x: -6 }, { x: 6, duration: 5 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
  },
};
