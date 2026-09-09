import { useEffect, type RefObject } from 'react';

/**
 * Entrance for the credentials band: the heading rises out of its mask, the lattice draws itself —
 * rules across, then down — and the cells' contents and the ledger arrive in reading order.
 */
export function useAuditsMotion(root: RefObject<HTMLElement | null>) {
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
          tl.from(el.querySelectorAll('.av__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.08 }, 0);
          tl.from(el.querySelector('.av__intro'), { opacity: 0, y: 12, duration: 0.7, ease: 'power3.out' }, 0.35);
          tl.from(el.querySelectorAll('.av__ruleH'), { scaleX: 0, duration: 1.1, ease: 'expo.inOut', stagger: 0.06 }, 0.2);
          tl.from(el.querySelectorAll('.av__ruleV'), { scaleY: 0, duration: 0.9, ease: 'expo.inOut', stagger: 0.06 }, 0.35);
          tl.from(el.querySelectorAll('.av__cell > :not(i)'), { opacity: 0, y: 16, duration: 0.7, ease: 'expo.out', stagger: 0.05 }, 0.5);
          tl.from(el.querySelectorAll('.av__field'), { opacity: 0, y: 12, duration: 0.6, ease: 'expo.out', stagger: 0.07 }, 0.8);

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
