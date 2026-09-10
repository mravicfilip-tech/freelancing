import { useEffect, useState } from 'react';
import { WALLET } from './data';
import {
  BuyIcon,
  CheckIcon,
  ChevronRight,
  CloseIcon,
  CopyIcon,
  MoonIcon,
  MoreIcon,
  NavIcon,
  PayMark,
  SunIcon,
} from './icons';
import { theme } from './theme';
import { useCopy } from './useCopy';

type RailId = keyof typeof NavIcon;

/**
 * Below the rail's breakpoint the seven-item sidebar becomes a five-slot bar
 * under the thumb. Four slots are destinations; the fifth opens the sheet.
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

/**
 * The sheet is the mobile stand-in for everything the bar cannot hold: the
 * leftover rail routes, the wallet the whole dashboard is about, and the theme
 * switch that lives in the topbar on a desktop.
 */
function Sheet({ onClose }: { onClose: () => void }) {
  const mode = theme.use();
  const [copied, copy] = useCopy();

  return (
    <div className="sheet" role="dialog" aria-label="More" aria-modal="true">
      <span className="sheet__grip" aria-hidden="true" />

      <header className="sheet__head">
        <h2 className="sheet__title">More</h2>
        <button type="button" className="chip-btn" onClick={onClose} aria-label="Close menu">
          <CloseIcon className="icon-20" />
        </button>
      </header>

      <ul className="sheet__list">
        {SHEET.map(({ id, label, badge }) => {
          const Icon = NavIcon[id];
          return (
            <li key={id}>
              <a className="sheet__item" href={`#${id}`} onClick={onClose}>
                <Icon className="icon-22" />
                {label}
                {badge && <span className="rail__badge">{badge}</span>}
                <ChevronRight className="icon-16 sheet__chev" />
              </a>
            </li>
          );
        })}
      </ul>

      <div className="sheet__wallet">
        <PayMark id="ETH" className="icon-28" />
        <span className="sheet__wallet-text">
          <span className="sheet__wallet-addr">{WALLET.short}</span>
          <span className="sheet__wallet-sub">
            <span className="sheet__live" aria-hidden="true" />
            Connected · {WALLET.chain}
          </span>
        </span>
        <button
          type="button"
          className="chip-btn"
          onClick={() => copy(WALLET.address)}
          aria-label={copied ? 'Address copied' : 'Copy wallet address'}
        >
          {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
        </button>
      </div>

      <div className="sheet__row">
        <span className="sheet__row-label">Appearance</span>
        <div className="seg" role="group" aria-label="Appearance">
          <button
            type="button"
            className="seg__opt"
            aria-pressed={mode === 'light'}
            onClick={() => theme.set('light')}
          >
            <SunIcon className="icon-16" />
            Light
          </button>
          <button
            type="button"
            className="seg__opt"
            aria-pressed={mode === 'dark'}
            onClick={() => theme.set('dark')}
          >
            <MoonIcon className="icon-16" />
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileNav({ active = 'presale' }: { active?: string }) {
  const [open, setOpen] = useState(false);

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
        <>
          <div className="sheet__scrim" onClick={() => setOpen(false)} aria-hidden="true" />
          <Sheet onClose={() => setOpen(false)} />
        </>
      )}

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
