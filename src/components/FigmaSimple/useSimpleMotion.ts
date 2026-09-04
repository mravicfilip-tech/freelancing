import { useEffect, type RefObject } from 'react';
import { all, draw, one, pop } from '../FigmaFeatures/illustrations/motion';

/**
 * Motion for the "made simple" section, in the feature band's manner. When the section scrolls into
 * view the headline lines rise out of their masks as the hero's do, then the diagram builds piece by
 * piece: the orbit draws itself, the hub pops with its glow, the currency groups and their coins pop
 * on, the pay-in and pay-out chips arrive, the markers and dots appear, and the cursor slides in with
 * its badge; the paragraph and pill rise last. Afterwards a highlight keeps circling the orbit: each
 * ring marker pulses as it passes, the pay-in and pay-out chips light up indigo and pop as it reaches
 * their anchors, and each currency group pops as the cursor comes by. The hub breathes, the coin
 * groups drift, the badge settles beside the hub on its centre line, and the cursor alone rides along
 * on the highlight, clicking as it passes each chip.
 *
 * The loop is built to stay cheap: the orbit's geometry is sampled once into stage coordinates so
 * no frame reads layout, the highlight's offset is written straight to the style, the pulses
 * and bounces only move transforms and opacity, and everything pauses while the section is off
 * screen.
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
    Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('gsap/MotionPathPlugin')])
      .then(([{ gsap }, { ScrollTrigger }, { MotionPathPlugin }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
        let visibility: IntersectionObserver | null = null;
        const ctx = gsap.context(() => {
          const orbit = one(el, '.fs__orbit');
          const ringPath = one<SVGPathElement>(el, '.fs__ring path');
          const hub = one(el, '.fs__hub');
          const cursor = one(el, '.fs__cursor');
          const cursorIcon = one(el, '.fs__cursorIcon');
          const badge = one(el, '.fs__badge');
          const groups = all(el, '.fs__group');
          const markers = all(el, '.fs__marker');

          const tl = gsap.timeline({ paused: true, onComplete: idle });
          tl.from(all(el, '.fs__lineInner'), { yPercent: 110, duration: 1.05, ease: 'power4.out', stagger: 0.12 }, 0);
          draw(tl, gsap, [ringPath], 0.3, 1.4);
          pop(tl, hub, 0.7, { scale: 0.5, duration: 0.8 });
          tl.from(one(el, '.fs__glow'), { opacity: 0, scale: 0.7, duration: 1.0, ease: 'power2.out' }, 0.9);
          groups.forEach((g, i) => {
            pop(tl, g, 1.0 + i * 0.18, { scale: 0.8, y: 12, duration: 0.6 });
            tl.from(all(g, '.fs__coin'), { scale: 0, opacity: 0, duration: 0.45, stagger: 0.08, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 1.15 + i * 0.18);
          });
          pop(tl, all(el, '.fs__chip'), 1.3, { stagger: 0.15, scale: 0.7 });
          pop(tl, [...all(el, '.fs__dot'), ...markers], 1.6, { scale: 0, stagger: 0.08, duration: 0.45 });
          // The cursor glides in on a curve like a hand would, overshoots a touch, settles, and clicks;
          // the badge pops out of its tip on the click.
          tl.fromTo(cursor, { x: 150, y: 110, opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.6);
          tl.to(cursor, { motionPath: { path: [{ x: 150, y: 110 }, { x: 60, y: 10 }, { x: -6, y: -8 }, { x: 0, y: 0 }], curviness: 1.6 }, duration: 1.5, ease: 'power3.out' }, 1.6);
          tl.fromTo(cursorIcon, { rotation: -14 }, { rotation: 0, duration: 1.5, ease: 'power3.out', transformOrigin: '20% 15%' }, 1.6);
          tl.fromTo(cursorIcon, { scale: 1 }, { scale: 0.82, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '20% 15%' }, 3.05);
          tl.from(badge, { scale: 0, opacity: 0, duration: 0.55, ease: 'back.out(1.8)', transformOrigin: '0% 50%' }, 3.15);
          tl.from(all(el, '.fs__body, .fs__pill'), { y: 18, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out' }, 1.8);

          const st = ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: () => tl.play() });
          if (st.progress > 0) tl.play();

          function idle() {
            // A highlight circles the orbit for as long as the section is on screen.
            const len = ringPath.getTotalLength();
            const glowPath = ringPath.cloneNode() as SVGPathElement;
            glowPath.setAttribute('stroke', '#4042d2');
            glowPath.setAttribute('stroke-width', '2');
            glowPath.setAttribute('stroke-linecap', 'round');
            glowPath.classList.add('fs__ringGlow');
            ringPath.parentElement!.appendChild(glowPath);
            gsap.set(ringPath, { strokeDasharray: 'none', strokeDashoffset: 0 });
            const dash = len * 0.12;

            // The orbit, sampled once into the stage's design coordinates (the ring's tilt and the
            // stage's fitted scale are folded in), so the loop never has to read layout per frame.
            const stage = one(orbit, '.ff__stage');
            const stageRect = stage.getBoundingClientRect();
            const k = stageRect.width / 1560;
            const ctm = ringPath.getScreenCTM()!;
            const SAMPLES = 720;
            const table: { x: number; y: number }[] = [];
            for (let i = 0; i < SAMPLES; i++) {
              const p = ringPath.getPointAtLength((i / SAMPLES) * len);
              const q = new DOMPoint(p.x, p.y).matrixTransform(ctm);
              table.push({ x: (q.x - stageRect.left) / k, y: (q.y - stageRect.top) / k });
            }
            const pointAt = (s: number) => {
              const u = ((((s / len) * SAMPLES) % SAMPLES) + SAMPLES) % SAMPLES;
              const i = Math.floor(u);
              const f = u - i;
              const a = table[i];
              const b = table[(i + 1) % SAMPLES];
              return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
            };
            // Where along the orbit each anchor sits: the sample nearest its centre, in stage coordinates.
            const centreOf = (m: Element) => {
              const r = m.getBoundingClientRect();
              return { x: (r.left + r.width / 2 - stageRect.left) / k, y: (r.top + r.height / 2 - stageRect.top) / k };
            };
            const stationOf = (cx: number, cy: number) => {
              let best = 0;
              let bestD = Infinity;
              table.forEach((q, i) => {
                const d = (q.x - cx) ** 2 + (q.y - cy) ** 2;
                if (d < bestD) {
                  bestD = d;
                  best = (i / SAMPLES) * len;
                }
              });
              return best;
            };
            const dots = all(orbit, '.fs__dot');
            const chips = all(orbit, '.fs__chip');
            // Markers fire as the line's edge crosses them.
            const stations = markers.map((m) => {
              const c = centreOf(m);
              return stationOf(c.x, c.y);
            });
            const armed = markers.map(() => true);
            // Chips and groups react to the cursor itself: each fires as the cursor's tip comes within
            // reach of its centre, and re-arms once the tip has moved well away.
            const reach = (m: Element) => {
              const r = m.getBoundingClientRect();
              return r.width / k / 2 + 12;
            };
            const targets = [...chips, ...groups].map((m) => ({ centre: centreOf(m), reach: reach(m), armed: true }));

            // A ring marker pulses as the highlight's leading edge passes over it: its halo expands
            // and fades (transform and opacity only) while the marker itself gives a small bump.
            const pulse = (m: HTMLElement) => {
              const halo = one(m, '.fs__markerHalo');
              gsap.fromTo(halo, { scale: 1, opacity: 0.55 }, { scale: 2.1, opacity: 0, duration: 1.1, ease: 'power2.out', transformOrigin: '50% 50%' });
              gsap.fromTo(m, { scale: 1 }, { scale: 1.25, duration: 0.28, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' });
              gsap.fromTo(m, { borderColor: '#4042d2' }, { borderColor: '#c5cbd1', duration: 1.1, ease: 'power2.out' });
            };
            // A chip lights up in the badge's indigo and pops as the highlight passes its anchor, then eases back.
            const flash = (chip: HTMLElement, dot: HTMLElement) => {
              const icon = chip.querySelector('img');
              gsap
                .timeline()
                .to(chip, { backgroundColor: '#4042d2', color: '#ffffff', duration: 0.2, ease: 'power2.out' }, 0)
                .to(icon, { filter: 'invert(1)', duration: 0.2 }, 0)
                .fromTo(chip, { scale: 1 }, { scale: 1.12, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0)
                .to(dot, { backgroundColor: '#4042d2', scale: 1.6, duration: 0.2, transformOrigin: '50% 50%' }, 0)
                .to(chip, { backgroundColor: '#ffffff', color: '#2c2e31', duration: 0.6, ease: 'power2.inOut' }, 1.0)
                .to(icon, { filter: 'invert(0)', duration: 0.6 }, 1.0)
                .to(dot, { backgroundColor: '#c5cbd1', scale: 1, duration: 0.6 }, 1.0);
            };
            // A currency group pops as the cursor comes by, the way the chips do: the pill swells a
            // touch and eases back while its coins pop one after another.
            const bounce = (g: HTMLElement) => {
              const pill = one(g, '.fs__coins');
              gsap
                .timeline()
                .to(pill, { scale: 1.08, duration: 0.18, ease: 'power2.out', transformOrigin: '50% 50%' }, 0)
                .to(pill, { scale: 1, duration: 0.45, ease: 'power3.out' }, 0.18)
                .fromTo(all(g, '.fs__coin'), { scale: 1 }, { scale: 1.18, duration: 0.16, stagger: 0.06, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0.04);
            };
            const click = () => {
              gsap.fromTo(cursorIcon, { scale: 1 }, { scale: 0.82, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '20% 15%' });
            };
            const reached = (i: number) => {
              if (i < chips.length) {
                flash(chips[i], dots[i]);
                click();
              } else bounce(groups[i - chips.length]);
            };

            // The cursor rides the highlight: its tip sits on the leading edge, trailing it softly.
            // Path points are offset by the cursor's resting spot (842, 308) and its tip (5, 3).
            const HOME = { x: 842, y: 308 };
            const TIP = { x: 5, y: 3 };
            const toCursor = (s: number) => {
              const q = pointAt(s);
              return { x: q.x - HOME.x - TIP.x, y: q.y - HOME.y - TIP.y };
            };
            const fx = gsap.quickTo(cursor, 'x', { duration: 0.3, ease: 'power2.out' });
            const fy = gsap.quickTo(cursor, 'y', { duration: 0.3, ease: 'power2.out' });
            const lean = gsap.quickTo(cursorIcon, 'rotation', { duration: 0.6, ease: 'sine.out' });
            // 0 = parked by the hub, 1 = riding the highlight. One synced beat starts the loop: the
            // highlight spawns at the point on the orbit nearest the cursor's resting spot, the cursor
            // sets off with it that instant, and the badge slides beside the hub, centred on its middle.
            const phase = { mix: 0 };
            let following = false;
            const restIcon = cursorIcon.getBoundingClientRect();
            const homeStation = stationOf((restIcon.left + restIcon.width * 0.2 - stageRect.left) / k, (restIcon.top + restIcon.height * 0.13 - stageRect.top) / k);
            const off0 = (((homeStation - dash) % len) + len) % len; // leading edge starts at home
            const SPAWN = 0.25;
            // Written to the inline style: the clone inherits the ring's draw-in dash style, which
            // would win over attributes.
            glowPath.style.strokeDasharray = `${dash} ${len - dash}`;
            glowPath.style.strokeDashoffset = String(-off0);
            gsap.set(glowPath, { opacity: 0 });

            // Every loop lives on one timeline, so the section can pause it all while off screen.
            const loop = gsap.timeline();
            loop.to(glowPath, { opacity: 0.9, duration: 0.5 }, SPAWN);
            loop.to(phase, { mix: 1, duration: 0.9, ease: 'power2.inOut', onComplete: () => { following = true; } }, SPAWN);
            // The badge parks beside the hub on its centre line: a fixed 16px gap to the right of the
            // 120px hub, vertically centred on the hub's middle (233 + 60).
            loop.to(badge, { left: 717.15 + 120 + 16, top: 293 - badge.offsetHeight / 2, duration: 1.0, ease: 'power3.inOut' }, SPAWN + 0.1);
            const run = { off: off0 };
            loop.to(run, {
              off: off0 + len,
              duration: 9,
              ease: 'none',
              repeat: -1,
              onUpdate: () => {
                glowPath.style.strokeDashoffset = String(-run.off);
                const head = (run.off + dash) % len; // the highlight's leading edge
                if (phase.mix > 0) {
                  const t = toCursor(head);
                  const ahead = toCursor((head + 12) % len);
                  const ang = Math.atan2(ahead.y - t.y, ahead.x - t.x);
                  if (following) {
                    fx(t.x);
                    fy(t.y);
                  } else {
                    gsap.set(cursor, { x: t.x * phase.mix, y: t.y * phase.mix });
                  }
                  lean(ang * (180 / Math.PI) * 0.25 * phase.mix);
                }
                for (let i = 0; i < stations.length; i++) {
                  const past = (((head - stations[i]) % len) + len) % len; // how far past the marker the edge is
                  if (armed[i] && past < len * 0.02) {
                    armed[i] = false;
                    pulse(markers[i]);
                  } else if (!armed[i] && past > len * 0.5) {
                    armed[i] = true;
                  }
                }
                // Where the cursor's tip actually is (GSAP's cached transform, no layout read).
                const tipX = HOME.x + TIP.x + Number(gsap.getProperty(cursor, 'x'));
                const tipY = HOME.y + TIP.y + Number(gsap.getProperty(cursor, 'y'));
                targets.forEach((t, i) => {
                  const d = Math.hypot(tipX - t.centre.x, tipY - t.centre.y);
                  if (t.armed && d < t.reach) {
                    t.armed = false;
                    reached(i);
                  } else if (!t.armed && d > t.reach * 2.5) {
                    t.armed = true;
                  }
                });
              },
            }, SPAWN);

            loop.to(hub, { scale: 1.04, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0);
            loop.to(badge, { y: -2, duration: 3.4, delay: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
            loop.to(one(orbit, '.fs__glow'), { opacity: 0.6, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
            groups.forEach((g, i) => loop.to(g, { y: -4, duration: 3.2 + i * 0.5, delay: i * 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0));
            chips.forEach((c, i) => loop.to(c, { y: -3, duration: 3.6 + i * 0.4, delay: 0.5 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0));

            visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? loop.play() : loop.pause()), { rootMargin: '80px' });
            visibility.observe(el!);
          }
        }, el);
        reveal();
        revert = () => {
          visibility?.disconnect();
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
