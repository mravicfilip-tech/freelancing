import { useMemo, useState } from 'react';
import { ClockCounterClockwise, Crown, Fire, GameController, MagnifyingGlass, Play, WarningCircle } from '@phosphor-icons/react';
import { Message } from '../../../components/ui/Message';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { CONTINUE_PLAYING } from '../shared/data';
import { Coin, KitButton } from '../kit/parts';
import { NAV_GAMES } from './Shell';
import { Avatar, Head, RankBadge, Skel } from './parts';
import { handle, ORDERED, TOP_WINS, type Filter } from './games-data';

// The games after the reasons to come back. Pick up where you left off as four covers with the
// session result, Top wins today beside it as a ranked list with gold, silver and bronze badges, then
// Hot right now, purple key chips, a search and two whole rows of covers, the top three ranked.

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0B2C]';

/** A game cover. The edge lights purple and the art scales inside the clip on hover, a play mark shows. */
function Cover({ game, onPlay, rank, className }: { game: CatalogueGame; onPlay: () => void; rank?: number; className?: string }) {
  return (
    <button type="button" onClick={onPlay} aria-label={`Play ${game.name}, ${game.provider}${rank ? `, number ${rank} right now` : ''}`} className={cn('group relative block aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-[rgb(var(--a-row))]', FOCUS, className)}>
      <img src={game.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 flex h-[48px] w-12 -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full bg-ink text-[#1A0F2B] opacity-0 transition duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
        <Play weight="fill" className="h-5 w-5 translate-x-[1px]" />
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-1 truncate text-left text-12 font-semibold text-ink/90 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        {game.provider}
      </span>
      {rank && <RankBadge place={rank} size={32} className="absolute left-2 top-2" />}
      <span aria-hidden className="a-cover-ring pointer-events-none absolute inset-0 rounded-[16px]" />
    </button>
  );
}

export function ContinuePlaying({ onPlay, state }: { onPlay: (g: CatalogueGame) => void; state: string | null }) {
  return (
    <section aria-labelledby="v3-continue-title" className="flex min-w-0 flex-col gap-4">
      <Head id="v3-continue-title" icon={<ClockCounterClockwise weight="bold" />} tint="#7FA8FF" title="Pick up where you left off" />
      {state === 'loading' ? (
        <div className="grid flex-1 grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skel key={i} className="min-h-[264px] rounded-[16px]" />
          ))}
        </div>
      ) : state === 'empty' ? (
        <div className="a-panel flex flex-1 items-center justify-center rounded-[16px]">
          <Message
            className="py-8"
            icon={<GameController weight="fill" className="h-10 w-10 text-[#7FA8FF]" aria-hidden />}
            title="No games played yet"
            body="The games you play land here, so you can pick up where you left off."
          />
        </div>
      ) : (
        <ul className="grid flex-1 grid-cols-4 gap-3">
          {CONTINUE_PLAYING.map((c) => {
            const g = gameById(c.gameId)!;
            const up = c.session >= 0;
            return (
              <li key={c.gameId} className="a-panel a-hover flex flex-col rounded-[16px] p-2 hover:border-[color:var(--a-edge-hi)]">
                <Cover game={g} onPlay={() => onPlay(g)} />
                <div className="flex flex-1 flex-col justify-center gap-1 px-2 pb-1 pt-3">
                  <p className="truncate text-14 font-bold text-ink">{g.short ?? g.name}</p>
                  <p className="flex items-center justify-between gap-2">
                    <span className="a-muted truncate text-12 font-semibold">{c.lastPlayed}</span>
                    <span className={cn('num shrink-0 text-12 font-bold', up ? 'text-[#3DD68C]' : 'a-muted')}>
                      {up ? '+' : '-'}
                      {formatAmount(Math.abs(c.session))}
                      <span className="sr-only"> USDT {up ? 'up' : 'down'} this session</span>
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function TopWins({ onPlay, state }: { onPlay: (g: CatalogueGame) => void; state: string | null }) {
  return (
    <section aria-labelledby="v3-wins-title" className="flex min-w-0 flex-col gap-4">
      <Head id="v3-wins-title" icon={<Crown weight="fill" />} tint="#F4D543" title="Top wins today" />
      <ol className="a-panel flex flex-1 flex-col gap-1 rounded-[16px] p-2">
        {state === 'loading'
          ? Array.from({ length: 5 }, (_, i) => <Skel key={i} className="min-h-[44px] flex-1" />)
          : state === 'error'
            ? (
              <li className="flex flex-1 items-center justify-center">
                <Message className="py-6" icon={<WarningCircle weight="fill" className="h-8 w-8 text-danger" aria-hidden />} title="Wins are paused" body="The feed lost its connection and reconnects on its own." />
              </li>
            )
            : TOP_WINS.map((w, i) => {
                const g = gameById(w.gameId)!;
                const c = coinById(w.coin);
                const digits = c.decimals > 2 && w.amount < 100 ? 2 : w.amount >= 1000 ? 0 : 2;
                return (
                  <li key={w.id} className="flex flex-1">
                    <button
                      type="button"
                      onClick={() => onPlay(g)}
                      aria-label={`Number ${i + 1}, ${w.player} won ${formatAmount(w.amount, digits)} ${c.symbol} on ${g.name}, play it`}
                      className={cn('flex min-h-[44px] w-full items-center gap-3 rounded-[12px] border border-transparent px-2 text-left transition-colors hover:border-white/[0.06] hover:bg-[rgb(var(--a-row))]', FOCUS)}
                    >
                      <RankBadge place={i + 1} size={32} />
                      <img src={g.image} alt="" className="h-10 w-10 shrink-0 rounded-[8px] object-cover w1920:h-[48px] w1920:w-12" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-14 font-bold text-ink">{g.short ?? g.name}</span>
                        <span className="a-muted flex min-w-0 items-center gap-1 text-12 font-semibold">
                          <Avatar src={w.avatar} name={w.player} size={20} />
                          <span className="truncate">{handle(w.player)}</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="num flex items-center gap-1 text-14 font-bold text-[#3DD68C]">
                          <Coin id={w.coin} size={16} />
                          {formatAmount(w.amount, digits)}
                        </span>
                        <span className="num a-muted text-12 font-semibold">{formatAmount(w.usd, 0)} USDT</span>
                      </span>
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
  // Two whole rows, six covers a row at 1440 and seven at 1920. The full list of 42 is whole at both.
  const shown = all ? list : list.slice(0, 14);
  const ranked = filter === 'all' && !query.trim();
  return (
    <section id="hot" aria-labelledby="v3-hot-title" className="flex scroll-mt-[96px] flex-col gap-4">
      <Head id="v3-hot-title" icon={<Fire weight="fill" />} tint="#FF8A3D" title="Hot right now" sub="The most played games in the lagoon this hour">
        {list.length > 12 && (
          <button type="button" onClick={() => setAll((a) => !a)} aria-expanded={all} className={cn('a-row a-hover flex h-11 items-center rounded-[12px] px-4 text-14 font-semibold text-ink hover:bg-[rgb(var(--a-raised))]', FOCUS)}>
            {all ? 'Show less' : `View all ${list.length}`}
          </button>
        )}
      </Head>
      <div className="flex items-center gap-3">
        <div role="radiogroup" aria-label="Category" className="a-no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {NAV_GAMES.map((n) => {
            const on = filter === n.value;
            return (
              <button
                key={n.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onFilter(n.value)}
                className={cn('flex h-11 shrink-0 items-center gap-2 rounded-[12px] border px-4 text-14 font-semibold transition-colors [&>svg]:h-[18px] [&>svg]:w-[18px]', FOCUS, on ? 'a-on' : 'a-row a-muted hover:bg-[rgb(var(--a-raised))] hover:text-ink')}
              >
                {n.icon}
                {n.value === 'all' ? 'All' : n.label}
              </button>
            );
          })}
        </div>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="a-row flex h-11 w-[260px] shrink-0 items-center gap-2 rounded-[12px] px-3 focus-within:ring-2 focus-within:ring-[#B47CFF]">
          <MagnifyingGlass weight="bold" className="a-muted h-4 w-4 shrink-0" aria-hidden />
          <label htmlFor="v3-grid-search" className="sr-only">
            Search games or providers
          </label>
          <input id="v3-grid-search" type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search games or providers" className="h-full min-w-0 flex-1 bg-transparent text-14 font-semibold text-ink outline-none placeholder:text-[rgb(var(--a-muted))]" />
        </form>
      </div>
      {state === 'loading' ? (
        <div className="grid grid-cols-6 gap-3 w1920:grid-cols-7">
          {Array.from({ length: 14 }, (_, i) => (
            <Skel key={i} className={cn('aspect-[3/4] rounded-[16px]', i >= 12 && 'hidden w1920:block')} />
          ))}
        </div>
      ) : failed ? (
        <div className="a-panel rounded-[16px]">
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
        <div className="a-panel rounded-[16px]">
          <Message
            icon={<MagnifyingGlass weight="bold" className="a-muted h-10 w-10" aria-hidden />}
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
        <ul className="grid grid-cols-6 gap-3 w1920:grid-cols-7">
          {shown.map((g, i) => (
            <li key={g.id} className={cn(!all && i >= 12 && 'hidden w1920:block')}>
              <Cover game={g} onPlay={() => onPlay(g)} rank={ranked && i < 3 ? i + 1 : undefined} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
