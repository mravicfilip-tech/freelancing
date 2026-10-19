import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as M from '@radix-ui/react-dropdown-menu';
import * as P from '@radix-ui/react-popover';
import { ArrowCircleDown, ArrowCircleUp, Bell, CaretDown, Check, Gear, MagnifyingGlass, Plus, SignOut, Trophy, UserPlus, Wallet } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { useWallet } from '../../wallet/store';
import { ACCOUNT, coinById, type CoinId } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { AnimatedNumber, KitButton } from '../kit/parts';
import { RACE, useCountdown } from '../shared/data';
import { CoinIcon, IconSquare } from './ui';

// The top bar after Snegbet. The wordmark over the sidebar, the weekly race chip in a raised box with
// a purple key, the balance menu with the orange Deposit key, icon squares with edges, the account box.

const BALANCE_COINS: CoinId[] = ['usdt', 'btc', 'eth', 'usdc', 'ltc'];

function inCoin(usd: number, id: CoinId) {
  const c = coinById(id);
  return formatAmount(usd / c.rate, c.rate >= 1000 ? 6 : c.rate >= 50 ? 4 : 2);
}

const menuItem = 'flex h-11 cursor-pointer select-none items-center gap-3 rounded-[10px] px-3 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-white/[0.06]';

/** The balance as a real menu. It picks the coin the balance shows in and leads to the wallet. */
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
  const symbol = coinById(coin).symbol;
  return (
    <div className="flex items-center gap-2">
      <M.Root>
        <M.Trigger
          aria-label={`Balance ${coin === 'usdt' ? formatAmount(balance) : inCoin(balance, coin)} ${symbol}, change the coin shown`}
          className="n1-raised n1-hoverable n1-ring group flex h-[48px] items-center gap-3 rounded-[12px] pl-3 pr-4 data-[state=open]:bg-[rgb(var(--n-hover))]"
        >
          <CoinIcon id={coin} size={24} />
          {coin === 'usdt' ? <AnimatedNumber value={balance} format={(n) => formatAmount(n)} className="text-16 font-extrabold text-ink" /> : <span className="num text-16 font-extrabold text-ink">{inCoin(balance, coin)}</span>}
          <span className="text-14 font-bold text-[rgb(var(--n-dim))]">{symbol}</span>
          <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--n-muted))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
        </M.Trigger>
        <M.Portal>
          <M.Content align="center" sideOffset={8} className="n1 n1-panel z-30 w-[300px] rounded-[16px] p-2 shadow-[0_24px_48px_rgb(0_0_0/0.5)]">
            <M.Label className="n1-label px-3 pb-1 pt-2">Show balance in</M.Label>
            <M.RadioGroup value={coin} onValueChange={(v) => pick(v as CoinId)}>
              {BALANCE_COINS.map((id) => (
                <M.RadioItem key={id} value={id} className={menuItem}>
                  <CoinIcon id={id} size={20} />
                  <span className="flex-1">{coinById(id).symbol}</span>
                  <span className="num text-[rgb(var(--n-muted))]">{inCoin(balance, id)}</span>
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
              <M.Item key={it.label} onSelect={it.run} className={cn(menuItem, '[&>svg]:text-[rgb(var(--n-muted))]')}>
                {it.icon}
                {it.label}
              </M.Item>
            ))}
          </M.Content>
        </M.Portal>
      </M.Root>
      <KitButton tone="primary" size="md" onClick={onDeposit} className="h-[48px] px-[20px]">
        <Plus weight="bold" className="h-5 w-5" aria-hidden />
        Deposit
      </KitButton>
    </div>
  );
}

function Bell_() {
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="n1-raised n1-hoverable n1-ring relative flex h-[48px] w-12 items-center justify-center rounded-[12px] text-[rgb(var(--n-muted))] hover:text-ink data-[state=open]:bg-[rgb(var(--n-hover))] data-[state=open]:text-ink">
        <Bell weight="fill" className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span aria-hidden className="num absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[rgb(var(--n-bar))] bg-[#FF5C8A] px-1 text-12 font-extrabold leading-none text-ink">
            {unread}
          </span>
        )}
      </P.Trigger>
      <P.Portal>
        <P.Content align="end" sideOffset={8} className="z-30 rounded-[16px] border border-line bg-raised shadow-3 outline-none">
          <NotificationsPanel
            onNavigate={(to) => {
              setOpen(false);
              navigate(to);
            }}
          />
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

