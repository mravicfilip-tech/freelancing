import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, PayMark } from '../icons';
import { NETWORKS, type NetworkId } from './wallet';

function Mark({ mark }: { mark: string }) {
  if (mark === 'ETH' || mark === 'BNB' || mark === 'SOL') return <PayMark id={mark} className="icon-20" />;
  return <span className="nsel__disc" aria-hidden="true">{mark}</span>;
}

/**
 * The network a payout wallet is on: the phone field's country menu, with a
 * chain mark in place of the flag and a placeholder until one is chosen.
 */
export function NetworkSelect({ value, onChange, id }: { value: NetworkId | null; onChange: (n: NetworkId) => void; id: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = NETWORKS.find((n) => n.id === value) ?? null;

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
      <button
        type="button"
        id={id}
        className="tsel__button nsel__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {current ? (
          <>
            <Mark mark={current.mark} />
            <span className="nsel__label">{current.name} <span className="tsel__name">{current.standard}</span></span>
          </>
        ) : (
          <span className="nsel__placeholder">Select network</span>
        )}
        <ChevronDown className="icon-14 tsel__chevron" />
      </button>
      {open && (
        <ul className="tsel__menu nsel__menu" id={listId} role="listbox" aria-label="Network">
          {NETWORKS.map((n) => (
            <li key={n.id}>
              <button type="button" role="option" aria-selected={n.id === value} className="tsel__option" onClick={() => { onChange(n.id); setOpen(false); }}>
                <Mark mark={n.mark} />
                <span className="nsel__label">{n.name}</span>
                <span className="tsel__name">{n.standard}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
