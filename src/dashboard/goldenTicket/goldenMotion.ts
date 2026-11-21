import type { RefObject } from 'react';
import type { Electric } from './electric';

type Gsap = typeof import('gsap').gsap;

/**
 * The Golden Ticket's load-in, shared by the popup and the slide's own entry.
 *
 * 1. Charging: the ticket is there from the first frame as a dark plaque, hanging back at a
 *    three-quarter angle, while electricity runs round its edge (and a counter, if there is one,
 *    runs to 100%). It turns slowly toward the viewer and warms as the charge builds.
 * 2. The flip: it turns edge-on and comes round the other side in gold — a flash, a shockwave,
 *    the wire surging — and settles into its tilt.
 * 3. The wordmark slides in, the title rises, and the stage chips burst out from behind it.
 *
 * Every start state is written the moment this is called, not on the timeline, so nothing of the
 * finished ticket can show before the sequence begins. `scope` is the element that holds one
 * ticket (its spot). `settle` starts the idle motion afterwards.
 */
export function mint(
  gsap: Gsap,
  scope: Element,
  ctl: RefObject<Electric | null>,
  o: { at?: number; trace: number; count?: HTMLElement | null; bar?: HTMLElement | null },
) {
  const q = (s: string) => scope.querySelectorAll(s);
  const pose = scope.querySelector<HTMLElement>('.gt-pose');
  const art = q('.gtk2__art');
  const aura = q('.gtk2__aura');
  const letters = q('.gtk2__brand, .gtk2__title');
  const chips = Array.from(q('.gchip')) as HTMLElement[];
  const wave = q('.gwave');

  // where each chip starts: tucked behind the ticket's middle (in its own, unscaled pixels)
  const box = scope.getBoundingClientRect();
  const k = box.width / ((scope as HTMLElement).offsetWidth || box.width) || 1;
  const from = chips.map((c) => {
    const r = c.getBoundingClientRect();
    return { x: (box.left + box.width / 2 - (r.left + r.width / 2)) / k, y: (box.top + box.height / 2 - (r.top + r.height / 2)) / k };
  });
  const depth = ((scope as HTMLElement).offsetWidth || 400) * 2.6;

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
  gsap.set(art, { opacity: 1, filter: 'brightness(0.14) saturate(0.35)' });
  gsap.set(aura, { opacity: 0 });
  gsap.set(letters, { opacity: 0 });
  gsap.set(chips, { opacity: 0 });
  gsap.set(wave, { opacity: 0 });
  if (pose) gsap.set(pose, { rotationX: 16, rotationY: -30, scale: 0.86, y: 14, transformPerspective: depth, transformOrigin: '50% 50%' });

  const at = o.at ?? 0;
  const T = at + o.trace;
  const draw = { p: 0 };
  const tl = gsap.timeline();

  // 1. charging
  tl.to(
    draw,
    {
      p: 1,
      duration: o.trace,
      ease: 'power1.inOut',
      onUpdate: () => {
        ctl.current?.setDraw(draw.p);
        show(draw.p);
      },
    },
    at,
  );
  if (pose) tl.to(pose, { rotationY: -14, rotationX: 9, scale: 0.92, y: 0, duration: o.trace, ease: 'sine.inOut' }, at);
  tl.to(art, { filter: 'brightness(0.32) saturate(0.6)', duration: o.trace, ease: 'power1.in' }, at);
  tl.to(aura, { opacity: 0.35, duration: o.trace, ease: 'power1.in' }, at);

  // 2. the flip: edge-on, then round in gold
  if (pose) {
    tl.to(pose, { rotationY: 90, rotationX: 4, scale: 0.98, duration: 0.26, ease: 'power2.in' }, T);
    tl.set(pose, { rotationY: -90 }, T + 0.26);
    tl.to(pose, { rotationY: 0, rotationX: 0, scale: 1, duration: 0.85, ease: 'back.out(1.5)' }, T + 0.26);
  }
  const lit = T + 0.26;
  tl.set(art, { filter: 'brightness(2.3) saturate(1)' }, lit);
  tl.to(art, { filter: 'brightness(1) saturate(1)', duration: 1.1, ease: 'power2.out', clearProps: 'filter' }, lit);
  tl.to(aura, { opacity: 1, duration: 0.3, ease: 'power2.out' }, lit);
  tl.fromTo(wave, { scale: 0.35, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 1.2, ease: 'power2.out', immediateRender: false }, lit);
  tl.add(() => ctl.current?.surge(3), lit);

  // 3. the lettering, then the chips
  tl.fromTo(q('.gtk2__brand'), { x: -46, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out', immediateRender: false }, lit + 0.3);
  tl.fromTo(q('.gtk2__title'), { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', immediateRender: false }, lit + 0.4);
  chips.forEach((c, i) => {
    tl.fromTo(
      c,
      { x: from[i].x, y: from[i].y, scale: 0.2, opacity: 0 },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.7)', immediateRender: false },
      lit + 0.5 + i * 0.09,
    );
  });
  return tl;
}

/** The idle motion once the ticket is in place. */
export function settle(gsap: Gsap, scope: Element, delay = 0) {
  const pose = scope.querySelector<HTMLElement>('.gt-pose');
  if (pose) {
    gsap.set(pose, { transformPerspective: ((scope as HTMLElement).offsetWidth || 400) * 2.6, transformOrigin: '50% 50%' });
    gsap.to(pose, { rotationY: 2.5, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay });
    gsap.to(pose, { rotationX: -2, duration: 4.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: delay + 0.6 });
  }
  scope.querySelectorAll('.gchip .gpill').forEach((p, i) => {
    gsap.to(p, { y: i % 2 ? 5 : -5, rotation: i % 2 ? 1.5 : -1.5, duration: 2.2 + i * 0.45, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: delay + i * 0.2 });
  });
}

/** Stops the idle motion and brings the ticket and its chips back to rest, for a hand-off. */
export function still(gsap: Gsap, scope: Element, duration = 0.35) {
  const pose = scope.querySelector('.gt-pose');
  const pills = scope.querySelectorAll('.gchip .gpill');
  if (pose) {
    gsap.killTweensOf(pose);
    gsap.to(pose, { rotationX: 0, rotationY: 0, duration, ease: 'power2.out' });
  }
  gsap.killTweensOf(pills);
  gsap.to(pills, { y: 0, rotation: 0, duration, ease: 'power2.out' });
}
