import { useState } from 'react';
import { Bell, BellRinging, Info, LockSimpleOpen } from '@phosphor-icons/react';
import { formatAmount, formatPoints } from '../../../lib/format';
import { DAILY_CHEST, useCountdown } from '../shared/data';
import { KitButton } from '../kit/parts';
import { NEXT, POINTS, PROGRESS, RANK_INDEX, TO_NEXT } from './games-data';
import { RANKS } from '../../../data/ranks';

// The hero row. Cybet's "7 day bonus unlock schedule" hero, heavy capitals, two stat boxes, one
// button and the chest large on the right breaking the top edge. Beside it Cybet's current level
// card, the badge, the rank in heavy type, a thick flat bar and the points left to the next rank.

export function ChestHero({ onHow }: { onHow: () => void }) {
  const { h, m, s, pad } = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(false);
  const today = DAILY_CHEST.days.find((d) => d.status === 'today')!;
  const week = DAILY_CHEST.days.reduce((a, d) => a + d.amount, 0);
  return (
    <section aria-labelledby="v3-hero-title" className="relative isolate h-[280px] min-w-0 flex-1">
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden rounded-[24px] bg-[linear-gradient(120deg,#1B1036_0%,#24124A_45%,#3A1675_75%,#5B21B6_100%)]">
        <span className="absolute -right-[80px] -top-[120px] h-[460px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(192_38_211/0.55),rgb(124_58_237/0.25)_55%,transparent)]" />
        <span className="absolute -bottom-[160px] right-[200px] h-[300px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(240_101_149/0.35),transparent)]" />
        <span className="k-mark absolute right-0 top-0 h-full w-1/2" />
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[linear-gradient(90deg,transparent_30%,#B47CFF_70%,#F06595)]" />
      </div>
      <img src="/art/landing/girl-offshoulder.webp" alt="" className="pointer-events-none absolute -top-[40px] right-[400px] hidden h-[320px] w-auto max-w-none w1920:block" />
      <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute -top-[36px] right-[-16px] h-[296px] w-auto max-w-none w1920:right-[40px] w1920:h-[340px]" />

      <div className="flex h-full flex-col justify-center gap-4 pl-8 pr-[260px]">
        <h1 id="v3-hero-title" className="font-display text-[48px] font-bold uppercase leading-[46px] text-ink">
          7 day chest
          <br />
          unlock streak
        </h1>
        <div className="flex w-fit overflow-hidden rounded-[14px] bg-black/30">
          <div className="flex h-[60px] items-center gap-3 bg-[linear-gradient(90deg,rgb(180_124_255/0.45),rgb(180_124_255/0.08))] pl-3 pr-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#B47CFF]/30 text-[#E4D0FF]">
              <LockSimpleOpen weight="fill" className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-12 font-semibold text-[#D9C4FF]">This week pays</span>
              <span className="num text-16 font-bold text-ink">{formatAmount(week)} USDT</span>
            </span>
          </div>
          <div className="flex h-[60px] items-center gap-3 px-6">
            <span className="flex flex-col leading-tight">
              <span className="flex items-center gap-2 text-12 font-semibold text-[#D9C4FF]">
                <span aria-hidden className="h-[8px] w-2 rounded-full bg-[#3DDC84]" />
                <span className="num" role="timer" aria-label={`Opens in ${h} hours ${m} minutes ${s} seconds`}>
                  {pad(h)}:{pad(m)}:{pad(s)}
                </span>
              </span>
              <span className="num text-16 font-bold text-ink">
                {formatAmount(today.amount)} USDT today
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <KitButton tone="purple" size="lg" aria-pressed={remind} onClick={() => setRemind((r) => !r)} className="rounded-[14px] px-6">
            {remind ? <BellRinging weight="fill" className="h-5 w-5" aria-hidden /> : <Bell weight="fill" className="h-5 w-5" aria-hidden />}
            {remind ? 'Reminder on' : 'Remind me when it opens'}
          </KitButton>
          <button type="button" onClick={onHow} className="flex items-center gap-2 rounded-lg text-14 font-semibold text-[#D9C4FF] hover:text-ink">
            <Info weight="fill" className="h-5 w-5" aria-hidden />
            How the streak works
          </button>
        </div>
      </div>
    </section>
  );
}

export function LevelCard({ onRoad }: { onRoad: () => void }) {
  const rank = RANKS[RANK_INDEX];
  const pct = Math.round(PROGRESS * 100);
  return (
    <section aria-labelledby="v3-level-title" className="relative isolate flex h-[280px] w-[360px] shrink-0 flex-col overflow-hidden rounded-[24px] bg-[rgb(var(--k-panel))] p-6 w1920:w-[420px]">
      <span aria-hidden className="absolute -top-[140px] left-1/2 -z-10 h-[300px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(232_89_12/0.45),rgb(232_89_12/0.1)_60%,transparent)]" />
      <div className="flex items-center gap-4">
        <img src="/brand/rank-bronze.png" alt="" className="h-[68px] w-auto" />
        <div className="flex flex-col">
          <p className="text-14 font-semibold text-[rgb(var(--k-muted))]">Current rank</p>
          <h2 id="v3-level-title" className="font-display text-[32px] font-bold uppercase leading-[34px] text-ink">
            {rank.name}
          </h2>
        </div>
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="num font-display text-[40px] font-bold leading-[44px] text-ink">{formatPoints(POINTS)}</span>
        <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">points</span>
      </p>
      <div className="mt-3 h-[14px] w-full overflow-hidden rounded-full bg-[rgb(var(--k-item))]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% of the way to ${NEXT.name}`}>
        <div className="h-full rounded-full bg-[#3DDC84]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 flex justify-between text-14 font-semibold">
        <span className="text-ink">
          <span className="num">{formatPoints(TO_NEXT)}</span> points to {NEXT.name}
        </span>
        <span className="num text-[rgb(var(--k-muted))]">{pct}%</span>
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <p className="flex flex-col leading-tight">
          <span className="text-12 font-semibold text-[rgb(var(--k-dim))]">{NEXT.name} pays</span>
          <span className="text-14 font-bold text-ink">Weekly cash drop to $50</span>
        </p>
        <KitButton tone="dark" size="sm" onClick={onRoad} className="h-10 bg-[rgb(var(--k-item-hover))]">
          See all ranks
        </KitButton>
      </div>
    </section>
  );
}
