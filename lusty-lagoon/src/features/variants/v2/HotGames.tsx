import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { CaretDown, Fire, MagnifyingGlass, Play, WarningCircle, X } from '@phosphor-icons/react';
import type { CatalogueGame } from '../../../data/games';
import { KitButton } from '../kit/parts';
import { cn } from '../../../lib/cn';
import { NAV } from './Sidebar';
import { ORDERED, type Filter } from './data';
import { SectionTitle, Skel, StateNote, useWide } from './ui';

// Hot games as whole rows of covers. The row holds as many covers as keep each at or under the
// smallest source cover (152 wide), seven at 1440 and ten at 1920. Two rows closed, every whole row open.

const TAG: Record<string, string> = {
  Hot: 'bg-[#FF6A2B] text-[#1A0F2B]',
  New: 'bg-[#B47CFF] text-[#1A0F2B]',
  Exclusive: 'bg-gold text-on-gold',
};

function Cover({ g, onPlay }: { g: CatalogueGame; onPlay: () => void }) {
  return (
    <button type="button" onClick={onPlay} aria-label={`Play ${g.name}, ${g.provider}`} className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-[rgb(var(--m2-surface))] outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--m2-ground))]">
      <img
        src={g.image}
        alt=""
        loading="lazy"
        // The hover scale stays off for a cover whose source has no room for it, so art never draws past its source size.
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth < img.offsetWidth * 1.06) img.dataset.tight = '';
        }}
        className="m2-cover-art h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
      />
      {g.tag && <span className={cn('absolute left-2 top-2 rounded-full px-2 text-12 font-extrabold leading-5', TAG[g.tag])}>{g.tag}</span>}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] flex h-[48px] w-[48px] -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full bg-ink text-[#1A0F2B] opacity-0 transition duration-200 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
        <Play weight="fill" className="h-5 w-5 translate-x-[1px]" />
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-x-2 bottom-2 flex translate-y-1 flex-col text-left opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        <span className="truncate text-14 font-bold text-ink">{g.short ?? g.name}</span>
        <span className="truncate text-12 font-semibold text-ink/80">{g.provider}</span>
      </span>
      <span aria-hidden className="m2-cover-ring pointer-events-none absolute inset-0 rounded-[16px]" />
    </button>
  );
}

