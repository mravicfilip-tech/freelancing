import { Lightning } from '@phosphor-icons/react';
import { ACCOUNT } from '../../../data/wallet';
import { formatAmount, formatPoints } from '../../../lib/format';
import { GIVEAWAY } from '../../lobby/data';
import { RACE, useCountdown } from '../shared/data';
import { CHAT_RULES } from './data';
import { CoinIcon, Key, Label, NDialog, RankBadge, handle } from './ui';

// The page's dialogs. The weekly race as Snegbet's leaderboard with your position pinned, the hot
// streak draw, the rank road and the chat rules.

export function RaceDialog({ open, onOpenChange, onPlay }: { open: boolean; onOpenChange: (o: boolean) => void; onPlay: () => void }) {
  const t = useCountdown(RACE.endsInSeconds);
  return (
    <NDialog open={open} onOpenChange={onOpenChange} title="Weekly race" description={`${formatAmount(RACE.pool, 0)} ${RACE.currency} shared by the top ten on amount played. Ends in ${t.d}d ${t.pad(t.h)}h ${t.pad(t.m)}m.`} wide>
      <div className="flex flex-col gap-2">
        <Label>Leaderboard</Label>
        <ol className="flex flex-col gap-[6px]">
          {RACE.leaders.map((l) => (
            <li key={l.place} className="n1-panel flex h-[56px] items-center gap-3 rounded-[16px] pl-[10px] pr-4">
              <RankBadge place={l.place} />
              <img src={l.avatar} alt="" className="h-[28px] w-[28px] rounded-full object-cover" />
              <span className="flex-1 truncate text-14 font-bold text-ink">{handle(l.player)}</span>
              <span className="n1m-race-played num flex items-center gap-1 text-12 font-bold text-[rgb(var(--n-muted))]">
                <Lightning weight="fill" className="h-4 w-4 text-[rgb(var(--n-lilac))]" aria-hidden />
                {formatAmount(l.wagered, 0)} played
              </span>
              <span className="n1m-race-prize num w-[110px] text-right text-14 font-extrabold text-ink">{formatAmount(l.prize, 0)} USDT</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Your position</Label>
        <div className="n1m-race-you flex h-[64px] items-center gap-3 rounded-[16px] border border-[rgb(var(--n-purple)/0.4)] bg-[rgb(var(--n-purple)/0.16)] pl-[10px] pr-2">
          <RankBadge place={RACE.you.place} />
          <img src="/art/avatars/john-sm.webp" alt="" className="h-[28px] w-[28px] rounded-full object-cover" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 font-extrabold text-ink">{handle(ACCOUNT.name)}</span>
            <span className="num text-12 font-semibold text-[rgb(var(--n-muted))]">{formatAmount(RACE.you.toTen, 0)} USDT more reaches the top ten</span>
          </span>
          <Key
            tone="orange"
            size={48}
            onClick={() => {
              onOpenChange(false);
              onPlay();
            }}
          >
            Play more
          </Key>
        </div>
      </div>
    </NDialog>
  );
}

export function GiveawayDialog({ open, onOpenChange, joined, onJoin }: { open: boolean; onOpenChange: (o: boolean) => void; joined: boolean; onJoin: () => void }) {
  return (
    <NDialog open={open} onOpenChange={onOpenChange} title="Hot streak giveaway" description={`Win a share of ${GIVEAWAY.pool} BTC. The draw is ${GIVEAWAY.ends}.`}>
      <div className="n1-panel flex items-center justify-between rounded-[16px] p-4">
        <span className="flex flex-col gap-1">
          <Label>Prize pool</Label>
          <span className="num flex items-center gap-2 text-28 font-extrabold text-ink">
            <CoinIcon id="btc" size={24} />
            {GIVEAWAY.pool} BTC
          </span>
        </span>
        <span className="text-right text-14 font-semibold text-[rgb(var(--n-muted))]">
          10 winners
          <br />
          paid in BTC
        </span>
      </div>
      <ul className="flex list-disc flex-col gap-2 pl-[20px] text-14 text-[rgb(var(--n-muted))]">
        <li>Every ${GIVEAWAY.entryEvery} you play this week is one entry.</li>
        <li>Ten winners share the pool, paid to your wallet in BTC.</li>
      </ul>
      {joined ? (
        <p role="status" className="rounded-[16px] border border-[#3DDC84]/40 bg-[#3DDC84]/10 p-4 text-14 font-semibold text-ink">
          You are in. Good luck for {GIVEAWAY.ends}.
        </p>
      ) : (
        <Key tone="orange" size={48} onClick={onJoin} className="self-start">
          Join the giveaway
        </Key>
      )}
    </NDialog>
  );
}

export function RankDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const r = ACCOUNT.rank;
  const pct = Math.round((r.points / r.nextAt) * 100);
  return (
    <NDialog open={open} onOpenChange={onOpenChange} title="Rank road" description={`You are ${r.name}. ${formatPoints(r.nextAt - r.points)} points more reaches ${r.next}.`}>
      <div className="n1-panel flex items-center gap-4 rounded-[16px] p-4">
        <img src="/brand/rank-bronze.png" alt="" className="h-[64px] w-[64px]" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-16 font-extrabold text-[rgb(var(--n-bronze))]">{r.name}</span>
            <span className="num text-12 font-bold text-[rgb(var(--n-muted))]">
              {formatPoints(r.points)} of {formatPoints(r.nextAt)}
            </span>
          </div>
          <span role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress to ${r.next}`} className="block h-[8px] w-full overflow-hidden rounded-full bg-white/[0.1]">
            <span className="block h-full rounded-full bg-[rgb(var(--n-purple))]" style={{ width: `${pct}%` }} />
          </span>
          <span className="text-12 font-semibold text-[rgb(var(--n-dim))]">
            Next, <span className="text-[rgb(var(--n-silver))]">{r.next}</span>. Higher weekly cashback and a bigger daily chest.
          </span>
        </div>
      </div>
    </NDialog>
  );
}

export function RulesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <NDialog open={open} onOpenChange={onOpenChange} title="Chat rules" description="Moderators remove messages that break these, and may mute the sender.">
      <ol className="flex flex-col gap-2">
        {CHAT_RULES.map((rule, i) => (
          // The rules are numbered in quiet squares, never the gold, silver and bronze of a rank.
          <li key={rule} className="n1-panel flex items-center gap-3 rounded-[12px] p-3 text-14 font-semibold text-ink">
            <span aria-hidden className="n1-raised num flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] text-12 font-extrabold">
              {i + 1}
            </span>
            {rule}
          </li>
        ))}
      </ol>
    </NDialog>
  );
}
