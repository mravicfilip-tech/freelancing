import { useState } from 'react';
import { GameDialog } from '../../lobby/LobbyPage';
import { gameById, type CatalogueGame } from '../../../data/games';
import { cn } from '../../../lib/cn';
import { useVariantState } from '../shared/data';
import '../kit/kit.css';
import './v2.css';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Hero } from './Hero';
import { Originals } from './Originals';
import { HotGames } from './HotGames';
import { Bets } from './Bets';
import { StageDialogs, type DialogKey } from './Dialogs';
import { Footer } from './Footer';
import { useStill } from './ui';
import type { Filter } from './data';

// Variant 2, Mascot stage, round 5. After Betsera, with Player 145's lit edges and Gamdom's originals.
// A full labelled sidebar, live wins along the top bar, a cinematic hero with the character breaking
// out above its frame, then tall originals tiles, hot games as whole rows of covers and a compact
// bets list. Eye order, the character and headline, the originals, the covers.

export default function Variant2() {
  const state = useVariantState();
  const still = useStill();
  const [game, setGame] = useState<CatalogueGame | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [dialog, setDialog] = useState<DialogKey>(null);
  const [joined, setJoined] = useState(false);
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  const pick = (f: Filter) => {
    setFilter(f);
    jump('m2-games');
  };
  const search = (q: string) => {
    setQuery(q);
    jump('m2-games');
  };
  return (
    <div className={cn('m2', still && 'm2-still')}>
      <TopBar onPlay={setGame} state={state} />
      {/* Its own stacking context, so the hero art and tiles never paint over the sticky top bar. */}
      <div className="isolate flex gap-6 pb-16 pl-4 pr-6 pt-6">
        <Sidebar filter={filter} onFilter={pick} onSearch={search} onOpen={setDialog} />
        <main className="flex min-w-0 flex-1 flex-col gap-12">
          <Hero joined={joined} onJoin={() => setJoined(true)} onPlay={() => setGame(gameById('sugar-rush')!)} onRules={() => setDialog('giveaway')} />
          <Originals onPick={pick} onAll={() => pick('all')} onLive={() => jump('m2-bets')} loading={state === 'loading'} />
          <HotGames filter={filter} onFilter={setFilter} query={query} onQuery={setQuery} state={state} onPlay={setGame} />
          <Bets onPlay={setGame} state={state} />
          <Footer />
        </main>
      </div>
      <GameDialog game={game} onClose={() => setGame(null)} />
      <StageDialogs open={dialog} onClose={() => setDialog(null)} joined={joined} onJoin={() => setJoined(true)} />
    </div>
  );
}
