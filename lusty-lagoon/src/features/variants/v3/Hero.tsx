import { useState } from 'react';
import { Bell, BellRinging, Info } from '@phosphor-icons/react';
import { formatAmount, formatPoints } from '../../../lib/format';
import { DAILY_CHEST, useCountdown } from '../shared/data';
import { CountdownLine, KitButton, LiveDot, SegmentBar } from '../kit/parts';
import { NEXT, POINTS, PROGRESS, RANK_INDEX, TO_NEXT } from './games-data';
import { RANKS } from '../../../data/ranks';

// The top row, always first. Left the chest hero, the 7 day streak told in one band, the woman whole
// inside it, never cut by the top, the chest kept inside the edge. Right the rank card, one strong
// number, the bar and the points left to Silver, each with room around it.

/** One height for both cards, taller at 1920 where the row is wider. */
const BAND = 'h-[400px] w1920:h-[440px]';

export function ChestHero({ onHow }: { onHow: () => void }) {
  const { h, m, s } = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(false);
  const today = DAILY_CHEST.days.find((d) => d.status === 'today')!;
  const week = DAILY_CHEST.days.reduce((a, d) => a + d.amount, 0);
  const done = DAILY_CHEST.days.filter((d) => d.status === 'claimed').length;
  const total = DAILY_CHEST.days.length;
  return (
    <section aria-labelledby="v3-hero-title" className={`relative isolate min-w-0 flex-1 overflow-hidden rounded-[24px] border border-white/[0.1] ${BAND}`}>
      {/* The ground, one deep purple fill, a brand light behind the art and a warm floor light. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,#150C2E_0%,#1F1042_50%,#35176E_100%)]">
        <span className="absolute -right-[60px] top-[-80px] h-[520px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgb(141_59_240/0.55),rgb(141_59_240/0.18)_55%,transparent)]" />
        <span className="absolute -bottom-[140px] right-[40px] h-[300px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(255_160_60/0.3),transparent)]" />
        <span className="k-mark absolute right-0 top-0 h-full w-2/5" />
      </div>
      <span aria-hidden className="pointer-events-none absolute inset-x-[12%] -top-px z-10 h-px bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.4),transparent)]" />

      {/* Art, whole and inside the band. The woman stands 28 below the top, the chest 28 above the bottom. */}
      <img
        src="/art/landing/girl-lei.webp"
        alt=""
        className="pointer-events-none absolute bottom-0 right-[200px] h-[364px] w-auto max-w-none select-none w1920:right-[440px] w1920:h-[408px]"
      />
      <img
        src="/art/lobby/giveaway-chest.webp"
        alt=""
        className="pointer-events-none absolute bottom-[28px] right-[24px] h-[196px] w-auto max-w-none select-none w1920:right-[80px] w1920:h-[280px]"
      />

      <div className="flex h-full w-[400px] flex-col justify-center gap-4 pl-8 w1920:w-[560px] w1920:pl-12">
        <div className="flex items-center gap-4">
          <span className="num shrink-0 text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--k-muted))]">
            Day {done + 1} of {total}
          </span>
          <SegmentBar total={total} done={done} current={done} label={`${done} of ${total} chests opened this week`} className="max-w-[200px]" />
        </div>
        <h1 id="v3-hero-title" className="font-display text-[40px] font-bold uppercase leading-[44px] tracking-[-0.02em] text-ink">
          7 day chest
          <br />
          unlock streak
        </h1>
        <div className="k-well flex w-fit items-stretch rounded-[16px] bg-black/25">
          <div className="flex flex-col gap-1 px-4 py-3">
            <span className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">Today pays</span>
            <span className="num text-28 font-bold leading-none tracking-[-0.02em] text-gold">
              {formatAmount(today.amount, 0)} <span className="text-14 font-semibold tracking-normal text-[rgb(var(--k-muted))]">USDT</span>
            </span>
            <span className="num mt-1 text-12 font-semibold text-[rgb(var(--k-dim))]">{formatAmount(week, 0)} USDT this week</span>
          </div>
          <span aria-hidden className="my-3 w-px bg-white/[0.08]" />
          <div className="flex flex-col gap-1 px-4 py-3">
            <span className="flex items-center gap-2 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">
              <LiveDot />
              Opens in
            </span>
            <CountdownLine
              size={28}
              className="gap-2"
              parts={[
                { value: h, unit: 'hrs' },
                { value: m, unit: 'min' },
                { value: s, unit: 'sec' },
              ]}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <KitButton tone="primary" size="lg" aria-pressed={remind} onClick={() => setRemind((r) => !r)} className="px-6">
            {remind ? <BellRinging weight="fill" className="h-5 w-5" aria-hidden /> : <Bell weight="fill" className="h-5 w-5" aria-hidden />}
            {remind ? 'Reminder on' : 'Remind me when it opens'}
          </KitButton>
          <KitButton tone="dark" size="lg" onClick={onHow} aria-label="How the streak works" className="w-[52px] shrink-0 px-0 text-[rgb(var(--k-muted))] hover:text-ink">
            <Info weight="fill" className="h-5 w-5" aria-hidden />
          </KitButton>
        </div>
      </div>
    </section>
  );
}

export function LevelCard({ onRoad }: { onRoad: () => void }) {
  const rank = RANKS[RANK_INDEX];
  const pct = Math.round(PROGRESS * 100);
  return (
    <section aria-labelledby="v3-level-title" className={`k-surface flex w-[360px] shrink-0 flex-col rounded-[24px] p-8 w1920:w-[420px] ${BAND}`}>
      <div className="flex items-center gap-4">
        <img src="/brand/rank-bronze.png" alt="" className="h-[56px] w-auto" />
        <div className="flex flex-col gap-1">
          <p className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">Current rank</p>
          <h2 id="v3-level-title" className="text-20 font-extrabold uppercase leading-[22px] tracking-[-0.01em] text-ink">
            {rank.name}
          </h2>
        </div>
      </div>
      <div className="my-auto">
      <p className="flex items-baseline gap-2">
        <span className="num font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-ink">{formatPoints(POINTS)}</span>
        <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">points</span>
      </p>
      <div className="mt-6 h-[8px] w-full overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% of the way to ${NEXT.name}`}>
        <div className="h-full rounded-full bg-[#3DDC84]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-4 flex justify-between text-14 font-semibold">
        <span className="text-ink">
          <span className="num">{formatPoints(TO_NEXT)}</span> points to {NEXT.name}
        </span>
        <span className="num text-[rgb(var(--k-muted))]">{pct}%</span>
      </p>
      </div>
      <div className="k-rule flex items-center justify-between gap-3 border-t pt-4">
        <p className="flex flex-col gap-1 leading-tight">
          <span className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">{NEXT.name} pays</span>
          <span className="text-14 font-bold text-ink">Weekly cash drop to $50</span>
        </p>
        <KitButton tone="dark" size="md" onClick={onRoad} className="px-4 text-14">
          See all ranks
        </KitButton>
      </div>
    </section>
  );
}
