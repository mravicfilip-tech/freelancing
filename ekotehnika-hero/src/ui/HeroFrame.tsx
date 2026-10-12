// The shared frame over the scene for versions 2, 4 and 5, from the UI pass plan A4, A5, A7 and the hero beat.
// The two logos sit straight on the ground at the co-branding sizes, no box. The nav is centred on the middle of the
// grid, the two phone buttons and the one primary button are on the right. A counter and a progress line sit in the
// right margin, a grid coordinate label in the bottom left, and the hero headline in the bottom left block.
// Mount it inside the pinned stage so it stays on screen for the whole scroll.
//
// tone picks the colour set, ink on a light scene and white on the dark servis beat. A version whose scene changes under
// the type flips data-tone on the root through rootRef, so no React render runs per frame. The shell also drives the
// counter, the progress line, the hiding of the logos on the dark span and the hero block through the class names below.

import type { MouseEvent, Ref } from 'react';
import { hero, SITE } from '../content';
import { frame, hero2 } from '../story2/copy';
import { Fill } from '../story2/shell/ui';
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
  const next = document.querySelector<HTMLElement>('[data-after-story]');
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
        <a className="hf-logo" href={`${SITE}/`} data-mask>
          <img src="/brand/linde-mh.svg" width={160} height={96} alt="Linde Material Handling" />
          <img src="/brand/ekotehnika.svg" width={160} height={33} alt="Ekotehnika, početna strana" />
        </a>
        <nav className="hf-nav" aria-label="Glavna navigacija" data-mask>
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
        <div className="hf-actions" data-mask>
          <a className="btn btn-secondary btn-phone" href={hero.sales.tel} data-cta="call-sales" data-wipe="0">
            <span className="btn-t">
              {hero.sales.label} <span className="num">{hero.sales.number}</span>
            </span>
            <i className="btn-x" aria-hidden="true" />
          </a>
          <a className="btn btn-secondary btn-phone" href={hero.service.tel} data-cta="call-service" data-wipe="1">
            <span className="btn-t">
              {hero.service.label} <span className="num">{hero.service.number}</span>
            </span>
            <i className="btn-x" aria-hidden="true" />
          </a>
          <a className="btn btn-primary" href={hero.quote.href} data-cta="quote" data-wipe="2">
            <span className="btn-t">{hero.quote.label}</span>
            <i className="btn-x" aria-hidden="true" />
          </a>
        </div>
      </header>

      <div className="hf-side" aria-hidden="true">
        <span className="hf-nums" data-mask>
          <b className="hf-now">00</b>
          <span className="hf-total">{frame.total}</span>
          <span className="hf-name" />
        </span>
        <i className="hf-track">
          <i className="hf-fill" />
        </i>
      </div>

      <p className="hf-coords" data-mask>
        <span>{frame.coords}</span> <span>{frame.place}</span>
      </p>

      <div className="hf-bottom">
        <p className="s2-marker" data-wipe="0" data-mask>
          <i className="mk-rule" aria-hidden="true" />
          <span className="mk-name">{hero2.marker}</span>
        </p>
        <h1 className="hf-h1" data-mask>
          <span className="ln" data-wipe="1">
            {hero2.title}
          </span>
        </h1>
        <Fill text={hero2.lede} className="hf-lede" />
        <a className="btn btn-primary hf-quote" href={hero2.quote.href} data-cta="quote" data-wipe="3" data-mask>
          <span className="btn-t">{hero2.quote.label}</span>
          <i className="btn-x" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
