import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { REDUCED, useSectionMotion } from '../../lib/motion';
import { heroBuild, heroIdle, slideIn } from './entrance';
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

  const go = useCallback((i: number) => setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length), []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  };

  const active = SLIDES[index];
  // Slide 1 is the only one that shows the mark; it sits where the static SVG did.
  // The hero is above the fold, so the observer in useSectionMotion fires at
  // once; the hook still holds the timeline until the browser has painted.
  const heroRef = useSectionMotion<HTMLElement>(
    useCallback(({ el, tl }) => heroBuild(el, tl), []),
    { threshold: 0, idle: heroIdle },
  );

  // Each slide change replays the copy choreography, so the mask reveal and the
  // glare are seen on every slide rather than only the first. Skipped on the
  // very first render, which the entrance above already covers.
  // Keyed on the index actually animated, not a "first render" flag: StrictMode
  // runs this twice on mount, and a boolean guard lets the second run replay the
  // copy from zero — which looked exactly like the entrance stuttering.
  const shown = useRef<number | null>(null);
  useEffect(() => {
    if (shown.current === index) return;
    const previous = shown.current;
    shown.current = index;
    if (previous === null) return; // the entrance covers the first slide
    const el = heroRef.current;
    if (!el || REDUCED) return;

    const slide = el.querySelector<HTMLElement>('.hero__slide.is-active');
    if (!slide) return;

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    slideIn(slide, tl, 0);

    // The CSS crossfade takes 600ms; if the copy tweens are still holding their
    // start values after that plus their own run, force the settled state.
    const guard = window.setTimeout(() => {
      if (tl.progress() < 1) tl.progress(1);
    }, 2600);

    return () => { window.clearTimeout(guard); tl.kill(); gsap.set(slide.querySelectorAll('.line__in, .eyebrow, .hero__cta'), { clearProps: 'transform,opacity,filter' }); };
  }, [index]);

  const markPlacement = useMemo(() => ({ heightFraction: 0.56, widthFraction: 0.33, cx: 0.735, cy: 0.42 }), []);

  return (
    <section
      ref={heroRef}
      data-motion="pending"
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
      <div className={`hero__bg hero__bg--${SLIDES[index].id}`} aria-hidden="true">
        <span className="hero__glow hero__glow--ember" />
        <span className="hero__glow hero__glow--peach" />
        <span className="hero__glow hero__glow--orange" />
        <span className="hero__glow hero__glow--core" />
        <span className="hero__glow hero__glow--cream" />
        <span className="hero__horizon" />
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
                  <h1 className="display hero__title">{s.title}</h1>
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
