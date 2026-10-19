import { useRef, useState } from 'react';
import { GameDialog } from '../../lobby/LobbyPage';
import type { CatalogueGame } from '../../../data/games';
import { useVariantState } from '../shared/data';
import { BalanceCard } from './BalanceCard';
import { QuickDeposit } from './QuickDeposit';
import { Giveaway } from './Giveaway';
import { LiveWagers } from './LiveWagers';
import { WinsFeed } from './WinsFeed';
import { AllGames, JumpBackIn } from './Games';
import { Sidebar, TopBar } from './Shell';

// Dashboard variant 5, Quiet vault, rebuilt on the reference kit. mines.gg's restraint, flat deep
// surfaces and one accent. The balance set as big type with one cut-out, Skinify's payment panel
// beside it, NewBettie's latest bets table as the centre with mines.gg's biggest wins column, then
// the player's recent games and the full catalogue. No art besides the cut-out, the giveaway chest
// and the covers.
export default function Variant5() {
  const state = useVariantState();
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const games = useRef<HTMLElement>(null);
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="k-page min-h-screen bg-page text-ink">
      <TopBar query={query} onQuery={setQuery} onSearch={() => games.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      <div className="flex gap-4 px-4 pb-4">
        <Sidebar onJump={jump} />
        <main className="flex min-w-0 flex-1 flex-col gap-8 pt-6">
          <h1 className="sr-only">Lobby</h1>
          <div className="flex flex-col gap-12">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 w1920:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
              <BalanceCard />
              <QuickDeposit />
            </div>
            <Giveaway />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-4 w1920:grid-cols-[minmax(0,1fr)_400px]">
            <LiveWagers state={state} onPlay={setOpen} />
            <WinsFeed state={state} onPlay={setOpen} className="h-[784px]" />
          </div>
          <JumpBackIn loading={state === 'loading'} onPlay={setOpen} />
          <AllGames ref={games} state={state} query={query} clearQuery={() => setQuery('')} onPlay={setOpen} />
        </main>
      </div>
      <GameDialog game={open} onClose={() => setOpen(null)} />
    </div>
  );
}
