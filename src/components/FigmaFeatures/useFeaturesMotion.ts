import { useEffect, type RefObject } from 'react';
import type { FxVariant } from './fxVariant';

type Gsap = typeof import('gsap')['gsap'];

/**
 * Motion for the feature band, in three flavours picked with `?fx=`:
 *
 *  1 Rise    — calm, editorial. The headline and cards rise in, the artwork settles a beat later,
 *              then floats; cards lift on hover and the artwork leans toward the cursor.
 *  2 Wipe    — graphic. The headline wipes on, cards wipe up from their bottom edge, artwork slides
 *              in from its card's outer side; a light sheen sweeps the cards in turn, and hovering
 *              a card zooms its artwork and sweeps it again.
 *  3 Kinetic — playful, 3D. Cards flip up from a tilt with an overshoot, artwork pops in with a
 *              spring, the chip spins in; artwork drifts in shallow 3D, and cards tilt toward the
 *              cursor while the artwork counter-moves.
 *
 * The section renders with `data-motion="pending"`, which hides the animated parts in CSS; the
 * attribute is cleared in the same frame GSAP takes over. The entrance plays once, when the band
 * scrolls into view. Reduced motion shows the band at rest.
 */
export function useFeaturesMotion(root: RefObject<HTMLElement | null>, variant: FxVariant) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reveal = () => {
      delete el.dataset.motion;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
      return;
    }

    let cancelled = false;
    let revert: (() => void) | null = null;
    const cleanups: Array<() => void> = [];
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          const scope: Scope = {
            gsap,
            el,
            cards: gsap.utils.toArray<HTMLElement>('.ff__card', el),
            arts: gsap.utils.toArray<HTMLElement>('.ff__art', el),
            hoverable: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
            cleanups,
          };
          const v = VARIANTS[variant];
          const entrance = v.enter(scope);
          entrance.eventCallback('onComplete', () => v.idle(scope));
          const trigger = ScrollTrigger.create({ trigger: el, start: 'top 78%', once: true, onEnter: () => entrance.play() });
          // Already past the start (a reload further down the page): play right away.
          if (trigger.progress > 0) entrance.play();
        }, el);
        // The `from` tweens have written their start states, so the CSS hold can go.
        reveal();
        revert = () => {
          cleanups.forEach((fn) => fn());
          cleanups.length = 0;
          ctx.revert();
        };
      })
      .catch(() => reveal());

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [root, variant]);
}

interface Scope {
  gsap: Gsap;
  el: HTMLElement;
  cards: HTMLElement[];
  arts: HTMLElement[];
  hoverable: boolean;
  cleanups: Array<() => void>;
}

interface Variant {
  /** Builds the paused entrance timeline. */
  enter: (s: Scope) => gsap.core.Timeline;
  /** Starts the idle loops and hover behaviour once the entrance has finished. */
  idle: (s: Scope) => void;
}

/** Pointer position inside `card` as -1…1 on both axes, or null when it is not a mouse. */
function pointerIn(card: HTMLElement, e: PointerEvent) {
  if (e.pointerType !== 'mouse') return null;
  const r = card.getBoundingClientRect();
  return { dx: ((e.clientX - r.left) / r.width) * 2 - 1, dy: ((e.clientY - r.top) / r.height) * 2 - 1 };
}

function on<K extends keyof HTMLElementEventMap>(s: Scope, target: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) {
  target.addEventListener(type, fn);
  s.cleanups.push(() => target.removeEventListener(type, fn));
}

