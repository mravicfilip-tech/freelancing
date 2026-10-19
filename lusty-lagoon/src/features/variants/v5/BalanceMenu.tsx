import { useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import * as M from '@radix-ui/react-dropdown-menu';
import { ArrowCircleDown, ArrowCircleUp, CaretDown, Check, Wallet } from '@phosphor-icons/react';
import { coinById, type CoinId } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { useWallet } from '../../wallet/store';
import { AnimatedNumber, Coin } from '../kit/parts';

// The kit BalancePill's menu, rebuilt in glass. It picks the coin the balance shows in and leads to
// Deposit, Withdraw and the wallet. The pick holds for the browser tab, the same key the kit uses,
// and the hero and the top bar share it.

export const BALANCE_COINS: CoinId[] = ['usdt', 'btc', 'eth', 'usdc', 'ltc'];
const KEY = 'kit-balance-coin';

let current: CoinId = (() => {
  try {
    return (sessionStorage.getItem(KEY) as CoinId) || 'usdt';
  } catch {
    return 'usdt';
  }
})();
const listeners = new Set<() => void>();

function setCoin(id: CoinId) {
  current = id;
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* the pick just does not persist */
  }
  listeners.forEach((l) => l());
}

/** The coin the balance shows in, shared by every balance on the page. */
export function useBalanceCoin() {
  const coin = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  return [coin, setCoin] as const;
}

export const coinDigits = (id: CoinId) => {
  const c = coinById(id);
  return c.rate >= 1000 ? 6 : c.rate >= 50 ? 4 : 2;
};
export const inCoin = (usd: number, id: CoinId) => usd / coinById(id).rate;
export const coinAmount = (usd: number, id: CoinId) => formatAmount(inCoin(usd, id), coinDigits(id));

const ITEM = 'flex h-11 cursor-pointer select-none items-center gap-3 rounded-full px-4 text-14 font-medium text-white outline-none data-[highlighted]:bg-white/[0.07]';

/** The menu. As a chip it sits in the hero beside Total balance, as a pill it carries the amount in the top bar. */
export function BalanceMenu({ variant }: { variant: 'chip' | 'pill' }) {
  const navigate = useNavigate();
  const { balance } = useWallet();
  const [coin, pick] = useBalanceCoin();
  const c = coinById(coin);
  const label = `Balance ${coinAmount(balance, coin)} ${c.symbol}, change the coin shown`;
  return (
    <M.Root>
      <M.Trigger
        aria-label={label}
        className={cn(
          'gv-pill group flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] data-[state=open]:bg-white/[0.09]',
          variant === 'chip' ? 'h-10 gap-2 pl-[6px] pr-3' : 'h-[48px] gap-3 pl-2 pr-4',
        )}
      >
        <Coin id={coin} size={variant === 'chip' ? 28 : 32} />
        {variant === 'pill' &&
          (coin === 'usdt' ? (
            <AnimatedNumber value={balance} format={(n) => formatAmount(n)} className="text-16 font-semibold text-white" />
          ) : (
            <span className="num text-16 font-semibold text-white">{coinAmount(balance, coin)}</span>
          ))}
        <span className={cn('text-14 font-semibold', variant === 'chip' ? 'text-white' : 'text-[rgb(var(--gv-ink-2))]')}>{c.symbol}</span>
        <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--gv-ink-2))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
      </M.Trigger>
      <M.Portal>
        <M.Content align={variant === 'chip' ? 'start' : 'end'} sideOffset={10} className="z-30 w-[300px] rounded-[22px] border border-white/[0.06] bg-[#1A1328]/95 p-2 shadow-[0_24px_64px_rgb(0_0_0/0.3)] backdrop-blur-[24px]">
          <M.Label className="px-4 pb-2 pt-3 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--gv-ink-3))]">Show balance in</M.Label>
          <M.RadioGroup value={coin} onValueChange={(v) => pick(v as CoinId)}>
            {BALANCE_COINS.map((id) => (
              <M.RadioItem key={id} value={id} className={ITEM}>
                <Coin id={id} size={22} />
                <span className="flex-1 font-semibold">{coinById(id).symbol}</span>
                <span className="num text-[rgb(var(--gv-ink-2))]">{coinAmount(balance, id)}</span>
                <span className="flex w-4 justify-center">
                  <M.ItemIndicator>
                    <Check weight="bold" className="h-4 w-4 text-[rgb(var(--gv-violet))]" aria-hidden />
                  </M.ItemIndicator>
                </span>
              </M.RadioItem>
            ))}
          </M.RadioGroup>
          <M.Separator className="mx-3 my-2 h-px bg-white/[0.06]" />
          {[
            { label: 'Deposit', icon: <ArrowCircleDown weight="regular" className="h-5 w-5 text-[rgb(var(--gv-ink-2))]" aria-hidden />, to: '/wallet/deposit' },
            { label: 'Withdraw', icon: <ArrowCircleUp weight="regular" className="h-5 w-5 text-[rgb(var(--gv-ink-2))]" aria-hidden />, to: '/wallet/withdraw' },
            { label: 'Open wallet', icon: <Wallet weight="regular" className="h-5 w-5 text-[rgb(var(--gv-ink-2))]" aria-hidden />, to: '/wallet/deposit' },
          ].map((it) => (
            <M.Item key={it.label} onSelect={() => navigate(it.to)} className={ITEM}>
              {it.icon}
              {it.label}
            </M.Item>
          ))}
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}
