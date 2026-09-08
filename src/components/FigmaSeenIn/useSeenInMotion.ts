import { useEffect, type RefObject } from 'react';

/**
 * Entrance for the "As seen in" lattice. The heading rises out of its mask as the other bands' do;
 * then the lattice draws itself — the top rule runs across, the verticals drop from it, the row
 * rules follow — and each mark is uncovered from below in reading order, so the wall assembles as
 * a drawing rather than a fade.
 */
export function useSeenInMotion(root: RefObject<HTMLElement | null>) {
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
    let io: IntersectionObserver | null = null;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({ paused: true });
          tl.from(el.querySelectorAll('.sn__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out' }, 0);

          // The lattice draws in: across, then down, then the rows.
          tl.from(el.querySelector('.sn__ruleH--top'), { scaleX: 0, duration: 1.1, ease: 'expo.inOut' }, 0.1);
          tl.from(el.querySelectorAll('.sn__ruleV'), { scaleY: 0, duration: 0.8, ease: 'expo.out', stagger: { each: 0.05, from: 'start' } }, 0.55);
          el.querySelectorAll('.sn__row').forEach((row, r) => {
            tl.from(row.querySelectorAll('.sn__ruleH'), { scaleX: 0, duration: 0.9, ease: 'expo.inOut', stagger: 0.06 }, 0.5 + r * 0.22);
          });

          // Each mark is uncovered from below, in reading order.
          tl.fromTo(
            el.querySelectorAll('.sn__mark'),
            { clipPath: 'inset(100% 0% 0% 0%)', y: 14 },
            { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'clipPath,transform' },
            0.85,
          );

          // A mouse lifts each mark as it passes it; a finger has no equivalent, so on a coarse
          // pointer the lattice lights itself in reading order instead — the same beat the hover
          // gives, taken over by the page. It rests whenever the band is off screen.
          if (window.matchMedia('(hover: none)').matches) {
            const marks = el.querySelectorAll('.sn__mark');
            const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.2, paused: true });
            marks.forEach((m, i) => {
              loop.to(m, { opacity: 1, duration: 0.45, ease: 'sine.out' }, i * 0.7);
              loop.to(m, { opacity: 0.32, duration: 0.7, ease: 'sine.inOut' }, i * 0.7 + 0.95);
            });
            let seen = false;
            io = new IntersectionObserver(
              ([e]) => {
                seen = e.isIntersecting;
                if (seen && tl.progress() === 1) loop.play();
                else loop.pause();
              },
              { rootMargin: '60px' },
            );
            io.observe(el);
            tl.eventCallback('onComplete', () => { if (seen) loop.play(); });
          }

          const st = ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: () => tl.play() });
          if (st.progress > 0) tl.play();
        }, el);
        // The `from` tweens have written their start states, so the CSS hold can go.
        reveal();
        revert = () => {
          io?.disconnect();
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
