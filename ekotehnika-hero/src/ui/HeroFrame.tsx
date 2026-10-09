// The shared hero layout for versions 2, 4 and 5, from Filip's ruling 2026-10-09 15:07. A top row
// with the logo, five text links and two outline phone buttons, and one block at the bottom left
// with a kicker, the headline and the red quote button. Nothing else. The scene behind it is full
// bleed. Mount it inside the pinned stage so it stays on screen for the whole scroll.
//
// tone picks the colour set for the top row, ink on a light scene and white on a dark one.
// toneBottom does the same for the bottom left block and follows tone when it is left out. A
// version whose scene changes under the type can flip data-tone and data-tone-bottom on the root
// through rootRef, so no React render runs per frame.

import type { MouseEvent, Ref } from 'react';
import { hero, SITE } from '../content';
import './heroframe.css';

export type FrameTone = 'ink' | 'white';

const links = [
  { label: 'Početna', href: '/', current: true },
  { label: 'Novi', href: '/viljuskari/' },
  { label: 'Polovni', href: '/polovni-linde-viljuskari/' },
  { label: 'Najam', href: '/iznajmljivanje-viljuskara-cena/' },
  { label: 'Servis', href: '/servis/odrzavanje-i-popravka/' },
  { label: 'Kontakt', href: '/kontakt/' },
];

// Past the pinned story, to the content that follows it. Falls back to the bottom of the page.
function skip(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const next = document.querySelector<HTMLElement>('.placeholder');
  const y = next ? next.getBoundingClientRect().top + window.scrollY : document.documentElement.scrollHeight;
  window.scrollTo({ top: y, behavior: 'auto' });
  if (next) {
    next.tabIndex = -1;
    next.focus({ preventScroll: true });
  }
}

export function HeroFrame({ tone, toneBottom, rootRef }: { tone: FrameTone; toneBottom?: FrameTone; rootRef?: Ref<HTMLDivElement> }) {
  return (
    <div className="hf" ref={rootRef} data-tone={tone} data-tone-bottom={toneBottom ?? tone}>
      <a className="hf-skip" href="#sadrzaj" onClick={skip}>
        Preskoči animaciju
      </a>

      <header className="hf-top">
        <a className="hf-logo" href={`${SITE}/`}>
          <img src="/brand/linde-mh.png" width={57} height={34} alt="Linde Material Handling" />
          <img src="/brand/ekotehnika.png" width={81} height={22} alt="Ekotehnika, početna strana" />
        </a>
        <nav className="hf-nav" aria-label="Glavna navigacija">
          <ul>
            {links.map((l) => (
              <li key={l.label}>
                <a href={`${SITE}${l.href}`} aria-current={l.current ? 'page' : undefined}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hf-phones">
          <a className="hf-pill" href={hero.sales.tel} data-cta="call-sales">
            {hero.sales.label} {hero.sales.number}
          </a>
          <a className="hf-pill" href={hero.service.tel} data-cta="call-service">
            {hero.service.label} {hero.service.number}
          </a>
        </div>
      </header>

      <div className="hf-bottom">
        <p className="hf-kicker">
          <i className="hf-dot" aria-hidden="true" />
          {hero.kicker}
        </p>
        <h1 className="hf-h1">{hero.headline.join(' ')}</h1>
        <a className="hf-quote" href={hero.quote.href} data-cta="quote">
          {hero.quote.label}
        </a>
      </div>
    </div>
  );
}
