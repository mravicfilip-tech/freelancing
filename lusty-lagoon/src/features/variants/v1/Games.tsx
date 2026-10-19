import { forwardRef, useEffect, useMemo, useState } from 'react';
import * as M from '@radix-ui/react-dropdown-menu';
import { CaretDown, Check, Fire, MagnifyingGlass, Play, SortAscending, WarningCircle, X } from '@phosphor-icons/react';
import type { CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { KitButton } from '../kit/parts';
import { NMessage, Segments, Skel } from './ui';
import { NAV, ORDERED, type Filter } from './nav';

// All games after Snegbet's finder. A title with the count, a wide search, a sort menu, pill segments
// with the vivid purple pill on, then covers in whole rows only, 5 across below 1920 and 7 from 1920.

type Sort = 'popular' | 'az' | 'rtp';
const SORTS: { value: Sort; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'az', label: 'A to Z' },
  { value: 'rtp', label: 'Highest RTP' },
];

function useColumns() {
  const q = '(min-width: 1920px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide ? 7 : 5;
}

const TAG: Record<string, string> = { Hot: 'bg-[linear-gradient(180deg,#FF7A3D,#E8430F)] text-ink', New: 'bg-[#2F7BFF] text-ink', Exclusive: 'bg-[linear-gradient(180deg,#FFE066,#F4C430)] text-[#2A1A00]' };

