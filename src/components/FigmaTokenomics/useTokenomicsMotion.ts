import { useEffect, type RefObject } from 'react';
import { HALOS, SEGMENTS, SEG_BY_ID, REST, WIRE_FOR, slicePath, spanOf, tourStops } from './dial';

export type TokVariant = 1 | 2 | 3 | 4 | 5;

export const TOK_VARIANTS: { name: string; blurb: string }[] = [
  { name: 'Aim', blurb: 'The gradient arc swings round the dial and resizes to each allocation’s share as it lands — 50% of the circle on presale, a sliver on rewards. The chip it points at takes the indigo.' },
  { name: 'Relay', blurb: 'Every move is paid for: a light runs in along that allocation’s own chain wire, the hub takes the hit, and only then does the arc swing across and resize onto it.' },
  { name: 'Bloom', blurb: 'The arc closes to a thin blade at the new bearing, holds a beat, then blooms open to the allocation’s full share — so the size of each slice is the thing you read.' },
  { name: 'Unroll', blurb: 'One continuous rotation: the leading edge runs ahead to the next allocation and the trailing edge catches up, so the arc stretches and contracts without ever jumping.' },
  { name: 'Snap', blurb: 'Quick and mechanical — the arc snaps to each bearing with a slight overshoot and the hub halos ripple outward on arrival, like a dial locking on.' },
];

