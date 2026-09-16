import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Nav } from '../Nav';
import { Position } from './Position';
import { TickerCard, type Ticker } from './TickerCard';
import { StackDiagram } from './StackDiagram';
import { VisualAccount, VisualFuture } from './visuals';
import './visuals.css';
import liveDot from '../../assets/icons/live-dot.svg';
import ribs from '../../assets/hero/mark3d-ribs.svg';
import slices from '../../assets/hero/mark3d-slices.svg';
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

function Mark3D() {
  return (
    <div className="mark3d" aria-hidden="true">
      <img src={ribs} alt="" className="mark3d__ribs" />
      <img src={slices} alt="" className="mark3d__slices" />
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    id: 'future',
    eyebrow: 'Global Markets. One Platform.',
    title: 'The Future\nof Trading',
    lede: 'Phorecast combines global market access with fast onboarding, non-custodial trading, and transparent on-chain execution.',
    cta: 'Get Started',
    href: '#signup',
    visual: <Mark3D />,
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

  return (
    <section
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

      <div className="container hero__inner">
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
