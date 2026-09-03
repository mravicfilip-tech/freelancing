import { Layer, Stage, part } from './Stage';
import { all, bob, count, one, pop, rand, roll, wipe, type IllustrationMotion } from './motion';

/** "Pay Remittix" (Figma 2361:2281, 562×188): two currency pills over a pay/receive pair, joined by connectors and a swap. */
export function Pay() {
  return (
    <Stage id="pay" width={562} height={188} className="ff__art ff__art--pay il-pay">
      <Layer className="il-pay__lines" src="imgFrame2085662048.svg" x={144.3} y={26.3} w={273.3} h={95.3} />
      <div className="il-pill il-pay__pill" style={{ left: 31.5, top: 11 }}>
        <span className="il-pill__coin">
          <img src={part('imgGroup.svg')} alt="" width={32} height={32} />
          <img className="il-pay__flag" src={part('imgVector.png')} alt="" width={12} height={12} />
        </span>
        <span className="il-pill__text">USD</span>
        <img className="il-pill__chev" src={part('img16.svg')} alt="" />
      </div>
      <div className="il-box il-pay__box" style={{ left: 31.5, top: 57 }}>
        <span className="il-box__label">Pay</span>
        <span className="il-box__amount">
          <b className="il-count" data-count="pay">320</b>
          <i>.00</i>
        </span>
        <span className="il-box__sub">Sell from USD Account</span>
      </div>
      <div className="il-pill il-pay__pill" style={{ left: 418.5, top: 11 }}>
        <span className="il-pill__coin">
          <img src={part('imgFrame2085662025.svg')} alt="" width={32} height={32} />
        </span>
        <span className="il-pill__text">BTC</span>
        <img className="il-pill__chev" src={part('img16.svg')} alt="" />
      </div>
      <div className="il-box il-pay__box" style={{ left: 310.5, top: 57 }}>
        <span className="il-box__label">Receive</span>
        <span className="il-box__amount">
          <b className="il-count" data-count="receive">0.004174</b>
          <i>.00</i>
        </span>
        <span className="il-box__sub">Buy into BTC Account</span>
      </div>
      <div className="il-swap il-pay__swap" style={{ left: 267, top: 63 }}>
        <img src={part('imgUilExchange.svg')} alt="" width={14} height={14} />
      </div>
    </Stage>
  );
}

export const payMotion: IllustrationMotion = {
  build(tl, il, at) {
    const pills = all(il, '.il-pay__pill');
    pop(tl, pills[0], at);
    pop(tl, pills[1], at + 0.12);
    wipe(tl, one(il, '.il-pay__lines'), at + 0.25, 0.8, 'inset(0 100% 0 0)');
    tl.from(all(il, '.il-pay__box'), { y: 18, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' }, at + 0.45);
    pop(tl, one(il, '.il-pay__swap'), at + 0.75, { scale: 0, rotation: -180, duration: 0.7 });
    count(tl, one(il, '[data-count="pay"]'), 0, 320, at + 0.7, 0.9, (n) => String(Math.round(n)));
    count(tl, one(il, '[data-count="receive"]'), 0, 0.004174, at + 0.7, 1.1, (n) => n.toFixed(6));
  },
  idle(gsap, il) {
    // Every few seconds the swap turns over and the order is re-quoted: the USD amount steps by
    // $10 — up to $400, then back down to $320 — and the BTC amount follows at the design's rate,
    // both rolling to their new figures and flicking indigo as they land. The pills breathe.
    const swap = one(il, '.il-pay__swap');
    const payEl = one(il, '[data-count="pay"]');
    const receive = one(il, '[data-count="receive"]');
    const RATE = 0.004174 / 320; // BTC per USD, from the design's quote
    let pay = 320;
    let step = 10;
    const refresh = () => {
      gsap.to(swap, { rotation: '+=180', duration: 0.7, ease: 'back.out(1.5)' });
      if (pay >= 400) step = -10;
      if (pay <= 320) step = 10;
      pay += step;
      gsap.delayedCall(0.25, () => {
        roll(gsap, payEl, String(pay));
        roll(gsap, receive, (pay * RATE).toFixed(6));
        gsap.fromTo([payEl, receive], { color: '#4042d2' }, { color: '#2c2e31', duration: 1.4, ease: 'power1.out', delay: 0.3 });
      });
      gsap.delayedCall(rand(3.6, 5.2), refresh);
    };
    gsap.delayedCall(2, refresh);
    all(il, '.il-pay__pill').forEach((p, i) => bob(gsap, p, 2.5, 2.8 + i * 0.4, i * 0.6));
  },
};
