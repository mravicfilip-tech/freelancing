import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from '../icons';
import { CORRIDORS } from './corridors';

/** The destination: the phone field's country menu, with the currency after the name. */
export function CorridorSelect({ value, onChange, id }: { value: string; onChange: (iso: string) => void; id: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = CORRIDORS.find((c) => c.iso === value) ?? CORRIDORS[0];

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
    <div className="tsel nsel" ref={root}>
      <button type="button" id={id} className="tsel__button nsel__button" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} onClick={() => setOpen((o) => !o)}>
        <img className="csel__flag" src={current.flag} alt="" width={20} height={15} />
        <span className="nsel__label">{current.country} <span className="tsel__name">{current.ccy}</span></span>
        <ChevronDown className="icon-14 tsel__chevron" />
      </button>
      {open && (
        <ul className="tsel__menu nsel__menu csel__menu" id={listId} role="listbox" aria-label="Destination">
          {CORRIDORS.map((c) => (
            <li key={c.iso}>
              <button type="button" role="option" aria-selected={c.iso === value} className="tsel__option" onClick={() => { onChange(c.iso); setOpen(false); }}>
                <img className="csel__flag" src={c.flag} alt="" width={20} height={15} />
                <span className="nsel__label">{c.country}</span>
                <span className="tsel__name">{c.ccy}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
