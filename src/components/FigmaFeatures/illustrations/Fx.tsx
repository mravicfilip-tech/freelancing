import { B, Layer, Stage } from './Stage';
import { all, bob, one, pop, rand, roll, type IllustrationMotion } from './motion';

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
      </div>

      <div className="il-fx__wallet" style={{ left: 304, top: 237 }}>
        <Layer className="il-fx__glow" src={B('imgEllipse3471.svg')} x={70} y={-578} w={941} h={941} />
        <Layer className="il-fx__glow il-fx__glow--soft" src={B('imgEllipse3472.svg')} x={157.5} y={-490.5} w={766} h={766} />
        <Layer className="il-fx__lines" src={B('imgVector4.svg')} x={-53.5} y={72.5} w={243} h={279.9} />
        <Layer className="il-fx__mark" src={B('imgGroup1597883989.svg')} x={249} y={19.4} w={138.2} h={71.7} />
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
    // The bank card sweeps in from the left with its artwork settling behind it, its icon and tags
    // pop on; the wallet card comes up from the right, its glow, traces and outline mark fade in
    // around the logo, and the address types itself in character by character.
    tl.from(one(il, '.il-fx__dots'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-fx__bank'), { x: -90, y: 40, rotation: -4, opacity: 0, duration: 1.1, ease: 'power3.out', transformOrigin: '0% 100%' }, at);
    tl.from(one(il, '.il-fx__bankBg'), { scale: 1.15, duration: 1.8, ease: 'power2.out', transformOrigin: '50% 50%' }, at);
    pop(tl, one(il, '.il-fx__temple'), at + 0.5, { scale: 0.4, rotation: -20, duration: 0.5 });
    pop(tl, one(il, '.il-fx__tag--bank'), at + 0.6, { scale: 0.6, rotation: -6, transformOrigin: '0% 50%' });
    pop(tl, one(il, '.il-fx__tag--masked'), at + 0.85, { scale: 0.7, transformOrigin: '0% 50%' });
    tl.from(one(il, '.il-fx__wallet'), { x: 90, y: 70, rotation: 4, opacity: 0, duration: 1.1, ease: 'power3.out', transformOrigin: '100% 100%' }, at + 0.25);
    tl.from(all(il, '.il-fx__glow'), { opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power1.out' }, at + 0.6);
    tl.from(one(il, '.il-fx__lines'), { opacity: 0, y: 24, duration: 1.0, ease: 'power2.out' }, at + 0.7);
    tl.from(one(il, '.il-fx__mark'), { opacity: 0, rotation: -6, scale: 0.9, duration: 1.0, ease: 'power2.out', transformOrigin: '50% 50%' }, at + 0.8);
    pop(tl, one(il, '.il-fx__logo'), at + 0.75, { scale: 0.4, rotation: -30, duration: 0.6 });
    pop(tl, one(il, '.il-fx__tag--wallet'), at + 0.85, { scale: 0.6, rotation: 6, transformOrigin: '0% 50%' });
    tl.from(one(il, '.il-fx__tag--addr'), { opacity: 0, y: 8, duration: 0.4, ease: 'power2.out' }, at + 1.05);
    tl.fromTo(one(il, '.il-fx__addrText'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'steps(38)' }, at + 1.1);
  },
  idle(gsap, il) {
    // Both cards float out of phase, the wallet's glow breathes and the outline mark drifts.
    // Every few seconds a transfer plays out: a sheen sweeps the wallet address, a packet lifts
    // off it and arcs over to the bank, the bank card comes forward as it lands, its masked
    // account lights up lavender and shows its last four digits, then masks again.
    const bank = one(il, '.il-fx__bank');
    const wallet = one(il, '.il-fx__wallet');
    bob(gsap, bank, 4, 4.2);
    bob(gsap, wallet, 5, 3.6, 0.8);
    gsap.to(one(il, '.il-fx__glow'), { opacity: 0.6, x: -30, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(one(il, '.il-fx__mark'), { x: -6, y: 4, duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const sheen = one(il, '.il-fx__sheen');
    const masked = one(il, '.il-fx__tag--masked');
    const bankTag = one(il, '.il-fx__tag--bank');
    const packet = one(il, '.il-fx__packet');
    const send = () => {
      gsap
        .timeline()
        .fromTo(sheen, { xPercent: -120, opacity: 1 }, { xPercent: 420, duration: 1.0, ease: 'power2.inOut' }, 0)
        .fromTo(packet, { x: 0, y: 0, scale: 0, opacity: 1 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' }, 0.5)
        // From the wallet's address (stage 340, 400) over the top of the bank's masked tag (stage 160, 372).
        .to(packet, { motionPath: { path: [{ x: 0, y: 0 }, { x: -80, y: -70 }, { x: -180, y: -28 }], curviness: 1.4 }, duration: 0.9, ease: 'power2.inOut' }, 0.7)
        .to(packet, { scale: 0, duration: 0.2, ease: 'power2.in' }, 1.5)
        .to(wallet, { scale: 0.985, duration: 0.5, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 1.2)
        .to(bank, { scale: 1.03, zIndex: 2, duration: 0.5, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 1.2)
        .fromTo(masked, { backgroundColor: 'rgba(255,255,255,0.24)' }, { backgroundColor: '#b3b5f5', duration: 0.25, ease: 'power2.out' }, 1.55)
        .fromTo(masked, { scale: 1 }, { scale: 1.08, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 1.55)
        .fromTo(bankTag, { scale: 1 }, { scale: 1.08, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 1.65)
        .add(() => roll(gsap, masked, '**** - 4417'), 1.6)
        .add(() => roll(gsap, masked, '**** - ****'), 3.2)
        .to(masked, { backgroundColor: 'rgba(255,255,255,0.24)', duration: 0.9, ease: 'power2.inOut' }, 3.0)
        .to(bank, { scale: 1, zIndex: 0, duration: 0.6, ease: 'sine.inOut' }, 3.2)
        .to(wallet, { scale: 1, duration: 0.6, ease: 'sine.inOut' }, 3.2);
      gsap.delayedCall(rand(5, 6.5), send);
    };
    gsap.delayedCall(1.5, send);
  },
};
