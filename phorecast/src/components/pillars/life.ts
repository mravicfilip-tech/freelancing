// Everything the Pillars section does when nobody has asked it to do anything:
// the resting drift, the scroll response and the pointer response.
//
// It is deliberately ONE rAF loop for the whole section. Each frame reads the
// section's box once and then only writes, through gsap quickSetters, so there
// is no read/write interleaving and no layout thrash. The loop is owned by an
// IntersectionObserver — off screen it is not running at all, not running idle.
//
// Local to this folder on purpose: `parallax` in src/lib/motion.ts binds one
// element to scroll with its own listener, and this section needs eleven
// elements on a shared clock.

import { gsap } from 'gsap';

export interface LifeHandle {
  /**
   * Begin writing to the section's elements. Until this is called the loop runs
   * but only drives `onFrame`, because the entrance timeline still owns several
   * of the same transforms and the two would fight over one transform record.
   */
  activate(): void;
  dispose(): void;
}

/** Signed distance of the section's centre from the viewport's, in -1..1. */
function progressOf(rect: DOMRect): number {
  const centre = rect.top + rect.height / 2 - innerHeight / 2;
  const span = (innerHeight + rect.height) / 2;
  return Math.max(-1, Math.min(1, centre / span));
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const TAU = Math.PI * 2;
/** Cycle lengths in seconds. Coprime-ish so the group never resynchronises. */
const MARK_X = [13.7, 10.9, 12.3];
const MARK_Y = [9.1, 11.8, 8.3];
/** Fraction of the remaining gap closed each frame: ~0.55s to settle at 60fps. */
const DAMP = 0.055;

export function startLife(
  el: HTMLElement,
  onFrame?: (timeSeconds: number, rect: DOMRectReadOnly) => void,
): LifeHandle {
  const q = <T extends Element = HTMLElement>(s: string) => Array.from(el.querySelectorAll<T>(s));

  const glow = el.querySelector<HTMLElement>('.pillars__glow');
  const dot = el.querySelector<HTMLElement>('.eyebrow__dot');
  const cardSlots = q('.pcard-slot');
  const cards = q('.pcard');
  const marks = q('.pcard__mark');
  const glints = q('.pcard__glint');
  const rowSlots = q('.prow-slot');

  const set = (node: Element | null, prop: string, unit?: string) =>
    node ? gsap.quickSetter(node, prop, unit) : () => {};

  // quickSetter drives one property; the `scale` shorthand is two, so it has to
  // be asked for as the pair it actually is.
  const glowY = set(glow, 'y', 'px');
  const glowScaleX = set(glow, 'scaleX');
  const glowScaleY = set(glow, 'scaleY');
  const dotScaleX = set(dot, 'scaleX');
  const dotScaleY = set(dot, 'scaleY');
  const dotOpacity = set(dot, 'opacity');
  const slotY = cardSlots.map((n) => set(n, 'y', 'px'));
  const cardRX = cards.map((n) => set(n, 'rotationX'));
  const cardRY = cards.map((n) => set(n, 'rotationY'));
  const markX = marks.map((n) => set(n, 'x', 'px'));
  const markY = marks.map((n) => set(n, 'y', 'px'));
  const glintOpacity = glints.map((n) => set(n, 'opacity'));
  const rowY = rowSlots.map((n) => set(n, 'y', 'px'));

  // Pointer state, per card. `want` is where the cursor says the card should be,
  // `have` is where it currently is; the gap closes a fixed fraction per frame,
  // which is what stops the tilt reading as raw cursor jitter.
  const want = cards.map(() => ({ rx: 0, ry: 0, mx: 0, my: 0, lit: 0, gx: 50, gy: 50 }));
  const have = cards.map(() => ({ rx: 0, ry: 0, mx: 0, my: 0, lit: 0, gx: 50, gy: 50 }));

  const onPointerMove = (e: PointerEvent) => {
    for (let i = 0; i < cards.length; i++) {
      const r = cards[i].getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      const w = want[i];
      if (!inside) {
        w.rx = 0; w.ry = 0; w.mx = 0; w.my = 0; w.lit = 0;
        continue;
      }
      const nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
      const ny = (e.clientY - r.top) / r.height - 0.5;
      w.ry = nx * 9;          // yaw follows the cursor across the face
      w.rx = -ny * 7;         // pitch is smaller; a card leaning back reads odd
      w.mx = nx * 14;         // the mark rides further than the card it sits on
      w.my = ny * 10;
      w.gx = (nx + 0.5) * 100;
      w.gy = (ny + 0.5) * 100;
      w.lit = 1;
    }
  };
  const onPointerLeave = () => {
    for (const w of want) { w.rx = 0; w.ry = 0; w.mx = 0; w.my = 0; w.lit = 0; }
  };

  el.addEventListener('pointermove', onPointerMove, { passive: true });
  el.addEventListener('pointerleave', onPointerLeave, { passive: true });

  let raf = 0;
  let running = false;
  let active = false;
  let t0 = 0;

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;

    // One read for the whole frame; everything after this point only writes.
    const rect = el.getBoundingClientRect();
    const p = progressOf(rect);

    if (!active) { onFrame?.(t, rect); return; }

    // --- scroll-linked -------------------------------------------------------
    // The glow runs against the content; the cards separate in depth as the
    // section crosses; the bars below travel least, so the whole block shears
    // gently rather than sliding as one plate.
    glowY(p * 74);
    // Context: one 12.6s breath, amplitude small enough that a still of it is
    // indistinguishable from the static design.
    const breathe = 1 + 0.018 * Math.sin(t * TAU / 12.6);
    glowScaleX(breathe);
    glowScaleY(breathe);
    for (let i = 0; i < slotY.length; i++) slotY[i](p * (9 + i * 11));
    for (let i = 0; i < rowY.length; i++) rowY[i](p * (4 + i * 4.5));

    // --- resting drift -------------------------------------------------------
    // Each mark gets its own period as well as its own phase, so the three never
    // pulse in lockstep. On-Chain is the section's accent and drifts furthest.
    for (let i = 0; i < marks.length; i++) {
      const amp = i === 2 ? 1.5 : 1;
      const dx = Math.cos(t * TAU / MARK_X[i] + i * 2.1) * 1.9 * amp;
      const dy = Math.sin(t * TAU / MARK_Y[i] + i * 1.7) * 2.6 * amp;
      markX[i](dx + have[i].mx);
      markY[i](dy + have[i].my);
    }
    if (dot) {
      const beat = 0.5 + 0.5 * Math.sin(t * TAU / 6.4);
      dotScaleX(1 + 0.14 * beat);
      dotScaleY(1 + 0.14 * beat);
      dotOpacity(0.74 + 0.26 * beat);
    }

    // --- pointer -------------------------------------------------------------
    for (let i = 0; i < cards.length; i++) {
      const w = want[i];
      const h = have[i];
      h.rx = lerp(h.rx, w.rx, DAMP);
      h.ry = lerp(h.ry, w.ry, DAMP);
      h.mx = lerp(h.mx, w.mx, DAMP * 0.85);
      h.my = lerp(h.my, w.my, DAMP * 0.85);
      h.lit = lerp(h.lit, w.lit, DAMP);
      h.gx = lerp(h.gx, w.gx, DAMP * 1.6);
      h.gy = lerp(h.gy, w.gy, DAMP * 1.6);
      cardRX[i](h.rx);
      cardRY[i](h.ry);
      glintOpacity[i](h.lit);
      if (glints[i] && h.lit > 0.002) {
        glints[i].style.setProperty('--gx', `${h.gx.toFixed(2)}%`);
        glints[i].style.setProperty('--gy', `${h.gy.toFixed(2)}%`);
      }
    }

    onFrame?.(t, rect);
  };

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        t0 = 0;
        raf = requestAnimationFrame(frame);
      } else if (!entry.isIntersecting && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    },
    { threshold: 0 },
  );
  io.observe(el);

  return {
    activate() {
      active = true;
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
      // quickSetters write inline styles directly, so they have to be taken back
      // by hand — a gsap context revert would not know about them.
      gsap.set([glow, dot, ...cardSlots, ...cards, ...marks, ...rowSlots].filter(Boolean), {
        clearProps: 'transform,opacity',
      });
      glints.forEach((g) => { g.style.removeProperty('--gx'); g.style.removeProperty('--gy'); });
      gsap.set(glints, { clearProps: 'opacity' });
    },
  };
}
