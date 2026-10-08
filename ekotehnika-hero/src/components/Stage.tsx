// The full bleed scroll story. The 3D warehouse fills the screen under a floating nav, and the
// page is pinned while one forklift takes an order from the rack to the dock door. Each camera
// chapter brings its own line of copy, revealed word by word as the story reaches it. The story
// bar at the bottom tracks the four services the truck passes and jumps to any of them.
//
// At scroll zero the intro is a complete hero, headline, quote button, sales phone and the
// company's own claims, so nothing needed to convert sits behind the scroll.

import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chapters, finale, hero, pillars, storyStops, trust } from '../content';
import { Journey, LAST_BEAT } from '../three/journey';
import { Nav } from './Nav';
import { Arrow, Badge, Calendar, Phone, PillarIcon, Users, Van } from './Icons';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_PER_CHAPTER = 950;
// Where scroll comes to rest in each chapter, after the camera hold and the copy are in.
const REST = 0.22;
const trustIcons = { founded: Calendar, clients: Users, status: Badge, coverage: Van } as const;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i} className="w">
          {w}{' '}
        </span>
      ))}
    </>
  );
}

// Staggered reveal for the words in el. e runs 0 to 1, x is the exit, 0 to 1.
function revealWords(el: HTMLElement | null, e: number, x: number) {
  if (!el) return;
  const words = el.querySelectorAll<HTMLElement>('.w');
  const n = words.length;
  words.forEach((w, k) => {
    const wo = smooth(clamp01((e * (n + 2) - k) / 2));
    w.style.opacity = String(wo * (1 - x));
    w.style.transform = `translateY(${(1 - wo) * 18 - x * 16}px)`;
  });
}

function show(el: HTMLElement | null, o: number, y = 0) {
  if (!el) return;
  el.style.opacity = String(o);
  el.style.transform = `translateY(${y}px)`;
  el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
  el.inert = o < 0.5;
}

