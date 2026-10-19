import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as M from '@radix-ui/react-dropdown-menu';
import * as P from '@radix-ui/react-popover';
import { ArrowCircleDown, ArrowCircleUp, Bell, CaretDown, Check, Gear, MagnifyingGlass, Plus, SignOut, UserPlus, Wallet, X } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { useWallet } from '../../wallet/store';
import { ACCOUNT, coinById, type CoinId } from '../../../data/wallet';
import { CATEGORIES } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { AnimatedNumber, Coin } from '../kit/parts';
import { ONLINE_NOW, ROOMS } from '../shared/data';
import type { CategoryFilter } from './data';
import { ROOM_ICON, WRAP } from './icons';
import { Face, IconBox, Key, ValueChip } from './ui';

// The top bar and the nav row, after CS2's two bars. The darkest strip holds the logo, the search,
// the balance with its menu, the one orange Deposit with a quiet Withdraw beside it, settings, the
// bell and the account. Every control is 48 tall on a radius of 4.

const MENU = 'v4-cut z-30 bg-[rgb(var(--v4-panel))] p-2 shadow-[0_24px_48px_rgb(0_0_0/0.5)]';
const ITEM = 'flex h-11 cursor-pointer select-none items-center gap-3 rounded-[3px] px-3 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-white/[0.06] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[rgb(var(--v4-muted))]';

export function TopBar({ query, onQuery, onSubmit, onHome }: { query: string; onQuery: (q: string) => void; onSubmit: () => void; onHome: () => void }) {
  const navigate = useNavigate();
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
    <header className="sticky top-0 z-20 h-[72px] border-b border-white/[0.06] bg-[rgb(var(--v4-top))]">
      <div className={cn(WRAP, 'flex h-full items-center gap-6')}>
        <Link
          to="/variants/4"
          onClick={(e) => {
            e.preventDefault();
            onHome();
          }}
          aria-label="Lusty Lagoon, back to the top"
          className="shrink-0 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0E0D14]"
        >
          <Logo className="text-[20px] leading-[22px]" />
        </Link>

        <form
          role="search"
          onSubmit={submit}
          className="v4-well flex h-[48px] w-full min-w-0 max-w-[520px] items-center gap-3 rounded-[4px] border border-white/[0.07] pl-4 pr-2 transition-[border-color,box-shadow] duration-200 hover:border-white/[0.12] focus-within:border-[#B47CFF]/70 focus-within:ring-2 focus-within:ring-[#B47CFF]/40"
        >
          <MagnifyingGlass weight="bold" className="h-5 w-5 shrink-0 text-[rgb(var(--v4-label))]" aria-hidden />
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
            placeholder="Search games or providers"
            className="peer h-full min-w-0 flex-1 bg-transparent text-14 font-semibold text-ink outline-none placeholder:font-medium placeholder:text-[rgb(var(--v4-label))]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                onQuery('');
                input.current?.focus();
              }}
              aria-label="Clear the search"
              className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-white/[0.08] text-ink outline-none transition-colors hover:bg-white/[0.14] focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
            >
              <X weight="bold" className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <kbd aria-hidden className="flex h-8 w-8 items-center justify-center rounded-[3px] border border-white/[0.1] font-sans text-12 font-bold text-[rgb(var(--v4-label))] peer-focus:hidden">
              /
            </kbd>
          )}
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <BalanceMenu />
          <span aria-hidden className="mx-1 h-8 w-[1px] bg-white/[0.08]" />
          <Key tone="orange" onClick={() => navigate('/wallet/deposit')} className="px-[30px]">
            <Plus weight="bold" className="relative h-5 w-5" aria-hidden />
            <span className="relative">Deposit</span>
          </Key>
          <Link
            to="/wallet/withdraw"
            className="flex h-[48px] items-center rounded-[4px] px-3 text-16 font-semibold text-[rgb(var(--v4-muted))] outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
          >
            Withdraw
          </Link>
          <span aria-hidden className="mx-1 h-8 w-[1px] bg-white/[0.08]" />
          <IconBox aria-label="Settings" onClick={() => navigate('/account')}>
            <Gear weight="fill" className="h-[22px] w-[22px]" aria-hidden />
          </IconBox>
          <BellBox />
          <AccountBox />
        </div>
      </div>
    </header>
  );
}

const BALANCE_COINS: CoinId[] = ['usdt', 'btc', 'eth', 'usdc', 'ltc'];

function coinAmount(usd: number, id: CoinId) {
  const c = coinById(id);
  return formatAmount(usd / c.rate, c.rate >= 1000 ? 6 : c.rate >= 50 ? 4 : 2);
}

/**
 * The balance box, a real menu, the kit's BalancePill in the floor's shape. It picks the coin the
 * balance shows in and leads to Deposit, Withdraw and the wallet. The pick holds for the tab.
 */
