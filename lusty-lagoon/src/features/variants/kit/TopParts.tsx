import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CaretDown, Gear, MagnifyingGlass, SignOut, UserPlus, Wallet } from '@phosphor-icons/react';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../../components/ui/Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/Popover';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { ACCOUNT } from '../../../data/wallet';
import { cn } from '../../../lib/cn';

// Top bar parts every variant shares, the account box, the bell square and the search box.

export function UserBox({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();
  return (
    <Menu>
      <MenuTrigger
        aria-label={`Account menu, ${ACCOUNT.name}`}
        className="flex h-[52px] items-center gap-3 rounded-[14px] border border-white/[0.07] bg-[rgb(var(--k-item))] pl-[6px] pr-4 hover:bg-[rgb(var(--k-item-hover))] data-[state=open]:bg-[rgb(var(--k-item-hover))]"
      >
        <span className="relative">
          <img src="/art/avatars/john.webp" alt="" className="h-10 w-10 rounded-[10px] object-cover" />
          <span aria-hidden className="absolute -bottom-1 -left-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[rgb(var(--k-item))] bg-[#7B3FF2] px-1 text-12 font-bold leading-none text-ink">
            6
          </span>
        </span>
        {!compact && <span className="text-16 font-bold text-ink">{ACCOUNT.name}</span>}
        <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--k-muted))]" aria-hidden />
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
  );
}

export function BellSquare() {
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-white/[0.07] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item-hover))] hover:text-ink data-[state=open]:text-ink"
      >
        <Bell weight="fill" className="h-6 w-6" aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="absolute right-[8px] top-[8px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F06595] px-1 text-12 font-bold leading-none text-ink">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent>
        <NotificationsPanel
          onNavigate={(to) => {
            setOpen(false);
            navigate(to);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** A search box on the item surface. Submitting sends the query to the caller. */
export function SearchBox({ value, onChange, onSubmit, placeholder = 'Search for games', className, id = 'kit-search' }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder?: string; className?: string; id?: string }) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  };
  return (
    <form role="search" onSubmit={submit} className={cn('flex h-[52px] items-center gap-3 rounded-[14px] border border-white/[0.07] bg-[rgb(var(--k-item))] px-4 focus-within:ring-2 focus-within:ring-[#B47CFF]', className)}>
      <MagnifyingGlass weight="bold" className="h-5 w-5 shrink-0 text-[rgb(var(--k-muted))]" aria-hidden />
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-16 font-semibold text-ink outline-none placeholder:font-semibold placeholder:text-[rgb(var(--k-dim))]"
      />
    </form>
  );
}
