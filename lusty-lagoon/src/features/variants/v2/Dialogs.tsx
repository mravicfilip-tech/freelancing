import { useState, type ReactNode } from 'react';
import { Check, Lock } from '@phosphor-icons/react';
import { GIVEAWAY } from '../../lobby/data';
import { DAILY_CHEST, RACE, useCountdown } from '../shared/data';
import { ACCOUNT } from '../../../data/wallet';
import { formatAmount, formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { KitButton } from '../kit/parts';
import { DRAW_IN_SECONDS, ENTRIES } from './Hero';
import { StageDialog } from './ui';

// The four dialogs the sidebar, the hero and the VIP card open, in the variant's own surface.

export type DialogKey = 'giveaway' | 'chest' | 'race' | 'vip' | null;

function Line({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-3">
      <span className="text-14 text-[rgb(var(--m2-ink2))]">{k}</span>
      <span className="num text-16 font-bold text-ink">{children}</span>
    </div>
  );
}

function Giveaway({ joined, onJoin }: { joined: boolean; onJoin: () => void }) {
  const { d, h, m } = useCountdown(DRAW_IN_SECONDS);
  return (
    <>
      <Line k="Prize pool">
        <span className="text-ink">{GIVEAWAY.pool} BTC</span>
      </Line>
      <Line k="Draw in">
        {d}d {h}h {m}m
      </Line>
      <Line k="Your entries">{ENTRIES}</Line>
      <ul className="flex list-disc flex-col gap-2 pl-[20px] text-14 text-[rgb(var(--m2-ink2))]">
        <li>Every ${GIVEAWAY.entryEvery} you play this week is one entry.</li>
        <li>Ten winners share the pool, paid to your wallet in BTC.</li>
      </ul>
      {joined ? (
        <p role="status" className="flex items-center gap-2 rounded-full bg-[#3DD68C]/10 px-4 py-3 text-14 font-semibold text-ink">
          <Check weight="bold" className="h-4 w-4 text-[#5FF0A0]" aria-hidden />
          You are in. Good luck for {GIVEAWAY.ends}.
        </p>
      ) : (
        <KitButton tone="primary" shape="pill" onClick={onJoin} className="h-[48px] self-start">
          Join the giveaway
        </KitButton>
      )}
    </>
  );
}

function Chest() {
  const { h, m, s, pad } = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(false);
  const today = DAILY_CHEST.days.find((x) => x.status === 'today')!;
  return (
    <>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--m2-ink3))]">Today's chest</span>
          <span className="num text-28 font-bold leading-8 text-ink">
            {today.amount} {DAILY_CHEST.currency}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--m2-ink3))]">Opens in</span>
          <span className="num text-28 font-bold leading-8 text-ink">
            {pad(h)}:{pad(m)}:{pad(s)}
          </span>
        </div>
      </div>
      <ol aria-label="This week's chests" className="grid grid-cols-7 gap-2">
        {DAILY_CHEST.days.map((x) => (
          <li
            key={x.day}
            className={cn(
              'flex flex-col items-center gap-1 rounded-[16px] border py-2',
              x.status === 'today' ? 'border-gold/60 bg-gold/10' : x.status === 'claimed' ? 'border-white/[0.06] bg-[#3DD68C]/10' : 'border-white/[0.06] bg-white/[0.02]',
            )}
          >
            <span className="text-12 font-semibold text-[rgb(var(--m2-ink2))]">{x.day}</span>
            <span className={cn('num text-14 font-bold', x.status === 'locked' ? 'text-[rgb(var(--m2-ink3))]' : 'text-ink')}>{x.amount}</span>
            <span aria-label={x.status} className="flex h-4 items-center">
              {x.status === 'claimed' ? <Check weight="bold" className="h-4 w-4 text-[#5FF0A0]" /> : x.status === 'locked' ? <Lock weight="fill" className="h-[12px] w-[12px] text-[rgb(var(--m2-ink3))]" /> : <span className="h-[8px] w-[8px] rounded-full bg-gold" />}
            </span>
          </li>
        ))}
      </ol>
      <KitButton tone="purple" shape="pill" aria-pressed={remind} onClick={() => setRemind((r) => !r)} className="h-[48px] self-start">
        {remind ? 'Reminder on' : 'Remind me when it opens'}
      </KitButton>
    </>
  );
}

