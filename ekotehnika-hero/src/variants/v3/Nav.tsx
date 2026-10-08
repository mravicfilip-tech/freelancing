// The floating frosted nav, laid out like the reel's. Logos on a white tile at the left, four
// links with small chevrons, an Ask style search pill, a square phone button, a white sales phone
// pill and the bright quote button at the right.
import { forwardRef } from 'react';
import { SITE, hero } from '../../content';
import { ASK, NAV } from './copy';

const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
    <path d="M2 3.6l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Spark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
    <path d="M7 0.8c.5 3.4 2.6 5.5 6 6-3.4.5-5.5 2.6-6 6-.5-3.4-2.6-5.5-6-6 3.4-.5 5.5-2.6 6-6z" fill="currentColor" />
  </svg>
);

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M2.5 8h11M9 3.5L13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Phone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const Nav = forwardRef<HTMLElement>(function Nav(_, ref) {
  return (
    <header ref={ref} className="v3-nav">
      <a className="v3-logos" href={SITE} aria-label="Ekotehnika, Linde Material Handling, početna">
        <img src="/brand/linde-mh.png" alt="Linde Material Handling" width={60} height={36} />
        <img src="/brand/ekotehnika.png" alt="Ekotehnika" width={92} height={25} />
      </a>
      <nav className="v3-links" aria-label="Glavni meni">
        {NAV.map((n) => (
          <a key={n.label} href={n.href}>
            {n.label}
            <Chevron />
          </a>
        ))}
      </nav>
      <div className="v3-actions">
        <a className="v3-ask" href={ASK.href}>
          <span className="v3-spark">
            <Spark />
          </span>
          <span>{ASK.label}</span>
          <Arrow />
        </a>
        <a className="v3-sq" href={hero.service.tel} data-cta="call-service" aria-label={`${hero.service.label} ${hero.service.number}`} title={`${hero.service.label} ${hero.service.number}`}>
          <Phone />
        </a>
        <a className="v3-sales" href={hero.sales.tel} data-cta="call-sales" aria-label={`${hero.sales.label} ${hero.sales.number}`}>
          {hero.sales.number}
        </a>
        <a className="v3-cta" href={hero.quote.href} data-cta="quote">
          {hero.quote.label}
        </a>
      </div>
    </header>
  );
});
