import { useRef, useState, type ReactNode } from 'react';
import { Crown, GameController, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Message } from '../../../components/ui/Message';
import { BETS, payout, type Bet } from '../../lobby/data';
import { LIVE_WINS } from '../shared/data';
import { Coin, CoinAmount, RailControls, SectionHead } from './parts';

// The two live boards. The recent wins strip of small covers from Turbo Bet, and the latest bets
// table from NewBettie, with the profit in a green chip.

export function WinsStrip({ onPlay, loading, title = 'Recent wins', icon }: { onPlay: (g: CatalogueGame) => void; loading?: boolean; title?: string; icon?: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const move = (d: 1 | -1) => ref.current?.scrollBy({ left: d * 400, behavior: 'smooth' });
  return (
    <section aria-labelledby="wins-title" className="flex flex-col gap-4">
      <SectionHead id="wins-title" icon={icon ?? <Crown weight="fill" className="text-[#B47CFF]" />} title={title}>
        <RailControls label={title} onPrev={() => move(-1)} onNext={() => move(1)} />
      </SectionHead>
      <ul ref={ref} className="k-no-scrollbar flex gap-3 overflow-x-auto rounded-[20px] bg-[rgb(var(--k-panel))] p-4">
        {loading
          ? Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-[136px] w-[88px] shrink-0 rounded-[12px]" />)
          : LIVE_WINS.map((w) => {
              const g = gameById(w.gameId)!;
              return (
                <li key={w.id} className="w-[88px] shrink-0">
                  <button type="button" onClick={() => onPlay(g)} aria-label={`${w.player} won ${w.amount} ${coinById(w.coin).symbol} on ${g.name}, play it`} className="group flex w-full flex-col items-center gap-2 text-center">
                    <img src={g.image} alt="" className="h-[88px] w-[88px] rounded-[12px] object-cover ring-2 ring-transparent transition group-hover:ring-[#B47CFF]" />
                    <span className="w-full truncate text-12 font-semibold text-[rgb(var(--k-muted))]">@{w.player.replace(/\s|\./g, '').toLowerCase()}</span>
                    <CoinAmount coin={w.coin} amount={w.amount} className="-mt-1 text-14" />
                  </button>
                </li>
              );
            })}
      </ul>
    </section>
  );
}

const TABS = [
  { value: 'all', label: 'All bets', pick: (_: Bet) => true },
  { value: 'high', label: 'Highest wins', pick: (b: Bet) => payout(b) >= 250 },
  { value: 'lucky', label: 'Luckiest', pick: (b: Bet) => b.multiplier >= 5 },
  { value: 'mine', label: 'My bets', pick: (b: Bet) => !!b.mine },
];

export function BetsBoard({ onPlay, state, rows = 8, className }: { onPlay: (g: CatalogueGame) => void; state?: string | null; rows?: number; className?: string }) {
  const [tab, setTab] = useState('all');
  const list = BETS.filter(TABS.find((t) => t.value === tab)!.pick).slice(0, rows);
  return (
    <section aria-labelledby="bets-title" className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="bets-title" className="text-24 font-bold text-ink">
            Latest bets
          </h2>
          <p className="text-14 text-[rgb(var(--k-muted))]">Live bets and wins across the lagoon</p>
        </div>
        <div role="tablist" aria-label="Bets" className="flex gap-1 rounded-[14px] bg-[rgb(var(--k-panel))] p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn('h-10 rounded-[10px] px-4 text-14 font-semibold transition-colors', tab === t.value ? 'k-btn-purple text-ink' : 'text-[rgb(var(--k-muted))] hover:text-ink')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" className="overflow-hidden rounded-[20px] bg-[rgb(var(--k-panel))] px-[20px] pb-2 pt-4">
        <div aria-hidden className="grid grid-cols-[2.2fr_1fr_1.6fr_1.1fr_0.9fr_1.1fr] pb-2 text-12 font-semibold uppercase tracking-[0.06em] text-[rgb(var(--k-dim))]">
          <span>Game</span>
          <span>Time</span>
          <span>Player</span>
          <span>Amount</span>
          <span>Multiplier</span>
          <span className="text-right">Profit</span>
        </div>
        {state === 'loading' ? (
          <div className="flex flex-col gap-3 py-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[52px] w-full rounded-[12px]" />
            ))}
          </div>
        ) : state === 'error' ? (
          <Message className="py-[40px]" icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />} title="Live bets are paused" body="The feed lost its connection. It reconnects on its own, or reload the page." />
        ) : list.length === 0 ? (
          <Message className="py-[40px]" icon={<GameController weight="fill" className="h-10 w-10 text-[rgb(var(--k-dim))]" aria-hidden />} title="No bets here yet" body="Bets that match this tab show up the moment they land." />
        ) : (
          <ul aria-label="Latest bets">
            {list.map((b) => {
              const g = gameById(b.gameId)!;
              const p = payout(b);
              return (
                <li key={b.id} className="grid grid-cols-[2.2fr_1fr_1.6fr_1.1fr_0.9fr_1.1fr] items-center border-t border-ink/5 py-3 text-14 font-semibold">
                  <button type="button" onClick={() => onPlay(g)} className="flex min-w-0 items-center gap-3 text-left" aria-label={`Play ${g.name}`}>
                    <img src={g.image} alt="" className="h-11 w-11 shrink-0 rounded-[12px] object-cover" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-16 font-bold text-ink">{g.short ?? g.name}</span>
                      <span className="truncate text-12 text-[rgb(var(--k-dim))]">{g.provider}</span>
                    </span>
                  </button>
                  <span className="num text-[rgb(var(--k-muted))]">{b.time}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    {b.avatar ? (
                      <img src={b.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full ring-2 ring-[#6D3BF0]" />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6D3BF0] text-12 font-bold text-ink">{b.initials}</span>
                    )}
                    <span className={cn('truncate', b.mine ? 'text-[#C9A2FF]' : 'text-ink')}>@{b.player.replace(/\s|\./g, '').toLowerCase()}</span>
                  </span>
                  <span>
                    <span className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[rgb(var(--k-item))] px-3">
                      <Coin id={b.coin} size={18} />
                      <span className="num text-ink">{formatAmount(b.wager, 0)}</span>
                    </span>
                  </span>
                  <span className={cn('num', b.multiplier > 0 ? 'text-ink' : 'text-[rgb(var(--k-dim))]')}>{b.multiplier.toFixed(2)}x</span>
                  <span className="flex justify-end">
                    {p > 0 ? (
                      <span className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#3DDC84]/40 bg-[#3DDC84]/10 px-3">
                        <Coin id={b.coin} size={18} />
                        <span className="num text-[#5FF0A0]">{formatAmount(p, p >= 1000 ? 0 : 2)}</span>
                      </span>
                    ) : (
                      <span className="num pr-3 text-[rgb(var(--k-dim))]">0.00</span>
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
