import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from '../icons';

/**
 * The phone field's country code, on the buy form's token menu: a button in
 * the control, a listbox under it, Escape and an outside click to close.
 * Flags are the regional-indicator emoji, so they cost no assets.
 */
export const COUNTRIES = [
  { iso: 'US', dial: '+1', name: 'United States' },
  { iso: 'GB', dial: '+44', name: 'United Kingdom' },
  { iso: 'DE', dial: '+49', name: 'Germany' },
  { iso: 'FR', dial: '+33', name: 'France' },
  { iso: 'ES', dial: '+34', name: 'Spain' },
  { iso: 'IT', dial: '+39', name: 'Italy' },
  { iso: 'NL', dial: '+31', name: 'Netherlands' },
  { iso: 'CH', dial: '+41', name: 'Switzerland' },
  { iso: 'RS', dial: '+381', name: 'Serbia' },
  { iso: 'HR', dial: '+385', name: 'Croatia' },
  { iso: 'AE', dial: '+971', name: 'United Arab Emirates' },
  { iso: 'IN', dial: '+91', name: 'India' },
  { iso: 'SG', dial: '+65', name: 'Singapore' },
  { iso: 'AU', dial: '+61', name: 'Australia' },
  { iso: 'CA', dial: '+1', name: 'Canada' },
] as const;
export type Iso = (typeof COUNTRIES)[number]['iso'];

const flag = (iso: string) => String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

export function CodeSelect({ value, onChange }: { value: Iso; onChange: (iso: Iso) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = COUNTRIES.find((c) => c.iso === value) ?? COUNTRIES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="tsel csel" ref={root}>
      <button
        type="button"
        className="tsel__button csel__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Country code, ${current.name} ${current.dial}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="csel__flag" aria-hidden="true">{flag(current.iso)}</span>
        <span className="tsel__code num">{current.dial}</span>
        <ChevronDown className="icon-14 tsel__chevron" />
      </button>
      {open && (
        <ul className="tsel__menu csel__menu" id={listId} role="listbox" aria-label="Country code">
          {COUNTRIES.map((c) => (
            <li key={c.iso}>
              <button type="button" role="option" aria-selected={c.iso === value} className="tsel__option" onClick={() => { onChange(c.iso); setOpen(false); }}>
                <span className="csel__flag" aria-hidden="true">{flag(c.iso)}</span>
                <span className="csel__country">{c.name}</span>
                <span className="tsel__name num">{c.dial}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
