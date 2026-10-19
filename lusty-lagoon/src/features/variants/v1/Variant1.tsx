import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameDialog } from '../../lobby/LobbyPage';
import { gameById, type CatalogueGame } from '../../../data/games';
import { useVariantState } from '../shared/data';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Feed } from './Feed';
import { Hero } from './Hero';
import { Tiles } from './Tiles';
import { Chest } from './Chest';
import { Chat } from './Chat';
import { Games } from './Games';
import { Bets } from './Bets';
import { GiveawayDialog, RaceDialog, RankDialog, RulesDialog } from './Dialogs';
import type { Filter } from './nav';
import './neon.css';

// Variant 1, Social lagoon, round 5 direction Neon arcade. Snegbet's tournaments screen translated to
// Lusty Lagoon. Three columns, the sidebar, the centre and the rail with the Daily chest over the
// chat. The winners feed runs across the top of the centre, then the hero on its purple burst, the
// four category tiles, All games and Latest bets. Eye order, the hero, the Daily chest, the tiles.

export default function Variant1() {
  const state = useVariantState();
  const navigate = useNavigate();
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [race, setRace] = useState(false);
  const [give, setGive] = useState(false);
  const [rank, setRank] = useState(false);
  const [rules, setRules] = useState(false);
  const [joined, setJoined] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const chest = useRef<HTMLElement>(null);

  const toGames = () => document.getElementById('n1-games')?.scrollIntoView({ behavior: 'smooth' });
  const pick = (f: Filter) => {
    setFilter(f);
    toGames();
  };
  const sugarRush = () => setOpen(gameById('sugar-rush')!);

  return (
    <div className="n1 n1-page">
      <TopBar
        onDeposit={() => navigate('/wallet/deposit')}
        onRace={() => setRace(true)}
        onSearch={() => {
          toGames();
          search.current?.focus({ preventScroll: true });
        }}
      />
      <div className="flex gap-4 px-4 pb-8 pt-4">
        <Sidebar filter={filter} onFilter={pick} onPlay={setOpen} onChest={() => chest.current?.focus()} onRank={() => setRank(true)} onGiveaway={() => setGive(true)} joined={joined} />
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <Feed onPlay={setOpen} state={state} />
          <Hero onPlay={sugarRush} />
          <Tiles onPick={pick} />
          <div className="mt-6 flex flex-col gap-12">
            <Games ref={search} filter={filter} onFilter={pick} state={state} onPlay={setOpen} />
            <Bets onPlay={setOpen} state={state} />
          </div>
        </main>
        <aside aria-label="Daily chest and chat" className="sticky top-[88px] flex h-[calc(100vh-104px)] min-h-[640px] w-[288px] shrink-0 flex-col gap-4 self-start w1920:w-[320px]">
          <Chest ref={chest} loading={state === 'loading'} />
          <Chat onPlay={setOpen} onRules={() => setRules(true)} state={state} className="min-h-[0px] flex-1" />
        </aside>
      </div>
      <GameDialog game={open} onClose={() => setOpen(null)} />
      <RaceDialog open={race} onOpenChange={setRace} onPlay={sugarRush} />
      <GiveawayDialog open={give} onOpenChange={setGive} joined={joined} onJoin={() => setJoined(true)} />
      <RankDialog open={rank} onOpenChange={setRank} />
      <RulesDialog open={rules} onOpenChange={setRules} />
    </div>
  );
}
