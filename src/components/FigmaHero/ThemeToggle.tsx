import { useId } from 'react';
import { setTheme, useTheme } from '../../theme';
import './ThemeToggle.css';

/**
 * The sun and the moon are one drawing: a disc, and a ring of rays that retracts into it as the
 * disc slides across to bite a crescent out of itself. Two <svg>s crossfading would read as two
 * icons swapping; one that transforms reads as the same light changing.
 */
function Mark() {
  /* The bar and the phone sheet each render a switch, so the mask cannot be a fixed id: two of
     them in one document is one id, and hiding the first takes the crescent off the second. */
  const mask = useId();
  return (
    <svg className="tt__mark" viewBox="0 0 24 24" aria-hidden="true">
      <mask id={mask}>
        <rect width="24" height="24" fill="#fff" />
        {/* in light this cutter sits clear of the disc; in dark it slides over to carve it */}
        <circle className="tt__cutter" cx="24" cy="10" r="6" fill="#000" />
      </mask>
      <circle className="tt__disc" cx="12" cy="12" r="5.5" mask={`url(#${mask})`} />
      <g className="tt__rays" strokeLinecap="round">
        <path d="M12 1.6v2.4" />
        <path d="M12 20v2.4" />
        <path d="M1.6 12h2.4" />
        <path d="M20 12h2.4" />
        <path d="m4.6 4.6 1.7 1.7" />
        <path d="m17.7 17.7 1.7 1.7" />
        <path d="m19.4 4.6-1.7 1.7" />
        <path d="m6.3 17.7-1.7 1.7" />
      </g>
    </svg>
  );
}

/**
 * Light and dark, next to the language. Both are choices about how the page is read rather than
 * what it says, which is why they share the nav's right-hand cell.
 *
 * It is a switch, not a menu: pressing it takes the page to the other side and stores that as the
 * reader's own choice. Following the system is where everyone starts, and there is nothing to
 * choose until they have chosen otherwise.
 */
export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="fh__theme tt"
      data-theme-is={theme}
      aria-pressed={theme === 'dark'}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
    >
      <Mark />
    </button>
  );
}
