import { useState } from 'react';
import { ArrowRight, Bell, BellRinging, CheckCircle, Clock, Fire, Gift, Lightning } from '@phosphor-icons/react';
import { formatAmount, formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { RANKS } from '../../../data/ranks';
import { DAILY_CHEST, RACE, useCountdown } from '../shared/data';
import { KitButton } from '../kit/parts';
import { Live, TierShield } from './parts';
import { NEXT, POINTS, PROGRESS, RANK_INDEX, TO_NEXT, tierOf } from './games-data';

// The top row, always first. Left the hero, a Snegbet prize card for the 7 day chest. The chest and
// the woman stand in a purple burst window, a gold streak pill under them, PRIZE in small caps over
// the week's prize, a sunken bar with the countdown, the requirement line and a full width orange
// key. Right the Your position card, the rank shield, the EXP at 40 and the flat bar to Silver.

/** One height for both cards. */
const BAND = 'h-[600px] w1920:h-[624px]';
/** When each chest stops waiting, the same clock time every day. */
const KEEP_BY = 'Fri 6:07 PM';

export function PrizeHero({ onHow }: { onHow: () => void }) {
  const { h, m, s, pad } = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(false);
  const today = DAILY_CHEST.days.find((d) => d.status === 'today')!;
  const week = DAILY_CHEST.days.reduce((a, d) => a + d.amount, 0);
  const done = DAILY_CHEST.days.filter((d) => d.status === 'claimed').length;
  return (
    <section id="top" aria-labelledby="v3-hero-title" className={`a-hero relative isolate flex min-w-0 scroll-mt-[96px] flex-col overflow-hidden rounded-[24px] ${BAND}`}>
      {/* The art window. The burst turns slowly behind the chest, the women stand on the window's
          lower edge, where their art ends, with room above their heads. */}
      <div className="a-window relative isolate m-2 mb-0 h-[284px] shrink-0 overflow-hidden rounded-[16px] w1920:h-[324px]">
        <span aria-hidden className="a-rays pointer-events-none absolute left-1/2 top-[150px] -z-10 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2 w1920:top-[160px]" />
        <span aria-hidden className="pointer-events-none absolute bottom-[-24px] left-1/2 -z-10 h-[72px] w-[480px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(225_190_255/0.5),transparent)]" />
        <img
          src="/art/landing/girl-floral.webp"
          alt=""
          className="pointer-events-none absolute bottom-0 right-[calc(50%+140px)] hidden h-[296px] w-auto max-w-none select-none w1920:block"
        />
        <img
          src="/art/landing/girl-lei.webp"
          alt=""
          className="pointer-events-none absolute bottom-0 left-[calc(50%+20px)] h-[268px] w-auto max-w-none select-none w1920:left-[calc(50%+96px)] w1920:h-[296px]"
        />
        <img
          src="/art/lobby/giveaway-chest.webp"
          alt=""
          className="a-float pointer-events-none absolute bottom-[6px] left-1/2 h-[232px] w-[232px] max-w-none -translate-x-[86%] select-none w1920:h-[264px] w1920:w-[264px] w1920:-translate-x-1/2"
        />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between">
          <h1 id="v3-hero-title" className="flex items-center gap-2 font-display text-20 font-bold uppercase leading-[24px] tracking-[0.02em] text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-black/25 backdrop-blur-sm">
              <Gift weight="fill" className="h-5 w-5 text-gold" aria-hidden />
            </span>
            7 day chest
          </h1>
          <span className="num flex h-8 items-center gap-2 rounded-[8px] bg-black/25 px-3 text-12 font-bold text-ink backdrop-blur-sm">
            <Fire weight="fill" className="h-4 w-4 text-[#FFB27A]" aria-hidden />
            Day {done + 1} of {DAILY_CHEST.days.length}
          </span>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-[680px] flex-1 flex-col items-center px-6 pb-6">
        <span className="num -mt-[14px] flex h-[28px] items-center gap-1 rounded-full bg-[linear-gradient(180deg,#FBE36A,#E8C21E)] px-3 text-12 font-extrabold uppercase tracking-[0.06em] text-[#1A0F2B] shadow-[inset_0_1px_0_rgb(255_255_255/0.55),inset_0_-2px_0_rgb(150_110_0/0.6)]">
          <Fire weight="fill" className="h-4 w-4" aria-hidden />
          {done} day streak
        </span>
        <p className="a-caps mt-4">Prize this week</p>
        <p className="num mt-1 flex items-baseline gap-2 font-display text-48 font-bold leading-[48px] tracking-[-0.02em] text-gold">
          {formatAmount(week)}
          <span className="font-sans text-20 font-bold tracking-normal text-ink">USDT</span>
        </p>

        <div className="mt-4 flex h-[48px] w-full items-center justify-between gap-4 rounded-[12px] border border-white/[0.07] bg-[#110E33]/70 pl-4 pr-2">
          <span className="flex items-center gap-3">
            <Live />
            <span className="a-caps">Opens in</span>
            <span role="timer" className="num text-20 font-bold text-ink" aria-label={`${h} hours ${m} minutes ${s} seconds`}>
              {pad(h)}:{pad(m)}:{pad(s)}
            </span>
          </span>
          <span className="flex h-9 items-center gap-2 rounded-[8px] bg-white/[0.06] pl-1 pr-3">
            <img src="/art/lobby/giveaway-chest.webp" alt="" className="h-[28px] w-[28px]" />
            <span className="a-muted text-12 font-bold uppercase tracking-[0.08em]">Today</span>
            <span className="num text-14 font-bold text-gold">{formatAmount(today.amount)} USDT</span>
          </span>
        </div>

        <p className="mt-4 flex items-center gap-4 text-12 font-semibold">
          <span className="a-muted flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3DD68C]/15 text-[#3DD68C]">
              <CheckCircle weight="fill" className="h-4 w-4" aria-hidden />
            </span>
            Bronze rank or higher
          </span>
          <span className="a-muted flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B47CFF]/15 text-[#C9A2FF]">
              <Clock weight="fill" className="h-4 w-4" aria-hidden />
            </span>
            Open it by {KEEP_BY} to keep the streak.
          </span>
          <button type="button" onClick={onHow} className="rounded-[4px] font-bold text-gold underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
            Learn more
          </button>
        </p>

        <KitButton tone="primary" shape="rounded" aria-pressed={remind} onClick={() => setRemind((r) => !r)} className="mt-auto h-[56px] w-full text-16">
          {remind ? <BellRinging weight="fill" className="h-5 w-5" aria-hidden /> : <Bell weight="fill" className="h-5 w-5" aria-hidden />}
          {remind ? 'Reminder on, we will ping you when it opens' : 'Remind me when it opens'}
        </KitButton>
        <p role="status" className="sr-only">
          {remind ? 'Reminder on.' : ''}
        </p>
      </div>
    </section>
  );
}

export function PositionCard({ onRoad, onPlay }: { onRoad: () => void; onPlay: () => void }) {
  const rank = RANKS[RANK_INDEX];
  const pct = Math.round(PROGRESS * 100);
  return (
    <section aria-labelledby="v3-pos-title" className={`a-panel relative isolate flex min-w-0 flex-col overflow-hidden rounded-[24px] p-6 ${BAND}`}>
      <span aria-hidden className="pointer-events-none absolute -left-[80px] -top-[120px] -z-10 h-[360px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgb(217_130_91/0.3),transparent)]" />
      <div className="flex items-center justify-between">
        <h2 id="v3-pos-title" className="a-caps">
          Your position
        </h2>
        <button type="button" onClick={onRoad} className="a-muted flex items-center gap-1 rounded-[8px] text-14 font-semibold outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
          Rank road
          <ArrowRight weight="bold" className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <img src="/brand/rank-bronze.png" alt="" className="h-[96px] w-auto shrink-0 w1920:h-[112px]" />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="flex items-center gap-2">
            <img src="/art/avatars/john-sm.webp" alt="" className="h-6 w-6 rounded-full" />
            <span className="truncate text-16 font-bold text-ink">@johnd</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="a-tier a-tier-bronze a-tier-chip flex h-[28px] items-center gap-1 rounded-[8px] px-2 text-12 font-extrabold uppercase tracking-[0.08em]">
              <TierShield tier="bronze" size={14} />
              {rank.name}
            </span>
            <span className="a-muted text-12 font-semibold">Rank 1 of {RANKS.length}</span>
          </p>
        </div>
      </div>

      <p className="mt-6 flex items-center gap-2 w1920:mt-8">
        <Lightning weight="fill" className="h-6 w-6 text-[#B47CFF]" aria-hidden />
        <span className="num font-display text-40 font-bold leading-[40px] tracking-[-0.02em] text-ink">{formatPoints(POINTS)}</span>
        <span className="a-muted text-16 font-bold">EXP</span>
      </p>
      <div className="mt-4 h-[10px] w-full overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% of the way to ${NEXT.name}`}>
        <div className="h-full rounded-full bg-[#B47CFF]" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-12 font-bold">
        <span className="flex items-center gap-1 text-[#E8A383]">
          <TierShield tier="bronze" size={14} />
          Bronze
        </span>
        <span className="num rounded-[8px] bg-white/[0.06] px-2 py-0.5 text-ink">{formatPoints(TO_NEXT)} left</span>
        <span className="flex items-center gap-1 text-[#C9DCE8]">
          <TierShield tier="silver" size={14} />
          {NEXT.name} <span className="num a-muted font-semibold">{formatPoints(NEXT.from)}</span>
        </span>
      </div>

      {/* The five tiers on one track, each shield in its tier colour, yours lit, the track filled to you. */}
      <div className="a-row mt-6 rounded-[16px] px-4 pb-3 pt-4 w1920:mt-8">
        <ol aria-label="Ranks" className="relative flex items-start justify-between">
          <span aria-hidden className="absolute left-[18px] right-[18px] top-[17px] h-[2px] rounded-full bg-white/[0.08]" />
          <span aria-hidden className="absolute left-[18px] top-[17px] h-[2px] rounded-full bg-[#B47CFF]" style={{ width: `calc((100% - 36px) * ${(RANK_INDEX + PROGRESS) / (RANKS.length - 1)})` }} />
          {RANKS.map((r, i) => {
            const t = tierOf(r.name);
            const mine = i === RANK_INDEX;
            return (
              <li key={r.name} aria-current={mine ? 'step' : undefined} className="relative flex w-9 flex-col items-center gap-1">
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', mine ? 'bg-[#D9825B]/25 ring-2 ring-[#D9825B]' : 'bg-[rgb(var(--a-row))]')}>
                  <TierShield tier={t} size={mine ? 24 : 20} className={cn(i > RANK_INDEX && 'opacity-60')} />
                </span>
                <span className={cn('a-tier text-12 font-bold', `a-tier-${t}`, i > RANK_INDEX ? 'a-muted' : 'a-tier-ink')}>{r.name}</span>
              </li>
            );
          })}
        </ol>
        <p className="a-muted mt-3 border-t border-white/[0.06] pt-3 text-12 font-semibold">
          Next, <span className="text-ink">{NEXT.name}</span> pays a weekly cash drop up to $50
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <p className="a-row flex h-11 items-center justify-between rounded-[12px] px-3 text-14 font-semibold">
            <span className="a-muted">Weekly race</span>
            <span className="num font-bold text-ink">#{RACE.you.place}</span>
          </p>
          <p className="a-row flex h-11 items-center justify-between rounded-[12px] px-3 text-14 font-semibold">
            <span className="a-muted">Chest streak</span>
            <span className="num font-bold text-ink">Day {DAILY_CHEST.streak + 1}</span>
          </p>
        </div>
        <KitButton tone="purple" shape="rounded" onClick={onPlay} className="h-[48px] w-full">
          <Lightning weight="fill" className="h-5 w-5" aria-hidden />
          Play more, earn EXP
        </KitButton>
      </div>
    </section>
  );
}
