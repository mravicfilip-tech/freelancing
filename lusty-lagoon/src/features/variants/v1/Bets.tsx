import { useState } from 'react';
import { GameController, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';
import { CoinIcon, Live, NMessage, RankBadge, Segments, Skel, handle } from './ui';

// Latest bets. NewBettie's columns drawn as Snegbet's leaderboard rows, each row its own card with a
// gap. The ranked tabs sort by the win and give the top three gold, silver and bronze badges.

type Tab = 'all' | 'high' | 'lucky' | 'mine';
const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All bets' },
  { value: 'high', label: 'Highest wins' },
  { value: 'lucky', label: 'Luckiest' },
  { value: 'mine', label: 'My bets' },
];

function rows(tab: Tab): Bet[] {
  if (tab === 'high') return BETS.filter((b) => payout(b) > 0).sort((a, b) => payout(b) - payout(a));
  if (tab === 'lucky') return BETS.filter((b) => b.multiplier > 0).sort((a, b) => b.multiplier - a.multiplier);
  if (tab === 'mine') return BETS.filter((b) => b.mine);
  return BETS;
}

export function Bets({ onPlay, state }: { onPlay: (g: CatalogueGame) => void; state: string | null }) {
  const [tab, setTab] = useState<Tab>('all');
  const ranked = tab === 'high' || tab === 'lucky';
  const list = state === 'empty' ? [] : rows(tab).slice(0, 8);
  const cols = cn('grid items-center gap-4', ranked ? 'grid-cols-[28px_2.2fr_0.9fr_1.6fr_1fr_0.9fr_1.2fr]' : 'grid-cols-[2.2fr_0.9fr_1.6fr_1fr_0.9fr_1.2fr]');
  return (
    <section aria-labelledby="n1-bets-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id="n1-bets-title" className="flex items-center gap-3 text-20 font-extrabold tracking-[-0.01em] text-ink">
          Latest bets
          <Live />
        </h2>
        <Segments as="tab" size={36} label="Bets" value={tab} onChange={setTab} items={TABS} />
      </div>
      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab)!.label} className="flex flex-col gap-[6px]">
        <div aria-hidden className={cn(cols, 'h-8 px-4 text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--n-dim))]')}>
          {ranked && <span>#</span>}
          <span>Game</span>
          <span>Time</span>
          <span>Player</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Multiplier</span>
          <span className="text-right">Profit</span>
        </div>
        {state === 'loading' ? (
          Array.from({ length: 6 }, (_, i) => <Skel key={i} className="h-[56px] w-full rounded-[14px]" />)
        ) : state === 'error' ? (
          <div className="n1-panel rounded-[20px]">
            <NMessage icon={<WarningCircle weight="fill" className="text-danger" />} title="Live bets are paused" body="The feed lost its connection. It reconnects on its own, or reload the page." />
          </div>
        ) : list.length === 0 ? (
          <div className="n1-panel rounded-[20px]">
            <NMessage icon={<GameController weight="fill" className="text-[rgb(var(--n-muted))]" />} title="No bets here yet" body="Bets that match this tab show up the moment they land." />
          </div>
        ) : (
          <ul aria-label="Latest bets" className="flex flex-col gap-[6px]">
            {list.map((b, i) => {
              const g = gameById(b.gameId)!;
              const p = payout(b);
              return (
                <li key={b.id} className={cn(cols, 'n1-panel h-[56px] rounded-[14px] px-4 text-14 font-semibold transition-colors hover:bg-[rgb(var(--n-raised))]', b.mine && 'border-[#9A4BFF]/30')}>
                  {ranked && <RankBadge place={i + 1} size={28} />}
                  <button type="button" onClick={() => onPlay(g)} className="n1-ring group flex min-w-0 items-center gap-3 rounded-[10px] text-left" aria-label={`Play ${g.name}`}>
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px]">
                      <img src={g.image} alt="" className="n1-zoom h-full w-full object-cover" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-14 font-extrabold text-ink">{g.short ?? g.name}</span>
                      <span className="truncate text-12 font-medium text-[rgb(var(--n-dim))]">{g.provider}</span>
                    </span>
                  </button>
                  <span className="num font-medium text-[rgb(var(--n-muted))]">{b.time}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    {b.avatar ? <img src={b.avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" /> : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5B2BC4] text-12 font-bold text-ink">{b.initials[0]}</span>}
                    <span className={cn('truncate', b.mine ? 'font-extrabold text-[#D9C2FF]' : 'text-ink')}>{handle(b.player)}</span>
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <span className="num text-ink">{formatAmount(b.wager, 0)}</span>
                    <CoinIcon id={b.coin} size={16} />
                  </span>
                  <span className={cn('num text-right', b.multiplier > 0 ? 'text-ink' : 'text-[rgb(var(--n-dim))]')}>{b.multiplier.toFixed(2)}x</span>
                  <span className="flex justify-end">
                    {p > 0 ? (
                      <span className="flex h-8 items-center gap-2 rounded-[10px] border border-[#3DDC84]/30 bg-[#3DDC84]/10 px-[10px]">
                        <span className="num font-extrabold text-[#5FF0A0]">+{formatAmount(p, p >= 1000 ? 0 : 2)}</span>
                        <CoinIcon id={b.coin} size={16} />
                      </span>
                    ) : (
                      <span className="num pr-[10px] text-[rgb(var(--n-dim))]">0.00</span>
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
