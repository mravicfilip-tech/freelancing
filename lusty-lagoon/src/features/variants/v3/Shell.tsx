import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as M from '@radix-ui/react-dropdown-menu';
import {
  ArrowCircleDown,
  ArrowCircleUp,
  Bell,
  CaretDown,
  CaretRight,
  Check,
  Cherries,
  Coins,
  Crown,
  Fish,
  Gear,
  Gift,
  Headset,
  Lightning,
  MagnifyingGlass,
  Plus,
  Question,
  ShieldStar,
  SignOut,
  Sparkle,
  SquaresFour,
  Trophy,
  UserPlus,
  Wallet,
} from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../../components/ui/Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/Popover';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { useWallet } from '../../wallet/store';
import { ACCOUNT, coinById, type CoinId } from '../../../data/wallet';
import { formatAmount, formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { AnimatedNumber, Coin, KitButton } from '../kit/parts';
import { DAILY_CHEST, RACE, useCountdown } from '../shared/data';
import { TierShield } from './parts';
import { countOf, NEXT, POINTS, PROGRESS, type Filter } from './games-data';

// The arena shell. A top bar on the ground with the balance in the middle and your rank beside it,
// and a sidebar of three grouped panels, Arena, Casino and Money, after Snegbet's grouped sidebar.
// The selected row takes the purple key fill.

export const NAV_GAMES: { value: Filter; label: string; icon: ReactNode }[] = [
  { value: 'all', label: 'Lobby', icon: <SquaresFour weight="fill" /> },
  { value: 'slots', label: 'Slots', icon: <Cherries weight="fill" /> },
  { value: 'megaways', label: 'Megaways', icon: <Lightning weight="fill" /> },
  { value: 'hold-and-win', label: 'Hold and win', icon: <Coins weight="fill" /> },
  { value: 'fish', label: 'Fish games', icon: <Fish weight="fill" /> },
  { value: 'new', label: 'New', icon: <Sparkle weight="fill" /> },
];

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0B2C]';
const BOX = 'a-row flex h-[48px] items-center rounded-[12px]';

// ---------- Top bar ----------

const BALANCE_COINS: CoinId[] = ['usdt', 'btc', 'eth', 'usdc', 'ltc'];
function inCoin(usd: number, id: CoinId) {
  const c = coinById(id);
  return formatAmount(usd / c.rate, c.rate >= 1000 ? 6 : c.rate >= 50 ? 4 : 2);
}

/** The balance, a real menu after the kit's BalancePill. It picks the coin shown and leads to the wallet. */
function BalanceMenu({ onDeposit }: { onDeposit: () => void }) {
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
      /* the choice just does not persist */
    }
  };
  const c = coinById(coin);
  return (
    <div className="flex items-center gap-2">
      <M.Root>
        <M.Trigger
          aria-label={`Balance ${coin === 'usdt' ? formatAmount(balance) : inCoin(balance, coin)} ${c.symbol}, change the coin shown`}
          className={cn(BOX, FOCUS, 'group gap-3 pl-3 pr-4 transition-colors hover:bg-[rgb(var(--a-raised))] data-[state=open]:bg-[rgb(var(--a-raised))]')}
        >
          <Coin id={coin} size={24} />
          {coin === 'usdt' ? (
            <AnimatedNumber value={balance} format={(n) => formatAmount(n)} className="text-16 font-bold text-ink" />
          ) : (
            <span className="num text-16 font-bold text-ink">{inCoin(balance, coin)}</span>
          )}
          <span className="a-muted text-14 font-semibold">{c.symbol}</span>
          <CaretDown weight="bold" className="a-muted h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
        </M.Trigger>
        <M.Portal>
          <M.Content align="center" sideOffset={8} className="a-page a-panel z-30 w-[300px] rounded-[16px] p-2 shadow-[0_24px_48px_rgb(0_0_0/0.5)]">
            <M.Label className="a-caps px-3 pb-1 pt-2">Show balance in</M.Label>
            <M.RadioGroup value={coin} onValueChange={(v) => pick(v as CoinId)}>
              {BALANCE_COINS.map((id) => (
                <M.RadioItem key={id} value={id} className="flex h-11 cursor-pointer select-none items-center gap-3 rounded-[12px] px-3 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-white/[0.06]">
                  <Coin id={id} size={20} />
                  <span className="flex-1">{coinById(id).symbol}</span>
                  <span className="num a-muted">{inCoin(balance, id)}</span>
                  <span className="flex w-4 justify-center">
                    <M.ItemIndicator>
                      <Check weight="bold" className="h-4 w-4 text-[#C9A2FF]" aria-hidden />
                    </M.ItemIndicator>
                  </span>
                </M.RadioItem>
              ))}
            </M.RadioGroup>
            <M.Separator className="mx-2 my-2 h-px bg-white/[0.07]" />
            {[
              { label: 'Deposit', icon: <ArrowCircleDown weight="bold" className="h-5 w-5" aria-hidden />, run: onDeposit },
              { label: 'Withdraw', icon: <ArrowCircleUp weight="bold" className="h-5 w-5" aria-hidden />, run: () => navigate('/wallet/withdraw') },
              { label: 'Open wallet', icon: <Wallet weight="bold" className="h-5 w-5" aria-hidden />, run: () => navigate('/wallet/deposit') },
            ].map((it) => (
              <M.Item key={it.label} onSelect={it.run} className="flex h-11 cursor-pointer select-none items-center gap-3 rounded-[12px] px-3 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-white/[0.06] [&>svg]:text-[rgb(var(--a-muted))]">
                {it.icon}
                {it.label}
              </M.Item>
            ))}
          </M.Content>
        </M.Portal>
      </M.Root>
      <KitButton tone="primary" shape="rounded" onClick={onDeposit} className="h-[48px] px-6">
        <Plus weight="bold" className="h-5 w-5" aria-hidden />
        Deposit
      </KitButton>
    </div>
  );
}

