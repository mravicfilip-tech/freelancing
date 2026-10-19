import { useState } from 'react';
import * as RG from '@radix-ui/react-radio-group';
import { ArrowDownLeft, ArrowUpRight, Copy, Receipt, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { MethodLogo } from '../../components/ui/MethodLogo';
import { Message } from '../../components/ui/Message';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusChip } from '../../components/ui/StatusChip';
import { Tooltip } from '../../components/ui/Tooltip';
import { coinById, methodLabel, type Transaction } from '../../data/wallet';
import { formatAmount, formatDate, formatUsd, middleTruncate } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useWallet } from './store';

type Filter = 'all' | 'deposit' | 'withdraw';
const PAGE = 10;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'withdraw', label: 'Withdrawals' },
];

function Amount({ tx }: { tx: Transaction }) {
  const sign = tx.direction === 'deposit' ? '+' : '−';
  const coin = tx.method.kind === 'coin' ? coinById(tx.method.coinId) : null;
  const main = coin
    ? `${sign}${formatAmount(tx.amount, coin.decimals)} ${coin.symbol}`
    : tx.method.kind === 'move'
      ? `${sign}${formatAmount(tx.amount)} USDT`
      : `${sign}${formatUsd(tx.amount)}`;
  const tone = tx.status === 'declined' ? 'text-ink3' : tx.direction === 'deposit' && tx.status === 'completed' ? 'text-success' : 'text-ink';
  return (
    <div className="flex flex-col items-end">
      <span className={cn('num text-16 font-semibold', tone)}>{main}</span>
      {coin && coin.symbol !== 'USDT' && <span className="num text-14 text-ink3">{formatAmount(tx.value)} USDT</span>}
    </div>
  );
}

function Reference({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const long = value.length > 24;
  const text = long ? middleTruncate(value) : value;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // The value is still in the tooltip to select by hand.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-1">
      {long ? (
        <Tooltip content={<span className="break-all font-mono">{value}</span>}>
          <span tabIndex={0} className="inline-flex h-6 items-center rounded font-mono text-14 text-ink2">
            {text}
          </span>
        </Tooltip>
      ) : (
        <span className="font-mono text-14 text-ink2">{text}</span>
      )}
      <Button variant="quiet" size="sm" className="w-8 px-0" aria-label={copied ? 'Reference copied' : `Copy reference ${text}`} onClick={copy}>
        <Copy className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

export function TransactionHistory() {
  const { transactions, historyState, retryHistory } = useWallet();
  const [filter, setFilter] = useState<Filter>('all');
  const [shown, setShown] = useState(PAGE);
  const rows = transactions.filter((t) => filter === 'all' || t.direction === filter);
  const visible = rows.slice(0, shown);

  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <h2 id="history-title" className="font-display text-24 font-semibold text-ink">
          Transactions
        </h2>
        <RG.Root
          value={filter}
          onValueChange={(v) => {
            setFilter(v as Filter);
            setShown(PAGE);
          }}
          aria-label="Show"
          className="flex rounded-lg border border-line bg-sunken p-1"
        >
          {FILTERS.map((f) => (
            <RG.Item
              key={f.value}
              value={f.value}
              className="h-8 rounded px-3 text-14 font-medium text-ink2 transition-colors hover:text-ink data-[state=checked]:bg-raised data-[state=checked]:text-ink"
            >
              {f.label}
            </RG.Item>
          ))}
        </RG.Root>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-panel">
        {historyState === 'error' ? (
          <Message
            icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
            title="We could not load your transactions"
            body="Your balance is safe. Check your connection, then try again."
            action={
              <Button variant="secondary" onClick={retryHistory}>
                Try again
              </Button>
            }
          />
        ) : historyState === 'ready' && rows.length === 0 ? (
          <Message
            icon={<Receipt weight="fill" className="h-10 w-10 text-ink3" aria-hidden />}
            title={filter === 'withdraw' ? 'No withdrawals yet' : filter === 'deposit' ? 'No deposits yet' : 'No transactions yet'}
            body="Deposits and withdrawals show here the moment you make one, with their status."
          />
        ) : (
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Your deposits and withdrawals, newest first</caption>
            <thead className="bg-sunken">
              <tr className="text-14 font-medium text-ink3">
                <th scope="col" className="h-11 px-6">Type</th>
                <th scope="col" className="h-11 px-4">Method</th>
                <th scope="col" className="h-11 px-4 text-right">Amount</th>
                <th scope="col" className="h-11 px-4">Status</th>
                <th scope="col" className="h-11 px-4">Date</th>
                <th scope="col" className="h-11 px-6">Reference</th>
              </tr>
            </thead>
            <tbody>
              {historyState === 'loading'
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-t border-line">
                      {['w-24', 'w-24', 'w-16', 'w-24', 'w-16', 'w-24'].map((w, j) => (
                        <td key={j} className={cn('py-4', j === 0 || j === 5 ? 'px-6' : 'px-4')}>
                          <Skeleton className={cn('h-5', w)} />
                        </td>
                      ))}
                    </tr>
                  ))
                : visible.map((tx) => {
                    const d = formatDate(tx.date);
                    const dep = tx.direction === 'deposit';
                    const DirIcon = dep ? ArrowDownLeft : ArrowUpRight;
                    return (
                      <tr key={tx.id} className="border-t border-line transition-colors hover:bg-raised">
                        <td className="px-6 py-3">
                          <span className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-raised">
                              <DirIcon weight="bold" className="h-4 w-4 text-ink2" aria-hidden />
                            </span>
                            <span className="text-16 text-ink">{dep ? 'Deposit' : 'Withdrawal'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-3">
                            <MethodLogo selection={tx.method} size="sm" />
                            <span className="text-16 text-ink">{methodLabel(tx.method, tx.networkId)}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Amount tx={tx} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={tx.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex flex-col">
                            <span className="num text-16 text-ink">{d.day}</span>
                            <span className="num text-14 text-ink3">{d.time}</span>
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <Reference value={tx.reference} />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        )}
        {historyState === 'ready' && rows.length > PAGE && (
          <div className="flex items-center justify-between gap-4 border-t border-line px-6 py-4">
            <p className="num text-14 text-ink2" aria-live="polite">
              Showing {Math.min(shown, rows.length)} of {rows.length}
            </p>
            {shown < rows.length && (
              <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
                Show {Math.min(PAGE, rows.length - shown)} more
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
