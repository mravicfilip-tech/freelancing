import { useEffect, type RefObject } from 'react';

/**
 * Entrance for the how-to-buy band, built like the FAQ's: the heading rises out of its mask, the
 * gutter rule draws down between the cells, and the steps arrive top to bottom with the panel behind them.
 */
export function useHowToBuyMotion(root: RefObject<HTMLElement | null>) {
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
          tl.from(el.querySelectorAll('.hb__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.08 }, 0);
          tl.from(el.querySelector('.hb__intro'), { opacity: 0, y: 12, duration: 0.7, ease: 'power3.out' }, 0.35);
          tl.from(el.querySelectorAll('.hb__step'), { opacity: 0, y: 18, duration: 0.75, ease: 'expo.out', stagger: 0.07 }, 0.45);
          tl.from(el.querySelector('.hb__card'), { opacity: 0, y: 18, duration: 0.75, ease: 'expo.out' }, 0.5);

          const st = ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: () => tl.play() });
          if (st.progress > 0) tl.play();
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
