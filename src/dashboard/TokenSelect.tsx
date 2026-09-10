import { useEffect, useId, useRef, useState } from 'react';
import { TOKENS, type TokenId } from './data';
import { ChevronDown, PayMark } from './icons';

/**
 * The native select drew an OS menu that ignored the page entirely. This is the
 * same control with a menu the design can reach: a button, a listbox, and the
 * keyboard behaviour people expect from one.
 */
export function TokenSelect({
  value,
  onChange,
}: {
  value: TokenId;
  onChange: (id: TokenId) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (id: TokenId) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="tsel" ref={root}>
      <button
        type="button"
        className="tsel__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Pay with ${value}`}
        onClick={() => setOpen((o) => !o)}
      >
        <PayMark id={value} className="icon-20" />
        {value}
        <ChevronDown className="icon-14 tsel__chevron" />
      </button>

      {open && (
        <ul className="tsel__menu" id={listId} role="listbox" aria-label="Pay with">
          {TOKENS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                role="option"
                aria-selected={t.id === value}
                className="tsel__option"
                onClick={() => pick(t.id)}
              >
                <PayMark id={t.id} className="icon-20" />
                <span className="tsel__code">{t.id}</span>
                <span className="tsel__name">{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
