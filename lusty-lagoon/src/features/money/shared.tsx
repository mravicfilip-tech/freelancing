import { useMemo, type ReactNode } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';
import type { useWallet } from '../wallet/store';

// Small pieces the four money screens share. Nothing here belongs in components/ui yet, the main
// thread can lift SummaryCard and SummaryRow if the wallet wants the same.

// URL switches for screenshots, read once on load.
//   ?state=loading|error|empty|large
export type ViewSwitch = 'loading' | 'error' | 'empty' | 'large' | null;

export const readQuery = () => new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);

export function useViewSwitch(): ViewSwitch {
  return useMemo(() => {
    const v = readQuery().get('state');
    return v === 'loading' || v === 'error' || v === 'empty' || v === 'large' ? v : null;
  }, []);
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Step heading. Focus lands here when the step changes, so keyboard and screen reader users arrive
// on the new content.
export function StepHeading({ id = 'step-title', title, lead }: { id?: string; title: string; lead?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 id={id} tabIndex={-1} className="font-display text-24 font-semibold text-ink outline-none">
        {title}
      </h2>
      {lead && <p className="text-16 text-ink2">{lead}</p>}
    </div>
  );
}

export function SummaryRow({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', strong && 'border-t border-line pt-4')}>
      <dt className={cn('shrink-0 text-14', strong ? 'font-semibold text-ink' : 'text-ink2')}>{label}</dt>
      <dd className={cn('num min-w-0 break-words text-right text-ink', strong ? 'text-20 font-semibold' : 'text-16')}>{children}</dd>
    </div>
  );
}

export function SummaryCard({ id, title, chip, children, className }: { id: string; title: string; chip?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <aside aria-labelledby={id} className={cn('flex flex-col gap-6 rounded-2xl border border-line bg-panel p-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="font-display text-20 font-semibold text-ink">
          {title}
        </h2>
        {chip}
      </div>
      {children}
    </aside>
  );
}

export const Panel = ({ children, className, label }: { children: ReactNode; className?: string; label?: string }) => (
  <section aria-label={label} className={cn('flex flex-col gap-8 rounded-2xl border border-line bg-panel p-6', className)}>
    {children}
  </section>
);

export const initialsOf = (name: string) =>
  name
    .replace(/\(.*\)/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

// The wallet store's record() only takes its own Transaction type, which has no shape for an agent
// send, a tip or a gift code. update() with an id that matches nothing leaves the history alone and
// still moves the balance, so the top bar stays true without touching the wallet feature.
/** Records a move in the wallet history and changes the balance in one step. */
export function recordMove(
  wallet: ReturnType<typeof useWallet>,
  move: { id: string; direction: 'deposit' | 'withdraw'; label: string; icon: 'agent' | 'tip' | 'gift'; amount: number; status: 'pending' | 'completed' | 'declined'; reference: string },
) {
  const change = move.status === 'declined' ? 0 : move.direction === 'deposit' ? move.amount : -move.amount;
  wallet.record(
    { id: move.id, direction: move.direction, method: { kind: 'move', label: move.label, icon: move.icon }, amount: move.amount, value: move.amount, status: move.status, date: new Date().toISOString().slice(0, 19), reference: move.reference },
    change,
  );
}

export const FieldNote = ({ children }: { children: ReactNode }) => (
  <p role="alert" className="flex items-start gap-2 text-14 text-danger">
    <WarningCircle weight="bold" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
    <span>{children}</span>
  </p>
);
