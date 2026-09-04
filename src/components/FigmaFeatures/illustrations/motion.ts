export type Gsap = typeof import('gsap')['gsap'];
export type Timeline = gsap.core.Timeline;

/**
 * How one illustration animates: `build` adds its zero-to-finished sequence to a timeline at `at`;
 * `idle` returns the timeline that holds its loops, so the band can pause it while off screen.
 *
 * The motion language is deliberately restrained: entrances rise a few pixels on `expo.out`,
 * staggered tightly; nothing overshoots, rotates for effect, or floats while idle. Each loop is
 * one deterministic story beat that shows the product doing its job, then rests.
 */
export interface IllustrationMotion {
  build(tl: Timeline, il: HTMLElement, at: number, gsap: Gsap): void;
  idle(gsap: Gsap, il: HTMLElement): Timeline;
}

/** The band's entrance ease and the small rise every element makes as it appears. */
export const EASE = 'expo.out';
export const RISE = { y: 10, opacity: 0, duration: 0.7, ease: EASE } as const;

export const one = <T extends Element = HTMLElement>(root: Element, sel: string) => root.querySelector<T>(sel)!;
export const all = <T extends Element = HTMLElement>(root: Element, sel: string) => Array.from(root.querySelectorAll<T>(sel));
export const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Draw stroked paths tip to tail. */
export function draw(tl: Timeline, gsap: Gsap, paths: SVGGeometryElement[], at: number, duration: number, stagger = 0) {
  paths.forEach((p, i) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    tl.to(p, { strokeDashoffset: 0, duration, ease: 'power2.inOut' }, at + i * stagger);
  });
}

/** Pop in from small. */
export function pop(tl: Timeline, targets: gsap.TweenTarget, at: number, vars: gsap.TweenVars = {}) {
  tl.from(targets, { scale: 0.6, opacity: 0, duration: 0.55, ease: 'back.out(1.8)', transformOrigin: '50% 50%', ...vars }, at);
}

/** Count a number into an element. */
export function count(tl: Timeline, el: HTMLElement, from: number, to: number, at: number, duration: number, fmt: (n: number) => string) {
  const o = { v: from };
  tl.to(o, { v: to, duration, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); } }, at);
}

/** Reveal with a clip-path wipe from `from` (an `inset(...)` value) to fully visible. */
export function wipe(tl: Timeline, el: Element, at: number, duration: number, from: string) {
  tl.fromTo(el, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: 'power2.inOut' }, at);
}

/** A gentle bob, out of phase with its neighbours. */
export function bob(gsap: Gsap, el: Element | null, amplitude = 3, seconds = 3, delay = 0) {
  if (el) gsap.to(el, { y: -amplitude, duration: seconds, delay, yoyo: true, repeat: -1, ease: 'sine.inOut' });
}

/** Roll a figure to a new value: the old one slides up and out, the new one in. */
export function roll(gsap: Gsap, el: HTMLElement, next: string) {
  gsap
    .timeline()
    .to(el, { yPercent: -45, opacity: 0, duration: 0.24, ease: 'power2.in' })
    .add(() => {
      el.textContent = next;
    })
    .fromTo(el, { yPercent: 45, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
}

/** Adds a small dot to an inline SVG that can be sent along its paths. */
export function traveller(svg: SVGSVGElement, color: string, r = 3): SVGCircleElement {
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', String(r));
  dot.setAttribute('fill', color);
  dot.setAttribute('opacity', '0');
  svg.appendChild(dot);
  return dot;
}
