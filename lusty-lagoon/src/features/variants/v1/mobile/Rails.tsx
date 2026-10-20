import { useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowRight, CaretRight, Cherries, Coins, Fire, Lightning, MagnifyingGlass, Sparkle, WarningCircle } from '@phosphor-icons/react';
import type { CatalogueGame } from '../../../../data/games';
import { cn } from '../../../../lib/cn';
import { Key, NMessage, Skel } from '../ui';
import { ORDERED, type Filter } from '../nav';

// Iteration 2. All games as side scrolling rails by category instead of one grid, Hot, Slots,
// Megaways, Hold and win and New. Each rail bleeds to the screen edges and snaps to a cover, and ends
// on a See all tile. See all and the search open the full height games panel, which holds the grid,
// the chips and the search.

type Rail = { id: string; title: string; icon: ReactNode; hue: string; filter: Filter; list: CatalogueGame[] };

const RAILS: Rail[] = [
  { id: 'hot', title: 'Hot', icon: <Fire weight="fill" />, hue: '#FF7A3D', filter: 'all', list: ORDERED.filter((g) => g.tag === 'Hot') },
  { id: 'slots', title: 'Slots', icon: <Cherries weight="fill" />, hue: '#BEA6FF', filter: 'slots', list: ORDERED.filter((g) => g.category === 'slots') },
  { id: 'megaways', title: 'Megaways', icon: <Lightning weight="fill" />, hue: '#60AAFF', filter: 'megaways', list: ORDERED.filter((g) => g.category === 'megaways') },
  { id: 'hold', title: 'Hold and win', icon: <Coins weight="fill" />, hue: '#FFA854', filter: 'hold-and-win', list: ORDERED.filter((g) => g.category === 'hold-and-win') },
  { id: 'new', title: 'New', icon: <Sparkle weight="fill" />, hue: '#64D678', filter: 'new', list: ORDERED.filter((g) => g.category === 'new') },
];

const SHOWN = 10;
const TAG: Record<string, string> = { Hot: 'bg-[linear-gradient(180deg,#FF7A3D,#E8430F)] text-ink', New: 'bg-[#2F6FE8] text-ink', Exclusive: 'n1-pill-on text-ink' };

