import { useCallback, useEffect, useRef, type RefObject } from 'react';

/**
 * Motion for the Community Reviews slider. The heading rises out of its mask and the slide frame
 * fades up when the section scrolls into view, matching the other bands. Changing slide crossfades
 * the photo and lifts the quote in behind it; the photo also settles from a slight scale, so the
 * change reads as a camera move rather than a hard cut.
 */
export function useReviewsMotion(root: RefObject<HTMLElement | null>, slide: number) {
  const gsapRef = useRef<typeof import('gsap')['gsap'] | null>(null);
  const readyRef = useRef(false);
  const shownRef = useRef(-1);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reveal = () => {
      delete el.dataset.motion;
    };
    const slides = () => Array.from(el.querySelectorAll<HTMLElement>('.rv__slide'));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
      readyRef.current = true;
      slides().forEach((s, i) => {
        s.style.visibility = i === 0 ? 'visible' : 'hidden';
        s.style.opacity = i === 0 ? '1' : '0';
      });
      shownRef.current = 0;
      return;
    }

    let cancelled = false;
    let revert: (() => void) | null = null;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        gsapRef.current = gsap;
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({ paused: true, onComplete: () => { readyRef.current = true; } });
          tl.from(el.querySelectorAll('.rv__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out' }, 0);
          tl.from(el.querySelector('.rv__slider'), { y: 40, opacity: 0, duration: 1.0, ease: 'expo.out' }, 0.15);
          const first = slides()[0];
          if (first) {
            gsap.set(first, { visibility: 'visible', opacity: 1 });
            tl.from(first.querySelector('.rv__photo'), { scale: 1.06, duration: 1.6, ease: 'expo.out' }, 0.15);
            tl.from(first.querySelectorAll('.rv__eyebrow, .rv__quoteBlock'), { y: 16, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.1 }, 0.45);
            tl.from(el.querySelectorAll('.rv__chip'), { y: 14, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, 0.6);
          }
          shownRef.current = 0;
          const st = ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: () => tl.play() });
          if (st.progress > 0) tl.play();
        }, el);
        reveal();
        revert = () => ctx.revert();
      })
      .catch(() => {
        reveal();
        slides().forEach((s, i) => {
          s.style.visibility = i === 0 ? 'visible' : 'hidden';
          s.style.opacity = i === 0 ? '1' : '0';
        });
      });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, [root]);

  /** Crossfades to slide `i`: the outgoing frame falls away, the incoming photo settles in. */
  const show = useCallback((i: number) => {
    const el = root.current;
    const gsap = gsapRef.current;
    if (!el || !gsap || shownRef.current === i) return;
    const all = Array.from(el.querySelectorAll<HTMLElement>('.rv__slide'));
    const prev = all[shownRef.current];
    const next = all[i];
    if (!next) return;
    shownRef.current = i;
    if (prev) gsap.to(prev, { opacity: 0, duration: 0.55, ease: 'power2.inOut', onComplete: () => { prev.style.visibility = 'hidden'; } });
    next.style.visibility = 'visible';
    gsap.fromTo(next, { opacity: 0 }, { opacity: 1, duration: 0.65, ease: 'power2.inOut' });
    gsap.fromTo(next.querySelector('.rv__photo'), { scale: 1.05 }, { scale: 1, duration: 1.5, ease: 'expo.out' });
    gsap.fromTo(
      next.querySelectorAll('.rv__eyebrow, .rv__quoteBlock'),
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.09, delay: 0.12 },
    );
  }, [root]);

  useEffect(() => {
    if (readyRef.current) show(slide);
  }, [slide, show]);

  return { go: show };
}
