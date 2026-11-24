import type { JSX, RefObject } from 'react';
import type { Electric } from './electric';

export type Gsap = typeof import('gsap').gsap;
export type Timeline = ReturnType<Gsap['timeline']>;

export type ArtProps = {
  ctl: RefObject<Electric | null>;
  /** whether the electric loop runs */
  running: boolean;
  /** whether the wire starts fully drawn (off for a load-in, which traces it) */
  drawn?: boolean;
};

export type EnterOptions = {
  /** seconds the charge takes */
  trace: number;
  /** the popup's percentage and bar, run with the charge */
  count?: HTMLElement | null;
  bar?: HTMLElement | null;
};

/**
 * One direction of the Token Launch Strategy visual. The popup and the hero's window are the same
 * for all three (LaunchIntro, LaunchSlide); a direction brings the object at the centre and how it
 * arrives, idles and comes to rest for the hand-off between them.
 */
export type Direction = {
  id: string;
  Art: (p: ArtProps) => JSX.Element;
  /** whether the popup and the window set the title above the object (false if the object carries it) */
  head: boolean;
  /** the arrival, from the charge to the last detail; every start state written at once */
  enter(gsap: Gsap, scope: HTMLElement, ctl: RefObject<Electric | null>, o: EnterOptions): Timeline;
  /** the idle motion and the periodic surge, from `delay` seconds on */
  settle(gsap: Gsap, scope: HTMLElement, ctl: RefObject<Electric | null>, delay?: number): void;
  /** stops the idle motion and brings the object to rest, for a hand-off */
  still(gsap: Gsap, scope: HTMLElement, duration?: number): void;
};

/** The palette of the wire in all three: the RTX indigo, a lavender glow and a white-hot core. */
export const INDIGO_WIRE = { halo: [75, 75, 247], glow: [150, 152, 255], core: [238, 239, 255] };

/**
 * The Golden Ticket's charge, shared by the three: the object is there from the first frame, dark
 * and hanging back at an angle, while electricity runs round its edge (and the popup's counter runs
 * to 100%); it turns toward the viewer and warms as the charge builds, then turns edge-on and comes
 * round lit, with a flash, a shockwave and a surge of the wire. Returns the timeline and the moment
 * it lights, for the direction to add its own details after.
 *
 * `pose` is the element that turns, `art` what is dark until lit, `aura` and `wave` the glow and
 * the ring behind. `flip: false` swaps the edge-on turn for a lift (for an object that reads
 * wrong mirrored mid-turn, or has no back).
 */
