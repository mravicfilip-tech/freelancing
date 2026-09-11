import { PRESALE } from './data';
import { MoonIcon, SignOutIcon, SunIcon } from './icons';
import { theme } from './theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

export function Topbar() {
  const current = theme.use();
  const next = current === 'dark' ? 'light' : 'dark';

  return (
    <header className="topbar">
      <div>
        <p className="topbar__greeting">{greeting()}, Filip</p>
        <h1 className="topbar__title">Remittix Presale Dashboard</h1>
      </div>

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
        <a className="chip-btn" href="/auth" aria-label="Log out">
          <SignOutIcon className="icon-20" />
        </a>
      </div>
    </header>
  );
}
