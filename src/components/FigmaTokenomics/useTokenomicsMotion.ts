import { useEffect, type RefObject } from 'react';
import { SEG_BY_ID, SEGMENTS, TOUR, WIRE_FOR, midVector, slicePath } from './dial';

export type TokVariant = 1 | 2 | 3 | 4 | 5;

export const TOK_VARIANTS: { name: string; blurb: string }[] = [
  { name: 'Relay', blurb: 'A light runs in along a chain wire, the hub takes the hit, and the indigo arc slides round to the allocation it just paid — one stop at a time, anticlockwise.' },
  { name: 'Radar', blurb: 'A hand sweeps the dial continuously and the arc follows it like a trail; each allocation lights as the sweep crosses it, and its own wire answers with a pulse.' },
  { name: 'Unroll', blurb: 'The arc never jumps — it stretches from the allocation it holds into the next one, then contracts onto it, and each landing fires a light back out to that chain.' },
  { name: 'Focus', blurb: 'The dial dims to a whisper and only the live allocation keeps its colour, nudged out of the ring; the wire that feeds it pulses in as it takes focus.' },
  { name: 'Trace', blurb: 'A dot rides the rim of the dial and the arc is the trail it leaves; each boundary it crosses pops that chip and hands the total on.' },
];

/** The tour angles, unwrapped so the pointer always travels anticlockwise instead of jumping. */
function tourStops() {
  let prev = Infinity;
  return TOUR.map((id) => {
    const s = SEG_BY_ID[id];
    let { a0, a1 } = s;
    while (a1 > prev) {
      a0 -= 360;
      a1 -= 360;
    }
    prev = a0;
    return { id, a0, a1, seg: s };
  });
}

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
          const wedge = (id: string) => one<SVGPathElement>(`[data-wedge="${id}"]`);
          const wire = (id: string) => one<SVGPathElement>(`[data-wire="${id}"]`);
          const pulse = (id: string) => one<SVGCircleElement>(`[data-pulse="${id}"]`);
          const pointer = one<SVGPathElement>('.tk__pointer');
          const stops = tourStops();

          /** Drives the pointer arc from wherever it is to `(a0, a1)`, redrawing it each frame. */
          const arc = { a0: stops[0].a0, a1: stops[0].a1 };
          const paintArc = () => pointer?.setAttribute('d', slicePath(arc.a0, arc.a1));
          paintArc();

          const moveArc = (tl: gsap.core.Timeline, at: number, a0: number, a1: number, dur = 0.7, ease = 'power3.inOut') =>
            tl.to(arc, { a0, a1, duration: dur, ease, onUpdate: paintArc }, at);

          /** Marks one allocation live — chip lift and colour are handled in CSS. */
          const light = (tl: gsap.core.Timeline, at: number, id: string | null) =>
            tl.call(
              () => {
                SEGMENTS.forEach((s) => {
                  const n = slice(s.id);
                  const w = wedge(s.id);
                  if (n) n.toggleAttribute('data-on', s.id === id);
                  if (w) w.toggleAttribute('data-on', s.id === id);
                });
                el.dataset.live = id ?? '';
              },
              undefined,
              at,
            );

          /** Counts a percentage up to its value. */
          const count = (node: HTMLElement | null, tl: gsap.core.Timeline, at: number, dur = 0.6) => {
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

          /** A short knock on the hub, for arrivals. */
          const knock = (tl: gsap.core.Timeline, at: number) => {
            tl.to(one('.tk__hubDisc'), { scale: 1.07, duration: 0.14, ease: 'power2.out', transformOrigin: '50% 50%' }, at);
            tl.to(one('.tk__hubDisc'), { scale: 1, duration: 0.34, ease: 'elastic.out(1, 0.5)' }, at + 0.14);
          };

          // ---- Entrance, shared by every variant -------------------------------------------
          const tl = gsap.timeline({ paused: true });
          tl.from(q('.tk__lineInner'), { yPercent: 110, duration: 1, ease: 'power4.out' }, 0);
          tl.from(one('.tk__sub'), { opacity: 0, y: 10, duration: 0.6, ease: 'power3.out' }, 0.3);
          tl.from(one('.tk__ring'), { scale: 0.88, opacity: 0, duration: 0.8, ease: 'expo.out', transformOrigin: '50% 50%' }, 0.25);
          tl.from(one('.tk__hub'), { scale: 0.7, opacity: 0, duration: 0.7, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 0.35);
          // fromTo, not from: the end value is pinned to 1 rather than read off the live node.
          tl.fromTo(q('.tk__wedge'), { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.06 }, 0.45);
          tl.from(q('.tk__wire'), { opacity: 0, duration: 0.6, stagger: 0.05 }, 0.5);
          tl.from(q('.tk__coin'), { scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.06 }, 0.6);
          tl.from(q('.tk__slice'), { opacity: 0, y: 10, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, 0.7);
          SEGMENTS.forEach((s, i) => count(slice(s.id)?.querySelector('.tk__pct b') ?? null, tl, 0.75 + i * 0.06));
          tl.from(one('.tk__facts'), { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out' }, 1.2);

          // ---- The cycle: one variant each -------------------------------------------------
          const loop = gsap.timeline({ repeat: -1, paused: true });

          if (variant === 1) {
            // Relay — a wire delivers, the hub takes it, the arc slides onto that allocation.
            let at = 0;
            stops.forEach((s) => {
              const w = WIRE_FOR[s.id];
              runWire(w, loop, at, 0.85);
              knock(loop, at + 0.8);
              moveArc(loop, at + 0.85, s.a0, s.a1, 0.75);
              loop.to(one('.tk__pointer'), { opacity: 1, duration: 0.3 }, at + 0.85);
              light(loop, at + 0.9, s.id);
              count(slice(s.id)?.querySelector('.tk__pct b') ?? null, loop, at + 0.95, 0.5);
              at += 1.9;
            });
            light(loop, at, null);
            loop.to(one('.tk__pointer'), { opacity: 0, duration: 0.4 }, at);
            loop.to({}, { duration: 0.8 }, at);
          }

          if (variant === 2) {
            // Radar — a continuous sweep; the arc trails the hand and lights what it crosses.
            const hand = one('.tk__hand');
            loop.to(one('.tk__pointer'), { opacity: 1, duration: 0.4 }, 0);
            const turn = 9;
            if (hand) loop.fromTo(hand, { rotate: -90 }, { rotate: 270, duration: turn, ease: 'none', transformOrigin: '50% 50%' }, 0);
            // The arc is a short blade that follows the hand round the dial.
            loop.fromTo(arc, { a0: -110, a1: -90 }, { a0: 250, a1: 270, duration: turn, ease: 'none', onUpdate: paintArc }, 0);
            SEGMENTS.forEach((s) => {
              const at = ((s.a0 + 90) / 360) * turn;
              light(loop, at, s.id);
              count(slice(s.id)?.querySelector('.tk__pct b') ?? null, loop, at, 0.45);
              runWire(WIRE_FOR[s.id], loop, at, 0.7);
            });
            light(loop, turn, null);
            loop.to({}, { duration: 0.6 }, turn);
          }

          if (variant === 3) {
            // Unroll — the arc stretches into the next allocation, then contracts onto it.
            let at = 0;
            loop.to(one('.tk__pointer'), { opacity: 1, duration: 0.3 }, 0);
            stops.forEach((s, i) => {
              const prev = i === 0 ? stops[stops.length - 1] : stops[i - 1];
              const from = i === 0 ? { a0: prev.a0 - 360, a1: prev.a1 - 360 } : prev;
              // stretch: leading edge reaches the new slice while the tail stays put
              moveArc(loop, at, s.a0, from.a1, 0.55, 'power2.in');
              // contract: the tail catches up
              moveArc(loop, at + 0.55, s.a0, s.a1, 0.5, 'power2.out');
              light(loop, at + 0.55, s.id);
              knock(loop, at + 0.55);
              count(slice(s.id)?.querySelector('.tk__pct b') ?? null, loop, at + 0.6, 0.45);
              runWire(WIRE_FOR[s.id], loop, at + 0.7, 0.8, -1);
              at += 1.6;
            });
            light(loop, at, null);
            loop.to(one('.tk__pointer'), { opacity: 0, duration: 0.4 }, at);
            loop.to({}, { duration: 0.7 }, at);
          }

          if (variant === 4) {
            // Focus — the dial dims, the live allocation keeps its colour and steps outward.
            let at = 0;
            loop.to(el, { '--tk-dim': 0.25, duration: 0.5 } as gsap.TweenVars, 0);
            loop.to(one('.tk__pointer'), { opacity: 1, duration: 0.3 }, 0);
            stops.forEach((s) => {
              const [ux, uy] = midVector(s.seg);
              runWire(WIRE_FOR[s.id], loop, at, 0.8);
              moveArc(loop, at + 0.3, s.a0, s.a1, 0.7);
              light(loop, at + 0.8, s.id);
              knock(loop, at + 0.8);
              loop.to(wedge(s.id), { x: ux * 14, y: uy * 14, duration: 0.5, ease: 'expo.out' }, at + 0.8);
              loop.to(one('.tk__pointer'), { x: ux * 14, y: uy * 14, duration: 0.5, ease: 'expo.out' }, at + 0.8);
              count(slice(s.id)?.querySelector('.tk__pct b') ?? null, loop, at + 0.85, 0.45);
              loop.to(wedge(s.id), { x: 0, y: 0, duration: 0.45, ease: 'power2.inOut' }, at + 1.6);
              loop.to(one('.tk__pointer'), { x: 0, y: 0, duration: 0.45, ease: 'power2.inOut' }, at + 1.6);
              at += 2;
            });
            light(loop, at, null);
            loop.to(el, { '--tk-dim': 1, duration: 0.5 } as gsap.TweenVars, at);
            loop.to(one('.tk__pointer'), { opacity: 0, duration: 0.4 }, at);
            loop.to({}, { duration: 0.7 }, at);
          }

          if (variant === 5) {
            // Trace — a dot rides the rim and the arc is the trail behind it.
            const rim = one('.tk__rimDot');
            const turn = 10;
            loop.to(one('.tk__pointer'), { opacity: 1, duration: 0.3 }, 0);
            const path = one<SVGPathElement>('.tk__rimPath');
            if (rim && path) loop.to(rim, { motionPath: { path, start: 0, end: 1 }, duration: turn, ease: 'none' }, 0);
            // The trail runs from the start of the live slice up to the dot.
            stops.forEach((s, i) => {
              const at = (i / stops.length) * turn;
              const dur = turn / stops.length;
              // The dot runs anticlockwise from a1 down to a0, so the trail grows behind it.
              loop.set(arc, { a0: s.a1, a1: s.a1 }, at);
              loop.to(arc, { a0: s.a0, duration: dur, ease: 'none', onUpdate: paintArc }, at);
              light(loop, at, s.id);
              count(slice(s.id)?.querySelector('.tk__pct b') ?? null, loop, at, 0.45);
              runWire(WIRE_FOR[s.id], loop, at, 0.8, -1);
            });
            light(loop, turn, null);
            loop.to(one('.tk__pointer'), { opacity: 0, duration: 0.4 }, turn);
            loop.to({}, { duration: 0.6 }, turn);
          }

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
