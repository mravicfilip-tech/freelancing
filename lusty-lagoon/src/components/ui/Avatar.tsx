import { cn } from '../../lib/cn';

export function Avatar({ initials, size = 'md', className }: { initials: string; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-tonal font-semibold text-ink',
        size === 'sm' ? 'h-8 w-8 text-14' : 'h-10 w-10 text-16',
        className,
      )}
    >
      {initials}
    </span>
  );
}
