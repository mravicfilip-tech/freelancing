import { useEffect, useRef, useState } from 'react';
import { HeroPlanet } from './HeroPlanet';
import { HERO_VARIANT, PLANET_ENABLED, PLANET_STATIC, useGlobe } from '../heroVariant';

const PRESALE_END = Date.UTC(2026, 9, 15, 12, 0, 0); // 15 Oct 2026 12:00 UTC

function useCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const left = Math.max(0, PRESALE_END - now);
  return { days: Math.floor(left / 86_400_000), hours: Math.floor((left % 86_400_000) / 3_600_000) };
}

function Corners() {
  return (
    <>
      <span className="hero__corner hero__corner--tl" aria-hidden="true" />
      <span className="hero__corner hero__corner--tr" aria-hidden="true" />
      <span className="hero__corner hero__corner--bl" aria-hidden="true" />
      <span className="hero__corner hero__corner--br" aria-hidden="true" />
    </>
  );
}

function Countdown() {
  const { days, hours } = useCountdown();
  return (
    <p className="hero__note">
      <span className="hero__live" aria-hidden="true" />
      Presale closes in {days} days and {hours} hours.
    </p>
  );
}

/** 1 — Ledger: left-aligned copy, the globe large on the right. */
function HeroLedger() {
  const ref = useRef<HTMLElement>(null);
  const globe = useGlobe();
  return (
    <section ref={ref} className="hero" data-hero="1" id="top">
      <Corners />
      <div className="hero__content">
        <h1 className="hero__title">
          Send crypto.
          <br />
          It arrives as money.
        </h1>
        <p className="hero__body">
          Remittix pays crypto straight into bank accounts in 30 countries, converted at the rate you
          see, usually within minutes.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#presale" id="join-presale">Join the presale</a>
          <a className="hero__link" href="#how">How it works</a>
        </div>
        <Countdown />
        <p className="hero__proof">$16.4M raised so far.</p>
      </div>
      {PLANET_ENABLED && <HeroPlanet hostRef={ref} variant={globe} forceStatic={PLANET_STATIC} />}
    </section>
  );
}

/** 2 — Orbit: centred copy, the globe rising through the bottom edge. */
function HeroOrbit() {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} className="hero" data-hero="2" id="top">
      <Corners />
      <div className="hero__content">
        <h1 className="hero__title">
          Pay any bank account
          <br />
          from your wallet.
        </h1>
        <p className="hero__body">
          Lagos, Manila, Madrid. Pick an account, send from your wallet, and it lands as local
          currency in minutes.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#presale" id="join-presale">Join the presale</a>
        </div>
        <Countdown />
      </div>
      {PLANET_ENABLED && <HeroPlanet hostRef={ref} variant="orbital-rise" forceStatic={PLANET_STATIC} />}
    </section>
  );
}

const TRANSFERS = [
  { from: 'USDC', to: 'NGN', city: 'Lagos', time: '38 s' },
  { from: 'ETH', to: 'PHP', city: 'Manila', time: '1 m 04 s' },
  { from: 'USDT', to: 'EUR', city: 'Madrid', time: '22 s' },
];

/** 3 — Stage: copy on the left, the globe inside a product panel with a live settlement list. */
function HeroStage() {
  const ref = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  return (
    <section ref={ref} className="hero" data-hero="3" id="top">
      <Corners />
      <div className="hero__content">
        <h1 className="hero__title">
          Crypto to bank,
          <br />
          in minutes.
        </h1>
        <p className="hero__body">
          Choose a currency and an account. Remittix handles conversion, compliance and settlement
          in one transaction.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#presale" id="join-presale">Join the presale</a>
          <a className="hero__link" href="#how">How it works</a>
        </div>
        <Countdown />
      </div>
      <div className="stage">
        <div ref={stage} className="stage__view">
          {PLANET_ENABLED && (
            <HeroPlanet hostRef={stage} variant="orbital-stage" layout="capture" forceStatic={PLANET_STATIC} />
          )}
        </div>
        <ul className="stage__ledger" aria-label="Recent settlements">
          {TRANSFERS.map((t) => (
            <li key={t.city}>
              <span className="stage__pair">{t.from} to {t.to}</span>
              <span className="stage__city">{t.city}</span>
              <span className="stage__time">settled in {t.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Hero() {
  if (HERO_VARIANT === '2') return <HeroOrbit />;
  if (HERO_VARIANT === '3') return <HeroStage />;
  return <HeroLedger />;
}
