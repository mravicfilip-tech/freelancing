import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Swaps the hero's words when the slider moves.
 *
 * The graphic cross-fades over most of a second, so the copy beside it cannot simply pop — it has
 * to leave and arrive in the same idiom the entrance uses, which is the headline rising through
 * masks. That makes the change two beats with the text swap in between, so this returns the slide
 * whose words should currently be on screen rather than the one the slider is pointing at: the
 * caller renders `shown`, and it only catches up once the outgoing copy has cleared its masks.
 *
 * The lines are deliberately left translated out of view across the swap instead of being reset.
 * React reuses the same nodes (their structure is identical from slide to slide), so the incoming
 * words mount already outside the mask and rise in from there — nothing is ever visible at rest in
 * the wrong place, not even for the frame it takes the dynamic gsap import to resolve.
 */
export function useSlideCopy(root: RefObject<HTMLElement | null>, slide: number): number {
  const [shown, setShown] = useState(slide);
  /* The page-load sequence owns the first appearance of this copy (see useHeroEntrance); animating
     it again here would fight that timeline for the same elements. */
  const entered = useRef(false);

  // ---- Out: the current words leave through the top of their masks ----
  useEffect(() => {
    if (shown === slide) return;
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(slide);
      return;
    }
    let cancelled = false;
    import('gsap').then(({ gsap }) => {
      if (cancelled) return;
      gsap
        .timeline({ onComplete: () => !cancelled && setShown(slide) })
        .to(el.querySelectorAll('.fh__lineInner'), { yPercent: -110, duration: 0.36, ease: 'power3.in', stagger: 0.05 }, 0)
        .to(el.querySelectorAll('.fh__body, .fh__intro .fh__btn'), { y: -8, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.04);
    });
    return () => {
      cancelled = true;
    };
  }, [slide, shown, root]);

  // ---- In: the new words rise back into place ----
  useEffect(() => {
    if (!entered.current) {
      entered.current = true;
      return;
    }
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let ctx: gsap.Context | undefined;
    import('gsap').then(({ gsap }) => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        /* fromTo, not from: the elements are sitting at -110 from the out-beat, and the start has
           to be stated rather than read off them in case a reduced-motion swap skipped it. */
        gsap.fromTo(
          '.fh__lineInner',
          { yPercent: 110 },
          { yPercent: 0, duration: 0.85, ease: 'power4.out', stagger: 0.1, clearProps: 'transform' },
        );
        gsap.fromTo(
          '.fh__body',
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.12, clearProps: 'transform,opacity' },
        );
        gsap.fromTo(
          '.fh__intro .fh__btn',
          { y: 12, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.6)', delay: 0.18, clearProps: 'transform,opacity' },
        );
      }, el);
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [shown, root]);

  return shown;
}
