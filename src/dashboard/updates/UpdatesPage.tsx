import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { Pager } from '../Pager';
import { theme } from '../theme';
import { UPDATES, fmtDate, type Update } from './data';
import { Thumb, type ThumbVariant } from './thumb';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './updates.css';

/**
 * Updates: the newest one as a feature, the rest three across with the
 * thumbnail on top. `?t=1..5` picks the thumbnail's art; the strip at the
 * top is the review tool for flipping between them and goes when one is
 * chosen.
 */
const THUMBS = [
  { n: 1, name: 'Glow', blurb: 'Two soft accent glows and the dot grid, as the reference does it.' },
  { n: 2, name: 'Rings', blurb: 'Thin concentric rings off the top-right corner.' },
  { n: 3, name: 'Ladder', blurb: 'The presale ladder rising along the bottom, the live stage lit.' },
  { n: 4, name: 'Dashes', blurb: 'The site\'s 8/8 dashed rails, vertical, faint.' },
  { n: 5, name: 'Mark', blurb: 'The M mark, huge and cropped, behind the headline.' },
] as const;

const params = new URLSearchParams(window.location.search);
const T = Math.min(5, Math.max(1, Number(params.get('t')) || 1)) as ThumbVariant;

function Picker() {
  return (
    <nav className="vpick" aria-label="Thumbnail options">
      {THUMBS.map((t) => (
        <a key={t.n} className="vpick__item" href={`?t=${t.n}`} aria-current={t.n === T ? 'page' : undefined} title={t.blurb}>
          <b>T{t.n}</b> {t.name}
        </a>
      ))}
    </nav>
  );
}
/* ---------- Shared pieces ---------- */

/** What kind of update and when. "Dev release 123" carries the number the
    team counts by; the others are just their kind. */
function Kicker({ u, date = true }: { u: Update; date?: boolean }) {
  return (
    <p className="upd-kicker">
      <span>{u.category === 'Dev release' ? `Dev release ${u.n}` : u.category}</span>
      {date && <time className="num" dateTime={u.date}>{fmtDate(u.date)}</time>}
    </p>
  );
}

function Title({ u, as: Tag = 'h3', className = 'upd-title' }: { u: Update; as?: 'h2' | 'h3'; className?: string }) {
  return (
    <Tag className={className}>
      {u.title} <em>{u.accent}</em>
    </Tag>
  );
}

function usePaged(items: Update[], size: number) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const slice = items.slice((page - 1) * size, page * size);
  return { page, pages, slice, setPage };
}

/* ---------- Feature ---------- */

function Feature({ u }: { u: Update }) {
  return (
    <section className="card upd-feature" aria-label="Latest update">
      <Thumb u={u} variant={T} titled={false} className="thumb--feature" />
      <div className="upd-feature__body">
        <p className="ladder__label">
          <span className="topbar__dot" aria-hidden="true" />
          Latest
        </p>
        <Kicker u={u} />
        <Title u={u} as="h2" className="upd-feature__title" />
        <p className="upd-feature__text">{u.body[0]}</p>
        <div className="upd-feature__btn">
          <Button onClick={() => window.location.assign(`#update-${u.id}`)}>Read the update</Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Grid cards ---------- */

/** The whole card is the link and the thumbnail carries the headline, so
    the body is the kicker and one line; no Read more under each. */
function Card({ u }: { u: Update }) {
  return (
    <a className="upd-card" href={`#update-${u.id}`}>
      <Thumb u={u} variant={T} />
      <span className="upd-card__body">
        <Kicker u={u} />
        <span className="upd-card__excerpt">{u.excerpt}</span>
      </span>
    </a>
  );
}

const PER_PAGE = 6;

function Earlier({ items }: { items: Update[] }) {
  const { page, pages, slice, setPage } = usePaged(items, PER_PAGE);
  return (
    <section className="card upd" aria-labelledby="upd-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="upd-title">Earlier updates</h2>
          <p className="orders__sub">{items.length} more, newest first</p>
        </div>
      </header>

      <div className="upd-grid">
        {slice.map((u) => <Card u={u} key={u.id} />)}
      </div>

      <footer className="tx__foot">
        <p className="tx__count num">
          Showing {(page - 1) * PER_PAGE + 1}–{(page - 1) * PER_PAGE + slice.length} of {items.length}
        </p>
        {pages > 1 && <Pager page={page} pages={pages} onPage={setPage} />}
      </footer>
    </section>
  );
}

export function UpdatesPage() {
  const mode = theme.use();
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);
  const [lead, ...rest] = UPDATES;

  return (
    <div className="dash updates" data-theme={mode}>
      <Sidebar active="updates" />
      <main className="dash__main">
        <Topbar title="Updates" />
        <Picker />
        <Feature u={lead} />
        <Earlier items={rest} />
      </main>
      <MobileNav active="updates" />
    </div>
  );
}
