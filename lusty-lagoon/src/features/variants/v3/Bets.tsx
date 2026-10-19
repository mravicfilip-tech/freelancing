import { useState } from 'react';
import { GameController, Pulse, WarningCircle } from '@phosphor-icons/react';
import { Message } from '../../../components/ui/Message';
import { gameById, type CatalogueGame } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';
import { Coin } from '../kit/parts';
import { Avatar, Head, Live, RankBadge, Skel } from './parts';
import { handle } from './games-data';

// Latest bets in the arena's rows. A segmented tab bar with the purple key on the picked tab, the
// header in one sunken bar, each bet its own navy row as on Snegbet's leaderboard. Highest wins ranks
// the rows with gold, silver and bronze badges.

const TABS = [
  { value: 'all', label: 'All bets', pick: (_: Bet) => true },
  { value: 'high', label: 'Highest wins', pick: (b: Bet) => payout(b) >= 250 },
  { value: 'lucky', label: 'Luckiest', pick: (b: Bet) => b.multiplier >= 5 },
  { value: 'mine', label: 'My bets', pick: (b: Bet) => !!b.mine },
];

const COLS = 'grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-4';

export function Bets({ onPlay, state, rows = 8 }: { onPlay: (g: CatalogueGame) => void; state: string | null; rows?: number }) {
  const [tab, setTab] = useState(state === 'empty' ? 'mine' : 'all');
  const pick = TABS.find((t) => t.value === tab)!.pick;
  const mineEmpty = state === 'empty' && tab === 'mine';
  let list = mineEmpty ? [] : BETS.filter(pick);
  if (tab === 'high') list = [...list].sort((a, b) => payout(b) - payout(a));
  list = list.slice(0, rows);
  return (
    <section aria-labelledby="v3-bets-title" className="flex flex-col gap-4">
      <Head
        id="v3-bets-title"
        icon={<Pulse weight="bold" />}
        tint="#3DD68C"
        title="Latest bets"
        sub={
          <span className="flex items-center gap-2">
            <Live />
            Live bets and wins across the lagoon
          </span>
        }
      >
        <div role="tablist" aria-label="Bets" className="a-well flex gap-1 rounded-[12px] p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'h-9 rounded-[8px] border px-4 text-14 font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#B47CFF]',
                tab === t.value ? 'a-on' : 'a-muted border-transparent hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Head>
      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab)!.label} className="flex flex-col gap-2">
        <div aria-hidden className={cn(COLS, 'a-well a-caps h-10 rounded-[12px] px-4')}>
          <span>Game</span>
          <span>Player</span>
          <span>Time</span>
          <span className="text-right">Bet</span>
          <span className="text-right">Multiplier</span>
          <span className="text-right">Payout</span>
        </div>
        {state === 'loading' ? (
          Array.from({ length: 6 }, (_, i) => <Skel key={i} className="h-[56px]" />)
        ) : state === 'error' ? (
          <div className="a-panel rounded-[16px]">
            <Message className="py-12" icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />} title="Live bets are paused" body="The feed lost its connection. It reconnects on its own, or reload the page." />
          </div>
        ) : list.length === 0 ? (
          <div className="a-panel rounded-[16px]">
            <Message className="py-12" icon={<GameController weight="fill" className="a-muted h-10 w-10" aria-hidden />} title="No bets here yet" body="Bets that match this tab show up the moment they land." />
          </div>
        ) : (
          <ul aria-label="Latest bets" className="flex flex-col gap-2">
            {list.map((b, i) => {
              const g = gameById(b.gameId)!;
              const p = payout(b);
              return (
                <li key={b.id} className={cn(COLS, 'a-panel a-hover h-[56px] rounded-[12px] px-4', b.mine && 'border-[#B47CFF]/30')}>
                  <button type="button" onClick={() => onPlay(g)} className="flex min-w-0 items-center gap-3 rounded-[8px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]" aria-label={`Play ${g.name}`}>
                    {tab === 'high' && <RankBadge place={i + 1} size={28} />}
                    <img src={g.image} alt="" className="h-9 w-9 shrink-0 rounded-[8px] object-cover" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-14 font-bold text-ink">{g.short ?? g.name}</span>
                      <span className="a-muted truncate text-12 font-semibold">{g.provider}</span>
                    </span>
                  </button>
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar src={b.avatar} name={b.player} size={24} />
                    <span className={cn('truncate text-14 font-semibold', b.mine ? 'text-[#C9A2FF]' : 'text-ink')}>{handle(b.player)}</span>
                  </span>
                  <span className="num a-muted text-14 font-semibold">{b.time}</span>
                  <span className="flex items-center justify-end gap-2">
                    <span className="num text-14 font-bold text-ink">{formatAmount(b.wager, 0)}</span>
                    <Coin id={b.coin} size={16} />
                  </span>
                  <span className="flex justify-end">
                    <span className={cn('num rounded-[8px] px-2 py-0.5 text-12 font-bold', b.multiplier >= 1 ? 'bg-[#3DD68C]/[0.12] text-[#3DD68C]' : 'a-muted bg-white/[0.05]')}>{b.multiplier.toFixed(2)}x</span>
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    {p > 0 ? (
                      <>
                        <span className="num text-14 font-bold text-[#3DD68C]">+{formatAmount(p, p >= 1000 ? 0 : 2)}</span>
                        <Coin id={b.coin} size={16} />
                      </>
                    ) : (
                      <span className="num a-muted pr-6 text-14 font-semibold">0.00</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
