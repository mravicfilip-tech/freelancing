import { useEffect, useMemo, useState } from 'react';
import { SiteNav } from '../FigmaHero/SiteNav';
import { PresaleButton } from '../FigmaHero/FigmaHero';
import { FigmaFooter } from '../FigmaFooter/FigmaFooter';
import { ALPHABET, GUIDES_HREF, POPULAR, TERMS, guideHref, letterOf, termId, type Term } from './terms';
import './Glossary.css';

/**
 * The Glossary page, from the Figma frame "Glossary" (node 2113:4) in "Remittix Redesign", on its own
 * route (/glossary). The frame's header and footer are out of date, so the page wears the site's own
 * nav and footer; the sections between them are set on the same bands, rails and type as the home page.
 */

type Filter = 'all' | string;

const matches = (t: Term, q: string) =>
  !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);

function SearchIcon() {
  return (
    <svg className="gl__searchIcon" viewBox="0 0 24 24" width={20} height={20} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="gl__arrow" viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Scroll a term into view below the fixed bar, and give it focus so keyboard reading continues there. */
function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: 'start' });
  el.focus({ preventScroll: true });
}

/** The popular term nearest the top of the viewport, for the sidebar's highlight. */
function useCurrentTerm(ids: string[], layout: unknown) {
  const [current, setCurrent] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
        const first = ids.find((id) => visible.has(id));
        if (first) setCurrent(first);
      },
      /* A band across the upper part of the screen, below the bar: a term is "current" while it is being read. */
      { rootMargin: '-120px 0px -55% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    /* Re-observed whenever the list is redrawn (`layout`); `ids` is the same list every render. */
  }, [layout]);
  return [current, setCurrent] as const;
}

export function Glossary() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const q = query.trim().toLowerCase();

  useEffect(() => {
    document.title = 'Glossary — Remittix';
  }, []);

  /* What the search leaves, before the letter narrows it: this decides which letters can be chosen. */
  const searched = useMemo(() => TERMS.filter((t) => matches(t, q)), [q]);
  const available = useMemo(() => new Set(searched.map(letterOf)), [searched]);

  const groups = useMemo(() => {
    const shown = filter === 'all' ? searched : searched.filter((t) => letterOf(t) === filter);
    const byLetter = new Map<string, Term[]>();
    [...shown]
      .sort((a, b) => a.term.localeCompare(b.term))
      .forEach((t) => byLetter.set(letterOf(t), [...(byLetter.get(letterOf(t)) ?? []), t]));
    return [...byLetter];
  }, [searched, filter]);

  const popularIds = POPULAR.map(termId);
  const [current, setCurrent] = useCurrentTerm(popularIds, groups);

  const pickLetter = (next: Filter) => {
    setFilter(next);
    document.getElementById('glossary-list')?.scrollIntoView({ block: 'start' });
  };

  /* A popular term is always reachable: if the search or a letter hides it, clear them first. */
  const pickPopular = (name: string) => {
    const id = termId(name);
    setCurrent(id);
    if (document.getElementById(id)) return goTo(id);
    setQuery('');
    setFilter('all');
    requestAnimationFrame(() => requestAnimationFrame(() => goTo(id)));
  };

  const count = groups.reduce((n, [, terms]) => n + terms.length, 0);

  return (
    <div className="gl fh-scope">
      <SiteNav base="/" />

      <main>
        <section className="gl__hero" data-node-id="2114:44" aria-labelledby="gl-title">
          <div className="gl__heroFrame">
            <div className="gl__intro">
              <h1 className="gl__title" id="gl-title">Glossary</h1>
              <p className="gl__lede">
                Clear definitions of the terms, technologies and concepts shaping payments, crypto and digital
                finance. Search for a term or browse the glossary alphabetically.
              </p>
            </div>
            <label className="gl__search" data-node-id="2114:60">
              <span className="gl__visuallyHidden">Search the glossary</span>
              <input
                type="search"
                placeholder="Search the glossary"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <SearchIcon />
            </label>
          </div>
        </section>

        <nav className="gl__alpha" data-node-id="2113:31" aria-label="Browse by letter">
          <div className="gl__alphaFrame">
            <div className="gl__alphaRow">
              <button
                type="button"
                className="gl__pill gl__pill--all"
                aria-pressed={filter === 'all'}
                onClick={() => pickLetter('all')}
              >
                All
              </button>
              {ALPHABET.map((l) => (
                <button
                  key={l}
                  type="button"
                  className="gl__pill"
                  aria-pressed={filter === l}
                  disabled={!available.has(l)}
                  aria-label={`Terms starting with ${l}`}
                  onClick={() => pickLetter(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <section className="gl__main" data-node-id="2113:89" aria-label="Glossary terms">
          <div className="gl__mainFrame">
            <aside className="gl__side" aria-labelledby="gl-popular">
              <h2 className="gl__sideTitle" id="gl-popular">Popular Terms</h2>
              <ul className="gl__sideList">
                {POPULAR.map((name) => (
                  <li key={name}>
                    <a
                      href={`#${termId(name)}`}
                      className="gl__sideItem"
                      aria-current={current === termId(name) || undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        pickPopular(name);
                      }}
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="gl__list" id="glossary-list">
              <p className="gl__visuallyHidden" aria-live="polite">
                {count} {count === 1 ? 'term' : 'terms'} shown
              </p>
              {groups.length === 0 && (
                <div className="gl__empty">
                  <p className="gl__emptyTitle">No terms match “{query.trim()}”.</p>
                  <button
                    type="button"
                    className="gl__reset"
                    onClick={() => {
                      setQuery('');
                      setFilter('all');
                    }}
                  >
                    Clear search
                  </button>
                </div>
              )}
              {groups.map(([letter, terms]) => (
                <section className="gl__group" key={letter} aria-labelledby={`gl-letter-${letter}`}>
                  <h2 className="gl__letter" id={`gl-letter-${letter}`}>
                    {letter}
                    <i aria-hidden="true" />
                  </h2>
                  <dl className="gl__entries">
                    {terms.map((t) => (
                      <div className="gl__entry" key={t.term} id={termId(t.term)} tabIndex={-1}>
                        <dt className="gl__term">{t.term}</dt>
                        <dd className="gl__def">{t.definition}</dd>
                        {t.guide && (
                          <dd className="gl__more">
                            <a href={guideHref(t.guide)}>
                              {t.guide.label}
                              <ArrowIcon />
                            </a>
                          </dd>
                        )}
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="gl__cta" data-node-id="2114:275" aria-labelledby="gl-cta">
          <div className="gl__ctaFrame">
            <h2 className="gl__ctaTitle" id="gl-cta">Want to go deeper?</h2>
            <p className="gl__ctaBody">
              Explore step-by-step guides covering payments, crypto, remittances and digital finance.
            </p>
            <PresaleButton wide label="Explore All Guides" href={GUIDES_HREF} />
          </div>
        </section>
      </main>

      <FigmaFooter />
    </div>
  );
}
