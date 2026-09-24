import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { EDUCATION_CENTRE_URL } from '../site/navigation';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { ALPHABET, POPULAR_TERM_IDS, TERMS, initialOf, type GlossaryTerm } from './terms';
import arrowRight from './assets/arrow-right.svg';
import buttonArrow from './assets/button-arrow.svg';
import buttonGlow from './assets/button-glow.svg';
import decoLeft from './assets/deco-left.svg';
import decoRight from './assets/deco-right.svg';
import searchIcon from './assets/search.svg';

const TERM_BY_ID = new Map(TERMS.map((t) => [t.id, t]));
const LETTERS_IN_USE = new Set(TERMS.map(initialOf));
const POPULAR_TERMS = POPULAR_TERM_IDS.flatMap((id) => TERM_BY_ID.get(id) ?? []);
/** Highlighted in Popular Terms until the reader picks another term. */
const FEATURED_TERM = POPULAR_TERM_IDS[0];

function termFromHash(): string | null {
  const id = decodeURIComponent(window.location.hash.slice(1));
  return TERM_BY_ID.has(id) ? id : null;
}

const matches = (t: GlossaryTerm, needle: string) =>
  t.term.toLowerCase().includes(needle) || t.definition.toLowerCase().includes(needle);

/** Scrolls `el` to the top of the view unless its top edge is already comfortably on screen. */
function revealTop(el: HTMLElement) {
  const { top } = el.getBoundingClientRect();
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  if (top < margin || top > window.innerHeight * 0.6) el.scrollIntoView({ block: 'start' });
}

/** The letter whose section sits under the sticky A–Z bar, once the list has scrolled up to it. */
function useLetterInView(directory: RefObject<HTMLElement | null>, deps: unknown) {
  const [letter, setLetter] = useState<string | null>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const list = directory.current;
      const bar = document.querySelector('.rtx-az');
      if (!list || !bar) return;
      const edge = bar.getBoundingClientRect().bottom;
      let current: string | null = null;
      if (list.getBoundingClientRect().top < edge) {
        for (const section of list.querySelectorAll<HTMLElement>('[data-letter]')) {
          if (section.getBoundingClientRect().top - edge > 64) break;
          current = section.dataset.letter ?? null;
        }
      }
      setLetter(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [directory, deps]);
  return letter;
}

