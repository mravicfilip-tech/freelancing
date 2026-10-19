import { useState, type ReactNode } from 'react';
import { GameController, Gift, ListNumbers, Trophy } from '@phosphor-icons/react';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { RACE, useCountdown } from '../shared/data';
import { CountdownLine, KitButton, LiveDot } from '../kit/parts';

// The weekly race on RACE. One panel, three things carry it. The prize in display type at 64, the
// countdown as one line of large numbers, and the podium of three cards on the chrome edge. No art
// floats beside them. Under it a My status row of three wells.

/** Last week's payout to John, held in this variant only until the race API has one. */
const LAST_WEEK_REWARD = 12.5;

const PLACE = {
  1: { label: '1st', ring: '#F4D543' },
  2: { label: '2nd', ring: '#A9B4D0' },
  3: { label: '3rd', ring: '#F76707' },
} as const;

function Podium({ place }: { place: 1 | 2 | 3 }) {
  const l = RACE.leaders.find((x) => x.place === place)!;
  const p = PLACE[place];
  const first = place === 1;
  return (
    <li className={cn('k-surface flex flex-col items-center rounded-[20px] px-4', first ? 'pb-8 pt-8 border-[#F4D543]/40' : 'pb-6 pt-6')}>
      <span className="absolute left-4 top-4 flex h-6 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-12 font-bold uppercase tracking-[0.08em] text-ink">
        <span aria-hidden className="h-[8px] w-[8px] rounded-full" style={{ background: p.ring }} />
        {p.label}
      </span>
      <span className="mt-6 rounded-full p-[4px]" style={{ boxShadow: `0 0 0 2px ${p.ring}` }}>
        <img src={l.avatar} alt="" className={cn('rounded-full object-cover', first ? 'h-[80px] w-[80px]' : 'h-[64px] w-[64px]')} />
      </span>
      <p className="mt-4 text-14 font-semibold text-[rgb(var(--k-muted))]">@{l.player.replace(/\s|\./g, '').toLowerCase()}</p>
      <p className="num mt-1 text-28 font-bold leading-[32px] tracking-[-0.02em] text-gold">
        {formatAmount(l.prize)} <span className="text-12 font-semibold tracking-normal text-[rgb(var(--k-dim))]">{RACE.currency}</span>
      </p>
      <span aria-hidden className="k-rule my-4 w-full border-t" />
      <p className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">Played</p>
      <p className="num text-14 font-bold text-ink">
        {formatAmount(l.wagered)} {RACE.currency}
      </p>
    </li>
  );
}

function Status({ icon, label, value, children }: { icon: ReactNode; label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="k-well flex items-center gap-4 rounded-[16px] p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.05] text-[rgb(var(--k-muted))] [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="flex flex-1 flex-col gap-1 leading-tight">
        <span className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">{label}</span>
        <span className="num text-20 font-bold text-ink">{value}</span>
      </span>
      {children}
    </div>
  );
}

export function Race({ onBoard }: { onBoard: () => void }) {
  const { d, h, m, s } = useCountdown(RACE.endsInSeconds);
  const [claimed, setClaimed] = useState(false);
  return (
    <section id="race" aria-labelledby="v3-race-title" className="k-surface k-lit scroll-mt-[100px] overflow-hidden rounded-[20px] p-8 [--lx:18%]">
      <div className="flex gap-8">
        <div className="flex w-[380px] shrink-0 flex-col w1920:w-[480px]">
          <div className="flex items-center justify-between gap-4">
            <h2 id="v3-race-title" className="flex items-center gap-3 text-20 font-bold tracking-[-0.01em] text-ink">
              <LiveDot />
              {RACE.name}
            </h2>
          </div>
          <p className="mt-1 text-14 text-[rgb(var(--k-muted))]">The top ten share the pool by amount played.</p>
          <p className="mt-8 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">Prize pool</p>
          <p className="num mt-2 font-display text-[64px] font-bold leading-[64px] tracking-[-0.02em] text-gold">
            {formatAmount(RACE.pool)}
            <span className="ml-3 text-20 font-semibold tracking-normal text-[rgb(var(--k-muted))]">{RACE.currency}</span>
          </p>
          <p className="mt-8 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">Ends in</p>
          <CountdownLine
            className="mt-2"
            parts={[
              { value: d, unit: 'days' },
              { value: h, unit: 'hours' },
              { value: m, unit: 'min' },
              { value: s, unit: 'sec' },
            ]}
          />
          <KitButton tone="dark" size="md" onClick={onBoard} className="mt-8 w-fit px-4 text-14">
            <ListNumbers weight="bold" className="h-5 w-5" aria-hidden />
            Full leaderboard
          </KitButton>
        </div>

        <ol aria-label="Top three" className="grid min-w-0 flex-1 grid-cols-3 items-end gap-4">
          <Podium place={2} />
          <Podium place={1} />
          <Podium place={3} />
        </ol>
      </div>

      <h3 className="mt-8 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">My status</h3>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Status icon={<Trophy weight="fill" />} label="Your position" value={`${RACE.you.place}th`}>
          <span className="num rounded-[8px] bg-white/[0.06] px-2 py-1 text-12 font-bold text-[rgb(var(--k-muted))]">{formatAmount(RACE.you.toTen, 0)} to top ten</span>
        </Status>
        <Status icon={<GameController weight="fill" />} label="Total played" value={`${formatAmount(RACE.you.wagered)} ${RACE.currency}`} />
        <Status icon={<Gift weight="fill" />} label="Last week's reward" value={<span className="text-gold">{formatAmount(LAST_WEEK_REWARD)} {RACE.currency}</span>}>
          <KitButton tone="primary" size="md" disabled={claimed} onClick={() => setClaimed(true)} className="px-[20px] text-14">
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
