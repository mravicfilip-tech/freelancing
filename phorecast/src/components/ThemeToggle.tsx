import { useRef, type KeyboardEvent } from 'react';
import { setTheme, toggleTheme, useTheme, type Theme } from '../lib/theme';
import './ThemeToggle.css';

/* The glyphs are inline rather than imported because the whole point is that
   they follow `currentColor`, and because an asset file would be a shared
   file, and shared asset files are the one thing the light-mode work is not
   allowed to touch. They are lifted out of ThemeToggle only so the segmented
   switch below can draw the same sun and the same moon. */
const Sun = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" width="18" height="18" fill="none">
    <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 1.6v2.2M10 16.2v2.2M18.4 10h-2.2M3.8 10H1.6M15.94 4.06l-1.56 1.56M5.62 14.38l-1.56 1.56M15.94 15.94l-1.56-1.56M5.62 5.62L4.06 4.06"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const Moon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" width="18" height="18" fill="none">
    <path
      d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The theme switcher, desktop form: one 44px square in the nav bar.
 *
 * `aria-pressed` would be wrong: this is not one state being turned on and
 * off, it is a choice between two. So it is a plain button whose accessible
 * name states the DESTINATION — "Switch to light mode" — and changes when the
 * theme does. That name change is the announcement; there is no live region.
 *
 * That reasoning is why this component is UNTOUCHED rather than reshaped for
 * the mobile sheet: the sheet's control is a different control (see
 * `ThemeSwitch`), not this one restyled, so the desktop bar renders from the
 * same code path it always did and cannot move by a pixel.
 *
 * The dead `theme-toggle__label` span is gone with the sheet variant that was
 * its only consumer. It was `display: none` on desktop, so it contributed
 * neither pixels nor an accessible name.
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
        <Sun className="theme-toggle__sun" />
        {/* Moon: shown in dark. */}
        <Moon className="theme-toggle__moon" />
      </span>
    </button>
  );
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * The theme switcher, sheet form: a two-segment track with the current theme
 * filled in.
 *
 * WHY A DIFFERENT CONTROL, not a restyled `ThemeToggle`. In the bar the
 * toggle is one of three things competing for 44px and the icon carries it.
 * In a full-screen sheet it became a full-width pill reading "SWITCH TO DARK
 * MODE", identical in size and shape to Login and Sign Up beside it — so a
 * mode control looked like a third account action, and the one thing it never
 * said was which mode you were in. A segment per option fixes both: it is
 * visibly not a button-stack, and the answer to "what am I in" is the filled
 * half, present without touching anything.
 *
 * WHY role=radiogroup, and why that does NOT contradict the note above on
 * `aria-pressed`. That note rejects `aria-pressed` because this is a choice
 * between two, not one state toggled on and off — and a radio group is
 * exactly the role for "choose one of N". So this is the same argument
 * carried to its conclusion, not a reversal of it: the DOM now really does
 * offer two options, so the markup names two options and marks one checked.
 * `role="switch"` would be the wrong one for the same reason `aria-pressed`
 * was: it means on/off.
 *
 * The group takes its accessible name from the visible "Appearance" caption
 * in the sheet, so the caption is not read twice. Each option's name is its
 * own label; its state is `aria-checked`, which AT announces on arrival and
 * on change — the same job the destination-naming label did for the button,
 * done by the role instead of by a sentence.
 *
 * Roving tabindex, per the radio-group pattern: Tab enters the group once and
 * lands on the checked option, arrows move between options and select as they
 * go. With two options every arrow key is "the other one".
 */
export function ThemeSwitch({ labelledBy }: { labelledBy: string }) {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    ref.current?.querySelector<HTMLButtonElement>(`[data-opt="${next}"]`)?.focus();
  };

  return (
    <div
      ref={ref}
      className="theme-seg"
      data-mode={theme}
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={onKeyDown}
    >
      {/* The travelling fill. It is a separate element rather than a
          background on the checked option so the change reads as one object
          moving, which is what a choice between two looks like. */}
      <span className="theme-seg__thumb" aria-hidden="true" />
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          data-opt={o.value}
          className="theme-seg__opt"
          aria-checked={theme === o.value}
          tabIndex={theme === o.value ? 0 : -1}
          onClick={() => setTheme(o.value)}
        >
          {o.value === 'light'
            ? <Sun className="theme-seg__glyph" />
            : <Moon className="theme-seg__glyph" />}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
