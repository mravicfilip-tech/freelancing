// The live site header, rebuilt as is from briefs/hero-rebuild/screenshots/04_header-nav.png.
// Not part of the design under review.

import { SITE, nav } from '../content';
import { Mail, Mobile, Phone, Search } from './Icons';

// Both logos are the live site's own files, cropped 1 to 1 from the header capture, because
// ekotehnika.rs cannot be reached from the build machine to measure the hotlinked files.
// Paths confirmed in the competitive analysis. The rest go to the site search for their label until
// the live paths are known, so no two labels share a destination.
const navHref: Record<string, string> = {
  Novi: '/viljuskari/',
  Polovni: '/polovni-linde-viljuskari/',
  Iznajmljivanje: '/iznajmljivanje-viljuskara-cena/',
  Servis: '/servis/odrzavanje-i-popravka/',
  Kontakt: '/kontakt/',
  'O nama': '/o-kompaniji-linde/',
  Blog: '/blog/',
};

export function Header() {
  return (
    <header className="site-header">
      <div className="topbar">
        <a className="tb tb-900" href="mailto:info@ekotehnika.rs">
          <Mail /> info@ekotehnika.rs
        </a>
        <a className="tb tb-red" href="tel:+381118055708">
          Vrčin <Phone /> +381 11 8055-708
        </a>
        <a className="tb tb-line" href="tel:+38163282050">
          <Mobile /> +381 63 282-050
        </a>
        <a className="tb tb-900" href="mailto:servis@ekotehnika.rs">
          Servis <Mail /> servis@ekotehnika.rs
        </a>
        <a className="tb tb-line" href="tel:+381603002050">
          <Mobile /> + 381 60 300 20 50
        </a>
        <a className="tb tb-search" href={`${SITE}/?s=`}>
          <Search size={14} /> Pretraga
        </a>
      </div>
      <div className="mainbar">
        <a className="logos" href={`${SITE}/`}>
          <img className="logo-linde" src="/brand/linde-mh.png" width={112} height={67} alt="Linde Material Handling" />
          <img className="logo-eko" src="/brand/ekotehnika.png" width={110} height={30} alt="Ekotehnika, početna strana" />
        </a>
        <nav aria-label="Glavna navigacija">
          <ul>
            {nav.map((item) => (
              <li key={item}>
                <a href={navHref[item] ? `${SITE}${navHref[item]}` : `${SITE}/?s=${encodeURIComponent(item)}`}>{item}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
