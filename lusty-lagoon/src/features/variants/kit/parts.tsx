import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CaretDown, CaretLeft, CaretRight, Plus } from '@phosphor-icons/react';
import { coinById, type CoinId } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import './kit.css';

// The reference kit. Parts every dashboard variant composes, at the execution level of the ten
// reference screens. Boxed controls on a deep panel, rounded 14 to 24, heavy display capitals,
// vivid single hue tiles with our art breaking out of them.

export type Hue = 'purple' | 'gold' | 'blue' | 'green' | 'pink' | 'teal';

type KitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'purple' | 'gold' | 'white' | 'dark'; size?: 'sm' | 'md' | 'lg' };

export const KitButton = forwardRef<HTMLButtonElement, KitButtonProps>(function KitButton({ tone = 'purple', size = 'md', className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[12px] font-bold transition-[filter,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'purple' && 'k-btn-purple text-ink hover:brightness-110',
        tone === 'gold' && 'k-btn-gold text-[#2A1500] hover:brightness-105',
        tone === 'white' && 'bg-ink text-page hover:bg-ink/90',
        tone === 'dark' && 'bg-[rgb(var(--k-item))] text-ink hover:bg-[rgb(var(--k-item-hover))]',
        size === 'sm' && 'h-9 px-4 text-14',
        size === 'md' && 'h-11 px-6 text-16',
        size === 'lg' && 'h-[52px] px-8 text-16',
        className,
      )}
      {...rest}
    />
  );
});

