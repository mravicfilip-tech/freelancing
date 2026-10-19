import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CaretDown, Gear, MagnifyingGlass, SignOut, UserPlus, Wallet, X } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../../components/ui/Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/Popover';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { ACCOUNT } from '../../../data/wallet';
import { shortPoints } from '../../../data/ranks';
import { cn } from '../../../lib/cn';
import { ONLINE_NOW } from '../shared/data';

// Text only navigation. No icons, no promo tiles, the rank as one line and one flat bar.

const PLAY = [{ to: '/lobby', label: 'Lobby' }];
const MONEY = [
  { to: '/wallet/deposit', label: 'Wallet' },
  { to: '/agent', label: 'Send to agent' },
  { to: '/refer', label: 'Refer a friend' },
];
const MORE = [
  { to: '/faq', label: 'FAQ' },
  { to: '/account', label: 'Account' },
  { to: '/notifications', label: 'Notifications' },
];

function NavGroup({ label, items, current }: { label: string; items: { to: string; label: string }[]; current?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-12 text-ink3">{label}</p>
      <ul className="flex flex-col gap-0.5">
        {items.map((it) => {
          const isHere = current === it.to;
          return (
            <li key={it.to}>
              <NavLink
                to={it.to}
                aria-current={isHere ? 'page' : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex h-10 items-center rounded-lg border px-3 text-16 transition-colors duration-150',
                    isActive || isHere ? 'border-menu-active-line bg-menu-active font-medium text-ink' : 'border-transparent text-ink2 hover:bg-raised hover:text-ink',
                  )
                }
              >
                {it.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Nav() {
  const { rank } = ACCOUNT;
  const pct = (rank.points / rank.nextAt) * 100;
  const left = rank.nextAt - rank.points;
  return (
    <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col border-r border-side-line bg-sunken px-4 pb-6 pt-6">
      <Link to="/lobby" aria-label="Lusty Lagoon, go to the lobby" className="ml-3 flex w-fit rounded-lg">
        <Logo />
      </Link>
      <nav aria-label="Main" className="mt-12 flex flex-col gap-6">
        <NavGroup label="Play" items={PLAY} current="/lobby" />
        <NavGroup label="Money" items={MONEY} />
        <NavGroup label="Help and account" items={MORE} />
      </nav>
      <section aria-labelledby="v5-rank" className="mt-auto border-t border-line px-3 pt-4">
        <h2 id="v5-rank" className="font-display text-16 font-semibold text-ink">
          {rank.name} rank
        </h2>
        <p className="num mt-0.5 text-14 text-ink2">
          {shortPoints(rank.points)} of {shortPoints(rank.nextAt)}
        </p>
        <div
          role="progressbar"
          aria-label={`${Math.floor(pct)}% of the way to ${rank.next}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(pct)}
          className="mt-3 h-[6px] overflow-hidden rounded-full bg-rank-track"
        >
          <div className="h-full rounded-full bg-rank-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-14 text-ink2">
          <span className="num">{shortPoints(left)}</span> points to {rank.next}
        </p>
      </section>
    </aside>
  );
}

export function TopBar({ query, setQuery, onSearch }: { query: string; setQuery: (q: string) => void; onSearch: () => void }) {
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [bellOpen, setBellOpen] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center gap-6 border-b border-line bg-page px-8">
      <form role="search" onSubmit={submit} className="flex h-10 w-[420px] items-center gap-3 rounded-lg border border-field/60 bg-sunken pl-3 pr-1 focus-within:border-accent">
        <MagnifyingGlass className="h-5 w-5 shrink-0 text-ink2" aria-hidden />
        <label htmlFor="v5-search" className="sr-only">
          Search for games or providers
        </label>
        <input
          id="v5-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for games or providers"
          className="h-full min-w-0 flex-1 bg-transparent text-14 text-ink outline-none placeholder:text-ink2 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button type="button" aria-label="Clear the search" onClick={() => setQuery('')} className="flex h-8 w-8 items-center justify-center rounded text-ink2 hover:bg-raised hover:text-ink">
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </form>

      <p className="num ml-auto text-14 text-ink2">
        <span className="text-ink">{ONLINE_NOW.toLocaleString('en-US')}</span> players online
      </p>

      <div className="flex items-center gap-4">
        <Popover open={bellOpen} onOpenChange={setBellOpen}>
          <PopoverTrigger
            aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink2 hover:border-field hover:text-ink data-[state=open]:border-accent"
          >
            <img src="/art/shell/bell.svg" alt="" width={24} height={24} />
            {unread > 0 && <span aria-hidden className="absolute right-[9px] top-[9px] h-2 w-2 rounded-full bg-accent" />}
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
          <MenuTrigger className="group flex items-center gap-3 rounded-full pr-1" aria-label={`Account menu, ${ACCOUNT.name}`}>
            <img src="/art/avatars/john.webp" alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
            <span className="text-14 font-medium text-ink">{ACCOUNT.name}</span>
            <CaretDown className="h-4 w-4 text-ink2 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
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
    </header>
  );
}