export function Stage({ reduced }: { reduced: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finaleRef = useRef<HTMLDivElement>(null);
  const promoRef = useRef<HTMLAnchorElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const stopRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement>(null);
  const journeyRef = useRef<Journey | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const countedRef = useRef(false);
  const bRef = useRef(0);
  const [failed, setFailed] = useState(false);

  // One frame of the story at story time b.
  const apply = (b: number) => {
    bRef.current = b;
    journeyRef.current?.setStory(b);

    const introO = 1 - smooth(clamp01((b - 0.3) / 0.25));
    show(introRef.current, introO, -30 * (1 - introO));

    chapterRefs.current.forEach((el, i) => {
      if (!el) return;
      const e = clamp01((b - (i - 0.2)) / 0.35);
      const x = smooth(clamp01((b - (i + 0.55)) / 0.15));
      show(el, e > 0 && x < 1 ? 1 : 0);
      const label = el.querySelector<HTMLElement>('.ch-label');
      if (label) label.style.opacity = String(smooth(clamp01(e * 3)) * (1 - x));
      revealWords(el.querySelector('.ch-line'), e, x);
    });

    const fe = clamp01((b - 7.7) / 0.3);
    const fin = finaleRef.current;
    show(fin, fe > 0 ? 1 : 0);
    revealWords(fin?.querySelector('.fin-title') ?? null, fe, 0);
    fin?.querySelectorAll<HTMLElement>('.fin-fade').forEach((el) => {
      el.style.opacity = String(smooth(clamp01(fe * 1.6 - 0.4)));
    });
    if (fe > 0.6 && !countedRef.current && countRef.current) {
      countedRef.current = true;
      const n = { v: 0 };
      const el = countRef.current;
      gsap.to(n, {
        v: 1000,
        duration: reduced ? 0 : 0.9,
        ease: 'power2.out',
        onUpdate: () => (el.textContent = n.v >= 1000 ? '1.000+' : `${Math.round(n.v / 10) * 10}+`),
      });
    }
    if (fe < 0.1) countedRef.current = false;

    show(promoRef.current, Math.max(introO, fe));

    if (fillRef.current) fillRef.current.style.transform = `scaleX(${b / LAST_BEAT})`;
    const current = [...storyStops].reverse().find((s) => b >= s.chapter - 0.4);
    stopRefs.current.forEach((el, k) => el?.classList.toggle('is-active', storyStops[k] === current && b < 7.75));
  };

  // The renderer, sized to the stage.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const box = stageRef.current;
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
    apply(bRef.current);
    return () => {
      ro.disconnect();
      journey.dispose();
      journeyRef.current = null;
    };
  }, []);

  // Scroll is the story clock. It eases toward the scroll position and rests inside a chapter.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (reduced) {
      apply(bRef.current);
      return;
    }
    const rests = [0, ...chapters.slice(1, -1).map((_, i) => (i + 1 + REST) / LAST_BEAT), 1];
    const ctx = gsap.context(() => {
      const state = { b: bRef.current };
      stRef.current = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: `+=${SCROLL_PER_CHAPTER * LAST_BEAT}`,
        pin: true,
        anticipatePin: 1,
        snap: {
          snapTo: (v: number) => rests.reduce((best, r) => (Math.abs(r - v) < Math.abs(best - v) ? r : best), 0),
          duration: { min: 0.3, max: 1 },
          delay: 0.15,
          ease: 'power2.inOut',
        },
        onUpdate: (self) => {
          gsap.to(state, {
            b: self.progress * LAST_BEAT,
            duration: 0.5,
            ease: 'power3.out',
            overwrite: true,
            onUpdate: () => apply(state.b),
          });
        },
        onRefresh: () => requestAnimationFrame(() => apply(state.b)),
      });
    }, stage);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      stRef.current = null;
      ctx.revert();
    };
  }, [reduced]);

  const goTo = (chapter: number) => {
    const b = chapter + REST;
    const st = stRef.current;
    if (!st || reduced) {
      apply(b);
      return;
    }
    window.scrollTo({ top: st.start + ((st.end - st.start) * b) / LAST_BEAT, behavior: 'smooth' });
  };

  return (
    <div className="stage" ref={stageRef}>
      {failed ? (
        <div className="scene-fallback">Ilustracija skladišta sa Linde viljuškarom</div>
      ) : (
        <canvas
          className="scene-canvas"
          ref={canvasRef}
          role="img"
          aria-label="Ilustracija, Linde viljuškar preuzima paletu sa police i prevozi je kroz skladište, pored servisa i polovnih viljuškara, do utovarne rampe"
        />
      )}
      <Nav />

      <section className="story" aria-labelledby="hero-title">
        <div className="intro" ref={introRef}>
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
          <ul className="claims">
            {trust.slice(0, 3).map((item) => {
              const Icon = trustIcons[item.id];
              return (
                <li key={item.id}>
                  <Icon />
                  {item.text}
                </li>
              );
            })}
          </ul>
        </div>

        {chapters.map((ch, i) =>
          ch.line ? (
            <div
              key={i}
              className={`chapter ${ch.side}`}
              ref={(el) => {
                chapterRefs.current[i] = el;
              }}
            >
              <p className="ch-label">
                <span>0{i}</span> {ch.label}
              </p>
              <p className="ch-line">
                <Words text={ch.line} />
              </p>
              {ch.pillar && (
                <a className="ch-link" href={pillars.find((p) => p.id === ch.pillar)?.href} data-cta={`pillar-${ch.pillar}`}>
                  {pillars.find((p) => p.id === ch.pillar)?.more} <Arrow />
                </a>
              )}
            </div>
          ) : null,
        )}

        <div className="finale" ref={finaleRef}>
          <h2 className="fin-title">
            <Words text={finale.title} />
          </h2>
          <p className="sub fin-fade">{finale.line}</p>
          <ul className="stats fin-fade">
            {trust.map((item) => (
              <li key={item.id}>
                {item.id === 'clients' ? (
                  <>
                    <span className="sr-only">{item.text}</span>
                    <span aria-hidden="true">
                      <span className="stat-num" ref={countRef}>
                        1.000+
                      </span>
                      <span className="stat-label">klijenata</span>
                    </span>
                  </>
                ) : item.id === 'founded' ? (
                  <span className="stat-num">{item.text}</span>
                ) : (
                  <span className="stat-text">{item.text}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="cta-row fin-fade">
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

        <a className="promo" ref={promoRef} href={hero.promo.href} data-cta="promo-mt15c">
          <strong>{hero.promo.lead}</strong> {hero.promo.text}
        </a>

        <nav className="storybar" aria-label="Usluge na putu isporuke">
          <span className="storybar-track" aria-hidden="true">
            <span className="storybar-fill" ref={fillRef} />
          </span>
          <ul>
            {storyStops.map((s, k) => {
              const pl = pillars.find((p) => p.id === s.pillar)!;
              return (
                <li key={s.pillar}>
                  <button
                    type="button"
                    ref={(el) => {
                      stopRefs.current[k] = el;
                    }}
                    data-cta={`pillar-${pl.id}`}
                    onClick={() => goTo(s.chapter)}
                  >
                    <PillarIcon id={pl.id} size={22} />
                    <span>{pl.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </section>
    </div>
  );
}
