import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle, Clock, WarningCircle, XCircle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { MethodLogo } from '../../../components/ui/MethodLogo';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ACCOUNT, coinById, methodLabel, type Transaction } from '../../../data/wallet';
import { formatAmount, formatDate } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { useWallet } from '../../wallet/store';

// The signature. The balance is set as type, Bai Jamjuree at 64px, tabular, the cents a step
// quieter, with the currency small beside it. One cut-out stands at the right edge of the card.

/** The day's result so far, the Sugar Rush session of 12 minutes ago. */
const TODAY = 60;

const STATUS = {
  pending: { label: 'Pending', Icon: Clock, tone: 'text-pending' },
  completed: { label: 'Completed', Icon: CheckCircle, tone: 'text-ink2' },
  declined: { label: 'Declined', Icon: XCircle, tone: 'text-danger' },
} as const;

function StatusText({ status }: { status: Transaction['status'] }) {
  const { label, Icon, tone } = STATUS[status];
  return (
    <span className={cn('flex items-center gap-1 text-14 leading-5', tone)}>
      <Icon weight="bold" className="h-4 w-4" aria-hidden />
      {label}
    </span>
  );
}

function Recent({ tx }: { tx: Transaction }) {
  const dep = tx.direction === 'deposit';
  const d = formatDate(tx.date);
  return (
    <li className="flex h-[60px] items-center gap-4 border-b border-line/70 last:border-b-0">
      <MethodLogo selection={tx.method} size="md" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-16 font-medium leading-5 text-ink">{dep ? 'Deposit' : 'Withdrawal'}</span>
        <span className="num truncate text-14 leading-5 text-ink3">
          {methodLabel(tx.method, tx.networkId)}, {d.day}, {d.time}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className={cn('num text-16 font-semibold leading-5', tx.status === 'declined' ? 'text-ink3' : dep && tx.status === 'completed' ? 'text-success' : 'text-ink')}>
          {dep ? '+' : '−'}
          {formatAmount(tx.value)}
        </span>
        <StatusText status={tx.status} />
      </span>
    </li>
  );
}

function RecentList() {
  const { transactions, historyState, retryHistory } = useWallet();
  const last = transactions.slice(0, 3);
  return (
    <div className="flex min-w-0 max-w-[600px] flex-col border-l border-line pl-12">
      <div className="flex h-8 items-center justify-between">
        <h3 className="text-14 text-ink2">Last transactions</h3>
        <Link to="/wallet" className="flex items-center gap-1 rounded text-14 font-medium text-accent hover:text-ink">
          All transactions
          <ArrowUpRight weight="bold" className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {historyState === 'loading' ? (
        <div className="mt-1 flex flex-col gap-2" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[48px] w-full" />
          ))}
        </div>
      ) : historyState === 'error' ? (
        <div className="mt-2 flex items-center gap-3 text-14 text-ink2">
          <WarningCircle weight="fill" className="h-5 w-5 shrink-0 text-danger" aria-hidden />
          <span>We could not load your transactions.</span>
          <Button variant="tertiary" size="sm" onClick={retryHistory}>
            Try again
          </Button>
        </div>
      ) : last.length === 0 ? (
        <p className="mt-2 text-14 text-ink2">Nothing yet. A deposit shows up here the moment you make one.</p>
      ) : (
        <ul aria-label="Last three transactions" className="mt-1 flex flex-col">
          {last.map((tx) => (
            <Recent key={tx.id} tx={tx} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function BalanceCard() {
  const { balance } = useWallet();
  const [whole, cents] = balance.toFixed(2).split('.');
  const coin = coinById('usdt');
  return (
    <section aria-labelledby="v5-balance" className="relative overflow-hidden rounded-2xl border border-line bg-panel">
      {/* The cut-out stands at the right edge, cropped by the card at the hip. */}
      <img
        src="/art/auth/login-player.webp"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-8 top-4 h-[440px] max-w-none select-none"
        style={{ aspectRatio: '475 / 1000' }}
      />
      <div className="relative grid grid-cols-[380px_minmax(0,1fr)] gap-12 px-12 py-8 pr-[260px]">
        <div className="flex flex-col">
          <h2 id="v5-balance" className="text-16 text-ink2">
            Balance
          </h2>
          <Link
            to="/wallet"
            aria-label={`Balance ${formatAmount(balance)} ${ACCOUNT.currency}, open the wallet`}
            className="mt-2 flex w-fit items-baseline gap-3 rounded-lg"
            aria-live="polite"
          >
            <span className="num font-display text-[64px] font-semibold leading-[68px] tracking-[-0.02em] text-ink">
              {Number(whole.replace(/,/g, '')).toLocaleString('en-US')}
              <span className="text-ink2">.{cents}</span>
            </span>
            <span className="flex items-center gap-2 font-display text-24 font-medium text-ink2">
              <img src={coin.icon} alt="" width={28} height={28} className="h-[28px] w-[28px] self-center" />
              {ACCOUNT.currency}
            </span>
          </Link>
          <p className="num mt-2 text-16 font-medium text-win">
            {signed(TODAY)} <span className="font-normal text-ink2">today</span>
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg" className="w-[168px]" asChild>
              <Link to="/wallet/deposit">Deposit</Link>
            </Button>
            <Button size="lg" variant="secondary" className="w-[168px]" asChild>
              <Link to="/wallet/withdraw">Withdraw</Link>
            </Button>
          </div>
        </div>
        <RecentList />
      </div>
    </section>
  );
}

function signed(n: number) {
  return `${n >= 0 ? '+' : '−'}${formatAmount(Math.abs(n))}`;
}
