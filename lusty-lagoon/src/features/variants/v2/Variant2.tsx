import { useRef, useState } from 'react';
import { GameDialog } from '../../lobby/LobbyPage';
import { gameById, type CatalogueGame } from '../../../data/games';
import { useVariantState } from '../shared/data';
import { AllGames } from './AllGames';
import { Dock } from './Dock';
import { FloatingBar } from './FloatingBar';
import { GiveawayBand } from './GiveawayBand';
import { MadeForYou } from './MadeForYou';
import { Rail } from './Rail';
import { Stage } from './Stage';

// Dashboard variant 2, Sunset stage. The page opens on a full width stage of our art, with the
// continue playing dock straddling its bottom edge. See studio/clients/lusty-lagoon/briefs/round-3/variants-brief.md.
export default function Variant2() {
  const state = useVariantState();
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [failed, setFailed] = useState(state === 'error');
  const gamesRef = useRef<HTMLElement>(null);
  const toGames = () => gamesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="flex min-h-screen overflow-x-clip bg-page text-ink">
      <Rail />
      <div className="min-w-0 flex-1">
        <FloatingBar query={query} onQuery={setQuery} onSearch={toGames} />
        <main>
          <Stage state={state} onPlay={() => setOpen(gameById('sugar-rush')!)} onBrowse={toGames} />
          <div className="mx-auto w-full max-w-[1600px] px-12 pb-24">
            <Dock loading={state === 'loading'} onPlay={setOpen} />
            <MadeForYou loading={state === 'loading'} failed={failed} onRetry={() => setFailed(false)} onPlay={setOpen} />
            <GiveawayBand />
            <AllGames ref={gamesRef} state={state} query={query} onClear={() => setQuery('')} failed={failed} onRetry={() => setFailed(false)} onPlay={setOpen} />
          </div>
        </main>
        <GameDialog game={open} onClose={() => setOpen(null)} />
      </div>
    </div>
  );
}
