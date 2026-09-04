import outline from './svg/boltOutline.svg?raw';
import { B, Layer, Stage, Strokes } from './Stage';
import { all, one, wipe, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "Super fast" (Figma 2409:2532, 710×440): a bolt strikes between the local payment network and
 * same-day processing, over a lavender blob that fills the card's left. The dashed outline is a
 * live vector so its dashes can march, and lightning strikes along the wire through the bolt.
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
      <span className="il-fast__flash" style={{ left: 274.5, top: 114 }} />
      {/* Lightning along the wire: a glow and a white core for each half, plus a short branch each. */}
      <svg className="il-fast__lightning" viewBox="0 0 710 440" width={710} height={440} style={{ left: 0, top: 0 }} aria-hidden="true">
        <polyline className="il-fast__traceGlow" data-trace="left" />
        <polyline className="il-fast__traceCore" data-trace="left" />
        <polyline className="il-fast__traceBranch" data-trace="left" />
        <polyline className="il-fast__traceGlow" data-trace="right" />
        <polyline className="il-fast__traceCore" data-trace="right" />
        <polyline className="il-fast__traceBranch" data-trace="right" />
      </svg>
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
    tl.add(() => bolt(gsap, p, 'left'), at + 0.95);
    strike(tl, p, at + 1.05, gsap, 0.8);
    tl.add(() => bolt(gsap, p, 'right'), at + 1.15);
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
  traces: {
    left: all<SVGPolylineElement>(il, '[data-trace="left"]'),
    right: all<SVGPolylineElement>(il, '[data-trace="right"]'),
  },
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
/**
 * Lightning along the wire. Each strike is drawn fresh: a jagged trace with a short branch, laid
 * along the line's y with small jitter, revealed in a few frames, flickering twice and fading.
 * `left` runs from the network pill into the bolt; `right` from the bolt to the same-day dot.
 */
const WIRE_Y = 193.2;
const SPAN = { left: [262, 316] as const, right: [392, 481] as const };
const jag = (x0: number, x1: number, n: number, amp: number) => {
  const pts: [number, number][] = [[x0, WIRE_Y]];
  for (let i = 1; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / n + (Math.random() - 0.5) * 6;
    const y = WIRE_Y + (Math.random() - 0.5) * 2 * amp;
    pts.push([x, y]);
  }
  pts.push([x1, WIRE_Y]);
  return pts;
};
const bolt = (gsap: G, p: P, side: 'left' | 'right', t = 0) => {
  const [glow, core, branch] = p.traces[side];
  const [x0, x1] = SPAN[side];
  const pts = jag(x0, x1, 8, 9);
  const main = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const k = 2 + Math.floor(Math.random() * (pts.length - 4));
  const [bx, by] = pts[k];
  const dir = Math.random() > 0.5 ? -1 : 1;
  const br = [[bx, by], [bx + 7 + Math.random() * 6, by + dir * (8 + Math.random() * 6)], [bx + 12 + Math.random() * 8, by + dir * (14 + Math.random() * 8)]]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  glow.setAttribute('points', main);
  core.setAttribute('points', main);
  branch.setAttribute('points', br);
  const len = core.getTotalLength();
  const blen = branch.getTotalLength();
  return gsap
    .timeline({ delay: t })
    .set([glow, core], { strokeDasharray: len, strokeDashoffset: len, opacity: 1 }, 0)
    .set(branch, { strokeDasharray: blen, strokeDashoffset: blen, opacity: 1 }, 0)
    .to([glow, core], { strokeDashoffset: 0, duration: 0.11, ease: 'power1.in' }, 0)
    .to(branch, { strokeDashoffset: 0, duration: 0.07, ease: 'power1.in' }, 0.08)
    .to([glow, core, branch], { opacity: 0.25, duration: 0.04 }, 0.14)
    .to([glow, core, branch], { opacity: 1, duration: 0.04 }, 0.19)
    .to([glow, core, branch], { opacity: 0.35, duration: 0.05 }, 0.26)
    .to([glow, core, branch], { opacity: 0.9, duration: 0.04 }, 0.32)
    .to([glow, core, branch], { opacity: 0, duration: 0.3, ease: 'power2.out' }, 0.42);
};
/** One lightning event: the network side strikes into the bolt, the bolt fires, the far side strikes on to same-day. */
const lightning = (story: TL, p: P, gsap: G, t: number, strength = 1) => {
  story.add(() => bolt(gsap, p, 'left'), t);
  strike(story, p, t + 0.1, gsap, strength);
  story.add(() => bolt(gsap, p, 'right'), t + 0.2);
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
    blurb: 'The bolt charges, then lightning strikes along the wire from the network into it; it fires with a flash, arcs and a white wash, a second strike jumps on to same-day, and the check turns.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.5 });
      charge(story, p, 0, 0.7);
      lightning(story, p, gsap, 0.7);
      land(story, p, 1.05);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Charge',
    blurb: 'Current flows along the wire as it fills like a progress bar, the bolt\'s glow building with it; at full charge lightning discharges through the bolt, the check turns, and the wire drains.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.5 });
      story.fromTo(p.fill, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 0);
      flow(story, p, 0, 1.3);
      charge(story, p, 0, 1.15);
      lightning(story, p, gsap, 1.2);
      land(story, p, 1.55);
      story.to(p.fill, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 2.2);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Double strike',
    blurb: 'The bolt dims to its marching outline, gathers, then lightning strikes twice in quick succession, a main strike and a weaker echo, and the check turns on the second.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.8 });
      story
        .to(p.bolt, { opacity: 0.18, scale: 0.96, duration: 0.6, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0)
        .to(p.outline, { strokeDashoffset: '-=64', duration: 1.3, ease: 'none' }, 0)
        .to(p.bolt, { opacity: 1, scale: 1, duration: 0.12, ease: 'power3.out' }, 1.3);
      lightning(story, p, gsap, 1.3, 1);
      lightning(story, p, gsap, 1.62, 0.6);
      land(story, p, 1.95);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Handover',
    blurb: 'Current runs the wire for the whole beat: the network pill dims as lightning leaves it, the bolt fires as it passes through, and same-day takes the emphasis when it lands.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.5 });
      story.fromTo(p.local, { opacity: 1 }, { opacity: 0.55, duration: 0.5, ease: 'power2.inOut' }, 0.2);
      flow(story, p, 0, 1.6);
      charge(story, p, 0, 0.6);
      lightning(story, p, gsap, 0.6);
      land(story, p, 0.95);
      story.to(p.local, { opacity: 1, duration: 0.6, ease: 'power2.inOut' }, 2.2);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Live wire',
    blurb: 'Between strikes the bolt hums: its glow breathes, the dashes march slowly and it buzzes like a neon tube now and then; lightning comes only every eight seconds.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      idle.fromTo(p.bolt, { filter: GLOW_OFF }, { filter: GLOW_LOW, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
      idle.to(p.outline, { strokeDashoffset: '-=16', duration: 1.2, ease: 'none', repeat: -1 }, 0);
      const buzz = gsap.timeline({ repeat: -1, repeatDelay: 4.6, delay: 2.2 });
      buzz.fromTo(p.bolt, { opacity: 1 }, { opacity: 0.7, duration: 0.05, yoyo: true, repeat: 5, repeatDelay: 0.03 }, 0);
      idle.add(buzz, 0);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 7, delay: 4 });
      lightning(story, p, gsap, 0);
      land(story, p, 0.35);
      idle.add(story, 0);
      return idle;
    },
  },
];