function BalanceMenu() {
  const navigate = useNavigate();
  const { balance } = useWallet();
  const [coin, setCoin] = useState<CoinId>(() => {
    try {
      return (sessionStorage.getItem('kit-balance-coin') as CoinId) || 'usdt';
    } catch {
      return 'usdt';
    }
  });
  const pick = (id: CoinId) => {
    setCoin(id);
    try {
      sessionStorage.setItem('kit-balance-coin', id);
    } catch {
      /* the pick just does not persist */
    }
  };
  const showing = coin === 'usdt' ? null : coinById(coin);
  return (
    <M.Root>
      <M.Trigger
        aria-label={`Balance ${showing ? coinAmount(balance, coin) : formatAmount(balance)} ${showing ? showing.symbol : ACCOUNT.currency}, change the coin shown`}
        className="v4-well group flex h-[48px] items-center gap-3 rounded-[4px] border border-white/[0.07] pl-3 pr-3 outline-none transition-colors hover:border-white/[0.14] focus-visible:ring-2 focus-visible:ring-[#B47CFF] data-[state=open]:border-white/[0.14]"
      >
        <Coin id={showing ? coin : 'usdt'} size={24} />
        <span className="flex flex-col items-start whitespace-nowrap">
          <span className="text-12 font-bold uppercase leading-4 tracking-[0.08em] text-[rgb(var(--v4-label))]">Balance</span>
          {showing ? (
            <span className="num text-16 font-bold leading-5 text-ink">
              {coinAmount(balance, coin)} <span className="text-14 font-semibold text-[rgb(var(--v4-muted))]">{showing.symbol}</span>
            </span>
          ) : (
            <span className="text-16 font-bold leading-5 text-ink">
              <AnimatedNumber value={balance} format={(n) => formatAmount(n)} /> <span className="text-14 font-semibold text-[rgb(var(--v4-muted))]">{ACCOUNT.currency}</span>
            </span>
          )}
        </span>
        <CaretDown weight="bold" className="ml-1 h-4 w-4 text-[rgb(var(--v4-muted))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
      </M.Trigger>
      <M.Portal>
        <M.Content align="end" sideOffset={8} className={cn(MENU, 'w-[300px]')}>
          <M.Label className="px-3 pb-2 pt-2 text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--v4-label))]">Show balance in</M.Label>
          <M.RadioGroup value={coin} onValueChange={(v) => pick(v as CoinId)}>
            {BALANCE_COINS.map((id) => (
              <M.RadioItem key={id} value={id} className={ITEM}>
                <Coin id={id} size={20} />
                <span className="flex-1">{coinById(id).symbol}</span>
                <span className="num text-[rgb(var(--v4-muted))]">{coinAmount(balance, id)}</span>
                <span className="flex w-4 justify-center">
                  <M.ItemIndicator>
                    <Check weight="bold" className="h-4 w-4 text-[#C9A2FF]" aria-hidden />
                  </M.ItemIndicator>
                </span>
              </M.RadioItem>
            ))}
          </M.RadioGroup>
          <M.Separator className="mx-2 my-2 h-[1px] bg-white/[0.07]" />
          {[
            { label: 'Deposit', icon: <ArrowCircleDown weight="bold" aria-hidden />, to: '/wallet/deposit' },
            { label: 'Withdraw', icon: <ArrowCircleUp weight="bold" aria-hidden />, to: '/wallet/withdraw' },
            { label: 'Open wallet', icon: <Wallet weight="bold" aria-hidden />, to: '/wallet/deposit' },
          ].map((it) => (
            <M.Item key={it.label} onSelect={() => navigate(it.to)} className={ITEM}>
              {it.icon}
              {it.label}
            </M.Item>
          ))}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

/** The bell, the account's notifications panel in a popover. */
function BellBox() {
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger asChild>
        <IconBox aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
          <Bell weight="fill" className="h-[22px] w-[22px]" aria-hidden />
          {unread > 0 && (
            <span aria-hidden className="num absolute -right-[6px] -top-[6px] flex h-5 min-w-[20px] items-center justify-center rounded-[3px] bg-[#F4D543] px-1 text-12 font-bold leading-none text-[#1A0F2B]">
              {unread}
            </span>
          )}
        </IconBox>
      </P.Trigger>
      <P.Portal>
        <P.Content align="end" sideOffset={8} className={cn(MENU, 'p-0 outline-none')}>
          <NotificationsPanel
            onNavigate={(to) => {
              setOpen(false);
              navigate(to);
            }}
          />
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

/** The account box, avatar with the rank level, name and a menu. */
function AccountBox() {
  const navigate = useNavigate();
  return (
    <M.Root>
      <M.Trigger
        aria-label={`Account menu, ${ACCOUNT.name}`}
        className="v4-toplight group flex h-[48px] items-center gap-3 rounded-[4px] border border-white/[0.07] bg-[rgb(var(--v4-raised))] pl-1 pr-3 outline-none transition-colors hover:border-white/[0.14] focus-visible:ring-2 focus-visible:ring-[#B47CFF] data-[state=open]:border-white/[0.14]"
      >
        <span className="relative">
          <img src="/art/avatars/john.webp" alt="" className="h-10 w-10 rounded-[3px] object-cover" />
          <span aria-hidden className="num absolute -bottom-1 -left-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-[3px] border-2 border-[rgb(var(--v4-raised))] bg-[#B47CFF] px-[3px] text-12 font-bold leading-none text-[#1A0F2B]">
            6
          </span>
        </span>
        <span className="flex flex-col items-start whitespace-nowrap">
          <span className="text-14 font-bold leading-5 text-ink">{ACCOUNT.name}</span>
          <span className="text-12 font-bold uppercase leading-4 tracking-[0.08em] text-[#E0A872]">{ACCOUNT.rank.name}</span>
        </span>
        <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--v4-muted))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
      </M.Trigger>
      <M.Portal>
        <M.Content align="end" sideOffset={8} className={cn(MENU, 'w-[240px]')}>
          {[
            { label: 'Account settings', icon: <Gear weight="bold" aria-hidden />, to: '/account' },
            { label: 'Wallet', icon: <Wallet weight="bold" aria-hidden />, to: '/wallet/deposit' },
            { label: 'Refer a friend', icon: <UserPlus weight="bold" aria-hidden />, to: '/refer' },
          ].map((it) => (
            <M.Item key={it.label} onSelect={() => navigate(it.to)} className={ITEM}>
              {it.icon}
              {it.label}
            </M.Item>
          ))}
          <M.Separator className="mx-2 my-2 h-[1px] bg-white/[0.07]" />
          <M.Item onSelect={() => navigate('/login')} className={ITEM}>
            <SignOut weight="bold" aria-hidden />
            Log out
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

// The quiet links on the right of the nav row, CS2's utility links. Grey text and an icon, white on hover.
const quiet =
  'flex h-10 items-center gap-2 whitespace-nowrap rounded-[4px] px-3 text-14 font-semibold text-[rgb(var(--v4-muted))] outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF] [&>svg]:h-[18px] [&>svg]:w-[18px]';

/**
 * The nav row. The rooms as parallelogram tabs, each with its live players in a slate chip like
 * CS2's Jackpot and Coinflip values. The picked room takes the purple face and a 2px bar under it.
 */
export function NavRow({ cat, onPick, onHome }: { cat: CategoryFilter; onPick: (c: CategoryFilter) => void; onHome: () => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  const players = (c: CategoryFilter) => (c === 'all' ? ONLINE_NOW : ROOMS.find((r) => r.id === c)?.players ?? 0);
  return (
    <div className="border-b border-white/[0.06] bg-[rgb(var(--v4-nav))]">
      <nav aria-label="Primary" className={cn(WRAP, 'flex h-[56px] items-center gap-2')}>
        <ul className="-ml-1 flex items-center gap-1">
          {CATEGORIES.map((c) => {
            const on = cat === c.value;
            return (
              <li key={c.value}>
                <a
                  href={c.value === 'all' ? '#top' : '#find'}
                  aria-current={on ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    if (c.value === 'all') onHome();
                    else onPick(c.value);
                  }}
                  className={cn(
                    'v4-focus group relative flex h-10 items-center gap-2 whitespace-nowrap px-4 text-14 font-semibold transition-colors duration-150',
                    on ? 'text-ink' : 'text-[rgb(var(--v4-muted))] hover:text-ink',
                  )}
                >
                  <Face on={on} />
                  {on && <span aria-hidden className="absolute -bottom-2 left-2 right-2 h-[2px] skew-x-[-14deg] bg-[#B47CFF]" />}
                  <span aria-hidden className={cn('relative flex h-[18px] w-[18px] items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]', on ? 'text-[#C9A2FF]' : '')}>
                    {ROOM_ICON[c.value]}
                  </span>
                  <span className="relative">{c.value === 'all' ? 'Lobby' : c.label}</span>
                  <ValueChip on={on}>
                    {players(c.value).toLocaleString('en-US')}
                    <span className="sr-only"> playing</span>
                  </ValueChip>
                </a>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto flex items-center gap-1">
          <Link to="/wallet/deposit" className={quiet}>
            Wallet
            {pending > 0 && (
              <span className="num flex h-5 min-w-[20px] items-center justify-center rounded-[3px] bg-[#F4D543] px-1 text-12 font-bold leading-none text-[#1A0F2B]">
                {pending}
                <span className="sr-only"> pending</span>
              </span>
            )}
          </Link>
          <Link to="/agent" className={quiet}>
            Send to agent
          </Link>
          <Link to="/refer" className={quiet}>
            Refer a friend
          </Link>
          <Link to="/faq" className={quiet}>
            FAQ
          </Link>
        </div>
      </nav>
    </div>
  );
}
