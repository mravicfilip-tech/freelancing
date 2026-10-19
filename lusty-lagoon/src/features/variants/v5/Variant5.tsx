import { useRef, useState } from 'react';
import { GameDialog } from '../../lobby/LobbyPage';
import type { CatalogueGame } from '../../../data/games';
import { useVariantState } from '../shared/data';
import { AllGames } from './AllGames';
import { BalanceCard } from './BalanceCard';
import { Giveaway } from './Giveaway';
import { JumpBackIn, TopWins } from './Lists';
import { LiveWagers } from './LiveWagers';
import { Nav, TopBar } from './Shell';

// Dashboard variant 5, Quiet vault. Money and live play first, no effects, art used once. The
// balance set as big type is the signature, one cut-out stands at the edge of its card, and the
// only other pictures are the game covers and the giveaway chest.
export default function Variant5() {
  const state = useVariantState();
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const games = useRef<HTMLElement>(null);
  const loading = state === 'loading';

  return (
    <div className="flex min-h-screen bg-page text-ink">
      <Nav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar query={query} setQuery={setQuery} onSearch={() => games.current?.scrollIntoView({ block: 'start' })} />
        <main className="px-8 pb-16 pt-8">
          <h1 className="sr-only">Lobby</h1>
          <BalanceCard />
          <Giveaway />
          <LiveWagers state={state} onPlay={setOpen} />
          <div className="mt-16 grid grid-cols-2 gap-x-16">
            <JumpBackIn loading={loading} onPlay={setOpen} />
            <TopWins loading={loading} onPlay={setOpen} />
          </div>
          <AllGames ref={games} state={state} query={query} clearQuery={() => setQuery('')} onPlay={setOpen} />
        </main>
        <GameDialog game={open} onClose={() => setOpen(null)} />
      </div>
    </div>
  );
}
