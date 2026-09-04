import { B, Layer, Stage } from './Stage';
import { all, bob, count, one, pop, rand, roll, type IllustrationMotion } from './motion';

/**
 * "Pay Remittix" (Figma 2409:2427, 622×440): the app on a phone, rising out of the card's bottom
 * edge over a soft blob and a dot grid. The screen is live: the pay and receive figures roll.
 */
export function Pay() {
  return (
    <Stage id="pay" width={622} height={440} className="ff__art ff__art--pay il-pay">
      <span className="il-dots il-pay__dots" style={{ left: 0, top: 145, width: 622, height: 295 }} />
      <Layer className="il-pay__blob" src={B('pay-blob.webp')} x={0} y={158} w={622} h={282} />

      <div className="il-phone" style={{ left: 175.4, top: 150.6 }}>
        <Layer className="il-phone__frame" src={B('phone.webp')} x={0} y={0} w={277.3} h={562} />
        <div className="il-phone__screen" style={{ left: 14.1, top: 11.4 }}>
          <Layer className="il-phone__glow" src={B('imgEllipse3469.svg')} x={-78.4} y={-343.6} w={532.6} h={532.6} />
          <Layer className="il-phone__glow" src={B('imgEllipse3470.svg')} x={-82.9} y={-394.5} w={450.5} h={482.2} />
          <Layer className="il-phone__bar" src={B('exStatusBar.svg')} x={0} y={0} w={249} h={30} />
          <Layer className="il-phone__head" src={B('exAppHeader.svg')} x={11.6} y={50.9} w={225} h={18} />

          <Layer className="il-phone__chip" src={B('exUsdChip.svg')} x={11.3} y={90} w={64} h={22} />
          <div className="il-pbox" style={{ left: 11.3, top: 117.6 }}>
            <span className="il-pbox__col" style={{ left: 9.06, top: 9.62 }}>
              <span className="il-pbox__label">Pay</span>
              <span className="il-pbox__amount">
                <b className="il-count" data-count="pay">320</b>
                <i>.00</i>
              </span>
              <span className="il-pbox__sub">Sell from USD Account</span>
            </span>
            <span className="il-pbox__bar" style={{ left: 123.4, top: 19.8, width: 91.1, height: 6.2 }} />
            <span className="il-pbox__bar" style={{ left: 123.4, top: 32.3, width: 70.7 }} />
            <span className="il-pbox__bar" style={{ left: 123.4, top: 43.6, width: 43.6 }} />
          </div>

          <Layer className="il-phone__chip" src={B('exBtcChip.svg')} x={174.3} y={174.9} w={64} h={22} />
          <div className="il-pbox" style={{ left: 11.3, top: 202.5 }}>
            <span className="il-pbox__col" style={{ left: 116.6, top: 9.62 }}>
              <span className="il-pbox__label">Receive</span>
              <span className="il-pbox__amount">
                <b className="il-count" data-count="receive">0.004174</b>
                <i>.00</i>
              </span>
              <span className="il-pbox__sub">Buy into BTC Account</span>
            </span>
            <span className="il-pbox__bar" style={{ left: 10.75, top: 19.8, width: 91.1, height: 6.2 }} />
            <span className="il-pbox__bar" style={{ left: 10.75, top: 32.3, width: 70.7 }} />
            <span className="il-pbox__bar" style={{ left: 10.75, top: 43.6, width: 43.6 }} />
          </div>

          <Layer className="il-phone__swap" src={B('exExchangeBtn.svg')} x={99.3} y={168.1} w={38} h={38} />
        </div>
        <Layer className="il-phone__island" src={B('exIsland@2x.png')} x={98.65} y={19.5} w={80} h={23} />
      </div>
    </Stage>
  );
}

export const payMotion: IllustrationMotion = {
  build(tl, il, at) {
    tl.from(one(il, '.il-pay__dots'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-pay__blob'), { opacity: 0, scale: 0.8, duration: 1.4, ease: 'power2.out', transformOrigin: '50% 100%' }, at);
    // The phone rises out of the card's bottom edge and settles upright.
    tl.from(one(il, '.il-phone'), { y: 140, rotation: 4, opacity: 0, duration: 1.3, ease: 'power3.out', transformOrigin: '50% 100%' }, at + 0.1);
    tl.from(all(il, '.il-phone__bar, .il-phone__head'), { opacity: 0, y: -6, duration: 0.6, stagger: 0.1, ease: 'power2.out' }, at + 0.7);
    pop(tl, all(il, '.il-phone__chip'), at + 0.85, { scale: 0.6, stagger: 0.12 });
    tl.from(all(il, '.il-pbox'), { y: 16, opacity: 0, duration: 0.7, stagger: 0.14, ease: 'power3.out' }, at + 0.95);
    pop(tl, one(il, '.il-phone__swap'), at + 1.3, { scale: 0, rotation: -180, duration: 0.7 });
    count(tl, one(il, '[data-count="pay"]'), 0, 320, at + 1.1, 0.9, (n) => String(Math.round(n)));
    count(tl, one(il, '[data-count="receive"]'), 0, 0.004174, at + 1.2, 1.1, (n) => n.toFixed(6));
  },
  idle(gsap, il) {
    // The phone floats and its glow breathes. Every few seconds the swap turns and the order is
    // re-quoted: USD steps by $10 — up to $400, then back down to $320 — BTC follows at the
    // design's rate, and both figures roll to their new values with an indigo flick.
    bob(gsap, one(il, '.il-phone'), 4, 4.2);
    gsap.to(one(il, '.il-pay__blob'), { x: 12, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    all(il, '.il-phone__glow').forEach((g, i) => gsap.to(g, { opacity: 0.7, x: 8 - i * 14, duration: 3.6 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    all(il, '.il-phone__chip').forEach((c, i) => bob(gsap, c, 1.2, 2.6 + i * 0.5, i * 0.7));
    const swap = one(il, '.il-phone__swap');
    const payEl = one(il, '[data-count="pay"]');
    const receive = one(il, '[data-count="receive"]');
    const RATE = 0.004174 / 320; // BTC per USD, from the design's quote
    let pay = 320;
    let step = 10;
    const refresh = () => {
      gsap.to(swap, { rotation: '+=180', duration: 0.7, ease: 'back.out(1.5)', transformOrigin: '50% 50%' });
      if (pay >= 400) step = -10;
      if (pay <= 320) step = 10;
      pay += step;
      gsap.delayedCall(0.25, () => {
        roll(gsap, payEl, String(pay));
        roll(gsap, receive, (pay * RATE).toFixed(6));
        gsap.fromTo([payEl, receive], { color: '#4042d1' }, { color: '#2c2e31', duration: 1.4, ease: 'power1.out', delay: 0.3 });
      });
      gsap.delayedCall(rand(3.6, 5.2), refresh);
    };
    gsap.delayedCall(2, refresh);
  },
};
