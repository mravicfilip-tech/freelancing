import { useMemo, useState } from 'react';
import { ClockCounterClockwise, Crown, Fire, MagnifyingGlass, Play, WarningCircle } from '@phosphor-icons/react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Message } from '../../../components/ui/Message';
import { gameById, type CatalogueGame } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { TOP_WINNERS } from '../../lobby/data';
import { CONTINUE_PLAYING } from '../shared/data';
import { ChipRow, CoinAmount, CoverCard, KitButton, RailControls, SectionHead } from '../kit/parts';
import { SearchBox } from '../kit/TopParts';
import { NAV_GAMES } from './Shell';
import { ORDERED, type Filter } from './games-data';

// The games, after the reasons to come back. Pick up where you left off as four wide cards, top
// wins today beside it, then the hot right now grid with Turbo Bet's boxed chips and search.

export function ContinuePlaying({ onPlay }: { onPlay: (g: CatalogueGame) => void }) {
  return (
    <section aria-labelledby="v3-continue-title" className="flex min-w-0 flex-1 flex-col gap-4">
      <SectionHead id="v3-continue-title" icon={<ClockCounterClockwise weight="bold" className="text-[#2FB4F0]" />} title="Pick up where you left off" />
      <ul className="grid flex-1 auto-rows-fr grid-cols-2 gap-3">
        {CONTINUE_PLAYING.map((c) => {
          const g = gameById(c.gameId)!;
          const up = c.session >= 0;
          return (
            <li key={c.gameId}>
              <button
                type="button"
                onClick={() => onPlay(g)}
                aria-label={`Play ${g.name}, last played ${c.lastPlayed}, session ${up ? 'up' : 'down'} ${formatAmount(Math.abs(c.session))} USDT`}
                className="k-surface group flex w-full items-center gap-4 rounded-[20px] p-4 text-left outline-none transition-[border-color] duration-200 hover:border-[color:var(--k-edge-hi)] focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
              >
                <img src={g.image} alt="" className="h-[88px] w-[88px] shrink-0 rounded-[16px] object-cover object-top" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-16 font-bold text-ink">{g.name}</span>
                  <span className="truncate text-14 text-[rgb(var(--k-muted))]">{c.lastPlayed}</span>
                  <span className={cn('num mt-1 inline-flex h-8 w-fit items-center rounded-[8px] px-2 text-14 font-bold', up ? 'bg-[#3DDC84]/10 text-[#5FF0A0]' : 'bg-white/[0.06] text-[rgb(var(--k-muted))]')}>
                    {up ? '+' : '-'}
                    {formatAmount(Math.abs(c.session))} USDT
                  </span>
                </span>
                <span aria-hidden className="k-btn-purple flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-ink group-hover:brightness-110">
                  <Play weight="fill" className="h-5 w-5" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TopWins({ onPlay, loading }: { onPlay: (g: CatalogueGame) => void; loading?: boolean }) {
  return (
    <section aria-labelledby="v3-wins-title" className="flex w-[400px] shrink-0 flex-col gap-4 w1920:w-[480px]">
      <SectionHead id="v3-wins-title" icon={<Crown weight="fill" className="text-[#F5B800]" />} title="Top wins today" />
      <ol className="k-surface flex flex-1 flex-col gap-2 rounded-[20px] p-3">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[52px] w-full rounded-[12px]" />)
          : TOP_WINNERS.map((w, i) => {
              const g = gameById(w.gameId)!;
              return (
                <li key={w.gameId}>
                  <button type="button" onClick={() => onPlay(g)} aria-label={`${w.player} won on ${g.name}, play it`} className="flex w-full items-center gap-3 rounded-[12px] p-2 pr-3 text-left outline-none transition-colors hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
                    <span className={cn('num flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-14 font-bold', i === 0 ? 'bg-gold text-on-gold' : 'bg-white/[0.06] text-[rgb(var(--k-muted))]')}>{i + 1}</span>
                    <img src={g.image} alt="" className="h-10 w-10 shrink-0 rounded-[10px] object-cover" />
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-14 font-bold text-ink">{g.short ?? g.name}</span>
                      <span className="flex items-center gap-1 truncate text-12 text-[rgb(var(--k-muted))]">
                        <img src={w.avatar} alt="" className="h-4 w-4 rounded-full" />@{w.player.toLowerCase()}
                      </span>
                    </span>
                    <CoinAmount coin={w.coin} amount={w.amount} className="text-14 text-[#5FF0A0]" />
                  </button>
                </li>
              );
            })}
      </ol>
    </section>
  );
}

export function HotGrid({
  filter,
  onFilter,
  query,
  onQuery,
  state,
  failed,
  onRetry,
  onPlay,
}: {
  filter: Filter;
  onFilter: (f: Filter) => void;
  query: string;
  onQuery: (q: string) => void;
  state: string | null;
  failed: boolean;
  onRetry: () => void;
  onPlay: (g: CatalogueGame) => void;
}) {
  const [all, setAll] = useState(false);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ORDERED.filter((g) => (filter === 'all' || g.category === filter) && (!q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)));
  }, [filter, query]);
  const shown = all ? list : list.slice(0, 12);
  const step = (d: 1 | -1) => onFilter(NAV_GAMES[(NAV_GAMES.findIndex((n) => n.value === filter) + NAV_GAMES.length + d) % NAV_GAMES.length].value);
  return (
    <section id="hot" aria-labelledby="v3-hot-title" className="flex scroll-mt-[100px] flex-col gap-4">
      <SectionHead id="v3-hot-title" icon={<Fire weight="fill" className="text-[#FF8A3D]" />} title="Hot right now">
        <RailControls label="Hot right now" onAll={() => setAll((a) => !a)} onPrev={() => step(-1)} onNext={() => step(1)} />
      </SectionHead>
      <div className="flex items-center gap-3">
        <div className="k-no-scrollbar min-w-0 flex-1 overflow-x-auto">
          <ChipRow wrap={false} label="Category" value={filter} onChange={onFilter} items={NAV_GAMES.map((n) => ({ value: n.value, label: n.value === 'all' ? 'All' : n.label, icon: n.icon }))} />
        </div>
        <SearchBox id="v3-grid-search" value={query} onChange={onQuery} className="h-11 w-[240px] shrink-0 rounded-[12px]" />
      </div>
      {state === 'loading' ? (
        <div className="grid grid-cols-6 gap-3 w1920:grid-cols-8">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-[16px]" />
          ))}
        </div>
      ) : failed ? (
        <div className="k-surface rounded-[20px]">
          <Message
            icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
            title="We could not load the games"
            body="Your balance and bets are safe. Try again in a moment."
            action={
              <KitButton tone="purple" onClick={onRetry}>
                Try again
              </KitButton>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="k-surface rounded-[20px]">
          <Message
            icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-[rgb(var(--k-dim))]" aria-hidden />}
            title={`No games match "${query.trim()}"`}
            body="Check the spelling, or search by provider, such as Pragmatic Play."
            action={
              <KitButton tone="purple" onClick={() => onQuery('')}>
                Clear the search
              </KitButton>
            }
          />
        </div>
      ) : (
        <ul className="grid grid-cols-6 gap-3 w1920:grid-cols-8">
          {shown.map((g) => (
            <li key={g.id}>
              <CoverCard image={g.image} name={g.name} provider={g.provider} onPlay={() => onPlay(g)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
