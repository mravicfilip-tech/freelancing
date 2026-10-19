import { Lightning, ListNumbers, Play, Trophy, WarningCircle } from '@phosphor-icons/react';
import { Message } from '../../../components/ui/Message';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { RACE, useCountdown } from '../shared/data';
import { KitButton } from '../kit/parts';
import { Avatar, Head, Live, RankBadge, Skel, TierShield } from './parts';
import { handle, LEADERS } from './games-data';

// The weekly race in two parts. A prize pool card after Krush, the pool in gold at 48 and the
// countdown in four unit boxes with purple unit pills, no art beside it. A leaderboard after Snegbet,
// one row per place with gold, silver and bronze badges, and your own row pinned under it with the
// orange Play more key.

const COLS = 'grid grid-cols-[44px_minmax(0,1.5fr)_minmax(0,1.3fr)_minmax(0,1fr)] items-center gap-4';

function Unit({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="a-row num flex h-[56px] w-[64px] items-center justify-center rounded-[12px] text-28 font-bold text-ink">{String(value).padStart(2, '0')}</span>
      <span className="-mt-[10px] flex h-5 items-center rounded-full bg-[#7A1FF2] px-2 text-12 font-bold leading-none text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]">{unit}</span>
    </span>
  );
}

function PrizePool({ onBoard }: { onBoard: () => void }) {
  const { d, h, m, s } = useCountdown(RACE.endsInSeconds);
  return (
    <div className="a-panel relative isolate flex flex-col items-center overflow-hidden rounded-[24px] p-6 text-center">
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-[-160px] -z-10 h-[360px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(141_38_231/0.35),transparent)]" />
      <div className="flex w-full items-center justify-between">
        <span className="flex items-center gap-2 text-14 font-bold text-ink">
          <Trophy weight="fill" className="h-5 w-5 text-gold" aria-hidden />
          Top ten paid
        </span>
        <span className="flex h-[28px] items-center gap-2 rounded-full bg-[#3DD68C]/10 px-3 text-12 font-bold text-[#3DD68C]">
          <Live />
          Live
        </span>
      </div>
      <p className="a-caps mt-8">Prize pool</p>
      <p className="num mt-1 flex items-baseline gap-2 font-display text-48 font-bold leading-[48px] tracking-[-0.02em] text-gold">
        {formatAmount(RACE.pool)}
        <span className="font-sans text-20 font-bold tracking-normal text-ink">{RACE.currency}</span>
      </p>
      <p className="a-caps mt-6">Ends in</p>
      <div role="timer" className="mt-2 flex items-start gap-2" aria-label={`${d} days ${h} hours ${m} minutes ${s} seconds`}>
        <Unit value={d} unit="Days" />
        <Unit value={h} unit="Hours" />
        <Unit value={m} unit="Mins" />
        <Unit value={s} unit="Sec" />
      </div>
      <ol aria-label="Top three prizes" className="mt-6 grid w-full grid-cols-3 gap-2">
        {LEADERS.slice(0, 3).map((l) => (
          <li key={l.place} className="a-row flex flex-col items-center gap-2 rounded-[12px] px-2 py-3">
            <RankBadge place={l.place} size={28} />
            <span className="num text-14 font-bold text-gold">{formatAmount(l.prize, 0)}</span>
          </li>
        ))}
      </ol>
      <KitButton tone="purple" shape="rounded" onClick={onBoard} className="mt-auto h-[48px] w-full">
        <ListNumbers weight="bold" className="h-5 w-5" aria-hidden />
        Full leaderboard
      </KitButton>
    </div>
  );
}

