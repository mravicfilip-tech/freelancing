import { B, Layer, Stage } from './Stage';
import { bob, one, pop, rand, wipe, type IllustrationMotion } from './motion';

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
      <span className="il-fast__spark il-fast__trail" style={{ left: 262, top: 193.2 }} />
      <span className="il-fast__flash" style={{ left: 274.5, top: 114 }} />
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
    // The network pill lands and its signal icon pops, the line runs out to the right, the dashed
    // outline flickers on like a neon sign, the bolt strikes in with a flash, the dot and the
    // same-day pill land with the check turning over, and a first spark crosses the line.
    tl.from(one(il, '.il-fast__blob'), { opacity: 0, x: -80, duration: 1.4, ease: 'power2.out' }, at);
    const local = one(il, '.il-fast__pill--local');
    tl.from(local, { x: -40, opacity: 0, scale: 0.9, duration: 0.8, ease: 'power3.out', transformOrigin: '0% 50%' }, at + 0.2);
    pop(tl, one(local, 'img'), at + 0.45, { scale: 0, duration: 0.5 });
    wipe(tl, one(il, '.il-fast__line'), at + 0.5, 0.7, 'inset(0 100% 0 0)');
    const outline = one(il, '.il-fast__outline');
    tl.from(outline, { scale: 0.9, duration: 0.8, ease: 'power2.out', transformOrigin: '50% 50%' }, at + 0.75);
    tl.fromTo(outline, { opacity: 0 }, { opacity: 1, duration: 0.08 }, at + 0.75)
      .to(outline, { opacity: 0.2, duration: 0.06 }, at + 0.85)
      .to(outline, { opacity: 1, duration: 0.08 }, at + 0.93)
      .to(outline, { opacity: 0.4, duration: 0.05 }, at + 1.05)
      .to(outline, { opacity: 1, duration: 0.1 }, at + 1.1);
    pop(tl, one(il, '.il-fast__bolt'), at + 0.95, { scale: 0, rotation: -18, duration: 0.6, ease: 'back.out(2.2)' });
    const flash = one(il, '.il-fast__flash');
    tl.fromTo(flash, { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 0.18, ease: 'power2.out', transformOrigin: '50% 50%' }, at + 1.0)
      .to(flash, { opacity: 0, scale: 1.3, duration: 0.5, ease: 'power2.out' }, at + 1.18);
    pop(tl, one(il, '.il-fast__dot'), at + 1.25, { scale: 0, duration: 0.4 });
    pop(tl, one(il, '.il-fast__pill--same'), at + 1.35, { scale: 0.7, x: -10, transformOrigin: '0% 50%' });
    tl.from(one(il, '.il-fast__check'), { rotation: -180, scale: 0.5, duration: 0.7, ease: 'back.out(2)', transformOrigin: '50% 50%' }, at + 1.45);
    const spark = one(il, '.il-fast__spark');
    tl.fromTo(spark, { x: 0, opacity: 0 }, { opacity: 1, duration: 0.15 }, at + 1.8)
      .to(spark, { x: 222, duration: 1.0, ease: 'power1.inOut' }, at + 1.8)
      .to(spark, { opacity: 0, duration: 0.15 }, at + 2.7);
  },
  idle(gsap, il) {
    // The pills float and the blob drifts. Every few seconds a payment crosses: the network pill
    // presses and the line charges, a spark and its trail run the line, the bolt flashes and
    // flares as they pass while its dashed outline flickers, the end dot swells, and the same-day
    // pill pops with its check turning over as the spark lands.
    bob(gsap, one(il, '.il-fast__pill--local'), 3, 3.4);
    bob(gsap, one(il, '.il-fast__pill--same'), 3, 3.8, 1.2);
    gsap.to(one(il, '.il-fast__blob'), { x: 16, duration: 8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const spark = one(il, '.il-fast__spark');
    const trail = one(il, '.il-fast__trail');
    const line = one(il, '.il-fast__line');
    const flash = one(il, '.il-fast__flash');
    const bolt = one(il, '.il-fast__bolt');
    const outline = one(il, '.il-fast__outline');
    const local = one(il, '.il-fast__pill--local');
    const same = one(il, '.il-fast__pill--same');
    const check = one(il, '.il-fast__check');
    const dot = one(il, '.il-fast__dot');
    const cross = () => {
      gsap
        .timeline()
        .fromTo(local, { scale: 1 }, { scale: 0.96, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '100% 50%' }, 0)
        .fromTo(line, { scaleY: 1, backgroundColor: '#4042d1' }, { scaleY: 3, backgroundColor: '#b3b5f5', duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '0% 50%' }, 0.1)
        .fromTo(spark, { x: 0, opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.2)
        .to(spark, { x: 222, duration: 1.0, ease: 'power1.inOut' }, 0.2)
        .to(spark, { opacity: 0, duration: 0.15 }, 1.1)
        .fromTo(trail, { x: 0, opacity: 0 }, { opacity: 0.6, duration: 0.15 }, 0.3)
        .to(trail, { x: 222, duration: 1.0, ease: 'power1.inOut' }, 0.3)
        .to(trail, { opacity: 0, duration: 0.15 }, 1.2)
        .fromTo(bolt, { scale: 1 }, { scale: 1.2, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.58)
        .fromTo(flash, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 0.8, duration: 0.15, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.58)
        .to(flash, { scale: 1.3, opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.73)
        .fromTo(outline, { opacity: 1 }, { opacity: 0.35, duration: 0.09, yoyo: true, repeat: 3, ease: 'none' }, 0.52)
        .fromTo(dot, { scale: 1 }, { scale: 1.8, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 1.1)
        .fromTo(same, { scale: 1 }, { scale: 1.06, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 1.2)
        .to(check, { rotation: '+=360', duration: 0.7, ease: 'back.out(1.6)', transformOrigin: '50% 50%' }, 1.2);
      gsap.delayedCall(rand(3.5, 5), cross);
    };
    gsap.delayedCall(1.5, cross);
  },
};
