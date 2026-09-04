import { useEffect, type RefObject } from 'react';
import { MOTION } from './illustrations';

/**
 * Motion for the feature band. As each card scrolls into view it flips up from a slight tilt and
 * its illustration builds itself from nothing — pills pop, connectors draw, figures count, cards
 * slide in — then settles into small idle loops that replay each scene's meaning: a rate
 * recalculating, a fee-free transfer, a payment travelling to the bank, a request reaching the app.
 * The headline rises when the section arrives.
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
    Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('gsap/MotionPathPlugin')])
      .then(([{ gsap }, { ScrollTrigger }, { MotionPathPlugin }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          gsap.registerPlugin(MotionPathPlugin);
          const playWhenSeen = (trigger: Element, tl: gsap.core.Timeline) => {
            const st = ScrollTrigger.create({ trigger, start: 'top 85%', once: true, onEnter: () => tl.play() });
            if (st.progress > 0) tl.play(); // already past it (a reload further down the page)
          };

          const title = gsap.timeline({ paused: true });
          // The headline lines rise out of their masks, as the hero's do.
          title.from(el.querySelectorAll('.ff__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.12 });
          playWhenSeen(el, title);

          gsap.utils.toArray<HTMLElement>('.ff__card', el).forEach((card) => {
            const il = card.querySelector<HTMLElement>('.ff__il');
            const motion = il ? MOTION[il.dataset.il ?? ''] : undefined;
            const tl = gsap.timeline({ paused: true, onComplete: () => {
              if (il && motion) motion.idle(gsap, il);
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
        revert = () => ctx.revert();
      })
      .catch(() => reveal());

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [root]);
}
