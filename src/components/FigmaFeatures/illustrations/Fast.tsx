import outline from './svg/boltOutline.svg?raw';
import { B, Layer, Stage, Strokes } from './Stage';
import { all, one, wipe, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "Super fast" (Figma 2409:2532, 710×440): a bolt between the local payment network and same-day
 * processing, over a lavender blob that fills the card's left. The dashed outline is a live vector
 * so its dashes can march, and the loops are built for speed: every beat completes in under a
 * second, a sweep along the wire, the bolt firing, the check turning.
 */
export function Fast() {
  return (
    <Stage id="fast" width={710} height={440} className="ff__art ff__art--fast il-fast">
      <Layer className="il-fast__blob" src={B('fast-blob.webp')} x={-609} y={-130} w={1023} h={576} style={{ transform: 'scaleX(-1)', clipPath: 'inset(0 0 0 1.5%)' }} />

      <Strokes className="il-fast__outline" svg={outline} x={332} y={77} w={175} h={207} />
      <span className="il-fast__line" style={{ left: 262, top: 192.7, width: 222 }} />
      <span className="il-fast__lineFill" style={{ left: 262, top: 192.2, width: 222 }} />
      <span className="il-fast__hl" style={{ left: 262, top: 191.7 }} />
      <span className="il-fast__lineGlow" style={{ left: 262, top: 191.2, width: 222 }} />
      {/* Speed streaks that whip past behind the bolt. */}
      <span className="il-fast__streak" style={{ left: 300, top: 170 }} />
      <span className="il-fast__streak" style={{ left: 290, top: 200 }} />
      <span className="il-fast__streak" style={{ left: 306, top: 226 }} />
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
const GLOW_HIGH = 'drop-shadow(0 0 18px rgba(64, 66, 209, 0.8))';

const parts = (il: HTMLElement) => ({
  hl: one(il, '.il-fast__hl'),
  lineGlow: one(il, '.il-fast__lineGlow'),
  streaks: all(il, '.il-fast__streak'),
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
  idle.fromTo(run, { strokeDashoffset: len + 26 }, { strokeDashoffset: -len, duration: lap, ease: 'none', repeat: -1 }, 0);
  return run;
};
/** A shine sweeps diagonally across the bolt's shape. */
const shine = (story: TL, p: P, t: number, duration = 0.7) => story.fromTo(p.sheen, { xPercent: -130 }, { xPercent: 130, duration, ease: 'power2.inOut' }, t);
/** The line lights in one fast sweep from the network to same-day, then fades. */
const sweep = (story: TL, p: P, t: number, duration = 0.28) =>
  story
    .fromTo(p.lineGlow, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration, ease: 'power3.in', transformOrigin: '0% 50%' }, t)
    .to(p.lineGlow, { opacity: 0, duration: 0.6, ease: 'power2.out' }, t + duration + 0.15);
/** The bolt answers: a fast glow with a small breath. */
const fire = (story: TL, p: P, t: number) =>
  story
    .to(p.bolt, { filter: GLOW_HIGH, duration: 0.12, ease: 'power2.out' }, t)
    .to(p.bolt, { filter: GLOW_OFF, duration: 0.8, ease: 'power2.out' }, t + 0.15)
    .fromTo(p.bolt, { scale: 1 }, { scale: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out', transformOrigin: '50% 50%' }, t);
/** The payment lands: the end dot swells, the check turns, the pill deepens for a moment. */
const land = (story: TL, p: P, t: number) =>
  story
    .fromTo(p.dot, { scale: 1 }, { scale: 1.6, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, t - 0.05)
    .to(p.check, { rotation: '+=360', duration: 0.5, ease: 'power3.inOut', transformOrigin: '50% 50%' }, t)
    .fromTo(p.same, { backgroundColor: '#b3b5f5' }, { backgroundColor: '#9b9ef0', duration: 0.15, ease: 'power2.out' }, t)
    .to(p.same, { backgroundColor: '#b3b5f5', duration: 0.6, ease: 'power2.inOut' }, t + 0.2);
/** Speed streaks whip past behind the bolt, left to right. */
const streaks = (story: TL, p: P, t: number) =>
  p.streaks.forEach((sk, i) =>
    story
      .fromTo(sk, { x: -30, scaleX: 0.3, opacity: 0 }, { opacity: 0.9, scaleX: 1, duration: 0.1 }, t + i * 0.05)
      .to(sk, { x: 120, duration: 0.42, ease: 'power3.in' }, t + i * 0.05)
      .to(sk, { opacity: 0, duration: 0.12 }, t + i * 0.05 + 0.3),
  );
/** The network pill sends: a quick press. */
const send = (story: TL, p: P, t: number) => story.fromTo(p.local, { scale: 1 }, { scale: 0.97, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '100% 50%' }, t);

fastMotion.variants = [
  {
    name: 'Instant',
    blurb: 'Speed as the effect: the network pill presses, the line lights in one fast sweep, the bolt fires and the check turns, all within a second, then the scene rests.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.5 });
      send(story, p, 0);
      sweep(story, p, 0.1, 0.28);
      fire(story, p, 0.22);
      land(story, p, 0.4);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Speed lines',
    blurb: 'Motion streaks whip past behind the bolt as the line sweeps and the bolt fires; the check turns as they clear. A quick, cinematic beat every few seconds.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.5 });
      send(story, p, 0);
      streaks(story, p, 0.05);
      sweep(story, p, 0.1, 0.3);
      fire(story, p, 0.25);
      land(story, p, 0.45);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Shockwave',
    blurb: 'The bolt fires and a ring races out of it along with the line sweep, like a shockwave reaching same-day; the check turns as the ring passes it.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.5 });
      fire(story, p, 0);
      story.fromTo(p.halo, { scale: 0.6, opacity: 0.7 }, { scale: 3.2, opacity: 0, duration: 0.7, ease: 'power3.out', transformOrigin: '50% 50%' }, 0);
      sweep(story, p, 0.02, 0.26);
      land(story, p, 0.38);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Lean',
    blurb: 'The bolt leans into the run: it tips forward and shines as the line sweeps past it, snaps back upright as the check turns. Physical, fast, still under a second.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.5 });
      send(story, p, 0);
      sweep(story, p, 0.1, 0.3);
      story
        .to(p.bolt, { rotation: -7, x: 6, duration: 0.18, ease: 'power3.out', transformOrigin: '50% 80%' }, 0.1)
        .to(p.bolt, { rotation: 0, x: 0, duration: 0.55, ease: 'power3.inOut' }, 0.34);
      shine(story, p, 0.12, 0.45);
      fire(story, p, 0.24);
      land(story, p, 0.42);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Trace + instant',
    blurb: 'A light keeps circling the dashed outline between beats; the beat itself is the instant one: sweep, fire, check, under a second.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      trace(idle, p, 3.4);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.2, delay: 1.5 });
      send(story, p, 0);
      sweep(story, p, 0.1, 0.28);
      fire(story, p, 0.22);
      land(story, p, 0.4);
      idle.add(story, 0);
      return idle;
    },
  },
];
