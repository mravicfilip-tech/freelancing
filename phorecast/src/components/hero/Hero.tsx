import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { REDUCED } from '../../lib/motion';
import { heroEntrance, heroTransition } from './choreography';
import { GlowLayer, GLOW_ANCHORS, newGlowState } from './glow/GlowLayer';
import { startAmbient, type Ambient } from './ambient';
import { startInteract, type Interact } from './interact';
import { Nav } from '../Nav';
import { Position } from './Position';
import { TickerCard, type Ticker } from './TickerCard';
import { StackDiagram } from './StackDiagram';
import { VisualAccount, VisualFuture } from './visuals';
import { HeroLogo } from '../HeroLogo';
import './visuals.css';
import liveDot from '../../assets/icons/live-dot.svg';
import apple from '../../assets/icons/apple.svg';
import tesla from '../../assets/icons/tesla.svg';
import bitcoin from '../../assets/icons/bitcoin.svg';
import gold from '../../assets/icons/gold.svg';
import './Hero.css';

const TICKERS: Ticker[] = [
  { symbol: 'AAPL', name: 'Apple', price: '$326.57', change: '+3.57%', up: true, icon: apple },
  { symbol: 'TSLA', name: 'Tesla', price: '$363.56', change: '-1.13%', up: false, icon: tesla },
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '$77,603.00', change: '+0.87%', up: true, icon: bitcoin },
  { symbol: 'XAU/USD', name: 'Gold', price: '$4,308.24', change: '−0.90%', up: false, icon: gold },
];

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  cta: string;
  href: string;
  visual: ReactNode;
  foot?: ReactNode;
};

const SLIDES: Slide[] = [
  {
    id: 'mark',
    eyebrow: 'Global Markets. One Platform.',
    title: 'The Future\nof Trading',
    lede: 'Phorecast combines global market access with fast onboarding, non-custodial trading, and transparent on-chain execution.',
    cta: 'Get Started',
    href: '#signup',
    visual: null,
    foot: (
      <ul className="hero__foot" aria-label="Market snapshot">
        {TICKERS.map((t) => <TickerCard key={t.symbol} t={t} />)}
      </ul>
    ),
  },
  {
    id: 'account',
    eyebrow: 'Global Markets. One Platform.',
    title: 'One account.\nYour keys.',
    lede: 'Open Phorecast in minutes and trade every asset class without handing anyone custody of your funds.',
    cta: 'Create account',
    href: '#signup',
    visual: <VisualAccount />,
  },
  {
    id: 'bonus',
    eyebrow: 'Global Markets. One Platform.',
    title: 'Half this stack\nis on us.',
    lede: 'Fund your account and Phorecast matches it,\ndollar for dollar, up to $200.',
    cta: 'Get your bonus',
    href: '#signup',
    visual: <div className="hero__stack"><StackDiagram /></div>,
  },
  {
    id: 'future',
    eyebrow: 'Global Markets. One Platform.',
    title: 'The Future\nof Trading',
    lede: 'Phorecast combines global market access with fast onboarding, non-custodial trading, and transparent on-chain execution.',
    cta: 'Get Started',
    href: '#signup',
    visual: <VisualFuture />,
  },
];

const AUTOPLAY_MS = 7000;

/** `?slide=3` opens on a given slide (handy for review) and pauses autoplay. */
function initialSlide() {
  const n = Number(new URLSearchParams(window.location.search).get('slide'));
  return n >= 1 && n <= SLIDES.length ? n - 1 : 0;
}

