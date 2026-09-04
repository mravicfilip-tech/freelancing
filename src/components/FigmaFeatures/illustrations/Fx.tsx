import { B, Layer, Stage } from './Stage';
import { all, bob, one, pop, rand, wipe, type IllustrationMotion } from './motion';

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
    </Stage>
  );
}

export const fxMotion: IllustrationMotion = {
  build(tl, il, at) {
    tl.from(one(il, '.il-fx__dots'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-fx__bank'), { x: -70, y: 30, rotation: -3, opacity: 0, duration: 1.0, ease: 'power3.out', transformOrigin: '0% 100%' }, at);
    tl.from(one(il, '.il-fx__wallet'), { x: 70, y: 60, rotation: 3, opacity: 0, duration: 1.0, ease: 'power3.out', transformOrigin: '100% 100%' }, at + 0.2);
    tl.from(all(il, '.il-fx__lines, .il-fx__mark'), { opacity: 0, duration: 1.0, stagger: 0.15, ease: 'power1.out' }, at + 0.6);
    pop(tl, all(il, '.il-fx__temple, .il-fx__tag--bank, .il-fx__logo, .il-fx__tag--wallet'), at + 0.6, { scale: 0.6, stagger: 0.1 });
    pop(tl, one(il, '.il-fx__tag--masked'), at + 0.9, { scale: 0.7 });
    // The wallet address types in.
    tl.from(one(il, '.il-fx__tag--addr'), { opacity: 0, duration: 0.3 }, at + 1.0);
    wipe(tl, one(il, '.il-fx__addrText'), at + 1.05, 1.1, 'inset(0 100% 0 0)');
  },
  idle(gsap, il) {
    // Both cards float out of phase and the wallet's glow breathes; the outline mark drifts.
    // Every few seconds the transfer plays: a sheen sweeps the wallet address, the bank's masked
    // account lights up lavender as the funds land, and the pair briefly swap depth.
    const bank = one(il, '.il-fx__bank');
    const wallet = one(il, '.il-fx__wallet');
    bob(gsap, bank, 4, 4.2);
    bob(gsap, wallet, 5, 3.6, 0.8);
    gsap.to(one(il, '.il-fx__glow'), { opacity: 0.6, x: -30, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(one(il, '.il-fx__mark'), { x: -6, y: 4, duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const sheen = one(il, '.il-fx__sheen');
    const masked = one(il, '.il-fx__tag--masked');
    const send = () => {
      gsap
        .timeline()
        .fromTo(sheen, { xPercent: -120, opacity: 1 }, { xPercent: 420, duration: 1.1, ease: 'power2.inOut' }, 0)
        .to(wallet, { scale: 1.02, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0)
        .fromTo(masked, { backgroundColor: 'rgba(255,255,255,0.24)', color: '#ffffff' }, { backgroundColor: '#b3b5f5', color: '#ffffff', duration: 0.25, ease: 'power2.out' }, 1.0)
        .fromTo(masked, { scale: 1 }, { scale: 1.08, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 1.0)
        .to(masked, { backgroundColor: 'rgba(255,255,255,0.24)', duration: 0.9, ease: 'power2.inOut' }, 1.6);
      gsap.delayedCall(rand(4.5, 6), send);
    };
    gsap.delayedCall(1.5, send);
  },
};