function Cover({ g, onPlay }: { g: CatalogueGame; onPlay: () => void }) {
  return (
    <button type="button" onClick={onPlay} aria-label={`Play ${g.name}, ${g.provider}${g.tag ? `, ${g.tag}` : ''}`} className="n1-ring group relative block aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-[rgb(var(--n-raised))]">
      <img src={g.image} alt="" loading="lazy" className="n1-zoom h-full w-full object-cover" />
      {g.tag && <span className={cn('absolute left-2 top-2 rounded-[6px] px-[6px] text-12 font-extrabold uppercase leading-5 tracking-[0.04em]', TAG[g.tag])}>{g.tag}</span>}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0D0A26]/90 via-[#0D0A26]/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span aria-hidden className="k-key pointer-events-none absolute left-1/2 top-1/2 flex h-[48px] w-12 -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full opacity-0 transition duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
        <Play weight="fill" className="h-5 w-5 translate-x-px" />
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-1 flex-col text-left opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="truncate text-14 font-extrabold text-ink">{g.short ?? g.name}</span>
        <span className="truncate text-12 font-semibold text-[rgb(var(--n-muted))]">{g.provider}</span>
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[16px] ring-1 ring-inset ring-white/[0.08] transition-[box-shadow] duration-200 group-hover:ring-2 group-hover:ring-[#B47CFF]" />
    </button>
  );
}

export const Games = forwardRef<HTMLInputElement, { filter: Filter; onFilter: (f: Filter) => void; state: string | null; onPlay: (g: CatalogueGame) => void }>(function Games({ filter, onFilter, state, onPlay }, searchRef) {
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [sort, setSort] = useState<Sort>('popular');
  const [all, setAll] = useState(false);
  const [failed, setFailed] = useState(state === 'error');
  const cols = useColumns();
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = ORDERED.filter((g) => (filter === 'all' || g.category === filter) && (!q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)));
    if (sort === 'az') out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'rtp') out.sort((a, b) => b.rtp - a.rtp);
    return out;
  }, [filter, query, sort]);
  // Whole rows only. Two rows closed, every whole row open. A list shorter than a row shows as it is.
  const whole = list.length < cols ? list.length : Math.floor(list.length / cols) * cols;
  const shown = list.slice(0, all ? whole : Math.min(whole, cols * 2));
  const more = whole > cols * 2;
  const sortLabel = SORTS.find((s) => s.value === sort)!.label;

  return (
    <section id="n1-games" aria-labelledby="n1-games-title" className="flex scroll-mt-[96px] flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 id="n1-games-title" className="flex items-center gap-3 text-20 font-extrabold tracking-[-0.01em] text-ink">
          <Fire weight="fill" className="h-6 w-6 text-[#FF7A3D]" aria-hidden />
          All games
          <span className="num rounded-[8px] bg-white/[0.08] px-2 text-12 font-extrabold leading-6 text-[rgb(var(--n-muted))]">{list.length}</span>
        </h2>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="n1-raised ml-auto flex h-11 w-[300px] items-center gap-3 rounded-[12px] px-4 focus-within:border-[#9A4BFF]/70 w1920:w-[380px]">
          <MagnifyingGlass weight="bold" className="h-[18px] w-[18px] shrink-0 text-[rgb(var(--n-dim))]" aria-hidden />
          <label htmlFor="n1-search" className="sr-only">
            Search for games
          </label>
          <input ref={searchRef} id="n1-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for games" className="h-full min-w-0 flex-1 bg-transparent text-14 font-semibold text-ink outline-none placeholder:text-[rgb(var(--n-dim))] [&::-webkit-search-cancel-button]:hidden" />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear the search" className="n1-ring flex h-6 w-6 items-center justify-center rounded-[6px] text-[rgb(var(--n-muted))] hover:bg-white/[0.08] hover:text-ink">
              <X weight="bold" className="h-[14px] w-[14px]" aria-hidden />
            </button>
          )}
        </form>
        <M.Root>
          <M.Trigger aria-label={`Sort by ${sortLabel}`} className="n1-raised n1-hoverable n1-ring group flex h-11 items-center gap-2 rounded-[12px] px-4 text-14 font-semibold text-[rgb(var(--n-muted))] data-[state=open]:bg-[rgb(var(--n-hover))]">
            <SortAscending weight="bold" className="h-[18px] w-[18px]" aria-hidden />
            Sort by <span className="font-extrabold text-ink">{sortLabel}</span>
            <CaretDown weight="bold" className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
          </M.Trigger>
          <M.Portal>
            <M.Content align="end" sideOffset={8} className="n1 n1-panel z-30 w-[200px] rounded-[16px] p-2 shadow-[0_24px_48px_rgb(0_0_0/0.5)]">
              <M.RadioGroup value={sort} onValueChange={(v) => setSort(v as Sort)}>
                {SORTS.map((s) => (
                  <M.RadioItem key={s.value} value={s.value} className="flex h-10 cursor-pointer select-none items-center gap-3 rounded-[10px] px-3 text-14 font-semibold text-ink outline-none data-[highlighted]:bg-white/[0.06]">
                    <span className="flex-1">{s.label}</span>
                    <M.ItemIndicator>
                      <Check weight="bold" className="h-4 w-4 text-[#C9A2FF]" aria-hidden />
                    </M.ItemIndicator>
                  </M.RadioItem>
                ))}
              </M.RadioGroup>
            </M.Content>
          </M.Portal>
        </M.Root>
      </div>

      <Segments label="Category" value={filter} onChange={onFilter} items={NAV.map((n) => ({ value: n.value, label: n.chip, icon: n.icon }))} className="n1-noscroll overflow-x-auto" />

      {state === 'loading' ? (
        <div className="grid grid-cols-5 gap-3 w1920:grid-cols-7">
          {Array.from({ length: 14 }, (_, i) => (
            <Skel key={i} className={cn('aspect-[3/4] w-full rounded-[16px]', i >= 10 && 'hidden w1920:block')} />
          ))}
        </div>
      ) : failed ? (
        <div className="n1-panel rounded-[20px]">
          <NMessage
            icon={<WarningCircle weight="fill" className="text-danger" />}
            title="We could not load the games"
            body="Your balance and bets are safe. Try again in a moment."
            action={
              <KitButton tone="purple" onClick={() => setFailed(false)} className="h-[48px]">
                Try again
              </KitButton>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="n1-panel rounded-[20px]">
          <NMessage
            icon={<MagnifyingGlass weight="bold" className="text-[rgb(var(--n-muted))]" />}
            title={`No games match "${query.trim()}"`}
            body="Check the spelling, or search by provider, such as Pragmatic Play."
            action={
              <KitButton tone="purple" onClick={() => setQuery('')} className="h-[48px]">
                Clear the search
              </KitButton>
            }
          />
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-5 gap-3 w1920:grid-cols-7">
            {shown.map((g) => (
              <li key={g.id}>
                <Cover g={g} onPlay={() => onPlay(g)} />
              </li>
            ))}
          </ul>
          {(more || all) && (
            <div className="flex items-center gap-4">
              <span aria-hidden className="h-px flex-1 bg-white/[0.06]" />
              <span className="num text-12 font-bold text-[rgb(var(--n-dim))]">
                {shown.length} of {list.length}
              </span>
              <button type="button" onClick={() => setAll((a) => !a)} aria-expanded={all} className="n1-raised n1-hoverable n1-ring h-11 rounded-full px-6 text-14 font-extrabold text-ink">
                {all ? 'Show fewer' : 'Show all games'}
              </button>
              <span aria-hidden className="h-px flex-1 bg-white/[0.06]" />
            </div>
          )}
        </>
      )}
    </section>
  );
});
