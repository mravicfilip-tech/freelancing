import { useEffect, useState } from 'react';
import { USER, WALLET } from './data';
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
  SignOutIcon,
  SunIcon,
} from './icons';
import { ROUTE } from './Sidebar';
import { theme } from './theme';
import { useCopy } from './useCopy';
import { signOut } from './auth/session';

type RailId = keyof typeof NavIcon;

/**
 * Below the rail's breakpoint the sidebar becomes a five-slot bar under the
 * thumb: the presale home, the two products with their own pages, the claim
 * whitelist, and More for the rest. Buy is reached through Presale, where
 * the form is the first thing under the figures.
 */
const BAR: { id: string; label: string; href: string; badge?: string }[] = [
  { id: 'presale', label: 'Presale', href: '/dashboard' },
  { id: 'earn', label: 'Earn', href: '/earn' },
  { id: 'markets', label: 'Markets', href: '/markets' },
  { id: 'claim', label: 'Claim', href: '/claim', badge: 'NEW' },
];

type Row = { id: RailId; label: string; badge?: string; soon?: boolean };
/** The panel's two groups: the products without a slot, then what is yours. */
const SHEET: Row[][] = [
  [
    { id: 'payfi', label: 'PayFi', badge: 'NEW' },
    { id: 'mystery', label: 'Mystery box' },
    { id: 'updates', label: 'Updates' },
  ],
  [
    { id: 'transactions', label: 'My transactions' },
    { id: 'referrals', label: 'Referrals' },
  ],
];

/**
 * The sheet is the mobile stand-in for everything the bar cannot hold: the
 * leftover rail routes, the wallet the whole dashboard is about, and the theme
 * switch that lives in the topbar on a desktop.
 */
function Sheet({ onClose, active }: { onClose: () => void; active: string }) {
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

      <div className="sheet__body">
      {SHEET.map((group, g) => (
        <ul className={`sheet__list${g > 0 ? ' sheet__list--account' : ''}`} key={g}>
          {group.map(({ id, label, badge, soon }) => {
            const Icon = NavIcon[id];
            return (
              <li key={id}>
                <a className={`sheet__item${soon ? ' sheet__item--soon' : ''}`} href={soon ? undefined : ROUTE[id] ?? `#${id}`} aria-current={id === active ? 'page' : undefined} aria-disabled={soon || undefined} onClick={onClose}>
                  <Icon className="icon-22" />
                  {label}
                  {badge && <span className="rail__badge">{badge}</span>}
                  <ChevronRight className="icon-16 sheet__chev" />
                </a>
              </li>
            );
          })}
        </ul>
      ))}
      </div>

      <div className="sheet__foot">
      <a className="sheet__item sheet__me" href="/settings" onClick={onClose}>
        <span className="sheet__avatar">{USER.initials}</span>
        <span className="sheet__me-text">
          <span>{USER.name}</span>
          <span className="sheet__me-sub">Settings</span>
        </span>
        <ChevronRight className="icon-16 sheet__chev" />
      </a>
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

      {/* Last in the sheet, under a rule: the one destructive-feeling move in
          the menu, kept away from the routes so it is not tapped by accident.
          On a phone the sheet is the only chrome there is, so without it there
          is no way off the dashboard at all. */}
      <a className="sheet__out" href="/auth" onClick={() => { signOut(); onClose(); }}>
        <SignOutIcon className="icon-22" />
        Log out
      </a>
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
          <Sheet onClose={() => setOpen(false)} active={active} />
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
          data-current={!BAR.some((b) => b.id === active) || undefined}
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
