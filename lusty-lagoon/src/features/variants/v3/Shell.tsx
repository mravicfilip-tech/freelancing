import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Gear, SignOut, UserPlus, Wallet } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { Button } from '../../../components/ui/Button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../../components/ui/Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/Popover';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { ACCOUNT, coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { useWallet } from '../../wallet/store';
import { cn } from '../../../lib/cn';

// The rank road shell. A 248 wide nav on a flat surface and a 72 tall top bar. The rank card of the
// lobby sidebar is gone, the road on the page is the rank.

const GROUPS = [
  { label: 'Play', items: [{ to: '/variants/3', label: 'Lobby', icon: 'nav-lobby' }] },
  {
    label: 'Money',
    items: [
      { to: '/wallet/deposit', label: 'Wallet', icon: 'nav-wallet' },
      { to: '/agent', label: 'Send to agent', icon: 'nav-agent' },
      { to: '/refer', label: 'Refer a friend', icon: 'nav-refer' },
    ],
  },
  { label: 'Help', items: [{ to: '/faq', label: 'FAQ', icon: 'nav-faq' }] },
];

export function Nav() {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  return (
    <div className="sticky top-0 flex h-screen flex-col overflow-y-auto px-3 pb-6 [scrollbar-width:thin]">
      <Link to="/variants/3" aria-label="Lusty Lagoon, home" className="ml-4 mt-6 flex w-fit rounded-lg">
        <Logo />
      </Link>
      <nav aria-label="Main" className="mt-12 flex flex-col gap-6">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="px-4 pb-2 text-14 font-medium text-ink3">{g.label}</p>
            <ul className="flex flex-col gap-1">
              {g.items.map(({ to, label, icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) =>
                      cn(
                        'flex h-[48px] items-center gap-3 rounded-lg border pr-3 text-14 font-semibold transition-colors duration-150',
                        isActive ? 'border-menu-active-line bg-menu-active text-ink' : 'border-transparent text-label hover:bg-menu-active/60 hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={cn('flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-lg', isActive ? 'bg-menu-active-well' : 'bg-menu-well')}>
                          <img src={`/art/shell/${icon}.svg`} alt="" className="h-5 w-5 object-contain" />
                        </span>
                        <span className="flex-1 truncate">{label}</span>
                        {to.startsWith('/wallet') && pending > 0 && (
                          <span className="num flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-12 font-bold text-on-gold">
                            {pending}
                            <span className="sr-only"> pending</span>
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <p className="mt-auto pl-4 text-12 text-ink3">All rights reserved, Lusty Lagoon</p>
    </div>
  );
}

export function TopBar({ query, onQuery, onSearch }: { query: string; onQuery: (q: string) => void; onSearch: () => void }) {
  const { balance } = useWallet();
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [bellOpen, setBellOpen] = useState(false);
  const usdt = coinById('usdt');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };
  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center gap-3 border-b border-topbar-line bg-topbar px-8">
      <form role="search" onSubmit={submit} className="flex h-10 w-[360px] items-center gap-3 rounded-lg border border-card-line/20 bg-page/40 px-4 focus-within:border-accent">
        <img src="/art/shell/search.svg" alt="" width={20} height={20} />
        <label htmlFor="v3-search" className="sr-only">
          Search for games or providers
        </label>
        <input
          id="v3-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search for games or providers"
          className="h-full min-w-0 flex-1 bg-transparent text-14 text-ink outline-none placeholder:text-ink2"
        />
      </form>

      <div className="ml-auto flex items-center gap-3">
        <Link
          to="/wallet/deposit"
          aria-label={`Account balance ${formatAmount(balance)} ${ACCOUNT.currency}, open the wallet`}
          className="flex h-10 items-center gap-2 rounded-lg border border-card-line/20 bg-page/40 pl-2 pr-4 hover:border-card-line/50"
        >
          <img src={usdt.icon} alt="" width={24} height={24} />
          <span className="num font-display text-16 font-bold text-ink" aria-live="polite">
            {formatAmount(balance, Number.isInteger(balance) ? 0 : 2)} {ACCOUNT.currency}
          </span>
        </Link>
        <Button asChild size="md">
          <Link to="/wallet/deposit">Deposit</Link>
        </Button>
        <Popover open={bellOpen} onOpenChange={setBellOpen}>
          <PopoverTrigger
            aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            className="relative ml-2 flex h-10 w-10 items-center justify-center rounded-lg border border-topbar-line bg-page/40 hover:border-accent/60 data-[state=open]:border-accent"
          >
            <img src="/art/shell/bell.svg" alt="" width={22} height={22} />
            {unread > 0 && <span aria-hidden className="absolute right-[9px] top-[9px] h-2 w-2 rounded-full bg-[#F33EF3]" />}
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
          <MenuTrigger className="flex items-center gap-3 rounded-full pr-2" aria-label={`Account menu, ${ACCOUNT.name}`}>
            <img src="/art/avatars/john.webp" alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
            <span className="text-14 font-semibold text-ink">{ACCOUNT.name}</span>
            <img src="/art/shell/nav-caret.svg" alt="" width={20} height={20} />
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
