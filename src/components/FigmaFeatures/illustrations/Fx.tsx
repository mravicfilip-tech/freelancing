import { B, Layer, Stage } from './Stage';
import { all, draw, one, roll, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "Zero FX fees" (Figma 2409:2439, 804×440): a bank card and a wallet card overlapping at the
 * card's foot, over a dot grid. The wallet's address types in and the pair trade places.
 */
export function Fx() {
  return (
    <Stage id="fx" width={804} height={440} className="ff__art ff__art--fx il-fx">
      <span className="il-dots il-fx__dots" style={{ left: 0, top: 229, width: 804, height: 211 }} />

      <div className="il-fx__bank" style={{ left: 98, top: 193 }}>
        <Layer className="il-fx__bankBg" src={B('bank-bg.webp')} x={-13.2} y={-11} w={426.4} h={238} />
        <img className="il-fx__temple" src={B('imgLandmark.svg')} alt="" width={20} height={20} style={{ left: 20, top: 28 }} />
        <span className="il-fx__tag il-fx__tag--bank" style={{ left: 52, top: 21 }}>Bank</span>
        <span className="il-fx__tag il-fx__tag--masked" style={{ left: 20, top: 163 }}>**** - ****</span>
        <span className="il-fx__feeTag" style={{ left: 152, top: 168 }}>FX fee 0.00</span>
      </div>

      <div className="il-fx__wallet" style={{ left: 304, top: 237 }}>
        <Layer className="il-fx__glow" src={B('imgEllipse3471.svg')} x={70} y={-578} w={941} h={941} />
        <Layer className="il-fx__glow il-fx__glow--soft" src={B('imgEllipse3472.svg')} x={157.5} y={-490.5} w={766} h={766} />
        <Layer className="il-fx__lines" src={B('imgVector4.svg')} x={-53.5} y={72.5} w={243} h={279.9} />
        <Layer className="il-fx__mark" src={B('imgGroup1597883989.svg')} x={249} y={19.4} w={138.2} h={71.7} />
        <i className="il-fx__ring" style={{ left: 29, top: 26 }} />
        <i className="il-fx__ring" style={{ left: 29, top: 26 }} />
        <i className="il-fx__ring" style={{ left: 29, top: 26 }} />
        <Layer className="il-fx__logo" src={B('imgLogoDesign.svg')} x={23} y={28} w={32.85} h={16.97} />
        <span className="il-fx__tag il-fx__tag--wallet" style={{ left: 67.85, top: 19 }}>Wallet</span>
        <span className="il-fx__tag il-fx__tag--addr" style={{ left: 23, top: 145 }}>
          <span className="il-fx__addrText">*******************************a23fh27e</span>
          <i className="il-fx__sheen" />
        </span>
      </div>
      {/* Wires from the bank to the wallet: account to address below, Bank tag to Wallet tag above. */}
      <svg className="il-fx__wires" viewBox="0 0 804 440" width={804} height={440} style={{ left: 0, top: 0 }} aria-hidden="true">
        <path className="il-fx__wire" d="M209 373 C 262 373, 286 399, 340 399" />
        <path className="il-fx__wire" d="M215 231 C 300 231, 300 273, 385 273" />
      </svg>
      <span className="il-fx__packet" style={{ left: 0, top: 0 }} />
      <span className="il-fx__packet il-fx__packet--2" style={{ left: 0, top: 0 }} />
    </Stage>
  );
}

export const fxMotion: IllustrationMotion = {
  build(tl, il, at, gsap) {
    // The bank card rises with its artwork settling behind it, the wallet card follows, their
    // labels appear in reading order, the wires draw from the bank to the wallet, and the wallet
    // address reveals itself left to right.
    tl.from(one(il, '.il-fx__dots'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-fx__bank'), { y: 40, opacity: 0, duration: 1.0, ease: EASE }, at);
    tl.from(one(il, '.il-fx__bankBg'), { scale: 1.08, duration: 1.6, ease: 'power2.out', transformOrigin: '50% 50%' }, at);
    tl.from(one(il, '.il-fx__wallet'), { y: 56, opacity: 0, duration: 1.0, ease: EASE }, at + 0.15);
    tl.from(all(il, '.il-fx__temple, .il-fx__tag--bank, .il-fx__tag--masked'), { ...RISE, y: 8, duration: 0.6, stagger: 0.07 }, at + 0.5);
    tl.from(all(il, '.il-fx__lines, .il-fx__mark, .il-fx__glow'), { opacity: 0, duration: 1.0, stagger: 0.1, ease: 'power1.out' }, at + 0.6);
    tl.from(all(il, '.il-fx__logo, .il-fx__tag--wallet, .il-fx__tag--addr'), { ...RISE, y: 8, duration: 0.6, stagger: 0.07 }, at + 0.65);
    draw(tl, gsap, all<SVGGeometryElement>(il, '.il-fx__wire'), at + 0.9, 0.8, 0.12);
    tl.set(all(il, '.il-fx__wire'), { strokeDasharray: '4 5' }, at + 1.85);
    tl.fromTo(one(il, '.il-fx__addrText'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut' }, at + 1.1);
  },
  idle: (gsap, il) => fxMotion.variants[0].idle(gsap, il),
  variants: [],
};

type G = Parameters<MotionVariant['idle']>[0];
type TL = gsap.core.Timeline;
const parts = (il: HTMLElement) => ({
  bank: one(il, '.il-fx__bank'),
  wallet: one(il, '.il-fx__wallet'),
  wires: all<SVGPathElement>(il, '.il-fx__wire'),
  packets: all(il, '.il-fx__packet'),
  sheen: one(il, '.il-fx__sheen'),
  masked: one(il, '.il-fx__tag--masked'),
  bankTag: one(il, '.il-fx__tag--bank'),
  walletTag: one(il, '.il-fx__tag--wallet'),
  addr: one(il, '.il-fx__tag--addr'),
  addrText: one(il, '.il-fx__addrText'),
  fee: one(il, '.il-fx__feeTag'),
  rings: all(il, '.il-fx__ring'),
});
type P = ReturnType<typeof parts>;

const ambient = (gsap: G, il: HTMLElement) => {
  const idle = gsap.timeline();
  idle.to(one(il, '.il-fx__glow'), { opacity: 0.6, x: -24, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  idle.to(one(il, '.il-fx__mark'), { x: -5, duration: 8, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  return idle;
};
/** A packet rides a wire from the bank to the wallet (or back when `reverse`). */
const ride = (story: TL, p: P, wire: number, packet: number, t: number, duration = 1.1, reverse = false) => {
  const el = p.packets[packet];
  story
    .fromTo(el, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.2 }, t)
    .to(el, { motionPath: { path: p.wires[wire], align: p.wires[wire], alignOrigin: [0.5, 0.5], start: reverse ? 1 : 0, end: reverse ? 0 : 1 }, duration, ease: 'power2.inOut' }, t)
    .to(el, { opacity: 0, scale: 0.5, duration: 0.2 }, t + duration - 0.1);
  return story;
};
/** The wire's dashes flow in the direction of travel for a while. */
const flow = (story: TL, wire: SVGPathElement, t: number, duration: number, reverse = false) =>
  story.fromTo(wire, { strokeDashoffset: 0 }, { strokeDashoffset: reverse ? 36 : -36, duration, ease: 'none' }, t);
/** A tag brightens for a moment. */
const light = (story: TL, tag: HTMLElement, t: number, from: string, to: string) =>
  story.fromTo(tag, { backgroundColor: from }, { backgroundColor: to, duration: 0.25, ease: 'power2.out' }, t).to(tag, { backgroundColor: from, duration: 0.7, ease: 'power2.inOut' }, t + 0.6);
const WHITE = '#ffffff';
const WHITE_LIT = '#e6e5ff';
const DIM = 'rgba(255,255,255,0.24)';
const DIM_LIT = 'rgba(255,255,255,0.6)';
const WALLET = 'rgba(255,255,255,0.12)';
const WALLET_LIT = 'rgba(179,181,245,0.55)';

fxMotion.variants = [
  {
    name: 'Wire transfer',
    blurb: 'The bank account shows its digits and sends: a packet rides the lower wire from the account into the wallet address, the dashes flowing with it, and the address signs with a sheen as it arrives.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.6 });
      story.add(() => roll(gsap, p.masked, '**** - 4417'), 0);
      light(story, p.masked, 0, DIM, DIM_LIT);
      flow(story, p.wires[0], 0.4, 1.4);
      ride(story, p, 0, 0, 0.5, 1.1);
      light(story, p.addr, 1.5, 'rgba(255,255,255,0.06)', 'rgba(179,181,245,0.35)');
      story.fromTo(p.sheen, { xPercent: -120, opacity: 1 }, { xPercent: 420, duration: 0.9, ease: 'power2.inOut' }, 1.55);
      story.add(() => roll(gsap, p.masked, '**** - ****'), 3.0);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Two-way',
    blurb: 'A transfer and its confirmation: a packet goes bank to wallet on the upper wire between the two tags, then a receipt packet returns on the lower wire and the account chip lights as it lands.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.6 });
      light(story, p.bankTag, 0, WHITE, WHITE_LIT);
      flow(story, p.wires[1], 0.2, 1.3);
      ride(story, p, 1, 0, 0.3, 1.1);
      light(story, p.walletTag, 1.3, WALLET, WALLET_LIT);
      story.fromTo(p.sheen, { xPercent: -120, opacity: 1 }, { xPercent: 420, duration: 0.9, ease: 'power2.inOut' }, 1.4);
      flow(story, p.wires[0], 2.2, 1.3, true);
      ride(story, p, 0, 1, 2.3, 1.1, true);
      story.add(() => roll(gsap, p.masked, '**** - 4417'), 3.3);
      light(story, p.masked, 3.3, DIM, DIM_LIT);
      story.add(() => roll(gsap, p.masked, '**** - ****'), 5.2);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Stream',
    blurb: 'Both wires carry a steady flow of dashes between the cards, packets pass every couple of seconds on alternating wires, and a small "FX fee 0.00" tag rises from the account after each one.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      p.wires.forEach((w) => idle.to(w, { strokeDashoffset: -18, duration: 1.4, ease: 'none', repeat: -1 }, 0));
      const story = gsap.timeline({ repeat: -1, repeatDelay: 1.4, delay: 1.6 });
      ride(story, p, 0, 0, 0, 1.0);
      story.fromTo(p.fee, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: EASE }, 1.0).to(p.fee, { y: -6, opacity: 0, duration: 0.45, ease: 'power2.in' }, 2.4);
      ride(story, p, 1, 1, 2.2, 1.0);
      story.fromTo(p.sheen, { xPercent: -120, opacity: 1 }, { xPercent: 420, duration: 0.9, ease: 'power2.inOut' }, 3.1);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Handshake',
    blurb: 'The two cards lean toward each other as the wires draw between them, the Bank and Wallet tags light in sequence, the account shows its digits, a packet crosses, and the cards ease apart again.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.6 });
      story
        .to(p.bank, { x: 8, duration: 0.8, ease: 'power3.inOut' }, 0)
        .to(p.wallet, { x: -8, duration: 0.8, ease: 'power3.inOut' }, 0);
      light(story, p.bankTag, 0.5, WHITE, WHITE_LIT);
      light(story, p.walletTag, 0.8, WALLET, WALLET_LIT);
      story.add(() => roll(gsap, p.masked, '**** - 4417'), 1.0);
      p.wires.forEach((w, i) => flow(story, w, 1.0 + i * 0.15, 1.3));
      ride(story, p, 0, 0, 1.1, 1.1);
      ride(story, p, 1, 1, 1.25, 1.1);
      story.fromTo(p.sheen, { xPercent: -120, opacity: 1 }, { xPercent: 420, duration: 0.9, ease: 'power2.inOut' }, 2.2);
      story
        .add(() => roll(gsap, p.masked, '**** - ****'), 3.4)
        .to(p.bank, { x: 0, duration: 0.9, ease: 'power3.inOut' }, 3.4)
        .to(p.wallet, { x: 0, duration: 0.9, ease: 'power3.inOut' }, 3.4);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Sync rings + wire',
    blurb: 'A contactless feel: rings radiate from the wallet\'s logo, and as they reach the bank a packet answers back along the wire into the wallet address, the address re-hashing as it signs.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      let k = 0;
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.8 });
      p.rings.forEach((r, i) => story.fromTo(r, { scale: 1, opacity: 0.5 }, { scale: 9, opacity: 0, duration: 1.6, ease: 'power2.out', transformOrigin: '50% 50%' }, i * 0.35));
      light(story, p.bankTag, 1.2, WHITE, WHITE_LIT);
      story.add(() => roll(gsap, p.masked, '**** - 4417'), 1.25);
      flow(story, p.wires[0], 1.6, 1.3);
      ride(story, p, 0, 0, 1.7, 1.1);
      story.add(() => {
        k += 1;
        const tail = ((0x9f3c27e + k * 0x1a2b3) % 0xfffffff).toString(16).padStart(7, '0');
        roll(gsap, p.addrText, `*******************************a${tail}`);
      }, 2.8);
      story.add(() => roll(gsap, p.masked, '**** - ****'), 3.6);
      idle.add(story, 0);
      return idle;
    },
  },
];
