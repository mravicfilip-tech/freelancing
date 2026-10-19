import { useState, type ReactNode } from 'react';
import { ChartBar, GameController, Gift, ListNumbers, Trophy } from '@phosphor-icons/react';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { RACE, useCountdown } from '../shared/data';
import { KitButton } from '../kit/parts';

// Krush's weekly race on RACE. The pool in big gold Bai Jamjuree, the countdown in four boxes with
// purple labels, a podium of three cards with avatar rings and place tabs, first raised in the
// middle, then a My status row of three cards. Our chest and slot machine stand in for Krush's props.

/** Last week's payout to John, held in this variant only until the race API has one. */
const LAST_WEEK_REWARD = 12.5;

const PLACE = {
  1: { label: '1st place', ring: '#F5B800', edge: 'rgb(245 184 0 / 0.55)', wash: 'rgb(245 184 0 / 0.14)' },
  2: { label: '2nd place', ring: '#A9B4D0', edge: 'rgb(169 180 208 / 0.45)', wash: 'rgb(169 180 208 / 0.1)' },
  3: { label: '3rd place', ring: '#F76707', edge: 'rgb(247 103 7 / 0.5)', wash: 'rgb(247 103 7 / 0.12)' },
} as const;

function Digit({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="num flex h-[56px] w-[60px] items-center justify-center rounded-[12px] border border-ink/10 bg-ink/5 font-display text-24 font-bold text-ink">{value}</span>
      <span className="-mt-[10px] rounded-[8px] bg-[#7B3FF2] px-2 py-0.5 text-12 font-bold text-ink">{label}</span>
    </span>
  );
}

