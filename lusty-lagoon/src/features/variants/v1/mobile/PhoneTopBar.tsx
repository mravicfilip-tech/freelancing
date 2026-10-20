import { useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as M from '@radix-ui/react-dropdown-menu';
import { ArrowCircleDown, ArrowCircleUp, Bell, CaretDown, Check, Plus, Wallet } from '@phosphor-icons/react';
import { Logo } from '../../../../components/ui/Logo';
import { useUnreadCount } from '../../../account';
import { useWallet } from '../../../wallet/store';
import { ACCOUNT, coinById, type CoinId } from '../../../../data/wallet';
import { formatAmount } from '../../../../lib/format';
import { cn } from '../../../../lib/cn';
import { AnimatedNumber } from '../../kit/parts';
import { CoinIcon, Key } from '../ui';

// The phone top bar. Iterations 1 and 3 carry the wordmark, the balance with the orange Deposit key,
// the bell and the account. Iteration 2 is slim, 56px, the account on the left, the balance in the
// middle and the bell on the right, since its Deposit sits in the bottom bar. The bell and the
// account open panels from the top. Every control is 44px square or more.

const COINS: CoinId[] = ['usdt', 'btc', 'eth', 'usdc', 'ltc'];
const STORE = 'kit-balance-coin';

function inCoin(usd: number, id: CoinId) {
  const c = coinById(id);
  return formatAmount(usd / c.rate, c.rate >= 1000 ? 6 : c.rate >= 50 ? 4 : 2);
}

const item = 'flex h-11 cursor-pointer select-none items-center gap-3 rounded-[10px] px-3 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-white/[0.06]';

/** The balance as a menu, the same choices as the desktop bar. It picks the coin shown and leads to the wallet. */
function Balance({ symbol: showSymbol, onDeposit }: { symbol?: boolean; onDeposit: () => void }) {
  const navigate = useNavigate();
  const { balance } = useWallet();
  const [coin, setCoin] = useState<CoinId>(() => {
    try {
      return (sessionStorage.getItem(STORE) as CoinId) || 'usdt';
    } catch {
      return 'usdt';
    }
  });
  const pick = (id: CoinId) => {
    setCoin(id);
    try {
      sessionStorage.setItem(STORE, id);
    } catch {
      /* the choice just does not persist */
    }
  };
  const symbol = coinById(coin).symbol;
  const text = coin === 'usdt' ? formatAmount(balance) : inCoin(balance, coin);
  return (
    <M.Root>
      <M.Trigger aria-label={`Balance ${text} ${symbol}, change the coin shown`} className="n1-raised n1-hoverable n1-ring group flex h-11 min-w-0 items-center gap-2 rounded-[12px] pl-[10px] pr-3 data-[state=open]:bg-[rgb(var(--n-hover))]">
        <CoinIcon id={coin} size={20} />
        {coin === 'usdt' ? <AnimatedNumber value={balance} format={(n) => formatAmount(n)} className="text-14 font-extrabold text-ink" /> : <span className="num truncate text-14 font-extrabold text-ink">{text}</span>}
        {showSymbol && <span className="text-12 font-bold text-[rgb(var(--n-dim))]">{symbol}</span>}
        <CaretDown weight="bold" className="h-[12px] w-[12px] shrink-0 text-[rgb(var(--n-muted))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
      </M.Trigger>
      <M.Portal>
        <M.Content align="center" sideOffset={8} collisionPadding={16} className="n1 n1-panel z-30 w-[300px] max-w-[calc(100vw-32px)] rounded-[16px] p-2 shadow-[0_24px_48px_rgb(0_0_0/0.5)]">
          <M.Label className="n1-label px-3 pb-1 pt-2">Show balance in</M.Label>
          <M.RadioGroup value={coin} onValueChange={(v) => pick(v as CoinId)}>
            {COINS.map((id) => (
              <M.RadioItem key={id} value={id} className={item}>
                <CoinIcon id={id} size={20} />
                <span className="flex-1">{coinById(id).symbol}</span>
                <span className="num text-[rgb(var(--n-muted))]">{inCoin(balance, id)}</span>
                <span className="flex w-4 justify-center">
                  <M.ItemIndicator>
                    <Check weight="bold" className="h-4 w-4 text-[rgb(var(--n-lilac))]" aria-hidden />
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
            <M.Item key={it.label} onSelect={it.run} className={cn(item, '[&>svg]:text-[rgb(var(--n-muted))]')}>
              {it.icon}
              {it.label}
            </M.Item>
          ))}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

type Opener = (e: MouseEvent<HTMLElement>) => void;

function BellButton({ onOpen, open }: { onOpen: Opener; open: boolean }) {
  const unread = useUnreadCount();
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      data-icon="bell"
      className="k-hov-icon n1-raised n1-hoverable n1-ring relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[rgb(var(--n-muted))] hover:text-ink aria-expanded:bg-[rgb(var(--n-hover))] aria-expanded:text-ink"
    >
      <Bell weight="fill" className="h-5 w-5" aria-hidden />
      {unread > 0 && (
        <span aria-hidden className="num absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-[rgb(var(--n-bar))] bg-[#FF5C8A] px-1 text-12 font-extrabold leading-none text-ink">
          {unread}
        </span>
      )}
    </button>
  );
}

function AvatarButton({ onOpen, open }: { onOpen: Opener; open: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`Account, ${ACCOUNT.name}, ${ACCOUNT.rank.name} rank`}
      className="n1-raised n1-hoverable n1-ring relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] aria-expanded:bg-[rgb(var(--n-hover))]"
    >
      <img src="/art/avatars/john.webp" alt="" className="h-9 w-9 rounded-[10px] object-cover" />
      <img src="/brand/rank-bronze.png" alt="" className="absolute -bottom-1 -right-1 h-4 w-4 drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]" />
    </button>
  );
}

export function PhoneTopBar({ slim, onDeposit, onBell, onAccount, bellOpen, accountOpen }: { slim?: boolean; onDeposit: () => void; onBell: Opener; onAccount: Opener; bellOpen: boolean; accountOpen: boolean }) {
  const { pathname, search } = useLocation();
  if (slim) {
    return (
      <header className="n1-bar n1m-bar n1m-bar-slim">
        <AvatarButton onOpen={onAccount} open={accountOpen} />
        <div className="flex min-w-0 flex-1 justify-center">
          <Balance symbol onDeposit={onDeposit} />
        </div>
        <BellButton onOpen={onBell} open={bellOpen} />
      </header>
    );
  }
  return (
    <header className="n1-bar n1m-bar">
      <Link
        to={{ pathname, search }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Lusty Lagoon, lobby"
        className="n1-ring mr-auto flex h-11 shrink-0 items-center rounded-[8px]"
      >
        <Logo className="text-18 leading-[19px]" />
      </Link>
      <div className="flex min-w-0 items-center gap-1">
        <Balance onDeposit={onDeposit} />
        <Key tone="orange" size={48} onClick={onDeposit} aria-label="Deposit" data-icon="plus" className="k-hov-icon h-11 w-11 shrink-0 rounded-[12px] px-0">
          <Plus weight="bold" className="h-5 w-5" aria-hidden />
        </Key>
      </div>
      <BellButton onOpen={onBell} open={bellOpen} />
      <AvatarButton onOpen={onAccount} open={accountOpen} />
    </header>
  );
}
