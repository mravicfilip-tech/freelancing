import { useState } from 'react';
import type { Category, CatalogueGame } from '../../../data/games';
import { GameDialog } from '../../lobby/LobbyPage';
import { useVariantState } from '../shared/data';
import { AllGames } from './AllGames';
import { Hero } from './Hero';
import { LiveWins } from './LiveWins';
import { Nav } from './Nav';
import { Rail } from './Rail';
import { Recommended } from './Recommended';
import { Rooms } from './Rooms';
import { TopBar } from './TopBar';
import { Wagers } from './Wagers';
import { scrollToId } from './parts';

// Dashboard variant 1, Social lagoon. The lobby as a room full of players. Three columns, the nav
// at 232, the content fluid and a sticky right rail of 320 holding the daily chest and the chat.
export default function Variant1() {
  const state = useVariantState();
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const [category, setCategory] = useState<'all' | Category>('all');
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');

  const pickCategory = (c: 'all' | Category) => {
    setCategory(c);
    if (c !== 'all') window.setTimeout(() => scrollToId('v1-games'), 0);
  };
  const search = (q: string) => {
    setQuery(q);
    if (q) window.setTimeout(() => scrollToId('v1-games'), 0);
  };

  return (
    <div className="flex min-h-screen bg-page text-ink">
      <Nav category={category} onCategory={pickCategory} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar query={query} onSearch={search} />
        <main className="flex flex-col gap-8 px-6 pb-16">
          <Hero onPlay={setOpen} />
          <Rooms category={category} onPick={(c) => pickCategory(category === c ? 'all' : c)} />
          <LiveWins state={state} onPlay={setOpen} />
          <Recommended state={state} onPlay={setOpen} />
          <Wagers state={state} />
          <AllGames state={state} query={query} category={category} onCategory={setCategory} onClear={() => setQuery('')} onPlay={setOpen} />
        </main>
      </div>
      <Rail state={state} />
      <GameDialog game={open} onClose={() => setOpen(null)} />
    </div>
  );
}
