import { useMemo, useRef, useState } from 'react';
import type { CatalogueGame } from '../../../data/games';
import { GameDialog } from '../../lobby/LobbyPage';
import { useVariantState } from '../shared/data';
import { FindBar } from './FindBar';
import { GameGrid } from './GameGrid';
import { Providers } from './Providers';
import { Rooms } from './Rooms';
import { Ticker } from './Ticker';
import { NavRow, TopBar } from './TopBar4';
import { ALL_PROVIDERS, applyFilters, type Filters } from './data';

// Dashboard variant 4, the casino floor. No sidebar. A top bar, a primary nav row, the live wins
// ticker, the rooms bento and a sticky find bar over the grid. Every room, chip, provider tile and
// search drives the same filters, so the grid and every count always agree.
export default function Variant4() {
  const state = useVariantState();
  const [filters, setFilters] = useState<Filters>({ cat: 'all', provider: ALL_PROVIDERS, query: state === 'empty' ? 'Starburst' : '', sort: 'recommended' });
  const [failed, setFailed] = useState(state === 'error');
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const find = useRef<HTMLElement>(null);

  const games = useMemo(() => applyFilters(filters), [filters]);
  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));
  const toGrid = () => find.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const pick = (patchTo: Partial<Filters>) => {
    patch(patchTo);
    toGrid();
  };
  const clear = () => patch({ cat: 'all', provider: ALL_PROVIDERS, query: '' });
  const home = () => {
    clear();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <TopBar query={filters.query} onQuery={(query) => patch({ query })} onSubmit={toGrid} onHome={home} />
      <NavRow cat={filters.cat} onPick={(cat) => pick({ cat })} onHome={home} />
      <main>
        <h1 className="sr-only">Lusty Lagoon casino floor</h1>
        <Ticker state={state} onPlay={setOpen} />
        <Rooms cat={filters.cat} onPick={(cat) => pick({ cat })} />
        <section id="find" ref={find} aria-label="Find a game" className="mt-8 scroll-mt-[72px]">
          <FindBar filters={filters} onChange={patch} shown={games.length} onClear={clear} />
          <GameGrid
            games={games}
            state={state}
            query={filters.query}
            resetKey={`${filters.cat}|${filters.provider}|${filters.query}|${filters.sort}`}
            failed={failed}
            onRetry={() => setFailed(false)}
            onClear={clear}
            onPlay={setOpen}
          />
        </section>
        <Providers provider={filters.provider} onPick={(name) => pick({ provider: filters.provider === name ? ALL_PROVIDERS : name })} />
      </main>
      <GameDialog game={open} onClose={() => setOpen(null)} />
    </div>
  );
}
