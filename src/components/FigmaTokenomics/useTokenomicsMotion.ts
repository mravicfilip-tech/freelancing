import { useEffect, type RefObject } from 'react';
import { HALOS, SEGMENTS, SEG_BY_ID, REST, WIRE_FOR, slicePath, spanOf, tourStops } from './dial';

export type TokVariant = 1 | 2 | 3 | 4 | 5;

export const TOK_VARIANTS: { name: string; blurb: string }[] = [
  { name: 'Aim', blurb: 'The gradient arc swings round the dial and resizes to each allocation’s share as it lands — 50% of the circle on presale, a sliver on rewards. The chip it points at takes the indigo.' },
  { name: 'Relay', blurb: 'Every move is paid for: a light runs in along that allocation’s own chain wire, the hub takes the hit, and only then does the arc swing across and resize onto it.' },
  { name: 'Bloom', blurb: 'The arc closes to a thin blade at the new bearing, holds a beat, then blooms open to the allocation’s full share — so the size of each slice is the thing you read.' },
  { name: 'Unroll', blurb: 'One continuous rotation: the leading edge runs ahead to the next allocation and the trailing edge catches up, so the arc stretches and contracts without ever jumping.' },
  { name: 'Settle', blurb: 'The most direct of the five: a short travel onto each bearing that eases past its mark by a hair and settles, with the hub halos rippling gently outward as it lands.' },
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

          /**
           * Tempo. The dial should read as slow and deliberate: a long travel, and a rest long
           * enough to actually take in the allocation before it moves on.
           */
          const MOVE = 1.5;
          const HOLD = 2.4;
          const EASE = 'power2.inOut';
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

          const aimAt = (tl: gsap.core.Timeline, at: number, a0: number, a1: number, dur = MOVE, ease = EASE) =>
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
          const count = (id: string, tl: gsap.core.Timeline, at: number, dur = 0.9) => {
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
          const runWire = (id: string, tl: gsap.core.Timeline, at: number, dur = 1.5, dir: 1 | -1 = 1) => {
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
            tl.to(one('.tk__hubDisc'), { scale: 1.035, duration: 0.3, ease: 'power2.out', transformOrigin: '50% 50%' }, at);
            tl.to(one('.tk__hubDisc'), { scale: 1, duration: 0.7, ease: 'power2.out' }, at + 0.3);
          };

          // ---- Entrance ---------------------------------------------------------------------
          const tl = gsap.timeline({ paused: true });
          tl.from(q('.tk__lineInner'), { yPercent: 110, duration: 1.3, ease: 'power3.out' }, 0);
          tl.from(one('.tk__sub'), { opacity: 0, y: 8, duration: 0.9, ease: 'power2.out' }, 0.35);
          tl.from(one('.tk__ring'), { scale: 0.94, opacity: 0, duration: 1.2, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.3);
          tl.from(one('.tk__hub'), { scale: 0.86, opacity: 0, duration: 1, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.45);
          // The arc opens from a blade at presale's bearing to its full 50% span.
          tl.fromTo(arc, { a0: 180, a1: 180 }, { a0: rest0, a1: rest1, duration: 1.6, ease: 'power2.out', onUpdate: paint }, 0.6);
          tl.fromTo(q('.tk__wire'), { opacity: 0 }, { opacity: 1, duration: 1, stagger: 0.08 }, 0.6);
          tl.from(q('.tk__coin'), { scale: 0.8, opacity: 0, duration: 0.9, ease: 'power2.out', stagger: 0.09 }, 0.8);
          tl.from(q('.tk__slice'), { opacity: 0, y: 8, duration: 0.8, ease: 'power2.out', stagger: 0.09 }, 0.95);
          SEGMENTS.forEach((s, i) => count(s.id, tl, 1 + i * 0.09));
          light(tl, 1.6, REST);
          tl.from(one('.tk__facts'), { opacity: 0, y: 12, duration: 1, ease: 'power2.out' }, 1.7);

          // ---- The cycle --------------------------------------------------------------------
          const loop = gsap.timeline({ repeat: -1, paused: true });

          if (variant === 1) {
            // Aim — swing and resize onto each allocation in turn.
            let at = 0;
            stops.forEach((s) => {
              aimAt(loop, at, s.a0, s.a1);
              light(loop, at + MOVE * 0.55, s.id);
              count(s.id, loop, at + MOVE * 0.55);
              at += MOVE + HOLD;
            });
            aimAt(loop, at, rest0 - 360, rest1 - 360);
            light(loop, at + MOVE * 0.55, REST);
            loop.to({}, { duration: HOLD }, at + MOVE);
          }

          if (variant === 2) {
            // Relay — the chain pays first, then the arc moves.
            const WIRE = 1.5;
            let at = 0;
            stops.forEach((s) => {
              runWire(WIRE_FOR[s.id], loop, at, WIRE);
              knock(loop, at + WIRE - 0.1);
              aimAt(loop, at + WIRE, s.a0, s.a1);
              light(loop, at + WIRE + MOVE * 0.55, s.id);
              count(s.id, loop, at + WIRE + MOVE * 0.55);
              at += WIRE + MOVE + HOLD;
            });
            runWire(WIRE_FOR[REST], loop, at, WIRE);
            aimAt(loop, at + WIRE, rest0 - 360, rest1 - 360);
            light(loop, at + WIRE + MOVE * 0.55, REST);
            loop.to({}, { duration: HOLD }, at + WIRE + MOVE);
          }

          if (variant === 3) {
            // Bloom — close to a blade at the new bearing, then open to the full share.
            const CLOSE = 1.1;
            const OPEN = 1.2;
            let at = 0;
            const step = (id: string, a0: number, a1: number) => {
              const mid = (a0 + a1) / 2;
              aimAt(loop, at, mid - 2.5, mid + 2.5, CLOSE);
              light(loop, at + CLOSE, id);
              aimAt(loop, at + CLOSE + 0.15, a0, a1, OPEN, 'power2.out');
              count(id, loop, at + CLOSE + 0.15);
              at += CLOSE + 0.15 + OPEN + HOLD;
            };
            stops.forEach((s) => step(s.id, s.a0, s.a1));
            step(REST, rest0 - 360, rest1 - 360);
          }

          if (variant === 4) {
            // Unroll — the leading edge runs ahead, the trailing edge catches up.
            const LEAD = 1.1;
            const FOLLOW = 1;
            let at = 0;
            let prev = { a0: rest0, a1: rest1 };
            [...stops, { id: REST, a0: rest0 - 360, a1: rest1 - 360 }].forEach((s) => {
              aimAt(loop, at, s.a0, prev.a1, LEAD, 'power2.in');
              aimAt(loop, at + LEAD, s.a0, s.a1, FOLLOW, 'power2.out');
              light(loop, at + LEAD, s.id);
              count(s.id, loop, at + LEAD);
              prev = { a0: s.a0, a1: s.a1 };
              at += LEAD + FOLLOW + HOLD;
            });
          }

          if (variant === 5) {
            // Snap — the most direct of the five: a short travel, then it settles.
            const SNAP = 1;
            let at = 0;
            const ripple = (t: number) => {
              haloEls.forEach((h, i) => {
                if (!h) return;
                loop.fromTo(h, { scale: 1, opacity: HALOS[i].opacity }, { scale: 1.14, opacity: 0, duration: 1.1, ease: 'power2.out', transformOrigin: '50% 50%' }, t);
                loop.set(h, { scale: 1, opacity: HALOS[i].opacity }, t + 1.1);
              });
            };
            const step = (id: string, a0: number, a1: number) => {
              aimAt(loop, at, a0, a1, SNAP, 'back.out(1.05)');
              light(loop, at + SNAP * 0.65, id);
              count(id, loop, at + SNAP * 0.65);
              knock(loop, at + SNAP * 0.8);
              ripple(at + SNAP * 0.8);
              at += SNAP + HOLD;
            };
            stops.forEach((s) => step(s.id, s.a0, s.a1));
            step(REST, rest0 - 360, rest1 - 360);
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
