import { useEffect, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Gear, Headset, MagnifyingGlass, Plus, Question, UserPlus, Wallet, X } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { useWallet } from '../../wallet/store';
import { ACCOUNT } from '../../../data/wallet';
import { CATEGORIES } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { Coin } from '../kit/parts';
import { BellSquare, UserBox } from '../kit/TopParts';
import type { CategoryFilter } from './data';
import { ROOM_ICON, WRAP } from './icons';

// The top bar, built to NewBettie's. The logo, one wide search that filters the floor as you type
// (press / anywhere to jump in), the balance box with a purple Deposit, settings, the bell and you.
export function TopBar({ query, onQuery, onSubmit, onHome }: { query: string; onQuery: (q: string) => void; onSubmit: () => void; onHome: () => void }) {
  const { balance } = useWallet();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <header className="sticky top-0 z-20 bg-page">
      <div className={cn(WRAP, 'flex h-[84px] items-center gap-4')}>
        <Link
          to="/variants/4"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          aria-label="Lusty Lagoon, back to the top"
          className="mr-4 shrink-0 rounded-lg"
        >
          <Logo className="text-[20px] leading-[22px]" />
        </Link>

        <form role="search" onSubmit={submit} className="flex h-[52px] w-full max-w-[560px] items-center gap-3 rounded-[14px] bg-[rgb(var(--k-item))] pl-4 pr-2 focus-within:ring-2 focus-within:ring-[#B47CFF]">
          <MagnifyingGlass weight="bold" className="h-5 w-5 shrink-0 text-[rgb(var(--k-muted))]" aria-hidden />
          <label htmlFor="v4-search" className="sr-only">
            Search for games or providers
          </label>
          <input
            ref={input}
            id="v4-search"
            type="text"
            inputMode="search"
            autoComplete="off"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onQuery('');
                input.current?.blur();
              }
            }}
            placeholder="Search for games or providers"
            className="peer h-full min-w-0 flex-1 bg-transparent text-16 font-semibold text-ink outline-none placeholder:font-semibold placeholder:text-[rgb(var(--k-dim))]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                onQuery('');
                input.current?.focus();
              }}
              aria-label="Clear the search"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgb(var(--k-item-hover))] text-ink hover:brightness-125"
            >
              <X weight="bold" className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <kbd aria-hidden className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgb(var(--k-panel))] font-sans text-14 font-bold text-[rgb(var(--k-muted))] peer-focus:hidden">
              /
            </kbd>
          )}
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/wallet/deposit"
            aria-label={`Balance ${formatAmount(balance)} ${ACCOUNT.currency}, open the wallet`}
            className="flex h-[52px] items-center gap-3 rounded-[14px] bg-[rgb(var(--k-item))] px-4 hover:bg-[rgb(var(--k-item-hover))]"
          >
            <Coin id="usdt" size={24} />
            <span aria-live="polite" className="num text-18 font-bold text-ink">
              {formatAmount(balance)}
            </span>
            <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">{ACCOUNT.currency}</span>
          </Link>
          <DepositLink />
          <Link
            to="/account"
            aria-label="Settings"
            className="ml-2 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item-hover))] hover:text-ink"
          >
            <Gear weight="fill" className="h-6 w-6" aria-hidden />
          </Link>
          <BellSquare />
          <UserBox />
        </div>
      </div>
    </header>
  );
}

const linkBox = 'flex h-[52px] items-center gap-2 rounded-[14px] bg-[rgb(var(--k-item))] px-4 text-14 font-bold text-[rgb(var(--k-muted))] transition-colors hover:bg-[rgb(var(--k-item-hover))] hover:text-ink [&>svg]:h-5 [&>svg]:w-5';

// The primary nav row. The rooms sit in one segmented control, NewBettie's Casino and Sport switch,
// and each one filters the floor below. The boxed links on the right leave for the money pages.
export function NavRow({ cat, onPick, onHome }: { cat: CategoryFilter; onPick: (c: CategoryFilter) => void; onHome: () => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  return (
    <nav aria-label="Primary" className={cn(WRAP, 'flex items-center gap-4 pb-4')}>
      <div className="flex h-[52px] items-center gap-1 rounded-[14px] bg-[rgb(var(--k-panel))] p-1">
        {CATEGORIES.map((c) => {
          const on = cat === c.value;
          return (
            <a
              key={c.value}
              href={c.value === 'all' ? '#top' : '#find'}
              aria-current={on ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                if (c.value === 'all') onHome();
                else onPick(c.value);
              }}
              className={cn(
                'flex h-11 items-center gap-2 rounded-[10px] px-4 text-14 font-bold transition-colors [&>svg]:h-[18px] [&>svg]:w-[18px]',
                on ? 'k-btn-purple text-ink' : 'text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item))] hover:text-ink',
              )}
            >
              {ROOM_ICON[c.value]}
              {c.value === 'all' ? 'Lobby' : c.label}
            </a>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Link to="/wallet/deposit" className={linkBox}>
          <Wallet weight="fill" aria-hidden />
          Wallet
          {pending > 0 && (
            <span className="num ml-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gold px-[6px] text-12 font-bold text-on-gold">
              {pending}
              <span className="sr-only"> pending</span>
            </span>
          )}
        </Link>
        <Link to="/agent" className={linkBox}>
          <Headset weight="fill" aria-hidden />
          Send to agent
        </Link>
        <Link to="/refer" className={linkBox}>
          <UserPlus weight="fill" aria-hidden />
          Refer a friend
        </Link>
        <Link to="/faq" className={linkBox}>
          <Question weight="fill" aria-hidden />
          FAQ
        </Link>
      </div>
    </nav>
  );
}

export function DepositLink() {
  return (
    <Link to="/wallet/deposit" className="k-btn-purple inline-flex h-[52px] items-center gap-2 rounded-[14px] px-[20px] text-16 font-bold text-ink hover:brightness-110">
      <Plus weight="bold" className="h-5 w-5" aria-hidden />
      Deposit
    </Link>
  );
}