export function useTokenomicsMotion(root: RefObject<HTMLElement | null>, variant: TokVariant = 1) {
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

    Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('gsap/MotionPathPlugin')])
      .then(([{ gsap }, { ScrollTrigger }, { MotionPathPlugin }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

        const ctx = gsap.context(() => {
          const q = (sel: string) => el.querySelectorAll(sel);
          const one = <T extends Element = HTMLElement>(sel: string) => el.querySelector(sel) as T | null;
          const slice = (id: string) => one<HTMLElement>(`[data-slice="${id}"]`);
          const wire = (id: string) => one<SVGPathElement>(`[data-wire="${id}"]`);
          const pulse = (id: string) => one<SVGCircleElement>(`[data-pulse="${id}"]`);
          const arcEl = one<SVGPathElement>('.tk__arc');
          const haloEls = HALOS.map((h) => one<SVGPathElement>(`[data-halo="${h.d}"]`));
          const stops = tourStops();
          const [rest0, rest1] = spanOf(SEG_BY_ID[REST]);

          /**
           * The one shape the whole section turns on: the gradient arc, with the two hub halos
           * following the same span. Everything below just drives these two numbers.
           */
          const arc = { a0: rest0, a1: rest1 };
          const paint = () => {
            arcEl?.setAttribute('d', slicePath(arc.a0, arc.a1));
            haloEls.forEach((h, i) => h?.setAttribute('d', slicePath(arc.a0, arc.a1, HALOS[i].d / 2)));
          };
          paint();

          const aimAt = (tl: gsap.core.Timeline, at: number, a0: number, a1: number, dur = 0.8, ease = 'power3.inOut') =>
            tl.to(arc, { a0, a1, duration: dur, ease, onUpdate: paint }, at);

          /** Marks one allocation live: its chip goes indigo, the rest stay ink. */
          const light = (tl: gsap.core.Timeline, at: number, id: string | null) =>
            tl.call(
              () => {
                SEGMENTS.forEach((s) => slice(s.id)?.toggleAttribute('data-on', s.id === id));
                el.dataset.live = id ?? '';
              },
              undefined,
              at,
            );

          /** Counts a percentage up to its value. */
          const count = (id: string, tl: gsap.core.Timeline, at: number, dur = 0.5) => {
            const node = slice(id)?.querySelector('.tk__pct b') as HTMLElement | null;
            if (!node) return;
            const to = Number(node.dataset.pct ?? 0);
            const proxy = { v: 0 };
            tl.set(node, { textContent: '0%' }, at);
            tl.to(proxy, {
              v: to,
              duration: dur,
              ease: 'power2.out',
              onUpdate: () => {
                node.textContent = `${Math.round(proxy.v)}%`;
              },
            }, at);
          };

          /** Sends a light along one wire. `dir` 1 runs inward to the hub, -1 runs back out. */
          const runWire = (id: string, tl: gsap.core.Timeline, at: number, dur = 0.9, dir: 1 | -1 = 1) => {
            const dot = pulse(id);
            const path = wire(id);
            if (!dot || !path) return;
            tl.set(dot, { opacity: 0 }, at);
            tl.to(dot, { opacity: 1, duration: 0.14 }, at);
            tl.to(dot, {
              motionPath: { path, start: dir === 1 ? 0 : 1, end: dir === 1 ? 1 : 0 },
              duration: dur,
              ease: dir === 1 ? 'power1.in' : 'power1.out',
            }, at);
            tl.to(dot, { opacity: 0, duration: 0.2 }, at + dur - 0.05);
          };

          const knock = (tl: gsap.core.Timeline, at: number) => {
            tl.to(one('.tk__hubDisc'), { scale: 1.07, duration: 0.14, ease: 'power2.out', transformOrigin: '50% 50%' }, at);
            tl.to(one('.tk__hubDisc'), { scale: 1, duration: 0.34, ease: 'elastic.out(1, 0.5)' }, at + 0.14);
          };

          // ---- Entrance ---------------------------------------------------------------------
          const tl = gsap.timeline({ paused: true });
          tl.from(q('.tk__lineInner'), { yPercent: 110, duration: 1, ease: 'power4.out' }, 0);
          tl.from(one('.tk__sub'), { opacity: 0, y: 10, duration: 0.6, ease: 'power3.out' }, 0.3);
          tl.from(one('.tk__ring'), { scale: 0.88, opacity: 0, duration: 0.8, ease: 'expo.out', transformOrigin: '50% 50%' }, 0.25);
          tl.from(one('.tk__hub'), { scale: 0.7, opacity: 0, duration: 0.7, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 0.35);
          // The arc opens from a blade at presale's bearing to its full 50% span.
          tl.fromTo(arc, { a0: 180, a1: 180 }, { a0: rest0, a1: rest1, duration: 1, ease: 'expo.out', onUpdate: paint }, 0.45);
          tl.fromTo(q('.tk__wire'), { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.05 }, 0.5);
          tl.from(q('.tk__coin'), { scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.06 }, 0.6);
          tl.from(q('.tk__slice'), { opacity: 0, y: 10, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, 0.7);
          SEGMENTS.forEach((s, i) => count(s.id, tl, 0.75 + i * 0.06));
          light(tl, 1.1, REST);
          tl.from(one('.tk__facts'), { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out' }, 1.2);

          // ---- The cycle --------------------------------------------------------------------
          const loop = gsap.timeline({ repeat: -1, paused: true });
          const HOLD = 1.1;

          if (variant === 1) {
            // Aim — swing and resize onto each allocation in turn.
            let at = 0;
            stops.forEach((s) => {
              aimAt(loop, at, s.a0, s.a1, 0.85);
              light(loop, at + 0.5, s.id);
              count(s.id, loop, at + 0.5);
              at += 0.85 + HOLD;
            });
            aimAt(loop, at, rest0 - 360, rest1 - 360, 0.9);
            light(loop, at + 0.5, REST);
            loop.to({}, { duration: HOLD }, at + 0.9);
          }

          if (variant === 2) {
            // Relay — the chain pays first, then the arc moves.
            let at = 0;
            stops.forEach((s) => {
              runWire(WIRE_FOR[s.id], loop, at, 0.85);
              knock(loop, at + 0.8);
              aimAt(loop, at + 0.85, s.a0, s.a1, 0.8);
              light(loop, at + 1.05, s.id);
              count(s.id, loop, at + 1.05);
              at += 0.85 + 0.8 + HOLD;
            });
            runWire(WIRE_FOR[REST], loop, at, 0.85);
            aimAt(loop, at + 0.85, rest0 - 360, rest1 - 360, 0.8);
            light(loop, at + 1.05, REST);
            loop.to({}, { duration: HOLD }, at + 1.65);
          }

          if (variant === 3) {
            // Bloom — close to a blade at the new bearing, then open to the full share.
            let at = 0;
            stops.forEach((s) => {
              const mid = (s.a0 + s.a1) / 2;
              aimAt(loop, at, mid - 3, mid + 3, 0.6, 'power2.inOut');
              light(loop, at + 0.6, s.id);
              aimAt(loop, at + 0.72, s.a0, s.a1, 0.7, 'expo.out');
              count(s.id, loop, at + 0.72);
              at += 0.72 + 0.7 + HOLD;
            });
            const rm = (rest0 + rest1) / 2 - 360;
            aimAt(loop, at, rm - 3, rm + 3, 0.6);
            light(loop, at + 0.6, REST);
            aimAt(loop, at + 0.72, rest0 - 360, rest1 - 360, 0.7, 'expo.out');
            loop.to({}, { duration: HOLD }, at + 1.42);
          }

          if (variant === 4) {
            // Unroll — the leading edge runs ahead, the trailing edge catches up.
            let at = 0;
            let prev = { a0: rest0, a1: rest1 };
            [...stops, { id: REST, a0: rest0 - 360, a1: rest1 - 360 }].forEach((s) => {
              // stretch: the leading edge (a0, anticlockwise) reaches the new slot
              aimAt(loop, at, s.a0, prev.a1, 0.6, 'power2.in');
              // contract: the trailing edge follows
              aimAt(loop, at + 0.6, s.a0, s.a1, 0.55, 'power2.out');
              light(loop, at + 0.6, s.id);
              count(s.id, loop, at + 0.65);
              prev = { a0: s.a0, a1: s.a1 };
              at += 0.6 + 0.55 + HOLD;
            });
          }

          if (variant === 5) {
            // Snap — hard arrivals with a halo ripple.
            let at = 0;
            const ripple = (t: number) => {
              haloEls.forEach((h, i) => {
                if (!h) return;
                loop.fromTo(h, { scale: 1, opacity: HALOS[i].opacity }, { scale: 1.22, opacity: 0, duration: 0.6, ease: 'power2.out', transformOrigin: '50% 50%' }, t);
                loop.set(h, { scale: 1, opacity: HALOS[i].opacity }, t + 0.6);
              });
            };
            stops.forEach((s) => {
              aimAt(loop, at, s.a0, s.a1, 0.5, 'back.out(1.7)');
              light(loop, at + 0.34, s.id);
              count(s.id, loop, at + 0.34, 0.4);
              knock(loop, at + 0.4);
              ripple(at + 0.4);
              at += 0.5 + HOLD;
            });
            aimAt(loop, at, rest0 - 360, rest1 - 360, 0.5, 'back.out(1.7)');
            light(loop, at + 0.34, REST);
            ripple(at + 0.4);
            loop.to({}, { duration: HOLD }, at + 0.5);
          }

          // Each pass ends on presale's span one turn round; reset so the next repeat matches.
          loop.call(() => {
            arc.a0 = rest0;
            arc.a1 = rest1;
            paint();
          });

          tl.eventCallback('onComplete', () => loop.play());
          io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? loop.resume() : loop.pause()), { rootMargin: '120px' });
          io.observe(el);

          const st = ScrollTrigger.create({ trigger: el, start: 'top 70%', once: true, onEnter: () => tl.play() });
          if (st.progress > 0) tl.play();
        }, el);

        // The `from` tweens have written their start states, so the CSS hold can go.
        reveal();
        revert = () => ctx.revert();
      })
      .catch(() => reveal());

    return () => {
      cancelled = true;
      io?.disconnect();
      revert?.();
    };
  }, [root, variant]);
}
