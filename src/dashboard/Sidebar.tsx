import { useEffect, useRef, useState } from 'react';
import { USER, WALLET } from './data';
import { CheckIcon, ChevronDown, CopyIcon, NavIcon, SettingsIcon, SignOutIcon, UserIcon } from './icons';
import { useCopy } from './useCopy';
import { signOut } from './auth/session';
import { rail } from './theme';

type Id = keyof typeof NavIcon;

/** The screens that exist as routes; the rest are still anchors until built. */
export const ROUTE: Partial<Record<Id, string>> = { presale: '/dashboard', earn: '/earn', markets: '/markets', updates: '/updates', mystery: '/mystery' };

/** Two groups, split exactly where the reference breaks. */
const GROUPS: Id[][] = [
  ['presale', 'earn', 'markets', 'payfi'],
  ['referrals', 'updates', 'mystery', 'claim'],
];

const META: Record<Id, { label: string; badge?: string }> = {
  presale: { label: 'Presale' },
  earn: { label: 'Earn' },
  markets: { label: 'Markets' },
  payfi: { label: 'PayFi', badge: 'NEW' },
  referrals: { label: 'Referrals' },
  updates: { label: 'Updates' },
  mystery: { label: 'Mystery box' },
  claim: { label: 'Claim', badge: 'NEW' },
};

/** `settings` lights no route: the account menu's pages are reached from the foot. */
export function Sidebar({ active = 'presale' }: { active?: Id | 'settings' }) {
  const mode = rail.use();
  const collapsed = mode === 'collapsed';

  return (
    <aside className="rail" data-mode={mode}>
      <a className="rail__brand" href="/" aria-label="Remittix home">
        <img className="rail__logo" src="/figma/logo.svg" alt="" width={33} height={17} />
        <span className="rail__wordmark">Remittix</span>
      </a>

      <nav className="rail__nav" aria-label="Dashboard">
        {GROUPS.map((group, i) => (
          <ul className="rail__group" key={i}>
            {group.map((id) => {
              const Icon = NavIcon[id];
              const { label, badge } = META[id];
              const current = id === active;
              return (
                <li key={id}>
                  <a
                    className="rail__item"
                    href={ROUTE[id] ?? `#${id}`}
                    aria-current={current ? 'page' : undefined}
                    title={collapsed ? label : undefined}
                  >
                    <span className="rail__icon">
                      <Icon className="icon-22" />
                    </span>
                    <span className="rail__label">{label}</span>
                    {badge && <span className="rail__badge">{badge}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>

      <RailAccount collapsed={collapsed} />

      <button
        type="button"
        className="rail__toggle"
        onClick={() => rail.set(collapsed ? 'extended' : 'collapsed')}
        aria-pressed={collapsed}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon-20"
          aria-hidden="true"
        >
          <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
          <path d="M10 4.5v15" />
        </svg>
        <span className="rail__label">{collapsed ? 'Expand' : 'Collapse'}</span>
      </button>
    </aside>
  );
}

/**
 * The account, in the space the nav leaves: one trigger with the avatar, name
 * and wallet, and a menu above it for profile, settings and the way out. One
 * row instead of three keeps the rail short enough for a laptop; collapsed,
 * the trigger is the avatar alone.
 */
function RailAccount({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const [copied, copy] = useCopy();

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
    <div className="rail__foot" ref={root}>
      {open && (
        <div className="rail__menu" role="menu" aria-label="Account">
          <div className="rail__menu-head">
            <span className="rail__avatar" aria-hidden="true">
              {USER.initials}
            </span>
            <span className="rail__user-text">
              <span className="rail__user-name">{USER.name}</span>
              <span className="rail__user-sub">
                <span className="sheet__live" aria-hidden="true" />
                Connected · {WALLET.chain}
              </span>
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            className="rail__menu-item rail__menu-item--wallet"
            onClick={() => copy(WALLET.address)}
          >
            <span className="num">{WALLET.short}</span>
            <span className="rail__menu-hint">
              {copied ? <CheckIcon className="icon-16" /> : <CopyIcon className="icon-16" />}
              {copied ? 'Copied' : 'Copy'}
            </span>
          </button>
          <a role="menuitem" className="rail__menu-item" href="/settings" onClick={() => setOpen(false)}>
            <UserIcon className="icon-20" />
            Profile
          </a>
          <a role="menuitem" className="rail__menu-item" href="/settings" onClick={() => setOpen(false)}>
            <SettingsIcon className="icon-20" />
            Settings
          </a>
          <a role="menuitem" className="rail__menu-item rail__menu-item--out" href="/auth" onClick={signOut}>
            <SignOutIcon className="icon-20" />
            Log out
          </a>
        </div>
      )}

      <button
        type="button"
        className="rail__user"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title={collapsed ? USER.name : undefined}
      >
        <span className="rail__avatar" aria-hidden="true">
          {USER.initials}
        </span>
        <span className="rail__user-text">
          <span className="rail__user-name">{USER.name}</span>
          <span className="rail__user-sub num">{WALLET.short}</span>
        </span>
        <ChevronDown className="icon-16 rail__user-chev" />
      </button>
    </div>
  );
}
