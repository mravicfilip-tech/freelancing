import { forwardRef, useMemo, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { HoverFx } from '../kit/hover';

// Small parts only the Glass vault uses. Panel titles in sentence case at 20, the vault's key, the
// glass segmented tabs, the one light a panel may carry, and the skeleton block.

/** True when a shot or a board asked the page to hold still. */
export function useStill() {
  return useMemo(() => new URLSearchParams(window.location.search).has('still'), []);
}

/** A panel title, sentence case at 20 and weight 600, after the trading shot's Total Balance. */
export function Title({ id, children, className, as: Tag = 'h2' }: { id?: string; children: ReactNode; className?: string; as?: 'h2' | 'h3' }) {
  return (
    <Tag id={id} className={cn('flex items-center gap-3 text-20 font-semibold tracking-[-0.01em] text-white', className)}>
      {children}
    </Tag>
  );
}

/**
 * The vault's key (round 6, note 3). Orange is the primary with a dark label, purple the secondary
 * with a white one. Height, width and type size come from the call site, as with the kit key. The
 * orange key opts into the round 7 hover board, ?hover=1 to 4 (notes 10 and 16).
 */
export const Key = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'purple' }>(function Key({ tone = 'primary', type = 'button', className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'gv-key inline-flex select-none items-center justify-center gap-2 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--gv-ground))]',
        tone === 'purple' ? 'gv-key-purple' : 'k-hov',
        className,
      )}
      {...rest}
    >
      {tone === 'primary' && <HoverFx />}
      {children}
    </button>
  );
});

/** The small caps label over a value. */
export function Caps({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <span id={id} className={cn('text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--gv-ink-3))]', className)}>
      {children}
    </span>
  );
}

/** Glass segmented tabs. The picked tab takes the lit edge, the same treatment as the active nav row. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  controls,
  className,
}: {
  items: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  controls?: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('gv-well flex h-[44px] items-center gap-1 rounded-full p-[3px]', className)}>
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
            className={cn(
              'flex h-[38px] items-center gap-2 whitespace-nowrap rounded-full px-4 text-14 font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#B47CFF]',
              on ? 'gv-on text-white' : 'text-[rgb(var(--gv-ink-2))] hover:text-white',
            )}
          >
            {t.icon && <span className={cn('flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4', on && 'text-[rgb(var(--gv-violet))]')}>{t.icon}</span>}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// Lights are purple or orange only, never gold (taste log 2026-10-19 20:40).
const HUES = {
  purple: '141 38 231',
  ember: '255 106 26',
} as const;
export type LightHue = keyof typeof HUES;

/**
 * The one light a panel may carry. A soft radial just inside one edge and a short lit segment of the
 * edge where it enters, after the task card's green row light and Cloudbet's card foot. The segment
 * peaks at 35 percent, so it reads as light on the edge and not as a line (round 6, note 1).
 */
export function Light({ hue, x = '50%', y = '0%', size = '60% 90%', strength = 0.3, edge = 'top', segment = '40%', segAt = '50%' }: { hue: LightHue; x?: string; y?: string; size?: string; strength?: number; edge?: 'top' | 'bottom' | 'none'; segment?: string; segAt?: string }) {
  const c = HUES[hue];
  const style: CSSProperties = { backgroundImage: `radial-gradient(${size} at ${x} ${y}, rgb(${c} / ${strength}), rgb(${c} / ${strength * 0.35}) 45%, rgb(${c} / 0) 100%)` };
  const seg: CSSProperties = {
    width: segment,
    left: `calc(${segAt} - ${segment} / 2)`,
    [edge === 'bottom' ? 'bottom' : 'top']: 0,
    background: `linear-gradient(90deg, rgb(${c} / 0), rgb(${c} / 0.35), rgb(${c} / 0))`,
  };
  return (
    <>
      <span aria-hidden className="gv-light" style={style} />
      {edge !== 'none' && <span aria-hidden className="gv-seg" style={seg} />}
    </>
  );
}

/** A loading block in the shape it stands for. */
export function Skel({ className }: { className?: string }) {
  return <span aria-hidden className={cn('gv-skel block rounded-[12px]', className)} />;
}

/** A centred message for an empty or failed panel. One icon, one line, one sentence, one action at most. */
export function Note({ icon, title, body, action, className }: { icon: ReactNode; title: string; body: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 text-center', className)}>
      <span className="gv-well flex h-[48px] w-[48px] items-center justify-center rounded-full [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      <p className="text-16 font-semibold text-white">{title}</p>
      <p className="max-w-[320px] text-14 text-[rgb(var(--gv-ink-2))]">{body}</p>
      {action}
    </div>
  );
}

export const handle = (name: string) => `@${name.replace(/\s|\./g, '').toLowerCase()}`;
