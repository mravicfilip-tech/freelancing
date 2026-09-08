import { useEffect, type RefObject } from 'react';

export type TokVariant = 1 | 2 | 3 | 4 | 5;

export const TOK_VARIANTS: { name: string; blurb: string }[] = [
  { name: 'Sweep', blurb: 'The dial fills clockwise from twelve; each percentage counts up as the sweep passes it, and the chips ride in from their own side.' },
  { name: 'Assemble', blurb: 'The mark lands first, the ring springs out around it, and the allocations are thrown outward from the hub along the wires.' },
  { name: 'Orbit', blurb: 'Arrives whole, then keeps living — the ring turns, the marks breathe, and light runs the wires inward on a loop.' },
  { name: 'Tally', blurb: 'Reads like a settlement: allocations resolve largest first while a running total counts to 100% inside the hub, then the mark takes its place.' },
  { name: 'Signal', blurb: 'The wires go first: each chain sends a pulse into the hub, and every arrival lights one allocation. The ring closes last.' },
];

/** Pulse routes, in stage coordinates: coin centre, optional elbow, then the ring's edge. */
const ROUTES: { sel: string; pts: [number, number][] }[] = [
  { sel: '.tk__pulse--l0', pts: [[258, 293], [559, 293]] },
  { sel: '.tk__pulse--l1', pts: [[168, 453], [261, 453], [426, 293]] },
  { sel: '.tk__pulse--l2', pts: [[168, 134], [261, 134], [426, 293]] },
  { sel: '.tk__pulse--r0', pts: [[1296, 293], [1001, 293]] },
  { sel: '.tk__pulse--r1', pts: [[1380, 453], [1299, 453], [1134, 293]] },
  { sel: '.tk__pulse--r2', pts: [[1380, 134], [1299, 134], [1134, 293]] },
];

/**
 * The phone frame (2639:1627) hangs its chain marks off two wire trees instead of two flanks, so
 * the lights run down the top tree into the dial's crown and up the bottom one into its foot.
 */
const ROUTES_M: { sel: string; pts: [number, number][] }[] = [
  { sel: '.tk__pulse--l0', pts: [[194, 103], [196.5, 400]] },
  { sel: '.tk__pulse--l1', pts: [[104, 50], [150, 103], [196.5, 400]] },
  { sel: '.tk__pulse--l2', pts: [[293, 50], [245, 103], [196.5, 400]] },
  { sel: '.tk__pulse--r0', pts: [[195.5, 1023], [196.5, 610]] },
  { sel: '.tk__pulse--r1', pts: [[101.5, 1073], [150, 1023], [196.5, 610]] },
  { sel: '.tk__pulse--r2', pts: [[289.5, 1073], [243, 1023], [196.5, 610]] },
];

/** Largest allocation first — the order the tally variant settles them in. */
const BY_SIZE = ['presale', 'marketing', 'listings', 'reserves', 'team', 'rewards'];

/**
 * `mobile` selects the phone frame's wire routes and lets the allocations enter along the axis they
 * are stacked on; it is also a dependency, so crossing the breakpoint rebuilds the timeline.
 */