export function Hero() {
  const [index, setIndex] = useState(initialSlide);
  const [paused, setPaused] = useState(() => initialSlide() !== 0);
  const reduced = useRef(false);
  const heroRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Live uniforms for the shader glow; GSAP tweens the numbers in place.
  const glow = useRef(newGlowState(SLIDES[initialSlide()].id));
  const entrance = useRef<gsap.core.Timeline | null>(null);
  const life = useRef<{ ambient: Ambient; interact: Interact } | null>(null);
  const shown = useRef<number | null>(null);
  // The background lags the slide by the length of the glow dip, so its anchor
  // jumps while the glows are dark instead of snapping in full view.
  const [bgId, setBgId] = useState(() => SLIDES[initialSlide()].id);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    const onChange = () => { reduced.current = mq.matches; };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (paused || reduced.current) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, index]);

  // The hero is above the fold, so the entrance runs on mount rather than
  // waiting for an IntersectionObserver. useLayoutEffect, so the `from` tweens
  // set their start values before the first paint.
  useLayoutEffect(() => {
    const el = heroRef.current;
    if (!el || REDUCED) return;
    const ctx = gsap.context(() => {
      entrance.current = heroEntrance(el, SLIDES[initialSlide()].id);
    }, el);
    return () => {
      entrance.current = null;
      ctx.revert();
    };
  }, []);

  // Slide changes. Each change owns a context, so the one before it is reverted
  // — no inline styles survive a change, however fast they are driven.
  useLayoutEffect(() => {
    const el = heroRef.current;
    const toEl = slideRefs.current[index];
    const previous = shown.current;
    shown.current = index;
    if (!el || !toEl || previous === null || previous === index) return;
    if (REDUCED) {
      const a = GLOW_ANCHORS[SLIDES[index].id] ?? GLOW_ANCHORS.mark;
      for (let i = 0; i < 5; i++) glow.current.x[i] = a[i];
      setBgId(SLIDES[index].id);
      return;
    }
    // Finish any entrance still in flight so the transition starts from a
    // settled baseline rather than fighting it.
    entrance.current?.progress(1).kill();
    entrance.current = null;

    // The shader glow does not jump between anchors like the CSS one: it slides
    // the discs across the frame over the length of the change.
    const anchor = GLOW_ANCHORS[SLIDES[index].id] ?? GLOW_ANCHORS.mark;
    gsap.to(glow.current.x, {
      0: anchor[0], 1: anchor[1], 2: anchor[2], 3: anchor[3], 4: anchor[4],
      duration: 1.15,
      ease: 'power2.inOut',
    });

    // Idle loops and the pointer field let go of the old slide for the length
    // of the change, then rebind to the new one once it has settled.
    life.current?.ambient.setSlide(SLIDES[index].id, null);
    life.current?.interact.setSlide(SLIDES[index].id, null);

    const ctx = gsap.context(() => {
      heroTransition({
        el,
        fromEl: slideRefs.current[previous] ?? null,
        fromId: SLIDES[previous].id,
        toEl,
        toId: SLIDES[index].id,
        swapBg: () => setBgId(SLIDES[index].id),
        onSettled: () => {
          life.current?.ambient.setSlide(SLIDES[index].id, toEl);
          life.current?.interact.setSlide(SLIDES[index].id, toEl);
        },
      });
    }, el);
    return () => ctx.revert();
  }, [index]);

  // Idle life, the pointer field and the scroll depth. Started after the
  // entrance has played so nothing competes with it for a transform channel.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const ambient = startAmbient(el);
    const interact = startInteract(el, glow.current);
    life.current = { ambient, interact };

    const bind = () => {
      const i = shown.current ?? 0;
      const slide = slideRefs.current[i] ?? null;
      ambient.setSlide(SLIDES[i].id, slide);
      interact.setSlide(SLIDES[i].id, slide);
    };
    if (entrance.current) entrance.current.eventCallback('onComplete', bind);
    else bind();

    return () => {
      ambient.stop();
      interact.stop();
      life.current = null;
    };
  }, []);

  // When the shader takes over, the CSS discs step back: same picture, drawn
  // twice otherwise. Nothing here runs unless the scene actually started.
  const onGlowReady = useCallback(() => {
    const el = heroRef.current;
    if (!el) return;
    life.current?.ambient.shaderLive();
    gsap.to(el.querySelectorAll('.hero__glow, .hero__horizon'), {
      opacity: 0,
      duration: 0.7,
      ease: 'power2.inOut',
    });
    gsap.to(glow.current, { intro: 1, duration: 1.1, ease: 'power3.out' });
  }, []);

  const go = useCallback((i: number) => setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length), []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  };

  const active = SLIDES[index];
  // Slide 1 is the only one that shows the mark; it sits where the static SVG did.
  const markPlacement = useMemo(() => ({ heightFraction: 0.56, widthFraction: 0.33, cx: 0.735, cy: 0.42 }), []);

  return (
    <section
      ref={heroRef}
      className="hero"
      id="top"
      aria-roledescription="carousel"
      aria-label="Phorecast highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKey}
    >
      <div ref={bgRef} className={`hero__bg hero__bg--${bgId}`} aria-hidden="true">
        <span className="hero__glow hero__glow--ember" />
        <span className="hero__glow hero__glow--peach" />
        <span className="hero__glow hero__glow--orange" />
        <span className="hero__glow hero__glow--core" />
        <span className="hero__glow hero__glow--cream" />
        <span className="hero__horizon" />
        <GlowLayer hostRef={bgRef} state={glow} onReady={onGlowReady} still={REDUCED} />
      </div>

      <HeroLogo
        hostRef={heroRef}
        variant="lined"
        placement={markPlacement}
        className={`hero__logo${index === 0 ? ' is-visible' : ''}`}
      />

      <div className="container container--wide hero__inner">
        <Nav />

        <div className="hero__stage">
          {SLIDES.map((s, i) => (
            <div
              key={s.id}
              ref={(node) => { slideRefs.current[i] = node; }}
              className={`hero__slide${i === index ? ' is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              aria-hidden={i !== index}
            >
              <div className="hero__copy">
                <div className="hero__heading">
                  <p className="eyebrow">
                    <img src={liveDot} alt="" className="eyebrow__dot" width={12} height={12} />
                    {s.eyebrow}
                  </p>
                  <h1 className="display hero__title">
                    {s.title.split('\n').map((line) => (
                      // Each line is its own mask, so the headline can rise out
                      // of nothing and leave through the top on a slide change.
                      <span key={line} className="hero__line">
                        <span className="hero__line-in">{line}</span>
                      </span>
                    ))}
                  </h1>
                </div>
                <p className="lede hero__lede">{s.lede}</p>
                <a href={s.href} className="btn btn--primary hero__cta" tabIndex={i === index ? 0 : -1}>{s.cta}</a>
              </div>
              <div className="hero__visual">{s.visual}</div>
            </div>
          ))}
        </div>

        <div className="hero__position">
          <Position index={index} count={SLIDES.length} onSelect={go} />
        </div>

        {active.foot ?? <div className="hero__foot" />}
      </div>
    </section>
  );
}
