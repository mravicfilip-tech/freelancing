import { useState } from 'react';
import { Clover, Lightning, Trophy, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById, type CoinId } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout } from '../../lobby/data';
import { LIVE_WINS } from '../shared/data';
import { Coin } from '../kit/parts';
import { Note, Skel, Tabs, Title } from './ui';

// The trading shot's right hand table, beside Live wagers and starting on the same line. The title
// and tabs inside the glass, the labels in one sunken pill bar, then a row per win, the game cover,
// the handle with the game and time, and the amount in green with its coin. The list fades at the
// foot and scrolls inside the panel.

type Item = { id: string; player: string; avatar?: string; initials: string; gameId: string; amount: number; coin: CoinId; line: string; mult?: number };

const value = (amount: number, coin: CoinId) => amount * coinById(coin).rate;
const initials = (n: string) =>
  n
    .split(/\s|\./)
    .filter(Boolean)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const HIGHEST: Item[] = [...LIVE_WINS]
  .sort((a, b) => value(b.amount, b.coin) - value(a.amount, a.coin))
  .map((w) => ({ id: w.id, player: w.player, avatar: w.avatar, initials: w.initials ?? initials(w.player), gameId: w.gameId, amount: w.amount, coin: w.coin, line: `${w.ago} ago` }));

const LUCKIEST: Item[] = BETS.filter((b) => b.multiplier > 1)
  .sort((a, b) => b.multiplier - a.multiplier)
  .map((b) => ({ id: b.id, player: b.player, avatar: b.avatar, initials: b.initials, gameId: b.gameId, amount: payout(b), coin: b.coin, line: b.time, mult: b.multiplier }));

const TABS = [
  { value: 'high' as const, label: 'Highest wins', icon: <Lightning weight="fill" /> },
  { value: 'lucky' as const, label: 'Luckiest wins', icon: <Clover weight="fill" /> },
];

function WinRow({ w, onPlay }: { w: Item; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(w.gameId)!;
  const c = coinById(w.coin);
  const digits = c.rate >= 1000 ? (w.amount < 1 ? 3 : 2) : 2;
  return (
    <li className="gv-rule border-t first:border-t-0">
      <button
        type="button"
        onClick={() => onPlay(g)}
        aria-label={`${w.player} won ${formatAmount(w.amount, digits)} ${c.symbol} on ${g.name}. Play ${g.name}`}
        className="group flex h-[64px] w-full items-center gap-3 rounded-[16px] px-3 text-left outline-none transition-colors hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
      >
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[12px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]">
          <img src={g.image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.08]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            {w.avatar ? <img src={w.avatar} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" /> : <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-12 font-semibold leading-none text-white">{w.initials.slice(0, 1)}</span>}
            <span className="truncate text-14 font-semibold text-white">{w.player}</span>
          </span>
          <span className="truncate text-12 text-[rgb(var(--gv-ink-3))]">
            {g.short ?? g.name}, {w.line}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end">
          <span className="num flex items-center gap-[6px] text-14 font-semibold text-[#38EE59]">
            +{formatAmount(w.amount, digits)}
            <Coin id={w.coin} size={16} />
          </span>
          {w.mult && <span className="num text-12 font-medium text-[#F4D543]">{w.mult.toFixed(2)}x</span>}
        </span>
      </button>
    </li>
  );
}

export function WinsFeed({ state, onPlay, className }: { state: string | null; onPlay: (g: CatalogueGame) => void; className?: string }) {
  const [tab, setTab] = useState<'high' | 'lucky'>('high');
  const list = state === 'empty' ? [] : tab === 'high' ? HIGHEST : LUCKIEST;
  return (
    <section aria-labelledby="wins-title" className={cn('gv-glass gv-edge flex min-h-0 flex-col gap-4 overflow-hidden rounded-3xl p-4', className)}>
      <div className="flex h-11 items-center justify-between gap-3 pl-2">
        <Title id="wins-title">
          <Trophy weight="fill" className="h-5 w-5 text-[#F4D543]" aria-hidden />
          Biggest wins
        </Title>
        <span className="pr-2 text-14 font-medium text-[rgb(var(--gv-ink-3))]">Last 24 hours</span>
      </div>
      <Tabs label="Biggest wins" items={TABS} value={tab} onChange={setTab} controls="wins-panel" className="shrink-0 [&>button]:flex-1 [&>button]:justify-center" />
      <div id="wins-panel" role="tabpanel" aria-labelledby="wins-title" className="gv-noscroll relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1 [mask-image:linear-gradient(180deg,#000_84%,transparent)]">
        {state === 'loading' ? (
          <div className="flex flex-col" role="status" aria-label="Loading biggest wins">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="flex h-[64px] items-center gap-3 px-3">
                <Skel className="h-11 w-11" />
                <span className="flex flex-1 flex-col gap-2">
                  <Skel className="h-4 w-[120px] rounded-full" />
                  <Skel className="h-[12px] w-[160px] rounded-full" />
                </span>
                <Skel className="h-4 w-[60px] rounded-full" />
              </div>
            ))}
          </div>
        ) : state === 'error' ? (
          <Note className="h-full pb-12" icon={<WarningCircle weight="fill" className="text-[#FF7A88]" aria-hidden />} title="Wins are paused" body="They come back with the live feed." />
        ) : list.length === 0 ? (
          <Note className="h-full pb-12" icon={<Trophy weight="regular" className="text-[rgb(var(--gv-ink-2))]" aria-hidden />} title="No big wins yet today" body="The largest wins of the day land here first." />
        ) : (
          <ul aria-label={tab === 'high' ? 'Highest wins' : 'Luckiest wins'} className="pb-12">
            {list.map((w) => (
              <WinRow key={w.id} w={w} onPlay={onPlay} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
