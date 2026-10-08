// The shared nav for variants 2, 4 and 5. One quiet bar in Geist, the two logo files on a white
// tile, five links, the sales phone as text and one red quote button. Three themes for the three
// grounds, solid light, frosted light over a light scene, frosted dark over a dark scene.
// Filip's ruling 2026-10-08 20:28, one shared nav, fewer controls, no mono, no all caps.

import { hero, SITE } from '../content';
import { Phone } from '../components/Icons';
import './nav.css';

export type NavTheme = 'light' | 'glass' | 'dark';

const links = [
  { label: 'Novi', href: '/viljuskari/' },
  { label: 'Polovni', href: '/polovni-linde-viljuskari/' },
  { label: 'Najam', href: '/iznajmljivanje-viljuskara-cena/' },
  { label: 'Servis', href: '/servis/odrzavanje-i-popravka/' },
  { label: 'Kontakt', href: '/kontakt/' },
];

export function Nav({ theme = 'light', className = '' }: { theme?: NavTheme; className?: string }) {
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
