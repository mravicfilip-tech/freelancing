import { useEffect, useState } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Button } from '../Button';
import { theme } from '../theme';
import { UPDATES, type Update } from './data';
import { Thumb } from './thumb';
import { Kicker, Title, UpdateCard } from './UpdateCard';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './updates.css';

/**
 * Updates: the newest one as a feature, the rest three across with the
 * thumbnail on top.
 */
/* ---------- Shared pieces ---------- */

/* ---------- Feature ---------- */

function Feature({ u }: { u: Update }) {
  return (
    <section className="card upd-feature" aria-label="Latest update">
      <Thumb u={u} titled={false} className="thumb--feature" />
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

const PER_PAGE = 6;

function Earlier({ items }: { items: Update[] }) {
  const [shown, setShown] = useState(PER_PAGE);
  const slice = items.slice(0, shown);
  const left = items.length - slice.length;
  return (
    <section className="card upd" aria-labelledby="upd-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="upd-title">Earlier updates</h2>
          <p className="orders__sub">{items.length} more, newest first</p>
        </div>
      </header>

      <div className="upd-grid">
        {slice.map((u) => <UpdateCard u={u} key={u.id} />)}
      </div>

      <footer className="tx__foot upd-foot">
        <p className="tx__count num">Showing {slice.length} of {items.length}</p>
        {left > 0 && (
          <Button variant="ghost" onClick={() => setShown((n) => n + PER_PAGE)}>
            Load {Math.min(PER_PAGE, left)} more
          </Button>
        )}
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
        <Feature u={lead} />
        <Earlier items={rest} />
      </main>
      <MobileNav active="updates" />
    </div>
  );
}
