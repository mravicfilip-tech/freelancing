import { forwardRef, useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type PointerEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as M from '@radix-ui/react-dropdown-menu';
import { ArrowCircleDown, ArrowCircleUp, CaretDown, CaretLeft, CaretRight, Check, CircleNotch, Play, Plus, Wallet } from '@phosphor-icons/react';
import { coinById, type CoinId } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { kitPick } from './pick';
import './kit.css';

// The kit every dashboard variant composes. Round 4 splits it per D1 in the taste log. Chrome parts
// (Panel, Box, buttons, nav, chips, menus) follow the two dark UI references, a 1px light edge,
// quiet labels and one strong number. Art parts (VividTile, CoverCard, PromoMini) keep the casino
// references' vivid hues. Type sizes stay on the round 4 ramp, 12, 14, 16, 20, 28, 40 and 64.

export type Hue = 'purple' | 'gold' | 'blue' | 'green' | 'pink' | 'teal';

/** Sets the pointer position on a .k-spot card, so its light follows the cursor. */
export function spotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
}

/** True when a shot or a board asked the page to hold still. */
const still = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('still');

// ---------- Buttons ----------

type KitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary is the orange action, one per section. gold is an old name for it. purple is secondary. */
  tone?: 'primary' | 'purple' | 'gold' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export const KitButton = forwardRef<HTMLButtonElement, KitButtonProps>(function KitButton({ tone = 'purple', size = 'md', loading, disabled, className, children, ...rest }, ref) {
  // System 0 is the Base on the board, the round 3 purple primary and gold Checkout.
  const system = tone === 'primary' || tone === 'gold' ? kitPick('btn') : -1;
  const primary = system > 0;
  const base = system === 0;
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--ll-page))] disabled:cursor-not-allowed disabled:opacity-45',
        primary && ['k-cta', `k-cta-${system}`, size === 'sm' && 'k-cta-sm'],
        !primary && 'rounded-[12px] transition-[filter,background-color] duration-150',
        (tone === 'purple' || (base && tone === 'primary')) && 'k-btn-purple text-ink hover:brightness-110',
        base && tone === 'gold' && 'k-btn-gold text-[#2A1500] hover:brightness-105',
        tone === 'white' && 'bg-ink text-page hover:bg-ink/90',
        tone === 'dark' && 'border border-white/[0.07] bg-[rgb(var(--k-item))] text-ink hover:bg-[rgb(var(--k-item-hover))]',
        size === 'sm' && 'h-9 px-4 text-14',
        size === 'md' && 'h-11 px-6 text-16',
        size === 'lg' && 'h-[52px] px-8 text-16',
        className,
      )}
      {...rest}
    >
      {loading && <CircleNotch weight="bold" className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

// ---------- Chrome ----------

/** A chrome panel. The 1px light edge, the top highlight line and, when lit, one soft light. */
export function Panel({ lit, className, children, ...rest }: HTMLAttributes<HTMLElement> & { lit?: boolean }) {
  return (
    <section className={cn('k-surface rounded-[20px]', lit && 'k-lit', className)} {...rest}>
      {children}
    </section>
  );
}

/** A dark rounded box, the unit every top bar item and side control sits in. */
export function Box({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex h-[52px] items-center rounded-[14px] border border-white/[0.07] bg-[rgb(var(--k-item))]', className)}>{children}</div>;
}

/** A square icon button on the item surface. */
export function IconSquare({ label, children, onClick, className, size = 52 }: { label: string; children: ReactNode; onClick?: () => void; className?: string; size?: 44 | 52 }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-[14px] border border-white/[0.07] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] transition-colors hover:bg-[rgb(var(--k-item-hover))] hover:text-ink',
        size === 52 ? 'h-[52px] w-[52px]' : 'h-11 w-11',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A side nav row, its own rounded pill. The active row takes the treatment picked on the sidebar board. */
export function NavItem({ to, icon, label, active, badge, onClick }: { to?: string; icon: ReactNode; label: string; active?: boolean; badge?: ReactNode; onClick?: () => void }) {
  const cls = cn(
    'group relative flex h-[52px] w-full items-center gap-3 rounded-[14px] border px-4 text-16 font-semibold transition-colors duration-150',
    active ? cn(kitPick('nav') === 0 ? 'k-nav-active' : `k-nav-on-${kitPick('nav')}`, 'text-ink') : 'border-transparent bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item-hover))] hover:text-ink',
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

/** The small label over a nav group. */
export function SectionLabel({ children, className }: { children: string; className?: string }) {
  return <p className={cn('px-1 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]', className)}>{children}</p>;
}

/** A section heading, a coloured icon and a bold title, with controls on the right. */
export function SectionHead({ id, icon, title, sub, children }: { id?: string; icon: ReactNode; title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="flex items-center gap-3 text-20 font-bold tracking-[-0.01em] text-ink">
          <span className="flex h-6 w-6 items-center justify-center [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
          {title}
        </h2>
        {sub && <p className="pl-[36px] text-14 text-[rgb(var(--k-muted))]">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

/** View all plus the two square arrows, for a rail. */
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

/** Filter chips with icons. The picked chip takes an accent tint and edge, a state and not an action. */
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
              on ? 'border-[#B47CFF]/70 bg-[#8D3BF0]/25 text-ink' : 'border-white/[0.06] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:bg-[rgb(var(--k-item-hover))] hover:text-ink',
            )}
          >
            {it.icon && <span className={cn('flex h-[18px] w-[18px] items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]', on && 'text-[#C9A2FF]')}>{it.icon}</span>}
            {it.label}
            {it.count !== undefined && <span className={cn('num text-12', on ? 'text-ink/80' : 'text-[rgb(var(--k-dim))]')}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Art ----------

/** A sidebar promo tile. Two lines of bold label, the hue as a soft light, a soft hue edge, our art. */
export function PromoMini({ hue, label, art, artClass, onClick, to }: { hue: Hue; label: [string, string]; art: string; artClass?: string; onClick?: () => void; to?: string }) {
  const cls = cn('k-promo group relative flex h-[64px] overflow-hidden rounded-[14px] text-left', `k-tint-${hue}`);
  const inner = (
    <>
      <span className="relative z-10 flex flex-col justify-center pl-3 text-14 font-bold leading-[17px] text-ink">
        <span>{label[0]}</span>
        <span>{label[1]}</span>
      </span>
      <img src={art} alt="" className={cn('pointer-events-none absolute -right-1 top-1/2 h-[60px] w-auto -translate-y-1/2 object-contain transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]', artClass)} />
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

/** A category tile. One calm two stop hue, a light edge, heavy capitals, a live count, our art. Hover stays in place. */
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
  const cls = cn('k-tile k-spot group block overflow-hidden rounded-[20px] text-left transition-[border-color] duration-200 hover:border-white/30', `k-tile-${hue}`, className);
  const inner = (
    <>
      <span aria-hidden className="k-mark absolute right-0 top-0 -z-10 h-full w-2/3" />
      <span className="absolute left-[20px] right-3 top-[18px] z-10 text-28 font-extrabold uppercase leading-[30px] tracking-[-0.01em] text-ink">{title}</span>
      {children}
      {count !== undefined && (
        <span className="absolute bottom-4 left-[20px] z-10 flex h-8 items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 text-14 font-bold text-ink backdrop-blur-sm">
          <span aria-hidden className="k-live" />
          <span className="num">{count.toLocaleString('en-US')}</span>
          <span className="sr-only">{countLabel}</span>
        </span>
      )}
      <img src={art} alt="" className={cn('pointer-events-none absolute -bottom-2 -right-2 h-[78%] w-auto object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]', artClass)} />
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls} onPointerMove={spotlight}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls} onPointerMove={spotlight}>
      {inner}
    </button>
  );
}

/** A game cover. Hover stays in place, the edge lights, the art scales inside the clip and a play mark shows. */
export function CoverCard({ image, name, provider, onPlay, className, size = 'tall' }: { image: string; name: string; provider: string; onPlay: () => void; className?: string; size?: 'tall' | 'square' }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play ${name}, ${provider}`}
      className={cn(
        'group relative block w-full overflow-hidden rounded-[16px] bg-[rgb(var(--k-item))] outline-none',
        size === 'tall' ? 'aspect-[3/4]' : 'aspect-square',
        className,
      )}
    >
      <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 flex h-[48px] w-[48px] -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full bg-ink text-[#1A0F2B] opacity-0 transition duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
        <Play weight="fill" className="h-5 w-5 translate-x-[1px]" />
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-1 truncate text-left text-12 font-semibold text-ink/85 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        {provider}
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[16px] ring-1 ring-inset ring-white/[0.08] transition-[box-shadow] duration-200 group-hover:ring-2 group-hover:ring-[#B47CFF] group-focus-visible:ring-2 group-focus-visible:ring-[#B47CFF]" />
    </button>
  );
}

// ---------- Money and numbers ----------

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

/** A number that rolls to its new value when it changes, never on first paint. Tabular figures. */
export function AnimatedNumber({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    if (still() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      setShown(p === 1 ? value : from + (value - from) * (1 - Math.pow(2, -10 * p)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={cn('num', className)}>{format(shown)}</span>;
}

/** Countdown digits, each in its own box. Kept for the places that still use boxed digits. */
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

/** A countdown as one line of large tabular numbers with small unit labels, as on the dark UI cards. */
export function CountdownLine({ parts, size = 28, className }: { parts: { value: number; unit: string }[]; size?: 28 | 40; className?: string }) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <span className={cn('flex items-start gap-3', className)} aria-label={parts.map((p) => `${p.value} ${p.unit}`).join(' ')}>
      {parts.map((p, i) => (
        <span key={p.unit} className="flex items-start gap-3" aria-hidden>
          <span className="flex flex-col items-center">
            <span className={cn('num font-bold leading-none tracking-[-0.02em] text-ink', size === 40 ? 'text-40' : 'text-28')}>{pad(p.value)}</span>
            <span className="mt-1 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">{p.unit}</span>
          </span>
          {i < parts.length - 1 && <span className={cn('font-bold leading-none text-ink/30', size === 40 ? 'text-40' : 'text-28')}>:</span>}
        </span>
      ))}
    </span>
  );
}

/** A thin segmented progress bar, done segments green, the current one white, the rest dark. */
export function SegmentBar({ total, done, current, label, className }: { total: number; done: number; current?: number; label: string; className?: string }) {
  return (
    <span role="img" aria-label={label} className={cn('flex w-full gap-1', className)}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn('h-[6px] flex-1 rounded-full', i < done ? 'bg-[#3DDC84]' : i === current ? 'bg-ink' : 'bg-white/[0.1]')}
        />
      ))}
    </span>
  );
}

/** A live dot that breathes, green. */
export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn('k-live', className)} />;
}

/** A strip that runs on its own and pauses under the pointer or keyboard focus. The copy is inert. */
export function Marquee({ children, seconds = 60, label, className }: { children: ReactNode; seconds?: number; label: string; className?: string }) {
  const style = { '--k-run': `${seconds}s`, animationPlayState: still() ? 'paused' : undefined } as CSSProperties;
  return (
    <div role="region" aria-label={label} className={cn('k-marquee-wrap relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_3%,#000_97%,transparent)]', className)}>
      <div className="k-marquee" style={style}>
        <div className="flex shrink-0 gap-3 pr-3">{children}</div>
        <div className="flex shrink-0 gap-3 pr-3" aria-hidden inert>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------- Balance ----------

const BALANCE_COINS: CoinId[] = ['usdt', 'btc', 'eth', 'usdc', 'ltc'];

function coinAmount(usd: number, id: CoinId) {
  const c = coinById(id);
  const v = usd / c.rate;
  return formatAmount(v, c.rate >= 1000 ? 6 : c.rate >= 50 ? 4 : 2);
}

/**
 * The balance pill and its Deposit. The pill is a real menu. It picks the coin the balance shows in
 * and leads to Deposit, Withdraw and the wallet. The choice holds for the browser tab.
 */
export function BalancePill({ amount, balance, currency, onDeposit, depositLabel }: { amount: string; balance?: number; currency: string; onDeposit: () => void; depositLabel?: string }) {
  const navigate = useNavigate();
  const [coin, setCoin] = useState<CoinId>(() => {
    try {
      return (sessionStorage.getItem('kit-balance-coin') as CoinId) || 'usdt';
    } catch {
      return 'usdt';
    }
  });
  const pick = (id: CoinId) => {
    setCoin(id);
    try {
      sessionStorage.setItem('kit-balance-coin', id);
    } catch {
      /* the choice just does not persist */
    }
  };
  const showing = balance === undefined || coin === 'usdt' ? null : coinById(coin);
  return (
    <div className="flex items-center gap-2">
      <M.Root>
        <M.Trigger
          aria-label={`Balance ${showing ? coinAmount(balance!, coin) : amount} ${showing ? showing.symbol : currency}, change the coin shown`}
          className="group flex h-[52px] items-center gap-3 rounded-[14px] border border-white/[0.07] bg-[rgb(var(--k-item))] px-4 outline-none transition-colors hover:bg-[rgb(var(--k-item-hover))] focus-visible:ring-2 focus-visible:ring-[#B47CFF] data-[state=open]:border-white/[0.14] data-[state=open]:bg-[rgb(var(--k-item-hover))]"
        >
          <Coin id={showing ? coin : 'usdt'} size={24} />
          {showing ? (
            <span className="num text-16 font-bold text-ink">{coinAmount(balance!, coin)}</span>
          ) : balance !== undefined ? (
            <AnimatedNumber value={balance} format={(n) => formatAmount(n)} className="text-16 font-bold text-ink" />
          ) : (
            <span className="num text-16 font-bold text-ink">{amount}</span>
          )}
          <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">{showing ? showing.symbol : currency}</span>
          <CaretDown weight="bold" className="h-4 w-4 text-[rgb(var(--k-muted))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
        </M.Trigger>
        <M.Portal>
          <M.Content align="center" sideOffset={8} className="k-surface z-30 w-[300px] rounded-[18px] p-2 shadow-[0_24px_48px_rgb(0_0_0/0.45)]">
            <M.Label className="px-3 pb-1 pt-2 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">Show balance in</M.Label>
            <M.RadioGroup value={coin} onValueChange={(v) => pick(v as CoinId)}>
              {BALANCE_COINS.map((id) => {
                const c = coinById(id);
                return (
                  <M.RadioItem key={id} value={id} className="flex h-11 cursor-pointer select-none items-center gap-3 rounded-[12px] px-3 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-white/[0.06]">
                    <Coin id={id} size={20} />
                    <span className="flex-1">{c.symbol}</span>
                    <span className="num text-[rgb(var(--k-muted))]">{balance === undefined ? '' : coinAmount(balance, id)}</span>
                    <span className="flex w-4 justify-center">
                      <M.ItemIndicator>
                        <Check weight="bold" className="h-4 w-4 text-[#C9A2FF]" aria-hidden />
                      </M.ItemIndicator>
                    </span>
                  </M.RadioItem>
                );
              })}
            </M.RadioGroup>
            <M.Separator className="mx-2 my-2 h-px bg-white/[0.07]" />
            {[
              { label: 'Deposit', icon: <ArrowCircleDown weight="bold" className="h-5 w-5" aria-hidden />, run: onDeposit },
              { label: 'Withdraw', icon: <ArrowCircleUp weight="bold" className="h-5 w-5" aria-hidden />, run: () => navigate('/wallet/withdraw') },
              { label: 'Open wallet', icon: <Wallet weight="bold" className="h-5 w-5" aria-hidden />, run: () => navigate('/wallet/deposit') },
            ].map((it) => (
              <M.Item key={it.label} onSelect={it.run} className="flex h-11 cursor-pointer select-none items-center gap-3 rounded-[12px] px-3 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-white/[0.06] [&>svg]:text-[rgb(var(--k-muted))]">
                {it.icon}
                {it.label}
              </M.Item>
            ))}
          </M.Content>
        </M.Portal>
      </M.Root>
      {depositLabel ? (
        <KitButton tone="primary" size="lg" onClick={onDeposit} className="h-[52px] px-[20px]">
          <Plus weight="bold" className="h-5 w-5" aria-hidden />
          {depositLabel}
        </KitButton>
      ) : (
        <KitButton tone="primary" size="lg" onClick={onDeposit} aria-label="Deposit" className="k-cta-icon h-[52px] w-[52px] px-0">
          <Plus weight="bold" className="h-6 w-6" aria-hidden />
        </KitButton>
      )}
    </div>
  );
}
