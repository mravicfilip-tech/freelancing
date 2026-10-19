import { Link, useNavigate } from 'react-router-dom';
import { Bell, CaretDown, Gear, MagnifyingGlass, SignOut, UserPlus, Wallet } from '@phosphor-icons/react';
import { Avatar } from '../ui/Avatar';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../ui/Menu';
import usdt from 'cryptocurrency-icons/svg/color/usdt.svg';
import { ACCOUNT } from '../../data/wallet';
import { formatAmount } from '../../lib/format';
import { useWallet } from '../../features/wallet/store';

export function TopBar() {
  const { balance } = useWallet();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-6 border-b border-line bg-page px-[var(--bl-page-pad)]">
      <form role="search" className="flex h-10 w-full max-w-sm items-center gap-2 rounded-lg border border-line bg-sunken px-3 focus-within:border-accent" onSubmit={(e) => e.preventDefault()}>
        <MagnifyingGlass className="h-5 w-5 shrink-0 text-ink3" aria-hidden />
        <label htmlFor="search" className="sr-only">
          Search games or providers
        </label>
        <input id="search" type="search" placeholder="Search games or providers" className="h-full min-w-0 flex-1 bg-transparent text-14 text-ink outline-none placeholder:text-ink3" />
      </form>

      <div className="flex items-center gap-3" aria-live="polite">
        <img src={usdt} alt="" width={24} height={24} />
        <p className="flex flex-col">
          <span className="num text-16 font-semibold leading-tight text-ink">
            {formatAmount(balance)} <span className="text-ink2">{ACCOUNT.currency}</span>
          </span>
          <span className="text-12 text-ink3">Balance</span>
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link to="/notifications" aria-label="Notifications, 1 new" className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink2 hover:bg-raised hover:text-ink">
          <Bell className="h-6 w-6" aria-hidden />
          <span aria-hidden className="absolute right-2 top-2 h-[var(--bl-sp-8)] w-2 rounded-full bg-gold" />
        </Link>
        <Menu>
          <MenuTrigger className="flex h-10 items-center gap-2 rounded-lg pl-1 pr-2 hover:bg-raised data-[state=open]:bg-raised" aria-label={`Account menu, ${ACCOUNT.name}`}>
            <Avatar initials={ACCOUNT.initials} size="sm" />
            <span className="text-14 font-medium text-ink">{ACCOUNT.name}</span>
            <CaretDown className="h-4 w-4 text-ink2" aria-hidden />
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
