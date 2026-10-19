import { useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gear, Headset, MagnifyingGlass, Plus, Question, UserPlus, Wallet, X } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { useWallet } from '../../wallet/store';
import { ACCOUNT } from '../../../data/wallet';
import { CATEGORIES } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { AnimatedNumber, Coin, KitButton } from '../kit/parts';
import { BellSquare, UserBox } from '../kit/TopParts';
import type { CategoryFilter } from './data';
import { ROOM_ICON, WRAP } from './icons';

// The top bar, built to NewBettie's and finished in the round 4 chrome. Frosted glass the page slides
// under, a 1px edge, the logo, one wide search that filters the floor as you type (press / anywhere
// to jump in), the balance box, the one orange Deposit, settings, the bell and you. Every box is 52
// tall on a 14 radius, the same as the kit's bell and account boxes beside them.
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
    <header className="k-glass sticky top-0 z-20 h-[84px]">
      <div className={cn(WRAP, 'flex h-full items-center gap-4')}>
        <Link
          to="/variants/4"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          aria-label="Lusty Lagoon, back to the top"
          className="mr-4 shrink-0 rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
        >
          <Logo className="text-[20px] leading-[22px]" />
        </Link>

        <form
          role="search"
          onSubmit={submit}
          className="k-well flex h-[52px] w-full max-w-[560px] items-center gap-3 rounded-[14px] pl-4 pr-2 transition-[border-color,box-shadow] duration-200 hover:border-white/[0.12] focus-within:border-[#B47CFF]/70 focus-within:ring-2 focus-within:ring-[#B47CFF]/40"
        >
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
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/[0.08] text-ink outline-none transition-colors hover:bg-white/[0.14] focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
            >
              <X weight="bold" className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <kbd aria-hidden className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.08] font-sans text-14 font-semibold text-[rgb(var(--k-muted))] peer-focus:hidden">
              /
            </kbd>
          )}
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/wallet/deposit"
            aria-label={`Balance ${formatAmount(balance)} ${ACCOUNT.currency}, open the wallet`}
            className="flex h-[52px] items-center gap-3 rounded-[14px] border border-white/[0.07] bg-[rgb(var(--k-item))] px-4 outline-none transition-colors hover:border-white/[0.14] hover:bg-[rgb(var(--k-item-hover))] focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
          >
            <Coin id="usdt" size={24} />
            <AnimatedNumber value={balance} format={(n) => formatAmount(n)} className="text-16 font-bold text-ink" />
            <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">{ACCOUNT.currency}</span>
          </Link>
          <DepositLink />
          <Link
            to="/account"
            aria-label="Settings"
            className="ml-2 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-white/[0.07] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] outline-none transition-colors hover:bg-[rgb(var(--k-item-hover))] hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
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

// The money and help links on the right of the nav row stay quiet, an edge and no fill until hover.
const linkBox =
  'flex h-[52px] items-center gap-2 rounded-[14px] border border-white/[0.07] px-4 text-14 font-semibold text-[rgb(var(--k-muted))] outline-none transition-colors hover:border-white/[0.14] hover:bg-[rgb(var(--k-item))] hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF] [&>svg]:h-5 [&>svg]:w-5';

// The primary nav row. The rooms sit in one sunken segmented control, NewBettie's Casino and Sport
// switch, and each one filters the floor below. The picked room takes the purple selection tint and
// its own edge, the way the finder chips do.
export function NavRow({ cat, onPick, onHome }: { cat: CategoryFilter; onPick: (c: CategoryFilter) => void; onHome: () => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  return (
    <nav aria-label="Primary" className={cn(WRAP, 'flex items-center gap-4 py-4')}>
      <div className="k-well flex h-[52px] items-center gap-1 rounded-[14px] p-[3px]">
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
                'flex h-11 items-center gap-2 rounded-[12px] border px-4 text-14 font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#B47CFF] [&>svg]:h-[18px] [&>svg]:w-[18px]',
                on ? 'border-[#B47CFF]/60 bg-[#8D3BF0]/25 text-ink [&>svg]:text-[#C9A2FF]' : 'border-transparent text-[rgb(var(--k-muted))] hover:bg-white/[0.05] hover:text-ink',
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

/** The one orange action in the top bar, which counts as its own section. */
export function DepositLink() {
  const navigate = useNavigate();
  return (
    <KitButton tone="primary" size="lg" onClick={() => navigate('/wallet/deposit')} className="h-[52px] px-[20px]">
      <Plus weight="bold" className="h-5 w-5" aria-hidden />
      Deposit
    </KitButton>
  );
}
