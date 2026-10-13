// The shared nav for variants 2, 4 and 5. One quiet bar in Geist, the two logo files on a white
// tile, five links, the sales phone as text and one red quote button. Three themes for the three
// grounds, solid light, frosted light over a light scene, frosted dark over a dark scene.
// Filip's ruling 2026-10-08 20:28, one shared nav, fewer controls, no mono, no all caps.

import type { JSX } from 'react';
import { hero, SITE } from '../content';
import { Phone } from '../components/Icons';
import './nav.css';

export type NavTheme = 'light' | 'glass' | 'dark' | 'segment';

const links = [
  { label: 'Novi', href: '/viljuskari/' },
  { label: 'Polovni', href: '/polovni-linde-viljuskari/' },
  { label: 'Najam', href: '/iznajmljivanje-viljuskara-cena/' },
  { label: 'Servis', href: '/servis/odrzavanje-i-popravka/' },
  { label: 'Kontakt', href: '/kontakt/' },
];

// Line icons for the segment theme, 24 unit grid, drawn with the current colour.
const segIcons: Record<string, JSX.Element> = {
  Početna: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </>
  ),
  Novi: (
    <>
      <path d="M3.5 17V10.5h5.5l1.8-3H14V17" />
      <path d="M17.5 4v13.5M17.5 15.5h3.5" />
      <circle cx="6.5" cy="18.5" r="1.7" />
      <circle cx="12" cy="18.5" r="1.7" />
    </>
  ),
  Polovni: (
    <>
      <path d="M12 3.5l7 2.6v5.2c0 4.3-2.9 7.7-7 9.2-4.1-1.5-7-4.9-7-9.2V6.1z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  Najam: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" />
      <path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4" />
    </>
  ),
  Servis: <path d="M14.6 5.2a4.2 4.2 0 0 0-5.1 5.4L4.4 15.7a2 2 0 0 0 2.9 2.9l5.1-5.1a4.2 4.2 0 0 0 5.4-5.1l-2.6 2.6-2.4-.5-.5-2.4z" />,
  Kontakt: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
};

function SegIcon({ name }: { name: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {segIcons[name]}
    </svg>
  );
}

// The segment theme, a floating dashboard bar. Logo tile left, an active pill with square icon tabs
// in the middle, a round call button and the quote button right.
function SegmentNav({ className }: { className: string }) {
  return (
    <header className={`ek-nav ek-nav-segment ${className}`}>
      <a className="ek-nav-logo" href={`${SITE}/`}>
        <img src="/brand/linde-mh.png" width={57} height={34} alt="Linde Material Handling" />
        <img src="/brand/ekotehnika.png" width={81} height={22} alt="Ekotehnika, početna strana" />
      </a>
      <nav aria-label="Glavna navigacija">
        <ul>
          <li>
            <a className="ek-seg-tab ek-seg-active" href={`${SITE}/`} aria-current="page">
              <SegIcon name="Početna" />
              Početna
            </a>
          </li>
          {links.map((l) => (
            <li key={l.label}>
              <a className="ek-seg-tab ek-seg-square" href={`${SITE}${l.href}`} aria-label={l.label} title={l.label}>
                <SegIcon name={l.label} />
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ek-seg-right">
        <a className="ek-seg-round" href={hero.sales.tel} data-cta="call-sales" aria-label={`Pozovite prodaju, ${hero.sales.number}`} title={hero.sales.number}>
          <Phone size={20} />
        </a>
        <a className="ek-nav-cta" href={hero.quote.href} data-cta="quote">
          {hero.quote.label}
        </a>
      </div>
    </header>
  );
}

export function Nav({ theme = 'light', className = '' }: { theme?: NavTheme; className?: string }) {
  if (theme === 'segment') return <SegmentNav className={className} />;
  return (
    <header className={`ek-nav ek-nav-${theme} ${className}`}>
      <a className="ek-nav-logo" href={`${SITE}/`}>
        <img src="/brand/linde-mh.png" width={57} height={34} alt="Linde Material Handling" />
        <img src="/brand/ekotehnika.png" width={81} height={22} alt="Ekotehnika, početna strana" />
      </a>
      <nav aria-label="Glavna navigacija">
        <ul>
          {links.map((l) => (
            <li key={l.label}>
              <a href={`${SITE}${l.href}`}>{l.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <a className="ek-nav-phone" href={hero.sales.tel} data-cta="call-sales">
        <Phone size={16} />
        {hero.sales.number}
      </a>
      <a className="ek-nav-cta" href={hero.quote.href} data-cta="quote">
        {hero.quote.label}
      </a>
    </header>
  );
}