export function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState<string | null>(null);
  // The popular term the reader navigated to (click or URL hash), if any.
  const [selectedId, setSelectedId] = useState<string | null>(termFromHash);
  // Set when a term should be scrolled to once the unfiltered list has rendered.
  const [scrollTarget, setScrollTarget] = useState<string | null>(termFromHash);
  const directory = useRef<HTMLDivElement>(null);

  const needle = query.trim().toLowerCase();
  const sections = useMemo(() => {
    const groups = new Map<string, GlossaryTerm[]>();
    for (const t of TERMS) {
      if (letter && initialOf(t) !== letter) continue;
      if (needle && !matches(t, needle)) continue;
      groups.set(initialOf(t), [...(groups.get(initialOf(t)) ?? []), t]);
    }
    return [...groups];
  }, [letter, needle]);
  const shown = sections.reduce((n, [, terms]) => n + terms.length, 0);
  const filtered = letter !== null || needle !== '';
  const letterInView = useLetterInView(directory, sections);
  const highlightedId = selectedId ?? FEATURED_TERM;

  const showTerm = (id: string) => {
    setQuery('');
    setLetter(null);
    setSelectedId(id);
    setScrollTarget(id);
  };

  const showAll = () => {
    setQuery('');
    setLetter(null);
  };

  const pickLetter = (next: string | null) => {
    setLetter(next);
    setQuery('');
    if (directory.current) revealTop(directory.current);
  };

  useEffect(() => {
    const onHashChange = () => {
      const id = termFromHash();
      if (id) showTerm(id);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!scrollTarget) return;
    setScrollTarget(null);
    const entry = document.getElementById(scrollTarget);
    if (!entry) return;
    entry.scrollIntoView({ block: 'start' });
    entry.focus({ preventScroll: true });
    entry.querySelector('.rtx-entry__term span')?.animate(
      [{ backgroundColor: 'rgb(249 255 56 / 0.9)' }, { backgroundColor: 'rgb(249 255 56 / 0)' }],
      { duration: 1600, delay: 500, easing: 'ease-in', fill: 'backwards' },
    );
  }, [scrollTarget]);

  return (
    <div className="rtx-page">
      <a className="rtx-skip" href="#glossary-terms">
        Skip to the glossary
      </a>
      <SiteHeader />

      <main>
        <section className="rtx-hero" aria-labelledby="glossary-title">
          <div className="rtx-hero__deco rtx-hero__deco--left" aria-hidden="true">
            <img src={decoLeft} width={1109} height={670} alt="" />
          </div>
          <div className="rtx-hero__deco rtx-hero__deco--right" aria-hidden="true">
            <img src={decoRight} width={446} height={231} alt="" />
          </div>
          <div className="rtx-hero__content">
            <div className="rtx-hero__copy">
              <h1 id="glossary-title" className="rtx-hero__title">
                Glossary
              </h1>
              <p className="rtx-hero__lead">
                Clear definitions of the terms, technologies and concepts shaping payments, crypto and digital
                finance. Search for a term or browse the glossary alphabetically.
              </p>
            </div>
            <label className="rtx-search">
              <span className="rtx-sr-only">Search the glossary</span>
              <input
                className="rtx-search__input"
                type="search"
                placeholder="Search the glossary"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setLetter(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setQuery('');
                  if (e.key === 'Enter' && directory.current) revealTop(directory.current);
                }}
              />
              <img className="rtx-search__icon" src={searchIcon} width={20} height={20} alt="" />
            </label>
          </div>
        </section>

        <nav className="rtx-az" aria-label="Browse by letter">
          <ul className="rtx-az__list">
            <li className="rtx-az__all">
              <button type="button" className="rtx-az__button" aria-pressed={letter === null} onClick={() => pickLetter(null)}>
                All
              </button>
            </li>
            {ALPHABET.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  className="rtx-az__button rtx-az__button--letter"
                  aria-pressed={letter === l}
                  data-in-view={(letter === null && letterInView === l) || undefined}
                  disabled={!LETTERS_IN_USE.has(l)}
                  onClick={() => pickLetter(letter === l ? null : l)}
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div ref={directory} className="rtx-directory" id="glossary-terms" tabIndex={-1}>
          <aside className="rtx-popular" aria-labelledby="popular-title">
            <h2 id="popular-title" className="rtx-popular__title">
              Popular Terms
            </h2>
            <ul className="rtx-popular__list">
              {POPULAR_TERMS.map((t) => (
                <li key={t.id}>
                  <a
                    className="rtx-popular__link"
                    href={`#${t.id}`}
                    data-active={highlightedId === t.id || undefined}
                    aria-current={selectedId === t.id ? 'location' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState(null, '', `#${t.id}`);
                      showTerm(t.id);
                    }}
                  >
                    {t.term}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <div className="rtx-terms">
            <p className="rtx-sr-only" role="status">
              {filtered ? `${shown} ${shown === 1 ? 'term' : 'terms'} shown` : ''}
            </p>
            {sections.length === 0 ? (
              <div className="rtx-empty">
                <p className="rtx-empty__title">No terms match &ldquo;{query.trim()}&rdquo;.</p>
                <p className="rtx-empty__body">Try a shorter word, or browse every term from A to Z.</p>
                <button type="button" className="rtx-empty__reset" onClick={showAll}>
                  Show all terms
                </button>
              </div>
            ) : (
              sections.map(([initial, terms]) => (
                <section key={initial} className="rtx-letter" data-letter={initial} aria-labelledby={`letter-${initial}`}>
                  <h2 id={`letter-${initial}`} className="rtx-letter__heading">
                    {initial}
                    <span className="rtx-letter__rule" aria-hidden="true" />
                  </h2>
                  <div className="rtx-letter__entries">
                    {terms.map((t) => (
                      <article
                        key={t.id}
                        id={t.id}
                        className="rtx-entry"
                        tabIndex={-1}
                        aria-labelledby={`${t.id}-term`}
                      >
                        <h3 id={`${t.id}-term`} className="rtx-entry__term">
                          <span>{t.term}</span>
                        </h3>
                        <p className="rtx-entry__definition">{t.definition}</p>
                        {t.guide && (
                          <a className="rtx-entry__guide" href={t.guide.href}>
                            {t.guide.label}
                            <img src={arrowRight} width={16} height={16} alt="" />
                          </a>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>

        <section className="rtx-cta" aria-labelledby="cta-title">
          <div className="rtx-cta__copy">
            <h2 id="cta-title" className="rtx-cta__title">
              Want to go deeper?
            </h2>
            <p className="rtx-cta__lead">
              Explore step-by-step guides covering payments, crypto, remittances and digital finance.
            </p>
          </div>
          <a className="rtx-cta__button" href={EDUCATION_CENTRE_URL}>
            <img className="rtx-cta__glow" src={buttonGlow} width={222} height={54} alt="" />
            <span className="rtx-cta__label">Explore All Guides</span>
            <img className="rtx-cta__arrow" src={buttonArrow} width={30} height={30} alt="" />
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
