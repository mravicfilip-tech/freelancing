// Motion for "Built for the Way You Trade".
//
// Two pieces: one entrance timeline built through `useSectionMotion`, and a
// per-column hover timeline that is only allowed to run once the entrance has
// finished — otherwise a pointer that lands mid-entrance would fight the
// `from` tweens and could strand a card part-way through its fade.
//
// Everything animates *from* a visible baseline and clears its inline styles on
// the way out, so the settled section is byte-for-byte the CSS design and a
// script that never runs leaves the section exactly as authored.

import { gsap } from 'gsap';
import { EASE, revealUp } from '../../lib/motion';
import type { SectionMotion } from '../../lib/motion';

/**
 * Local primitive: a latch the entrance opens on completion. Hover intents that
 * arrive early are parked here and replayed the moment the entrance is done, so
 * a pointer resting on a card while the section arrives is not ignored.
 */
export interface Gate {
  open: boolean;
  waiting: Set<() => void>;
}

export const createGate = (): Gate => ({ open: false, waiting: new Set() });

function openGate(gate: Gate) {
  gate.open = true;
  const pending = [...gate.waiting];
  gate.waiting.clear();
  pending.forEach((fn) => fn());
}

const num = (el: Element, prop: string) => Number.parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0;

/** Lock node position in card-2 design units — every other node converges here. */
const LOCK = { x: 226, y: 0 };

/** Everything the entrance writes an inline transform or opacity to. */
const TOUCHED = [
  '.built__glow',
  '.built__head > *',
  '.bt-card',
  '.bt-label',
  '.bt1 > *',
  '.bt1__rings > *',
  '.bt1__text > *',
  '.bt2 > *',
  '.built__copy > *',
].join(', ');

/* -------------------------------------------------------------------------- */
/* Entrance                                                                    */
/* -------------------------------------------------------------------------- */

export function buildBuilt({ q, tl }: SectionMotion, gate: Gate) {
  const one = (s: string) => q(s)[0] as HTMLElement | undefined;

  // The section glow blooms rather than simply being there. The mask lives on
  // the `.built__glows` wrapper, which is left alone so the seam keeps fading.
  const glow = one('.built__glow');
  if (glow) {
    tl.from(
      glow,
      { opacity: 0, scale: 0.78, duration: 1.1, ease: 'power2.out', clearProps: 'transform,opacity' },
      0,
    );
  }

  // Heading first.
  revealUp(tl, q('.built__head > *'), { y: 18, stagger: 0.08, duration: 0.6, at: 0 });

  // Then the two panels, as panels.
  tl.from(
    q('.bt-card'),
    {
      y: 22,
      scale: 0.985,
      opacity: 0,
      duration: 0.7,
      stagger: 0.09,
      transformOrigin: '50% 60%',
      clearProps: 'transform,opacity',
    },
    0.3,
  );

  revealUp(tl, q('.bt-label'), { y: 6, stagger: 0.04, duration: 0.45, at: 0.56 });

  buildCardOne(tl, one);
  buildCardTwo(tl, q, one);

  // Copy under the panels, left column then right.
  revealUp(tl, q('.built__copy > *'), { y: 14, stagger: 0.045, duration: 0.6, at: 0.66 });

  // Land on the CSS design exactly: every inline transform and opacity the
  // entrance wrote is dropped at the end, so the settled section is identical
  // to the one a browser with no JavaScript would paint — and a reduced-motion
  // visitor, who gets this via `progress(1)`, lands there too.
  tl.set(q(TOUCHED), { clearProps: 'transform,opacity,willChange' }, '>');

  tl.eventCallback('onComplete', () => openGate(gate));
}

