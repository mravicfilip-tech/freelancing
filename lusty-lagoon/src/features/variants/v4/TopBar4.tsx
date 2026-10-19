import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gear, SignOut, UserPlus, Wallet, X } from '@phosphor-icons/react';
import usdt from 'cryptocurrency-icons/svg/color/usdt.svg';
import { Button } from '../../../components/ui/Button';
import { Logo } from '../../../components/ui/Logo';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../../components/ui/Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/Popover';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { useWallet } from '../../wallet/store';
import { ACCOUNT } from '../../../data/wallet';
import { CATEGORIES } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { countIn, type CategoryFilter } from './data';

export const WRAP = 'mx-auto w-full max-w-[1920px] px-8';

// Full width top bar. The logo, one wide search that filters the grid as you type, the balance with
// Deposit beside it, the bell and the account menu. Press / anywhere to jump into the search.
export function TopBar({ query, onQuery, onSubmit, onHome }: { query: string; onQuery: (q: string) => void; onSubmit: () => void; onHome: () => void }) {
  const { balance } = useWallet();
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [bellOpen, setBellOpen] = useState(false);
  const [focused, setFocused] = useState(false);
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
    <header className="sticky top-0 z-10 border-b border-topbar-line bg-topbar">
      <div className={cn(WRAP, 'flex h-[72px] items-center gap-8')}>
        <Link to="/variants/4" onClick={(e) => { e.preventDefault(); onHome(); }} aria-label="Lusty Lagoon, back to the top" className="shrink-0 rounded">
          <Logo />
        </Link>

        <form role="search" onSubmit={submit} className="relative flex h-11 w-full max-w-[640px] items-center rounded-lg border border-field bg-sunken focus-within:border-accent">
          <img src="/art/shell/search.svg" alt="" width={24} height={24} className="ml-4 shrink-0" />
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
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onQuery('');
                input.current?.blur();
              }
            }}
            placeholder="Search for games or providers"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-16 text-ink outline-none placeholder:text-ink3"
          />
          {query ? (
            <button type="button" onClick={() => { onQuery(''); input.current?.focus(); }} aria-label="Clear the search" className="mr-2 flex h-8 w-8 items-center justify-center rounded-md text-ink2 hover:bg-raised hover:text-ink">
              <X className="h-5 w-5" aria-hidden />
            </button>
          ) : (
            !focused && (
              <kbd aria-hidden className="mr-3 flex h-6 w-6 items-center justify-center rounded border border-line bg-panel font-sans text-14 text-ink2">
                /
              </kbd>
            )
          )}
        </form>

        <div className="ml-auto flex items-center gap-3">
          <Link
            to="/wallet/deposit"
            aria-label={`Balance ${formatAmount(balance)} ${ACCOUNT.currency}, open the wallet`}
            className="flex h-11 items-center gap-3 rounded-lg border border-line bg-panel pl-3 pr-4 hover:border-field"
          >
            <img src={usdt} alt="" width={24} height={24} />
            <span aria-live="polite" className="num font-display text-18 font-bold leading-none text-ink">
              {formatAmount(balance)}
            </span>
            <span className="text-14 text-ink2">{ACCOUNT.currency}</span>
          </Link>
          <Button asChild size="lg">
            <Link to="/wallet/deposit">Deposit</Link>
          </Button>

          <Popover open={bellOpen} onOpenChange={setBellOpen}>
            <PopoverTrigger
              aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-panel hover:border-field data-[state=open]:border-accent"
            >
              <img src="/art/shell/bell.svg" alt="" width={24} height={24} />
              {unread > 0 && <span aria-hidden className="absolute right-[10px] top-[10px] h-[8px] w-[8px] rounded-full bg-danger" />}
            </PopoverTrigger>
            <PopoverContent>
              <NotificationsPanel
                onNavigate={(to) => {
                  setBellOpen(false);
                  navigate(to);
                }}
              />
            </PopoverContent>
          </Popover>

          <Menu>
            <MenuTrigger aria-label={`Account menu, ${ACCOUNT.name}`} className="flex h-11 items-center gap-3 rounded-full pr-2 data-[state=open]:[&>img:last-child]:rotate-180">
              <img src="/art/avatars/john.webp" alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
              <span className="text-14 font-semibold text-ink">{ACCOUNT.name}</span>
              <img src="/art/shell/nav-caret.svg" alt="" width={20} height={20} className="transition-transform" />
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={() => navigate('/account')}>
                <Gear className="h-5 w-5 text-ink2" aria-hidden />
                Account settings
              </MenuItem>
              <MenuItem onSelect={() => navigate('/wallet/deposit')}>
                <Wallet className="h-5 w-5 text-ink2" aria-hidden />
                Wallet
              </MenuItem>
              <MenuItem onSelect={() => navigate('/refer')}>
                <UserPlus className="h-5 w-5 text-ink2" aria-hidden />
                Refer a friend
              </MenuItem>
              <MenuSeparator />
              <MenuItem onSelect={() => navigate('/login')}>
                <SignOut className="h-5 w-5 text-ink2" aria-hidden />
                Log out
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>
    </header>
  );
}

const itemClass = 'relative flex h-[48px] items-center rounded px-4 text-16 font-medium text-ink2 transition-colors hover:text-ink';
const bar = <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-accent" />;

// The primary nav row. Lobby and the room names filter the floor below, the right group leaves for
// the wallet, referrals and help. The room in play carries the bar.
export function NavRow({ cat, onPick, onHome }: { cat: CategoryFilter; onPick: (c: CategoryFilter) => void; onHome: () => void }) {
  const rooms = CATEGORIES.filter((c) => c.value !== 'all');
  return (
    <nav aria-label="Primary" className="border-b border-line bg-sunken">
      <div className={cn(WRAP, 'flex items-center')}>
        <Link
          to="/variants/4"
          aria-current={cat === 'all' ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          className={cn(itemClass, cat === 'all' && 'text-ink')}
        >
          Lobby
          {cat === 'all' && bar}
        </Link>
        {rooms.map((r) => {
          const on = cat === r.value;
          return (
            <a
              key={r.value}
              href="#find"
              aria-current={on ? 'true' : undefined}
              title={`${countIn(r.value as never)} games`}
              onClick={(e) => {
                e.preventDefault();
                onPick(r.value);
              }}
              className={cn(itemClass, on && 'text-ink')}
            >
              {r.label}
              {on && bar}
            </a>
          );
        })}
        <div className="ml-auto flex items-center">
          <Link to="/wallet/deposit" className={itemClass}>
            Wallet
          </Link>
          <Link to="/agent" className={itemClass}>
            Send to agent
          </Link>
          <Link to="/refer" className={itemClass}>
            Refer a friend
          </Link>
          <Link to="/faq" className={itemClass}>
            FAQ
          </Link>
        </div>
      </div>
    </nav>
  );
}