/** As many columns as keep every cover at or under 152 wide, the smallest source cover. 7 at 1440, 10 at 1920. */
function useCoverColumns() {
  const wide = useWide();
  const ref = useRef<HTMLElement>(null);
  const [cols, setCols] = useState(wide ? 10 : 7);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setCols(Math.max(1, Math.ceil((el.clientWidth + GAP) / (MAX_COVER + GAP))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, cols };
}

const MAX_COVER = 152;
const GAP = 16;

export function HotGames({ filter, onFilter, query, onQuery, state, onPlay }: { filter: Filter; onFilter: (f: Filter) => void; query: string; onQuery: (q: string) => void; state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const { ref, cols } = useCoverColumns();
  const [all, setAll] = useState(false);
  const [failed, setFailed] = useState(state === 'error');
  const [draft, setDraft] = useState(query);
  const [synced, setSynced] = useState(query);
  if (query !== synced) {
    setSynced(query);
    setDraft(query);
  }
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ORDERED.filter((g) => (filter === 'all' || g.category === filter) && (!q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)));
  }, [filter, query]);
  // Whole rows only. A list shorter than a row shows as it is.
  const whole = list.length < cols ? list.length : Math.floor(list.length / cols) * cols;
  const shown = list.slice(0, all ? whole : Math.min(whole, cols * 2));
  const more = whole > cols * 2;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onQuery(draft);
  };
  const grid = 'grid gap-4';
  const gridStyle = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
  return (
    <section ref={ref} id="m2-games" aria-labelledby="m2-games-title" className="flex scroll-mt-[96px] flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <SectionTitle id="m2-games-title" icon={<Fire weight="fill" className="text-[#FF7A3D]" />} sub={`${list.length} games${filter === 'all' ? '' : `, ${NAV.find((n) => n.value === filter)!.label.toLowerCase()}`}`}>
          Hot right now
        </SectionTitle>
        <div className="flex min-w-0 items-center gap-2">
          <div role="radiogroup" aria-label="Category" className="m2-box m2-noscroll flex min-w-0 items-center gap-1 overflow-x-auto rounded-full p-1">
            {NAV.map((n) => {
              const on = filter === n.value;
              return (
                <button
                  key={n.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onFilter(n.value)}
                  className={cn(
                    'flex h-9 shrink-0 items-center rounded-full px-4 text-14 font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#B47CFF]',
                    on ? 'm2-nav-on' : 'text-[rgb(var(--m2-ink2))] hover:text-ink',
                  )}
                >
                  {n.value === 'all' ? 'All' : n.label}
                </button>
              );
            })}
          </div>
          <form role="search" onSubmit={submit} className="m2-box flex h-11 w-[220px] shrink-0 items-center gap-2 rounded-full pl-4 pr-1 focus-within:ring-2 focus-within:ring-[#B47CFF]">
            <MagnifyingGlass weight="bold" className="h-4 w-4 shrink-0 text-[rgb(var(--m2-ink3))]" aria-hidden />
            <label htmlFor="m2-games-search" className="sr-only">
              Search games
            </label>
            <input
              id="m2-games-search"
              type="search"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                onQuery(e.target.value);
              }}
              placeholder="Game or provider"
              className="h-full min-w-0 flex-1 bg-transparent text-14 font-semibold text-ink outline-none placeholder:text-[rgb(var(--m2-ink3))] [&::-webkit-search-cancel-button]:hidden"
            />
            {draft && (
              <button type="button" aria-label="Clear the search" onClick={() => onQuery('')} className="flex h-9 w-9 items-center justify-center rounded-full text-[rgb(var(--m2-ink3))] outline-none hover:bg-[rgb(var(--m2-raised))] hover:text-ink focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
                <X weight="bold" className="h-4 w-4" aria-hidden />
              </button>
            )}
          </form>
        </div>
      </div>
      {state === 'loading' ? (
        <div className={grid} style={gridStyle}>
          {Array.from({ length: cols * 2 }, (_, i) => (
            <Skel key={i} className="aspect-[3/4] w-full rounded-[16px]" />
          ))}
        </div>
      ) : failed ? (
        <div className="m2-box rounded-[24px]">
          <StateNote
            icon={<WarningCircle weight="fill" className="text-danger" />}
            title="We could not load the games"
            body="Your balance and bets are safe. Try again in a moment."
            action={
              <KitButton tone="purple" shape="pill" onClick={() => setFailed(false)} className="mt-1 h-[48px]">
                Try again
              </KitButton>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="m2-box rounded-[24px]">
          <StateNote
            icon={<MagnifyingGlass weight="bold" className="text-[rgb(var(--m2-ink3))]" />}
            title={`No games match "${query.trim()}"`}
            body="Check the spelling, or search by provider, such as Pragmatic Play."
            action={
              <KitButton tone="purple" shape="pill" onClick={() => onQuery('')} className="mt-1 h-[48px]">
                Clear the search
              </KitButton>
            }
          />
        </div>
      ) : (
        <>
          <ul className={grid} style={gridStyle}>
            {shown.map((g) => (
              <li key={g.id}>
                <Cover g={g} onPlay={() => onPlay(g)} />
              </li>
            ))}
          </ul>
          {(more || all) && (
            <div className="flex items-center gap-4">
              <span aria-hidden className="h-[1px] flex-1 bg-white/[0.06]" />
              <button
                type="button"
                aria-expanded={all}
                onClick={() => setAll((a) => !a)}
                className="m2-box m2-hover flex h-10 items-center gap-2 rounded-full px-6 text-14 font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
              >
                {all ? 'Show fewer' : `Show all ${whole} games`}
                <CaretDown weight="bold" className={cn('h-4 w-4 text-[rgb(var(--m2-ink3))] transition-transform', all && 'rotate-180')} aria-hidden />
              </button>
              <span aria-hidden className="h-[1px] flex-1 bg-white/[0.06]" />
            </div>
          )}
        </>
      )}
    </section>
  );
}
