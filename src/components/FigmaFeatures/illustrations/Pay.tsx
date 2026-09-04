import { B, Layer, Stage } from './Stage';
import { all, count, one, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

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
            <span className="il-pbox__col il-pbox__col--right" style={{ left: 108, top: 9.62 }}>
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
        <span className="il-phone__island" style={{ left: 98.65, top: 19.5 }} />
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

type G = Parameters<MotionVariant['idle']>[0];
type TL = gsap.core.Timeline;
const RATE = 0.004174 / 320; // BTC per USD, from the design's quote
const AMOUNTS = ['350', '420', '275', '390', '320'];

const parts = (il: HTMLElement) => ({
  phone: one(il, '.il-phone'),
  glare: one(il, '.il-phone__glare'),
  glows: all(il, '.il-phone__glow'),
  bars: all(il, '.il-pbox__bar'),
  boxes: all(il, '.il-pbox'),
  chips: all(il, '.il-phone__chip'),
  swap: one(il, '.il-phone__swap'),
  payEl: one(il, '[data-count="pay"]'),
  receive: one(il, '[data-count="receive"]'),
  caret: one(il, '.il-pbox__caret'),
});
type P = ReturnType<typeof parts>;

/** The screen's glow drifts. */
const ambient = (gsap: G, p: P) => {
  const idle = gsap.timeline();
  p.glows.forEach((g, i) => idle.to(g, { opacity: 0.6, x: i ? -8 : 8, duration: 5 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0));
  return idle;
};
/** The device leans left and right in space, a glare sweeping its glass each way. */
const sway = (idle: TL, gsap: G, p: P, degrees = 7, period = 10) => {
  gsap.set(p.phone, { transformPerspective: 1000, transformOrigin: '50% 58%' });
  idle.fromTo(p.phone, { rotationY: -degrees, rotationX: 0.8 }, { rotationY: degrees, rotationX: -0.8, duration: period, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  idle.fromTo(p.glare, { xPercent: -140, opacity: 0.5 }, { xPercent: 240, duration: period * 0.55, ease: 'sine.inOut', repeat: -1, repeatDelay: period * 0.45 }, 0.4);
  idle.fromTo(p.glare, { xPercent: 240, opacity: 0.5 }, { xPercent: -140, duration: period * 0.55, ease: 'sine.inOut', repeat: -1, repeatDelay: period * 0.45 }, period + 0.4);
  return idle;
};
/** The amount is cleared and typed in digit by digit behind a blinking caret; the BTC quote follows each keystroke. */
const type = (story: TL, gsap: G, p: P, t: number, next: () => string) => {
  let target = '';
  story
    .fromTo(p.boxes[0], { borderColor: '#dadee2' }, { borderColor: '#4042d1', duration: 0.3 }, t)
    .fromTo(p.caret, { opacity: 0 }, { opacity: 1, duration: 0.1, yoyo: true, repeat: 13, repeatDelay: 0.3 }, t)
    .add(() => {
      target = next();
      p.payEl.textContent = '';
      p.receive.textContent = '0.000000';
    }, t + 0.35);
  [0, 1, 2].forEach((di) => {
    story.add(() => {
      const typed = target.slice(0, di + 1);
      p.payEl.textContent = typed;
      p.receive.textContent = (Number(typed) * RATE).toFixed(6);
    }, t + 0.75 + di * 0.3);
  });
  story
    .fromTo(p.receive, { color: '#4042d1' }, { color: '#2c2e31', duration: 1.2, ease: 'power1.out' }, t + 1.65)
    .to(p.boxes[0], { borderColor: '#dadee2', duration: 0.8, ease: 'power2.inOut' }, t + 2.2);
  void gsap;
  return story;
};
const cycle = () => {
  let n = 0;
  return () => AMOUNTS[n++ % AMOUNTS.length];
};

payMotion.variants = [
  {
    name: 'Sway + typing',
    blurb: 'The device leans gently left and right in space with a glare sweeping its glass, while every few seconds an amount is typed in behind a caret and the BTC quote follows each keystroke.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = sway(ambient(gsap, p), gsap, p, 7, 10);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.5 });
      type(story, gsap, p, 0, cycle());
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Lean to type',
    blurb: 'The phone rests flat; as typing starts it leans left as if picked up, holds while the digits go in, then leans right as the quote lands and settles back flat.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, p);
      gsap.set(p.phone, { transformPerspective: 1000, transformOrigin: '50% 58%' });
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.5 });
      story
        .to(p.phone, { rotationY: -8, rotationX: 1, duration: 1.1, ease: 'power2.inOut' }, 0)
        .fromTo(p.glare, { xPercent: -140, opacity: 0.5 }, { xPercent: 240, duration: 1.0, ease: 'power2.inOut' }, 0);
      type(story, gsap, p, 0.6, cycle());
      story
        .to(p.phone, { rotationY: 8, rotationX: -1, duration: 1.4, ease: 'power2.inOut' }, 2.2)
        .fromTo(p.glare, { xPercent: 240, opacity: 0.5 }, { xPercent: -140, duration: 1.1, ease: 'power2.inOut' }, 2.2)
        .to(p.phone, { rotationY: 0, rotationX: 0, duration: 1.2, ease: 'power2.inOut' }, 3.8);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Sway + live quote',
    blurb: 'The sway from the first option, plus a live market: between typings the BTC amount ticks like a price with a faint indigo flick, and the swap turns after every new amount.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = sway(ambient(gsap, p), gsap, p, 7, 10);
      let last = 320;
      let k = 0;
      const nextAmount = cycle();
      const story = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 1.5 });
      type(story, gsap, p, 0, () => {
        const v = nextAmount();
        last = Number(v);
        return v;
      });
      story.to(p.swap, { rotation: '+=180', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 2.0);
      [3.2, 4.6, 6.0].forEach((t) => {
        story.add(() => {
          k += 1;
          p.receive.textContent = (last * RATE * (1 + Math.sin(k * 1.7) * 0.004)).toFixed(6);
        }, t);
        story.fromTo(p.receive, { color: '#4042d1' }, { color: '#2c2e31', duration: 1.0, ease: 'power1.out' }, t + 0.02);
      });
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Sway + flip',
    blurb: 'The sway, with the order alternating: one beat types a new amount, the next presses the swap and flips the pay and receive boxes with their chips so the direction reverses.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = sway(ambient(gsap, p), gsap, p, 6, 11);
      let flipped = false;
      const story = gsap.timeline({ repeat: -1, repeatDelay: 2.8, delay: 1.5 });
      type(story, gsap, p, 0, cycle());
      story
        .fromTo(p.swap, { scale: 1 }, { scale: 0.9, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 3.6)
        .to(p.swap, { rotation: '+=180', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 3.8)
        .add(() => {
          flipped = !flipped;
          const d = flipped ? 1 : 0;
          gsap.to(p.boxes[0], { y: 84.9 * d, duration: 0.7, ease: 'power3.inOut' });
          gsap.to(p.boxes[1], { y: -84.9 * d, duration: 0.7, ease: 'power3.inOut' });
          gsap.to(p.chips[0], { x: 163 * d, y: 84.9 * d, duration: 0.7, ease: 'power3.inOut' });
          gsap.to(p.chips[1], { x: -163 * d, y: -84.9 * d, duration: 0.7, ease: 'power3.inOut' });
        }, 3.85);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Deep sway',
    blurb: 'The most physical: a slightly wider, slower lean with a touch of pitch and a longer glare, the skeleton lines shimmering, and a calmer typing beat with the swap turning after each entry.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = sway(ambient(gsap, p), gsap, p, 9, 12);
      p.bars.forEach((b, i) => idle.to(b, { opacity: 0.45, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: i * 0.22 }, 0));
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 2 });
      type(story, gsap, p, 0, cycle());
      story.to(p.swap, { rotation: '+=180', duration: 0.7, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 2.1);
      idle.add(story, 0);
      return idle;
    },
  },
];
