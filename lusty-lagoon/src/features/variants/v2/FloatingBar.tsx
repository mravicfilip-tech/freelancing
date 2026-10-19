import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gear, SignOut, UserPlus, Wallet } from '@phosphor-icons/react';
import usdt from 'cryptocurrency-icons/svg/color/usdt.svg';
import { Button } from '../../../components/ui/Button';
import { Logo } from '../../../components/ui/Logo';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../../components/ui/Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/Popover';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { ACCOUNT } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { useWallet } from '../../wallet/store';

// The top bar floats over the stage. It has no surface at the top of the page, and takes the topbar
// tone once the page scrolls so it never sits unreadable on the grid.
export function FloatingBar({ query, onQuery, onSearch }: { query: string; onQuery: (q: string) => void; onSearch: () => void }) {
  const { balance } = useWallet();
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [bellOpen, setBellOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <header
      className={cn(
        'fixed left-[80px] right-0 top-0 z-30 h-[80px] border-b transition-colors duration-200',
        scrolled ? 'border-topbar-line bg-topbar' : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-4 px-12">
        <Link to="/lobby" aria-label="Lusty Lagoon, go to the lobby" className="mr-4 shrink-0 rounded-lg">
          <Logo />
        </Link>
        <form role="search" onSubmit={submit} className="flex h-11 w-full max-w-[400px] items-center gap-3 rounded-xl border border-field/50 bg-page/70 pl-4 pr-3 backdrop-blur-md focus-within:border-accent">
          <img src="/art/shell/search.svg" alt="" width={20} height={20} />
          <label htmlFor="v2-search" className="sr-only">
            Search for games or providers
          </label>
          <input
            id="v2-search"
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
            className="flex h-11 items-center gap-3 rounded-xl border border-field/50 bg-page/70 pl-2 pr-4 backdrop-blur-md hover:border-accent"
          >
            <img src={usdt} alt="" width={28} height={28} />
            <span className="num font-display text-18 font-bold leading-none text-ink">
              {formatAmount(balance, Number.isInteger(balance) ? 0 : 2)} <span className="text-14 font-semibold text-ink2">{ACCOUNT.currency}</span>
            </span>
          </Link>
          <Button size="lg" variant="secondary" onClick={() => navigate('/wallet/deposit')}>
            Deposit
          </Button>
          <Popover open={bellOpen} onOpenChange={setBellOpen}>
            <PopoverTrigger
              aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-field/50 bg-page/70 backdrop-blur-md hover:border-accent data-[state=open]:border-accent"
            >
              <img src="/art/shell/bell.svg" alt="" width={24} height={24} />
              {unread > 0 && <span aria-hidden className="absolute right-[10px] top-[10px] h-[8px] w-[8px] rounded-full bg-[#F33EF3]" />}
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
            <MenuTrigger className="flex h-11 items-center gap-3 rounded-full border border-field/50 bg-page/70 pr-3 backdrop-blur-md hover:border-accent data-[state=open]:[&>img:last-child]:rotate-180" aria-label={`Account menu, ${ACCOUNT.name}`}>
              <img src="/art/avatars/john.webp" alt="" width={44} height={44} className="h-11 w-11 rounded-full border border-ink/30 object-cover" />
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
