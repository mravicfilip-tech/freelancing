import { B, Layer, Stage } from './Stage';
import { all, one, roll, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

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
      <span className="il-fx__packet" style={{ left: 340, top: 400 }} />
    </Stage>
  );
}

export const fxMotion: IllustrationMotion = {
  build(tl, il, at) {
    // The bank card rises with its artwork settling behind it, the wallet card follows, their
    // labels appear in reading order, and the wallet address reveals itself left to right.
    tl.from(one(il, '.il-fx__dots'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-fx__bank'), { y: 40, opacity: 0, duration: 1.0, ease: EASE }, at);
    tl.from(one(il, '.il-fx__bankBg'), { scale: 1.08, duration: 1.6, ease: 'power2.out', transformOrigin: '50% 50%' }, at);
    tl.from(one(il, '.il-fx__wallet'), { y: 56, opacity: 0, duration: 1.0, ease: EASE }, at + 0.15);
    tl.from(all(il, '.il-fx__temple, .il-fx__tag--bank, .il-fx__tag--masked'), { ...RISE, y: 8, duration: 0.6, stagger: 0.07 }, at + 0.5);
    tl.from(all(il, '.il-fx__lines, .il-fx__mark, .il-fx__glow'), { opacity: 0, duration: 1.0, stagger: 0.1, ease: 'power1.out' }, at + 0.6);
    tl.from(all(il, '.il-fx__logo, .il-fx__tag--wallet, .il-fx__tag--addr'), { ...RISE, y: 8, duration: 0.6, stagger: 0.07 }, at + 0.65);
    tl.fromTo(one(il, '.il-fx__addrText'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power2.inOut' }, at + 0.95);
  },
  idle: (gsap, il) => fxMotion.variants[0].idle(gsap, il),
  variants: [],
};

const ambient = (gsap: Parameters<MotionVariant['idle']>[0], il: HTMLElement) => {
  const idle = gsap.timeline();
  idle.to(one(il, '.il-fx__glow'), { opacity: 0.6, x: -24, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  idle.to(one(il, '.il-fx__mark'), { x: -5, duration: 8, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  return idle;
};

fxMotion.variants = [
  {
    name: 'Packet',
    blurb: 'A sheen signs the wallet address, a packet lifts off it and arcs to the bank, and the masked account reveals its last four digits before masking again.',
    idle(gsap, il) {
      const sheen = one(il, '.il-fx__sheen');
      const masked = one(il, '.il-fx__tag--masked');
      const packet = one(il, '.il-fx__packet');
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 1.6 });
      story
        .fromTo(sheen, { xPercent: -120, opacity: 1 }, { xPercent: 420, duration: 1.0, ease: 'power2.inOut' }, 0)
        .fromTo(packet, { x: 0, y: 0, opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.6)
        .to(packet, { motionPath: { path: [{ x: 0, y: 0 }, { x: -90, y: -64 }, { x: -180, y: -28 }], curviness: 1.3 }, duration: 1.0, ease: 'power2.inOut' }, 0.8)
        .to(packet, { opacity: 0, scale: 0.6, duration: 0.25, ease: 'power2.in' }, 1.7)
        .add(() => roll(gsap, masked, '**** - 4417'), 1.75)
        .fromTo(masked, { backgroundColor: 'rgba(255,255,255,0.24)' }, { backgroundColor: 'rgba(255,255,255,0.55)', duration: 0.3, ease: 'power2.out' }, 1.75)
        .to(masked, { backgroundColor: 'rgba(255,255,255,0.24)', duration: 0.8, ease: 'power2.inOut' }, 3.4)
        .add(() => roll(gsap, masked, '**** - ****'), 3.6);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Card stack',
    blurb: 'The two cards trade depth like a wallet stack: the bank card comes forward as the wallet eases back, holds, then they swap again.',
    idle(gsap, il) {
      const bank = one(il, '.il-fx__bank');
      const wallet = one(il, '.il-fx__wallet');
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 2 });
      story
        .to(wallet, { scale: 0.96, y: 6, opacity: 0.85, duration: 0.7, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 0)
        .to(bank, { scale: 1.03, y: -4, zIndex: 2, duration: 0.7, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 0)
        .to(wallet, { scale: 1, y: 0, opacity: 1, duration: 0.7, ease: 'power3.inOut' }, 3.4)
        .to(bank, { scale: 1, y: 0, zIndex: 0, duration: 0.7, ease: 'power3.inOut' }, 3.4);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Fee receipt',
    blurb: 'After the address signs, a small "FX fee 0.00" tag rises out of the bank\'s account line and holds while the account shows its digits, then both fade back.',
    idle(gsap, il) {
      const sheen = one(il, '.il-fx__sheen');
      const masked = one(il, '.il-fx__tag--masked');
      const fee = one(il, '.il-fx__feeTag');
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4, delay: 1.6 });
      story
        .fromTo(sheen, { xPercent: -120, opacity: 1 }, { xPercent: 420, duration: 1.0, ease: 'power2.inOut' }, 0)
        .add(() => roll(gsap, masked, '**** - 4417'), 1.0)
        .fromTo(fee, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: EASE }, 1.2)
        .to(fee, { y: -6, opacity: 0, duration: 0.5, ease: 'power2.in' }, 3.6)
        .add(() => roll(gsap, masked, '**** - ****'), 3.7);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Sync rings',
    blurb: 'Rings radiate from the wallet\'s logo like a contactless tap; when they reach the bank its Bank tag brightens and the account shows its digits.',
    idle(gsap, il) {
      const rings = all(il, '.il-fx__ring');
      const masked = one(il, '.il-fx__tag--masked');
      const bankTag = one(il, '.il-fx__tag--bank');
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.8 });
      rings.forEach((r, i) => story.fromTo(r, { scale: 1, opacity: 0.5 }, { scale: 9, opacity: 0, duration: 1.6, ease: 'power2.out', transformOrigin: '50% 50%' }, i * 0.35));
      story
        .fromTo(bankTag, { backgroundColor: '#ffffff' }, { backgroundColor: '#e8e6ff', duration: 0.3 }, 1.2)
        .to(bankTag, { backgroundColor: '#ffffff', duration: 0.8, ease: 'power2.inOut' }, 2.8)
        .add(() => roll(gsap, masked, '**** - 4417'), 1.25)
        .add(() => roll(gsap, masked, '**** - ****'), 3.4);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Ambient hash',
    blurb: 'The cards rest; the bank\'s artwork and the wallet\'s outline mark drift very slowly, and the address\'s last characters re-hash every few seconds.',
    idle(gsap, il) {
      const addr = one(il, '.il-fx__addrText');
      const idle = ambient(gsap, il);
      idle.to(one(il, '.il-fx__bankBg'), { x: -6, y: 4, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
      let k = 0;
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 2 });
      story.add(() => {
        k += 1;
        const tail = ((0x9f3c27e + k * 0x1a2b3) % 0xfffffff).toString(16).padStart(7, '0');
        roll(gsap, addr, `*******************************a${tail}`);
      }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
];
