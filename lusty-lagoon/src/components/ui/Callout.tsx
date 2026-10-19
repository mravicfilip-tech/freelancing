import { Info, Warning } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

// A flat note with an icon. Warning is for anything that can lose money.
export function Callout({ tone = 'info', children, className }: { tone?: 'info' | 'warning'; children: ReactNode; className?: string }) {
  const Icon = tone === 'warning' ? Warning : Info;
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 text-14',
        tone === 'warning' ? 'border-pending/40 bg-pending/10 text-ink' : 'border-line bg-sunken text-ink2',
        className,
      )}
    >
      <Icon weight="bold" className={cn('mt-0.5 h-5 w-5 shrink-0', tone === 'warning' ? 'text-pending' : 'text-accent')} aria-hidden />
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
