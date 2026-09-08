import { useCallback, useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { SCENES } from './illustrations';

/** How long each pillar stays active before the accordion advances on its own. */
const CYCLE = 7;

/**
 * Motion for the Ecosystem section. The card rises in when it scrolls into view and the copy,
 * accordion and panel follow; then the active pillar's illustration builds and settles into its
 * loop. The accordion advances by itself every CYCLE seconds (the accent fills as a progress
 * bar), pauses while the list is hovered or the section is off screen, and any item can be
 * clicked. Switching pillars crossfades the illustrations: the old one lifts away, the new one
 * rises, builds and loops.
 */
export function useEcosystemMotion(root: RefObject<HTMLElement | null>, active: number, setActive: Dispatch<SetStateAction<number>>) {
  const gsapRef = useRef<typeof import('gsap')['gsap'] | null>(null);
  const loopRef = useRef<gsap.core.Timeline | null>(null);
  const progressRef = useRef<gsap.core.Tween | null>(null);
  const shownRef = useRef<number>(-1);
  const readyRef = useRef(false);
  const visibleRef = useRef(true);
  const hoverRef = useRef(false);

  // Load-in, once.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reveal = () => {
      delete el.dataset.motion;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
      readyRef.current = true;
      el.querySelectorAll<HTMLElement>('.ec__scene').forEach((s, i) => {
        s.style.visibility = i === 0 ? 'visible' : 'hidden';
        s.style.opacity = i === 0 ? '1' : '0';
      });
      return;
    }
    let cancelled = false;
    let revert: (() => void) | null = null;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('gsap/MotionPathPlugin')])
      .then(([{ gsap }, { ScrollTrigger }, { MotionPathPlugin }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
        gsapRef.current = gsap;
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({ paused: true, onComplete: () => { readyRef.current = true; show(0, true); } });
          tl.from(el.querySelector('.ec__card'), { y: 40, opacity: 0, duration: 1.0, ease: 'expo.out' }, 0);
          tl.from(el.querySelector('.ec__eyebrow'), { y: 8, opacity: 0, duration: 0.6, ease: 'expo.out' }, 0.2);
          tl.from(el.querySelectorAll('.ec__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.12 }, 0.25);
          tl.from(el.querySelector('.ec__body'), { y: 12, opacity: 0, duration: 0.7, ease: 'expo.out' }, 0.5);
          tl.from(el.querySelectorAll('.ec__item'), { y: 12, opacity: 0, duration: 0.7, stagger: 0.07, ease: 'expo.out' }, 0.6);
          const panel = el.querySelector('.ec__panel');
          if (panel) tl.from(panel, { opacity: 0, duration: 0.9, ease: 'power1.out' }, 0.3);
          const st = ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: () => tl.play() });
          if (st.progress > 0) tl.play();
        }, el);
        reveal();
        revert = () => ctx.revert();
      })
      .catch(() => reveal());
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      if (e.isIntersecting) resume();
      else pause();
    }, { rootMargin: '60px' });
    io.observe(el);
    const list = el.querySelector('.ec__list');
    const onEnter = () => { hoverRef.current = true; pause(); };
    const onLeave = () => { hoverRef.current = false; resume(); };
    list?.addEventListener('pointerenter', onEnter);
    list?.addEventListener('pointerleave', onLeave);
    return () => {
      cancelled = true;
      io.disconnect();
      list?.removeEventListener('pointerenter', onEnter);
      list?.removeEventListener('pointerleave', onLeave);
      loopRef.current?.kill();
      progressRef.current?.kill();
      revert?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root]);

  const pause = () => {
    loopRef.current?.pause();
    progressRef.current?.pause();
  };
  const resume = () => {
    if (!visibleRef.current || hoverRef.current) return;
    loopRef.current?.play();
    progressRef.current?.play();
  };

  /** Shows pillar `i`: crossfades the scenes, builds the new illustration, starts its loop and the progress accent. */
  const show = useCallback((i: number, first = false) => {
    const el = root.current;
    const gsap = gsapRef.current;
    if (!el || !gsap || !readyRef.current) return;
    if (shownRef.current === i) return;
    const scenes = Array.from(el.querySelectorAll<HTMLElement>('.ec__scene'));
    const prev = scenes[shownRef.current];
    const next = scenes[i];
    shownRef.current = i;
    loopRef.current?.kill();
    loopRef.current = null;
    progressRef.current?.kill();
    if (prev) gsap.to(prev, { opacity: 0, y: -14, duration: 0.35, ease: 'power2.in', onComplete: () => { prev.style.visibility = 'hidden'; } });
    next.style.visibility = 'visible';
    gsap.fromTo(next, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: first ? 0.8 : 0.6, ease: 'expo.out', delay: prev ? 0.2 : 0 });
    const il = next.querySelector<HTMLElement>('.ff__il')!;
    const scene = SCENES[next.dataset.scene ?? ''];
    const tl = gsap.timeline({
      delay: prev ? 0.25 : 0.1,
      onComplete: () => {
        if (shownRef.current !== i) return;
        const loop = scene.idle(gsap, il);
        loopRef.current = loop;
        if (!visibleRef.current || hoverRef.current) loop.pause();
      },
    });
    scene.build(tl, il, 0, gsap);
    // The accent fills over the cycle, then the next pillar takes over.
    const bar = el.querySelectorAll<HTMLElement>('.ec__progress')[i];
    el.querySelectorAll<HTMLElement>('.ec__progress').forEach((b) => gsap.set(b, { scaleY: 0 }));
    progressRef.current = gsap.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: CYCLE, ease: 'none', onComplete: () => setActive((a) => (a + 1) % scenes.length) });
    if (!visibleRef.current || hoverRef.current) progressRef.current.pause();
  }, [root, setActive]);

  useEffect(() => {
    show(active);
  }, [active, show]);

  const select = useCallback((i: number) => setActive(i), [setActive]);
  return { select };
}