function Account() {
  const navigate = useNavigate();
  return (
    <M.Root>
      <M.Trigger aria-label={`Account menu, ${ACCOUNT.name}, ${ACCOUNT.rank.name} rank`} className="n1-raised n1-hoverable n1-ring group flex h-[48px] items-center gap-3 rounded-[12px] pl-1 pr-3 data-[state=open]:bg-[rgb(var(--n-hover))]">
        <img src="/art/avatars/john.webp" alt="" className="h-10 w-10 rounded-[10px] object-cover" />
        <span className="flex flex-col items-start leading-none">
          <span className="text-14 font-extrabold text-ink">{ACCOUNT.name}</span>
          <span className="mt-1 flex items-center gap-1 text-12 font-bold text-[rgb(var(--n-bronze))]">
            <img src="/brand/rank-bronze.png" alt="" className="h-4 w-4" />
            {ACCOUNT.rank.name}
          </span>
        </span>
        <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--n-muted))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
      </M.Trigger>
      <M.Portal>
        <M.Content align="end" sideOffset={8} className="n1 n1-panel z-30 w-[240px] rounded-[16px] p-2 shadow-[0_24px_48px_rgb(0_0_0/0.5)]">
          {[
            { label: 'Account settings', icon: <Gear weight="bold" className="h-5 w-5" aria-hidden />, to: '/account' },
            { label: 'Wallet', icon: <Wallet weight="bold" className="h-5 w-5" aria-hidden />, to: '/wallet/deposit' },
            { label: 'Refer a friend', icon: <UserPlus weight="bold" className="h-5 w-5" aria-hidden />, to: '/refer' },
          ].map((it) => (
            <M.Item key={it.label} onSelect={() => navigate(it.to)} className={cn(menuItem, '[&>svg]:text-[rgb(var(--n-muted))]')}>
              {it.icon}
              {it.label}
            </M.Item>
          ))}
          <M.Separator className="mx-2 my-2 h-px bg-white/[0.07]" />
          <M.Item onSelect={() => navigate('/login')} className={cn(menuItem, '[&>svg]:text-[rgb(var(--n-muted))]')}>
            <SignOut weight="bold" className="h-5 w-5" aria-hidden />
            Log out
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

export function TopBar({ onDeposit, onRace, onSearch }: { onDeposit: () => void; onRace: () => void; onSearch: () => void }) {
  const race = useCountdown(RACE.endsInSeconds);
  return (
    <header className="n1-bar sticky top-0 z-20 flex h-[72px] items-center gap-3 px-4">
      <div className="flex w-[240px] shrink-0 items-center pl-2 w1920:w-[264px]">
        <Link to="/variants/1" aria-label="Lusty Lagoon, lobby" className="n1-ring rounded-[8px]">
          <Logo className="text-[20px] leading-[22px]" />
        </Link>
      </div>
      <div className="n1-raised flex h-[48px] items-center gap-3 rounded-[12px] pl-[6px] pr-[6px]">
        <span className="n1-keysq flex h-9 w-9 items-center justify-center rounded-full text-ink">
          <Trophy weight="fill" className="h-5 w-5" aria-hidden />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-14 font-extrabold text-ink">Weekly race</span>
          <span className="num mt-1 text-12 font-bold text-[rgb(var(--n-muted))]">
            <span className="n1-gold">{formatAmount(RACE.pool, 0)} USDT</span> · {race.d}d {race.pad(race.h)}h {race.pad(race.m)}m
          </span>
        </span>
        <KitButton tone="purple" size="sm" onClick={onRace} className="ml-1 h-9 px-4">
          Join
        </KitButton>
      </div>
      <div className="mx-auto">
        <BalanceMenu onDeposit={onDeposit} />
      </div>
      <IconSquare size={48} label="Search games" onClick={onSearch}>
        <MagnifyingGlass weight="bold" className="h-5 w-5" aria-hidden />
      </IconSquare>
      <Bell_ />
      <Account />
    </header>
  );
}