/** The orbit artwork rocks gently; shared by the variants. */
function rockOrbit({ gsap, el }: Scope, degrees: number, seconds: number) {
  gsap.to(el.querySelector('.ff__art--fast'), { rotation: degrees, duration: seconds, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' });
}

const rise: Variant = {
  enter({ gsap, el, cards, arts }) {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    tl.from(el.querySelector('.ff__title'), { y: 28, opacity: 0, duration: 0.9 }, 0)
      .from(cards, { y: 48, opacity: 0, duration: 0.9, stagger: 0.09 }, 0.15)
      .from(el.querySelectorAll('.ff__text, .ff__simpleCopy > .fh__btn'), { y: 14, opacity: 0, duration: 0.7, stagger: 0.06 }, 0.45)
      .from(arts, { y: 26, scale: 0.96, opacity: 0, duration: 1.0, stagger: 0.09, transformOrigin: '50% 100%' }, 0.35)
      .from(el.querySelector('.ff__chip'), { scale: 0.8, opacity: 0, duration: 0.6, ease: 'back.out(1.8)' }, 0.8);
    return tl;
  },
  idle(s) {
    const { gsap, cards, arts, hoverable } = s;
    gsap.set([...cards, ...arts], { clearProps: 'opacity' });
    arts.forEach((art, i) => gsap.to(art, { y: -6, duration: 3.6 + i * 0.4, delay: i * 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    rockOrbit(s, 2, 5);
    if (!hoverable) return;
    cards.forEach((card) => {
      const art = card.querySelector<HTMLElement>('.ff__art');
      const artX = art ? gsap.quickTo(art, 'x', { duration: 0.6, ease: 'power3.out' }) : null;
      on(s, card, 'pointerenter', () => gsap.to(card, { y: -4, boxShadow: '0 22px 44px -26px rgba(18, 36, 51, 0.45)', duration: 0.5, ease: 'power3.out' }));
      on(s, card, 'pointermove', (e) => {
        const p = pointerIn(card, e);
        if (p && artX) artX(p.dx * 12);
      });
      on(s, card, 'pointerleave', () => {
        gsap.to(card, { y: 0, boxShadow: '0 0 0 0 rgba(18, 36, 51, 0)', duration: 0.7, ease: 'power3.out' });
        artX?.(0);
      });
    });
  },
};

const wipe: Variant = {
  enter({ gsap, el, cards, arts }) {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.inOut' } });
    // Artwork slides in from its card's outer side: left cards from the left, right cards from the right, the FX cards from above.
    const from = (art: HTMLElement) =>
      art.classList.contains('ff__art--fx') ? { y: -44 } : art.classList.contains('ff__art--pay') || art.classList.contains('ff__art--ui') ? { x: -70 } : { x: 80 };
    tl.fromTo(el.querySelector('.ff__title'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.1 }, 0)
      .fromTo(cards, { clipPath: 'inset(100% 0 0 0 round 12px)', y: 24 }, { clipPath: 'inset(0% 0 0 0 round 12px)', y: 0, duration: 1.0, stagger: 0.1 }, 0.2)
      .from(el.querySelectorAll('.ff__text, .ff__simpleCopy > .fh__btn, .ff__chip'), { y: 16, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 0.7);
    arts.forEach((art, i) => tl.from(art, { ...from(art), opacity: 0, duration: 1.1, ease: 'power3.out' }, 0.55 + i * 0.1));
    tl.set([el.querySelector('.ff__title'), ...cards], { clearProps: 'clipPath' });
    return tl;
  },
  idle(s) {
    const { gsap, el, cards, arts, hoverable } = s;
    gsap.set(arts, { clearProps: 'opacity' });
    const sheens = gsap.utils.toArray<HTMLElement>('.ff__sheen', el);
    const sweep = (sheen: HTMLElement) => gsap.fromTo(sheen, { xPercent: -160 }, { xPercent: 160, duration: 1.5, ease: 'power2.inOut' });
    // A sheen crosses the cards one after another, then the round repeats.
    const round = gsap.timeline({ repeat: -1, repeatDelay: 3.5, delay: 1 });
    sheens.forEach((sheen, i) => round.add(sweep(sheen), i * 0.9));
    gsap.to(el.querySelector('.ff__art--simple'), { scale: 1.025, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' });
    gsap.to(el.querySelector('.ff__art--fx'), { y: -6, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    rockOrbit(s, 3, 6);
    if (!hoverable) return;
    cards.forEach((card, i) => {
      const art = card.querySelector<HTMLElement>('.ff__art');
      on(s, card, 'pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        if (art && !art.classList.contains('ff__art--simple')) gsap.to(art, { scale: 1.04, duration: 0.7, ease: 'power3.out', transformOrigin: '50% 50%' });
        if (sheens[i]) sweep(sheens[i]);
      });
      on(s, card, 'pointerleave', () => {
        if (art && !art.classList.contains('ff__art--simple')) gsap.to(art, { scale: 1, duration: 0.8, ease: 'power3.out' });
      });
    });
  },
};

const kinetic: Variant = {
  enter({ gsap, el, cards, arts }) {
    const tl = gsap.timeline({ paused: true });
    gsap.set(cards, { transformPerspective: 1200 });
    tl.from(el.querySelector('.ff__title'), { y: 40, rotationX: -18, opacity: 0, duration: 1.0, ease: 'back.out(1.4)', transformOrigin: '50% 100%', transformPerspective: 900 }, 0)
      .from(cards, { y: 70, rotationX: 14, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'back.out(1.3)', transformOrigin: '50% 100%' }, 0.15)
      .from(arts, { scale: 0.8, y: 30, opacity: 0, duration: 1.3, stagger: 0.1, ease: 'elastic.out(1, 0.6)', transformOrigin: '50% 60%' }, 0.5)
      .from(el.querySelectorAll('.ff__text, .ff__simpleCopy > .fh__btn'), { y: 18, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 0.55)
      .from(el.querySelector('.ff__chip'), { rotation: -90, scale: 0.6, opacity: 0, duration: 0.8, ease: 'back.out(2)' }, 0.9);
    return tl;
  },
  idle(s) {
    const { gsap, cards, arts, hoverable } = s;
    gsap.set([...cards, ...arts], { clearProps: 'opacity' });
    // Shallow 3D drift: each illustration slowly turns a few degrees, out of phase with its neighbours.
    arts.forEach((art, i) =>
      gsap.to(art, { rotationY: i % 2 ? -4 : 4, rotationX: i % 2 ? 2 : -2, duration: 4 + i * 0.5, delay: i * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut', transformPerspective: 900, transformOrigin: '50% 50%' }),
    );
    rockOrbit(s, 4, 6);
    if (!hoverable) return;
    cards.forEach((card) => {
      const art = card.querySelector<HTMLElement>('.ff__art');
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      const ax = art ? gsap.quickTo(art, 'x', { duration: 0.6, ease: 'power3.out' }) : null;
      const ay = art ? gsap.quickTo(art, 'y', { duration: 0.6, ease: 'power3.out' }) : null;
      on(s, card, 'pointermove', (e) => {
        const p = pointerIn(card, e);
        if (!p) return;
        rx(-p.dy * 5);
        ry(p.dx * 6);
        ax?.(p.dx * 14);
        ay?.(p.dy * 10);
      });
      on(s, card, 'pointerleave', () => {
        gsap.to(card, { rotationX: 0, rotationY: 0, duration: 1.1, ease: 'elastic.out(1, 0.5)' });
        ax?.(0);
        ay?.(0);
      });
    });
  },
};

const VARIANTS: Record<FxVariant, Variant> = { '1': rise, '2': wipe, '3': kinetic };
