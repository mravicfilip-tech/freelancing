import { useEffect, type RefObject } from 'react';
import type { RoadVariant } from './FigmaRoadmap';

/**
 * Entrance for the roadmap band. The heading rises out of its mask as the other bands' do, then
 * each direction assembles the way it reads: the ledger cascades level by level, the stage's
 * columns arrive along the rail, the curve draws itself and drops its nodes, the drawer stacks
 * from the back, and the wired levels climb while the meter fills.
 */
export function useRoadmapMotion(root: RefObject<HTMLElement | null>, variant: RoadVariant) {
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
          const q = (sel: string) => el.querySelectorAll(sel);
          const tl = gsap.timeline({ paused: true });
          tl.from(q('.rd__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.08 }, 0);
          tl.from(el.querySelector('.rd__intro'), { opacity: 0, y: 12, duration: 0.7, ease: 'power3.out' }, 0.35);

          if (variant === 1) {
            tl.from(q('.rd-ledger__col'), { opacity: 0, y: 14, duration: 0.6, ease: 'power3.out', stagger: 0.06 }, 0.3);
            // The chips are in level order in the DOM, so a plain stagger reads as the cascade.
            tl.from(q('.rd-chip'), { opacity: 0, x: -18, duration: 0.5, ease: 'expo.out', stagger: 0.035 }, 0.5);
          } else if (variant === 2) {
            tl.from(q('.rd-stage__col'), { opacity: 0, y: 24, duration: 0.8, ease: 'expo.out', stagger: 0.08 }, 0.35);
            tl.from(el.querySelector('.rd-stage__lit'), { scaleY: 0.82, opacity: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'expo.out' }, 0.6);
          } else if (variant === 3) {
            const lit = el.querySelector('.rd-traj__lit:not(.rd-traj__lit--halo)') as SVGPathElement | null;
            const halo = el.querySelector('.rd-traj__lit--halo') as SVGPathElement | null;
            // Draw the travelled part by growing its dash from nothing to the length it already carries.
            for (const path of [halo, lit]) {
              if (!path) continue;
              const dash = path.getAttribute('stroke-dasharray') ?? '';
              const [drawn, rest] = dash.split(' ').map(Number);
              if (!Number.isFinite(drawn)) continue;
              tl.fromTo(
                path,
                { attr: { 'stroke-dasharray': `0 ${rest}` } },
                { attr: { 'stroke-dasharray': `${drawn} ${rest}` }, duration: 1.3, ease: 'power2.inOut' },
                0.3,
              );
            }
            tl.from(q('.rd-traj__node'), { opacity: 0, y: 10, duration: 0.55, ease: 'expo.out', stagger: 0.1 }, 0.75);
          } else if (variant === 4) {
            tl.from(q('.rd-card'), { opacity: 0, y: 26, duration: 0.7, ease: 'expo.out', stagger: 0.07 }, 0.35);
          } else {
            tl.from(q('.rd-wire__row'), { opacity: 0, x: -20, duration: 0.65, ease: 'expo.out', stagger: 0.07 }, 0.35);
            tl.from(el.querySelector('.rd-meter'), { opacity: 0, y: 20, duration: 0.7, ease: 'expo.out' }, 0.5);
            tl.from(el.querySelector('.rd-meter__fill'), { height: 0, duration: 1.2, ease: 'power2.inOut' }, 0.8);
            tl.from(el.querySelector('.rd-meter__glow'), { opacity: 0, duration: 0.8, ease: 'power2.out' }, 1.2);
          }

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
  }, [root, variant]);
}
