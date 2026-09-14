import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { Pager } from '../Pager';
import { ArrowOut, ChevronRight, RtxMark } from '../icons';
import { theme } from '../theme';
import { CATEGORIES, PAGE_SIZE, UPDATES, fmtDate, type Category, type Update } from './data';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './updates.css';

/**
 * Five layouts of the same twelve updates. `?v=1..5` picks one; the strip at
 * the top is the review tool for flipping between them and goes when one is
 * chosen.
 */
const VARIANTS = [
  { n: 1, name: 'Grid', blurb: 'Four cards across with a cover each, as the reference lays it out.' },
  { n: 2, name: 'Changelog', blurb: 'One dated list, dense and chronological, like release notes.' },
  { n: 3, name: 'Featured', blurb: 'The newest update as a wide feature, the rest in a grid under it.' },
  { n: 4, name: 'Timeline', blurb: 'Grouped by month down a rail, with a category filter.' },
  { n: 5, name: 'Reader', blurb: 'A list on the left; the chosen update reads in full on the right.' },
] as const;

const params = new URLSearchParams(window.location.search);
const V = Math.min(5, Math.max(1, Number(params.get('v')) || 1));

function Picker() {
  return (
    <nav className="vpick" aria-label="Updates layout variants">
      {VARIANTS.map((v) => (
        <a key={v.n} className="vpick__item" href={`?v=${v.n}`} aria-current={v.n === V ? 'page' : undefined} title={v.blurb}>
          <b>V{v.n}</b> {v.name}
        </a>
      ))}
    </nav>
  );
}

/* ---------- Shared pieces ---------- */

/** The cover the reference gives every card: mark top-left, tag top-right,
    the two-tone headline, and a glow in one corner. */
function Cover({ u, size = 'md' }: { u: Update; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={`upd-cover upd-cover--${size}`} data-glow={u.glow}>
      <span className="upd-cover__top">
        <RtxMark className="icon-22 upd-cover__mark" />
        <span className="promo__tag">{u.category}</span>
      </span>
      <h3 className="upd-cover__title">
        {u.title} <em>{u.accent}</em>
      </h3>
    </div>
  );
}

function Meta({ u, release = true }: { u: Update; release?: boolean }) {
  return (
    <p className="upd-meta">
      <time className="num" dateTime={u.date}>{fmtDate(u.date)}</time>
      {release && (
        <>
          <span className="upd-meta__sep" aria-hidden="true" />
          <span className="num">Release {u.n}</span>
        </>
      )}
    </p>
  );
}

function ReadMore({ u, label = 'Read more' }: { u: Update; label?: string }) {
  return (
    <a className="promo__cta upd-more" href={`#update-${u.id}`}>
      {label}
      <ChevronRight className="icon-14" />
    </a>
  );
}

function usePaged(items: Update[], size: number) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const slice = items.slice((page - 1) * size, page * size);
  return { page, pages, slice, setPage };
}

