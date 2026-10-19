import { useState, type ReactNode } from 'react';
import { Crown, GameController, Pause, Play, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Message } from '../../../components/ui/Message';
import { BETS, payout, type Bet } from '../../lobby/data';
import { LIVE_WINS } from '../shared/data';
import { Coin, CoinAmount, IconSquare, LiveDot, Marquee, SectionHead } from './parts';

// The two live boards. Round 4 draws them under the D1 chrome, after the two dark UI references.
// Recent wins runs on its own across the full row, with a pause button. Latest bets is a quiet
// table, its header in one sunken bar, rows split by space, numbers right aligned, profit in green.

function WinItem({ w, onPlay }: { w: (typeof LIVE_WINS)[number]; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(w.gameId)!;
  return (
    <li className="w-[84px] shrink-0">
      <button type="button" onClick={() => onPlay(g)} aria-label={`${w.player} won ${w.amount} ${coinById(w.coin).symbol} on ${g.name}, play it`} className="group flex w-full flex-col items-center gap-2 text-center outline-none">
        <span className="relative block h-[84px] w-[84px] overflow-hidden rounded-[12px]">
          <img src={g.image} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]" />
          <span aria-hidden className="absolute inset-0 rounded-[12px] ring-1 ring-inset ring-white/[0.08] transition group-hover:ring-2 group-hover:ring-[#B47CFF] group-focus-visible:ring-2 group-focus-visible:ring-[#B47CFF]" />
        </span>
        <span className="w-full truncate text-12 font-semibold text-[rgb(var(--k-muted))]">@{w.player.replace(/\s|\./g, '').toLowerCase()}</span>
        <CoinAmount coin={w.coin} amount={w.amount} className="-mt-1 text-14" />
      </button>
    </li>
  );
}

export function WinsStrip({ onPlay, loading, title = 'Recent wins', icon }: { onPlay: (g: CatalogueGame) => void; loading?: boolean; title?: string; icon?: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <section aria-labelledby="wins-title" className="flex min-w-0 flex-col gap-4">
      <SectionHead id="wins-title" icon={icon ?? <Crown weight="fill" className="text-[#B47CFF]" />} title={title}>
        <span className="flex items-center gap-2 text-14 font-semibold text-[rgb(var(--k-muted))]">
          <LiveDot />
          Live
        </span>
        <IconSquare size={44} label={paused ? `Play ${title}` : `Pause ${title}`} onClick={() => setPaused((p) => !p)}>
          {paused ? <Play weight="fill" className="h-4 w-4" aria-hidden /> : <Pause weight="fill" className="h-4 w-4" aria-hidden />}
        </IconSquare>
      </SectionHead>
      <div className="k-surface rounded-[20px] p-4">
        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 16 }, (_, i) => (
              <Skeleton key={i} className="h-[128px] w-[84px] shrink-0 rounded-[12px]" />
            ))}
          </div>
        ) : (
          <Marquee label={`${title}, moving`} seconds={70} className={cn(paused && '[&_.k-marquee]:[animation-play-state:paused]')}>
            <ul className="flex gap-3">
              {LIVE_WINS.map((w) => (
                <WinItem key={w.id} w={w} onPlay={onPlay} />
              ))}
            </ul>
          </Marquee>
        )}
      </div>
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
  const cols = 'grid grid-cols-[2.2fr_1fr_1.6fr_1.1fr_0.9fr_1.1fr] gap-4';
  return (
    <section aria-labelledby="bets-title" className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="bets-title" className="flex items-center gap-3 text-20 font-bold tracking-[-0.01em] text-ink">
            Latest bets
            <LiveDot />
          </h2>
          <p className="text-14 text-[rgb(var(--k-muted))]">Live bets and wins across the lagoon</p>
        </div>
        <div role="tablist" aria-label="Bets" className="k-well flex gap-1 rounded-[14px] p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'h-9 rounded-[10px] border px-4 text-14 font-semibold transition-colors',
                tab === t.value ? 'border-white/[0.12] bg-[rgb(var(--k-item-hover))] text-ink' : 'border-transparent text-[rgb(var(--k-muted))] hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" className="k-surface overflow-hidden rounded-[20px] p-2">
        <div aria-hidden className={cn(cols, 'k-well items-center rounded-[14px] px-4 py-3 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]')}>
          <span>Game</span>
          <span>Time</span>
          <span>Player</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Multiplier</span>
          <span className="text-right">Profit</span>
        </div>
        {state === 'loading' ? (
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[52px] w-full rounded-[12px]" />
            ))}
          </div>
        ) : state === 'error' ? (
          <Message className="py-[40px]" icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />} title="Live bets are paused" body="The feed lost its connection. It reconnects on its own, or reload the page." />
        ) : list.length === 0 ? (
          <Message className="py-[40px]" icon={<GameController weight="fill" className="h-10 w-10 text-[rgb(var(--k-dim))]" aria-hidden />} title="No bets here yet" body="Bets that match this tab show up the moment they land." />
        ) : (
          <ul aria-label="Latest bets" className="flex flex-col">
            {list.map((b) => {
              const g = gameById(b.gameId)!;
              const p = payout(b);
              return (
                <li key={b.id} className={cn(cols, 'items-center rounded-[12px] px-4 py-[10px] text-14 font-semibold transition-colors hover:bg-white/[0.03]')}>
                  <button type="button" onClick={() => onPlay(g)} className="flex min-w-0 items-center gap-3 rounded-[10px] text-left" aria-label={`Play ${g.name}`}>
                    <img src={g.image} alt="" className="h-10 w-10 shrink-0 rounded-[10px] object-cover" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-14 font-bold text-ink">{g.short ?? g.name}</span>
                      <span className="truncate text-12 font-medium text-[rgb(var(--k-dim))]">{g.provider}</span>
                    </span>
                  </button>
                  <span className="num font-medium text-[rgb(var(--k-muted))]">{b.time}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    {b.avatar ? (
                      <img src={b.avatar} alt="" className="h-[28px] w-[28px] shrink-0 rounded-full" />
                    ) : (
                      <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-[#4A2C80] text-12 font-bold text-ink">{b.initials}</span>
                    )}
                    <span className={cn('truncate', b.mine ? 'text-[#C9A2FF]' : 'text-ink')}>@{b.player.replace(/\s|\./g, '').toLowerCase()}</span>
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <span className="num text-ink">{formatAmount(b.wager, 0)}</span>
                    <Coin id={b.coin} size={16} />
                  </span>
                  <span className={cn('num text-right', b.multiplier > 0 ? 'text-ink' : 'text-[rgb(var(--k-dim))]')}>{b.multiplier.toFixed(2)}x</span>
                  <span className="flex items-center justify-end gap-2">
                    {p > 0 ? (
                      <>
                        <span className="num font-bold text-[#5FF0A0]">+{formatAmount(p, p >= 1000 ? 0 : 2)}</span>
                        <Coin id={b.coin} size={16} />
                      </>
                    ) : (
                      <span className="num pr-6 text-[rgb(var(--k-dim))]">0.00</span>
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
