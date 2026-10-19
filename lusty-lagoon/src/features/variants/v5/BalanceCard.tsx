import { useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Eye, EyeSlash, Headset, TrendUp, Wallet } from '@phosphor-icons/react';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { useWallet } from '../../wallet/store';
import { AnimatedNumber } from '../kit/parts';
import { BalanceMenu, coinAmount, useBalanceCoin } from './BalanceMenu';
import { Caps, Key, Light, Skel } from './ui';
import { TODAY, WEEK } from './week';

// The hero and the first thing the eye lands on. The balance at 88, Switzer 600, tight and tabular,
// the cents a step quieter, the day's change under it. The money row's one light enters from the top
// right behind the character, who stands whole inside the glass. Across the foot a frosted well holds
// the week as glass bars after the trading shot's chart, today's bar in brand purple, and the
// character's lower half reads softly through it, the vault's pane of glass.

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0C13]';

function WeekBars({ today }: { today: number }) {
  const days = [...WEEK, { day: 'Today', date: TODAY.date, close: today }];
  const max = Math.max(...days.map((d) => d.close));
  const [hover, setHover] = useState<number | null>(null);
  const [stop, setStop] = useState(days.length - 1);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, Home: -99, End: 99 }[e.key];
    if (!step) return;
    e.preventDefault();
    const n = Math.min(days.length - 1, Math.max(0, stop + step));
    setStop(n);
    refs.current[n]?.focus();
  };
  return (
    <div role="group" aria-label="Closing balance, the last seven days. Arrow keys move between days." onKeyDown={onKey} className="grid h-[132px] grid-cols-7 items-end gap-3">
      {days.map((d, i) => {
        const isToday = i === days.length - 1;
        const h = Math.max(56, Math.round((d.close / max) * 124));
        const show = hover === i;
        return (
          <button
            key={d.day}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            tabIndex={i === stop ? 0 : -1}
            aria-label={`${d.day === 'Today' ? 'Today' : d.day} ${d.date}, closing balance ${formatAmount(d.close)} USDT`}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover((v) => (v === i ? null : v))}
            onFocus={() => {
              setHover(i);
              setStop(i);
            }}
            onBlur={() => setHover((v) => (v === i ? null : v))}
            className={cn('relative flex h-full items-end rounded-2xl', FOCUS)}
          >
            <span
              aria-hidden
              className={cn(
                'num pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/[0.06] bg-[#1F1730]/90 px-[10px] py-0.5 text-12 font-semibold text-white shadow-[0_8px_32px_rgb(0_0_0/0.3)] backdrop-blur-[8px] transition-opacity duration-150',
                show ? 'opacity-100' : 'opacity-0',
              )}
              style={{ bottom: h + 10 }}
            >
              {formatAmount(d.close)}
            </span>
            <span aria-hidden className={cn('flex w-full items-end justify-center pb-2', isToday ? 'gv-bar gv-bar-today' : 'gv-bar', !isToday && show && 'brightness-150')} style={{ height: h }}>
              <span className={cn('relative text-12 font-medium leading-4', isToday ? 'font-semibold text-white' : 'text-[rgb(var(--gv-ink-3))]')}>{d.day}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function BalanceCard({ loading }: { loading?: boolean }) {
  const navigate = useNavigate();
  const { balance } = useWallet();
  const [coin] = useBalanceCoin();
  const [hidden, setHidden] = useState(false);
  const whole = Math.trunc(balance);
  const cents = Math.round((balance - whole) * 100);
  const yesterday = WEEK[WEEK.length - 1].close;
  const change = Math.round((balance - yesterday) * 100) / 100;
  const pct = (change / yesterday) * 100;
  const up = change >= 0;
  return (
    <section aria-labelledby="bal-title" className="gv-glass gv-edge gv-bal relative flex min-h-[540px] flex-col overflow-hidden rounded-3xl p-3">
      <Light hue="purple" x="78%" y="0%" size="62% 88%" strength={0.56} segment="50%" segAt="76%" />
      {/* The brand mark pattern and the flower pillar in the purple beside her (round 6, note 8). The
          pillar stands behind her and its foot reads softly through the pane, placed in glass.css. */}
      <span aria-hidden className="gv-mark left-[372px] right-0 top-0 h-[352px]" />
      <img aria-hidden src="/art/landing/pillar-flowers-right.webp" alt="" width={282} height={854} className="gv-pillar pointer-events-none z-0 select-none" />
      {/* Whole inside the glass. Her head clears the top by 28, her lower half sits behind the frosted well. */}
      <img aria-hidden src="/art/landing/girl-wrap.webp" alt="" className="pointer-events-none absolute right-[14px] top-[28px] z-0 h-[452px] w-auto max-w-none select-none [mask-image:linear-gradient(180deg,#000_78%,transparent_100%)]" />

      <div className="relative z-10 flex flex-col px-[20px] pt-[20px]">
        <div className="flex items-center gap-3">
          <span aria-hidden className="gv-well flex h-10 w-10 items-center justify-center rounded-full text-[rgb(var(--gv-violet))]">
            <Wallet weight="fill" className="h-5 w-5" />
          </span>
          <h2 id="bal-title" className="text-16 font-medium text-[rgb(var(--gv-ink-2))]">
            Total balance
          </h2>
          <BalanceMenu variant="chip" />
          <button
            type="button"
            aria-pressed={hidden}
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
            onClick={() => setHidden((h) => !h)}
            data-icon="pop"
            className={cn('k-hov-icon flex h-10 w-10 items-center justify-center rounded-full text-[rgb(var(--gv-ink-2))] transition-colors hover:bg-white/[0.06] hover:text-white', FOCUS)}
          >
            {hidden ? <EyeSlash weight="regular" className="h-5 w-5" aria-hidden /> : <Eye weight="regular" className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        {loading ? (
          <div className="mt-6 flex flex-col gap-4" role="status" aria-label="Loading your balance">
            <Skel className="h-[88px] w-[320px] rounded-[20px]" />
            <Skel className="h-6 w-[240px] rounded-full" />
            <Skel className="h-5 w-[200px] rounded-full" />
          </div>
        ) : (
          <>
            <p className="num mt-6 whitespace-nowrap text-[88px] font-semibold leading-[88px] tracking-[-0.045em] text-white">
              {hidden ? (
                <span aria-label="Balance hidden">••••••</span>
              ) : coin === 'usdt' ? (
                <>
                  <AnimatedNumber value={whole} format={(n) => Math.round(n).toLocaleString('en-US')} />
                  <AnimatedNumber value={cents} format={(n) => `.${String(Math.round(n)).padStart(2, '0')}`} className="text-white/[0.4]" />
                </>
              ) : (
                <span>{coinAmount(balance, coin)}</span>
              )}
              <span className="sr-only"> {coinById(coin).symbol}</span>
            </p>
            <p className="mt-4 flex items-center gap-3">
              <span className={cn('num flex items-center gap-1 text-16 font-semibold', up ? 'text-[#38EE59]' : 'text-[#FF8FA3]')}>
                <TrendUp weight="bold" className={cn('h-4 w-4', !up && 'rotate-180')} aria-hidden />
                {up ? '+' : '−'}
                {formatAmount(Math.abs(change))} USDT
              </span>
              <span className={cn('num inline-flex h-6 items-center rounded-full px-2 text-12 font-semibold', up ? 'bg-[#38EE59]/[0.12] text-[#38EE59]' : 'bg-[#FF7A88]/[0.14] text-[#FF8FA3]')}>
                {up ? '+' : '−'}
                {Math.abs(pct).toFixed(2)}%
              </span>
              <span className="text-14 font-medium text-[rgb(var(--gv-ink-3))]">today</span>
            </p>
            <p className="num mt-1 text-14 text-[rgb(var(--gv-ink-3))]">
              {formatAmount(TODAY.deposited)} deposited, {formatAmount(TODAY.won)} won on {TODAY.game}
            </p>
          </>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Key tone="purple" onClick={() => navigate('/wallet/withdraw')} className={cn('h-[48px] px-6 text-16', FOCUS)}>
            <ArrowUpRight weight="bold" className="h-4 w-4" aria-hidden />
            Withdraw
          </Key>
          <button type="button" onClick={() => navigate('/agent')} className={cn('gv-pill inline-flex h-[48px] items-center gap-2 whitespace-nowrap rounded-full px-6 text-16 font-semibold text-white', FOCUS)}>
            <Headset weight="regular" className="h-5 w-5 text-[rgb(var(--gv-ink-2))]" aria-hidden />
            Send to agent
          </button>
        </div>
      </div>

      {/* The frosted pane across the foot. */}
      <div className="relative z-10 mt-auto rounded-2xl border border-white/[0.05] bg-[#0E0C14]/40 px-[20px] pb-4 pt-4 [-webkit-backdrop-filter:blur(20px)_saturate(1.2)] [backdrop-filter:blur(20px)_saturate(1.2)]">
        <div className="mb-2 flex items-center justify-between">
          <Caps>This week</Caps>
          <Link to="/wallet/deposit" data-icon="arrow" className={cn('k-hov-icon inline-flex items-center gap-1 rounded-full text-12 font-semibold text-white/[0.86] hover:text-white', FOCUS)}>
            All transactions
            <ArrowRight weight="bold" className="h-[12px] w-[12px]" aria-hidden />
          </Link>
        </div>
        {loading ? <Skel className="h-[132px] w-full rounded-[14px]" /> : <WeekBars today={balance} />}
      </div>
    </section>
  );
}
