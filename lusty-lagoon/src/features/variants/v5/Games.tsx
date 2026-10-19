import { forwardRef, useMemo, useState, type ReactNode } from 'react';
import { Cherries, Coins, Fish, Lightning, MagnifyingGlass, Play, Sparkle, SquaresFour, WarningCircle } from '@phosphor-icons/react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Message } from '../../../components/ui/Message';
import { GAMES, gameById, type CatalogueGame, type Category } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { EXPLORE_ORDER } from '../../lobby/data';
import { CONTINUE_PLAYING } from '../shared/data';
import { ChipRow, CoverCard, KitButton } from '../kit/parts';
import { CardTitle } from './ui';

// Jump back in, four flat rows with the session result signed and coloured. All games, small
// covers ten across at 1440 and twelve at 1920, with kit chips that filter and a show all.

export function JumpBackIn({ loading, onPlay }: { loading: boolean; onPlay: (g: CatalogueGame) => void }) {
  return (
    <section aria-labelledby="jump-title" className="flex flex-col gap-4">
      <CardTitle id="jump-title">Jump back in</CardTitle>
      <ul className="grid grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[88px] rounded-[20px]" />)
          : CONTINUE_PLAYING.map((c) => {
              const g = gameById(c.gameId)!;
              const up = c.session >= 0;
              return (
                <li key={c.gameId}>
                  <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}, last played ${c.lastPlayed}, session ${up ? 'up' : 'down'} ${formatAmount(Math.abs(c.session))} USDT`} className="group flex h-[88px] w-full items-center gap-3 rounded-[20px] bg-[rgb(var(--k-panel))] p-3 text-left transition-colors hover:bg-[rgb(var(--k-item))]">
                    <img src={g.image} alt="" className="h-[64px] w-[64px] shrink-0 rounded-[14px] object-cover" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-16 font-bold text-ink">{g.short ?? g.name}</span>
                      <span className="truncate text-12 font-semibold text-[rgb(var(--k-muted))]">{c.lastPlayed}</span>
                      <span className={cn('num text-14 font-bold', up ? 'text-win' : 'text-[rgb(var(--k-muted))]')}>
                        {up ? '+' : '−'}
                        {formatAmount(Math.abs(c.session))} USDT
                      </span>
                    </span>
                    <span aria-hidden className="k-btn-purple flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-ink opacity-90 transition group-hover:opacity-100">
                      <Play weight="fill" className="h-4 w-4" />
                    </span>
                  </button>
                </li>
              );
            })}
      </ul>
    </section>
  );
}

type Filter = 'all' | Category;
const CHIPS: { value: Filter; label: string; icon: ReactNode }[] = [
  { value: 'all', label: 'All', icon: <SquaresFour weight="fill" /> },
  { value: 'slots', label: 'Slots', icon: <Cherries weight="fill" /> },
  { value: 'megaways', label: 'Megaways', icon: <Lightning weight="fill" /> },
  { value: 'hold-and-win', label: 'Hold and win', icon: <Coins weight="fill" /> },
  { value: 'fish', label: 'Fish games', icon: <Fish weight="fill" /> },
  { value: 'new', label: 'New', icon: <Sparkle weight="fill" /> },
];
const ORDERED = [...EXPLORE_ORDER.map((id) => gameById(id)!), ...GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id))];

export const AllGames = forwardRef<HTMLElement, { state: string | null; query: string; clearQuery: () => void; onPlay: (g: CatalogueGame) => void }>(function AllGames({ state, query, clearQuery, onPlay }, ref) {
  const [filter, setFilter] = useState<Filter>('all');
  const [all, setAll] = useState(false);
  const [failed, setFailed] = useState(state === 'error');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ORDERED.filter((g) => (filter === 'all' || g.category === filter) && (!q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)));
  }, [filter, query]);
  // Two full rows, ten across at 1440 and twelve from 1920.
  const [rowLen] = useState(() => (window.matchMedia('(min-width: 1920px)').matches ? 12 : 10));
  const shown = all ? list : list.slice(0, rowLen * 2);
  return (
    <section ref={ref} id="games" aria-labelledby="games-title" className="flex scroll-mt-[100px] flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <CardTitle id="games-title">All games</CardTitle>
          <span className="num text-14 font-semibold text-[rgb(var(--k-muted))]" aria-live="polite">
            {list.length} {list.length === 1 ? 'game' : 'games'}
            {query.trim() ? ` for "${query.trim()}"` : ''}
          </span>
        </div>
        <ChipRow wrap={false} label="Category" value={filter} onChange={setFilter} items={CHIPS.map((c) => ({ ...c, count: c.value === 'all' ? ORDERED.length : ORDERED.filter((g) => g.category === c.value).length }))} />
      </div>
      {state === 'loading' ? (
        <div className="grid grid-cols-10 gap-3 w1920:grid-cols-12">
          {Array.from({ length: 20 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-[14px]" />
          ))}
        </div>
      ) : failed ? (
        <div className="rounded-[20px] bg-[rgb(var(--k-panel))]">
          <Message
            icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
            title="We could not load the games"
            body="Your balance and wagers are safe. Try again in a moment."
            action={
              <KitButton tone="purple" onClick={() => setFailed(false)}>
                Try again
              </KitButton>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-[20px] bg-[rgb(var(--k-panel))]">
          <Message
            icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-[rgb(var(--k-dim))]" aria-hidden />}
            title={`No games match "${query.trim()}"`}
            body="Check the spelling, or search by provider, such as Pragmatic Play."
            action={
              <KitButton
                tone="purple"
                onClick={() => {
                  clearQuery();
                  setFilter('all');
                }}
              >
                Clear the search
              </KitButton>
            }
          />
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-10 gap-3 w1920:grid-cols-12">
            {shown.map((g) => (
              <li key={g.id}>
                <CoverCard image={g.image} name={g.name} provider={g.provider} onPlay={() => onPlay(g)} className="rounded-[14px]" />
              </li>
            ))}
          </ul>
          {list.length > rowLen * 2 && (
            <div className="flex justify-center">
              <KitButton tone="dark" size="md" onClick={() => setAll((a) => !a)} className="h-11 w-[220px]">
                {all ? 'Show fewer' : `Show all ${list.length} games`}
              </KitButton>
            </div>
          )}
        </>
      )}
    </section>
  );
});
