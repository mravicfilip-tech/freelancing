import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Eye, EyeSlash, TrendUp, WarningCircle } from '@phosphor-icons/react';
import { MethodLogo } from '../../../components/ui/MethodLogo';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ACCOUNT, methodLabel, type Transaction } from '../../../data/wallet';
import { formatAmount, formatDate } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { useWallet } from '../../wallet/store';
import { Coin, KitButton } from '../kit/parts';

// The signature. The balance set as type, Bai Jamjuree Bold at 64px, tabular, the cents a step
// quieter and the currency small beside it, the day's result under it. One cut-out, girl-wrap,
// stands at the card's right edge, her head past its top, her legs behind the transactions box.

/** The day's result so far, the Sugar Rush session of 12 minutes ago. */
const TODAY = 60;

const STATUS = {
  completed: { label: 'Completed', cls: 'text-win bg-win/10' },
  pending: { label: 'Pending', cls: 'text-pending bg-pending/10' },
  declined: { label: 'Declined', cls: 'text-[#FF8FA3] bg-danger/15' },
} as const;

function TxRow({ tx }: { tx: Transaction }) {
  const dep = tx.direction === 'deposit';
  const d = formatDate(tx.date);
  const st = STATUS[tx.status];
  return (
    <li className="flex h-[52px] items-center gap-3 border-t border-ink/5 first:border-t-0">
      <span className="relative flex w-12 shrink-0 justify-center">
        <MethodLogo selection={tx.method} size="md" />
        <span aria-hidden className={cn('absolute -bottom-1 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[rgb(var(--k-item))]', dep ? 'bg-win text-[#0B2A14]' : 'bg-[#B47CFF] text-[#1A0F2B]')}>
          {dep ? <ArrowDownLeft weight="bold" className="h-[10px] w-[10px]" /> : <ArrowUpRight weight="bold" className="h-[10px] w-[10px]" />}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-14 font-bold leading-5 text-ink">{dep ? 'Deposit' : 'Withdrawal'}</span>
        <span className="num truncate text-12 font-semibold leading-4 text-[rgb(var(--k-muted))]">
          {methodLabel(tx.method, tx.networkId)}, {d.day}, {d.time}
        </span>
      </span>
      <span className={cn('rounded-[8px] px-2 py-0.5 text-12 font-bold leading-4', st.cls)}>{st.label}</span>
      <span className={cn('num w-[84px] shrink-0 text-right text-16 font-bold', tx.status === 'declined' ? 'text-[rgb(var(--k-dim))] line-through decoration-1' : dep ? 'text-win' : 'text-ink')}>
        {dep ? '+' : '−'}
        {formatAmount(tx.value)}
      </span>
    </li>
  );
}

function Recent() {
  const { transactions, historyState, retryHistory } = useWallet();
  const last = transactions.slice(0, 3);
  return (
    <div className="relative z-10 rounded-[16px] bg-[rgb(var(--k-item))] px-4 pb-1 pt-3">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-14 font-bold text-ink">Last transactions</h3>
        <Link to="/wallet/deposit" className="rounded-[6px] text-14 font-bold text-accent hover:text-ink">
          All transactions
        </Link>
      </div>
      {historyState === 'loading' ? (
        <div className="flex flex-col gap-2 py-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-[10px]" />
          ))}
        </div>
      ) : historyState === 'error' ? (
        <div className="flex h-[156px] flex-col items-center justify-center gap-2 text-center">
          <WarningCircle weight="fill" className="h-6 w-6 text-danger" aria-hidden />
          <p className="text-14 font-semibold text-ink">Transactions did not load</p>
          <KitButton tone="dark" size="sm" onClick={retryHistory} className="bg-[rgb(var(--k-panel))]">
            Try again
          </KitButton>
        </div>
      ) : last.length === 0 ? (
        <p className="flex h-[156px] items-center justify-center text-14 font-semibold text-[rgb(var(--k-muted))]">No deposits or withdrawals yet.</p>
      ) : (
        <ul aria-label="Last three transactions">
          {last.map((t) => (
            <TxRow key={t.id} tx={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function BalanceCard() {
  const navigate = useNavigate();
  const { balance } = useWallet();
  const [hidden, setHidden] = useState(false);
  const [whole, cents] = formatAmount(balance).split('.');
  return (
    <section aria-labelledby="bal-title" className="relative flex flex-col justify-between gap-4 rounded-[24px] bg-[rgb(var(--k-panel))] p-[20px]">
      {/* The cut-out. Its frame reaches past the card's top so her head breaks out, and is clipped at the card's bottom. */}
      <div aria-hidden className="pointer-events-none absolute -top-6 bottom-0 right-0 w-[300px] overflow-hidden rounded-br-[24px]">
        <span className="absolute right-[-72px] top-[64px] h-[320px] w-[320px] rounded-full bg-[rgb(var(--k-item))]/70" />
        <img src="/art/landing/girl-wrap.webp" alt="" className="absolute right-[-60px] top-0 h-[520px] w-auto max-w-none" />
      </div>

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 id="bal-title" className="text-16 font-bold text-[rgb(var(--k-muted))]">
            Balance
          </h2>
          <button
            type="button"
            aria-pressed={hidden}
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
            onClick={() => setHidden((h) => !h)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item))] hover:text-ink"
          >
            {hidden ? <EyeSlash weight="bold" className="h-4 w-4" aria-hidden /> : <Eye weight="bold" className="h-4 w-4" aria-hidden />}
          </button>
        </div>
        <p className="flex items-end gap-3">
          <span className="num font-display text-[64px] font-bold leading-[60px] tracking-[-0.02em] text-ink">
            {hidden ? (
              '••••••'
            ) : (
              <>
                {whole}
                <span className="text-[rgb(var(--k-muted))]">.{cents}</span>
              </>
            )}
          </span>
          <span className="mb-1 flex items-center gap-2">
            <Coin id="usdt" size={24} />
            <span className="font-display text-20 font-bold text-[rgb(var(--k-muted))]">{ACCOUNT.currency}</span>
          </span>
        </p>
        <p className="flex items-center gap-2">
          <span className="num inline-flex h-8 items-center gap-1 rounded-[8px] bg-win/10 px-2 text-14 font-bold text-win">
            <TrendUp weight="bold" className="h-4 w-4" aria-hidden />+{formatAmount(TODAY)}
          </span>
          <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">today, from Sugar Rush</span>
        </p>
        <div className="mt-1 flex gap-2">
          <KitButton tone="purple" size="md" onClick={() => navigate('/wallet/withdraw')} className="h-11 w-[132px]">
            Withdraw
          </KitButton>
          <KitButton tone="dark" size="md" onClick={() => navigate('/agent')} className="h-11 px-[20px]">
            Send to agent
          </KitButton>
        </div>
      </div>

      <Recent />
    </section>
  );
}
