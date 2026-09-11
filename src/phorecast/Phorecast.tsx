import { useRef } from 'react';
import { HeroLogo } from './HeroLogo';
import { LogoMark, TrendArrow } from './icons';
import swooshTop from './assets/swoosh-top.svg';
import swooshBottom from './assets/swoosh-bottom.svg';
import { LOGO_ENABLED, LOGO_STATIC } from '../site';
import './phorecast.css';

const NAV = [
  ['Product', '#product'],
  ['Solution', '#solution'],
  ['Roadmap', '#roadmap'],
  ['About', '#about'],
  ['Docs', '#docs'],
  ['Blog', '#blog'],
  ['FAQs', '#faqs'],
] as const;

type Trend = 'up' | 'down';
const SIGNALS: { trend: Trend; value: string; label: string }[] = [
  { trend: 'down', value: '1.2%', label: 'ECB deposit rate below' },
  { trend: 'up', value: '3.0%', label: 'BTC deposit rate above' },
  { trend: 'down', value: '1.2%', label: 'ECB deposit rate below' },
  { trend: 'up', value: '3.0%', label: 'ETH deposit rate above' },
  { trend: 'down', value: '1.2%', label: 'SOL deposit rate below' },
  { trend: 'up', value: '0.4%', label: 'TSL deposit rate above' },
];

const SECTIONS = [
  { id: 'product', title: 'Product', body: 'Forecast markets with probability-weighted positions. One account, every venue, settled on-chain.' },
  { id: 'solution', title: 'Solution', body: 'Rates, crypto and equities in a single order book, priced by the crowd and cleared in seconds.' },
  { id: 'roadmap', title: 'Roadmap', body: 'Public beta this quarter. Mobile, margin and institutional APIs follow through the year.' },
];

export function Phorecast() {
  const hero = useRef<HTMLElement>(null);
  return (
    <>
      <header className="ph-nav">
        <a className="ph-nav__brand" href="/" aria-label="Phorecast home">
          <LogoMark className="ph-nav__mark" />
          <span className="ph-nav__wordmark">Phorecast</span>
        </a>
        <nav className="ph-nav__links" aria-label="Primary">
          {NAV.map(([label, href]) => (
            <a key={label} href={href}>{label}</a>
          ))}
        </nav>
        <a className="ph-btn ph-btn--nav" href="#get-started" id="get-started">Get Started</a>
      </header>
      <main>
        <section ref={hero} className="ph-hero" id="top">
          <div className="ph-hero__lines" aria-hidden="true">
            <img className="ph-hero__lines-top" src={swooshTop} alt="" width={2726} height={1569} decoding="async" />
            <img className="ph-hero__lines-bottom" src={swooshBottom} alt="" width={2782} height={1624} decoding="async" />
          </div>
          {LOGO_ENABLED && <HeroLogo hostRef={hero} forceStatic={LOGO_STATIC} />}
          <div className="ph-hero__foot">
            <div className="ph-hero__copy">
              <h1 className="ph-hero__title">
                The Future of Trading
                <br />
                Starts with <span className="ph-hero__accent">Phorecast</span>
              </h1>
              <div className="ph-hero__actions">
                <a className="ph-btn ph-btn--pill" href="#get-started" id="trade-now">Trade Now</a>
                <a className="ph-btn ph-btn--pill ph-btn--ghost" href="#product">Learn More</a>
              </div>
            </div>
            <ul className="ph-signals" aria-label="Market signals">
              {SIGNALS.map((s, i) => (
                <li key={i} className="ph-signal">
                  <span className={`ph-signal__value ph-signal__value--${s.trend}`}>
                    <TrendArrow direction={s.trend} className="ph-signal__arrow" />
                    {s.value}
                  </span>
                  <span className="ph-signal__label">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        {SECTIONS.map((s) => (
          <section key={s.id} className="ph-section" id={s.id}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </main>
    </>
  );
}
