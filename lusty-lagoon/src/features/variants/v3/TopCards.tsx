import { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { Progress } from '../../../components/ui/Progress';
import { Switch } from '../../../components/ui/Switch';
import { RANKS } from '../../../data/ranks';
import { ACCOUNT } from '../../../data/wallet';
import { formatAmount, formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { DAILY_CHEST, RACE, useCountdown } from '../shared/data';

const CARD = 'relative flex flex-col rounded-2xl border border-line bg-panel p-6';

export function PlayerCard() {
  const { rank } = ACCOUNT;
  const pct = (rank.points / rank.nextAt) * 100;
  const left = rank.nextAt - rank.points;
  return (
    <section aria-labelledby="player-title" className={CARD}>
      <div className="flex items-center gap-4">
        <img src="/art/avatars/john.webp" alt="" width={56} height={56} className="h-14 w-14 rounded-full border border-line object-cover" />
        <div className="min-w-0 flex-1">
          <h2 id="player-title" className="truncate text-18 font-semibold text-ink">
            {ACCOUNT.name}
          </h2>
          <p className="mt-1 inline-flex h-6 items-center gap-2 rounded-full border border-rank-box-line bg-rank-box pl-1 pr-3 text-14 font-medium text-ink">
            <img src="/brand/rank-bronze.png" alt="" width={22} height={20} className="h-5 w-[22px] object-contain" />
            {rank.name} rank
          </p>
        </div>
      </div>
      <p className="mt-4 flex items-baseline gap-2">
        <span className="num font-display text-40 font-bold leading-[44px] text-ink">{formatPoints(rank.points)}</span>
        <span className="text-14 text-ink2">points</span>
      </p>
      <Progress value={pct} label={`${Math.floor(pct)}% of the way to ${rank.next}, ${formatPoints(left)} points to go`} className="mt-3 h-2 bg-raised" />
      <p className="mt-3 flex items-baseline justify-between text-14">
        <span className="font-semibold text-ink">
          <span className="num">{formatPoints(left)}</span> points to {rank.next}
        </span>
        <span className="num text-ink2">{Math.floor(pct)}%</span>
      </p>
      <p className="mt-auto border-t border-line pt-3 text-14 text-ink2">
        {rank.next} pays <span className="text-ink">{RANKS[1].reward.charAt(0).toLowerCase() + RANKS[1].reward.slice(1)}</span>
      </p>
    </section>
  );
}

export function ChestCard() {
  const { hms } = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(true);
  const today = DAILY_CHEST.days.find((d) => d.status === 'today')!;
  return (
    <section aria-labelledby="chest-title" className={cn(CARD, 'overflow-visible')}>
      <img src="/art/lobby/giveaway-chest.webp" alt="" width={132} height={132} className="pointer-events-none absolute -top-6 right-2 max-w-none" />
      <h2 id="chest-title" className="text-18 font-semibold text-ink">
        Daily chest
      </h2>
      <p className="mt-1 text-14 text-ink2">
        Ready in <span className="num font-semibold text-ink">{hms}</span>
      </p>
      <p className="mt-1 text-14 text-ink2">
        {today.day} pays <span className="num font-semibold text-ink">{today.amount}</span> {DAILY_CHEST.currency}
      </p>
      <ol aria-label="Seven day streak" className="mt-3 mb-3 grid grid-cols-7 gap-1">
        {DAILY_CHEST.days.map((d) => (
          <li
            key={d.day}
            className={cn(
              'flex h-14 flex-col items-center justify-center rounded-lg border',
              d.status === 'claimed' && 'border-line bg-raised',
              d.status === 'today' && 'border-2 border-accent bg-raised',
              d.status === 'locked' && 'border-line bg-sunken',
            )}
          >
            <span className="text-12 text-ink2">{d.day}</span>
            <span className={cn('num flex items-center text-14 font-semibold', d.status === 'locked' ? 'text-ink3' : 'text-ink')}>
              {d.status === 'claimed' ? (
                <>
                  <Check weight="bold" className="h-4 w-4 text-success" aria-hidden />
                  <span className="sr-only">Claimed, </span>
                </>
              ) : null}
              {d.status === 'claimed' ? <span className="sr-only">{d.amount}</span> : d.amount}
            </span>
          </li>
        ))}
      </ol>
      <Switch label="Remind me when it opens" checked={remind} onCheckedChange={setRemind} className="mt-auto border-t border-line pt-3 [&_span]:text-14" />
    </section>
  );
}

export function RaceCard() {
  const { d, h, m, pad } = useCountdown(RACE.endsInSeconds);
  const heights = { 1: 48, 2: 36, 3: 24 } as const;
  const ring = { 1: 'border-gold', 2: 'border-label', 3: 'border-pending' } as const;
  const order = [RACE.leaders[1], RACE.leaders[0], RACE.leaders[2]];
  return (
    <section aria-labelledby="race-title" className={CARD}>
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <h2 id="race-title" className="text-18 font-semibold text-ink">
            {RACE.name}
          </h2>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="num font-display text-40 font-bold leading-[44px] text-ink">{formatAmount(RACE.pool, 0)}</span>
            <span className="text-14 text-ink2">{RACE.currency}</span>
          </p>
          <p className="mt-2 text-14 text-ink2">Ends in</p>
          <div className="mt-1 flex gap-1" role="timer" aria-label={`${d} days, ${h} hours, ${m} minutes left`}>
            {[
              [pad(d), 'days'],
              [pad(h), 'hours'],
              [pad(m), 'mins'],
            ].map(([v, l]) => (
              <div key={l} className="flex h-12 w-14 flex-col items-center justify-center rounded-lg bg-raised">
                <span className="num font-display text-20 font-bold leading-6 text-ink">{v}</span>
                <span className="text-12 text-ink2">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <ol aria-label="Top three" className="flex items-end gap-2">
          {order.map((l) => (
            <li key={l.place} className="flex w-[64px] flex-col items-center">
              <img
                src={l.avatar}
                alt=""
                width={l.place === 1 ? 48 : 40}
                height={l.place === 1 ? 48 : 40}
                className={cn('rounded-full border-2 object-cover', ring[l.place as 1 | 2 | 3], l.place === 1 ? 'h-12 w-12' : 'h-10 w-10')}
              />
              <span className="mt-1 max-w-full truncate text-14 text-ink">{l.player}</span>
              <span className="num text-14 font-semibold text-ink">{formatAmount(l.prize, 0)}</span>
              <span
                className="mt-1 flex w-full items-start justify-center rounded-t-lg bg-raised pt-1 font-display text-18 font-bold text-ink"
                style={{ height: heights[l.place as 1 | 2 | 3] }}
              >
                <span className="sr-only">Place </span>
                {l.place}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-auto border-t border-line pt-3 text-14 text-ink2">
        You are <span className="num font-semibold text-ink">{RACE.you.place}th</span>. <span className="num">{formatAmount(RACE.you.toTen, 0)}</span> more wagered reaches the top ten.
      </p>
    </section>
  );
}
