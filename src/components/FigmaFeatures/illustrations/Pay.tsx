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
    // The scene assembles piece by piece: the ground first, then the phone rises out of the card's
    // foot and tilts upright, its glow warms, the status bar and header settle, and the order
    // form builds field by field — chips pop, boxes land, skeleton bars grow, figures count — and
    // the swap clicks into place last.
    tl.from(one(il, '.il-pay__dots'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-pay__blob'), { opacity: 0, scale: 0.8, duration: 1.4, ease: 'power2.out', transformOrigin: '50% 100%' }, at);
    tl.from(one(il, '.il-phone'), { y: 170, rotationX: 20, rotation: 3, opacity: 0, duration: 1.4, ease: 'power3.out', transformOrigin: '50% 100%', transformPerspective: 900 }, at + 0.1);
    tl.from(all(il, '.il-phone__glow'), { opacity: 0, scale: 0.6, duration: 1.2, stagger: 0.15, ease: 'power2.out', transformOrigin: '50% 50%' }, at + 0.6);
    tl.from(one(il, '.il-phone__island'), { scaleX: 0.3, opacity: 0, duration: 0.5, ease: 'back.out(2)', transformOrigin: '50% 50%' }, at + 0.9);
    tl.from(one(il, '.il-phone__bar'), { y: -10, opacity: 0, duration: 0.5, ease: 'power2.out' }, at + 0.95);
    tl.from(one(il, '.il-phone__head'), { x: -8, opacity: 0, duration: 0.5, ease: 'power2.out' }, at + 1.05);
    const chips = all(il, '.il-phone__chip');
    const boxes = all(il, '.il-pbox');
    pop(tl, chips[0], at + 1.15, { scale: 0.5, rotation: -8, duration: 0.5 });
    tl.from(boxes[0], { scale: 0.92, y: 12, opacity: 0, duration: 0.6, ease: 'back.out(1.6)', transformOrigin: '50% 50%' }, at + 1.25);
    tl.from(all(boxes[0], '.il-pbox__label, .il-pbox__sub'), { y: 4, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, at + 1.4);
    tl.from(all(boxes[0], '.il-pbox__bar'), { scaleX: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', transformOrigin: '0% 50%' }, at + 1.5);
    count(tl, one(il, '[data-count="pay"]'), 0, 320, at + 1.45, 0.8, (n) => String(Math.round(n)));
    pop(tl, chips[1], at + 1.45, { scale: 0.5, rotation: 8, duration: 0.5 });
    tl.from(boxes[1], { scale: 0.92, y: 12, opacity: 0, duration: 0.6, ease: 'back.out(1.6)', transformOrigin: '50% 50%' }, at + 1.55);
    tl.from(all(boxes[1], '.il-pbox__label, .il-pbox__sub'), { y: 4, opacity: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }, at + 1.7);
    tl.from(all(boxes[1], '.il-pbox__bar'), { scaleX: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', transformOrigin: '0% 50%' }, at + 1.8);
    count(tl, one(il, '[data-count="receive"]'), 0, 0.004174, at + 1.75, 1.0, (n) => n.toFixed(6));
    const swap = one(il, '.il-phone__swap');
    pop(tl, swap, at + 1.9, { scale: 0, rotation: -180, duration: 0.7 });
    tl.fromTo(swap, { scale: 1 }, { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, at + 2.7);
  },
  idle(gsap, il) {
    // The phone floats and its glow breathes. Every few seconds the order is re-quoted: the swap
    // presses in and turns over, the phone tips with it, both chips pulse, the skeleton bars
    // shimmer as if reloading, the boxes flash an indigo edge, and USD steps by $10 — up to $400,
    // then back down to $320 — with BTC following at the design's rate, both figures rolling to
    // their new values with an indigo flick.
    const phone = one(il, '.il-phone');
    bob(gsap, phone, 4, 4.2);
    gsap.to(one(il, '.il-pay__blob'), { x: 12, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    all(il, '.il-phone__glow').forEach((g, i) => gsap.to(g, { opacity: 0.7, x: 8 - i * 14, duration: 3.6 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    const chips = all(il, '.il-phone__chip');
    chips.forEach((c, i) => bob(gsap, c, 1.2, 2.6 + i * 0.5, i * 0.7));
    const swap = one(il, '.il-phone__swap');
    const boxes = all(il, '.il-pbox');
    const bars = all(il, '.il-pbox__bar');
    const payEl = one(il, '[data-count="pay"]');
    const receive = one(il, '[data-count="receive"]');
    const RATE = 0.004174 / 320; // BTC per USD, from the design's quote
    let pay = 320;
    let step = 10;
    const refresh = () => {
      if (pay >= 400) step = -10;
      if (pay <= 320) step = 10;
      pay += step;
      gsap
        .timeline()
        .fromTo(swap, { scale: 1 }, { scale: 0.82, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0)
        .to(swap, { rotation: '+=180', duration: 0.7, ease: 'back.out(1.5)', transformOrigin: '50% 50%' }, 0.2)
        .fromTo(phone, { rotation: 0 }, { rotation: step > 0 ? 1.2 : -1.2, duration: 0.35, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 100%' }, 0.15)
        .fromTo(chips, { scale: 1 }, { scale: 1.1, duration: 0.2, stagger: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0.25)
        .fromTo(bars, { opacity: 1 }, { opacity: 0.35, duration: 0.18, stagger: 0.05, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.3)
        .fromTo(boxes, { borderColor: '#dadee2' }, { borderColor: '#4042d1', duration: 0.2, stagger: 0.1 }, 0.35)
        .to(boxes, { borderColor: '#dadee2', duration: 0.9, stagger: 0.1, ease: 'power2.inOut' }, 0.9)
        .add(() => {
          roll(gsap, payEl, String(pay));
          roll(gsap, receive, (pay * RATE).toFixed(6));
          gsap.fromTo([payEl, receive], { color: '#4042d1' }, { color: '#2c2e31', duration: 1.4, ease: 'power1.out', delay: 0.3 });
        }, 0.45);
      gsap.delayedCall(rand(3.6, 5.2), refresh);
    };
    gsap.delayedCall(2, refresh);
  },
};
