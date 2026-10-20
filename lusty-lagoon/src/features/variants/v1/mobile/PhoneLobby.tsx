import { useRef, useState, type MouseEvent, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatCircleDots, DotsThree, GameController, Gift, SquaresFour } from '@phosphor-icons/react';
import type { CatalogueGame } from '../../../../data/games';
import { cn } from '../../../../lib/cn';
import { N1Notifications } from '../Notifications';
import { Feed } from '../Feed';
import { Hero } from '../Hero';
import { Games } from '../Games';
import { Tiles } from '../Tiles';
import { Bets } from '../Bets';
import { Chat } from '../Chat';
import { Sidebar } from '../Sidebar';
import type { Filter } from '../nav';
import { useStill } from '../ui';
import { useDockShown, useIteration } from './hooks';
import { Sheet, type SheetKind } from './Sheet';
import { PhoneTopBar } from './PhoneTopBar';
import { DepositBar, Dock, TabBar, type Slot } from './BottomBars';
import { AccountBody, ChatActions, RaceRow, RewardChips, RewardsBody } from './Panels';
import { Rails } from './Rails';
import './mobile.css';

// The phone lobby, under 768px wide, round 8 (notes 7 to 11). One order in all three iterations, the
// top bar, the winners feed, the hero, All games, the category cards and Latest bets. Everything else
// comes through panels. The bell and the account open from the top. The chat, the Daily chest and the
// Hot streak giveaway open as panels, and More opens the whole sidebar menu. ?m= picks the iteration.
//   1  Tab bar. A fixed five slot bar, bottom sheets with a drag handle, games in three columns.
//   2  Deposit centre. A raised orange Deposit in the bar, a slim top bar, games as rails, full height panels.
//   3  Floating dock. A glass pill that hides on scroll down, reward chips under the top bar, games in
//      two large columns, the chat and the menu as drawers.
// ?panel=chat|rewards|more|games|notifications|account opens a panel on load, for shots and links.

type Panel = 'chat' | 'rewards' | 'more' | 'games' | 'notifications' | 'account';
const PANELS: Panel[] = ['chat', 'rewards', 'more', 'games', 'notifications', 'account'];

/** Which kind of panel each one is, per iteration. */
const KIND: Record<1 | 2 | 3, Record<Panel, SheetKind>> = {
  1: { chat: 'bottom', rewards: 'bottom', more: 'bottom', games: 'full', notifications: 'top', account: 'top' },
  2: { chat: 'full', rewards: 'full', more: 'full', games: 'full', notifications: 'top', account: 'top' },
  3: { chat: 'right', rewards: 'bottom', more: 'left', games: 'full', notifications: 'top', account: 'top' },
};

type Props = {
  state: string | null;
  filter: Filter;
  setFilter: (f: Filter) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onPlay: (g: CatalogueGame) => void;
  onSugarRush: () => void;
  onRace: () => void;
  onRank: () => void;
  onRules: () => void;
  joined: boolean;
  onJoin: () => void;
};