function Podium({ place }: { place: 1 | 2 | 3 }) {
  const l = RACE.leaders.find((x) => x.place === place)!;
  const p = PLACE[place];
  return (
    <li className={cn('relative w-[248px]', place === 1 ? 'mt-0' : 'mt-12')}>
      <span className="absolute -top-4 right-[-6px] z-10 rounded-[10px] border border-ink/10 bg-[#2B2347] px-3 py-1 text-14 font-bold text-ink">{p.label}</span>
      <div className="relative flex flex-col items-center rounded-[20px] px-4 pb-6 pt-8" style={{ background: `linear-gradient(180deg, ${p.wash}, rgb(var(--k-item)) 75%)` }}>
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px] border-2 border-dashed [mask-image:linear-gradient(180deg,#000_30%,transparent_85%)]" style={{ borderColor: p.edge }} />
        <span className="rounded-full p-[4px]" style={{ boxShadow: `0 0 0 4px ${p.ring}` }}>
          <img src={l.avatar} alt="" className="h-[76px] w-[76px] rounded-full object-cover" />
        </span>
        <p className="mt-4 text-14 font-semibold text-ink">@{l.player.replace(/\s|\./g, '').toLowerCase()}</p>
        <p className="num mt-1 font-display text-28 font-bold leading-[32px] text-gold">
          {formatAmount(l.prize)} <span className="text-16">{RACE.currency}</span>
        </p>
        <span aria-hidden className="my-3 h-[1px] w-full bg-ink/10" />
        <p className="text-14 font-semibold text-[rgb(var(--k-muted))]">Played</p>
        <p className="num text-16 font-bold text-ink">
          {formatAmount(l.wagered)} {RACE.currency}
        </p>
      </div>
    </li>
  );
}

function Status({ icon, tint, label, value, children }: { icon: ReactNode; tint: string; label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-[16px] bg-[rgb(var(--k-item))] p-3 pr-4" style={{ background: `linear-gradient(90deg, ${tint}26, rgb(var(--k-item)) 45%)` }}>
      <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[12px] [&>svg]:h-6 [&>svg]:w-6" style={{ background: `${tint}33`, color: tint }}>
        {icon}
      </span>
      <span className="flex flex-1 flex-col leading-tight">
        <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">{label}</span>
        <span className="num text-18 font-bold text-ink">{value}</span>
      </span>
      {children}
    </div>
  );
}

export function Race({ onBoard }: { onBoard: () => void }) {
  const { d, h, m, s, pad } = useCountdown(RACE.endsInSeconds);
  const [claimed, setClaimed] = useState(false);
  return (
    <section id="race" aria-labelledby="v3-race-title" className="relative isolate scroll-mt-[100px] overflow-hidden rounded-[24px] border border-ink/5 bg-[linear-gradient(180deg,#24163F_0%,rgb(var(--k-panel))_55%)] px-8 pb-8 pt-8">
      <span aria-hidden className="absolute left-1/2 top-[-200px] -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(123_63_242/0.4),transparent)]" />
      <img src="/art/landing/slot-machine.webp" alt="" className="pointer-events-none absolute left-[40px] top-[40px] -z-10 h-[200px] w-auto w1920:left-[120px]" />
      <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute right-[40px] top-[90px] -z-10 h-[150px] w-auto w1920:right-[120px]" />
      <KitButton tone="dark" size="sm" onClick={onBoard} className="absolute right-6 top-6 h-11 rounded-[12px] bg-[rgb(var(--k-item))] px-4">
        <ListNumbers weight="bold" className="h-5 w-5" aria-hidden />
        Full leaderboard
      </KitButton>

      <div className="flex flex-col items-center text-center">
        <h2 id="v3-race-title" className="text-20 font-bold text-ink">
          {RACE.name}
        </h2>
        <p className="num mt-1 font-display text-[72px] font-bold leading-[80px] text-gold">
          {formatAmount(RACE.pool)}
          <span className="ml-3 text-32">{RACE.currency}</span>
        </p>
        <p className="sr-only">
          Ends in {d} days {h} hours {m} minutes
        </p>
        <div className="mt-4 flex items-start gap-3" aria-hidden>
          <Digit value={pad(d)} label="Days" />
          <span className="pt-4 font-display text-20 font-bold text-[rgb(var(--k-dim))]">:</span>
          <Digit value={pad(h)} label="Hours" />
          <span className="pt-4 font-display text-20 font-bold text-[rgb(var(--k-dim))]">:</span>
          <Digit value={pad(m)} label="Mins" />
          <span className="pt-4 font-display text-20 font-bold text-[rgb(var(--k-dim))]">:</span>
          <Digit value={pad(s)} label="Secs" />
        </div>
      </div>

      <ol aria-label="Top three" className="mt-12 flex items-start justify-center gap-6">
        <Podium place={2} />
        <Podium place={1} />
        <Podium place={3} />
      </ol>

      <h3 className="mt-12 flex items-center gap-3 text-18 font-bold text-ink">
        <ChartBar weight="fill" className="h-6 w-6 text-[#9B5CFF]" aria-hidden />
        My status
      </h3>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Status icon={<Trophy weight="fill" />} tint="#9B5CFF" label="Your position" value={`${RACE.you.place}th`}>
          <span className="num rounded-[8px] bg-black/25 px-2 py-1 text-12 font-bold text-[rgb(var(--k-muted))]">{formatAmount(RACE.you.toTen, 0)} to top ten</span>
        </Status>
        <Status icon={<GameController weight="fill" />} tint="#F5B800" label="Total played" value={`${formatAmount(RACE.you.wagered)} ${RACE.currency}`} />
        <Status icon={<Gift weight="fill" />} tint="#3DDC84" label="Last week's reward" value={`${formatAmount(LAST_WEEK_REWARD)} ${RACE.currency}`}>
          <KitButton tone="purple" size="sm" disabled={claimed} onClick={() => setClaimed(true)} className="h-10 px-[20px]">
            {claimed ? 'Claimed' : 'Claim'}
          </KitButton>
        </Status>
      </div>
      <p role="status" className="sr-only">
        {claimed ? `${formatAmount(LAST_WEEK_REWARD)} ${RACE.currency} added to your wallet.` : ''}
      </p>
    </section>
  );
}
