import { forwardRef, useMemo, type ButtonHTMLAttributes, type ReactNode } from 'react';
import * as D from '@radix-ui/react-dialog';
import { CircleNotch, X } from '@phosphor-icons/react';
import { coinById, type CoinId } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import './neon.css';

// Small parts the Neon arcade page composes. Everything sits on the seven size ramp, 12, 14, 16,
// 20, 28, 40 and 56, with tabular numbers. Round 6 adds the page's own key and the variant 5 tabs.

export const handle = (name: string) => `@${name.replace(/\s|\./g, '').toLowerCase()}`;

/** True when the page is asked for a still frame with ?still, for shots. */
export function useStill() {
  return useMemo(() => new URLSearchParams(window.location.search).has('still'), []);
}

type KeyProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'orange' | 'purple' | 'quiet'; size?: 36 | 48 | 56; loading?: boolean };

/**
 * The page's key, round 6. The sleek kit key built in the folder (taste log 20:40). Orange is the one
 * primary per section with a dark label, purple the secondary, quiet sits on the surface with an edge.
 */
export const Key = forwardRef<HTMLButtonElement, KeyProps>(function Key({ tone = 'purple', size = 48, loading, disabled, className, children, type = 'button', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'n1-key inline-flex select-none items-center justify-center gap-2 whitespace-nowrap',
        `n1-key-${tone}`,
        size === 36 && 'h-9 rounded-[10px] px-4 text-14',
        size === 48 && 'h-[48px] rounded-[12px] px-6 text-16',
        size === 56 && 'h-[56px] rounded-[14px] px-8 text-16',
        className,
      )}
      {...rest}
    >
      {loading && <CircleNotch weight="bold" className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

/** Tabs in one sunken well with a lit pill on, after variant 5's Live wagers. */
export function Tabs<T extends string>({ items, value, onChange, label, controls, className }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; controls?: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn('n1-tabs flex h-11 items-center gap-1 rounded-full p-[3px]', className)}>
      {items.map((t) => {
        const on = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={controls}
            onClick={() => onChange(t.value)}
            className={cn('n1-ring flex h-[38px] items-center whitespace-nowrap rounded-full px-4 text-14 font-semibold transition-colors duration-200', on ? 'n1-tab-on text-ink' : 'text-[rgb(var(--n-muted))] hover:text-ink')}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function Live({ className }: { className?: string }) {
  return <span aria-hidden className={cn('n1-live', className)} />;
}

export function Label({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <p id={id} className={cn('n1-label', className)}>
      {children}
    </p>
  );
}

export function Skel({ className }: { className?: string }) {
  return <span aria-hidden className={cn('n1-skel block', className)} />;
}

/** A coin icon, flat. */
export function CoinIcon({ id, size = 16, className }: { id: CoinId; size?: number; className?: string }) {
  return <img src={coinById(id).icon} alt="" width={size} height={size} className={cn('shrink-0 rounded-full', className)} />;
}

/** The coin symbol in a small chip, Snegbet's SNEG chip. */
export function CoinChip({ id, className }: { id: CoinId; className?: string }) {
  return <span className={cn('inline-flex h-5 items-center rounded-[6px] bg-white/[0.08] px-[6px] text-12 font-bold leading-none text-[rgb(var(--n-muted))]', className)}>{coinById(id).symbol}</span>;
}

/** An amount written the way a coin wants it, with the right number of decimals. */
export function amountText(coin: CoinId, amount: number) {
  const c = coinById(coin);
  const digits = c.decimals > 2 && amount < 100 ? (amount < 1 ? 4 : 2) : amount >= 1000 ? 0 : 2;
  return formatAmount(amount, digits);
}

/** A square icon button on the raised surface, with an edge. */
export function IconSquare({ label, children, onClick, className, size = 44, pressed }: { label: string; children: ReactNode; onClick?: () => void; className?: string; size?: 36 | 44 | 48; pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'n1-raised n1-hoverable n1-ring relative flex shrink-0 items-center justify-center rounded-[12px] text-[rgb(var(--n-muted))] hover:text-ink',
        size === 48 ? 'h-[48px] w-12' : size === 44 ? 'h-11 w-11' : 'h-9 w-9 rounded-[10px]',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Pill segments, one vivid purple pill on. Works as a radio group or as tabs. */
export function Segments<T extends string>({
  items,
  value,
  onChange,
  label,
  as = 'radio',
  size = 44,
  className,
}: {
  items: { value: T; label: string; icon?: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  as?: 'radio' | 'tab';
  size?: 36 | 44;
  className?: string;
}) {
  return (
    <div role={as === 'radio' ? 'radiogroup' : 'tablist'} aria-label={label} className={cn('flex gap-2', className)}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role={as}
            aria-checked={as === 'radio' ? on : undefined}
            aria-selected={as === 'tab' ? on : undefined}
            onClick={() => onChange(it.value)}
            className={cn(
              'n1-ring flex shrink-0 items-center gap-2 rounded-full font-bold transition-colors',
              size === 44 ? 'h-11 px-4 text-14' : 'h-9 px-4 text-14',
              on ? 'n1-pill-on' : 'n1-pill-off',
            )}
          >
            {it.icon && <span className={cn('flex h-[18px] w-[18px] items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]', on ? 'text-ink' : 'text-[rgb(var(--n-dim))]')}>{it.icon}</span>}
            {it.label}
            {it.count !== undefined && <span className={cn('num text-12', on ? 'text-ink/80' : 'text-[rgb(var(--n-dim))]')}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A leaderboard place. Gold, silver and bronze keys for the top three, a quiet square after. */
export function RankBadge({ place, size = 36 }: { place: number; size?: 28 | 36 }) {
  return (
    <span
      aria-label={`Place ${place}`}
      className={cn(
        'num flex shrink-0 items-center justify-center rounded-[10px] font-extrabold',
        size === 36 ? 'h-9 w-9 text-14' : 'h-[28px] w-[28px] rounded-[8px] text-12',
        place === 1 ? 'n1-rank-1' : place === 2 ? 'n1-rank-2' : place === 3 ? 'n1-rank-3' : 'n1-raised text-ink',
      )}
    >
      {place}
    </span>
  );
}

/** An avatar with its level badge, Snegbet's chat avatars. */
export function Avatar({ src, initials, level, size = 36, className }: { src?: string; initials: string; level?: number | string; size?: 28 | 36; className?: string }) {
  const high = typeof level === 'number' && level >= 30;
  return (
    <span className={cn('relative shrink-0', size === 36 ? 'h-9 w-9' : 'h-[28px] w-[28px]', className)}>
      {src ? (
        <img src={src} alt="" className={cn('h-full w-full rounded-[10px] object-cover', size === 28 && 'rounded-full')} />
      ) : (
        <span className={cn('flex h-full w-full items-center justify-center rounded-[10px] bg-[#5B2BC4] text-12 font-bold text-ink', size === 28 && 'rounded-full')}>{initials}</span>
      )}
      {level !== undefined && (
        <span
          aria-hidden
          className={cn(
            'num absolute -bottom-[6px] -right-[6px] flex h-[18px] min-w-[22px] items-center justify-center rounded-full border-2 border-[rgb(var(--n-panel))] px-1 text-12 font-extrabold leading-none text-ink',
            high ? 'bg-[#E8590C]' : typeof level === 'string' ? 'bg-[#6A43D8]' : 'bg-[#2F6FE8]',
          )}
        >
          {level}
        </span>
      )}
    </span>
  );
}

/** The page's own dialog shell, on the panel with the seven size ramp. Escape and Close both close it. */
export function NDialog({ open, onOpenChange, title, description, children, wide }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; children: ReactNode; wide?: boolean }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-40 bg-[#05031A]/80 backdrop-blur-[2px]" />
        <D.Content
          className={cn(
            'n1 n1-panel fixed left-1/2 top-1/2 z-40 flex max-h-[calc(100vh-64px)] w-full -translate-x-1/2 -translate-y-1/2 flex-col gap-6 overflow-y-auto rounded-[20px] p-6 shadow-[0_32px_80px_rgb(0_0_0/0.55)] outline-none',
            wide ? 'max-w-[560px]' : 'max-w-[480px]',
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <D.Title className="text-20 font-extrabold tracking-[-0.01em] text-ink">{title}</D.Title>
              {description ? <D.Description className="text-14 text-[rgb(var(--n-muted))]">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
            </div>
            <D.Close aria-label="Close" className="n1-raised n1-hoverable n1-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[rgb(var(--n-muted))] hover:text-ink">
              <X weight="bold" className="h-4 w-4" aria-hidden />
            </D.Close>
          </div>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** Empty and error states inside a panel. An icon, one headline, one sentence, at most one action. */
export function NMessage({ icon, title, body, action, className }: { icon: ReactNode; title: string; body: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      <span className="n1-raised flex h-[48px] w-12 items-center justify-center rounded-[12px] [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      <p className="text-16 font-extrabold text-ink">{title}</p>
      <p className="max-w-[380px] text-14 text-[rgb(var(--n-muted))]">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
