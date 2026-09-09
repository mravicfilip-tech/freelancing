import { MoonIcon, SunIcon } from './icons';
import { theme } from './theme';

export function Topbar() {
  const current = theme.use();
  const next = current === 'dark' ? 'light' : 'dark';

  return (
    <header className="topbar">
      <div>
        <p className="topbar__eyebrow">Presale dashboard</p>
        <h1 className="topbar__title">Welcome back</h1>
      </div>

      <div className="topbar__actions">
        <p className="topbar__live">
          <span className="topbar__dot" aria-hidden="true" />
          Stage 12 live
        </p>
        <button
          type="button"
          className="icon-btn"
          onClick={() => theme.set(next)}
          aria-label={`Switch to ${next} mode`}
        >
          {current === 'dark' ? <SunIcon className="icon-20" /> : <MoonIcon className="icon-20" />}
        </button>
      </div>
    </header>
  );
}
