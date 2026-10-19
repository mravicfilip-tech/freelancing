import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

// Empty, error and no access states. An icon, one headline, one sentence, and at most one action.
export function Message({ icon, title, body, action, className }: { icon: ReactNode; title: string; body: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-16 text-center', className)}>
      {icon}
      <p className="text-18 font-semibold text-ink">{title}</p>
      <p className="max-w-md text-16 text-ink2">{body}</p>
      {action}
    </div>
  );
}
