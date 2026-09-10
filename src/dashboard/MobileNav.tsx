import { useEffect, useRef, useState } from 'react';
import { BuyIcon, MoreIcon, NavIcon } from './icons';

type RailId = keyof typeof NavIcon;

/**
 * Below the rail's breakpoint the seven-item sidebar becomes a five-slot bar
 * under the thumb. Four of the slots are destinations; the fifth opens a sheet
 * with everything that did not fit.
 *
 * Buy is not a rail route — it is the one thing a presale visitor came to do,
 * so on a phone it gets a permanent slot that jumps to the form.
 */
const BAR: { id: string; label: string; href: string; badge?: string }[] = [
  { id: 'presale', label: 'Presale', href: '#presale' },
  { id: 'buy', label: 'Buy', href: '#buy' },
  { id: 'referrals', label: 'Referrals', href: '#referrals' },
  { id: 'claim', label: 'Claim', href: '#claim', badge: 'NEW' },
];

const SHEET: { id: RailId; label: string; badge?: string }[] = [
  { id: 'earn', label: 'Earn' },
  { id: 'markets', label: 'Markets' },
  { id: 'payfi', label: 'PayFi', badge: 'NEW' },
  { id: 'updates', label: 'Updates' },
];

export function MobileNav({ active = 'presale' }: { active?: string }) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  /* Buy is an in-page jump, not a route: scroll the form up and put the caret
     in the amount field, so the tap lands the user mid-task rather than at the
     top of a card they still have to read. */
  const jumpToBuy = (e: React.MouseEvent) => {
    const form = document.getElementById('buy');
    if (!form) return;
    e.preventDefault();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.querySelector<HTMLInputElement>('.field__input')?.focus({ preventScroll: true });
  };

  return (
    <>
      {open && (
        <div className="sheet__scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <div
        className="sheet"
        ref={sheetRef}
        data-open={open || undefined}
        role="dialog"
        aria-label="More sections"
        aria-modal={open || undefined}
        hidden={!open}
      >
        <span className="sheet__grip" aria-hidden="true" />
        <ul className="sheet__list">
          {SHEET.map(({ id, label, badge }) => {
            const Icon = NavIcon[id];
            return (
              <li key={id}>
                <a className="sheet__item" href={`#${id}`} onClick={() => setOpen(false)}>
                  <Icon className="icon-22" />
                  {label}
                  {badge && <span className="rail__badge">{badge}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <nav className="tabbar" aria-label="Dashboard">
        {BAR.map(({ id, label, href, badge }) => {
          const Icon = id === 'buy' ? BuyIcon : NavIcon[id as RailId];
          return (
            <a
              key={id}
              className="tabbar__item"
              href={href}
              aria-current={id === active ? 'page' : undefined}
              onClick={id === 'buy' ? jumpToBuy : undefined}
            >
              <span className="tabbar__icon">
                <Icon className="icon-22" />
                {badge && <span className="tabbar__dot" aria-hidden="true" />}
              </span>
              {label}
            </a>
          );
        })}

        <button
          type="button"
          className="tabbar__item"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="tabbar__icon">
            <MoreIcon className="icon-22" />
          </span>
          More
        </button>
      </nav>
    </>
  );
}
