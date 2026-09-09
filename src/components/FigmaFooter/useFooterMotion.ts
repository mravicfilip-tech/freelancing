import { useEffect, type RefObject } from 'react';

/**
 * Entrance for the footer. The closing line rises out of its mask the way the hero's title does,
 * the two rules draw across, and the blocks between them settle in reading order.
 */
export function useFooterMotion(root: RefObject<HTMLElement | null>) {
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
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({ paused: true });
          tl.from(el.querySelectorAll('.ft__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.08 }, 0);
          tl.from(el.querySelector('.ft__cta .fh__btn'), { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out' }, 0.45);
          tl.from(el.querySelector('.ft__identity'), { opacity: 0, y: 16, duration: 0.7, ease: 'power3.out' }, 0.55);
          tl.from(el.querySelectorAll('.ft__rule'), { scaleX: 0, duration: 1, ease: 'expo.inOut', stagger: 0.12 }, 0.6);
          tl.from(el.querySelectorAll('.ft__col'), { opacity: 0, y: 16, duration: 0.7, ease: 'expo.out', stagger: 0.07 }, 0.7);
          const st = ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tl.play() });
          if (st.progress > 0) tl.play();

          // The closing lines are a thousand pixels below the footer's own fire point on a phone,
          // so on that timeline they had faded in and finished before they were ever on screen.
          // They wait for themselves instead.
          const legal = el.querySelector('.ft__legal');
          const tail = gsap.timeline({ paused: true });
          tail.from(el.querySelector('.ft__small'), { opacity: 0, duration: 0.6, ease: 'power2.out' }, 0);
          tail.from(legal, { opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.15);
          const stTail = ScrollTrigger.create({ trigger: legal, start: 'top 98%', once: true, onEnter: () => tail.play() });
          if (stTail.progress > 0) tail.play();
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