function buildCardOne(tl: gsap.core.Timeline, one: (s: string) => HTMLElement | undefined) {
  const dot = one('.bt1__dot');
  const line = one('.bt1__line');
  const smear = one('.bt1__smear');
  const you = one('.bt1__you');
  const rings = ['.bt1__ring-disc', '.bt1__ring-mid', '.bt1__ring-outer'].map(one).filter(Boolean) as HTMLElement[];
  const coin = one('.bt1__coin');

  if (dot) tl.from(dot, { scale: 0.4, opacity: 0, duration: 0.45, clearProps: 'transform,opacity' }, 0.44);
  if (line) tl.from(line, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.55, clearProps: 'transform' }, 0.46);
  if (smear) tl.from(smear, { x: -34, opacity: 0, duration: 0.6, clearProps: 'transform,opacity' }, 0.5);
  if (you) tl.from(you, { opacity: 0, duration: 0.4 }, 0.56);
  // Rings expand outward from the coin, as if the line's pulse had landed.
  if (rings.length) {
    tl.from(
      rings,
      {
        scale: 0.55,
        opacity: 0,
        duration: 0.65,
        stagger: 0.07,
        transformOrigin: '50% 50%',
        clearProps: 'transform,opacity',
      },
      0.62,
    );
  }
  if (coin) tl.from(coin, { scale: 0.4, opacity: 0, duration: 0.55, clearProps: 'transform,opacity' }, 0.66);
  revealUp(tl, Array.from(one('.bt1__text')?.children ?? []) as HTMLElement[], {
    y: 10,
    stagger: 0.06,
    duration: 0.55,
    at: 0.8,
  });
}

function buildCardTwo(
  tl: gsap.core.Timeline,
  q: (s: string) => HTMLElement[],
  one: (s: string) => HTMLElement | undefined,
) {
  const main = one('.bt2__main');
  const fan = one('.bt2__fan');
  const smear = one('.bt2__smear');
  const lock = one('.bt2__node--lock');
  // Markets arrive left to right, so the network reads as building toward the
  // lock rather than popping at random.
  const nodes = q('.bt2__node')
    .filter((n) => n !== lock)
    .sort((a, b) => num(a, '--x') - num(b, '--x'));

  if (main) tl.from(main, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.65, clearProps: 'transform' }, 0.5);
  if (nodes.length) {
    tl.from(
      nodes,
      { scale: 0.45, opacity: 0, duration: 0.55, stagger: 0.06, clearProps: 'transform,opacity' },
      0.58,
    );
  }
  if (fan) tl.from(fan, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6, clearProps: 'transform' }, 0.64);
  if (smear) tl.from(smear, { x: -28, opacity: 0, duration: 0.6, clearProps: 'transform,opacity' }, 0.74);
  // Settlement lands last.
  if (lock) tl.from(lock, { scale: 0.5, opacity: 0, duration: 0.6, clearProps: 'transform,opacity' }, 0.86);
}

/* -------------------------------------------------------------------------- */
/* Hover                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Binds hover/focus motion to one column. Returns a teardown that reverts the
 * timeline, so a remount cannot leave a card frozen half-hovered.
 */
export function bindColumnHover(col: HTMLElement, gate: Gate): () => void {
  let tl: gsap.core.Timeline | null = null;
  let hovering = false;
  let focused = false;

  const apply = () => {
    tl ??= buildHover(col);
    if (hovering || focused) tl.timeScale(1).play();
    else tl.timeScale(1.25).reverse();
  };
  const sync = () => {
    if (gate.open) apply();
    else if (hovering || focused) gate.waiting.add(apply);
    else gate.waiting.delete(apply);
  };

  const onEnter = () => {
    hovering = true;
    sync();
  };
  const onLeave = () => {
    hovering = false;
    sync();
  };
  const onFocus = () => {
    focused = true;
    sync();
  };
  const onBlur = () => {
    focused = false;
    sync();
  };

  col.addEventListener('pointerenter', onEnter);
  col.addEventListener('pointerleave', onLeave);
  col.addEventListener('pointercancel', onLeave);
  col.addEventListener('focusin', onFocus);
  col.addEventListener('focusout', onBlur);

  return () => {
    col.removeEventListener('pointerenter', onEnter);
    col.removeEventListener('pointerleave', onLeave);
    col.removeEventListener('pointercancel', onLeave);
    col.removeEventListener('focusin', onFocus);
    col.removeEventListener('focusout', onBlur);
    gate.waiting.delete(apply);
    tl?.revert();
    tl = null;
  };
}

/**
 * The hover state. Card one reaches outward — the link stretches, the pulse
 * travels along it and the rings ripple out from the coin. Card two does the
 * opposite: the five markets and their linework contract toward the lock by the
 * same few pixels, and self-custody swells to take them. Both are ~4-6px of
 * movement; the point is the relationship between the parts, not the distance.
 */
