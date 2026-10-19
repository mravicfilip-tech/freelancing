import { forwardRef, useState } from 'react';
import { BellRinging, Check, Timer } from '@phosphor-icons/react';
import { cn } from '../../../lib/cn';
import { DAILY_CHEST, useCountdown } from '../shared/data';
import { Key, Label, Skel } from './ui';

// The Daily chest, compact at the top of the rail, after Snegbet's second prize card. The prize at 40
// in white beside the chest on one soft ember light (no yellow text, taste log 20:40), the countdown
// as one line in a well, the week as a segmented bar, one key.

export const Chest = forwardRef<HTMLElement, { loading?: boolean }>(function Chest({ loading }, ref) {
  const { h, m, s, left, pad } = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(false);
  const [opened, setOpened] = useState(false);
  const today = DAILY_CHEST.days.findIndex((d) => d.status === 'today');
  const total = DAILY_CHEST.days.length;
  const last = DAILY_CHEST.days[total - 1];
  const ready = left === 0;
  return (
    <section
      ref={ref}
      tabIndex={-1}
      id="n1-chest"
      aria-labelledby="n1-chest-title"
      className="n1-ring n1-top relative shrink-0 overflow-hidden rounded-[20px] border border-white/[0.08] bg-[linear-gradient(180deg,#221A55_0%,#16133D_62%)] p-4"
    >
      <span aria-hidden className="n1-chest-light pointer-events-none absolute -right-[30px] -top-[48px] h-[200px] w-[200px]" />
      <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute right-2 top-0 h-[112px] w-[112px] w1920:right-4 w1920:h-[124px] w1920:w-[124px]" />
      <div className="relative flex h-[92px] flex-col pl-1 pt-1">
        <Label id="n1-chest-title">Daily chest</Label>
        {loading ? (
          <Skel className="mt-3 h-10 w-[120px] rounded-[10px]" />
        ) : (
          <p className="mt-2 flex items-baseline gap-2">
            <span className="num text-40 font-extrabold leading-[40px] tracking-[-0.02em] text-ink">{DAILY_CHEST.days[today].amount}</span>
            <span className="text-16 font-bold text-[rgb(var(--n-muted))]">{DAILY_CHEST.currency}</span>
          </p>
        )}
      </div>
      <p className="n1-well relative flex h-10 items-center gap-2 rounded-[12px] px-3 text-14 font-semibold text-[rgb(var(--n-muted))]">
        <Timer weight="fill" className="h-4 w-4 text-[rgb(var(--n-lilac))]" aria-hidden />
        {ready ? (
          <span className="text-ink">Ready to open</span>
        ) : (
          <>
            Opens in
            <span className="num ml-auto text-16 font-extrabold text-ink" aria-label={`${h} hours ${m} minutes ${s} seconds`}>
              {pad(h)}:{pad(m)}:{pad(s)}
            </span>
          </>
        )}
      </p>
      <div className="relative mt-4 px-1">
        <div className="flex items-baseline justify-between text-12 font-bold">
          <span className="num text-ink">
            Day {today + 1} <span className="text-[rgb(var(--n-dim))]">of {total}</span>
          </span>
          <span className="text-[rgb(var(--n-dim))]">
            Day {total} pays <span className="num text-ink">{last.amount} {DAILY_CHEST.currency}</span>
          </span>
        </div>
        <span role="img" aria-label={`Day ${today + 1} of ${total}. ${today} chests opened this week.`} className="mt-2 flex gap-1">
          {DAILY_CHEST.days.map((d, i) => (
            <span key={d.day} className={cn('h-[8px] flex-1 rounded-full', i < today ? 'bg-[rgb(var(--n-purple))]' : i === today ? 'bg-[rgb(var(--n-ember))]' : 'bg-white/[0.1]')} />
          ))}
        </span>
      </div>
      {ready ? (
        <Key tone="orange" size={48} onClick={() => setOpened(true)} disabled={opened} className="relative mt-4 w-full">
          {opened ? (
            <>
              <Check weight="bold" className="h-5 w-5" aria-hidden />
              {DAILY_CHEST.days[today].amount} {DAILY_CHEST.currency} added
            </>
          ) : (
            'Open the chest'
          )}
        </Key>
      ) : (
        <Key tone="purple" size={48} aria-pressed={remind} onClick={() => setRemind((r) => !r)} className="relative mt-4 w-full">
          {remind ? <Check weight="bold" className="h-5 w-5 shrink-0" aria-hidden /> : <BellRinging weight="fill" className="h-5 w-5 shrink-0" aria-hidden />}
          {remind ? 'Reminder on' : 'Remind me'}
        </Key>
      )}
    </section>
  );
});
