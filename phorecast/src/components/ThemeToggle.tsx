import { toggleTheme, useTheme } from '../lib/theme';
import './ThemeToggle.css';

/**
 * The theme switcher.
 *
 * `aria-pressed` would be wrong: this is not one state being turned on and
 * off, it is a choice between two. So it is a plain button whose accessible
 * name states the DESTINATION — "Switch to light mode" — and changes when the
 * theme does. That name change is the announcement; there is no live region.
 *
 * The glyphs are inline rather than imported because the whole point is that
 * they follow `currentColor`, and because an asset file would be a shared
 * file, and shared asset files are the one thing the light-mode work is not
 * allowed to touch.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={className ? `theme-toggle ${className}` : 'theme-toggle'}
      data-mode={theme}
      onClick={toggleTheme}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
    >
      <span className="theme-toggle__glyphs" aria-hidden="true">
        {/* Sun: shown in light, because light is what you are in. */}
        <svg className="theme-toggle__sun" viewBox="0 0 20 20" width="18" height="18" fill="none">
          <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 1.6v2.2M10 16.2v2.2M18.4 10h-2.2M3.8 10H1.6M15.94 4.06l-1.56 1.56M5.62 14.38l-1.56 1.56M15.94 15.94l-1.56-1.56M5.62 5.62L4.06 4.06"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {/* Moon: shown in dark. */}
        <svg className="theme-toggle__moon" viewBox="0 0 20 20" width="18" height="18" fill="none">
          <path
            d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="theme-toggle__label">Switch to {next} mode</span>
    </button>
  );
}