export function useTokenomicsMotion(root: RefObject<HTMLElement | null>, variant: TokVariant = 1, mobile = false) {
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

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
          const q = (sel: string) => el.querySelectorAll(sel);
          const one = (sel: string) => el.querySelector(sel) as HTMLElement | null;
          const slice = (id: string) => el.querySelector(`[data-slice="${id}"]`) as HTMLElement | null;
          const counters = () => Array.from(q('.tk__pct b')) as HTMLElement[];

          /** Reveals a node by running a conic wiper over it, so the artwork draws rather than fades. */
          const wipe = (target: Element | null, tl: gsap.core.Timeline, at: number, dur: number) => {
            if (!target) return;
            const node = target as HTMLElement;
            const proxy = { a: 0 };
            const paint = () => {
              const g = `conic-gradient(from -90deg, #000 ${proxy.a}deg, transparent ${proxy.a}deg)`;
              node.style.maskImage = g;
              node.style.webkitMaskImage = g;
            };
            paint();
            tl.to(proxy, {
              a: 360,
              duration: dur,
              ease: 'none',
              onUpdate: paint,
              onComplete: () => {
                node.style.maskImage = '';
                node.style.webkitMaskImage = '';
              },
            }, at);
          };

          /** Counts a percentage circle up to its value. */
          const count = (node: HTMLElement, tl: gsap.core.Timeline, at: number, dur = 0.8) => {
            const to = Number(node.dataset.pct ?? 0);
            const proxy = { v: 0 };
            node.textContent = '0%';
            tl.to(proxy, {
              v: to,
              duration: dur,
              ease: 'power2.out',
              onUpdate: () => { node.textContent = `${Math.round(proxy.v)}%`; },
            }, at);
          };

          /** Sends a light down one wire, hub-bound. */
          const routes = mobile ? ROUTES_M : ROUTES;
          /**
           * Where an allocation comes from. Ranged either side of the dial on a desk, so they come
           * in from their own flank; stacked on a phone, so they rise from the side of the dial
           * they sit on.
           */
          const enterFrom = (node: HTMLElement, reach = 40) =>
            mobile
              ? { y: node.offsetTop < 500 ? -reach : reach, x: 0 }
              : { x: node.offsetLeft < 780 ? -reach : reach, y: 0 };
          const runPulse = (route: (typeof ROUTES)[number], tl: gsap.core.Timeline, at: number, dur = 1) => {
            const dot = one(route.sel);
            if (!dot) return;
            const [start, ...rest] = route.pts;
            const legs = rest.length;
            gsap.set(dot, { x: start[0], y: start[1], opacity: 0 });
            tl.to(dot, { opacity: 1, duration: 0.12 }, at);
            rest.forEach((p, i) => {
              tl.to(dot, { x: p[0], y: p[1], duration: dur / legs, ease: i === legs - 1 ? 'power1.in' : 'none' }, at + (dur / legs) * i);
            });
            tl.to(dot, { opacity: 0, duration: 0.18 }, at + dur);
          };

          const tl = gsap.timeline({ paused: true });
          const heading = () => {
            tl.from(q('.tk__lineInner'), { yPercent: 110, duration: 1, ease: 'power4.out' }, 0);
            tl.from(one('.tk__sub'), { opacity: 0, y: 10, duration: 0.6, ease: 'power3.out' }, 0.3);
            tl.from(one('.tk__facts'), { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out' }, 1.5);
          };

          if (variant === 1) {
            // Sweep — the dial fills clockwise and the figures count as it passes.
            heading();
            tl.from(one('.tk__ring'), { scale: 0.86, opacity: 0, duration: 0.8, ease: 'expo.out', transformOrigin: '50% 50%' }, 0.25);
            tl.from(one('.tk__hub'), { scale: 0.7, opacity: 0, duration: 0.7, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 0.35);
            wipe(one('.tk__wedges'), tl, 0.5, 1.5);
            tl.from(q('.tk__wire'), { scaleX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, transformOrigin: '100% 50%' }, 0.6);
            tl.from(q('.tk__coin'), { scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.06 }, 1.15);
            SLICES_ORDER.forEach((id, i) => {
              const node = slice(id);
              if (!node) return;
              tl.from(node, { ...enterFrom(node), opacity: 0, duration: 0.6, ease: 'expo.out' }, 0.55 + i * 0.12);
              const b = node.querySelector('.tk__pct b') as HTMLElement | null;
              if (b) count(b, tl, 0.6 + i * 0.12);
            });
          }

          if (variant === 2) {
            // Assemble — the mark lands, the ring springs around it, the allocations are thrown out.
            heading();
            tl.from(one('.tk__hub'), { scale: 0, duration: 0.8, ease: 'back.out(1.8)', transformOrigin: '50% 50%' }, 0.2);
            tl.from(one('.tk__ring'), { scale: 0, opacity: 0, duration: 1.1, ease: 'elastic.out(1, 0.55)', transformOrigin: '50% 50%' }, 0.45);
            tl.from(q('.tk__wedge'), { scale: 0.8, rotation: -14, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, transformOrigin: '50% 50%' }, 0.6);
            tl.from(q('.tk__wire'), { scaleX: 0, duration: 0.8, ease: 'power2.out', stagger: 0.05, transformOrigin: '100% 50%' }, 0.8);
            SLICES_ORDER.forEach((id, i) => {
              const node = slice(id);
              if (!node) return;
              const thrown = mobile
                ? enterFrom(node, 90)
                : { x: (node.offsetLeft < 780 ? 1 : -1) * 90, y: (node.offsetTop < 260 ? 1 : node.offsetTop > 330 ? -1 : 0) * 60 };
              tl.from(node, { ...thrown, scale: 0.8, opacity: 0, duration: 0.75, ease: 'expo.out' }, 0.9 + i * 0.07);
              const b = node.querySelector('.tk__pct b') as HTMLElement | null;
              if (b) count(b, tl, 1 + i * 0.07, 0.6);
            });
            tl.from(q('.tk__coin'), { scale: 0, opacity: 0, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.07 }, 1.25);
          }

          if (variant === 3) {
            // Orbit — arrives whole, then keeps turning.
            heading();
            tl.from([one('.tk__ring'), one('.tk__wedges'), one('.tk__hub')], { scale: 0.9, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, transformOrigin: '50% 50%' }, 0.25);
            tl.from(q('.tk__wire'), { opacity: 0, duration: 0.6, stagger: 0.04 }, 0.5);
            tl.from(q('.tk__coin'), { scale: 0.7, opacity: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.05 }, 0.7);
            tl.from(q('.tk__slice'), { opacity: 0, y: 12, duration: 0.6, ease: 'expo.out', stagger: 0.06 }, 0.8);
            counters().forEach((b, i) => count(b, tl, 0.85 + i * 0.06, 0.7));

            const loop = gsap.timeline({ repeat: -1, paused: true });
            loop.to(one('.tk__ring'), { rotation: 360, duration: 48, ease: 'none', transformOrigin: '50% 50%' }, 0);
            loop.to(q('.tk__coin'), { scale: 1.06, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: 1, stagger: { each: 0.18, yoyo: true } }, 0);
            routes.forEach((r, i) => runPulse(r, loop, 0.4 + i * 0.55, 1.6));
            loop.to({}, { duration: 1.2 }, 4.6);
            attachLoop(loop);
          }

          if (variant === 4) {
            // Tally — allocations settle largest first while the hub counts to 100%.
            heading();
            const total = one('.tk__total');
            tl.from(one('.tk__ring'), { scale: 0.9, opacity: 0, duration: 0.7, ease: 'expo.out', transformOrigin: '50% 50%' }, 0.2);
            tl.from(one('.tk__hub'), { scale: 0.8, opacity: 0, duration: 0.6, ease: 'expo.out', transformOrigin: '50% 50%' }, 0.25);
            tl.to(q('.tk__logo'), { opacity: 0, duration: 0.2 }, 0.45);
            if (total) tl.to(total, { opacity: 1, duration: 0.2 }, 0.5);
            tl.from(q('.tk__wire'), { opacity: 0, duration: 0.5, stagger: 0.04 }, 0.4);
            tl.from(q('.tk__coin'), { opacity: 0, scale: 0.8, duration: 0.5, ease: 'expo.out', stagger: 0.05 }, 0.5);

            const running = { v: 0 };
            let at = 0.65;
            BY_SIZE.forEach((id) => {
              const node = slice(id);
              if (!node) return;
              const b = node.querySelector('.tk__pct b') as HTMLElement | null;
              const pct = Number(b?.dataset.pct ?? 0);
              tl.from(node, { opacity: 0, scale: 0.86, duration: 0.5, ease: 'back.out(2)', transformOrigin: '50% 50%' }, at);
              if (b) count(b, tl, at, 0.45);
              if (total) {
                tl.to(running, {
                  v: running.v + pct,
                  duration: 0.45,
                  ease: 'power2.out',
                  onUpdate: () => { total.textContent = `${Math.round(running.v)}%`; },
                }, at);
                running.v += pct;
              }
              at += 0.42;
            });
            wipe(one('.tk__wedges'), tl, 0.65, at - 0.65);
            if (total) tl.to(total, { opacity: 0, scale: 0.8, duration: 0.35, ease: 'power2.in', transformOrigin: '50% 50%' }, at + 0.25);
            tl.to(q('.tk__logo'), { opacity: 1, duration: 0.45, ease: 'expo.out' }, at + 0.45);
            tl.from(q('.tk__logo'), { scale: 0.7, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2)' }, at + 0.45);
          }

          if (variant === 5) {
            // Signal — the chains send first; every arrival lights one allocation.
            heading();
            tl.from(one('.tk__hub'), { scale: 0.8, opacity: 0, duration: 0.6, ease: 'expo.out', transformOrigin: '50% 50%' }, 0.2);
            tl.from(q('.tk__coin'), { scale: 0, opacity: 0, duration: 0.55, ease: 'back.out(2)', stagger: 0.06 }, 0.25);
            tl.from(q('.tk__wire'), { scaleX: 0, duration: 0.7, ease: 'power2.out', stagger: 0.05, transformOrigin: '0% 50%' }, 0.4);

            SLICES_ORDER.forEach((id, i) => {
              const node = slice(id);
              const route = routes[i % routes.length];
              const at = 0.75 + i * 0.34;
              runPulse(route, tl, at, 0.5);
              tl.to(one('.tk__hubDisc'), { scale: 1.08, duration: 0.14, ease: 'power2.out', transformOrigin: '50% 50%' }, at + 0.5);
              tl.to(one('.tk__hubDisc'), { scale: 1, duration: 0.3, ease: 'power2.out' }, at + 0.64);
              if (node) {
                tl.from(node, { opacity: 0, ...enterFrom(node, 24), duration: 0.5, ease: 'expo.out' }, at + 0.5);
                const b = node.querySelector('.tk__pct b') as HTMLElement | null;
                if (b) count(b, tl, at + 0.5, 0.45);
              }
            });
            const end = 0.75 + SLICES_ORDER.length * 0.34;
            wipe(one('.tk__wedges'), tl, 0.9, end - 0.9);
            wipe(one('.tk__ring'), tl, end, 0.9);

            const loop = gsap.timeline({ repeat: -1, paused: true });
            routes.forEach((r, i) => runPulse(r, loop, i * 0.7, 1.4));
            loop.to({}, { duration: 1.6 }, routes.length * 0.7 + 1.4);
            attachLoop(loop);
          }

          function attachLoop(loop: gsap.core.Timeline) {
            tl.eventCallback('onComplete', () => loop.play());
            io = new IntersectionObserver(
              ([entry]) => (entry.isIntersecting ? loop.resume() : loop.pause()),
              { rootMargin: '120px' },
            );
            io.observe(el!);
          }

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
  }, [root, variant, mobile]);
}

/** Reading order around the dial: top-left, top-right, left, right, bottom-left, bottom-right. */
const SLICES_ORDER = ['reserves', 'listings', 'presale', 'team', 'rewards', 'marketing'];
