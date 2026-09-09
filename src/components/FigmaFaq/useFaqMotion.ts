import { useEffect, type RefObject } from 'react';

/**
 * Entrance for the FAQ band. The heading rises out of its mask as the other bands' do, the gutter
 * rule draws down between the columns, and the rows arrive in reading order — each row's rule
 * running across just ahead of its question — so the section assembles as a drawing.
 */
export function useFaqMotion(root: RefObject<HTMLElement | null>) {
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
          tl.from(el.querySelectorAll('.fq__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.08 }, 0);
          tl.from(el.querySelector('.fq__intro'), { opacity: 0, y: 12, duration: 0.7, ease: 'power3.out' }, 0.35);
          // One column on a phone, so there is no gutter to draw: skip the beat rather than spend
          // 1.1s of the entrance on an element that is display:none.
          const gutter = el.querySelector('.fq__gutter');
          if (gutter && gutter.getClientRects().length) {
            tl.from(gutter, { scaleY: 0, duration: 1.1, ease: 'expo.inOut' }, 0.25);
          }

          // Rows in reading order: left column top to bottom, then the right.
          const items = el.querySelectorAll('.fq__item');
          tl.from(items, { opacity: 0, y: 18, duration: 0.75, ease: 'expo.out', stagger: 0.07 }, 0.45);

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
