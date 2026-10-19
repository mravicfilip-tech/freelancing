import { useMemo, useRef, useState } from 'react';
import type { CatalogueGame } from '../../../data/games';
import { GameDialog } from '../../lobby/LobbyPage';
import { useVariantState } from '../shared/data';
import { Finder } from './Finder';
import { Footer } from './Footer';
import { Providers } from './Providers';
import { Rooms } from './Rooms';
import { NavRow, TopBar } from './Shell';
import { WinsRow } from './WinsRow';
import { ALL_PROVIDERS, applyFilters, type Filters } from './data';

// Dashboard variant 4, Casino floor, rebuilt on the reference kit. No sidebar. NewBettie's top bar
// and segmented nav, HugeWin's live wins chips, a bento of vivid rooms in NewBettie's tile style,
// Turbo Bet's finder over large covers, and HugeWin's provider wordmarks. Every room, nav item, chip,
// provider tile and the search drive one set of filters, so the grid and every count agree.
export default function Variant4() {
  const state = useVariantState();
  const [filters, setFilters] = useState<Filters>({ cat: 'all', provider: ALL_PROVIDERS, query: state === 'empty' ? 'Starburst' : '', sort: 'recommended' });
  const [failed, setFailed] = useState(state === 'error');
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const find = useRef<HTMLElement>(null);

  const games = useMemo(() => applyFilters(filters), [filters]);
  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));
  const toGrid = () => find.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const pick = (p: Partial<Filters>) => {
    patch(p);
    toGrid();
  };
  const clear = () => patch({ cat: 'all', provider: ALL_PROVIDERS, query: '' });
  const home = () => {
    clear();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div id="top" className="k-page min-h-screen text-ink">
      <TopBar query={filters.query} onQuery={(query) => patch({ query })} onSubmit={toGrid} onHome={home} />
      <NavRow cat={filters.cat} onPick={(cat) => pick({ cat })} onHome={home} />
      <main>
        <h1 className="sr-only">Lusty Lagoon casino floor</h1>
        <WinsRow state={state} onPlay={setOpen} />
        <Rooms cat={filters.cat} onPick={(cat) => pick({ cat })} />
        <Finder ref={find} filters={filters} onChange={patch} onClear={clear} games={games} state={state} failed={failed} onRetry={() => setFailed(false)} onPlay={setOpen} />
        <Providers provider={filters.provider} onPick={(name) => pick({ provider: filters.provider === name ? ALL_PROVIDERS : name })} />
      </main>
      <Footer />
      <GameDialog game={open} onClose={() => setOpen(null)} />
    </div>
  );
}
