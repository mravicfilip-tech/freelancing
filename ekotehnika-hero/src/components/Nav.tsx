// Floating nav over the full bleed scene, after the reels. Both logos as they are, five links,
// the emergency service number and the quote button.

import { hero, SITE } from '../content';
import { Phone } from './Icons';

const links = [
  { label: 'Novi', href: '/viljuskari/' },
  { label: 'Polovni', href: '/polovni-linde-viljuskari/' },
  { label: 'Najam', href: '/iznajmljivanje-viljuskara-cena/' },
  { label: 'Servis', href: '/servis/odrzavanje-i-popravka/' },
  { label: 'O nama', href: '/o-kompaniji-linde/' },
  { label: 'Kontakt', href: '/kontakt/' },
];

export function Nav() {
  return (
    <header className="nav">
      <a className="nav-logos" href={`${SITE}/`}>
        <img src="/brand/linde-mh.png" width={74} height={44} alt="Linde Material Handling" />
        <img src="/brand/ekotehnika.png" width={88} height={24} alt="Ekotehnika, početna strana" />
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
      <a className="nav-call" href={hero.service.tel} data-cta="call-service">
        <Phone size={16} />
        <span>
          {hero.service.label} <strong>{hero.service.number}</strong>
        </span>
      </a>
      <a className="nav-quote" href={hero.quote.href} data-cta="quote">
        {hero.quote.label}
      </a>
    </header>
  );
}
