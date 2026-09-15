import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from '../icons';

/**
 * The phone field's country code, on the buy form's token menu: a button in
 * the control, a listbox under it, Escape and an outside click to close.
 * Flags are flag-icons' SVGs, copied into public/figma/flags for the
 * countries we list, since emoji flags do not render on Windows.
 */
export const COUNTRIES = [
  { iso: 'US', dial: '+1', name: 'United States', flag: '/figma/flags/us.svg' },
  { iso: 'GB', dial: '+44', name: 'United Kingdom', flag: '/figma/flags/gb.svg' },
  { iso: 'DE', dial: '+49', name: 'Germany', flag: '/figma/flags/de.svg' },
  { iso: 'FR', dial: '+33', name: 'France', flag: '/figma/flags/fr.svg' },
  { iso: 'ES', dial: '+34', name: 'Spain', flag: '/figma/flags/es.svg' },
  { iso: 'IT', dial: '+39', name: 'Italy', flag: '/figma/flags/it.svg' },
  { iso: 'NL', dial: '+31', name: 'Netherlands', flag: '/figma/flags/nl.svg' },
  { iso: 'CH', dial: '+41', name: 'Switzerland', flag: '/figma/flags/ch.svg' },
  { iso: 'RS', dial: '+381', name: 'Serbia', flag: '/figma/flags/rs.svg' },
  { iso: 'HR', dial: '+385', name: 'Croatia', flag: '/figma/flags/hr.svg' },
  { iso: 'AE', dial: '+971', name: 'United Arab Emirates', flag: '/figma/flags/ae.svg' },
  { iso: 'IN', dial: '+91', name: 'India', flag: '/figma/flags/in.svg' },
  { iso: 'SG', dial: '+65', name: 'Singapore', flag: '/figma/flags/sg.svg' },
  { iso: 'AU', dial: '+61', name: 'Australia', flag: '/figma/flags/au.svg' },
  { iso: 'CA', dial: '+1', name: 'Canada', flag: '/figma/flags/ca.svg' },
] as const;
export type Iso = (typeof COUNTRIES)[number]['iso'];


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
        <img className="csel__flag" src={current.flag} alt="" width={20} height={15} />
        <span className="tsel__code num">{current.dial}</span>
        <ChevronDown className="icon-14 tsel__chevron" />
      </button>
      {open && (
        <ul className="tsel__menu csel__menu" id={listId} role="listbox" aria-label="Country code">
          {COUNTRIES.map((c) => (
            <li key={c.iso}>
              <button type="button" role="option" aria-selected={c.iso === value} className="tsel__option" onClick={() => { onChange(c.iso); setOpen(false); }}>
                <img className="csel__flag" src={c.flag} alt="" width={20} height={15} />
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