function Race() {
  const { d, h, m } = useCountdown(RACE.endsInSeconds);
  return (
    <>
      <Line k="Ends in">
        {d}d {h}h {m}m
      </Line>
      <ol className="flex flex-col gap-1">
        {RACE.leaders.map((l) => (
          <li key={l.place} className="flex h-[48px] items-center gap-3 rounded-full bg-white/[0.03] px-4">
            <span className={cn('num flex h-6 w-6 items-center justify-center rounded-full text-12 font-black text-[#1A0F2B]', l.place === 1 ? 'bg-gold' : l.place === 2 ? 'bg-[#D7DCE6]' : 'bg-[#E9A46A]')}>{l.place}</span>
            <img src={l.avatar} alt="" className="h-6 w-6 rounded-full" />
            <span className="flex-1 text-14 font-semibold text-ink">{l.player}</span>
            <span className="num text-14 font-bold text-ink">{formatAmount(l.prize, 0)} USDT</span>
          </li>
        ))}
        <li className="flex h-[48px] items-center gap-3 rounded-full border border-[#B47CFF]/50 bg-[#7B2FF0]/15 px-4">
          <span className="num w-10 text-12 font-black text-ink">{RACE.you.place}th</span>
          <img src="/art/avatars/john-sm.webp" alt="" className="h-6 w-6 rounded-full" />
          <span className="flex-1 text-14 font-semibold text-ink">You</span>
          <span className="num text-14 font-semibold text-[rgb(var(--m2-ink2))]">{formatAmount(RACE.you.wagered, 0)} played</span>
        </li>
      </ol>
      <p className="text-14 text-[rgb(var(--m2-ink2))]">
        <span className="num font-semibold text-ink">{formatAmount(RACE.you.toTen, 0)} USDT</span> more played reaches the top ten.
      </p>
    </>
  );
}

const RANKS = [
  { name: 'Bronze', at: 0, perk: '2% weekly cashback', tone: 'text-[#E9A46A]' },
  { name: 'Silver', at: 650_000, perk: '5% weekly cashback and a monthly chest', tone: 'text-[#D7DCE6]' },
  { name: 'Gold', at: 2_000_000, perk: '8% cashback and a personal host', tone: 'text-ink' },
  { name: 'Platinum', at: 6_000_000, perk: '12% cashback and faster withdrawals', tone: 'text-[#9FE7FF]' },
];

function Vip() {
  const r = ACCOUNT.rank;
  return (
    <ol className="flex flex-col gap-1">
      {RANKS.map((x) => {
        const now = x.name === r.name;
        const reached = r.points >= x.at;
        return (
          <li key={x.name} className={cn('flex items-center gap-3 rounded-[20px] px-4 py-3', now ? 'border border-[#B47CFF]/50 bg-[#7B2FF0]/15' : 'bg-white/[0.03]')}>
            <span className={cn('w-[72px] text-14 font-black uppercase', x.tone)}>{x.name}</span>
            <span className="flex-1 text-14 text-[rgb(var(--m2-ink2))]">{x.perk}</span>
            <span className="num text-12 font-semibold text-[rgb(var(--m2-ink3))]">{now ? 'You' : reached ? 'Done' : `${formatPoints(x.at)} pts`}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StageDialogs({ open, onClose, joined, onJoin }: { open: DialogKey; onClose: () => void; joined: boolean; onJoin: () => void }) {
  const set = (o: boolean) => !o && onClose();
  return (
    <>
      <StageDialog open={open === 'giveaway'} onOpenChange={set} title="Hot streak giveaway" description={`Win a share of ${GIVEAWAY.pool} BTC. The draw is ${GIVEAWAY.ends}.`}>
        <Giveaway joined={joined} onJoin={onJoin} />
      </StageDialog>
      <StageDialog open={open === 'chest'} onOpenChange={set} title="Daily chest" description={`Day ${DAILY_CHEST.streak + 1} of your streak. The chest grows every day you come back.`}>
        <Chest />
      </StageDialog>
      <StageDialog open={open === 'race'} onOpenChange={set} title="Weekly race" description={`${formatAmount(RACE.pool, 0)} ${RACE.currency} shared by the top ten on amount played.`}>
        <Race />
      </StageDialog>
      <StageDialog open={open === 'vip'} onOpenChange={set} title="VIP club" description={`${formatPoints(r().nextAt - r().points)} points to ${r().next}. Every rank keeps the rewards of the one before.`}>
        <Vip />
      </StageDialog>
    </>
  );
}

const r = () => ACCOUNT.rank;
