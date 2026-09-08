import { useEffect, type RefObject } from 'react';
import { DIAL, COINS, HALOS, SEGMENTS, SEG_BY_ID, REST, SPATIAL, WIRES, WIRE_FOR, slicePath, spanOf, tourStops } from './dial';

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
          const coinEl = (id: string) => one<HTMLElement>(`[data-coin="${id}"]`);
          const allocForWire = Object.fromEntries(Object.entries(WIRE_FOR).map(([a, w]) => [w, a]));

          /**
           * How far along each wire its chain mark sits, measured off the real path so the pulse
           * fires exactly as the dot crosses the mark rather than at a guessed moment.
           */
          const coinAt = new Map<string, number>();
          WIRES.forEach((w) => {
            const path = wire(w.id);
            const c = COINS.find((k) => k.id === w.coin);
            if (!path || !c) return;
            const [cx, cy] = [c.x + 32, c.y];
            const L = path.getTotalLength();
            let best = Infinity;
            let bestF = 0.5;
            for (let i = 0; i <= 240; i++) {
              const pt = path.getPointAtLength((i / 240) * L);
              const d = Math.hypot(pt.x - cx, pt.y - cy);
              if (d < best) {
                best = d;
                bestF = i / 240;
              }
            }
            coinAt.set(w.id, bestF);
          });

          /** A chain mark reacting to a light going past: down 15%, then back. */
          const coinPulse = (wireId: string) => {
            const w = WIRES.find((k) => k.id === wireId);
            const el = w && coinEl(w.coin);
            if (!el) return;
            gsap.timeline()
              .to(el, { scale: 0.85, duration: 0.18, ease: 'power2.out', transformOrigin: '50% 50%' })
              .to(el, { scale: 1, duration: 0.55, ease: 'power2.out' });
          };
          /** Set once the entrance is done: during load-in a mark appears instead of pulsing. */
          let cycling = false;

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
          const ramp = one<SVGLinearGradientElement>('#tkRamp');
          const paint = () => {
            arcEl?.setAttribute('d', slicePath(arc.a0, arc.a1));
            haloEls.forEach((h, i) => h?.setAttribute('d', slicePath(arc.a0, arc.a1, HALOS[i].d / 2)));
            // Re-point the ramp across the wedge: from the trailing outer corner (pale) to the
            // leading one (purple). Anchoring it to the chord rather than the wedge's bounding box
            // is what keeps every bearing reading like a solid shape instead of fading out at the
            // hub — a box-aligned ramp puts the pale end along the wedge on the diagonals.
            if (!ramp) return;
            const rad = (d: number) => (d * Math.PI) / 180;
            const px = (d: number) => DIAL.c + DIAL.r * Math.cos(rad(d));
            const py = (d: number) => DIAL.c + DIAL.r * Math.sin(rad(d));
            ramp.setAttribute('x1', String(px(arc.a1)));
            ramp.setAttribute('y1', String(py(arc.a1)));
            ramp.setAttribute('x2', String(px(arc.a0)));
            ramp.setAttribute('y2', String(py(arc.a0)));
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

          /**
           * Sends a light along one wire. `dir` 1 runs inward to the hub, -1 runs back out. With
           * `draw`, the wire is stroked in behind the dot, so the dot reads as the drawing head.
           * Either way the chain mark reacts as the dot crosses it.
           */
          const runWire = (id: string, tl: gsap.core.Timeline, at: number, dur = 1.5, dir: 1 | -1 = 1, draw = false) => {
            const dot = pulse(id);
            const path = wire(id);
            if (!dot || !path) return;
            const f = coinAt.get(id) ?? 0.5;
            const mark = dir === 1 ? f : 1 - f;
            let fired = false;
            // A proxy tween with the same duration and ease as the ride, so its value IS the dot's
            // eased progress along the path. (A paused tween added to a timeline never renders, so
            // the crossing cannot be read off the motionPath tween itself.)
            const head = { p: 0 };
            tl.to(head, {
              p: 1,
              duration: dur,
              ease: 'power1.inOut',
              onStart: () => {
                fired = false;
              },
              onUpdate: () => {
                if (!fired && head.p >= mark) {
                  fired = true;
                  if (cycling) coinPulse(id);
                }
              },
            }, at);
            tl.to(dot, {
              motionPath: { path, start: dir === 1 ? 0 : 1, end: dir === 1 ? 1 : 0 },
              duration: dur,
              ease: 'power1.inOut',
            }, at);
            tl.set(dot, { opacity: 0 }, at);
            tl.to(dot, { opacity: 1, duration: 0.2 }, at);
            tl.to(dot, { opacity: 0, duration: 0.25 }, at + dur - 0.1);
            if (draw) {
              const L = path.getTotalLength();
              gsap.set(path, { strokeDasharray: L, strokeDashoffset: L });
              tl.to(path, { strokeDashoffset: 0, duration: dur, ease: 'power1.inOut' }, at);
            }
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
          const restAim = (rest0 + rest1) / 2;
          tl.fromTo(arc, { a0: restAim, a1: restAim }, { a0: rest0, a1: rest1, duration: 1.6, ease: 'power2.out', onUpdate: paint }, 0.6);
          // Each wire strokes itself in with a light at its head, going round the section:
          // top-left, left-centre, left-bottom, right-bottom, right-centre, right-top. The chain
          // mark lands as the head reaches it, and its allocation follows just behind.
          const DRAW = 1.3;
          const STEP = 0.24;
          SPATIAL.forEach((wid, i) => {
            const at = 0.7 + i * STEP;
            runWire(wid, tl, at, DRAW, 1, true);
            const w = WIRES.find((k) => k.id === wid);
            if (w) tl.from(coinEl(w.coin), { scale: 0, opacity: 0, duration: 0.55, ease: 'power2.out' }, at + DRAW * (coinAt.get(wid) ?? 0.5));
            const alloc = allocForWire[wid];
            if (slice(alloc)) {
              tl.from(slice(alloc), { opacity: 0, y: 8, duration: 0.7, ease: 'power2.out' }, at + DRAW * 0.6);
              count(alloc, tl, at + DRAW * 0.6);
            }
          });
          const settled = 0.7 + (SPATIAL.length - 1) * STEP + DRAW;
          light(tl, settled - 0.3, REST);
          tl.from(one('.tk__facts'), { opacity: 0, y: 12, duration: 1, ease: 'power2.out' }, settled - 0.4);

          // ---- The cycle --------------------------------------------------------------------
          const loop = gsap.timeline({ repeat: -1, paused: true });

          /** Closes a lap by snapping the arc forward a turn, so the next lap starts where this did. */
          const relap = (at: number) =>
            loop.call(() => {
              arc.a0 += 360;
              arc.a1 += 360;
              paint();
            }, undefined, at);

          if (variant === 1) {
            // Aim — swing and resize onto each allocation in turn.
            let at = 0;
            stops.forEach((s) => {
              // Nothing is lit while the arc is in flight: the chip it is leaving goes dark as
              // it sets off, and the one it is heading for takes the indigo only on arrival.
              light(loop, at, null);
              aimAt(loop, at, s.a0, s.a1);
              light(loop, at + MOVE, s.id);
              count(s.id, loop, at + MOVE);
              at += MOVE + HOLD;
            });
            relap(at);
          }

          if (variant === 2) {
            // Relay — the chain pays first, then the arc moves.
            const WIRE = 1.5;
            let at = 0;
            stops.forEach((s) => {
              runWire(WIRE_FOR[s.id], loop, at, WIRE);
              knock(loop, at + WIRE - 0.1);
              light(loop, at + WIRE, null);
              aimAt(loop, at + WIRE, s.a0, s.a1);
              light(loop, at + WIRE + MOVE, s.id);
              count(s.id, loop, at + WIRE + MOVE);
              at += WIRE + MOVE + HOLD;
            });
            relap(at);
          }

          if (variant === 3) {
            // Bloom — close to a blade at the new bearing, then open to the full share.
            const CLOSE = 1.1;
            const OPEN = 1.2;
            let at = 0;
            stops.forEach((s) => {
              const mid = (s.a0 + s.a1) / 2;
              light(loop, at, null);
              aimAt(loop, at, mid - 2.5, mid + 2.5, CLOSE);
              // the blade is on the bearing here, so this is the arrival
              light(loop, at + CLOSE, s.id);
              aimAt(loop, at + CLOSE + 0.15, s.a0, s.a1, OPEN, 'power2.out');
              count(s.id, loop, at + CLOSE + 0.15);
              at += CLOSE + 0.15 + OPEN + HOLD;
            });
            relap(at);
          }

          if (variant === 4) {
            // Unroll — the leading edge runs ahead, the trailing edge catches up.
            const LEAD = 1.1;
            const FOLLOW = 1;
            let at = 0;
            let prev = { a0: rest0, a1: rest1 };
            stops.forEach((s) => {
              light(loop, at, null);
              aimAt(loop, at, s.a0, prev.a1, LEAD, 'power2.in');
              aimAt(loop, at + LEAD, s.a0, s.a1, FOLLOW, 'power2.out');
              light(loop, at + LEAD + FOLLOW, s.id);
              count(s.id, loop, at + LEAD + FOLLOW);
              prev = { a0: s.a0, a1: s.a1 };
              at += LEAD + FOLLOW + HOLD;
            });
            relap(at);
          }

          if (variant === 5) {
            // Settle — a short travel onto each bearing that eases past its mark and settles.
            const SNAP = 1;
            let at = 0;
            const ripple = (t: number) => {
              haloEls.forEach((h, i) => {
                if (!h) return;
                loop.fromTo(h, { scale: 1, opacity: HALOS[i].opacity }, { scale: 1.14, opacity: 0, duration: 1.1, ease: 'power2.out', transformOrigin: '50% 50%' }, t);
                loop.set(h, { scale: 1, opacity: HALOS[i].opacity }, t + 1.1);
              });
            };
            stops.forEach((s) => {
              light(loop, at, null);
              aimAt(loop, at, s.a0, s.a1, SNAP, 'back.out(1.05)');
              light(loop, at + SNAP, s.id);
              count(s.id, loop, at + SNAP);
              knock(loop, at + SNAP);
              ripple(at + SNAP);
              at += SNAP + HOLD;
            });
            relap(at);
          }

          tl.eventCallback('onComplete', () => {
            cycling = true;
            loop.play();
          });
          // Only after the entrance: observing fires immediately, and resuming a not-yet-played
          // loop would run its first stop underneath the load-in and lose it.
          io = new IntersectionObserver(([entry]) => {
            if (!cycling) return;
            if (entry.isIntersecting) loop.resume();
            else loop.pause();
          }, { rootMargin: '120px' });
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
