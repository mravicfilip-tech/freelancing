import { useRef } from 'react';
import { HeroPlanet } from './HeroPlanet';

// `?planet=off` renders the hero without the WebGL layer (the baseline for Lighthouse comparisons);
// `?planet=static` forces the reduced-motion single frame.
const PLANET_PARAM = new URLSearchParams(window.location.search).get('planet');
const PLANET_ENABLED = PLANET_PARAM !== 'off';
const PLANET_STATIC = PLANET_PARAM === 'static';

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  return (
    <section ref={heroRef} className="hero" id="top">
      <span className="hero__corner hero__corner--tl" aria-hidden="true" />
      <span className="hero__corner hero__corner--tr" aria-hidden="true" />
      <span className="hero__corner hero__corner--bl" aria-hidden="true" />
      <span className="hero__corner hero__corner--br" aria-hidden="true" />

      <div className="hero__content">
        <p className="hero__eyebrow">Crypto to bank, in minutes</p>
        <h1 className="hero__title">
          <span className="nowrap">Cross-border</span>
          <br />
          Payments
          <br />
          <span className="hero__accent">Reinvented</span>
        </h1>
        <p className="hero__body">
          Send crypto straight to any bank account in 30+ countries. Instant settlement, transparent
          fees, no middlemen — just money that arrives.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#presale" id="join-presale">
            Join Presale <span aria-hidden="true">→</span>
          </a>
          <a className="btn btn--ghost" href="#whitepaper">Read the whitepaper</a>
        </div>
        <div className="hero__proof">
          <div><strong>$16.4M</strong>raised in presale</div>
          <div><strong>30+</strong>countries at launch</div>
          <div><strong>40+</strong>supported assets</div>
        </div>
      </div>

      {PLANET_ENABLED && <HeroPlanet hostRef={heroRef} forceStatic={PLANET_STATIC} />}
    </section>
  );
}
