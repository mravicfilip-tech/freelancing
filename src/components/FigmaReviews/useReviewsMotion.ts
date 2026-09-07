import { useCallback, useEffect, useRef, type RefObject } from 'react';

/**
 * Motion for the Community Reviews slider. The heading rises out of its mask and the slide frame
 * fades up when the section scrolls into view, matching the other bands. Changing slide is a wipe,
 * not a crossfade: the incoming frame is uncovered by an edge that sweeps across the slider, a lit
 * seam rides that edge, and the two photographs counter-drift behind it so the frames read as one
 * camera pan. The quote is then uncovered by its own mask.
 */
export function useReviewsMotion(root: RefObject<HTMLElement | null>, slide: number) {
  const gsapRef = useRef<typeof import('gsap')['gsap'] | null>(null);
  const readyRef = useRef(false);
  const shownRef = useRef(-1);
  /** The wipe in flight. Killed when another starts, so its clean-up can't hide the new slide. */
  const wipeRef = useRef<gsap.core.Timeline | null>(null);

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

  /**
   * Wipes to slide `i`. The reveal edge travels the way the deck is moving — leftward when going
   * forward, rightward when going back — with the photographs counter-drifting either side of it.
   */
  const show = useCallback((i: number) => {
    const el = root.current;
    const gsap = gsapRef.current;
    if (!el || !gsap || shownRef.current === i) return;
    const all = Array.from(el.querySelectorAll<HTMLElement>('.rv__slide'));
    const next = all[i];
    if (!next) return;
    const prev = all[shownRef.current];
    const from = shownRef.current;
    shownRef.current = i;

    // Take the short way round the deck, so chip 3 → chip 1 wipes forward rather than back.
    const len = all.length;
    const dir = from < 0 || (i - from + len) % len <= (from - i + len) % len ? 1 : -1;
    const width = el.querySelector('.rv__slider')?.clientWidth ?? 0;
    const seam = el.querySelector<HTMLElement>('.rv__seam');
    const photo = (s: HTMLElement | undefined) => s?.querySelector('.rv__photo') ?? null;

    const covered = dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
    const open = 'inset(0% 0% 0% 0%)';
    const SWEEP = 1.05;

    // Land any wipe still running before starting this one: its own clean-up would otherwise fire
    // later and hide whichever slide is current by then, leaving the slider blank.
    wipeRef.current?.kill();
    gsap.killTweensOf([...all, ...all.map(photo), seam].filter(Boolean) as object[]);
    all.forEach((s) => {
      const on = s === prev;
      gsap.set(s, { clipPath: 'none', zIndex: on ? 1 : 0, opacity: on ? 1 : 0, visibility: on ? 'visible' : 'hidden' });
      gsap.set(photo(s), { xPercent: 0, scale: 1 });
    });

    const tl = gsap.timeline();
    wipeRef.current = tl;
    gsap.set(next, { zIndex: 2, visibility: 'visible', opacity: 1, clipPath: covered });

    tl.to(next, { clipPath: open, duration: SWEEP, ease: 'expo.inOut' }, 0);
    // Each photograph moves against the edge, so neither one slides with it like a slat.
    tl.fromTo(photo(next), { xPercent: 9 * dir, scale: 1.07 }, { xPercent: 0, scale: 1, duration: 1.5, ease: 'expo.out' }, 0);
    if (prev) tl.to(photo(prev), { xPercent: -7 * dir, duration: SWEEP, ease: 'expo.inOut' }, 0);

    // A lit seam rides the reveal edge across the frame.
    if (seam && width) {
      tl.fromTo(
        seam,
        { x: dir > 0 ? width : 0, opacity: 0 },
        { x: dir > 0 ? 0 : width, opacity: 1, duration: SWEEP, ease: 'expo.inOut' },
        0,
      );
      tl.to(seam, { opacity: 0, duration: 0.3, ease: 'power2.out' }, SWEEP - 0.22);
    }

    // The quote is uncovered by its own mask once the edge has passed over it.
    tl.fromTo(next.querySelector('.rv__eyebrow'), { x: 26 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }, 0.34);
    tl.fromTo(
      next.querySelector('.rv__words'),
      { clipPath: 'inset(0% 0% 100% 0%)', y: 26 },
      { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.0, ease: 'expo.out' },
      0.4,
    );
    tl.fromTo(next.querySelector('.rv__by'), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out' }, 0.62);

    tl.add(() => {
      // Settle on the arrived slide: everything else is put away, whatever it was mid-wipe.
      all.forEach((s) => {
        if (s === next) return;
        gsap.set(s, { opacity: 0, visibility: 'hidden', clipPath: 'none', zIndex: 0 });
        gsap.set(photo(s), { xPercent: 0, scale: 1 });
      });
      gsap.set(next, { clipPath: 'none', zIndex: 1 });
      wipeRef.current = null;
    });
  }, [root]);

  useEffect(() => {
    if (readyRef.current) show(slide);
  }, [slide, show]);

  return { go: show };
}