function RailCover({ g, onPlay }: { g: CatalogueGame; onPlay: () => void }) {
  return (
    <button type="button" onClick={onPlay} aria-label={`Play ${g.name}, ${g.provider}${g.tag ? `, ${g.tag}` : ''}`} className="n1-ring group flex w-full flex-col gap-2 rounded-[16px] text-left">
      <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-[rgb(var(--n-raised))]">
        <img src={g.image} alt="" loading="lazy" className="n1-zoom h-full w-full object-cover" />
        {g.tag && <span className={cn('absolute left-2 top-2 rounded-[6px] px-[6px] text-12 font-extrabold uppercase leading-5 tracking-[0.04em]', TAG[g.tag])}>{g.tag}</span>}
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[16px] ring-1 ring-inset ring-white/[0.08] transition-[box-shadow] duration-200 group-hover:ring-2 group-hover:ring-[#B47CFF]" />
      </span>
      <span aria-hidden className="flex min-w-0 flex-col px-1">
        <span className="truncate text-14 font-bold leading-5 text-ink">{g.short ?? g.name}</span>
        <span className="truncate text-12 font-medium text-[rgb(var(--n-dim))]">{g.provider}</span>
      </span>
    </button>
  );
}

export function Rails({ state, onPlay, onSeeAll, onSearch }: { state: string | null; onPlay: (g: CatalogueGame) => void; onSeeAll: (f: Filter, e: MouseEvent<HTMLButtonElement>) => void; onSearch: (e: MouseEvent<HTMLButtonElement>) => void }) {
  const [failed, setFailed] = useState(state === 'error');
  return (
    <section id="n1m-rails" aria-labelledby="n1m-rails-title" className="flex scroll-mt-[72px] flex-col gap-4">
      <div className="flex h-11 items-center">
        <h2 id="n1m-rails-title" className="flex items-center gap-3 font-display text-20 font-bold tracking-[-0.01em] text-ink">
          <Fire weight="fill" className="h-6 w-6 text-[#FF7A3D]" aria-hidden />
          All games
          <span className="num rounded-[8px] bg-white/[0.08] px-2 font-sans text-12 font-extrabold leading-6 text-[rgb(var(--n-muted))]">{ORDERED.length}</span>
        </h2>
      </div>
      <button type="button" onClick={onSearch} aria-haspopup="dialog" className="n1-raised n1-hoverable n1-ring flex h-11 items-center gap-3 rounded-[12px] px-4 text-14 font-semibold text-[rgb(var(--n-dim))]">
        <MagnifyingGlass weight="bold" className="h-[18px] w-[18px] shrink-0" aria-hidden />
        Search for games
      </button>

      {state === 'loading' ? (
        <div className="flex flex-col gap-6" role="status" aria-label="Loading games">
          {[0, 1, 2].map((r) => (
            <div key={r} className="flex flex-col gap-3">
              <Skel className="h-6 w-[120px] rounded-full" />
              <div className="flex gap-3 overflow-hidden">
                {[0, 1, 2, 3].map((i) => (
                  <Skel key={i} className="aspect-[3/4] w-[116px] shrink-0 rounded-[16px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : failed ? (
        <div className="n1-panel rounded-[20px]">
          <NMessage
            icon={<WarningCircle weight="fill" className="text-danger" />}
            title="We could not load the games"
            body="Your balance and bets are safe. Try again in a moment."
            action={
              <Key tone="purple" size={48} onClick={() => setFailed(false)}>
                Try again
              </Key>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {RAILS.map((r) => (
            <section key={r.id} aria-labelledby={`n1m-rail-${r.id}`} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span aria-hidden className="flex h-[28px] w-[28px] items-center justify-center rounded-[8px] [&>svg]:h-4 [&>svg]:w-4" style={{ color: r.hue, background: `${r.hue}24` }}>
                  {r.icon}
                </span>
                <h3 id={`n1m-rail-${r.id}`} className="font-display text-16 font-bold text-ink">
                  {r.title}
                </h3>
                <span className="num text-12 font-bold text-[rgb(var(--n-dim))]">{r.list.length}</span>
                <button type="button" onClick={(e) => onSeeAll(r.filter, e)} aria-haspopup="dialog" aria-label={`See all ${r.title} games`} data-icon="arrow" className="k-hov-icon n1-ring ml-auto flex h-11 items-center gap-1 rounded-[12px] px-3 text-14 font-bold text-[rgb(var(--n-lilac))] hover:bg-white/[0.05]">
                  See all
                  <CaretRight weight="bold" className="h-[14px] w-[14px]" aria-hidden />
                </button>
              </div>
              <ul aria-label={`${r.title} games`} className="n1m-rail n1-noscroll">
                {r.list.slice(0, SHOWN).map((g) => (
                  <li key={g.id}>
                    <RailCover g={g} onPlay={() => onPlay(g)} />
                  </li>
                ))}
                {r.list.length > 3 && (
                  <li>
                    <button type="button" onClick={(e) => onSeeAll(r.filter, e)} aria-haspopup="dialog" aria-label={`See all ${r.list.length} ${r.title} games`} data-icon="arrow" className="k-hov-icon n1-raised n1-hoverable n1-ring flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-[16px] text-14 font-bold text-ink">
                      <span className="n1-keysq flex h-10 w-10 items-center justify-center rounded-full">
                        <ArrowRight weight="bold" className="h-4 w-4" aria-hidden />
                      </span>
                      See all
                      <span className="num -mt-1 text-12 font-semibold text-[rgb(var(--n-muted))]">{r.list.length} games</span>
                    </button>
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