/** Your rank in the bar, the tier shield, the points and a thin bar to the next rank. It opens the rank road. */
function RankChip({ onClick }: { onClick: () => void }) {
  const pct = Math.round(PROGRESS * 100);
  return (
    <button type="button" onClick={onClick} aria-label={`Bronze rank, ${formatPoints(POINTS)} EXP, ${pct}% of the way to ${NEXT.name}. Open the rank road`} className={cn(BOX, FOCUS, 'a-hover gap-3 px-3 hover:bg-[rgb(var(--a-raised))]')}>
      <TierShield tier="bronze" size={24} />
      <span className="flex flex-col items-start gap-1">
        <span className="flex items-baseline gap-1 text-14 font-bold leading-none text-ink">
          <span className="num">{formatPoints(POINTS)}</span>
          <span className="a-muted text-12 font-semibold">EXP</span>
        </span>
        <span aria-hidden className="block h-[4px] w-[88px] overflow-hidden rounded-full bg-white/[0.1]">
          <span className="block h-full rounded-full bg-[#D9825B]" style={{ width: `${pct}%` }} />
        </span>
      </span>
    </button>
  );
}

function UserBox() {
  const navigate = useNavigate();
  return (
    <Menu>
      <MenuTrigger aria-label={`Account menu, ${ACCOUNT.name}`} className={cn(BOX, FOCUS, 'gap-3 pl-1 pr-3 hover:bg-[rgb(var(--a-raised))] data-[state=open]:bg-[rgb(var(--a-raised))]')}>
        <img src="/art/avatars/john.webp" alt="" className="h-10 w-10 rounded-[8px] object-cover" />
        <span className="text-14 font-bold text-ink">{ACCOUNT.name}</span>
        <CaretDown weight="bold" className="a-muted h-4 w-4" aria-hidden />
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

function BellBox() {
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className={cn(BOX, FOCUS, 'a-muted relative w-12 justify-center hover:bg-[rgb(var(--a-raised))] hover:text-ink data-[state=open]:text-ink')}>
        <Bell weight="fill" className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="absolute right-[6px] top-[6px] flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F06AB0] px-1 text-12 font-bold leading-none text-[#1A0F2B]">
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

export function TopBar({ query, onQuery, onSearch, onDeposit, onRank }: { query: string; onQuery: (q: string) => void; onSearch: () => void; onDeposit: () => void; onRank: () => void }) {
  return (
    <header className="a-bar sticky top-0 z-20 flex h-[72px] items-center gap-3 pl-4 pr-8">
      <div className="flex w-[264px] shrink-0 items-center pl-4">
        <Link to="/variants/3" aria-label="Lusty Lagoon, lobby" className={cn('rounded-[8px]', FOCUS)}>
          <Logo className="text-[20px] leading-[22px]" />
        </Link>
      </div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className={cn(BOX, 'ml-8 w-[300px] gap-3 px-4 focus-within:ring-2 focus-within:ring-[#B47CFF] w1920:w-[400px]')}
      >
        <MagnifyingGlass weight="bold" className="a-muted h-5 w-5 shrink-0" aria-hidden />
        <label htmlFor="v3-top-search" className="sr-only">
          Search for games
        </label>
        <input id="v3-top-search" type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search for games" className="h-full min-w-0 flex-1 bg-transparent text-14 font-semibold text-ink outline-none placeholder:text-[rgb(var(--a-muted))]" />
      </form>
      <div className="mx-auto">
        <BalanceMenu onDeposit={onDeposit} />
      </div>
      <RankChip onClick={onRank} />
      <UserBox />
      <BellBox />
    </header>
  );
}

// ---------- Sidebar ----------

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label} className="a-panel flex shrink-0 flex-col gap-1 rounded-[16px] p-2">
      <p className="a-caps px-3 pb-1 pt-2">{label}</p>
      {children}
    </nav>
  );
}

