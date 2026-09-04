import { useEffect, type RefObject } from 'react';
import { MOTION } from './illustrations';

/**
 * Motion for the feature band. As each card scrolls into view it rises into place, its copy follows
 * in reading order, and its illustration builds itself element by element on one restrained ease;
 * then each scene settles into a single, deterministic story loop that shows the product doing its
 * job — a quote refreshing, a fee-free transfer landing, a payment reaching the bank, a payment
 * crossing local rails, a wallet being chosen — and rests between beats. Loops pause off screen.
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
        const observers: IntersectionObserver[] = [];
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
            const tl = gsap.timeline({
              paused: true,
              onComplete: () => {
                if (!il || !motion) return;
                // The loops run only while the card is on screen.
                const loop = motion.idle(gsap, il);
                const io = new IntersectionObserver(([e]) => (e.isIntersecting ? loop.play() : loop.pause()), { rootMargin: '60px' });
                io.observe(card);
                observers.push(io);
              },
            });
            // The card rises into place, its copy follows in reading order, and the illustration
            // builds once the card has landed.
            tl.from(card, { y: 40, opacity: 0, duration: 1.0, ease: 'expo.out' }, 0);
            tl.from(card.querySelectorAll('.ff__text, .ff__simpleCopy > .fh__btn, .ff__chip'), { y: 12, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'expo.out' }, 0.2);
            if (il && motion) motion.build(tl, il, 0.25, gsap);
            playWhenSeen(card, tl);
          });
        }, el);
        // The `from` tweens have written their start states, so the CSS hold can go.
        reveal();
        revert = () => {
          observers.forEach((io) => io.disconnect());
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
