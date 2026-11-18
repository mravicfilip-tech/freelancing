// A dropdown of the shop's own, Filip 18 November, "style this too and don't make the focus / active so aggressive". A browser's own
// select opens a list the system draws, blue highlight and all, which no style reaches. This is the listbox pattern instead. A button
// shows the choice, the list opens under it, the arrow keys, Home and End move through it, Enter or Space picks, Escape and a click
// outside shut it and the focus goes back to the button, a letter jumps to the first option it starts.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export type DropOption<T extends string> = { id: T; label: string };

export function Dropdown<T extends string>({ label, value, options, onChange, className = '' }: { label: string; value: T; options: DropOption<T>[]; onChange: (v: T) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const at = Math.max(0, options.findIndex((o) => o.id === value));

  const show = () => {
    setHot(at);
    setOpen(true);
  };
  const shut = (focus = true) => {
    setOpen(false);
    if (focus) button.current?.focus();
  };
  const pick = (i: number) => {
    onChange(options[i].id);
    shut();
  };

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && shut(false);
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const onButton = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      show();
    }
  };
  const onList = (e: KeyboardEvent) => {
    const n = options.length;
    if (e.key === 'ArrowDown') setHot((h) => Math.min(n - 1, h + 1));
    else if (e.key === 'ArrowUp') setHot((h) => Math.max(0, h - 1));
    else if (e.key === 'Home') setHot(0);
    else if (e.key === 'End') setHot(n - 1);
    else if (e.key === 'Enter' || e.key === ' ') pick(hot);
    else if (e.key === 'Escape') shut();
    else if (e.key === 'Tab') return shut(false);
    else if (e.key.length === 1) {
      const i = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setHot(i);
      else return;
    } else return;
    e.preventDefault();
  };

  return (
    <div className={`sp-drop ${className}`} ref={root} data-open={open || undefined}>
      <span className="sp-drop-l" id={`${id}-l`}>
        {label}
      </span>
      <button
        type="button"
        className="sp-drop-b"
        ref={button}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-l ${id}-v`}
        onClick={() => (open ? shut() : show())}
        onKeyDown={onButton}
      >
        <span id={`${id}-v`}>{options[at]?.label}</span>
      </button>
      {open ? (
        <ul className="sp-drop-list" role="listbox" ref={list} tabIndex={-1} aria-labelledby={`${id}-l`} aria-activedescendant={`${id}-${hot}`} onKeyDown={onList}>
          {options.map((o, i) => (
            <li
              role="option"
              id={`${id}-${i}`}
              aria-selected={i === at}
              data-hot={i === hot || undefined}
              onPointerEnter={() => setHot(i)}
              onClick={() => pick(i)}
              key={o.id}
            >
              {o.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
