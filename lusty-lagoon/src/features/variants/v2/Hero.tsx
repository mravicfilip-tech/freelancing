import type { ReactNode } from 'react';
import { Check, Play } from '@phosphor-icons/react';
import { GIVEAWAY } from '../../lobby/data';
import { ONLINE_NOW, RACE, useCountdown } from '../shared/data';
import { ACCOUNT } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { KitButton } from '../kit/parts';

// The cinematic hero after Betsera. Near black, one light from purple into ember, the tallest crisp
// character we have breaking out above the frame and whole, a 64 headline on one line, the orange key
// as a pill and a quiet secondary. The character is girl-floral, 644 by 1100, drawn 568 and 608 tall.
// The chest stands in front of her legs, 420 by 420, drawn 264 and 288 wide.

export const DRAW_IN_SECONDS = 2 * 86400 + 14 * 3600 + 8 * 60 + 22;
export const ENTRIES = Math.floor(RACE.you.wagered / GIVEAWAY.entryEvery);

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--m2-ink3))]">{label}</span>
      {children}
    </div>
  );
}

export function Hero({ joined, onJoin, onPlay, onRules }: { joined: boolean; onJoin: () => void; onPlay: () => void; onRules: () => void }) {
  const { d, h, m, s, pad } = useCountdown(DRAW_IN_SECONDS);
  return (
    <section aria-labelledby="m2-hero-title" className="relative">
      <div className="flex h-[56px] flex-col justify-center">
        <p className="text-20 font-extrabold leading-6 tracking-[-0.01em] text-ink">Welcome back, {ACCOUNT.name.split(' ')[0]}</p>
        <p className="flex items-center gap-2 text-14 font-semibold text-[rgb(var(--m2-ink2))]">
          <span aria-hidden className="k-live" />
          <span>
            <span className="num">{formatAmount(ONLINE_NOW, 0)}</span> players online, you are <span className="num">{formatAmount(ACCOUNT.rank.nextAt - ACCOUNT.rank.points, 0)}</span> points from {ACCOUNT.rank.next}
          </span>
        </p>
      </div>
      <div className="relative mt-6 h-[480px] [--m2-cx:72.5%] w1920:h-[520px] w1920:[--m2-cx:64%]">
        <div aria-hidden className="m2-hero absolute inset-0 overflow-hidden rounded-[28px]">
          <img src="/art/lobby/hero-sunset.webp" alt="" className="m2-hero-scene absolute inset-0 h-full w-full object-cover" />
          <span className="m2-hero-light absolute inset-0" />
          <span className="m2-hero-shade absolute inset-0" />
          <span className="m2-hero-purple absolute inset-0" />
        </div>
        <img
          src="/art/landing/girl-floral.webp"
          alt=""
          width={644}
          height={1100}
          className="m2-rise pointer-events-none absolute bottom-0 left-[calc(var(--m2-cx)-166px)] z-10 h-[568px] w-auto max-w-none w1920:left-[calc(var(--m2-cx)-178px)] w1920:h-[608px]"
        />
        {/* A soft contact shadow, so the chest stands on the floor of the stage instead of floating. */}
        <span aria-hidden className="pointer-events-none absolute bottom-[10px] left-[calc(var(--m2-cx)+26px)] z-10 h-6 w-[228px] rounded-full bg-black/60 blur-[10px] w1920:left-[calc(var(--m2-cx)+36px)] w1920:w-[248px]" />
        <img
          src="/art/lobby/giveaway-chest.webp"
          alt=""
          width={420}
          height={420}
          className="m2-rise m2-rise-late pointer-events-none absolute bottom-[12px] left-[calc(var(--m2-cx)+8px)] z-10 w-[264px] w1920:left-[calc(var(--m2-cx)+16px)] w1920:w-[288px]"
        />
        <div className="relative z-20 flex h-full w-[600px] flex-col justify-center pl-12 w1920:w-[720px] w1920:pl-16">
          <p className="flex items-center gap-2 text-12 font-bold uppercase tracking-[0.12em] text-[#FFB27A]">
            <span aria-hidden className="k-live" />
            Hot streak giveaway
          </p>
          <h1 id="m2-hero-title" className="mt-4 whitespace-nowrap font-display text-[64px] font-bold leading-[68px] tracking-[-0.02em] text-ink">
            Ride the hot streak
          </h1>
          <p className="mt-3 max-w-[440px] text-16 text-[rgb(var(--m2-ink2))]">
            Ten players split <span className="num font-semibold text-ink">{GIVEAWAY.pool} BTC</span> on {GIVEAWAY.ends}. Every ${GIVEAWAY.entryEvery} you play this week is one entry.
          </p>
          <div className="mt-8 flex items-center gap-3">
            {joined ? (
              <KitButton tone="primary" shape="pill" size="lg" onClick={onPlay} className="h-[56px] px-8">
                <Play weight="fill" className="h-5 w-5" aria-hidden />
                Play for more entries
              </KitButton>
            ) : (
              <KitButton tone="primary" shape="pill" size="lg" onClick={onJoin} className="h-[56px] px-8">
                Join the giveaway
              </KitButton>
            )}
            <button type="button" onClick={onRules} className="m2-quiet flex h-[56px] items-center rounded-full px-6 text-16 outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
              How it works
            </button>
          </div>
          <div className="mt-8 flex items-end gap-8">
            <Stat label="Prize pool">
              <span className="num text-28 font-bold leading-8 tracking-[-0.01em] text-ink">{GIVEAWAY.pool} BTC</span>
            </Stat>
            <span aria-hidden className="h-10 w-[1px] bg-white/[0.1]" />
            <Stat label="Draw in">
              <span className="num text-28 font-bold leading-8 tracking-[-0.01em] text-ink" aria-label={`${d} days ${h} hours ${m} minutes`}>
                {d}d {pad(h)}:{pad(m)}:{pad(s)}
              </span>
            </Stat>
            <span aria-hidden className="h-10 w-[1px] bg-white/[0.1]" />
            <Stat label={joined ? 'Your entries' : 'Entries waiting'}>
              <span className="flex items-center gap-2">
                <span className="num text-28 font-bold leading-8 tracking-[-0.01em] text-ink">{ENTRIES}</span>
                {joined && (
                  <span role="status" className="flex h-6 items-center gap-1 rounded-full bg-[#3DD68C]/15 px-2 text-12 font-bold text-[#5FF0A0]">
                    <Check weight="bold" className="h-[12px] w-[12px]" aria-hidden />
                    You are in
                  </span>
                )}
              </span>
            </Stat>
          </div>
        </div>
      </div>
    </section>
  );
}
