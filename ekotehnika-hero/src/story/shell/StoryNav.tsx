// The shell's own nav. A logo tile top left, a pill shaped nav centred at the top, a round phone
// button and the red quote button top right. Built here so the shared Nav stays as it is. Links stay on
// ekotehnika.rs and the phone is a tel link.
import { hero, SITE } from '../../content';
import { Phone } from '../../components/Icons';
import { Ico } from './icons';

const LINKS = [
  { label: 'Početna', href: '/' },
  { label: 'Novi', href: '/viljuskari/' },
  { label: 'Polovni', href: '/polovni-linde-viljuskari/' },
  { label: 'Najam', href: '/iznajmljivanje-viljuskara-cena/' },
  { label: 'Servis', href: '/servis/odrzavanje-i-popravka/' },
  { label: 'Kontakt', href: '/kontakt/' },
];

export function StoryNav({ fixed = false }: { fixed?: boolean }) {
  return (
    <header className={fixed ? 'sn sn-fixed' : 'sn'}>
      <a className="sn-logo" href={`${SITE}/`}>
        <img src="/brand/linde-mh.png" width={57} height={34} alt="Linde Material Handling" />
        <img src="/brand/ekotehnika.png" width={81} height={22} alt="Ekotehnika, početna strana" />
      </a>
      <nav className="sn-pill" aria-label="Glavna navigacija">
        <ul>
          {LINKS.map((l, i) => (
            <li key={l.label}>
              <a className={i === 0 ? 'sn-item sn-on' : 'sn-item'} href={`${SITE}${l.href}`} aria-current={i === 0 ? 'page' : undefined}>
                <Ico name={l.label} size={20} />
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sn-right">
        <a className="sn-phone" href={hero.sales.tel} aria-label={`Pozovite prodaju, ${hero.sales.number}`} title={hero.sales.number}>
          <Phone size={20} />
        </a>
        <a className="sn-quote" href={hero.quote.href} data-cta="quote">
          {hero.quote.label}
        </a>
      </div>
    </header>
  );
}
