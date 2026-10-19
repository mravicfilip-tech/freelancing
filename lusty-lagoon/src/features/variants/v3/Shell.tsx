import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CaretDown,
  Cherries,
  Coins,
  Crown,
  DiscordLogo,
  Fish,
  Gift,
  Headset,
  InstagramLogo,
  Lightning,
  List,
  Question,
  Sparkle,
  SquaresFour,
  TelegramLogo,
  Trophy,
  UserPlus,
  Wallet,
  XLogo,
} from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { useWallet } from '../../wallet/store';
import { ACCOUNT } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BalancePill, IconSquare, NavItem } from '../kit/parts';
import { BellSquare, SearchBox, UserBox } from '../kit/TopParts';
import { countOf, type Filter } from './games-data';

// The shell, after Cybet. The kit top bar, and a sidebar of boxed groups that open and close, each
// group its own rounded panel with a caret square on its header.

export const NAV_GAMES: { value: Filter; label: string; icon: ReactNode }[] = [
  { value: 'all', label: 'Lobby', icon: <SquaresFour weight="fill" /> },
  { value: 'slots', label: 'Slots', icon: <Cherries weight="fill" /> },
  { value: 'megaways', label: 'Megaways', icon: <Lightning weight="fill" /> },
  { value: 'hold-and-win', label: 'Hold and win', icon: <Coins weight="fill" /> },
  { value: 'fish', label: 'Fish games', icon: <Fish weight="fill" /> },
  { value: 'new', label: 'New', icon: <Sparkle weight="fill" /> },
];

export function TopBar({ query, onQuery, onSearch, onDeposit }: { query: string; onQuery: (q: string) => void; onSearch: () => void; onDeposit: () => void }) {
  const { balance } = useWallet();
  return (
    <header className="sticky top-0 z-20 flex h-[84px] items-center gap-4 bg-page px-4">
      <div className="flex w-[248px] shrink-0 items-center gap-4">
        <IconSquare label="Menu">
          <List weight="bold" className="h-6 w-6" aria-hidden />
        </IconSquare>
        <Link to="/variants/3" aria-label="Lusty Lagoon, lobby" className="rounded-lg">
          <Logo className="text-[20px] leading-[22px]" />
        </Link>
      </div>
      <SearchBox id="v3-top-search" value={query} onChange={onQuery} onSubmit={onSearch} placeholder="Search for games" className="w-[300px] w1920:w-[400px]" />
      <div className="mx-auto">
        <BalancePill amount={formatAmount(balance)} currency={ACCOUNT.currency} onDeposit={onDeposit} depositLabel="Deposit" />
      </div>
      <UserBox />
      <BellSquare />
    </header>
  );
}

function Group({ icon, label, children, defaultOpen = true }: { icon: ReactNode; label: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `v3-group-${label.toLowerCase().replace(/\s/g, '-')}`;
  return (
    <div className="rounded-[18px] bg-[rgb(var(--k-panel))] p-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center gap-3 rounded-[12px] pl-3 pr-1 text-left text-16 font-bold text-ink hover:bg-[rgb(var(--k-item))]"
      >
        <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <span className="flex-1">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))]">
          <CaretDown weight="bold" className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
        </span>
      </button>
      {open && (
        <div id={id} className="mt-2 flex flex-col gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

const count = (n: number) => <span className="num text-12 font-semibold text-[rgb(var(--k-dim))]">{n}</span>;

export function Sidebar({ filter, onFilter, onJump }: { filter: Filter; onFilter: (f: Filter) => void; onJump: (id: string) => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  return (
    <aside aria-label="Site" className="k-no-scrollbar sticky top-[84px] flex h-[calc(100vh-100px)] w-[248px] shrink-0 flex-col gap-3 overflow-y-auto">
      <Group icon={<Crown weight="fill" className="text-[#F5B800]" />} label="Rewards">
        <NavItem icon={<Trophy weight="fill" />} label="Rank road" onClick={() => onJump('rank')} badge={<span className="rounded-[8px] bg-[#D9480F]/25 px-2 py-0.5 text-12 font-bold text-[#FFB27A]">Bronze</span>} />
        <NavItem icon={<Gift weight="fill" />} label="Daily chest" onClick={() => onJump('chest')} badge={<span className="num text-12 font-bold text-[#5FF0A0]">2h 15m</span>} />
        <NavItem icon={<Lightning weight="fill" />} label="Weekly race" onClick={() => onJump('race')} badge={<span className="num text-12 font-semibold text-[rgb(var(--k-dim))]">214th</span>} />
      </Group>
      <Group icon={<Cherries weight="fill" className="text-[#C9A2FF]" />} label="Casino">
        {NAV_GAMES.map((n) => (
          <NavItem key={n.value} icon={n.icon} label={n.label} active={filter === n.value} onClick={() => onFilter(n.value)} badge={count(countOf(n.value))} />
        ))}
      </Group>
      <Group icon={<Wallet weight="fill" className="text-[#3DDC84]" />} label="Money" defaultOpen={false}>
        <NavItem
          to="/wallet/deposit"
          icon={<Wallet weight="fill" />}
          label="Wallet"
          badge={
            pending > 0 ? (
              <span className="num flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gold px-[6px] text-12 font-bold text-on-gold">
                {pending}
                <span className="sr-only"> pending</span>
              </span>
            ) : undefined
          }
        />
        <NavItem to="/agent" icon={<Headset weight="fill" />} label="Send to agent" />
        <NavItem to="/refer" icon={<UserPlus weight="fill" />} label="Refer a friend" />
      </Group>
      <Link to="/faq" className="flex h-[60px] shrink-0 items-center gap-3 rounded-[18px] bg-[rgb(var(--k-panel))] px-4 text-16 font-bold text-ink hover:bg-[rgb(var(--k-item))]">
        <Question weight="fill" className="h-5 w-5 text-[#2FB4F0]" aria-hidden />
        Help and FAQ
      </Link>
      <div className="mt-auto grid shrink-0 grid-cols-4 gap-2">
        {[
          { l: 'X', i: <XLogo weight="bold" className="h-5 w-5" /> },
          { l: 'Instagram', i: <InstagramLogo weight="bold" className="h-5 w-5" /> },
          { l: 'Telegram', i: <TelegramLogo weight="bold" className="h-5 w-5" /> },
          { l: 'Discord', i: <DiscordLogo weight="bold" className="h-5 w-5" /> },
        ].map((x) => (
          <a key={x.l} href="#" aria-label={`Lusty Lagoon on ${x.l}`} className="flex h-11 items-center justify-center rounded-[12px] bg-[rgb(var(--k-panel))] text-[rgb(var(--k-muted))] hover:text-ink">
            {x.i}
          </a>
        ))}
      </div>
    </aside>
  );
}