/** A dark rounded box, the unit every top bar item and side control sits in. */
export function Box({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex h-[52px] items-center rounded-[14px] bg-[rgb(var(--k-item))]', className)}>{children}</div>;
}

/** A square icon button on the item surface. */
export function IconSquare({ label, children, onClick, className, size = 52 }: { label: string; children: ReactNode; onClick?: () => void; className?: string; size?: 44 | 52 }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-[14px] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] transition-colors hover:bg-[rgb(var(--k-item-hover))] hover:text-ink',
        size === 52 ? 'h-[52px] w-[52px]' : 'h-11 w-11',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A side nav row, its own rounded pill. The active row carries the purple wash and a light edge. */
export function NavItem({ to, icon, label, active, badge, onClick }: { to?: string; icon: ReactNode; label: string; active?: boolean; badge?: ReactNode; onClick?: () => void }) {
  const cls = cn(
    'group flex h-[52px] w-full items-center gap-3 rounded-[14px] border px-4 text-16 font-semibold transition-colors duration-150',
    active ? 'k-nav-active text-ink' : 'border-transparent bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item-hover))] hover:text-ink',
  );
  const inner = (
    <>
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5', active ? 'text-[#C9A2FF]' : '')}>{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      {badge}
    </>
  );
  if (to)
    return (
      <Link to={to} aria-current={active ? 'page' : undefined} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** The small label over a nav group, as the references set it. */
export function SectionLabel({ children, className }: { children: string; className?: string }) {
  return <p className={cn('px-1 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]', className)}>{children}</p>;
}

/** A sidebar promo tile, two lines of bold label and a piece of our art on its hue. */
export function PromoMini({ hue, label, art, artClass, onClick, to }: { hue: Hue; label: [string, string]; art: string; artClass?: string; onClick?: () => void; to?: string }) {
  const cls = 'group relative flex h-[64px] overflow-hidden rounded-[14px] bg-[rgb(var(--k-item))] text-left transition-transform duration-150 hover:-translate-y-0.5';
  const inner = (
    <>
      <span aria-hidden className={cn('absolute inset-y-0 right-0 w-3/4 opacity-90 [mask-image:linear-gradient(90deg,transparent,#000_70%)]', `k-hue-${hue}`)} />
      <span className="relative z-10 flex flex-col justify-center pl-3 text-14 font-bold leading-[17px] text-ink">
        <span>{label[0]}</span>
        <span>{label[1]}</span>
      </span>
      <img src={art} alt="" className={cn('pointer-events-none absolute right-1 top-1/2 h-[58px] w-auto -translate-y-1/2 object-contain', artClass)} />
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** A vivid category tile. Title in heavy capitals, a live count chip, our art breaking out bottom right. */
export function VividTile({
  hue,
  title,
  count,
  countLabel = 'playing',
  art,
  artClass,
  onClick,
  to,
  className,
  children,
}: {
  hue: Hue;
  title: string;
  count?: number;
  countLabel?: string;
  art: string;
  artClass?: string;
  onClick?: () => void;
  to?: string;
  className?: string;
  children?: ReactNode;
}) {
  const cls = cn('group relative isolate block overflow-hidden rounded-[20px] text-left transition-transform duration-200 hover:-translate-y-1', `k-hue-${hue}`, className);
  const inner = (
    <>
      <span aria-hidden className="k-mark absolute right-0 top-0 -z-10 h-full w-2/3" />
      <span className="absolute left-[20px] right-3 top-[18px] z-10 font-display text-24 font-bold uppercase leading-[26px] text-ink">{title}</span>
      {children}
      {count !== undefined && (
        <span className="absolute bottom-4 left-[20px] z-10 flex h-9 items-center gap-2 rounded-[10px] bg-black/30 px-3 text-14 font-bold text-ink">
          <span aria-hidden className="h-[8px] w-2 rounded-full bg-[#3DDC84]" />
          <span className="num">{count.toLocaleString('en-US')}</span>
          <span className="sr-only">{countLabel}</span>
        </span>
      )}
      <img src={art} alt="" className={cn('pointer-events-none absolute -bottom-2 -right-2 h-[78%] w-auto object-contain transition-transform duration-300 group-hover:scale-105', artClass)} />
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** A section heading, a coloured icon and a bold title, with controls on the right. */
export function SectionHead({ id, icon, title, sub, children }: { id?: string; icon: ReactNode; title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="flex items-center gap-3 text-18 font-bold text-ink">
          <span className="flex h-6 w-6 items-center justify-center [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
          {title}
        </h2>
        {sub && <p className="pl-[36px] text-14 text-[rgb(var(--k-muted))]">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/** View all plus the two square arrows, as on the references' rails. */
export function RailControls({ onPrev, onNext, onAll, label }: { onPrev: () => void; onNext: () => void; onAll?: () => void; label: string }) {
  return (
    <>
      {onAll && (
        <KitButton tone="dark" size="md" onClick={onAll} className="h-11 rounded-[12px] px-[20px] text-14">
          View all
        </KitButton>
      )}
      <IconSquare size={44} label={`Previous, ${label}`} onClick={onPrev}>
        <CaretLeft weight="bold" className="h-4 w-4" aria-hidden />
      </IconSquare>
      <IconSquare size={44} label={`Next, ${label}`} onClick={onNext}>
        <CaretRight weight="bold" className="h-4 w-4" aria-hidden />
      </IconSquare>
    </>
  );
}

/** Filter chips with icons. The picked chip takes the purple fill and a check is implied by its fill and pressed state. */
export function ChipRow<T extends string>({ items, value, onChange, label, wrap = true }: { items: { value: T; label: string; icon?: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; label: string; wrap?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex gap-2', wrap ? 'flex-wrap' : 'flex-nowrap')}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(it.value)}
            className={cn(
              'flex h-11 shrink-0 items-center gap-2 rounded-[12px] border px-4 text-14 font-semibold transition-colors',
              on ? 'k-btn-purple border-[#C9A2FF]/50 text-ink' : 'border-transparent bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item-hover))] hover:text-ink',
            )}
          >
            {it.icon && <span className="flex h-[18px] w-[18px] items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">{it.icon}</span>}
            {it.label}
            {it.count !== undefined && <span className={cn('num text-12', on ? 'text-ink/80' : 'text-[rgb(var(--k-dim))]')}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A game cover in a rounded card. The covers carry their own titles, so nothing is printed over them. */
export function CoverCard({ image, name, provider, onPlay, className, size = 'tall' }: { image: string; name: string; provider: string; onPlay: () => void; className?: string; size?: 'tall' | 'square' }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play ${name}, ${provider}`}
      className={cn(
        'group relative block w-full overflow-hidden rounded-[16px] bg-[rgb(var(--k-item))] ring-2 ring-transparent transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:ring-[#B47CFF] focus-visible:ring-[#B47CFF]',
        size === 'tall' ? 'aspect-[3/4]' : 'aspect-square',
        className,
      )}
    >
      <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
    </button>
  );
}

/** A coin, flat, from the coin set. */
export function Coin({ id, size = 18, className }: { id: CoinId; size?: number; className?: string }) {
  const coin = coinById(id);
  return <img src={coin.icon} alt="" width={size} height={size} className={cn('shrink-0 rounded-full', className)} />;
}

/** An amount with its coin, the way the wins strips write it. */
export function CoinAmount({ coin, amount, className }: { coin: CoinId; amount: number; className?: string }) {
  const c = coinById(coin);
  const digits = c.decimals > 2 && amount < 100 ? 2 : amount >= 1000 ? 0 : 2;
  return (
    <span className={cn('num inline-flex items-center gap-[6px] font-bold text-ink', className)}>
      <Coin id={coin} size={16} />
      {formatAmount(amount, digits)}
      <span className="sr-only"> {c.symbol}</span>
    </span>
  );
}

/** Countdown digits, each in its own box, as on the Wizard Casino and Grimdrop bonus cards. */
export function CountdownDigits({ h, m, s, pad, tone = 'light' }: { h: number; m: number; s: number; pad: (n: number) => string; tone?: 'light' | 'dark' }) {
  const groups = [pad(h), pad(m), pad(s)];
  return (
    <span className="flex items-center gap-1" aria-label={`${h} hours ${m} minutes ${s} seconds`}>
      {groups.map((g, i) => (
        <span key={i} className="flex items-center gap-1" aria-hidden>
          {g.split('').map((d, j) => (
            <span
              key={j}
              className={cn(
                'num flex h-9 w-[26px] items-center justify-center rounded-[8px] font-display text-20 font-bold',
                tone === 'light' ? 'bg-ink text-[#3B1A7A]' : 'bg-black/30 text-ink',
              )}
            >
              {d}
            </span>
          ))}
          {i < 2 && <span className="px-0.5 font-display text-20 font-bold text-ink">:</span>}
        </span>
      ))}
    </span>
  );
}

/** The balance pill with its attached deposit square, centred in the top bar as on Turbo Bet. */
export function BalancePill({ amount, currency, onDeposit, depositLabel }: { amount: string; currency: string; onDeposit: () => void; depositLabel?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Box className="gap-3 px-4">
        <Coin id="usdt" size={24} />
        <span className="num text-18 font-bold text-ink">{amount}</span>
        <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">{currency}</span>
        <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--k-muted))]" aria-hidden />
      </Box>
      {depositLabel ? (
        <KitButton tone="purple" size="lg" onClick={onDeposit} className="h-[52px] rounded-[14px] px-[20px]">
          <Plus weight="bold" className="h-5 w-5" aria-hidden />
          {depositLabel}
        </KitButton>
      ) : (
        <button type="button" onClick={onDeposit} aria-label="Deposit" className="k-btn-purple flex h-[52px] w-[52px] items-center justify-center rounded-[14px] text-ink hover:brightness-110">
          <Plus weight="bold" className="h-6 w-6" aria-hidden />
        </button>
      )}
    </div>
  );
}
