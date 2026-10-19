import { Check, CheckCircle, Clock, LockSimple, LockSimpleOpen } from '@phosphor-icons/react';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { DAILY_CHEST, useCountdown } from '../shared/data';
import { Head } from './parts';

// Cybet's unlock schedule as seven day cards. Done days carry a green check, today is the one lit
// card with a purple edge and its countdown, pending days carry gold. Each chest opens 24 hours
// after the last one, so the pending days count on from today's opening.

const FULL: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };

function span(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

export function Schedule() {
  const { left, h, m, s, pad } = useCountdown(DAILY_CHEST.readyInSeconds);
  const week = DAILY_CHEST.days.reduce((a, d) => a + d.amount, 0);
  const todayIndex = DAILY_CHEST.days.findIndex((d) => d.status === 'today');
  return (
    <section id="chest" aria-labelledby="v3-sched-title" className="flex scroll-mt-[96px] flex-col gap-4">
      <Head id="v3-sched-title" icon={<LockSimpleOpen weight="fill" />} tint="#B47CFF" title="Unlock schedule" sub={`Day ${DAILY_CHEST.streak + 1} of your streak. Open one chest a day and the next one pays more.`}>
        <span className="a-row flex h-11 items-center gap-2 rounded-[12px] px-4 text-14 font-semibold">
          <span className="a-muted">This week</span>
          <span className="num font-bold text-gold">{formatAmount(week)} USDT</span>
        </span>
      </Head>
      <ol aria-label="This week's chests" className="grid grid-cols-7 gap-3">
        {DAILY_CHEST.days.map((d, i) => {
          const done = d.status === 'claimed';
          const today = d.status === 'today';
          const opensIn = left + (i - todayIndex) * 86400;
          return (
            <li
              key={d.day}
              aria-current={today ? 'date' : undefined}
              aria-label={`${FULL[d.day]}, day ${i + 1}, ${formatAmount(d.amount)} USDT, ${done ? 'claimed' : today ? 'opens today' : 'pending'}`}
              className={cn(
                'relative isolate flex flex-col items-center overflow-hidden rounded-[16px] px-3 pb-3 pt-4 text-center',
                today ? 'border border-[#B47CFF]/80 bg-[rgb(var(--a-panel))]' : 'a-panel',
              )}
            >
              {today && <span aria-hidden className="pointer-events-none absolute left-1/2 top-[-90px] -z-10 h-[220px] w-[240px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(154_75_255/0.45),transparent)]" />}
              <p className="flex w-full items-center justify-between">
                <span className={cn('a-caps', today && 'text-ink')}>{today ? 'Today' : d.day}</span>
                <span className="a-muted text-12 font-semibold">Day {i + 1}</span>
              </p>
              <span className="relative mt-2">
                <img src="/art/lobby/giveaway-chest.webp" alt="" className={cn('h-[72px] w-[72px]', !done && !today && 'opacity-70 saturate-[0.55]', done && 'opacity-80')} />
                {done && (
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#3DD68C] text-[#0E0B2C] ring-2 ring-[rgb(var(--a-panel))]">
                    <Check weight="bold" className="h-[14px] w-[14px]" aria-hidden />
                  </span>
                )}
                {!done && !today && (
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#29245E] text-gold ring-2 ring-[rgb(var(--a-panel))]">
                    <LockSimple weight="fill" className="h-[12px] w-[12px]" aria-hidden />
                  </span>
                )}
              </span>
              <p className={cn('num mt-2 text-16 font-bold', done ? 'text-ink' : 'text-gold')}>{formatAmount(d.amount)} USDT</p>
              <span
                className={cn(
                  'num mt-3 flex h-[28px] w-full items-center justify-center gap-1 rounded-[8px] text-12 font-bold',
                  done && 'bg-[#3DD68C]/[0.12] text-[#3DD68C]',
                  today && 'a-on',
                  !done && !today && 'a-raised text-gold',
                )}
              >
                {done ? (
                  <>
                    <CheckCircle weight="fill" className="h-4 w-4" aria-hidden />
                    Claimed
                  </>
                ) : today ? (
                  <>
                    <Clock weight="fill" className="h-4 w-4" aria-hidden />
                    {pad(h)}:{pad(m)}:{pad(s)}
                  </>
                ) : (
                  <>Pending, {span(opensIn)}</>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
