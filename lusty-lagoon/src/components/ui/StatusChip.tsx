import { CheckCircle, Clock, XCircle } from '@phosphor-icons/react';
import type { TxStatus } from '../../data/wallet';
import { cn } from '../../lib/cn';

const LOOK: Record<TxStatus, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: 'Pending', Icon: Clock, tone: 'bg-pending/10 text-pending' },
  completed: { label: 'Completed', Icon: CheckCircle, tone: 'bg-success/10 text-success' },
  declined: { label: 'Declined', Icon: XCircle, tone: 'bg-danger/10 text-danger' },
};

export function StatusChip({ status, className }: { status: TxStatus; className?: string }) {
  const { label, Icon, tone } = LOOK[status];
  return (
    <span className={cn('inline-flex h-8 items-center gap-1 rounded-lg px-2 text-14 font-semibold', tone, className)}>
      <Icon weight="bold" className="h-4 w-4" aria-hidden />
      {label}
    </span>
  );
}
