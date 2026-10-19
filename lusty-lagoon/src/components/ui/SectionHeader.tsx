import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function SectionHeader({ id, title, action, className }: { id?: string; title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <h2 id={id} className="font-display text-24 font-semibold text-ink">
        {title}
      </h2>
      {action}
    </div>
  );
}
