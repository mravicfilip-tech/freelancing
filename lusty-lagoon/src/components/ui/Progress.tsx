import { cn } from '../../lib/cn';

// A flat fill on a flat track. The number is printed beside it by the caller, the bar only shows it.
export function Progress({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('h-[var(--bl-sp-8)] w-full overflow-hidden rounded-full bg-raised', className)}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}
