import { useEffect, type RefObject } from 'react';
import { MOTION } from './illustrations';

type Gsap = typeof import('gsap')['gsap'];

/**
 * Motion for the feature band. As each card scrolls into view it flips up from a slight tilt and
 * its illustration builds itself from nothing — pills pop, connectors draw, figures count, cards
 * slide in — then settles into small idle loops. Cards tilt toward the cursor, their artwork
 * counter-moving. The headline rises when the section arrives.
 *
 * The section renders with `data-motion="pending"`, which hides the animated parts in CSS; the
 * attribute is cleared in the same frame GSAP takes over. Reduced motion shows the band at rest.
 */
export function useFeaturesMotion(root: RefObject<HTMLElement | null>) {
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
          const hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
          const playWhenSeen = (trigger: Element, tl: gsap.core.Timeline) => {
            const st = ScrollTrigger.create({ trigger, start: 'top 85%', once: true, onEnter: () => tl.play() });
            if (st.progress > 0) tl.play(); // already past it (a reload further down the page)
          };

          const title = gsap.timeline({ paused: true });
          title.from(el.querySelector('.ff__title'), { y: 40, rotationX: -18, opacity: 0, duration: 1.0, ease: 'back.out(1.4)', transformOrigin: '50% 100%', transformPerspective: 900 });
          playWhenSeen(el, title);

          gsap.utils.toArray<HTMLElement>('.ff__card', el).forEach((card) => {
            const il = card.querySelector<HTMLElement>('.ff__il');
            const motion = il ? MOTION[il.dataset.il ?? ''] : undefined;
            const tl = gsap.timeline({ paused: true, onComplete: () => {
              if (il && motion) motion.idle(gsap, il);
              if (hoverable) tilt(gsap, card, il, cleanups);
            } });
            gsap.set(card, { transformPerspective: 1200 });
            tl.from(card, { y: 70, rotationX: 14, opacity: 0, duration: 1.1, ease: 'back.out(1.3)', transformOrigin: '50% 100%' }, 0);
            tl.from(card.querySelectorAll('.ff__text, .ff__simpleCopy > .fh__btn'), { y: 18, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 0.4);
            const chip = card.querySelector('.ff__chip');
            if (chip) tl.from(chip, { rotation: -90, scale: 0.6, opacity: 0, duration: 0.8, ease: 'back.out(2)' }, 0.8);
            if (il && motion) motion.build(tl, il, 0.35, gsap);
            playWhenSeen(card, tl);
          });
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
  }, [root]);
}

/** The card tilts toward the cursor and the illustration counter-moves; both spring back on leave. */
function tilt(gsap: Gsap, card: HTMLElement, il: HTMLElement | null, cleanups: Array<() => void>) {
  const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
  const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
  const ax = il ? gsap.quickTo(il, 'x', { duration: 0.6, ease: 'power3.out' }) : null;
  const ay = il ? gsap.quickTo(il, 'y', { duration: 0.6, ease: 'power3.out' }) : null;
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const dy = ((e.clientY - r.top) / r.height) * 2 - 1;
    rx(-dy * 5);
    ry(dx * 6);
    ax?.(dx * 12);
    ay?.(dy * 8);
  };
  const leave = () => {
    gsap.to(card, { rotationX: 0, rotationY: 0, duration: 1.1, ease: 'elastic.out(1, 0.5)' });
    ax?.(0);
    ay?.(0);
  };
  card.addEventListener('pointermove', move);
  card.addEventListener('pointerleave', leave);
  cleanups.push(() => {
    card.removeEventListener('pointermove', move);
    card.removeEventListener('pointerleave', leave);
  });
}