/** One place on the board. */
export function LeaderRow({ l }: { l: (typeof LEADERS)[number] }) {
  const above = LEADERS.find((x) => x.place === l.place - 1);
  return (
    <li className={cn(COLS, 'a-panel a-hover h-[52px] rounded-[12px] px-2 pr-4')}>
      <RankBadge place={l.place} />
      <span className="flex min-w-0 items-center gap-2">
        <Avatar src={l.avatar} name={l.player} size={24} />
        <span className="truncate text-14 font-semibold text-ink">{handle(l.player)}</span>
        <TierShield tier={l.tier} size={22} label={`${l.tier} rank`} />
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <Lightning weight="fill" className="h-4 w-4 shrink-0 text-[#B47CFF]" aria-hidden />
        <span className="num truncate text-14 font-bold text-ink">{formatAmount(l.wagered)}</span>
        {above && <span className="num a-muted hidden shrink-0 rounded-[8px] bg-white/[0.06] px-2 py-0.5 text-12 font-bold w1920:inline">{formatAmount(above.wagered - l.wagered, 0)} behind</span>}
      </span>
      <span className="num text-right text-14 font-bold text-gold">{formatAmount(l.prize)} USDT</span>
    </li>
  );
}

export function Race({ onBoard, onPlayMore, state }: { onBoard: () => void; onPlayMore: () => void; state: string | null }) {
  return (
    <section id="race" aria-labelledby="v3-race-title" className="flex scroll-mt-[96px] flex-col gap-4">
      <Head id="v3-race-title" icon={<Trophy weight="fill" />} tint="#F4D543" title="Weekly race" sub="Play any game, every USDT played moves you up the board" />
      <div className="grid grid-cols-[400px_minmax(0,1fr)] gap-6 w1920:grid-cols-[480px_minmax(0,1fr)]">
        <PrizePool onBoard={onBoard} />
        <div className="flex min-w-0 flex-col gap-2">
          <div aria-hidden className={cn(COLS, 'a-caps h-8 px-2 pr-4')}>
            <span className="text-center">Place</span>
            <span>Player</span>
            <span>Played, USDT</span>
            <span className="text-right">Prize</span>
          </div>
          {state === 'loading' ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skel key={i} className="h-[52px]" />
              ))}
            </div>
          ) : state === 'error' ? (
            <div className="a-panel flex flex-1 items-center justify-center rounded-[12px]">
              <Message className="py-8" icon={<WarningCircle weight="fill" className="h-8 w-8 text-danger" aria-hidden />} title="The board is catching up" body="Places refresh every minute. Your played amount is counted." />
            </div>
          ) : (
            <ol aria-label="Leaderboard, top six" className="flex flex-col gap-2">
              {LEADERS.slice(0, 6).map((l) => (
                <LeaderRow key={l.place} l={l} />
              ))}
            </ol>
          )}
          <p className="a-caps mt-auto px-2 pt-2">Your position</p>
          <div className={cn(COLS, 'a-you h-[64px] rounded-[16px] px-2 pr-2')} aria-label={`You are ${RACE.you.place}th with ${formatAmount(RACE.you.wagered)} USDT played`}>
            <RankBadge place={RACE.you.place} size={44} you />
            <span className="flex min-w-0 items-center gap-2">
              <img src="/art/avatars/john-sm.webp" alt="" className="h-6 w-6 shrink-0 rounded-full" />
              <span className="truncate text-14 font-bold text-ink">@johnd</span>
              <TierShield tier="bronze" size={22} label="bronze rank" />
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <Lightning weight="fill" className="h-4 w-4 shrink-0 text-[#C9A2FF]" aria-hidden />
              <span className="num text-14 font-bold text-ink">{formatAmount(RACE.you.wagered)}</span>
              <span className="num shrink-0 rounded-[8px] bg-white/[0.1] px-2 py-0.5 text-12 font-bold text-ink">{formatAmount(RACE.you.toTen, 0)} to top ten</span>
            </span>
            <KitButton tone="primary" shape="rounded" onClick={onPlayMore} className="ml-auto h-[48px] px-6">
              <Play weight="fill" className="h-4 w-4" aria-hidden />
              Play more
            </KitButton>
          </div>
        </div>
      </div>
    </section>
  );
}