export function charge(
  gsap: Gsap,
  scope: HTMLElement,
  ctl: RefObject<Electric | null>,
  o: EnterOptions,
  parts: { pose: string; art: string; aura?: string; wave?: string; flip?: boolean },
) {
  const q = (s?: string) => (s ? scope.querySelectorAll(s) : []);
  const pose = scope.querySelector<HTMLElement>(parts.pose);
  const art = q(parts.art);
  const aura = q(parts.aura);
  const wave = q(parts.wave);
  const depth = (scope.offsetWidth || 400) * 2.6;
  const flip = parts.flip ?? true;

  // ---- start states, now ----
  ctl.current?.setDraw(0);
  const progress = o.bar?.closest('[role="progressbar"]');
  const show = (p: number) => {
    const pc = Math.round(p * 100);
    if (o.count) o.count.textContent = `${pc}%`;
    if (o.bar) o.bar.style.width = `${p * 100}%`;
    progress?.setAttribute('aria-valuenow', String(pc));
  };
  show(0);
  gsap.set(art, { opacity: 1, filter: 'brightness(0.16) saturate(0.4)' });
  gsap.set(aura, { opacity: 0 });
  gsap.set(wave, { opacity: 0 });
  if (pose) {
    gsap.set(
      pose,
      flip
        ? { rotationX: 16, rotationY: -30, scale: 0.86, y: 14, transformPerspective: depth, transformOrigin: '50% 50%' }
        : { rotationX: 28, rotationY: 0, scale: 0.84, y: 30, transformPerspective: depth, transformOrigin: '50% 60%' },
    );
  }

  const at = 0;
  const T = at + o.trace;
  const draw = { p: 0 };
  const tl = gsap.timeline();

  // 1. charging
  tl.to(draw, {
    p: 1,
    duration: o.trace,
    ease: 'power1.inOut',
    onUpdate: () => {
      ctl.current?.setDraw(draw.p);
      show(draw.p);
    },
  }, at);
  if (pose) {
    tl.to(pose, flip ? { rotationY: -14, rotationX: 9, scale: 0.92, y: 0, duration: o.trace, ease: 'sine.inOut' } : { rotationX: 14, scale: 0.9, y: 10, duration: o.trace, ease: 'sine.inOut' }, at);
  }
  tl.to(art, { filter: 'brightness(0.34) saturate(0.65)', duration: o.trace, ease: 'power1.in' }, at);
  tl.to(aura, { opacity: 0.35, duration: o.trace, ease: 'power1.in' }, at);

  // 2. lit: the flip edge-on and round, or a lift straight up to the viewer
  if (pose) {
    if (flip) {
      tl.to(pose, { rotationY: 90, rotationX: 4, scale: 0.98, duration: 0.26, ease: 'power2.in' }, T);
      tl.set(pose, { rotationY: -90 }, T + 0.26);
      tl.to(pose, { rotationY: 0, rotationX: 0, scale: 1, duration: 0.85, ease: 'back.out(1.5)' }, T + 0.26);
    } else {
      tl.to(pose, { rotationX: 34, scale: 0.86, y: 18, duration: 0.22, ease: 'power2.in' }, T);
      tl.to(pose, { rotationX: 0, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.6)' }, T + 0.22);
    }
  }
  const lit = T + (flip ? 0.26 : 0.22);
  tl.set(art, { filter: 'brightness(2.2) saturate(1)' }, lit);
  tl.to(art, { filter: 'brightness(1) saturate(1)', duration: 1.1, ease: 'power2.out', clearProps: 'filter' }, lit);
  tl.to(aura, { opacity: 1, duration: 0.3, ease: 'power2.out' }, lit);
  tl.fromTo(wave, { scale: 0.35, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 1.2, ease: 'power2.out', immediateRender: false }, lit);
  tl.add(() => ctl.current?.surge(3), lit);
  return { tl, lit };
}

/** Elements that burst out from behind the object's middle to their places, one after another. */
export function burst(gsap: Gsap, tl: Timeline, scope: HTMLElement, items: HTMLElement[], at: number, gap = 0.09) {
  const box = scope.getBoundingClientRect();
  const k = box.width / (scope.offsetWidth || box.width) || 1;
  const from = items.map((c) => {
    const r = c.getBoundingClientRect();
    return { x: (box.left + box.width / 2 - (r.left + r.width / 2)) / k, y: (box.top + box.height / 2 - (r.top + r.height / 2)) / k };
  });
  gsap.set(items, { opacity: 0 });
  items.forEach((c, i) => {
    tl.fromTo(
      c,
      { x: from[i].x, y: from[i].y, scale: 0.2, opacity: 0 },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.7)', immediateRender: false },
      at + i * gap,
    );
  });
}

/** The sway every direction idles with: a slow turn one way and a slower nod the other. */
export function sway(gsap: Gsap, scope: HTMLElement, pose: string, delay = 0, k = 1) {
  const el = scope.querySelector<HTMLElement>(pose);
  if (!el) return;
  gsap.set(el, { transformPerspective: (scope.offsetWidth || 400) * 2.6, transformOrigin: '50% 50%' });
  gsap.to(el, { rotationY: 2.5 * k, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay });
  gsap.to(el, { rotationX: -2 * k, duration: 4.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: delay + 0.6 });
}

/** Floats each of `items` up and down on its own period. */
export function bob(gsap: Gsap, items: Element[] | NodeListOf<Element>, delay = 0, k = 1) {
  Array.from(items).forEach((p, i) => {
    gsap.to(p, { y: (i % 2 ? 5 : -5) * k, rotation: i % 2 ? 1.5 : -1.5, duration: 2.2 + i * 0.45, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: delay + i * 0.2 });
  });
}

/** Stops `targets`' tweens and eases their transforms back to rest. */
export function rest(gsap: Gsap, targets: Element[], duration = 0.35) {
  if (!targets.length) return;
  gsap.killTweensOf(targets);
  gsap.to(targets, { x: 0, y: 0, rotation: 0, rotationX: 0, rotationY: 0, duration, ease: 'power2.out' });
}
