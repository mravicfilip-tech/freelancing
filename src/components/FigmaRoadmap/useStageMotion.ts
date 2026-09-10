import { useEffect, type RefObject } from 'react';

/**
 * Entrance for the roadmap stage. The heading rises out of its mask as the other bands' do, the
 * centre rail draws down, the seven levels arrive in order, and the cards fade up behind them —
 * so the stage assembles the way it is read.
 */
export function useStageMotion(root: RefObject<HTMLElement | null>) {
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
          tl.from(el.querySelectorAll('.rs__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out' }, 0);
          tl.from(el.querySelectorAll('.rs__railLine'), { scaleY: 0, transformOrigin: '50% 0', duration: 1.1, ease: 'expo.inOut' }, 0.25);
          tl.from(el.querySelectorAll('.rs__level, .rs__hItem'), { opacity: 0, x: 24, duration: 0.7, ease: 'expo.out', stagger: 0.07 }, 0.35);
          tl.from(el.querySelectorAll('.rs__cards'), { opacity: 0, y: 24, duration: 0.9, ease: 'expo.out' }, 0.5);

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
