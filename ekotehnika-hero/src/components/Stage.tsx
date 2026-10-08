// Header plus a full width 3D hero, pinned while the camera moves through the warehouse.
// Scroll position is the timeline. At scroll zero the copy, the quote button and the sales phone
// sit over a calm part of the scene. As the camera leaves beat 1 the headline lifts away and a
// compact card takes over, so the scene reads full width while the button stays in view.
// Checkpoint build, beats 1 and 2 only.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { hero, pillars, trust } from '../content';
import { Journey } from '../three/journey';
import { Header } from './Header';
import { Arrow, Badge, Calendar, Phone, PillarIcon, Users, Van } from './Icons';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_LENGTH = 1100;
const trustIcons = { founded: Calendar, clients: Users, status: Badge, coverage: Van } as const;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

export function Stage({ reduced }: { reduced: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const journeyRef = useRef<Journey | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const pRef = useRef(0);

  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);

  // One frame of the story, camera plus the copy hand over.
  const apply = (p: number) => {
    pRef.current = p;
    journeyRef.current?.setProgress(p);
    const out = smooth(clamp01(p / 0.3));
    const into = smooth(clamp01((p - 0.25) / 0.25));
    const top = topRef.current;
    const card = cardRef.current;
    if (top) {
      top.style.opacity = String(1 - out);
      top.style.transform = `translateY(${-24 * out}px)`;
      top.inert = out > 0.5;
    }
    if (card) {
      card.style.opacity = String(into);
      card.style.transform = `translateY(${12 * (1 - into)}px)`;
      card.inert = into < 0.5;
    }
  };

  // The renderer, sized to the scene box.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const box = sceneRef.current;
    if (!canvas || !box) return;
    let journey: Journey;
    try {
      journey = new Journey(canvas);
    } catch {
      setFailed(true);
      return;
    }
    journeyRef.current = journey;
    const ro = new ResizeObserver(() => journey.resize(box.clientWidth, box.clientHeight));
    ro.observe(box);
    journey.resize(box.clientWidth, box.clientHeight);
    apply(0);
    return () => {
      ro.disconnect();
      journey.dispose();
      journeyRef.current = null;
    };
  }, []);

  // Scroll drives the story. Snaps to the nearest beat.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;
    const ctx = gsap.context(() => {
      const state = { p: 0 };
      stRef.current = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: `+=${SCROLL_LENGTH}`,
        pin: true,
        anticipatePin: 1,
        snap: { snapTo: 1, duration: { min: 0.3, max: 0.9 }, delay: 0.1, ease: 'power2.inOut' },
        // Pinning moves the canvas into a spacer, so draw a fresh frame after every refresh.
        onRefresh: () => requestAnimationFrame(() => apply(state.p)),
        onUpdate: (self) => {
          gsap.to(state, { p: self.progress, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: () => apply(state.p) });
        },
      });
    }, stage);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      stRef.current = null;
      ctx.revert();
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) apply(pRef.current);
  }, [reduced]);

  // Beats 3 to 5 are not built yet, so every pillar lands on beat 2 and the card copy follows it.
  const goTo = (i: number) => {
    setActive(i);
    const st = stRef.current;
    if (!st || reduced) {
      apply(1);
      return;
    }
    window.scrollTo({ top: st.end, behavior: 'smooth' });
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = pillars.length - 1;
    const next =
      e.key === 'ArrowRight' ? (i + 1) % pillars.length
      : e.key === 'ArrowLeft' ? (i - 1 + pillars.length) % pillars.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    tabRefs.current[next]?.focus();
    goTo(next);
  };

  const p = pillars[active];

  return (
    <div className="stage" ref={stageRef}>
      <Header />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-main" ref={sceneRef}>
          {failed ? (
            <div className="scene-fallback">Ilustracija skladišta sa Linde viljuškarom</div>
          ) : (
            <canvas
              className="scene-canvas"
              ref={canvasRef}
              role="img"
              aria-label="Ilustracija, Linde viljuškar sa paletom vozi kroz skladište, pored izložbenog prostora sa novim viljuškarima"
            />
          )}

          <div className="copy-top" ref={topRef}>
            <p className="kicker">{hero.kicker}</p>
            <h1 id="hero-title" className="headline">
              {hero.headline.map((line) => (
                <span key={line} className="hl-line">
                  {line}
                </span>
              ))}
            </h1>
            <p className="sub">{hero.sub}</p>
            <div className="cta-row">
              <a className="btn-quote" href={hero.quote.href} data-cta="quote">
                {hero.quote.label}
              </a>
              <a className="call" href={hero.sales.tel} data-cta="call-sales">
                <Phone size={18} />
                <span>
                  {hero.sales.label} <strong>{hero.sales.number}</strong>
                </span>
              </a>
            </div>
          </div>

          <div className="dock">
            <div className="card" ref={cardRef} id="station-panel" role="tabpanel" aria-labelledby={`tab-${p.id}`}>
              <span className="station-step">
                0{active + 1} / 0{pillars.length}
              </span>
              <span key={p.id} className="station-name">
                {p.name}
              </span>
              <p className="card-line">{p.line}</p>
              <div className="cta-row">
                <a className="btn-quote" href={hero.quote.href} data-cta="quote">
                  {p.cta}
                </a>
                <a className="station-link" href={p.href} data-cta={`pillar-${p.id}`}>
                  {p.more} <Arrow />
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
              <span className="indicator" style={{ transform: `translateX(${active * 100}%)` }} aria-hidden="true">
                <span className="indicator-bar" />
              </span>
            </div>
          </div>

          <a className="promo" href={hero.promo.href} data-cta="promo-mt15c">
            <strong>{hero.promo.lead}</strong> {hero.promo.text}
          </a>
        </div>

        <ul className="trust">
          {trust.map((item) => {
            const Icon = trustIcons[item.id];
            return (
              <li key={item.id}>
                <Icon />
                <span>{item.text}</span>
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
