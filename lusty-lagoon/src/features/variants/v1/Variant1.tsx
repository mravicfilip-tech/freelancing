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
import { useStill } from './ui';
import { useFocusReturn, usePhone } from './mobile/hooks';
import { PhoneLobby } from './mobile/PhoneLobby';
import './neon.css';

// Variant 1, Social lagoon, direction Neon arcade, picked in round 8 as the dashboard direction.
// Snegbet's tournaments screen translated to Lusty Lagoon. Three columns, the sidebar, the centre and
// the rail with the Daily chest over the chat. The winners feed runs across the top of the centre,
// then the hero with its one lit area, All games, the four category cards (after the games since
// round 8, note 5) and Latest bets. Under 768px wide the phone lobby in mobile/ takes over, so the
// desktop markup is never rendered on a phone.

export default function Variant1() {
  const state = useVariantState();
  const still = useStill();
  const phone = usePhone();
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
  // On the phone the dialogs open over panels, so focus goes back to the control that opened them.
  const keep = useFocusReturn(phone);
  const play = keep(setOpen);
  const raceTo = keep(setRace);
  const rankTo = keep(setRank);
  const rulesTo = keep(setRules);

  const toGames = () => document.getElementById('n1-games')?.scrollIntoView({ behavior: 'smooth' });
  const pick = (f: Filter) => {
    setFilter(f);
    toGames();
  };
  const sugarRush = () => setOpen(gameById('sugar-rush')!);

  return (
    <div className={still ? 'n1 n1-page n1-still' : 'n1 n1-page'}>
      {phone ? (
        <PhoneLobby
          state={state}
          filter={filter}
          setFilter={setFilter}
          searchRef={search}
          onPlay={play}
          onSugarRush={() => play(gameById('sugar-rush')!)}
          onRace={() => raceTo(true)}
          onRank={() => rankTo(true)}
          onRules={() => rulesTo(true)}
          joined={joined}
          onJoin={() => setJoined(true)}
        />
      ) : (
        <>
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
              <div className="mt-6 flex flex-col gap-12">
                <Games ref={search} filter={filter} onFilter={pick} state={state} onPlay={setOpen} />
                <Tiles onPick={pick} />
                <Bets onPlay={setOpen} state={state} />
              </div>
            </main>
            <aside aria-label="Daily chest and chat" className="sticky top-[88px] flex h-[calc(100vh-104px)] min-h-[640px] w-[288px] shrink-0 flex-col gap-4 self-start w1920:w-[320px]">
              <Chest ref={chest} loading={state === 'loading'} />
              <Chat onPlay={setOpen} onRules={() => setRules(true)} state={state} className="min-h-[0px] flex-1" />
            </aside>
          </div>
        </>
      )}
      <GameDialog game={open} onClose={() => play(null)} />
      <RaceDialog open={race} onOpenChange={raceTo} onPlay={sugarRush} />
      <GiveawayDialog open={give} onOpenChange={setGive} joined={joined} onJoin={() => setJoined(true)} />
      <RankDialog open={rank} onOpenChange={rankTo} />
      <RulesDialog open={rules} onOpenChange={rulesTo} />
    </div>
  );
}
