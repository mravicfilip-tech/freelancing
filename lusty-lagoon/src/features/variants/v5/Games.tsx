import { forwardRef, useMemo, useState, type ReactNode } from 'react';
import { Cherries, Coins, Fish, GameController, Lightning, MagnifyingGlass, Play, Sparkle, SquaresFour, WarningCircle } from '@phosphor-icons/react';
import { GAMES, gameById, type CatalogueGame, type Category } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { EXPLORE_ORDER } from '../../lobby/data';
import { CONTINUE_PLAYING } from '../shared/data';
import { Key, Note, Skel, Title } from './ui';

// Jump back in, four glass cards with the session result signed. All games, covers seven across in
// whole rows at both widths, so a cover never draws past its smallest source width of 152. Glass
// filter pills, and a frosted name bar that rises on hover while the edge lights.

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07060B]';

export function JumpBackIn({ state, onPlay, className }: { state: string | null; onPlay: (g: CatalogueGame) => void; className?: string }) {
  return (
    <section aria-labelledby="jump-title" className={cn('flex flex-col gap-4', className)}>
      <div className="flex h-11 items-center pl-2">
        <Title id="jump-title">Jump back in</Title>
      </div>
      {state === 'empty' ? (
        <div className="gv-glass gv-edge rounded-3xl py-[40px]">
          <Note icon={<GameController weight="regular" className="text-[rgb(var(--gv-ink-2))]" aria-hidden />} title="Nothing to jump back into" body="The games you play land here, with how each session went." />
        </div>
      ) : (
        <ul className="grid grid-cols-4 gap-4 w1920:grid-cols-1 w1920:gap-3">
          {state === 'loading'
            ? Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="gv-glass gv-flat gv-edge flex h-[88px] items-center gap-3 rounded-[22px] p-3">
                  <Skel className="h-[64px] w-[64px] rounded-[14px]" />
                  <span className="flex flex-1 flex-col gap-2">
                    <Skel className="h-4 w-[96px] rounded-full" />
                    <Skel className="h-[12px] w-[64px] rounded-full" />
                  </span>
                </li>
              ))
            : CONTINUE_PLAYING.map((c) => {
                const g = gameById(c.gameId)!;
                const up = c.session >= 0;
                return (
                  <li key={c.gameId}>
                    <button
                      type="button"
                      onClick={() => onPlay(g)}
                      aria-label={`Play ${g.name}, last played ${c.lastPlayed}, session ${up ? 'up' : 'down'} ${formatAmount(Math.abs(c.session))} USDT`}
                      className={cn('gv-glass gv-flat gv-edge gv-hover group flex h-[88px] w-full items-center gap-4 rounded-[22px] p-3 text-left', FOCUS)}
                    >
                      <span className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[14px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                        <img src={g.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                        <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-[#07060B]/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#07060B]">
                            <Play weight="fill" className="h-[14px] w-[14px] translate-x-[1px]" />
                          </span>
                        </span>
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-16 font-semibold text-white">{g.short ?? g.name}</span>
                        <span className="truncate text-12 text-[rgb(var(--gv-ink-3))]">{c.lastPlayed}</span>
                        <span className={cn('num text-14 font-semibold', up ? 'text-[#38EE59]' : 'text-[rgb(var(--gv-ink-2))]')}>
                          {up ? '+' : '−'}
                          {formatAmount(Math.abs(c.session))} USDT
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
        </ul>
      )}
    </section>
  );
}

type Filter = 'all' | Category;
const CHIPS: { value: Filter; label: string; icon: ReactNode }[] = [
  { value: 'all', label: 'All', icon: <SquaresFour weight="regular" /> },
  { value: 'slots', label: 'Slots', icon: <Cherries weight="regular" /> },
  { value: 'megaways', label: 'Megaways', icon: <Lightning weight="regular" /> },
  { value: 'hold-and-win', label: 'Hold and win', icon: <Coins weight="regular" /> },
  { value: 'fish', label: 'Fish', icon: <Fish weight="regular" /> },
  { value: 'new', label: 'New', icon: <Sparkle weight="regular" /> },
];
const ORDERED = [...EXPLORE_ORDER.map((id) => gameById(id)!), ...GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id))];
const ROW = 7;

function Cover({ g, onPlay }: { g: CatalogueGame; onPlay: () => void }) {
  return (
    <button type="button" onClick={onPlay} aria-label={`Play ${g.name}, ${g.provider}`} className="gv-cover group aspect-[3/4] w-full focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07060B]">
      <img src={g.image} alt="" loading="lazy" className="h-full w-full object-cover" />
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07060B]/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full border border-white/20 bg-white/[0.16] text-white opacity-0 backdrop-blur-[12px] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
        <Play weight="fill" className="h-4 w-4 translate-x-[1px]" />
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-x-[6px] bottom-[6px] flex translate-y-2 flex-col rounded-[12px] border border-white/[0.06] bg-[#07060B]/60 px-3 py-2 text-left opacity-0 backdrop-blur-[16px] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        <span className="line-clamp-2 text-12 font-semibold leading-4 text-white">{g.short ?? g.name}</span>
        <span className="truncate text-12 leading-4 text-white/70">{g.provider}</span>
      </span>
    </button>
  );
}

export const AllGames = forwardRef<HTMLElement, { state: string | null; query: string; clearQuery: () => void; onPlay: (g: CatalogueGame) => void; className?: string }>(function AllGames({ state, query, clearQuery, onPlay, className }, ref) {
  const [filter, setFilter] = useState<Filter>('all');
  const [all, setAll] = useState(false);
  const [failed, setFailed] = useState(state === 'error');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ORDERED.filter((g) => (filter === 'all' || g.category === filter) && (!q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)));
  }, [filter, query]);
  const shown = all ? list : list.slice(0, ROW * 2);
  return (
    <section ref={ref} id="games" aria-labelledby="games-title" className={cn('flex min-w-0 scroll-mt-[104px] flex-col gap-4', className)}>
      <div className="flex min-h-[44px] items-center justify-between gap-4 pl-2">
        <div className="flex items-baseline gap-3">
          <Title id="games-title">All games</Title>
          <span className="num text-14 font-medium text-[rgb(var(--gv-ink-3))]" aria-live="polite">
            {list.length} {list.length === 1 ? 'game' : 'games'}
            {query.trim() ? ` for "${query.trim()}"` : ''}
          </span>
        </div>
        <div role="radiogroup" aria-label="Category" className="flex gap-2">
          {CHIPS.map((c) => {
            const on = c.value === filter;
            const count = c.value === 'all' ? ORDERED.length : ORDERED.filter((g) => g.category === c.value).length;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setFilter(c.value)}
                className={cn('flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-14 font-medium', FOCUS, on ? 'gv-on text-white' : 'gv-pill text-[rgb(var(--gv-ink-2))] hover:text-white')}
              >
                <span className={cn('flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4', on && 'text-[rgb(var(--gv-violet))]')}>{c.icon}</span>
                {c.label}
                <span className={cn('num text-12', on ? 'text-white/70' : 'text-[rgb(var(--gv-ink-3))]')}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      {state === 'loading' ? (
        <div className="grid grid-cols-7 gap-[14px] w1920:gap-4" role="status" aria-label="Loading games">
          {Array.from({ length: ROW * 2 }, (_, i) => (
            <Skel key={i} className="aspect-[3/4] w-full rounded-[16px]" />
          ))}
        </div>
      ) : failed ? (
        <div className="gv-glass gv-edge rounded-3xl py-12">
          <Note
            icon={<WarningCircle weight="fill" className="text-[#FF7A88]" aria-hidden />}
            title="We could not load the games"
            body="Your balance and wagers are safe. Try again in a moment."
            action={
              <Key tone="purple" onClick={() => setFailed(false)} className={cn('mt-2 h-11 px-6 text-14', FOCUS)}>
                Try again
              </Key>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="gv-glass gv-edge rounded-3xl py-12">
          <Note
            icon={<MagnifyingGlass weight="regular" className="text-[rgb(var(--gv-ink-2))]" aria-hidden />}
            title={query.trim() ? `No games match "${query.trim()}"` : 'No games in this group yet'}
            body="Check the spelling, or search by provider, such as Pragmatic Play."
            action={
              <Key
                tone="purple"
                onClick={() => {
                  clearQuery();
                  setFilter('all');
                }}
                className={cn('mt-2 h-11 px-6 text-14', FOCUS)}
              >
                Clear the search
              </Key>
            }
          />
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-7 gap-[14px] w1920:gap-4">
            {shown.map((g) => (
              <li key={g.id}>
                <Cover g={g} onPlay={() => onPlay(g)} />
              </li>
            ))}
          </ul>
          {list.length > ROW * 2 && (
            <div className="flex justify-center pt-2">
              <button type="button" onClick={() => setAll((a) => !a)} className={cn('gv-pill inline-flex h-11 items-center gap-2 rounded-full px-6 text-14 font-semibold text-white', FOCUS)}>
                {all ? 'Show fewer' : `Show all ${list.length} games`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
});
