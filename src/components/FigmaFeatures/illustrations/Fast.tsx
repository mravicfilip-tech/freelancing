import { B, Layer, Stage } from './Stage';
import { all, one, wipe, EASE, RISE, type IllustrationMotion } from './motion';

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
    // Left to right, as the payment travels: the network pill rises, the line runs out, the bolt
    // and its outline appear where the line reaches them, then the end dot and the same-day pill.
    tl.from(one(il, '.il-fast__blob'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-fast__pill--local'), { ...RISE, y: 12 }, at + 0.1);
    wipe(tl, one(il, '.il-fast__line'), at + 0.35, 0.6, 'inset(0 100% 0 0)');
    tl.from(one(il, '.il-fast__bolt'), { opacity: 0, scale: 0.92, duration: 0.7, ease: EASE, transformOrigin: '50% 50%' }, at + 0.55);
    tl.from(one(il, '.il-fast__outline'), { opacity: 0, duration: 0.9, ease: 'power1.out' }, at + 0.65);
    tl.from(one(il, '.il-fast__dot'), { opacity: 0, scale: 0.5, duration: 0.4, ease: EASE, transformOrigin: '50% 50%' }, at + 0.9);
    tl.from(one(il, '.il-fast__pill--same'), { ...RISE, y: 12 }, at + 0.95);
  },
  idle(gsap, il) {
    // One payment every few seconds: a spark runs the line from the network to same-day. As it
    // passes the bolt a soft light rises behind it and the outline brightens; as it lands the
    // check turns over once and the pill deepens for a moment. The blob drifts between beats.
    const spark = one(il, '.il-fast__spark');
    const flash = one(il, '.il-fast__flash');
    const bolt = one(il, '.il-fast__bolt');
    const outline = one(il, '.il-fast__outline');
    const same = one(il, '.il-fast__pill--same');
    const check = one(il, '.il-fast__check');
    const idle = gsap.timeline();
    idle.to(one(il, '.il-fast__blob'), { x: 12, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
    all(il, '.il-fast__trail').forEach((t) => t.remove());
    const story = gsap.timeline({ repeat: -1, repeatDelay: 3.8, delay: 1.5 });
    story
      .fromTo(spark, { x: 0, opacity: 0 }, { opacity: 1, duration: 0.15 }, 0)
      .to(spark, { x: 222, duration: 0.9, ease: 'power2.inOut' }, 0)
      .to(spark, { opacity: 0, duration: 0.15 }, 0.85)
      .fromTo(flash, { opacity: 0, scale: 0.8 }, { opacity: 0.6, scale: 1, duration: 0.25, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.35)
      .to(flash, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0.6)
      .fromTo(bolt, { scale: 1 }, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0.35)
      .fromTo(outline, { opacity: 1 }, { opacity: 0.55, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.35)
      .to(check, { rotation: '+=360', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 0.9)
      .fromTo(same, { backgroundColor: '#b3b5f5' }, { backgroundColor: '#9b9ef0', duration: 0.25, ease: 'power2.out' }, 0.9)
      .to(same, { backgroundColor: '#b3b5f5', duration: 0.7, ease: 'power2.inOut' }, 1.2);
    idle.add(story, 0);
    return idle;
  },
};
