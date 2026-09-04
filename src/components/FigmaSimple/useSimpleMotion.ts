import { useEffect, type RefObject } from 'react';
import { all, bob, draw, one, pop } from '../FigmaFeatures/illustrations/motion';

/**
 * Motion for the "made simple" section, in the feature band's manner. When the section scrolls into
 * view the headline rises, then the diagram builds piece by piece: the orbit draws itself, the hub
 * pops with its glow, the currency groups and their coins pop on, the pay-in and pay-out chips
 * arrive, the markers and dots appear, and the cursor slides in with its badge; the paragraph and
 * pill rise last. Afterwards a highlight keeps circling the orbit: each ring marker pulses as it
 * passes, and the pay-in and pay-out chips light up indigo and pop as it reaches their anchors. The
 * hub breathes, the coin groups drift, the badge settles beside the hub on its centre line, and the cursor
 * alone rides along on the highlight, clicking as it passes each chip.
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
            // A highlight circles the orbit for as long as the section lives, and each ring marker
            // pulses only as the highlight's leading edge passes over it.
            const len = ringPath.getTotalLength();
            const glowPath = ringPath.cloneNode() as SVGPathElement;
            glowPath.setAttribute('stroke', '#4042d2');
            glowPath.setAttribute('stroke-width', '2');
            glowPath.setAttribute('stroke-linecap', 'round');
            glowPath.classList.add('fs__ringGlow');
            ringPath.parentElement!.appendChild(glowPath);
            gsap.set(ringPath, { strokeDasharray: 'none', strokeDashoffset: 0 });
            const dash = len * 0.12;

            // Where along the path each marker and each chip's anchor dot sits: the sample nearest its
            // centre, compared on screen so the ring's tilt and the stage's scale are accounted for.
            const toScreen = (s: number) => {
              const p = ringPath.getPointAtLength(s);
              return new DOMPoint(p.x, p.y).matrixTransform(ringPath.getScreenCTM()!);
            };
            const SAMPLES = 720;
            const dots = all(orbit, '.fs__dot');
            const chips = all(orbit, '.fs__chip');
            const anchors = [...markers, ...dots];
            const stationOf = (cx: number, cy: number) => {
              let best = 0;
              let bestD = Infinity;
              for (let i = 0; i < SAMPLES; i++) {
                const s = (i / SAMPLES) * len;
                const q = toScreen(s);
                const d = (q.x - cx) ** 2 + (q.y - cy) ** 2;
                if (d < bestD) {
                  bestD = d;
                  best = s;
                }
              }
              return best;
            };
            const stations = anchors.map((m) => {
              const r = m.getBoundingClientRect();
              return stationOf(r.left + r.width / 2, r.top + r.height / 2);
            });
            const armed = anchors.map(() => true);
            const pulse = (m: HTMLElement) => {
              gsap.fromTo(m, { boxShadow: '0 0 0 0 rgba(64, 66, 210, 0.45)', borderColor: '#4042d2' }, { boxShadow: '0 0 0 18px rgba(64, 66, 210, 0)', borderColor: '#c5cbd1', duration: 1.1, ease: 'power2.out' });
              gsap.fromTo(m, { scale: 1 }, { scale: 1.25, duration: 0.28, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' });
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
            const click = () => {
              gsap.fromTo(cursorIcon, { scale: 1 }, { scale: 0.82, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '20% 15%' });
            };
            const hit = (i: number) => {
              if (i < markers.length) pulse(markers[i]);
              else {
                flash(chips[i - markers.length], dots[i - markers.length]);
                click();
              }
            };

            // The cursor rides the highlight: its tip sits on the leading edge, trailing it softly.
            // The path point is taken on screen and mapped back into the stage's design coordinates,
            // then offset by the cursor's resting spot (842, 308) and its tip (5, 3).
            const stage = one(orbit, '.ff__stage');
            const HOME = { x: 842, y: 308 };
            const TIP = { x: 5, y: 3 };
            const toStage = (s: number) => {
              const q = toScreen(s);
              const r = stage.getBoundingClientRect();
              const k = r.width / 1560;
              return { x: (q.x - r.left) / k - HOME.x - TIP.x, y: (q.y - r.top) / k - HOME.y - TIP.y };
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
            const homeStation = stationOf(restIcon.left + restIcon.width * 0.2, restIcon.top + restIcon.height * 0.13);
            const off0 = (((homeStation - dash) % len) + len) % len; // leading edge starts at home
            const SPAWN = 0.25;
            gsap.set(glowPath, { strokeDasharray: `${dash} ${len - dash}`, strokeDashoffset: -off0, opacity: 0 });
            gsap.to(glowPath, { opacity: 0.9, duration: 0.5, delay: SPAWN });
            gsap.to(phase, { mix: 1, duration: 0.9, ease: 'power2.inOut', delay: SPAWN, onComplete: () => { following = true; } });
            // The badge parks beside the hub on its centre line: a fixed 16px gap to the right of the
            // 120px hub, vertically centred on the hub's middle (233 + 60).
            gsap.to(badge, { left: 717.15 + 120 + 16, top: 293 - badge.offsetHeight / 2, duration: 1.0, ease: 'power3.inOut', delay: SPAWN + 0.1 });
            const run = { off: off0 };
            gsap.to(run, {
              off: off0 + len,
              duration: 9,
              ease: 'none',
              repeat: -1,
              delay: SPAWN,
              onUpdate: () => {
                gsap.set(glowPath, { strokeDashoffset: -run.off });
                const head = (run.off + dash) % len; // the highlight's leading edge
                if (phase.mix > 0) {
                  const t = toStage(head);
                  const ahead = toStage((head + 12) % len);
                  const ang = Math.atan2(ahead.y - t.y, ahead.x - t.x);
                  if (following) {
                    fx(t.x);
                    fy(t.y);
                  } else {
                    gsap.set(cursor, { x: t.x * phase.mix, y: t.y * phase.mix });
                  }
                  lean(ang * (180 / Math.PI) * 0.25 * phase.mix);
                }
                stations.forEach((s, i) => {
                  const ahead = (((head - s) % len) + len) % len; // how far past the marker the edge is
                  if (armed[i] && ahead < len * 0.02) {
                    armed[i] = false;
                    hit(i);
                  } else if (!armed[i] && ahead > len * 0.5) {
                    armed[i] = true;
                  }
                });
              },
            });

            gsap.to(hub, { scale: 1.04, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' });
            bob(gsap, badge, 2, 3.4, 1.6);
            gsap.to(one(orbit, '.fs__glow'), { opacity: 0.6, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
            groups.forEach((g, i) => bob(gsap, g, 4, 3.2 + i * 0.5, i * 0.7));
            all(orbit, '.fs__chip').forEach((c, i) => bob(gsap, c, 3, 3.6 + i * 0.4, 0.5 + i));
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
