import outline from './svg/boltOutline.svg?raw';
import { B, Layer, Stage, Strokes } from './Stage';
import { all, one, wipe, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "Super fast" (Figma 2409:2532, 710×440): a bolt strikes between the local payment network and
 * same-day processing, over a lavender blob that fills the card's left. The dashed outline is a
 * live vector so its dashes can march, and the bolt carries its own charge, arcs and flash.
 */
export function Fast() {
  return (
    <Stage id="fast" width={710} height={440} className="ff__art ff__art--fast il-fast">
      <Layer className="il-fast__blob" src={B('fast-blob.webp')} x={-609} y={-130} w={1023} h={576} style={{ transform: 'scaleX(-1)', clipPath: 'inset(0 0 0 1.5%)' }} />
      <span className="il-fast__wash" />

      <Strokes className="il-fast__outline" svg={outline} x={332} y={77} w={175} h={207} />
      <span className="il-fast__line" style={{ left: 262, top: 192.7, width: 222 }} />
      <span className="il-fast__lineFill" style={{ left: 262, top: 192.2, width: 222 }} />
      <span className="il-fast__current" style={{ left: 262, top: 192.2, width: 222 }} />
      <span className="il-fast__spark" style={{ left: 262, top: 193.2 }} />
      <span className="il-fast__spark il-fast__spark--tail" style={{ left: 262, top: 193.2 }} />
      <span className="il-fast__spark il-fast__spark--tail2" style={{ left: 262, top: 193.2 }} />
      <span className="il-fast__flash" style={{ left: 274.5, top: 114 }} />
      <Layer className="il-fast__bolt" src={B('imgVector6.svg')} x={317.8} y={151} w={73.5} h={86.2} />
      <svg className="il-fast__arcs" viewBox="0 0 120 130" width={120} height={130} style={{ left: 294.5, top: 129 }} aria-hidden="true">
        <polyline points="18,34 30,26 25,40 38,32" />
        <polyline points="94,24 86,38 98,42" />
        <polyline points="12,72 26,68 20,82" />
        <polyline points="106,70 96,84 110,90" />
        <polyline points="22,106 36,100 31,114" />
        <polyline points="92,108 84,120 98,118" />
      </svg>

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
  build(tl, il, at, gsap) {
    // Left to right, as the payment travels: the network pill rises, the line runs out, the
    // dashed outline draws itself, the bolt strikes in where the line reaches it, then the end
    // dot and the same-day pill.
    tl.from(one(il, '.il-fast__blob'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-fast__pill--local'), { ...RISE, y: 12 }, at + 0.1);
    wipe(tl, one(il, '.il-fast__line'), at + 0.35, 0.6, 'inset(0 100% 0 0)');
    const path = one<SVGPathElement>(il, '.il-fast__outline path');
    const len = path.getTotalLength();
    // Draw the outline while keeping its dashes: a stroke mask of the same length runs on top.
    tl.fromTo(path, { strokeDashoffset: len, strokeDasharray: `${len} ${len}` }, { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, at + 0.5)
      .set(path, { strokeDasharray: '8 8', strokeDashoffset: 0 }, at + 1.5);
    const p = parts(il);
    tl.from(p.bolt, { opacity: 0, scale: 0.9, duration: 0.5, ease: EASE, transformOrigin: '50% 50%' }, at + 1.0);
    strike(tl, p, at + 1.05, gsap, 0.8);
    tl.from(p.dot, { opacity: 0, scale: 0.5, duration: 0.4, ease: EASE, transformOrigin: '50% 50%' }, at + 1.3);
    tl.from(p.same, { ...RISE, y: 12 }, at + 1.35);
  },
  idle: (gsap, il) => fastMotion.variants[0].idle(gsap, il),
  variants: [],
};

type G = Parameters<MotionVariant['idle']>[0];
type TL = gsap.core.Timeline;
const GLOW_OFF = 'drop-shadow(0 0 0px rgba(64, 66, 209, 0))';
const GLOW_LOW = 'drop-shadow(0 0 10px rgba(64, 66, 209, 0.55))';
const GLOW_HIGH = 'drop-shadow(0 0 22px rgba(64, 66, 209, 0.95))';

const parts = (il: HTMLElement) => ({
  sparks: all(il, '.il-fast__spark'),
  flash: one(il, '.il-fast__flash'),
  fill: one(il, '.il-fast__lineFill'),
  current: one(il, '.il-fast__current'),
  wash: one(il, '.il-fast__wash'),
  bolt: one(il, '.il-fast__bolt'),
  outline: one<SVGPathElement>(il, '.il-fast__outline path'),
  arcs: all<SVGPolylineElement>(il, '.il-fast__arcs polyline'),
  local: one(il, '.il-fast__pill--local'),
  same: one(il, '.il-fast__pill--same'),
  check: one(il, '.il-fast__check'),
  dot: one(il, '.il-fast__dot'),
});
type P = ReturnType<typeof parts>;

const ambient = (gsap: G, il: HTMLElement) => {
  const idle = gsap.timeline();
  idle.to(one(il, '.il-fast__blob'), { x: 12, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  return idle;
};
/** The bolt gathers charge: its glow builds and the outline's dashes begin to march. */
const charge = (story: TL, p: P, t: number, duration: number) =>
  story
    .fromTo(p.bolt, { filter: GLOW_OFF }, { filter: GLOW_LOW, duration, ease: 'power2.in', transformOrigin: '50% 50%' }, t)
    .to(p.outline, { strokeDashoffset: '-=32', duration, ease: 'none' }, t);
/** The strike: a burst of glow, a flash, a white wash over the card, arcs crackling around the bolt, dashes jumping. */
const strike = (story: TL, p: P, t: number, gsap: G, strength = 1) => {
  story
    .fromTo(p.bolt, { scale: 1 }, { scale: 1 + 0.07 * strength, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out', transformOrigin: '50% 50%' }, t)
    .to(p.bolt, { filter: GLOW_HIGH, duration: 0.1, ease: 'power2.out' }, t)
    .to(p.bolt, { filter: GLOW_OFF, duration: 0.9, ease: 'power2.out' }, t + 0.15)
    .fromTo(p.flash, { opacity: 0, scale: 0.5 }, { opacity: 0.95 * strength, scale: 1.5, duration: 0.14, ease: 'power2.out', transformOrigin: '50% 50%' }, t)
    .to(p.flash, { opacity: 0, scale: 1.9, duration: 0.55, ease: 'power2.out' }, t + 0.14)
    .fromTo(p.wash, { opacity: 0 }, { opacity: 0.32 * strength, duration: 0.06 }, t)
    .to(p.wash, { opacity: 0, duration: 0.45, ease: 'power2.out' }, t + 0.06)
    .to(p.outline, { strokeDashoffset: '-=48', duration: 0.35, ease: 'power3.out' }, t)
    .fromTo(p.outline, { opacity: 1 }, { opacity: 0.4, duration: 0.06, yoyo: true, repeat: 3 }, t);
  p.arcs.forEach((a, i) => {
    story.fromTo(a, { opacity: 0 }, { opacity: 1, duration: 0.05, yoyo: true, repeat: 3, repeatDelay: 0.02 + (i % 3) * 0.02 }, t + 0.02 + i * 0.03);
  });
  void gsap;
  return story;
};
/** Current flows along the line for a while: a moving dash pattern over the wire. */
const flow = (story: TL, p: P, t: number, duration: number) =>
  story
    .fromTo(p.current, { opacity: 0, backgroundPositionX: '0px' }, { opacity: 1, duration: 0.2 }, t)
    .to(p.current, { backgroundPositionX: `-${Math.round(duration * 90)}px`, duration, ease: 'none' }, t)
    .to(p.current, { opacity: 0, duration: 0.25 }, t + duration - 0.2);
/** A spark and its tail run the line from the network to same-day. */
const run = (story: TL, p: P, t: number, duration = 0.85) => {
  p.sparks.forEach((sp, i) => {
    const lag = i * 0.05;
    story
      .fromTo(sp, { x: 0, opacity: 0 }, { opacity: 1 - i * 0.3, duration: 0.12 }, t + lag)
      .to(sp, { x: 222, duration, ease: 'power2.inOut' }, t + lag)
      .to(sp, { opacity: 0, duration: 0.12 }, t + lag + duration - 0.08);
  });
  return story;
};
/** The payment lands: the end dot swells, the check turns over, the pill deepens for a moment. */
const land = (story: TL, p: P, t: number) =>
  story
    .fromTo(p.dot, { scale: 1 }, { scale: 1.7, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, t - 0.05)
    .to(p.check, { rotation: '+=360', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, t)
    .fromTo(p.same, { backgroundColor: '#b3b5f5' }, { backgroundColor: '#8f92ee', duration: 0.2, ease: 'power2.out' }, t)
    .to(p.same, { backgroundColor: '#b3b5f5', duration: 0.7, ease: 'power2.inOut' }, t + 0.25)
    .fromTo(p.same, { scale: 1 }, { scale: 1.03, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, t);

fastMotion.variants = [
  {
    name: 'Spark',
    blurb: 'The bolt charges as a spark and its tail leave the network; it strikes with a flash, arcs and a white wash as they pass, the dashes jump, and the check turns as the spark lands.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.5 });
      charge(story, p, 0, 0.55);
      run(story, p, 0.45);
      strike(story, p, 0.82, gsap);
      land(story, p, 1.32);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Charge',
    blurb: 'Current flows along the wire as it fills like a progress bar, the bolt\'s glow building with it; at full charge it discharges in a strike, the check turns, and the wire drains.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.5 });
      story.fromTo(p.fill, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 0);
      flow(story, p, 0, 1.3);
      charge(story, p, 0, 1.15);
      strike(story, p, 1.2, gsap);
      land(story, p, 1.35);
      story.to(p.fill, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 2.2);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Double strike',
    blurb: 'The bolt dims to its marching outline, gathers, then strikes twice in quick succession like real lightning, a main flash and an echo, and the check turns on the second.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.8 });
      story
        .to(p.bolt, { opacity: 0.18, scale: 0.96, duration: 0.6, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0)
        .to(p.outline, { strokeDashoffset: '-=64', duration: 1.3, ease: 'none' }, 0)
        .to(p.bolt, { opacity: 1, scale: 1, duration: 0.12, ease: 'power3.out' }, 1.3);
      strike(story, p, 1.3, gsap, 1);
      strike(story, p, 1.55, gsap, 0.55);
      land(story, p, 1.6);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Handover',
    blurb: 'Current runs the wire for the whole beat: the network pill dims as the spark leaves it, the bolt strikes as it passes, and same-day takes the emphasis when it lands.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.5 });
      story.fromTo(p.local, { opacity: 1 }, { opacity: 0.55, duration: 0.5, ease: 'power2.inOut' }, 0.2);
      flow(story, p, 0, 1.6);
      charge(story, p, 0, 0.5);
      run(story, p, 0.35);
      strike(story, p, 0.72, gsap);
      land(story, p, 1.22);
      story.to(p.local, { opacity: 1, duration: 0.6, ease: 'power2.inOut' }, 2.2);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Live wire',
    blurb: 'Between strikes the bolt hums: its glow breathes, the dashes march slowly and it buzzes like a neon tube now and then; a strike with a spark comes only every eight seconds.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      idle.fromTo(p.bolt, { filter: GLOW_OFF }, { filter: GLOW_LOW, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
      idle.to(p.outline, { strokeDashoffset: '-=16', duration: 1.2, ease: 'none', repeat: -1 }, 0);
      const buzz = gsap.timeline({ repeat: -1, repeatDelay: 4.6, delay: 2.2 });
      buzz.fromTo(p.bolt, { opacity: 1 }, { opacity: 0.7, duration: 0.05, yoyo: true, repeat: 5, repeatDelay: 0.03 }, 0);
      idle.add(buzz, 0);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 7, delay: 4 });
      run(story, p, 0);
      strike(story, p, 0.37, gsap);
      land(story, p, 0.87);
      idle.add(story, 0);
      return idle;
    },
  },
];
