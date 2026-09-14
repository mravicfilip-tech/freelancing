import { PRESALE } from './data';
import { MoonIcon, SunIcon } from './icons';
import { theme } from './theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
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
    <header className="topbar">
      <div>
        <p className="topbar__greeting">{eyebrow ?? `${greeting()}, Filip`}</p>
        <h1 className="topbar__title">{title}</h1>
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
      </div>
    </header>
  );
}