function Foot({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  return (
    <footer className="tx__foot">
      <p className="tx__count num">{total} updates</p>
      {pages > 1 && <Pager page={page} pages={pages} onPage={onPage} />}
    </footer>
  );
}

/* ---------- V1: Grid ---------- */

function GridCard({ u }: { u: Update }) {
  return (
    <article className="upd-card">
      <Cover u={u} />
      <div className="upd-card__body">
        <Meta u={u} />
        <p className="upd-card__excerpt">{u.excerpt}</p>
        <ReadMore u={u} />
      </div>
    </article>
  );
}

function V1() {
  const { page, pages, slice, setPage } = usePaged(UPDATES, PAGE_SIZE);
  return (
    <section className="card upd" aria-labelledby="upd-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="upd-title">Project updates</h2>
          <p className="orders__sub">What the team shipped, week by week</p>
        </div>
      </header>
      <div className="upd-grid">
        {slice.map((u) => <GridCard u={u} key={u.id} />)}
      </div>
      <Foot page={page} pages={pages} total={UPDATES.length} onPage={setPage} />
    </section>
  );
}

/* ---------- V2: Changelog ---------- */

function V2() {
  const { page, pages, slice, setPage } = usePaged(UPDATES, PAGE_SIZE);
  return (
    <section className="card upd" aria-labelledby="upd-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="upd-title">Project updates</h2>
          <p className="orders__sub">Every release, newest first</p>
        </div>
      </header>
      <ol className="upd-log">
        {slice.map((u) => (
          <li key={u.id}>
            <a className="upd-log__row" href={`#update-${u.id}`}>
              <span className="upd-log__date">
                <time className="num" dateTime={u.date}>{fmtDate(u.date)}</time>
                <span className="num upd-log__n">Release {u.n}</span>
              </span>
              <span className="upd-log__main">
                <span className="promo__tag">{u.category}</span>
                <span className="upd-log__title">
                  {u.title} <em>{u.accent}</em>
                </span>
                <span className="upd-log__excerpt">{u.excerpt}</span>
              </span>
              <span className="chip-btn chip-btn--sm upd-log__go" aria-hidden="true">
                <ChevronRight className="icon-16" />
              </span>
            </a>
          </li>
        ))}
      </ol>
      <Foot page={page} pages={pages} total={UPDATES.length} onPage={setPage} />
    </section>
  );
}

/* ---------- V3: Featured ---------- */

function V3() {
  const [lead, ...rest] = UPDATES;
  const { page, pages, slice, setPage } = usePaged(rest, 6);
  return (
    <>
      <section className="card upd-feature" aria-label="Latest update">
        <Cover u={lead} size="lg" />
        <div className="upd-feature__body">
          <p className="ladder__label">
            <span className="topbar__dot" aria-hidden="true" />
            Latest
          </p>
          <Meta u={lead} />
          <h2 className="upd-feature__title">
            {lead.title} <em>{lead.accent}</em>
          </h2>
          <p className="upd-feature__text">{lead.body[0]}</p>
          <div className="upd-feature__btn">
            <Button onClick={() => window.location.assign(`#update-${lead.id}`)}>Read the update</Button>
          </div>
        </div>
      </section>
      <section className="card upd" aria-labelledby="upd-title">
        <header className="card__head">
          <div>
            <h2 className="card__title" id="upd-title">Earlier updates</h2>
            <p className="orders__sub">What the team shipped before that</p>
          </div>
        </header>
        <div className="upd-grid upd-grid--3">
          {slice.map((u) => <GridCard u={u} key={u.id} />)}
        </div>
        <Foot page={page} pages={pages} total={rest.length} onPage={setPage} />
      </section>
    </>
  );
}

/* ---------- V4: Timeline ---------- */

function V4() {
  const [cat, setCat] = useState<Category | 'All'>('All');
  const rows = cat === 'All' ? UPDATES : UPDATES.filter((u) => u.category === cat);
  const groups = useMemo(() => {
    const m = new Map<string, Update[]>();
    for (const u of rows) {
      const k = fmtDate(u.date, 'month');
      m.set(k, [...(m.get(k) ?? []), u]);
    }
    return [...m.entries()];
  }, [rows]);

  return (
    <section className="card upd" aria-labelledby="upd-title">
      <header className="card__head upd-head--wrap">
        <div>
          <h2 className="card__title" id="upd-title">Project updates</h2>
          <p className="orders__sub">{rows.length} of {UPDATES.length} updates</p>
        </div>
        <div className="tabs upd-filter" role="tablist" aria-label="Filter by category">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button key={c} type="button" role="tab" className="tabs__tab" aria-selected={cat === c} onClick={() => setCat(c)}>
              {c === 'Dev release' ? 'Dev releases' : c === 'Announcement' ? 'Announcements' : c}
            </button>
          ))}
        </div>
      </header>

      <div className="upd-tl">
        {groups.map(([month, items]) => (
          <section className="upd-tl__group" key={month} aria-label={month}>
            <h3 className="upd-tl__month">{month}</h3>
            <ol className="upd-tl__list">
              {items.map((u) => (
                <li className="upd-tl__item" key={u.id}>
                  <span className="upd-tl__dot" aria-hidden="true" />
                  <a className="upd-tl__card" href={`#update-${u.id}`}>
                    <span className="upd-tl__meta">
                      <time className="num" dateTime={u.date}>{fmtDate(u.date)}</time>
                      <span className="promo__tag">{u.category}</span>
                    </span>
                    <span className="upd-log__title">
                      {u.title} <em>{u.accent}</em>
                    </span>
                    <span className="upd-log__excerpt">{u.excerpt}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}

/* ---------- V5: Reader ---------- */

function V5() {
  const [id, setId] = useState(UPDATES[0].id);
  const u = UPDATES.find((x) => x.id === id) ?? UPDATES[0];
  const i = UPDATES.indexOf(u);
  const pick = (next: number) => {
    setId(next);
    if (window.innerWidth <= 1180) document.getElementById('upd-reader')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="upd-split">
      <section className="card upd-list" aria-labelledby="upd-title">
        <header className="card__head">
          <div>
            <h2 className="card__title" id="upd-title">Project updates</h2>
            <p className="orders__sub">{UPDATES.length} updates, newest first</p>
          </div>
        </header>
        <ol className="upd-list__items">
          {UPDATES.map((x) => (
            <li key={x.id}>
              <button type="button" className="upd-list__row" aria-current={x.id === id ? 'true' : undefined} onClick={() => pick(x.id)}>
                <span className="upd-list__text">
                  <span className="upd-list__title">
                    {x.title} {x.accent}
                  </span>
                  <span className="upd-list__meta num">
                    {fmtDate(x.date)} · Release {x.n}
                  </span>
                </span>
                <ChevronRight className="icon-16 upd-list__chev" />
              </button>
            </li>
          ))}
        </ol>
      </section>

      <article className="card upd-reader" id="upd-reader" aria-live="polite">
        <Cover u={u} size="lg" />
        <div className="upd-reader__body">
          <Meta u={u} />
          {u.body.map((para, k) => (
            <p className="upd-reader__p" key={k}>{para}</p>
          ))}
          <div className="upd-reader__foot">
            <a className="link-quiet" href={`#update-${u.id}`}>
              Open on the site
              <ArrowOut className="icon-14" />
            </a>
            <div className="upd-reader__nav">
              <button type="button" className="link-quiet" disabled={i === 0} onClick={() => pick(UPDATES[i - 1].id)}>
                Newer
              </button>
              <button type="button" className="link-quiet" disabled={i === UPDATES.length - 1} onClick={() => pick(UPDATES[i + 1].id)}>
                Older
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

const BODY = { 1: V1, 2: V2, 3: V3, 4: V4, 5: V5 } as const;

export function UpdatesPage() {
  const mode = theme.use();
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);
  const Body = BODY[V as 1 | 2 | 3 | 4 | 5];

  return (
    <div className="dash updates" data-theme={mode} data-variant={V}>
      <Sidebar active="updates" />
      <main className="dash__main">
        <Topbar title="Updates" />
        <Picker />
        <Body />
      </main>
      <MobileNav active="updates" />
    </div>
  );
}