const ROW = cn('group flex h-11 w-full items-center gap-3 rounded-[12px] border border-transparent px-3 text-left text-14 font-semibold transition-colors', FOCUS);

/** A row with a colour icon tile, for the arena and money groups. */
function TileRow({ icon, tint, label, right, onClick, to }: { icon: ReactNode; tint: string; label: string; right?: ReactNode; onClick?: () => void; to?: string }) {
  const inner = (
    <>
      <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] [&>svg]:h-4 [&>svg]:w-4" style={{ background: `${tint}29`, color: tint }}>
        {icon}
      </span>
      <span className="flex-1 truncate text-ink">{label}</span>
      {right}
    </>
  );
  const cls = cn(ROW, 'hover:bg-[rgb(var(--a-row))]');
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

const chevron = <CaretRight weight="bold" className="a-muted h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />;

export function Sidebar({ filter, onFilter, onJump }: { filter: Filter; onFilter: (f: Filter) => void; onJump: (id: string) => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  const { h, m } = useCountdown(DAILY_CHEST.readyInSeconds);
  return (
    <aside aria-label="Site" className="a-no-scrollbar sticky top-[88px] flex h-[calc(100vh-104px)] w-[264px] shrink-0 flex-col gap-3 overflow-y-auto">
      <Group label="Arena">
        <TileRow icon={<Gift weight="fill" />} tint="#B47CFF" label="Daily chest" onClick={() => onJump('chest')} right={<span className="num text-12 font-bold text-[#3DD68C]">{`${h}h ${m}m`}</span>} />
        <TileRow icon={<Trophy weight="fill" />} tint="#F4D543" label="Weekly race" onClick={() => onJump('race')} right={<span className="num a-raised rounded-[8px] px-2 py-0.5 text-12 font-bold text-ink">#{RACE.you.place}</span>} />
        <TileRow
          icon={<ShieldStar weight="fill" />}
          tint="#D9825B"
          label="Rank road"
          onClick={() => onJump('rank')}
          right={
            <span className="flex items-center gap-1 text-12 font-bold text-[#E8A383]">
              <TierShield tier="bronze" size={14} />
              Bronze
            </span>
          }
        />
      </Group>
      <Group label="Casino">
        {NAV_GAMES.map((n) => {
          const on = filter === n.value;
          return (
            <button key={n.value} type="button" aria-pressed={on} onClick={() => onFilter(n.value)} className={cn(ROW, on ? 'a-on' : 'a-muted hover:bg-[rgb(var(--a-row))] hover:text-ink')}>
              <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">{n.icon}</span>
              <span className="flex-1 truncate">{n.label}</span>
              <span className={cn('num text-12 font-bold', on ? 'text-white/80' : 'a-muted')}>{countOf(n.value)}</span>
            </button>
          );
        })}
      </Group>
      <Group label="Money">
        <TileRow
          to="/wallet/deposit"
          icon={<Wallet weight="fill" />}
          tint="#3DD68C"
          label="Wallet"
          right={
            pending > 0 ? (
              <span className="num flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-12 font-bold text-on-gold">
                {pending}
                <span className="sr-only"> pending</span>
              </span>
            ) : (
              chevron
            )
          }
        />
        <TileRow to="/agent" icon={<Headset weight="fill" />} tint="#4FD1E0" label="Send to agent" right={chevron} />
        <TileRow to="/refer" icon={<UserPlus weight="fill" />} tint="#F06AB0" label="Refer a friend" right={chevron} />
        <TileRow to="/faq" icon={<Question weight="fill" />} tint="#7FA8FF" label="Help and FAQ" right={chevron} />
      </Group>
      <div className="a-panel mt-auto flex shrink-0 items-center gap-3 rounded-[16px] p-4">
        <Crown weight="fill" className="h-5 w-5 shrink-0 text-gold" aria-hidden />
        <p className="a-muted text-12 font-semibold leading-[16px]">
          <span className="text-ink">{NEXT.name}</span> pays a weekly cash drop up to $50
        </p>
      </div>
    </aside>
  );
}
