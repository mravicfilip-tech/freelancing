// Header plus hero, pinned while the forklift drives through the four stations. Scroll position
// is the timeline. At scroll zero every variant is a complete, usable hero.
//   V1 Service selector. Scroll snaps station to station, the sub line and button follow.
//   V2 Mast lift. The brief's one time entrance, then the mast lifts the load at each station.
//   V3 Floor line. The red floor line draws once on load, then rides the floor as the truck drives.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { hero, pillars, trust } from '../content';
import { Scene, STATION_W } from '../scene/Scene';
import { Header } from './Header';
import { Arrow, Badge, Calendar, Phone, PillarIcon, Users, Van } from './Icons';

gsap.registerPlugin(ScrollTrigger);

export type Variant = 1 | 2 | 3;

const SCROLL_PER_STATION = 800;
const LAST = pillars.length - 1;
const trustIcons = { founded: Calendar, clients: Users, status: Badge, coverage: Van } as const;

const formatCount = (n: number) => (n >= 1000 ? `${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, '0')}` : String(n));

export function Stage({ variant, reduced }: { variant: Variant; reduced: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const quoteRef = useRef<HTMLAnchorElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement>(null);
  const clientsRef = useRef<HTMLLIElement>(null);
  const lineRef = useRef<SVGSVGElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const activeRef = useRef(0);
  const applyRef = useRef<(p: number) => void>(() => {});

  const [active, setActive] = useState(0);
  const [shownSub, setShownSub] = useState(0);
  const [lineGeom, setLineGeom] = useState({ w: 1440, split: 600, dots: [] as number[] });

  // Measure the floor line, its split between panel and scene, and the dot under each pillar.
  useLayoutEffect(() => {
    const measure = () => {
      const main = mainRef.current;
      if (!main) return;
      const box = main.getBoundingClientRect();
      const dots = tabRefs.current.map((t) => {
        const r = t?.getBoundingClientRect();
        return r ? r.left + r.width / 2 - box.left : 0;
      });
      const scene = sceneRef.current?.getBoundingClientRect();
      setLineGeom({ w: box.width, split: scene ? scene.left - box.left : box.width * 0.42, dots });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // One frame of the journey. p runs 0 to 1 over the pinned scroll.
  const apply = useCallback(
    (p: number) => {
      const svg = sceneRef.current?.querySelector('svg');
      if (!svg) return;
      const t = p * LAST;
      const cam = t * STATION_W;
      const q = (name: string) => svg.querySelector(`[data-part="${name}"]`);
      q('world')?.setAttribute('transform', `translate(${-cam} 0)`);
      q('back')?.setAttribute('transform', `translate(${-cam * 0.5} 0)`);
      for (const [name, r] of [['wheel-rear', 26], ['wheel-front', 30]] as const) {
        const w = q(name);
        if (!w) continue;
        const a = (cam / (2 * Math.PI * r)) * 360;
        w.setAttribute('transform', `rotate(${a} ${w.getAttribute('data-cx')} ${w.getAttribute('data-cy')})`);
      }
      // 1 when parked at a station, 0 halfway between two
      const parked = Math.abs(Math.cos(Math.PI * t));
      const lift = variant === 2 ? 26 + 190 * parked ** 3 : 40 + 26 * parked ** 4;
      q('carriage')?.setAttribute('transform', `translate(0 ${-lift})`);
      q('inner')?.setAttribute('transform', `translate(0 ${-lift / 2})`);

      if (variant === 3 && lineRef.current) {
        const scale = (sceneRef.current?.clientWidth ?? STATION_W) / STATION_W;
        lineRef.current.querySelector('[data-part="floor-dash"]')?.setAttribute('stroke-dashoffset', String(cam * scale));
      }

      const idx = Math.min(LAST, Math.max(0, Math.round(t)));
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
    },
    [variant],
  );
  applyRef.current = apply;

  // Scroll journey, shared by all three variants.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    apply(0);
    if (reduced) return;
    const ctx = gsap.context(() => {
      const state = { p: 0 };
      stRef.current = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: `+=${SCROLL_PER_STATION * LAST}`,
        pin: true,
        snap:
          variant === 1
            ? { snapTo: 1 / LAST, duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: 'power2.inOut' }
            : undefined,
        onUpdate: (self) => {
          gsap.to(state, {
            p: self.progress,
            duration: 0.5,
            ease: 'power3.out',
            overwrite: true,
            onUpdate: () => applyRef.current(state.p),
          });
        },
      });
    }, stage);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      stRef.current = null;
      ctx.revert();
    };
  }, [apply, reduced, variant]);

  // Variant motion that is not scroll driven.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;
    const ctx = gsap.context(() => {
      if (variant === 1) {
        gsap.to('.indicator-nudge', { x: 8, duration: 0.2, delay: 2, yoyo: true, repeat: 1, ease: 'power1.inOut' });
      }

      if (variant === 2) {
        const tl = gsap.timeline();
        tl.from('.mast-bar', { scaleY: 0, duration: 0.45, ease: 'power2.out' }, 0)
          .from('[data-lift]', { y: 24, opacity: 0, duration: 0.38, stagger: 0.07, ease: 'expo.out' }, 0.1)
          .from('.scene-enter', { x: 40, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.17)
          .from('.btn-quote', { y: -4, opacity: 0, duration: 0.3, ease: 'back.out(3)' }, 0.72)
          .from('.pillars, .trust', { opacity: 0, duration: 0.25 }, 1.02);
        // A light depth shift on the scene after the entrance, at most 8px.
        const move = sceneRef.current?.querySelector('.scene-move');
        if (move && sceneRef.current) {
          const xTo = gsap.quickTo(move, 'x', { duration: 0.6, ease: 'power3.out' });
          const yTo = gsap.quickTo(move, 'y', { duration: 0.6, ease: 'power3.out' });
          const el = sceneRef.current;
          const onMove = (e: MouseEvent) => {
            if (tl.isActive()) return;
            const r = el.getBoundingClientRect();
            xTo(((e.clientX - r.left) / r.width - 0.5) * -16);
            yTo(((e.clientY - r.top) / r.height - 0.5) * -16);
          };
          const onLeave = () => {
            xTo(0);
            yTo(0);
          };
          el.addEventListener('mousemove', onMove);
          el.addEventListener('mouseleave', onLeave);
          return () => {
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseleave', onLeave);
          };
        }
      }

      if (variant === 3) {
        const mask = stage.querySelector('[data-part="floor-mask"]');
        const count = countRef.current;
        const clientsX = (() => {
          const m = mainRef.current?.getBoundingClientRect();
          const c = clientsRef.current?.getBoundingClientRect();
          return m && c ? c.left + 24 - m.left : 0;
        })();
        const w = lineGeom.w;
        const lit = new Set<number>();
        let counted = false;
        if (count) count.textContent = '0+';
        const draw = { q: 0 };
        gsap.to(draw, {
          q: 1,
          duration: 1.2,
          ease: 'power1.inOut',
          delay: 0.3,
          onUpdate: () => {
            mask?.setAttribute('stroke-dashoffset', String(1 - draw.q));
            const x = draw.q * w;
            lineGeom.dots.forEach((dx, i) => {
              if (x >= dx && !lit.has(i)) {
                lit.add(i);
                gsap.fromTo(dotRefs.current[i], { scale: 0 }, { scale: 1, duration: 0.2, ease: 'back.out(2)' });
                gsap.fromTo(tabRefs.current[i], { opacity: 0.55 }, { opacity: 1, duration: 0.2 });
              }
            });
            if (!counted && x >= clientsX && count) {
              counted = true;
              const n = { v: 0 };
              gsap.to(n, {
                v: 1000,
                duration: 0.8,
                ease: 'power2.out',
                onUpdate: () => (count.textContent = `${formatCount(Math.round(n.v / 10) * 10)}+`),
                onComplete: () => (count.textContent = '1.000+'),
              });
            }
          },
          onComplete: () => quoteRef.current?.classList.add('glow'),
        });
        gsap.set(dotRefs.current, { scale: 0 });
        gsap.set(tabRefs.current, { opacity: 0.55 });
      }
    }, stage);
    return () => ctx.revert();
  }, [variant, reduced, lineGeom]);

  // V1 swaps the sub line with the active pillar. Old text fades up 6px, new text rises from 6px below.
  useEffect(() => {
    if (variant !== 1) return;
    const el = subRef.current;
    if (reduced || !el) {
      setShownSub(active);
      return;
    }
    if (active === shownSub) return;
    const tween = gsap.to(el, { opacity: 0, y: -6, duration: 0.18, ease: 'power1.in', onComplete: () => setShownSub(active) });
    return () => {
      tween.kill();
    };
  }, [active, variant, reduced, shownSub]);

  useLayoutEffect(() => {
    if (variant !== 1 || reduced || !subRef.current) return;
    gsap.fromTo(subRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power1.out' });
  }, [shownSub, variant, reduced]);

  const goTo = (i: number) => {
    const st = stRef.current;
    if (!st || reduced) {
      activeRef.current = i;
      setActive(i);
      apply(i / LAST);
      return;
    }
    window.scrollTo({ top: st.start + ((st.end - st.start) * i) / LAST, behavior: 'smooth' });
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next =
      e.key === 'ArrowRight' ? (i + 1) % pillars.length
      : e.key === 'ArrowLeft' ? (i - 1 + pillars.length) % pillars.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? LAST
      : -1;
    if (next < 0) return;
    e.preventDefault();
    tabRefs.current[next]?.focus();
    goTo(next);
  };

  const p = pillars[active];
  const sub = variant === 1 ? pillars[shownSub].line : hero.sub;
  const quoteLabel = variant === 1 ? p.cta : hero.quote.label;

  return (
    <div className={`stage v${variant}`} ref={stageRef}>
      <Header />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-main" ref={mainRef}>
          <div className="panel">
            <div className="copy">
              {variant === 2 && <span className="mast-bar" aria-hidden="true" />}
              <p className="kicker" data-lift>
                {hero.kicker}
              </p>
              <h1 id="hero-title" className="headline">
                {hero.headline.map((line) => (
                  <span key={line} className="hl-line" data-lift>
                    {line}
                  </span>
                ))}
              </h1>
              <p className="sub" ref={subRef} data-lift aria-live={variant === 1 ? 'polite' : undefined}>
                {sub}
              </p>
              <div className="cta-row">
                <a className="btn-quote" ref={quoteRef} href={hero.quote.href} data-cta="quote">
                  {quoteLabel}
                </a>
                <a className="call" href={hero.sales.tel} data-cta="call-sales">
                  <Phone size={18} />
                  <span>
                    {hero.sales.label} <strong>{hero.sales.number}</strong>
                  </span>
                </a>
              </div>
            </div>

            <div className="pillars" role="tablist" aria-label="Usluge">
              {pillars.map((pl, i) => (
                <button
                  key={pl.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`tab-${pl.id}`}
                  aria-selected={i === active}
                  aria-controls="station-panel"
                  tabIndex={i === active ? 0 : -1}
                  className={`pillar${i === active ? ' is-active' : ''}`}
                  data-cta={`pillar-${pl.id}`}
                  onClick={() => goTo(i)}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  <PillarIcon id={pl.id} />
                  <span>{pl.name}</span>
                </button>
              ))}
              <span className="indicator" ref={indicatorRef} style={{ transform: `translateX(${active * 100}%)` }} aria-hidden="true">
                <span className="indicator-nudge" />
              </span>
            </div>
          </div>

          <div className="scene" ref={sceneRef}>
            <div className="scene-enter">
              <div className="scene-move">
                <Scene spot={variant === 3} />
              </div>
            </div>
            <div className="station" id="station-panel" role="tabpanel" aria-labelledby={`tab-${p.id}`}>
              <span className="station-step">
                0{active + 1} / 0{pillars.length}
              </span>
              <span key={p.id} className="station-name">
                {p.name}
              </span>
              <a className="station-link" href={p.href}>
                {p.more} <Arrow />
              </a>
            </div>
            <a className="promo" href={hero.promo.href} data-cta="promo-mt15c">
              <strong>{hero.promo.lead}</strong> {hero.promo.text}
            </a>
          </div>

          {variant === 3 && (
            <div className="floor-line" aria-hidden="true">
              <svg ref={lineRef} width={lineGeom.w} height="24" viewBox={`0 0 ${lineGeom.w} 24`}>
                <defs>
                  <mask id="floor-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width={lineGeom.w} height="24">
                    <path
                      data-part="floor-mask"
                      d={`M0 12 H${lineGeom.w}`}
                      pathLength={1}
                      stroke="#fff"
                      strokeWidth="8"
                      strokeDasharray="1 1"
                      strokeDashoffset={reduced ? 0 : 1}
                    />
                  </mask>
                </defs>
                <g mask="url(#floor-reveal)" stroke="#aa0020" strokeWidth="2" strokeDasharray="10 8">
                  <path d={`M0 12 H${lineGeom.split}`} />
                  <path data-part="floor-dash" d={`M${lineGeom.split} 12 H${lineGeom.w}`} />
                </g>
              </svg>
              {lineGeom.dots.map((x, i) => (
                <span
                  key={i}
                  className="floor-dot"
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  style={{ left: x - 5 }}
                />
              ))}
            </div>
          )}
        </div>

        <ul className="trust">
          {trust.map((item) => {
            const Icon = trustIcons[item.id];
            return (
              <li key={item.id} ref={item.id === 'clients' ? clientsRef : undefined}>
                <Icon />
                {item.id === 'clients' ? (
                  <span>
                    <span className="sr-only">{item.text}</span>
                    <span aria-hidden="true">
                      <span className="count" ref={countRef}>1.000+</span> klijenata
                    </span>
                  </span>
                ) : (
                  <span>{item.text}</span>
                )}
              </li>
            );
          })}
          <li className="trust-call">
            <a href={hero.service.tel} data-cta="call-service">
              <Phone size={18} />
              {hero.service.label} <strong>{hero.service.number}</strong>
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
