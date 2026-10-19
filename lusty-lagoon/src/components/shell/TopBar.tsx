import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Gear, SignOut, UserPlus, Wallet } from '@phosphor-icons/react';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../ui/Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { NotificationsPanel, useUnreadCount } from '../../features/account';
import usdt from 'cryptocurrency-icons/svg/color/usdt.svg';
import { ACCOUNT } from '../../data/wallet';
import { formatAmount } from '../../lib/format';
import { useWallet } from '../../features/wallet/store';

// The Figma top bar, 86 tall. Search 316 by 58, balance 224 by 58, bell 48, avatar 48. The glow
// on the labels and the radial fills behind the coin and the bell are dropped (notes 1 and 2).
// Search sends the query to the lobby's game grid.
export function TopBar() {
  const { balance } = useWallet();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const unread = useUnreadCount();
  const [bellOpen, setBellOpen] = useState(false);
  const [query, setQuery] = useState(params.get('q') ?? '');

  const search = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/lobby?q=${encodeURIComponent(q)}#explore` : '/lobby#explore');
  };

  return (
    <header className="sticky top-0 z-10 flex h-[var(--ll-topbar-h)] shrink-0 items-center border-b border-topbar-line bg-topbar pl-[34px] pr-[27px]">
      <form role="search" onSubmit={search} className="flex h-[58px] w-[316px] items-center gap-4 rounded-lg border border-card-line/20 bg-[rgb(var(--ll-card-top)/0.5)] pl-6 pr-4 focus-within:border-accent">
        <img src="/art/shell/search.svg" alt="" width={24} height={24} />
        <label htmlFor="search" className="sr-only">
          Search for games or providers
        </label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for games or providers"
          className="h-full min-w-0 flex-1 bg-transparent text-14 text-ink outline-none placeholder:text-12 placeholder:uppercase placeholder:tracking-[0.05em] placeholder:text-ink2"
        />
      </form>

      <Link
        to="/wallet/deposit"
        aria-label={`Account balance ${formatAmount(balance)} ${ACCOUNT.currency}, open the wallet`}
        className="ll-card ml-[15px] flex h-[58px] w-[224px] items-center gap-[18px] hover:border-card-line/40"
      >
        <span className="-m-px flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-lg border border-[#9F58DE]/25 bg-[#2A1E3C]">
          <img src={usdt} alt="" width={30} height={30} />
        </span>
        <span className="flex flex-col" aria-live="polite">
          <span className="num text-18 font-black uppercase leading-[22px] tracking-[-0.02em] text-ink">
            {formatAmount(balance, Number.isInteger(balance) ? 0 : 2)} {ACCOUNT.currency}
          </span>
          <span className="text-14 leading-5 tracking-[-0.02em] text-ink2">Account Balance</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center">
        <Popover open={bellOpen} onOpenChange={setBellOpen}>
          <PopoverTrigger
            aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            className="relative flex h-[48px] w-12 items-center justify-center rounded-lg border-2 border-[#433460]/70 bg-black hover:border-accent/60 data-[state=open]:border-accent"
          >
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-md bg-[#2E1D49]">
              <span className="relative h-6 w-6">
                <img src="/art/shell/bell.svg" alt="" width={24} height={24} />
                {unread > 0 && <span aria-hidden className="absolute left-[12.5px] top-[2.5px] h-[5.5px] w-[5.5px] rounded-full bg-[#F33EF3]" />}
              </span>
            </span>
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
          <MenuTrigger className="ml-[20px] flex items-center gap-[15px] rounded-full pr-1 data-[state=open]:[&>img:last-child]:rotate-180" aria-label={`Account menu, ${ACCOUNT.name}`}>
            <img src="/art/avatars/john.webp" alt="" width={48} height={48} className="h-[48px] w-12 rounded-full object-cover" />
            <span className="text-14 font-bold uppercase text-ink">{ACCOUNT.name}</span>
            <img src="/art/shell/nav-caret.svg" alt="" width={20} height={20} className="ml-[13px] transition-transform" />
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
