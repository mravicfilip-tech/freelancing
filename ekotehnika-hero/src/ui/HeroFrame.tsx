// The shared frame over the scene for versions 2, 4 and 5, from the UI pass plan A4, A5, A7 and the hero beat.
// The two logos sit straight on the ground at the co-branding sizes, no box. The nav is centred on the middle of the
// grid, the two phone buttons and the one primary button are on the right. A grid coordinate label sits in the bottom
// left, and the hero headline in the bottom left block.
// Mount it inside the pinned stage so it stays on screen for the whole scroll.
//
// tone picks the colour set, ink on a light scene and white on the dark servis beat. A version whose scene changes under
// the type flips data-tone on the root through rootRef, so no React render runs per frame. The shell also drives the
// white wordmark on the dark span and the hero block through the class names below.

import { type MouseEvent, type Ref } from 'react';
import { hero, SITE } from '../content';
import { frame, hero2 } from '../story2/copy';
import { BtnInner, Fill } from '../story2/shell/ui';
import './heroframe.css';

export type FrameTone = 'ink' | 'white';

// ch names the story chapter a link stands for. In the story the nav's bar sits under that link while its chapter is on
// screen, and under Početna where the chapter has no link, see StoryShell.
const links = [
  { label: 'Početna', href: '/', current: true, ch: 'home' },
  { label: 'Novi', href: '/viljuskari/', ch: 'prodaja' },
  { label: 'Polovni', href: '/polovni-linde-viljuskari/' },
  { label: 'Najam', href: '/iznajmljivanje-viljuskara-cena/', ch: 'najam' },
  { label: 'Servis', href: '/servis/odrzavanje-i-popravka/', ch: 'servis' },
  { label: 'Kontakt', href: '/kontakt/' },
];

// Past the pinned story, to the content that follows it. Falls back to the bottom of the page.
function skip(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  // the root carries the same attribute, so the marked section is looked up inside the body
  const next = document.body.querySelector<HTMLElement>('[data-after-story]');
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
          <img src="/brand/linde-mh.svg" width={160} height={96} alt="Linde Material Handling" />
          {/* on a dark ground the wordmark crossfades to the white file, the Linde logo stays as supplied */}
          <span className="hf-wm">
            <img className="wm-ink" src="/brand/ekotehnika.svg" width={160} height={33} alt="Ekotehnika, početna strana" />
            <img className="wm-white" src="/brand/ekotehnika-white.svg" width={160} height={33} alt="" aria-hidden="true" />
          </span>
        </a>
        <nav className="hf-nav" aria-label="Glavna navigacija">
          <ul>
            {links.map((l) => (
              <li key={l.label}>
                <a href={`${SITE}${l.href}`} aria-current={l.current ? 'page' : undefined} data-ch={l.ch}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <span className="hf-nav-bar" aria-hidden="true" />
        </nav>
        <div className="hf-actions">
          <a className="btn btn-secondary btn-phone" href={hero.sales.tel} data-cta="call-sales" data-wipe="0">
            <BtnInner>
              {hero.sales.label} <span className="num">{hero.sales.number}</span>
            </BtnInner>
          </a>
          <a className="btn btn-secondary btn-phone" href={hero.service.tel} data-cta="call-service" data-wipe="1">
            <BtnInner>
              {hero.service.label} <span className="num">{hero.service.number}</span>
            </BtnInner>
          </a>
          {/* the quote button is the one primary on every beat, a beat's own buttons are secondaries */}
          <a className="btn btn-primary hf-quote-top" href={hero.quote.href} data-cta="quote" data-wipe="2">
            <BtnInner>{hero.quote.label}</BtnInner>
          </a>
        </div>
      </header>

      <p className="hf-coords">
        <span>{frame.coords}</span> <span>{frame.place}</span>
      </p>

      <div className="hf-bottom">
        {/* the block's top rule only. Its words, the Linde partner line with the two flags, are gone, the client's ticket of
            3 November, "Ne čitljivo, responsiveness jebe, obrisati", Kompanija says the same under its title */}
        <p className="s2-marker" data-wipe="0" data-rule="t" aria-hidden="true" />
        <h1 className="hf-h1">
          <span className="ln" data-wipe="1">
            {hero2.title}
          </span>
        </h1>
        <Fill text={hero2.lede} className="hf-lede" />
        <a className="btn btn-secondary hf-quote" href={hero2.quote.href} data-cta="quote" data-wipe="3">
          <BtnInner>{hero2.quote.label}</BtnInner>
        </a>
      </div>
    </div>
  );
}
