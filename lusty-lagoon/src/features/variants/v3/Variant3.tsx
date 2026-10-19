import { useState } from 'react';
import { BrandText } from '../../../components/ui/BrandText';
import { type CatalogueGame } from '../../../data/games';
import { GameDialog } from '../../lobby/LobbyPage';
import { ONLINE_NOW, useVariantState } from '../shared/data';
import { Nav, TopBar } from './Shell';
import { RankRoad } from './RankRoad';
import { ChestCard, PlayerCard, RaceCard } from './TopCards';
import { ContinueRow, HotGrid, TopWins } from './Games';
import { Wagers } from './Wagers';

// Dashboard variant 3, Rank road. Reasons to come back first, games after. The signature is the
// rank road, five pillar cut-outs as milestones on a road filled to the player's points.
// ?state=loading|empty|error and ?still are read as the brief says.
export default function Variant3() {
  const state = useVariantState();
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [failed, setFailed] = useState(state === 'error');
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const loading = state === 'loading';
  const retry = () => setFailed(false);
  const toHot = () => document.getElementById('hot')?.scrollIntoView({ block: 'start', behavior: 'smooth' });

  return (
    <div className="flex min-h-screen bg-page">
      <aside className="w-sidebar shrink-0 self-stretch border-r border-side-line bg-[rgb(var(--ll-side))]">
        <Nav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar query={query} onQuery={setQuery} onSearch={toHot} />
        <main id="main" className="flex-1 px-8 pb-12 pt-6">
          <div className="mx-auto flex w-full max-w-canvas flex-col gap-6">
            <header className="flex items-end justify-between gap-6">
              <h1 className="text-32 leading-10">
                <BrandText drop={3} rim={1}>
                  Evening, John
                </BrandText>
              </h1>
              <p className="pb-1 text-14 text-ink2">
                <span className="num font-semibold text-ink">{ONLINE_NOW.toLocaleString('en-US')}</span> players online now
              </p>
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.45fr)] gap-3">
              <PlayerCard />
              <ChestCard />
              <RaceCard />
            </div>

            <RankRoad />

            <div className="grid grid-cols-[minmax(0,1fr)_360px] items-start gap-x-6">
              <ContinueRow loading={loading} failed={failed} onRetry={retry} onPlay={setOpen} />
              <TopWins loading={loading} paused={state === 'error'} onPlay={setOpen} />
            </div>

            <HotGrid query={query} onClear={() => setQuery('')} loading={loading} failed={failed} onRetry={retry} onPlay={setOpen} />

            <Wagers loading={loading} paused={state === 'error'} />
          </div>
        </main>
      </div>
      <GameDialog game={open} onClose={() => setOpen(null)} />
    </div>
  );
}
