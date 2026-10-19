import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';

// The angular parts the floor is built from. Each one draws its shape on a face behind the label,
// so text stays upright and the focus ring can follow the lean, which a clip path would cut away.

type KeyProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** orange is the one primary action of a section, purple the secondary, quiet sits on the surface. */
  tone?: 'orange' | 'purple' | 'quiet';
  /** slant is a parallelogram, trap the CS2 Upgrade trapezoid, wide at the top. */
  shape?: 'slant' | 'trap';
  size?: 'md' | 'lg';
  loading?: boolean;
};

/**
 * The tactile key on an angled face. The kit's recipe, two close stops lighter at the top, a 1px
 * inner top light, a 2px darker inner bottom edge and a dark label at 800. Hover brightens, pressed
 * moves down 1px and drops the bottom edge.
 */
export const Key = forwardRef<HTMLButtonElement, KeyProps>(function Key({ tone = 'orange', shape = 'slant', size = 'md', loading, disabled, className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'v4-key inline-flex select-none items-center justify-center gap-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45',
        `v4-key-${tone}`,
        shape === 'slant' ? 'v4-slant v4-focus' : 'v4-trap',
        size === 'md' ? 'h-[48px] px-8 text-16' : 'h-[52px] px-12 text-16',
        className,
      )}
      {...rest}
    >
      {shape === 'trap' && (
        <>
          <span aria-hidden className="v4-trap-ring" />
          <span aria-hidden className="v4-trap-gap" />
        </>
      )}
      <span aria-hidden className="v4-key-face" />
      {shape === 'slant' && <span aria-hidden className="v4-ring" />}
      {loading && <CircleNotch weight="bold" className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

/** A parallelogram face for tabs and chips. On is the purple selection, off is bare until hover. */
export function Face({ on, className }: { on?: boolean; className?: string }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'v4-face',
          on ? 'border border-[#B47CFF]/50 bg-[#B47CFF]/[0.16]' : 'border border-transparent bg-white/0 group-hover:border-white/[0.06] group-hover:bg-white/[0.05]',
          className,
        )}
      />
      <span aria-hidden className="v4-ring" />
    </>
  );
}

/** A small grey caps label, CS2's "Balance" over its number. */
export function Caps({ children, className, as: Tag = 'span' }: { children: ReactNode; className?: string; as?: 'span' | 'p' | 'dt' }) {
  return <Tag className={cn('text-12 font-bold uppercase leading-4 tracking-[0.08em] text-[rgb(var(--v4-label))]', className)}>{children}</Tag>;
}

/**
 * A section head in an angled tab, CS2's Inventory head. The title strip slopes down at its right
 * end and sits on a rule that runs the full width, with the section's controls on the right.
 */
export function SectionTab({ id, icon, title, meta, children, className }: { id: string; icon: ReactNode; title: string; meta?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('relative flex h-[56px] items-stretch border-b border-white/[0.07]', className)}>
      <div className="v4-tab flex min-w-[320px] items-center gap-3 pl-6 pr-16">
        <span aria-hidden className="flex h-6 w-6 items-center justify-center text-[#C9A2FF] [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </span>
        <h2 id={id} className="font-display text-20 font-bold uppercase leading-6 tracking-[0.02em] text-ink">
          {title}
        </h2>
        {meta}
      </div>
      {children && <div className="ml-auto flex items-center gap-3 pl-6">{children}</div>}
    </div>
  );
}

/** A small slate value chip beside a tab label, CS2's "$1,502.30" beside Jackpot. */
export function ValueChip({ children, on, className }: { children: ReactNode; on?: boolean; className?: string }) {
  return (
    <span className={cn('num relative z-[1] flex h-6 items-center gap-[6px] rounded-[3px] px-2 text-12 font-bold leading-none', on ? 'bg-[#B47CFF]/25 text-ink' : 'bg-white/[0.07] text-[rgb(var(--v4-soft))]', className)}>
      {children}
    </span>
  );
}

/** A square icon control on the raised slate, radius 4, with the inner top light. */
export const IconBox = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { size?: 40 | 48 }>(function IconBox({ size = 48, className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'v4-toplight relative flex shrink-0 items-center justify-center rounded-[4px] border border-white/[0.07] bg-[rgb(var(--v4-raised))] text-[rgb(var(--v4-muted))] outline-none transition-colors duration-150 hover:border-white/[0.14] hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0D14] disabled:cursor-not-allowed disabled:opacity-45 data-[state=open]:border-white/[0.14] data-[state=open]:text-ink',
        size === 48 ? 'h-[48px] w-12' : 'h-10 w-10',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

/** A ring of short ticks and a hue arc, CS2's WIN dial, set behind a room's art. */
export function Dial({ hue, className }: { hue: string; className?: string }) {
  const id = `dial-${hue.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={cn('v4-dial pointer-events-none absolute', className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={hue} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="93" fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeDasharray="1.4 3.46" opacity="0.7" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="80" fill="none" stroke={hue} strokeWidth="2.5" strokeDasharray="330 503" transform="rotate(-210 100 100)" />
    </svg>
  );
}

/** A loading block in the floor's slate. */
export function Skel({ className }: { className?: string }) {
  return <span aria-hidden className={cn('v4-skel block rounded-[4px]', className)} />;
}