export function PhoneLobby({ state, filter, setFilter, searchRef, onPlay, onSugarRush, onRace, onRank, onRules, joined, onJoin }: Props) {
  const m = useIteration();
  const still = useStill();
  const navigate = useNavigate();
  const shown = useDockShown(still);
  const [panel, setPanel] = useState<Panel | null>(() => {
    const p = new URLSearchParams(window.location.search).get('panel') as Panel | null;
    return p && PANELS.includes(p) && (p !== 'games' || m === 2) ? p : null;
  });
  // The control that opened the panel, so focus goes back to it on close.
  const opener = useRef<HTMLElement | null>(null);
  const give = useRef<HTMLElement>(null);
  const aim = useRef<'top' | 'giveaway' | 'search'>('top');
  const kind = KIND[m];

  const open = (p: Panel, to: typeof aim.current = 'top') => (e: MouseEvent<HTMLElement>) => {
    opener.current = e.currentTarget;
    aim.current = to;
    setPanel(p);
  };
  const close = () => setPanel(null);
  const back = () => opener.current?.focus({ preventScroll: true });
  const smooth = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

  const toGames = (focus?: boolean) => {
    document.getElementById('n1-games')?.scrollIntoView({ behavior: smooth(), block: 'start' });
    if (focus) searchRef.current?.focus({ preventScroll: true });
  };
  const toTop = () => window.scrollTo({ top: 0, behavior: smooth() });

  // A category from the menu or a card. Iteration 2 opens the games panel on it, the others close the
  // panel and scroll to the grid once the panel has let go of the page.
  const pick = (f: Filter) => {
    setFilter(f);
    if (m === 2) {
      aim.current = 'top';
      setPanel('games');
      return;
    }
    const was = panel;
    setPanel(null);
    window.setTimeout(() => toGames(), was ? 280 : 0);
  };
  const deposit = () => navigate('/wallet/deposit');
  const rewards = (to: 'top' | 'giveaway') => {
    aim.current = to;
    setPanel('rewards');
  };

  // What each panel focuses first. The panel itself by default, the giveaway when its chip or row
  // opened it, the search when the search opened the games panel.
  const first = () => (aim.current === 'giveaway' ? give.current : aim.current === 'search' ? searchRef.current : null);

  const lobby: Slot = { id: 'lobby', label: 'Lobby', icon: <SquaresFour weight="fill" />, current: true, on: !panel, onClick: toTop };
  const games: Slot = { id: 'games', label: 'Games', icon: <GameController weight="fill" />, onClick: () => toGames(true) };
  const chat: Slot = { id: 'chat', label: 'Chat', icon: <ChatCircleDots weight="fill" />, popup: true, on: panel === 'chat', onClick: open('chat') };
  const reward: Slot = { id: 'rewards', label: 'Rewards', icon: <Gift weight="fill" />, popup: true, on: panel === 'rewards', onClick: open('rewards') };
  const more: Slot = { id: 'more', label: 'More', icon: <DotsThree weight="bold" />, popup: true, on: panel === 'more', onClick: open('more') };

  const sheet = { onClose: close, returnFocus: back, initialFocus: first };

  return (
    <div className={cn('n1m', `n1m-m${m}`)}>
      <PhoneTopBar slim={m === 2} onDeposit={deposit} onBell={open('notifications')} onAccount={open('account')} bellOpen={panel === 'notifications'} accountOpen={panel === 'account'} />

      <main className="n1m-main">
        {m === 3 && <RewardChips onChest={open('rewards')} onGiveaway={open('rewards', 'giveaway')} open={panel === 'rewards'} />}
        <Feed onPlay={onPlay} state={state} />
        <Hero onPlay={onSugarRush} />
        {m === 2 ? (
          <Rails state={state} onPlay={onPlay} onSeeAll={(f, e) => {
              setFilter(f);
              open('games')(e);
            }} onSearch={open('games', 'search')} />
        ) : (
          <div className="n1m-games">
            <Games ref={searchRef} filter={filter} onFilter={setFilter} state={state} onPlay={onPlay} columns={m === 3 ? 2 : 3} rows={3} />
          </div>
        )}
        <Tiles onPick={pick} />
        <div className="n1m-bets">
          <Bets onPlay={onPlay} state={state} />
        </div>
      </main>

      {m === 1 && <TabBar slots={[lobby, games, chat, reward, more]} />}
      {m === 2 && <DepositBar left={[lobby, chat]} right={[reward, more]} onDeposit={deposit} />}
      {m === 3 && <Dock slots={[lobby, games, chat, { ...more, label: 'Menu' }]} shown={shown || !!panel} />}

      <Sheet open={panel === 'chat'} kind={kind.chat} title="Chat" icon={<ChatCircleDots weight="fill" className="h-5 w-5 text-[rgb(var(--n-lilac))]" aria-hidden />} actions={<ChatActions onRules={onRules} />} fill bodyClassName="n1m-chat" {...sheet}>
        <Chat onPlay={onPlay} onRules={onRules} state={state} className="min-h-[0px] flex-1" />
      </Sheet>

      <Sheet open={panel === 'rewards'} kind={kind.rewards} title="Rewards" icon={<Gift weight="fill" className="h-5 w-5 text-[rgb(var(--n-ember))]" aria-hidden />} {...sheet}>
        <RewardsBody loading={state === 'loading'} joined={joined} onJoin={onJoin} giveRef={give} />
      </Sheet>

      <Sheet open={panel === 'more'} kind={kind.more} title="Menu" fill={m === 1} bodyClassName="n1m-menu" {...sheet}>
        <RaceRow onRace={onRace} />
        <Sidebar
          className="static w-full w1920:w-full"
          filter={filter}
          onFilter={pick}
          onPlay={onPlay}
          onChest={() => rewards('top')}
          onRank={onRank}
          onGiveaway={() => rewards('giveaway')}
          joined={joined}
        />
      </Sheet>

      {m === 2 && (
        <Sheet open={panel === 'games'} kind="full" title="All games" bodyClassName="n1m-games n1m-games-panel" {...sheet}>
          <Games ref={searchRef} filter={filter} onFilter={setFilter} state={state} onPlay={onPlay} columns={3} rows={4} />
        </Sheet>
      )}

      <Sheet open={panel === 'notifications'} kind="top" title="Notifications" titleHidden bodyClassName="n1m-notes" {...sheet}>
        <N1Notifications className="w-full" onClose={close} />
      </Sheet>

      <Sheet open={panel === 'account'} kind="top" title="Account" {...sheet}>
        <AccountBody onRank={onRank} />
      </Sheet>
    </div>
  );
}
