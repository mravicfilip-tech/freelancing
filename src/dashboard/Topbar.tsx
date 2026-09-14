import { PRESALE } from './data';
import { MoonIcon, SignOutIcon, SunIcon } from './icons';
import { SearchIcon } from './icons';
import { theme } from './theme';
import { signOut } from './auth/session';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

/** `?t=1..5` picks the bar's form while the options are reviewed. */
const params = new URLSearchParams(window.location.search);
const T = Math.min(5, Math.max(1, Number(params.get('t')) || 1));
const REVIEW = params.has('t');
const FORMS = [
  { n: 1, name: 'Card' }, { n: 2, name: 'Ruled' }, { n: 3, name: 'Breadcrumb' }, { n: 4, name: 'Quiet bar' }, { n: 5, name: 'Toolbar' },
] as const;

function Picker() {
  const keep = new URLSearchParams(window.location.search);
  return (
    <nav className="vpick topbar__pick" aria-label="Topbar forms">
      {FORMS.map((f) => {
        keep.set('t', String(f.n));
        return (
          <a key={f.n} className="vpick__item" href={`?${keep.toString()}`} aria-current={f.n === T ? 'page' : undefined}>
            <b>T{f.n}</b> {f.name}
          </a>
        );
      })}
    </nav>
  );
}

/** Title and eyebrow default to the presale home; other screens pass their own. */
export function Topbar({
  title = 'Remittix Presale Dashboard',
  eyebrow,
}: {
  title?: string;
  eyebrow?: string;
} = {}) {
  const current = theme.use();
  const next = current === 'dark' ? 'light' : 'dark';

  return (
    <>
    {REVIEW && <Picker />}
    <header className="topbar" data-t={T}>
      <div className="topbar__lead">
        {T === 3 ? (
          <p className="topbar__greeting topbar__crumb">
            <a href="/dashboard">Remittix</a>
            <span aria-hidden="true">/</span>
            <span>{title}</span>
          </p>
        ) : (
          <p className="topbar__greeting">{eyebrow ?? `${greeting()}, Filip`}</p>
        )}
        <h1 className="topbar__title">{title}</h1>
      </div>

      {T === 5 && (
        <label className="field__control topbar__search">
          <SearchIcon className="icon-16" />
          <input className="topbar__search-input" type="search" placeholder="Search orders, updates, stages" aria-label="Search" />
        </label>
      )}

      <div className="topbar__actions">
        <p className="topbar__live">
          <span className="topbar__dot" aria-hidden="true" />
          Stage {PRESALE.stage} is live
        </p>
        <button
          type="button"
          className="chip-btn"
          onClick={() => theme.set(next)}
          aria-label={`Switch to ${next} mode`}
        >
          {current === 'dark' ? <SunIcon className="icon-20" /> : <MoonIcon className="icon-20" />}
        </button>
        {/* There was no way out of the dashboard at all. Signing in is a route
            rather than a session, so leaving is the same move in reverse. */}
        <a className="chip-btn" href="/auth" aria-label="Log out" onClick={signOut}>
          <SignOutIcon className="icon-20" />
        </a>
      </div>
    </header>
    </>
  );
}
