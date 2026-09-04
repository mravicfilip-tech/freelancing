import { useEffect, type RefObject } from 'react';
import { all, bob, draw, one, pop, rand } from '../FigmaFeatures/illustrations/motion';

/**
 * Motion for the "made simple" section, in the feature band's manner. When the section scrolls into
 * view the headline rises, then the diagram builds piece by piece: the orbit draws itself, the hub
 * pops with its glow, the currency groups and their coins pop on, the pay-in and pay-out chips
 * arrive, the markers and dots appear, and the cursor slides in with its badge; the paragraph and
 * pill rise last. Afterwards a highlight keeps circling the orbit, the hub breathes, the coin groups
 * drift, the markers ping and the cursor nudges its badge now and then.
 *
 * The section renders with `data-motion="pending"`, which hides the animated parts in CSS; the
 * attribute is cleared in the same frame GSAP takes over. Reduced motion shows it at rest.
 */
export function useSimpleMotion(root: RefObject<HTMLElement | null>) {
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
          const orbit = one(el, '.fs__orbit');
          const ringPath = one<SVGPathElement>(el, '.fs__ring path');
          const hub = one(el, '.fs__hub');
          const cursor = one(el, '.fs__cursor');
          const badge = one(el, '.fs__badge');
          const groups = all(el, '.fs__group');
          const markers = all(el, '.fs__marker');

          const tl = gsap.timeline({ paused: true, onComplete: idle });
          tl.from(one(el, '.fs__title'), { y: 40, rotationX: -18, opacity: 0, duration: 1.0, ease: 'back.out(1.4)', transformOrigin: '50% 100%', transformPerspective: 900 }, 0);
          draw(tl, gsap, [ringPath], 0.3, 1.4);
          pop(tl, hub, 0.7, { scale: 0.5, duration: 0.8 });
          tl.from(one(el, '.fs__glow'), { opacity: 0, scale: 0.7, duration: 1.0, ease: 'power2.out' }, 0.9);
          groups.forEach((g, i) => {
            pop(tl, g, 1.0 + i * 0.18, { scale: 0.8, y: 12, duration: 0.6 });
            tl.from(all(g, '.fs__coin'), { scale: 0, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 1.15 + i * 0.18);
          });
          pop(tl, all(el, '.fs__chip'), 1.3, { stagger: 0.15, scale: 0.7 });
          pop(tl, [...all(el, '.fs__dot'), ...markers], 1.6, { scale: 0, stagger: 0.08, duration: 0.45 });
          tl.from(cursor, { x: 40, y: 40, opacity: 0, duration: 0.7, ease: 'power3.out' }, 1.7);
          tl.from(badge, { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(1.8)', transformOrigin: '0% 50%' }, 2.0);
          tl.from(all(el, '.fs__body, .fs__pill'), { y: 18, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' }, 1.8);

          const st = ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: () => tl.play() });
          if (st.progress > 0) tl.play();

          function idle() {
            // A highlight circles the orbit for as long as the section lives.
            const len = ringPath.getTotalLength();
            const glowPath = ringPath.cloneNode() as SVGPathElement;
            glowPath.setAttribute('stroke', '#4042d2');
            glowPath.setAttribute('stroke-width', '2');
            glowPath.setAttribute('stroke-linecap', 'round');
            glowPath.classList.add('fs__ringGlow');
            ringPath.parentElement!.appendChild(glowPath);
            gsap.set(glowPath, { strokeDasharray: `${len * 0.12} ${len * 0.88}`, strokeDashoffset: 0, opacity: 0.9 });
            gsap.to(glowPath, { strokeDashoffset: -len, duration: 9, ease: 'none', repeat: -1 });
            gsap.set(ringPath, { strokeDasharray: 'none', strokeDashoffset: 0 });

            gsap.to(hub, { scale: 1.04, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' });
            gsap.to(one(orbit, '.fs__glow'), { opacity: 0.6, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
            groups.forEach((g, i) => bob(gsap, g, 4, 3.2 + i * 0.5, i * 0.7));
            all(orbit, '.fs__chip').forEach((c, i) => bob(gsap, c, 3, 3.6 + i * 0.4, 0.5 + i));
            all(orbit, '.fs__dot').forEach((d, i) => gsap.to(d, { scale: 1.5, opacity: 0.5, duration: 1.1, delay: i * 0.9, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' }));
            const ping = (i: number) => {
              gsap.fromTo(markers[i], { boxShadow: '0 0 0 0 rgba(64, 66, 210, 0.35)' }, { boxShadow: '0 0 0 16px rgba(64, 66, 210, 0)', duration: 1.2, ease: 'power2.out' });
              gsap.delayedCall(rand(2.5, 4), () => ping((i + 1) % markers.length));
            };
            gsap.delayedCall(1.2, () => ping(0));
            const nudge = () => {
              gsap.timeline()
                .to(cursor, { x: -6, y: -6, duration: 0.35, ease: 'power2.inOut' })
                .fromTo(badge, { scale: 1 }, { scale: 1.06, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '0% 50%' }, 0.2)
                .to(cursor, { x: 0, y: 0, duration: 0.5, ease: 'power2.inOut' }, 0.7);
              gsap.delayedCall(rand(3.5, 5.5), nudge);
            };
            gsap.delayedCall(2, nudge);
          }
        }, el);
        reveal();
        revert = () => {
          el.querySelectorAll('.fs__ringGlow').forEach((n) => n.remove());
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