function buildHover(col: HTMLElement): gsap.core.Timeline {
  const q = (s: string) => Array.from(col.querySelectorAll<HTMLElement>(s));
  const one = (s: string) => q(s)[0] as HTMLElement | undefined;
  const tl = gsap.timeline({ paused: true, defaults: { duration: 0.34, ease: EASE } });

  const card = one('.bt-card');
  if (card) tl.to(card, { y: -6, duration: 0.38 }, 0);

  const glow = one('.bt-card__glow');
  if (glow) {
    const base = Number(gsap.getProperty(glow, 'opacity')) || 0.6;
    tl.to(glow, { scale: 1.06, opacity: Math.min(1, base * 1.22), duration: 0.45, ease: 'power2.out' }, 0);
  }

  const title = one('.built__col-title');
  if (title) tl.to(title, { y: -3, duration: 0.3 }, 0);
  const cta = one('.built__cta');
  if (cta) tl.to(cta, { x: 3, duration: 0.3 }, 0.03);

  hoverCardOne(tl, one);
  hoverCardTwo(tl, q, one);

  return tl;
}

function hoverCardOne(tl: gsap.core.Timeline, one: (s: string) => HTMLElement | undefined) {
  const line = one('.bt1__line');
  if (!line) return;

  const dot = one('.bt1__dot');
  const smear = one('.bt1__smear');
  const rings = ['.bt1__ring-disc', '.bt1__ring-mid', '.bt1__ring-outer'].map(one).filter(Boolean) as HTMLElement[];
  const coin = one('.bt1__coin');
  const text = one('.bt1__text');

  if (dot) tl.to(dot, { scale: 1.18, duration: 0.3 }, 0);
  tl.to(line, { scaleX: 1.045, transformOrigin: '0% 50%', duration: 0.4 }, 0);
  if (smear) tl.to(smear, { x: 30, scaleX: 1.25, duration: 0.5, ease: 'power2.inOut' }, 0.02);
  if (rings.length) {
    const amount = [1.03, 1.06, 1.09];
    tl.to(rings, { scale: (i: number) => amount[i], transformOrigin: '50% 50%', duration: 0.42, stagger: 0.04 }, 0.08);
  }
  if (coin) tl.to(coin, { scale: 1.1, duration: 0.36 }, 0.1);
  if (text) tl.to(text, { x: 3, duration: 0.36 }, 0.06);
}

function hoverCardTwo(
  tl: gsap.core.Timeline,
  q: (s: string) => HTMLElement[],
  one: (s: string) => HTMLElement | undefined,
) {
  const lock = one('.bt2__node--lock');
  if (!lock) return;

  const main = one('.bt2__main');
  const fan = one('.bt2__fan');
  const smear = one('.bt2__smear');

  // Furthest market moves first, so the contraction reads as a sweep into the
  // lock rather than five things twitching at once.
  const nodes = q('.bt2__node')
    .filter((n) => n !== lock)
    .map((el) => {
      const dx = LOCK.x - num(el, '--x');
      const dy = LOCK.y - num(el, '--y');
      const len = Math.hypot(dx, dy) || 1;
      return { el, len, x: (dx / len) * 4.2, y: (dy / len) * 4.2 };
    })
    .sort((a, b) => b.len - a.len);

  tl.to(
    nodes.map((n) => n.el),
    {
      x: (i: number) => nodes[i].x,
      y: (i: number) => nodes[i].y,
      duration: 0.45,
      stagger: 0.035,
    },
    0,
  );
  // The linework contracts by the same amount, pinned at the lock, so the
  // lines keep meeting the nodes they belong to.
  if (main) tl.to(main, { scaleX: 0.99, transformOrigin: '100% 50%', duration: 0.45 }, 0);
  if (fan) tl.to(fan, { scale: 0.988, transformOrigin: '100% 50%', duration: 0.45 }, 0.02);
  if (smear) tl.to(smear, { x: 26, scaleX: 1.25, duration: 0.5, ease: 'power2.inOut' }, 0.02);
  tl.to(lock, { scale: 1.07, duration: 0.4 }, 0.12);
}
