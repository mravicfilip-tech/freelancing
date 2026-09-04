import { B, Layer, Stage } from './Stage';
import { all, bob, one, pop, rand, wipe, type IllustrationMotion } from './motion';

/**
 * "Super fast" (Figma 2409:2532, 710×440): a bolt strikes between the local payment network and
 * same-day processing, over a lavender blob that fills the card's left.
 */
export function Fast() {
  return (
    <Stage id="fast" width={710} height={440} className="ff__art ff__art--fast il-fast">
      <Layer className="il-fast__blob" src={B('fast-blob.webp')} x={-609} y={-130} w={1023} h={576} style={{ transform: 'scaleX(-1)', clipPath: 'inset(0 0 0 1.5%)' }} />

      <Layer className="il-fast__outline" src={B('imgVector5.png')} x={332} y={77} w={175} h={206.7} />
      <span className="il-fast__line" style={{ left: 262, top: 192.7, width: 222 }} />
      <span className="il-fast__spark" style={{ left: 262, top: 193.2 }} />
      <Layer className="il-fast__bolt" src={B('imgVector6.svg')} x={317.8} y={151} w={73.5} h={86.2} />

      <span className="il-fast__pill il-fast__pill--local" style={{ left: 32, top: 176.7 }}>
        <img src={B('imgSmartphoneSignal.svg')} alt="" width={20} height={20} />
        Local payment network
      </span>
      <Layer className="il-fast__dot" src={B('imgEllipse3477.svg')} x={480.5} y={189.5} w={7} h={7} />
      <span className="il-fast__pill il-fast__pill--same" style={{ left: 484, top: 176.75 }}>
        <img className="il-fast__check" src={B('imgCheckCircle2.svg')} alt="" width={20} height={20} />
        Same day process
      </span>
    </Stage>
  );
}

export const fastMotion: IllustrationMotion = {
  build(tl, il, at) {
    tl.from(one(il, '.il-fast__blob'), { opacity: 0, x: -80, duration: 1.4, ease: 'power2.out' }, at);
    tl.from(one(il, '.il-fast__pill--local'), { x: -40, opacity: 0, duration: 0.8, ease: 'power3.out' }, at + 0.2);
    wipe(tl, one(il, '.il-fast__line'), at + 0.5, 0.7, 'inset(0 100% 0 0)');
    tl.from(one(il, '.il-fast__outline'), { opacity: 0, scale: 0.9, duration: 0.8, ease: 'power2.out', transformOrigin: '50% 50%' }, at + 0.7);
    // The bolt strikes: in from nothing with a snap, then the dot and the same-day pill land.
    pop(tl, one(il, '.il-fast__bolt'), at + 0.95, { scale: 0, rotation: -18, duration: 0.6, ease: 'back.out(2.2)' });
    pop(tl, one(il, '.il-fast__dot'), at + 1.2, { scale: 0, duration: 0.4 });
    pop(tl, one(il, '.il-fast__pill--same'), at + 1.3, { scale: 0.7 });
    tl.from(one(il, '.il-fast__check'), { rotation: -180, scale: 0.5, duration: 0.7, ease: 'back.out(2)', transformOrigin: '50% 50%' }, at + 1.4);
  },
  idle(gsap, il) {
    // The pills float and the blob drifts. Every few seconds a payment crosses: a spark runs the
    // line from the network to same-day; the bolt flashes as it passes and its dashed outline
    // flickers, and the same-day pill pops with its check turning over as the spark lands.
    bob(gsap, one(il, '.il-fast__pill--local'), 3, 3.4);
    bob(gsap, one(il, '.il-fast__pill--same'), 3, 3.8, 1.2);
    gsap.to(one(il, '.il-fast__blob'), { x: 16, duration: 8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const spark = one(il, '.il-fast__spark');
    const bolt = one(il, '.il-fast__bolt');
    const outline = one(il, '.il-fast__outline');
    const same = one(il, '.il-fast__pill--same');
    const check = one(il, '.il-fast__check');
    const cross = () => {
      gsap
        .timeline()
        .fromTo(spark, { x: 0, opacity: 0 }, { opacity: 1, duration: 0.15 }, 0)
        .to(spark, { x: 222, duration: 1.0, ease: 'power1.inOut' }, 0)
        .to(spark, { opacity: 0, duration: 0.15 }, 0.9)
        .fromTo(bolt, { scale: 1 }, { scale: 1.18, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.38)
        .fromTo(outline, { opacity: 1 }, { opacity: 0.35, duration: 0.09, yoyo: true, repeat: 3, ease: 'none' }, 0.32)
        .fromTo(same, { scale: 1 }, { scale: 1.06, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 1.0)
        .to(check, { rotation: '+=360', duration: 0.7, ease: 'back.out(1.6)', transformOrigin: '50% 50%' }, 1.0);
      gsap.delayedCall(rand(3.5, 5), cross);
    };
    gsap.delayedCall(1.5, cross);
    all(il, '.il-fast__dot').forEach((d) => gsap.to(d, { scale: 1.3, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' }));
  },
};
