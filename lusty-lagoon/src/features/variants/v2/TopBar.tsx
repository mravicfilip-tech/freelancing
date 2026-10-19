import { useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as M from '@radix-ui/react-dropdown-menu';
import { ArrowCircleDown, ArrowCircleUp, Bell, CaretDown, Check, Gear, Pause, Play, Plus, SignOut, UserPlus, Wallet } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/Popover';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { useWallet } from '../../wallet/store';
import { ACCOUNT, coinById, type CoinId } from '../../../data/wallet';
import { gameById, type CatalogueGame } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { AnimatedNumber, Coin, KitButton } from '../kit/parts';
import { LIVE_WINS } from '../shared/data';
import { Face, Skel, handle, useStill } from './ui';

// The top bar after Betsera. The logo over the sidebar column, the live wins strip from the main
// column's edge, then the balance pill with the orange Deposit key, the bell and the account.

const BALANCE_COINS: CoinId[] = ['usdt', 'btc', 'eth', 'usdc', 'ltc'];

function inCoin(usd: number, id: CoinId) {
  const c = coinById(id);
  return formatAmount(usd / c.rate, c.rate >= 1000 ? 6 : c.rate >= 50 ? 4 : 2);
}

const itemCls = 'flex h-11 cursor-pointer select-none items-center gap-3 rounded-full px-4 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-white/[0.07]';
const menuCls = 'm2-box z-20 rounded-[24px] p-2 shadow-[0_24px_48px_rgb(0_0_0/0.5)]';

/** The balance pill, a real menu. It picks the coin the balance shows in and leads to the wallet. */
function BalancePill({ onDeposit }: { onDeposit: () => void }) {
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
  const other = coin === 'usdt' ? null : coinById(coin);
  return (
    <M.Root>
      <M.Trigger
        aria-label={`Balance ${other ? inCoin(balance, coin) : formatAmount(balance)} ${other ? other.symbol : ACCOUNT.currency}, change the coin shown`}
        className="m2-box m2-hover group flex h-[48px] items-center gap-3 rounded-full pl-2 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] data-[state=open]:border-[color:var(--m2-edge-hi)] data-[state=open]:bg-[rgb(var(--m2-raised))]"
      >
        <Coin id={coin} size={32} />
        {other ? (
          <span className="num text-16 font-bold text-ink">{inCoin(balance, coin)}</span>
        ) : (
          <AnimatedNumber value={balance} format={(n) => formatAmount(n)} className="text-16 font-bold text-ink" />
        )}
        <span className="text-14 font-semibold text-[rgb(var(--m2-ink3))]">{other ? other.symbol : ACCOUNT.currency}</span>
        <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--m2-ink3))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
      </M.Trigger>
      <M.Portal>
        <M.Content align="end" sideOffset={8} className={cn(menuCls, 'w-[300px]')}>
          <M.Label className="px-4 pb-1 pt-2 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--m2-ink3))]">Show balance in</M.Label>
          <M.RadioGroup value={coin} onValueChange={(v) => pick(v as CoinId)}>
            {BALANCE_COINS.map((id) => (
              <M.RadioItem key={id} value={id} className={itemCls}>
                <Coin id={id} size={20} />
                <span className="flex-1">{coinById(id).symbol}</span>
                <span className="num text-[rgb(var(--m2-ink2))]">{inCoin(balance, id)}</span>
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
            { label: 'Deposit', icon: <ArrowCircleDown weight="bold" className="h-5 w-5" aria-hidden />, run: onDeposit },
            { label: 'Withdraw', icon: <ArrowCircleUp weight="bold" className="h-5 w-5" aria-hidden />, run: () => navigate('/wallet/withdraw') },
            { label: 'Open wallet', icon: <Wallet weight="bold" className="h-5 w-5" aria-hidden />, run: () => navigate('/wallet/deposit') },
          ].map((it) => (
            <M.Item key={it.label} onSelect={it.run} className={cn(itemCls, '[&>svg]:text-[rgb(var(--m2-ink3))]')}>
              {it.icon}
              {it.label}
            </M.Item>
          ))}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

function BellButton() {
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="m2-box m2-hover relative flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full text-[rgb(var(--m2-ink2))] outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF] data-[state=open]:text-ink"
      >
        <Bell weight="fill" className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="num absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[rgb(var(--m2-ground))] bg-gold px-1 text-12 font-bold leading-none text-on-gold">
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

function Account() {
  const navigate = useNavigate();
  const items = [
    { label: 'Account settings', icon: <Gear className="h-5 w-5" aria-hidden />, to: '/account' },
    { label: 'Wallet', icon: <Wallet className="h-5 w-5" aria-hidden />, to: '/wallet/deposit' },
    { label: 'Refer a friend', icon: <UserPlus className="h-5 w-5" aria-hidden />, to: '/refer' },
  ];
  return (
    <M.Root>
      <M.Trigger
        aria-label={`Account menu, ${ACCOUNT.name}`}
        className="m2-box m2-hover group flex h-[48px] shrink-0 items-center gap-2 rounded-full pl-1 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] data-[state=open]:bg-[rgb(var(--m2-raised))]"
      >
        <img src="/art/avatars/john.webp" alt="" className="h-10 w-10 rounded-full object-cover" />
        <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--m2-ink3))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
      </M.Trigger>
      <M.Portal>
        <M.Content align="end" sideOffset={8} className={cn(menuCls, 'w-[260px]')}>
          <div className="flex items-center gap-3 px-3 pb-3 pt-2">
            <img src="/art/avatars/john.webp" alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-14 font-bold text-ink">{ACCOUNT.name}</span>
              <span className="text-12 font-semibold text-[#E9A46A]">{ACCOUNT.rank.name} rank</span>
            </div>
          </div>
          <M.Separator className="mx-2 mb-2 h-[1px] bg-white/[0.07]" />
          {items.map((it) => (
            <M.Item key={it.label} onSelect={() => navigate(it.to)} className={cn(itemCls, '[&>svg]:text-[rgb(var(--m2-ink3))]')}>
              {it.icon}
              {it.label}
            </M.Item>
          ))}
          <M.Separator className="mx-2 my-2 h-[1px] bg-white/[0.07]" />
          <M.Item onSelect={() => navigate('/login')} className={cn(itemCls, '[&>svg]:text-[rgb(var(--m2-ink3))]')}>
            <SignOut className="h-5 w-5" aria-hidden />
            Log out
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

/** One win, Betsera's avatar card. The game's cover as the coloured square, the player on its corner. */
function WinChip({ w, onPlay }: { w: (typeof LIVE_WINS)[number]; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(w.gameId)!;
  const c = coinById(w.coin);
  const digits = c.decimals > 2 && w.amount < 100 ? 2 : w.amount >= 1000 ? 0 : 2;
  return (
    <li className="shrink-0">
      <button
        type="button"
        onClick={() => onPlay(g)}
        aria-label={`${w.player} won ${formatAmount(w.amount, digits)} ${c.symbol} on ${g.name}, ${w.ago} ago. Open the game`}
        className="m2-box m2-hover group flex h-[52px] w-[140px] items-center gap-2 rounded-[16px] pl-[6px] pr-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
      >
        <span className="relative h-10 w-10 shrink-0">
          <img src={g.image} alt="" className="h-10 w-10 rounded-[12px] object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
          <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-[rgb(var(--m2-surface))]">
            <Face src={w.avatar} initials={w.initials} size={20} />
          </span>
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-12 font-semibold leading-4 text-[rgb(var(--m2-ink3))]">{handle(w.player)}</span>
          <span className="num flex items-center gap-[6px] truncate text-14 font-bold leading-5 text-ink">
            <Coin id={w.coin} size={14} />
            {formatAmount(w.amount, digits)}
          </span>
        </span>
      </button>
    </li>
  );
}

function WinsStrip({ onPlay, state }: { onPlay: (g: CatalogueGame) => void; state: string | null }) {
  const still = useStill();
  const [paused, setPaused] = useState(false);
  const list = state === 'empty' ? [] : LIVE_WINS;
  const style = { '--m2-run': '80s', animationPlayState: still ? 'paused' : undefined } as CSSProperties;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <button
        type="button"
        aria-pressed={paused}
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? 'Live wins paused, play' : 'Live wins running, pause'}
        className="m2-box m2-hover flex h-[52px] shrink-0 items-center gap-2 rounded-[16px] pl-3 pr-2 outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
      >
        <span className="flex flex-col items-start">
          <span className="flex items-center gap-2 text-12 font-black uppercase leading-4 tracking-[0.08em] text-ink">
            <span aria-hidden className={paused ? 'inline-flex h-[8px] w-[8px] rounded-full bg-[rgb(var(--m2-ink3))]' : 'k-live'} />
            Live
          </span>
          <span className="text-12 font-semibold leading-4 text-[rgb(var(--m2-ink3))]">wins</span>
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[rgb(var(--m2-ink2))]" aria-hidden>
          {paused ? <Play weight="fill" className="h-[12px] w-[12px]" /> : <Pause weight="fill" className="h-[12px] w-[12px]" />}
        </span>
      </button>
      {state === 'loading' ? (
        <div className="flex min-w-0 flex-1 gap-2 overflow-hidden">
          {Array.from({ length: 10 }, (_, i) => (
            <Skel key={i} className="h-[52px] w-[140px] shrink-0 rounded-[16px]" />
          ))}
        </div>
      ) : state === 'error' ? (
        <p role="status" className="min-w-0 flex-1 truncate text-14 font-semibold text-[rgb(var(--m2-ink2))]">
          Live wins are paused while the feed reconnects.
        </p>
      ) : list.length === 0 ? (
        <p role="status" className="min-w-0 flex-1 truncate text-14 font-semibold text-[rgb(var(--m2-ink2))]">
          No wins in the last hour. The next one shows here the moment it lands.
        </p>
      ) : (
        <div
          role="region"
          aria-label="Live wins, moving"
          data-paused={paused}
          className="m2-runwrap relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_24px,#000_calc(100%-72px),transparent)]"
        >
          <div className="m2-run" style={style}>
            <ul className="flex shrink-0 gap-2 pr-2">
              {list.map((w) => (
                <WinChip key={w.id} w={w} onPlay={onPlay} />
              ))}
            </ul>
            <ul className="flex shrink-0 gap-2 pr-2" aria-hidden inert>
              {list.map((w) => (
                <WinChip key={w.id} w={w} onPlay={onPlay} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function TopBar({ onPlay, state }: { onPlay: (g: CatalogueGame) => void; state: string | null }) {
  const navigate = useNavigate();
  const deposit = () => navigate('/wallet/deposit');
  return (
    <header className="m2-bar sticky top-0 z-10 flex h-[72px] items-center gap-6 pl-4 pr-6">
      <div className="flex w-[232px] shrink-0 items-center pl-2">
        <Link to="/variants/2" aria-label="Lusty Lagoon, lobby" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
          <Logo className="text-[20px] leading-[22px]" />
        </Link>
      </div>
      <WinsStrip onPlay={onPlay} state={state} />
      <div className="flex shrink-0 items-center gap-2">
        <BalancePill onDeposit={deposit} />
        <KitButton tone="primary" shape="pill" onClick={deposit} className="h-[48px] pl-4 pr-6">
          <Plus weight="bold" className="h-5 w-5" aria-hidden />
          Deposit
        </KitButton>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <BellButton />
        <Account />
      </div>
    </header>
  );
}
