import { B, Layer, Stage } from './Stage';
import { all, count, one, roll, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

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
                <i className="il-pbox__caret" />
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
          <span className="il-phone__glare" />
        </div>
        <Layer className="il-phone__island" src={B('exIsland@2x.png')} x={98.65} y={19.5} w={80} h={23} />
      </div>
    </Stage>
  );
}

export const payMotion: IllustrationMotion = {
  build(tl, il, at) {
    // The phone rises into place; its screen fills in top to bottom, one element after another,
    // and the two figures count to their quote.
    tl.from(all(il, '.il-pay__dots, .il-pay__blob'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-phone'), { y: 48, opacity: 0, duration: 1.1, ease: EASE }, at);
    tl.from(all(il, '.il-phone__glow'), { opacity: 0, duration: 1.0, stagger: 0.1, ease: 'power1.out' }, at + 0.4);
    tl.from(one(il, '.il-phone__island'), { opacity: 0, duration: 0.4 }, at + 0.35);
    const chips = all(il, '.il-phone__chip');
    const boxes = all(il, '.il-pbox');
    const order = [one(il, '.il-phone__bar'), one(il, '.il-phone__head'), chips[0], boxes[0], one(il, '.il-phone__swap'), chips[1], boxes[1]];
    tl.from(order, { ...RISE, stagger: 0.07 }, at + 0.45);
    tl.from(all(il, '.il-pbox__bar'), { scaleX: 0, duration: 0.6, stagger: 0.04, ease: EASE, transformOrigin: '0% 50%' }, at + 0.7);
    count(tl, one(il, '[data-count="pay"]'), 0, 320, at + 0.75, 0.9, (n) => String(Math.round(n)));
    count(tl, one(il, '[data-count="receive"]'), 0, 0.004174, at + 0.9, 1.0, (n) => n.toFixed(6));
  },
  idle: (gsap, il) => payMotion.variants[0].idle(gsap, il),
  variants: [],
};

const RATE = 0.004174 / 320; // BTC per USD, from the design's quote
const ambient = (gsap: Parameters<MotionVariant['idle']>[0], il: HTMLElement) => {
  const idle = gsap.timeline();
  all(il, '.il-phone__glow').forEach((g, i) => idle.to(g, { opacity: 0.6, x: i ? -8 : 8, duration: 5 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0));
  return idle;
};

payMotion.variants = [
  {
    name: 'Re-quote',
    blurb: 'Every few seconds the swap turns, the USD amount steps by $10 and the BTC amount follows at the rate, the receive box tinting indigo as the figures settle.',
    idle(gsap, il) {
      const swap = one(il, '.il-phone__swap');
      const boxes = all(il, '.il-pbox');
      const payEl = one(il, '[data-count="pay"]');
      const receive = one(il, '[data-count="receive"]');
      let pay = 320;
      let step = 10;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.2, delay: 2 });
      story
        .to(swap, { rotation: '+=180', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 0)
        .add(() => {
          if (pay >= 400) step = -10;
          if (pay <= 320) step = 10;
          pay += step;
          roll(gsap, payEl, String(pay));
        }, 0.15)
        .add(() => roll(gsap, receive, (pay * RATE).toFixed(6)), 0.4)
        .fromTo(boxes[1], { borderColor: '#dadee2' }, { borderColor: '#4042d1', duration: 0.3, ease: 'power2.out' }, 0.4)
        .to(boxes[1], { borderColor: '#dadee2', duration: 0.9, ease: 'power2.inOut' }, 1.1)
        .fromTo([payEl, receive], { color: '#4042d1' }, { color: '#2c2e31', duration: 1.2, ease: 'power1.out' }, 0.8);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Typing',
    blurb: 'The amount is cleared and typed in digit by digit behind a blinking caret, and the BTC quote updates live with each keystroke.',
    idle(gsap, il) {
      const payEl = one(il, '[data-count="pay"]');
      const receive = one(il, '[data-count="receive"]');
      const caret = one(il, '.il-pbox__caret');
      const boxes = all(il, '.il-pbox');
      const targets = ['350', '420', '275', '320'];
      let n = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 2 });
      story
        .fromTo(boxes[0], { borderColor: '#dadee2' }, { borderColor: '#4042d1', duration: 0.3 }, 0)
        .fromTo(caret, { opacity: 0 }, { opacity: 1, duration: 0.12, yoyo: true, repeat: 15, repeatDelay: 0.32 }, 0)
        .add(() => {
          payEl.textContent = '';
          receive.textContent = '0.000000';
        }, 0.3);
      targets.forEach((t, ti) => {
        // Each target is typed one digit at a time; the variants cycle through the list.
        t.split('').forEach((_, di) => {
          story.add(() => {
            if (ti !== n % targets.length) return;
            const typed = t.slice(0, di + 1);
            payEl.textContent = typed;
            receive.textContent = (Number(typed) * RATE).toFixed(6);
          }, 0.7 + di * 0.28);
        });
      });
      story
        .add(() => {
          n += 1;
        }, 1.8)
        .to(boxes[0], { borderColor: '#dadee2', duration: 0.8, ease: 'power2.inOut' }, 2.4)
        .fromTo(receive, { color: '#4042d1' }, { color: '#2c2e31', duration: 1.2, ease: 'power1.out' }, 1.8);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Live rate',
    blurb: 'The BTC amount ticks like a live price every couple of seconds, its last digits changing with a faint indigo flick; the swap turns once a cycle.',
    idle(gsap, il) {
      const receive = one(il, '[data-count="receive"]');
      const swap = one(il, '.il-phone__swap');
      let base = 0.004174;
      let k = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 1.5 });
      [0, 1.9, 3.8].forEach((t) => {
        story.add(() => {
          k += 1;
          base = 0.004174 + Math.sin(k * 1.7) * 0.000021 + Math.sin(k * 0.6) * 0.000009;
          receive.textContent = base.toFixed(6);
        }, t);
        story.fromTo(receive, { color: '#4042d1' }, { color: '#2c2e31', duration: 1.1, ease: 'power1.out' }, t + 0.02);
      });
      story.to(swap, { rotation: '+=180', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 5.6);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Flip direction',
    blurb: 'The swap is pressed and the order reverses: the pay and receive boxes trade places with their currency chips, so the app sells BTC instead of buying it.',
    idle(gsap, il) {
      const swap = one(il, '.il-phone__swap');
      const chips = all(il, '.il-phone__chip');
      const boxes = all(il, '.il-pbox');
      let flipped = false;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 2.2 });
      story
        .fromTo(swap, { scale: 1 }, { scale: 0.9, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0)
        .to(swap, { rotation: '+=180', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 0.2)
        .add(() => {
          flipped = !flipped;
          const d = flipped ? 1 : 0;
          gsap.to(boxes[0], { y: 84.9 * d, duration: 0.7, ease: 'power3.inOut' });
          gsap.to(boxes[1], { y: -84.9 * d, duration: 0.7, ease: 'power3.inOut' });
          gsap.to(chips[0], { x: 163 * d, y: 84.9 * d, duration: 0.7, ease: 'power3.inOut' });
          gsap.to(chips[1], { x: -163 * d, y: -84.9 * d, duration: 0.7, ease: 'power3.inOut' });
        }, 0.25);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Ambient device',
    blurb: 'Nothing on the screen changes. The phone turns a few degrees in space while a glare sweeps its glass, and the skeleton lines shimmer very slowly.',
    idle(gsap, il) {
      const phone = one(il, '.il-phone');
      const glare = one(il, '.il-phone__glare');
      const bars = all(il, '.il-pbox__bar');
      const idle = ambient(gsap, il);
      gsap.set(phone, { transformPerspective: 1100, transformOrigin: '50% 60%' });
      idle.to(phone, { rotationY: 7, rotationX: -2, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
      idle.fromTo(glare, { xPercent: -140, opacity: 0.55 }, { xPercent: 240, duration: 2.2, ease: 'power2.inOut', repeat: -1, repeatDelay: 4.4 }, 1);
      bars.forEach((b, i) => idle.to(b, { opacity: 0.45, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.25 }, 0));
      return idle;
    },
  },
];
