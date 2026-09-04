import { B, Layer, Stage } from './Stage';
import { one, wipe, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

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
      <span className="il-fast__lineFill" style={{ left: 262, top: 192.2, width: 222 }} />
      <span className="il-fast__spark" style={{ left: 262, top: 193.2 }} />
      <span className="il-fast__flash" style={{ left: 274.5, top: 114 }} />
      <Layer className="il-fast__bolt" src={B('imgVector6.svg')} x={317.8} y={151} w={73.5} h={86.2} />

      <span className="il-fast__pill il-fast__pill--local" style={{ left: 32, top: 176.7 }}>
        <img src={B('imgSmartphoneSignal.svg')} alt="" width={20} height={20} />
        Local payment network
      </span>
      <span className="il-fast__pill il-fast__pill--same" style={{ left: 484, top: 176.75 }}>
        <img className="il-fast__check" src={B('imgCheckCircle2.svg')} alt="" width={20} height={20} />
        Same day process
      </span>
      <Layer className="il-fast__dot" src={B('imgEllipse3477.svg')} x={480.5} y={189.5} w={7} h={7} />
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
  idle: (gsap, il) => fastMotion.variants[0].idle(gsap, il),
  variants: [],
};

type G = Parameters<MotionVariant['idle']>[0];
const ambient = (gsap: G, il: HTMLElement) => {
  const idle = gsap.timeline();
  idle.to(one(il, '.il-fast__blob'), { x: 12, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  return idle;
};
const parts = (il: HTMLElement) => ({
  spark: one(il, '.il-fast__spark'),
  flash: one(il, '.il-fast__flash'),
  fill: one(il, '.il-fast__lineFill'),
  bolt: one(il, '.il-fast__bolt'),
  outline: one(il, '.il-fast__outline'),
  local: one(il, '.il-fast__pill--local'),
  same: one(il, '.il-fast__pill--same'),
  check: one(il, '.il-fast__check'),
  dot: one(il, '.il-fast__dot'),
});
const land = (story: gsap.core.Timeline, p: ReturnType<typeof parts>, t: number) =>
  story
    .to(p.check, { rotation: '+=360', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, t)
    .fromTo(p.same, { backgroundColor: '#b3b5f5' }, { backgroundColor: '#9b9ef0', duration: 0.25, ease: 'power2.out' }, t)
    .to(p.same, { backgroundColor: '#b3b5f5', duration: 0.7, ease: 'power2.inOut' }, t + 0.3);

fastMotion.variants = [
  {
    name: 'Spark',
    blurb: 'A spark runs the line from the network to same-day; a soft light rises behind the bolt as it passes, and the check turns once as it lands.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.8, delay: 1.5 });
      story
        .fromTo(p.spark, { x: 0, opacity: 0 }, { opacity: 1, duration: 0.15 }, 0)
        .to(p.spark, { x: 222, duration: 0.9, ease: 'power2.inOut' }, 0)
        .to(p.spark, { opacity: 0, duration: 0.15 }, 0.85)
        .fromTo(p.flash, { opacity: 0, scale: 0.8 }, { opacity: 0.6, scale: 1, duration: 0.25, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.35)
        .to(p.flash, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0.6)
        .fromTo(p.bolt, { scale: 1 }, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0.35)
        .fromTo(p.outline, { opacity: 1 }, { opacity: 0.55, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.35);
      land(story, p, 0.9);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Charge',
    blurb: 'The line fills from the network like a progress bar; when it reaches the bolt the bolt lights, when it completes the check turns, then the line drains.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.5 });
      story
        .fromTo(p.fill, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 1.1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 0)
        .fromTo(p.flash, { opacity: 0, scale: 0.8 }, { opacity: 0.55, scale: 1, duration: 0.3, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.45)
        .to(p.flash, { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, 1.1)
        .fromTo(p.outline, { opacity: 1 }, { opacity: 0.55, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.45);
      land(story, p, 1.1);
      story.to(p.fill, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 2.2);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Strike',
    blurb: 'The bolt itself is the event: it fades to its dashed outline, then strikes back in with a flash, and the check turns as the strike lands.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.8 });
      story
        .to(p.bolt, { opacity: 0, scale: 0.94, duration: 0.6, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0)
        .to(p.outline, { opacity: 0.45, duration: 0.6, ease: 'power2.inOut' }, 0)
        .to(p.bolt, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }, 1.3)
        .to(p.outline, { opacity: 1, duration: 0.3 }, 1.3)
        .fromTo(p.flash, { opacity: 0, scale: 0.7 }, { opacity: 0.7, scale: 1.05, duration: 0.2, ease: 'power2.out', transformOrigin: '50% 50%' }, 1.3)
        .to(p.flash, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, 1.5);
      land(story, p, 1.5);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Handover',
    blurb: 'Attention moves along the route: the network pill dims as the spark leaves it, the bolt lights as it passes, and same-day takes the emphasis when it lands.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.5 });
      story
        .fromTo(p.local, { opacity: 1 }, { opacity: 0.55, duration: 0.5, ease: 'power2.inOut' }, 0.1)
        .fromTo(p.spark, { x: 0, opacity: 0 }, { opacity: 1, duration: 0.15 }, 0)
        .to(p.spark, { x: 222, duration: 0.9, ease: 'power2.inOut' }, 0)
        .to(p.spark, { opacity: 0, duration: 0.15 }, 0.85)
        .fromTo(p.flash, { opacity: 0, scale: 0.8 }, { opacity: 0.5, scale: 1, duration: 0.25, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.35)
        .to(p.flash, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0.6)
        .fromTo(p.dot, { scale: 1 }, { scale: 1.6, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0.85);
      land(story, p, 0.9);
      story.to(p.local, { opacity: 1, duration: 0.6, ease: 'power2.inOut' }, 2.6);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Ambient',
    blurb: 'Nothing crosses. The light behind the bolt breathes slowly and the blob drifts; a single quiet spark passes only every ten seconds.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      idle.fromTo(p.flash, { opacity: 0.05, scale: 0.9 }, { opacity: 0.3, scale: 1.05, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 9, delay: 3 });
      story
        .fromTo(p.spark, { x: 0, opacity: 0 }, { opacity: 0.8, duration: 0.2 }, 0)
        .to(p.spark, { x: 222, duration: 1.4, ease: 'power1.inOut' }, 0)
        .to(p.spark, { opacity: 0, duration: 0.2 }, 1.3);
      idle.add(story, 0);
      return idle;
    },
  },
];
