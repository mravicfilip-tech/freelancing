import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gear, MagnifyingGlass, SignOut, UserPlus, Wallet } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../../components/ui/Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/Popover';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { useWallet } from '../../wallet/store';
import { ACCOUNT, coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';

// Top bar of the content column, 72 tall. Search filters the games on this page. The balance goes to
// the wallet and so does Deposit, which is the one gold button of the bar.
export function TopBar({ query, onSearch }: { query: string; onSearch: (q: string) => void }) {
  const { balance } = useWallet();
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [bellOpen, setBellOpen] = useState(false);
  const [text, setText] = useState(query);
  const usdt = coinById('usdt');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(text.trim());
  };

  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center gap-4 border-b border-topbar-line bg-topbar px-6">
      <form role="search" onSubmit={submit} className="flex h-[44px] min-w-[180px] max-w-[360px] flex-1 items-center gap-3 rounded-lg border border-line bg-sunken pl-4 pr-2 focus-within:border-accent">
        <MagnifyingGlass className="h-5 w-5 shrink-0 text-ink2" aria-hidden />
        <label htmlFor="v1-search" className="sr-only">
          Search for games or providers
        </label>
        <input
          id="v1-search"
          type="search"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (!e.target.value) onSearch('');
          }}
          placeholder="Search games or providers"
          className="h-full min-w-0 flex-1 bg-transparent text-14 text-ink outline-none placeholder:text-ink2"
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <Link
          to="/wallet/deposit"
          aria-label={`Account balance ${formatAmount(balance)} ${ACCOUNT.currency}, open the wallet`}
          className="flex h-[44px] items-center gap-3 rounded-lg border border-line bg-sunken pl-2 pr-4 hover:border-field"
        >
          <img src={usdt.icon} alt="" width={28} height={28} className="rounded-full" />
          <span className="num whitespace-nowrap font-display text-18 font-bold leading-none text-ink" aria-live="polite">
            {formatAmount(balance)} <span className="text-14 font-medium text-ink2">{ACCOUNT.currency}</span>
          </span>
        </Link>
        <Button asChild size="lg">
          <Link to="/wallet/deposit">Deposit</Link>
        </Button>

        <Popover open={bellOpen} onOpenChange={setBellOpen}>
          <PopoverTrigger
            aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            className="relative ml-1 flex h-[44px] w-[44px] items-center justify-center rounded-lg border border-line bg-sunken hover:border-field data-[state=open]:border-accent"
          >
            <img src="/art/shell/bell.svg" alt="" width={24} height={24} />
            {unread > 0 && <span aria-hidden className="absolute right-[10px] top-[10px] h-2 w-2 rounded-full bg-[#F33EF3]" />}
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
          <MenuTrigger className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 hover:bg-raised data-[state=open]:bg-raised" aria-label={`Account menu, ${ACCOUNT.name}`}>
            <img src="/art/avatars/john.webp" alt="" width={40} height={40} className="h-[40px] w-[40px] rounded-full object-cover" />
            <span className="whitespace-nowrap text-14 font-semibold text-ink">{ACCOUNT.name}</span>
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
