import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { Pager } from '../Pager';
import { ChevronRight } from '../icons';
import { theme } from '../theme';
import { UPDATES, fmtDate, type Update } from './data';
import { UpdateArt } from './art';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './updates.css';

/**
 * Updates: the newest one as a feature, the rest in a grid. `?g=1..5` picks
 * the grid; the strip at the top is the review tool for flipping between
 * them and goes when one is chosen.
 */
const GRIDS = [
  { n: 1, name: 'Three across', blurb: 'Picture on top, text under it, three to a row.' },
  { n: 2, name: 'Two across', blurb: 'Picture beside the text, two wide rows.' },
  { n: 3, name: 'Mosaic', blurb: 'One wide card and one narrow per row, alternating sides.' },
  { n: 4, name: 'List', blurb: 'One per row with a thumbnail and a date column.' },
  { n: 5, name: 'Four across', blurb: 'Smaller pictures, title and date only, eight to a page.' },
] as const;

const params = new URLSearchParams(window.location.search);
const G = Math.min(5, Math.max(1, Number(params.get('g')) || 1));

function Picker() {
  return (
    <nav className="vpick" aria-label="Grid options">
      {GRIDS.map((g) => (
        <a key={g.n} className="vpick__item" href={`?g=${g.n}`} aria-current={g.n === G ? 'page' : undefined} title={g.blurb}>
          <b>G{g.n}</b> {g.name}
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
      <UpdateArt kind={u.art} className="upd-art--feature" live />
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

/** The card every grid uses. The whole card is the link; the picture is the
    affordance, so there is no Read more under each one. */
function Card({ u, excerpt = true }: { u: Update; excerpt?: boolean }) {
  return (
    <a className="upd-card" href={`#update-${u.id}`}>
      <UpdateArt kind={u.art} />
      <span className="upd-card__body">
        <Kicker u={u} />
        <Title u={u} />
        {excerpt && <span className="upd-card__excerpt">{u.excerpt}</span>}
      </span>
    </a>
  );
}

function Row({ u }: { u: Update }) {
  return (
    <li>
      <a className="upd-row" href={`#update-${u.id}`}>
        <UpdateArt kind={u.art} className="upd-art--thumb" />
        <span className="upd-row__date">
          <time className="num" dateTime={u.date}>{fmtDate(u.date)}</time>
          <span>{u.category === 'Dev release' ? `Dev release ${u.n}` : u.category}</span>
        </span>
        <span className="upd-row__main">
          <Title u={u} />
          <span className="upd-card__excerpt">{u.excerpt}</span>
        </span>
        <ChevronRight className="icon-16 upd-row__chev" />
      </a>
    </li>
  );
}

const PER_PAGE = { 1: 6, 2: 6, 3: 6, 4: 8, 5: 8 } as const;

function Earlier({ items }: { items: Update[] }) {
  const { page, pages, slice, setPage } = usePaged(items, PER_PAGE[G as 1 | 2 | 3 | 4 | 5]);
  return (
    <section className="card upd" aria-labelledby="upd-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="upd-title">Earlier updates</h2>
          <p className="orders__sub">{items.length} more, newest first</p>
        </div>
      </header>

      {G === 4 ? (
        <ol className="upd-rows">
          {slice.map((u) => <Row u={u} key={u.id} />)}
        </ol>
      ) : (
        <div className={`upd-grid upd-grid--g${G}`}>
          {slice.map((u) => <Card u={u} key={u.id} excerpt={G !== 5} />)}
        </div>
      )}

      <footer className="tx__foot">
        <p className="tx__count num">
          Showing {(page - 1) * PER_PAGE[G as 1 | 2 | 3 | 4 | 5] + 1}–{(page - 1) * PER_PAGE[G as 1 | 2 | 3 | 4 | 5] + slice.length} of {items.length}
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
    <div className="dash updates" data-theme={mode} data-grid={G}>
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
