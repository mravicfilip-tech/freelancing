import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Receipt, WarningCircle } from '@phosphor-icons/react';
import { MethodLogo } from '../../../components/ui/MethodLogo';
import { methodLabel, type Transaction } from '../../../data/wallet';
import { formatAmount, formatDate } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { useWallet } from '../../wallet/store';
import { Note, Skel, Title } from './ui';

// The third panel in the vault at 1920, the trading shot's right hand table. The last transactions
// from the wallet store, the labels in one sunken pill bar, a row per move with its method, the
// signed amount and a status word where it is not done. At 1440 the panel leaves and All
// transactions in the balance card leads to the same history.

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0C13]';

function Row({ tx }: { tx: Transaction }) {
  const dep = tx.direction === 'deposit';
  const d = formatDate(tx.date);
  const declined = tx.status === 'declined';
  return (
    <li className="gv-rule flex h-[60px] items-center gap-3 border-t px-4 first:border-t-0">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
        <MethodLogo selection={tx.method} size="sm" />
        <span aria-hidden className={cn('absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[#100E15]', dep ? 'bg-[#38EE59] text-[#0B2A14]' : 'bg-[#B47CFF] text-[#1A0F2B]')}>
          {dep ? <ArrowDownLeft weight="bold" className="h-[10px] w-[10px]" /> : <ArrowUpRight weight="bold" className="h-[10px] w-[10px]" />}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-14 font-semibold text-white">{dep ? 'Deposit' : 'Withdrawal'}</span>
        <span className="num truncate text-12 text-[rgb(var(--gv-ink-3))]">
          {methodLabel(tx.method, tx.networkId)}, {d.day}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className={cn('num text-14 font-semibold', declined ? 'text-[rgb(var(--gv-ink-3))] line-through decoration-1' : dep ? 'text-[#38EE59]' : 'text-white')}>
          {dep ? '+' : '−'}
          {formatAmount(tx.value)}
        </span>
        {tx.status === 'pending' ? (
          <span className="text-12 font-semibold text-[rgb(var(--gv-violet))]">Pending</span>
        ) : declined ? (
          <span className="text-12 font-semibold text-[#FF8FA3]">Declined</span>
        ) : (
          <span className="num text-12 text-[rgb(var(--gv-ink-3))]">{d.time}</span>
        )}
      </span>
    </li>
  );
}

export function Activity({ className }: { className?: string }) {
  const { transactions, historyState, retryHistory } = useWallet();
  const last = transactions.slice(0, 6);
  return (
    <section aria-labelledby="act-title" className={cn('gv-glass gv-edge flex-col gap-4 overflow-hidden rounded-3xl p-4', className)}>
      <div className="flex h-10 items-center justify-between pl-2">
        <Title id="act-title">Recent activity</Title>
        <Link to="/wallet/deposit" className={cn('group inline-flex items-center gap-1 rounded-full px-2 text-14 font-semibold text-[rgb(var(--gv-ink-2))] hover:text-white', FOCUS)}>
          All
          <ArrowRight weight="bold" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[2px]" aria-hidden />
        </Link>
      </div>
      <div aria-hidden className="gv-thead flex h-11 shrink-0 items-center justify-between rounded-full px-6 text-14 font-medium text-[rgb(var(--gv-ink-2))]">
        <span>Transaction</span>
        <span>Amount</span>
      </div>
      {historyState === 'loading' ? (
        <div className="flex flex-col gap-2 px-3" role="status" aria-label="Loading transactions">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex h-[52px] items-center gap-3">
              <Skel className="h-10 w-10 rounded-full" />
              <span className="flex flex-1 flex-col gap-2">
                <Skel className="h-4 w-[96px] rounded-full" />
                <Skel className="h-[12px] w-[140px] rounded-full" />
              </span>
            </div>
          ))}
        </div>
      ) : historyState === 'error' ? (
        <Note
          className="flex-1"
          icon={<WarningCircle weight="fill" className="text-[#FF7A88]" aria-hidden />}
          title="Transactions did not load"
          body="Your balance is right. The list comes back on a retry."
          action={
            <button type="button" onClick={retryHistory} className={cn('gv-pill mt-1 inline-flex h-10 items-center rounded-full px-4 text-14 font-semibold text-white', FOCUS)}>
              Try again
            </button>
          }
        />
      ) : last.length === 0 ? (
        <Note className="flex-1" icon={<Receipt weight="regular" className="text-[rgb(var(--gv-ink-2))]" aria-hidden />} title="No transactions yet" body="Deposits and withdrawals show up here the moment they land." />
      ) : (
        <ul aria-label="Last transactions" className="-mx-1">
          {last.map((t) => (
            <Row key={t.id} tx={t} />
          ))}
        </ul>
      )}
    </section>
  );
}
