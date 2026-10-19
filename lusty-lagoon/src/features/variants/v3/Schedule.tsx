import type { ReactNode } from 'react';
import { Alarm, CheckFat, Clock, Fire, LockSimple, LockSimpleOpen } from '@phosphor-icons/react';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { DAILY_CHEST, useCountdown } from '../shared/data';
import { SectionHead } from '../kit/parts';

// Cybet's unlock schedule on DAILY_CHEST, on the chrome edge. The claimed days share one card with a
// small green check, today is the one lit card with an accent edge, pending days carry gold.
// Each row is a tinted icon, a timer and an amount, split by a faint rule.
// Each chest opens 24 hours after the last one and keeps for 24 hours, at the time today's opens.

const FULL: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
const OPENS_AT = '6:07 PM';

function span(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}

type Tone = 'done' | 'today' | 'pending' | 'late';
const ICON: Record<Tone, string> = {
  done: 'text-[#3DDC84]',
  today: 'text-[#C9A2FF]',
  pending: 'text-gold',
  late: 'text-[#FF6B6B]',
};

/** One fact in a day card. A tinted icon, a line and the quiet line under it, rows split by a faint rule. */
function Row({ tone, icon, top, bottom, clock }: { tone: Tone; icon: ReactNode; top: ReactNode; bottom: ReactNode; clock?: boolean }) {
  return (
    <li className="k-rule flex items-center gap-3 border-t px-2 py-3 first:border-t-0">
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5', ICON[tone])}>{icon}</span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="flex items-center gap-1 text-14 font-bold text-ink">
          {clock && <Clock weight="fill" className="h-4 w-4 text-[rgb(var(--k-dim))]" aria-hidden />}
          {top}
        </span>
        <span className="truncate text-12 text-[rgb(var(--k-muted))] [&>b]:font-bold [&>b]:text-ink">{bottom}</span>
      </span>
    </li>
  );
}

function Head({ state, title, amount, status }: { state: 'done' | 'today' | 'pending'; title: string; amount: string; status: string }) {
  return (
    <div className="flex items-center gap-3 p-2">
      <img src="/art/lobby/giveaway-chest.webp" alt="" className={cn('h-[48px] w-[48px] shrink-0 object-contain', state === 'pending' && 'opacity-60 saturate-50')} />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-16 font-bold text-ink">{title}</span>
        <span className="flex items-center gap-2 text-12 font-bold uppercase tracking-[0.08em]">
          <span className="num text-[rgb(var(--k-muted))] normal-case tracking-normal">{amount}</span>
          {state === 'done' && (
            <span className="flex items-center gap-1 text-[#3DDC84]">
              <CheckFat weight="fill" className="h-[12px] w-3" aria-hidden />
              {status}
            </span>
          )}
          {state === 'today' && <span className="rounded-full bg-[#8D3BF0]/30 px-2 py-0.5 text-[#E4D0FF]">{status}</span>}
          {state === 'pending' && <span className="text-gold">{status}</span>}
        </span>
      </span>
    </div>
  );
}

export function Schedule() {
  const { left } = useCountdown(DAILY_CHEST.readyInSeconds);
  const claimed = DAILY_CHEST.days.filter((d) => d.status === 'claimed');
  const later = DAILY_CHEST.days.filter((d) => d.status !== 'claimed');
  const cur = DAILY_CHEST.currency;
  return (
    <section id="chest" aria-labelledby="v3-sched-title" className="flex scroll-mt-[100px] flex-col gap-4">
      <SectionHead id="v3-sched-title" icon={<LockSimpleOpen weight="fill" className="text-[#F06595]" />} title="Unlock schedule" sub={`Day ${DAILY_CHEST.streak + 1} of your streak. Open one chest a day and the next one pays more.`} />
      <ol aria-label="This week's chests" className="grid grid-cols-5 gap-4">
        <li className="k-surface flex flex-col rounded-[20px] p-2">
          <Head state="done" title={`${claimed[0].day} to ${claimed[claimed.length - 1].day}`} amount={`${claimed.length}/${claimed.length}`} status="Claimed" />
          <ul className="k-rule mt-2 flex flex-col border-t">
            {claimed.map((d, i) => (
              <Row key={d.day} tone="done" icon={<CheckFat weight="fill" />} top={`${FULL[d.day]}, day ${i + 1}`} bottom={<><b>{formatAmount(d.amount, 0)} {cur}</b> claimed</>} />
            ))}
          </ul>
        </li>
        {later.map((d, i) => {
          const today = d.status === 'today';
          const opensIn = left + i * 86400;
          const next = DAILY_CHEST.days[DAILY_CHEST.days.indexOf(d) + 1];
          const tone: Tone = today ? 'today' : 'pending';
          return (
            <li key={d.day} className={cn('k-surface flex flex-col rounded-[20px] p-2', today && 'k-lit border-[#B47CFF]/70 [--lx:50%]')} aria-current={today ? 'date' : undefined}>
              <Head state={today ? 'today' : 'pending'} title={FULL[d.day]} amount={`${formatAmount(d.amount, 0)} ${cur}`} status={today ? 'Today' : 'Pending'} />
              <ul className="k-rule mt-2 flex flex-col border-t">
                <Row
                  tone={tone}
                  icon={today ? <LockSimpleOpen weight="fill" /> : <LockSimple weight="fill" />}
                  clock
                  top={<span className="num">{span(opensIn)}</span>}
                  bottom={<><b>{formatAmount(d.amount, 0)} {cur}</b> unlocks in</>}
                />
                <Row tone={tone} icon={<Fire weight="fill" />} top={`Day ${DAILY_CHEST.streak + 1 + i} of 7`} bottom={today ? 'Keeps your streak' : 'Streak day'} />
                <Row tone={today ? 'late' : tone} icon={<Alarm weight="fill" />} top="Expires" bottom={`${next ? next.day : 'Mon'} at ${OPENS_AT}`} />
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
