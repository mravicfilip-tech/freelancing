import { useState } from 'react';
import { CheckCircle, Info } from '@phosphor-icons/react';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { GIVEAWAY } from '../../lobby/data';
import { RACE, useCountdown } from '../shared/data';
import { Coin } from '../kit/parts';
import { Caps, Key, Light } from './ui';
import { GlassDialog } from './Dialogs';

// The third thing the eye lands on. A wide glass band lit purple from the left behind the chest, with
// an ember light rising under it and a purple to orange segment along its foot after Cloudbet's card
// light, never gold (round 6, notes 4 and 7). The chest breaks 28 above the band and shows whole. The
// prize at 40 in white, Bai Jamjuree 600, the band's one orange key, and How it works as a quiet pill
// that opens the rules. Every line of text over the light is measured at AA (note 6).

/** Seconds from Monday 19 Oct, 15:52, to the draw at Sunday midnight. */
const DRAW_IN = 6 * 86400 + 8 * 3600 + 8 * 60;

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0C13]';

export function Giveaway({ open, onOpen }: { open: boolean; onOpen: (o: boolean) => void }) {
  const [joined, setJoined] = useState(false);
  const entries = Math.floor(RACE.you.wagered / GIVEAWAY.entryEvery);
  const { d, h, m, s, pad } = useCountdown(DRAW_IN);
  const usd = GIVEAWAY.pool * coinById(GIVEAWAY.coin).rate;
  return (
    <section aria-labelledby="give-title" className="relative pt-[28px]">
      <div className="gv-glass gv-edge flex h-[148px] items-center gap-8 rounded-3xl pl-[216px] pr-6">
        <Light hue="purple" x="10%" y="40%" size="34% 140%" strength={0.62} edge="none" />
        <span aria-hidden className="gv-light" style={{ backgroundImage: 'radial-gradient(17% 85% at 9% 88%, rgb(255 106 26 / 0.4), rgb(255 106 26 / 0.12) 50%, rgb(255 106 26 / 0) 100%)' }} />
        <span aria-hidden className="gv-seg bottom-0 left-0 w-[40%]" style={{ background: 'linear-gradient(90deg, rgb(255 106 26 / 0), rgb(255 106 26 / 0.35) 25%, rgb(157 92 255 / 0.3) 60%, rgb(157 92 255 / 0))' }} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex items-center gap-2 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--gv-ink-2))]">
            <span className="w1920:hidden">Draw in</span>
            <span className="num normal-case tracking-normal text-white w1920:hidden" aria-label={`${d} days ${h} hours ${m} minutes ${s} seconds`}>
              {d}d {pad(h)}:{pad(m)}:{pad(s)}
            </span>
            <span className="hidden w1920:inline">This week</span>
          </p>
          <h2 id="give-title" className="whitespace-nowrap text-28 font-semibold tracking-[-0.02em] text-white">
            Hot streak giveaway
          </h2>
          <p className="text-14 text-white/[0.86]">
            Every ${GIVEAWAY.entryEvery} you play is one entry. You have <span className="num font-semibold text-white">{entries}</span>.
          </p>
        </div>
        <div className="hidden shrink-0 flex-col gap-2 w1920:flex">
          <Caps>Draw in</Caps>
          <p className="flex items-start gap-3" aria-label={`${d} days ${h} hours ${m} minutes ${s} seconds`}>
            {[
              { v: d, u: 'Days' },
              { v: h, u: 'Hrs' },
              { v: m, u: 'Min' },
              { v: s, u: 'Sec' },
            ].map((x, i) => (
              <span key={x.u} aria-hidden className="flex items-start gap-3">
                <span className="flex flex-col items-center">
                  <span className="num text-28 font-semibold leading-8 tracking-[-0.02em] text-white">{pad(x.v)}</span>
                  <span className="text-12 font-medium text-[rgb(var(--gv-ink-3))]">{x.u}</span>
                </span>
                {i < 3 && <span className="text-28 font-semibold leading-8 text-white/25">:</span>}
              </span>
            ))}
          </p>
        </div>
        <span aria-hidden className="hidden h-[64px] w-px shrink-0 bg-white/[0.06] w1920:block" />
        <div className="flex shrink-0 flex-col gap-1">
          <Caps>Prize pool</Caps>
          <p className="flex items-center gap-3">
            <Coin id={GIVEAWAY.coin} size={32} />
            <span className="num font-display text-40 font-semibold leading-[44px] tracking-[-0.02em] text-white">{GIVEAWAY.pool} BTC</span>
          </p>
          <p className="num text-12 font-medium text-[rgb(var(--gv-ink-3))]">About {formatAmount(usd, 0)} USDT</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {joined ? (
            <p role="status" className="flex h-[48px] w-[200px] items-center justify-center gap-2 rounded-full bg-[#38EE59]/[0.12] text-14 font-semibold text-[#38EE59] shadow-[inset_0_0_0_1px_rgb(56_238_89/0.3)]">
              <CheckCircle weight="fill" className="h-5 w-5" aria-hidden />
              You are in, {entries} entries
            </p>
          ) : (
            <Key onClick={() => setJoined(true)} className="h-[48px] w-[200px] text-16 focus-visible:ring-offset-[#0E0C13]">
              Join the giveaway
            </Key>
          )}
          <button type="button" onClick={() => onOpen(true)} aria-label="How the giveaway works" className={cn('gv-pill flex h-[48px] w-[48px] items-center justify-center rounded-full text-[rgb(var(--gv-ink-2))] hover:text-white', FOCUS)}>
            <Info weight="regular" className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      <img src="/art/lobby/giveaway-chest.webp" alt="" width={176} height={176} className="pointer-events-none absolute left-[24px] top-0 h-[176px] w-[176px] select-none" />

      <GlassDialog open={open} onOpenChange={onOpen} title="Hot streak giveaway" description={`Win a share of ${GIVEAWAY.pool} BTC. The draw is ${GIVEAWAY.ends}.`}>
          <ul className="flex list-disc flex-col gap-2 pl-[20px] text-14 text-[rgb(var(--gv-ink-2))]">
            <li>Every ${GIVEAWAY.entryEvery} you play this week is one entry.</li>
            <li>Ten winners share the pool, paid to your wallet in BTC.</li>
            <li>
              You have <span className="num font-semibold text-white">{entries}</span> entries so far.
            </li>
          </ul>
          {joined ? (
            <p role="status" className="rounded-2xl border border-[#38EE59]/30 bg-white/[0.03] p-4 text-14 text-white">
              You are in. Good luck for {GIVEAWAY.ends}.
            </p>
          ) : (
            <div>
              <Key onClick={() => setJoined(true)} className="h-[48px] px-6 text-16 focus-visible:ring-offset-[#1A1328]">
                Join the giveaway
              </Key>
            </div>
          )}
      </GlassDialog>
    </section>
  );
}
