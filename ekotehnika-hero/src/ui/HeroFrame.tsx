// The shared frame over the scene for versions 2, 4 and 5, from the UI pass plan A4, A5, A7 and the hero beat.
// The two logos sit straight on the ground at the co-branding sizes, no box. The nav is centred on the middle of the
// grid, the two phone buttons and the one primary button are on the right. A grid coordinate label sits in the bottom
// left, and the hero headline in the bottom left block.
// Mount it inside the pinned stage so it stays on screen for the whole scroll.
//
// tone picks the colour set, ink on a light scene and white on the dark servis beat. A version whose scene changes under
// the type flips data-tone on the root through rootRef, so no React render runs per frame. The shell also drives the
// white wordmark on the dark span and the hero block through the class names below.

import { Fragment, type MouseEvent, type ReactNode, type Ref } from 'react';
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

// The two flags before the country names in the hero marker. Both are 10px high, the cap height of the 14px label, 6px before
// the word, sharp corners and a 1px hairline at 18 percent black so the white stripe reads on white. They keep their national
// colours. Serbia is the civil flag at 3 to 2, Montenegro a red field with a gold border and a simplified gold eagle at 2 to 1.
const HAIR = 'rgb(0 0 0 / 0.18)';
const SerbiaFlag = () => (
  <svg className="mk-flag" width="15" height="10" viewBox="0 0 15 10" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <rect width="15" height="3.34" fill="#C6363C" />
    <rect y="3.33" width="15" height="3.34" fill="#0C4076" />
    <rect y="6.66" width="15" height="3.34" fill="#fff" />
    <rect x="0.5" y="0.5" width="14" height="9" fill="none" stroke={HAIR} />
  </svg>
);
const MontenegroFlag = () => (
  <svg className="mk-flag" width="20" height="10" viewBox="0 0 20 10" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
    <rect width="20" height="10" fill="#D3AE3B" />
    <rect x="1" y="1" width="18" height="8" fill="#C40308" />
    <circle cx="9" cy="3.2" r="0.8" fill="#D3AE3B" />
    <circle cx="11" cy="3.2" r="0.8" fill="#D3AE3B" />
    <path d="M10 3.6 13.4 4 12.4 5.7 11.2 8 8.8 8 7.6 5.7 6.6 4Z" fill="#D3AE3B" />
    <rect x="0.5" y="0.5" width="19" height="9" fill="none" stroke={HAIR} />
  </svg>
);
const FLAGS: Record<string, ReactNode> = { Srbiju: <SerbiaFlag />, 'Crnu Goru': <MontenegroFlag /> };

// The marker text with a flag in front of each country name it carries.
function Kicker({ text }: { text: string }) {
  return (
    <>
      {text.split(/(Srbiju|Crnu Goru)/).map((p, i) => (
        <Fragment key={i}>
          {FLAGS[p] ?? null}
          {p}
        </Fragment>
      ))}
    </>
  );
}

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
        <p className="s2-marker" data-wipe="0" data-rule="t">
          <span className="mk-name">
            <Kicker text={hero2.marker} />
          </span>
        </p>
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
