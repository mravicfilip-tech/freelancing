import type { ReactNode } from 'react';
import { Alarm, CheckFat, Clock, Fire, LockSimple, LockSimpleOpen } from '@phosphor-icons/react';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { DAILY_CHEST, useCountdown } from '../shared/data';
import { SectionHead } from '../kit/parts';

// Cybet's unlock schedule on DAILY_CHEST. The claimed days share one card, today's card has the
// green header, every later day its own card. Each row is an icon box, a timer and an amount.
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

type Tone = 'green' | 'purple' | 'red' | 'dim';
const BOX: Record<Tone, string> = {
  green: 'bg-[#2FB344] text-ink',
  purple: 'bg-[#7B3FF2] text-ink',
  red: 'bg-[#E03131] text-ink',
  dim: 'bg-[rgb(var(--k-item-hover))] text-[rgb(var(--k-muted))]',
};

function Row({ tone, icon, top, bottom, clock }: { tone: Tone; icon: ReactNode; top: ReactNode; bottom: ReactNode; clock?: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-[12px] bg-[rgb(var(--k-item))] p-[10px]">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] [&>svg]:h-5 [&>svg]:w-5', BOX[tone])}>{icon}</span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="flex items-center gap-1 text-14 font-bold text-ink">
          {clock && <Clock weight="fill" className={cn('h-4 w-4', tone === 'green' || tone === 'purple' ? 'text-[#3DDC84]' : 'text-[rgb(var(--k-muted))]')} aria-hidden />}
          {top}
        </span>
        <span className="truncate text-14 text-[rgb(var(--k-muted))] [&>b]:font-bold [&>b]:text-ink">{bottom}</span>
      </span>
    </li>
  );
}

function Head({ today, title, chip, status }: { today?: boolean; title: string; chip: string; status: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-[14px] p-3', today ? 'bg-[linear-gradient(135deg,#1F7A4D,#145A3A)]' : 'bg-[rgb(var(--k-item))]')}>
      <img src="/art/lobby/giveaway-chest.webp" alt="" className={cn('h-11 w-11 shrink-0 object-contain', !today && 'opacity-70 saturate-50')} />
      <span className="flex flex-col gap-1">
        <span className="text-16 font-bold text-ink">{title}</span>
        <span className="flex items-center gap-2 text-12 font-semibold text-ink/80">
          <span className={cn('num rounded-[6px] px-[6px] py-0.5 font-bold', today ? 'bg-black/30 text-ink' : 'bg-[#8D3BF0]/40 text-[#E4D0FF]')}>{chip}</span>
          {status}
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
      <ol aria-label="This week's chests" className="grid grid-cols-5 gap-3">
        <li className="flex flex-col gap-2 rounded-[18px] bg-[rgb(var(--k-panel))] p-2">
          <Head title={`${claimed[0].day} to ${claimed[claimed.length - 1].day}`} chip={`${claimed.length}/${claimed.length}`} status="Claimed" />
          <ul className="flex flex-col gap-2">
            {claimed.map((d, i) => (
              <Row key={d.day} tone="green" icon={<CheckFat weight="fill" />} top={`${FULL[d.day]}, day ${i + 1}`} bottom={<><b>{formatAmount(d.amount, 0)} {cur}</b> claimed</>} />
            ))}
          </ul>
        </li>
        {later.map((d, i) => {
          const today = d.status === 'today';
          const opensIn = left + i * 86400;
          const next = DAILY_CHEST.days[DAILY_CHEST.days.indexOf(d) + 1];
          return (
            <li key={d.day} className={cn('flex flex-col gap-2 rounded-[18px] p-2', today ? 'bg-[#123B2B] ring-2 ring-[#2FB344]/60' : 'bg-[rgb(var(--k-panel))]')} aria-current={today ? 'date' : undefined}>
              <Head today={today} title={FULL[d.day]} chip={`${formatAmount(d.amount, 0)} ${cur}`} status={today ? 'Today' : 'Pending'} />
              <ul className="flex flex-col gap-2">
                <Row
                  tone={today ? 'purple' : 'dim'}
                  icon={today ? <LockSimpleOpen weight="fill" /> : <LockSimple weight="fill" />}
                  clock
                  top={<span className="num">{span(opensIn)}</span>}
                  bottom={<><b>{formatAmount(d.amount, 0)} {cur}</b> unlocks in</>}
                />
                <Row tone={today ? 'purple' : 'dim'} icon={<Fire weight="fill" />} top={`Day ${DAILY_CHEST.streak + 1 + i} of 7`} bottom={today ? 'Keeps your streak' : 'Streak day'} />
                <Row tone={today ? 'red' : 'dim'} icon={<Alarm weight="fill" />} top="Expires" bottom={`${next ? next.day : 'Mon'} at ${OPENS_AT}`} />
              </ul>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
