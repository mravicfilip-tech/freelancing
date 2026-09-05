import outline from './svg/boltOutline.svg?raw';
import { B, Layer, Stage, Strokes } from './Stage';
import { one, wipe, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "Super fast" (Figma 2409:2532, 710×440): a bolt between the local payment network and same-day
 * processing, over a lavender blob that fills the card's left. The dashed outline is a live vector
 * so its dashes can march, and the loops are built around the bolt symbol: it glows, charges,
 * redraws itself, and a small bolt glides the wire.
 */
export function Fast() {
  return (
    <Stage id="fast" width={710} height={440} className="ff__art ff__art--fast il-fast">
      <Layer className="il-fast__blob" src={B('fast-blob.webp')} x={-609} y={-130} w={1023} h={576} style={{ transform: 'scaleX(-1)', clipPath: 'inset(0 0 0 1.5%)' }} />

      <Strokes className="il-fast__outline" svg={outline} x={332} y={77} w={175} h={207} />
      <span className="il-fast__line" style={{ left: 262, top: 192.7, width: 222 }} />
      <span className="il-fast__lineFill" style={{ left: 262, top: 192.2, width: 222 }} />
      <span className="il-fast__hl" style={{ left: 262, top: 191.7 }} />
      <span className="il-fast__halo" style={{ left: 304.5, top: 144 }} />
      <span className="il-fast__flash" style={{ left: 274.5, top: 114 }} />
      <Layer className="il-fast__bolt" src={B('imgVector6.svg')} x={317.8} y={151} w={73.5} h={86.2} />
      <Layer className="il-fast__glide" src={B('imgVector6.svg')} x={262} y={193.2} w={12} h={14} />

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
    // Left to right, as the payment travels: the network pill rises, the line runs out, the dashed
    // outline draws itself, the bolt appears with a soft glow where the line reaches it, then the
    // end dot and the same-day pill.
    tl.from(one(il, '.il-fast__blob'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-fast__pill--local'), { ...RISE, y: 12 }, at + 0.1);
    wipe(tl, one(il, '.il-fast__line'), at + 0.35, 0.6, 'inset(0 100% 0 0)');
    const path = one<SVGPathElement>(il, '.il-fast__outline path');
    const len = path.getTotalLength();
    tl.fromTo(path, { strokeDashoffset: len, strokeDasharray: `${len} ${len}` }, { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut' }, at + 0.5)
      .set(path, { strokeDasharray: '8 8', strokeDashoffset: 0 }, at + 1.5);
    const p = parts(il);
    tl.from(p.bolt, { opacity: 0, scale: 0.9, duration: 0.6, ease: EASE, transformOrigin: '50% 50%' }, at + 1.0);
    tl.fromTo(p.bolt, { filter: GLOW_HIGH }, { filter: GLOW_OFF, duration: 1.2, ease: 'power2.out' }, at + 1.1);
    tl.from(p.dot, { opacity: 0, scale: 0.5, duration: 0.4, ease: EASE, transformOrigin: '50% 50%' }, at + 1.3);
    tl.from(p.same, { ...RISE, y: 12 }, at + 1.35);
    void gsap;
  },
  idle: (gsap, il) => fastMotion.variants[0].idle(gsap, il),
  variants: [],
};

type G = Parameters<MotionVariant['idle']>[0];
type TL = gsap.core.Timeline;
const GLOW_OFF = 'drop-shadow(0 0 0px rgba(64, 66, 209, 0))';
const GLOW_LOW = 'drop-shadow(0 0 10px rgba(64, 66, 209, 0.5))';
const GLOW_HIGH = 'drop-shadow(0 0 18px rgba(64, 66, 209, 0.8))';

const parts = (il: HTMLElement) => ({
  hl: one(il, '.il-fast__hl'),
  halo: one(il, '.il-fast__halo'),
  flash: one(il, '.il-fast__flash'),
  fill: one(il, '.il-fast__lineFill'),
  bolt: one(il, '.il-fast__bolt'),
  glide: one(il, '.il-fast__glide'),
  outline: one<SVGPathElement>(il, '.il-fast__outline path'),
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
/** A soft light passes along the wire from the network to same-day. */
const pass = (story: TL, p: P, t: number, duration = 1.1) =>
  story
    .fromTo(p.hl, { x: -40, opacity: 0 }, { opacity: 1, duration: 0.25 }, t)
    .to(p.hl, { x: 222, duration, ease: 'power2.inOut' }, t)
    .to(p.hl, { opacity: 0, duration: 0.25 }, t + duration - 0.2);
/** The bolt glows as the light reaches it, and a ring leaves it. */
const glow = (story: TL, p: P, t: number, high = false) =>
  story
    .to(p.bolt, { filter: high ? GLOW_HIGH : GLOW_LOW, duration: 0.3, ease: 'power2.out' }, t)
    .to(p.bolt, { filter: GLOW_OFF, duration: 1.0, ease: 'power2.out' }, t + 0.35)
    .fromTo(p.bolt, { scale: 1 }, { scale: 1.04, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, t)
    .fromTo(p.halo, { scale: 1, opacity: 0.5 }, { scale: 1.8, opacity: 0, duration: 0.9, ease: 'power2.out', transformOrigin: '50% 50%' }, t)
    .to(p.outline, { strokeDashoffset: '-=16', duration: 0.6, ease: 'power2.out' }, t);
/** The payment lands: the end dot swells, the check turns over, the pill deepens for a moment. */
const land = (story: TL, p: P, t: number) =>
  story
    .fromTo(p.dot, { scale: 1 }, { scale: 1.6, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, t - 0.05)
    .to(p.check, { rotation: '+=360', duration: 0.6, ease: 'power3.inOut', transformOrigin: '50% 50%' }, t)
    .fromTo(p.same, { backgroundColor: '#b3b5f5' }, { backgroundColor: '#9b9ef0', duration: 0.2, ease: 'power2.out' }, t)
    .to(p.same, { backgroundColor: '#b3b5f5', duration: 0.7, ease: 'power2.inOut' }, t + 0.25);
/** A small bolt glides the wire from the network to the same-day dot. */
const glide = (story: TL, p: P, t: number, duration = 1.2) =>
  story
    .fromTo(p.glide, { x: 0, y: -7, opacity: 0, rotation: -8, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }, t)
    .to(p.glide, { x: 222, duration, ease: 'power2.inOut' }, t)
    .to(p.glide, { rotation: 8, duration, ease: 'sine.inOut' }, t)
    .to(p.glide, { opacity: 0, scale: 0.7, duration: 0.2 }, t + duration - 0.15);

fastMotion.variants = [
  {
    name: 'Glow pass',
    blurb: 'A soft light passes along the wire; the bolt glows and sends out a ring as it goes through, the outline\'s dashes ease forward, and the check turns as the light reaches same-day.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.5 });
      pass(story, p, 0);
      glow(story, p, 0.45);
      land(story, p, 1.05);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Charge',
    blurb: 'The wire fills like a progress bar as the bolt\'s glow builds with it; at full charge the bolt breathes once and a ring leaves it, the check turns, and the wire drains.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.5 });
      story
        .fromTo(p.fill, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 1.3, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 0)
        .fromTo(p.bolt, { filter: GLOW_OFF }, { filter: GLOW_LOW, duration: 1.2, ease: 'power2.in' }, 0)
        .to(p.outline, { strokeDashoffset: '-=32', duration: 1.3, ease: 'none' }, 0);
      glow(story, p, 1.3, true);
      land(story, p, 1.45);
      story.to(p.fill, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, 2.4);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Redraw',
    blurb: 'The bolt is drawn again: the fill fades back while the dashed outline traces itself around, then the fill returns with a glow and the light carries on to same-day.',
    idle(gsap, il) {
      const p = parts(il);
      const len = p.outline.getTotalLength();
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.8 });
      story
        .to(p.bolt, { opacity: 0.2, duration: 0.6, ease: 'power2.inOut' }, 0)
        .set(p.outline, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, 0.3)
        .to(p.outline, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.3)
        .set(p.outline, { strokeDasharray: '8 8', strokeDashoffset: 0 }, 1.55)
        .to(p.bolt, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 1.5);
      glow(story, p, 1.55);
      pass(story, p, 1.5, 1.0);
      land(story, p, 2.45);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Glide',
    blurb: 'A small bolt glides along the wire from the network to same-day, tilting with its travel; the big bolt glows and rings as it passes underneath, and the check turns when it arrives.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.5 });
      glide(story, p, 0, 1.3);
      glow(story, p, 0.55);
      land(story, p, 1.25);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Ambient',
    blurb: 'The bolt\'s glow breathes and the outline\'s dashes march slowly; every eight seconds a small bolt glides the wire and the check turns, otherwise the scene rests.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      idle.fromTo(p.bolt, { filter: GLOW_OFF }, { filter: GLOW_LOW, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
      idle.to(p.outline, { strokeDashoffset: '-=16', duration: 1.6, ease: 'none', repeat: -1 }, 0);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 6.6, delay: 3 });
      glide(story, p, 0, 1.4);
      land(story, p, 1.35);
      idle.add(story, 0);
      return idle;
    },
  },
];
