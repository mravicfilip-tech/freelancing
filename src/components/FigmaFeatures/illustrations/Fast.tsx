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
      {/* A shine that sweeps across the bolt's own shape (masked to it). */}
      <span className="il-fast__sheen" style={{ left: 317.8, top: 151, width: 73.5, height: 86.2 }}>
        <i />
      </span>
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
  fill: one(il, '.il-fast__lineFill'),
  bolt: one(il, '.il-fast__bolt'),
  sheen: one(il, '.il-fast__sheen i'),
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
/** A light that keeps tracing the dashed outline: a short bright run circling the bolt's silhouette. */
const trace = (idle: TL, p: P, lap = 3.2) => {
  const len = p.outline.getTotalLength();
  const run = p.outline.cloneNode() as SVGPathElement;
  run.setAttribute('stroke', '#fff');
  run.setAttribute('stroke-width', '2');
  run.setAttribute('stroke-dasharray', `26 ${len}`);
  run.classList.add('il-fast__outlineRun');
  p.outline.parentNode!.appendChild(run);
  idle.fromTo(run, { strokeDashoffset: len + 26 }, { strokeDashoffset: -26 + 26 - len, duration: lap, ease: 'none', repeat: -1 }, 0);
  return run;
};
/** A shine sweeps diagonally across the bolt's shape. */
const shine = (story: TL, p: P, t: number, duration = 0.7) => story.fromTo(p.sheen, { xPercent: -130 }, { xPercent: 130, duration, ease: 'power2.inOut' }, t);
/** A quick, decisive pulse crosses the wire: it accelerates, and the bolt glows as it passes. */
const pulse = (story: TL, p: P, t: number, duration = 0.6) =>
  story
    .fromTo(p.hl, { x: -40, opacity: 0 }, { opacity: 1, duration: 0.12 }, t)
    .to(p.hl, { x: 222, duration, ease: 'power3.in' }, t)
    .to(p.hl, { opacity: 0, duration: 0.15 }, t + duration - 0.1)
    .to(p.bolt, { filter: GLOW_HIGH, duration: 0.15, ease: 'power2.out' }, t + duration * 0.45)
    .to(p.bolt, { filter: GLOW_OFF, duration: 0.9, ease: 'power2.out' }, t + duration * 0.45 + 0.2);
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
    name: 'Trace',
    blurb: 'A light keeps circling the dashed outline. Every few seconds a quick pulse crosses the wire, a shine sweeps the bolt as it passes through, and the check turns when it lands.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      trace(idle, p, 3.2);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.5 });
      pulse(story, p, 0, 0.6);
      shine(story, p, 0.2, 0.7);
      land(story, p, 0.62);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Shine',
    blurb: 'The bolt is the hero: a shine sweeps across it with a soft glow, then the pulse it releases crosses the wire in an instant and the check turns. Nothing else moves.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.8, delay: 1.5 });
      story.to(p.bolt, { filter: GLOW_LOW, duration: 0.5, ease: 'power2.out' }, 0);
      shine(story, p, 0.1, 0.9);
      pulse(story, p, 0.8, 0.5);
      land(story, p, 1.32);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Charge & release',
    blurb: 'The wire fills slowly as the bolt gathers glow; when it is full the bolt shines and releases a fast pulse to same-day, the check turns, and the wire drains.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.5 });
      story
        .fromTo(p.fill, { scaleX: 0, opacity: 1 }, { scaleX: 0.25, duration: 1.4, ease: 'power1.inOut', transformOrigin: '0% 50%' }, 0)
        .fromTo(p.bolt, { filter: GLOW_OFF }, { filter: GLOW_LOW, duration: 1.4, ease: 'power2.in' }, 0);
      shine(story, p, 1.3, 0.6);
      story.to(p.fill, { scaleX: 1, duration: 0.45, ease: 'power3.in' }, 1.5);
      story.to(p.bolt, { filter: GLOW_HIGH, duration: 0.15 }, 1.6).to(p.bolt, { filter: GLOW_OFF, duration: 1.0, ease: 'power2.out' }, 1.8);
      land(story, p, 1.95);
      story.to(p.fill, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 2.8);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Heartbeat',
    blurb: 'The bolt beats like a pulse, two quick glows then a rest, the wire brightening with each beat; every third beat the pulse runs through to same-day and the check turns.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const beat = (story: TL, t: number) =>
        story
          .to(p.bolt, { filter: GLOW_HIGH, duration: 0.12, ease: 'power2.out' }, t)
          .to(p.bolt, { filter: GLOW_OFF, duration: 0.35, ease: 'power2.out' }, t + 0.14)
          .to(p.bolt, { filter: GLOW_LOW, duration: 0.1, ease: 'power2.out' }, t + 0.3)
          .to(p.bolt, { filter: GLOW_OFF, duration: 0.6, ease: 'power2.out' }, t + 0.42)
          .fromTo(p.bolt, { scale: 1 }, { scale: 1.03, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, t)
          .fromTo(p.fill, { opacity: 0, scaleX: 1 }, { opacity: 0.5, duration: 0.12 }, t)
          .to(p.fill, { opacity: 0, duration: 0.5 }, t + 0.16);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 1.5 });
      beat(story, 0);
      beat(story, 1.4);
      beat(story, 2.8);
      pulse(story, p, 2.85, 0.55);
      land(story, p, 3.42);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Courier',
    blurb: 'A small bolt glides the wire while the light traces the outline; the big bolt shines as the small one passes beneath it, and the check turns on arrival.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      trace(idle, p, 3.6);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.5 });
      glide(story, p, 0, 1.3);
      shine(story, p, 0.35, 0.7);
      story.to(p.bolt, { filter: GLOW_LOW, duration: 0.3 }, 0.45).to(p.bolt, { filter: GLOW_OFF, duration: 0.8 }, 0.8);
      land(story, p, 1.25);
      idle.add(story, 0);
      return idle;
    },
  },
];
