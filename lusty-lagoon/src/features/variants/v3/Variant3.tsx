import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '../../../components/ui/Dialog';
import { GameDialog } from '../../lobby/LobbyPage';
import { gameById, type CatalogueGame } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { CONTINUE_PLAYING, DAILY_CHEST, RACE, useVariantState } from '../shared/data';
import { Sidebar, TopBar } from './Shell';
import { PositionCard, PrizeHero } from './Hero';
import { ContinuePlaying, HotGrid, TopWins } from './Games';
import { LeaderRow, Race } from './Race';
import { RankRoad } from './RankRoad';
import { Schedule } from './Schedule';
import { Bets } from './Bets';
import { RankBadge, TierShield } from './parts';
import { LEADERS, type Filter } from './games-data';
import './arena.css';

// Dashboard variant 3, Rank road, round 5 direction 3, Tournament arena. Its own language after
// Snegbet's tournaments screen, Krush's weekly race and Cybet's unlock schedule, on a navy purple
// ground. D3 order, kept. The hero prize card and Your position on top, then pick up where you left
// off with top wins, hot right now, the weekly race, the rank road, the unlock schedule and the bets.
// ?state=loading|empty|error and ?still are read as the brief says.

export default function Variant3() {
  const state = useVariantState();
  const still = useMemo(() => new URLSearchParams(window.location.search).has('still'), []);
  const navigate = useNavigate();
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [filter, setFilter] = useState<Filter>('all');
  const [failed, setFailed] = useState(state === 'error');
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const [board, setBoard] = useState(false);
  const [how, setHow] = useState(false);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const pick = (f: Filter) => {
    setFilter(f);
    jump('hot');
  };
  const playMore = () => setOpen(gameById(CONTINUE_PLAYING[0].gameId)!);

  return (
    <div className={cn('a-page min-h-screen', still && 'a-still')}>
      <TopBar query={query} onQuery={setQuery} onSearch={() => jump('hot')} onDeposit={() => navigate('/wallet/deposit')} onRank={() => jump('rank')} />
      <div className="flex pl-4">
        <Sidebar filter={filter} onFilter={pick} onJump={jump} />
        <main className="flex min-w-0 flex-1 flex-col gap-12 px-8 pb-16 pt-4">
          <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4">
            <PrizeHero onHow={() => setHow(true)} />
            <PositionCard onRoad={() => jump('rank')} onPlay={playMore} />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_400px] gap-6 w1920:grid-cols-[minmax(0,1fr)_640px]">
            <ContinuePlaying onPlay={setOpen} state={state} />
            <TopWins onPlay={setOpen} state={state} />
          </div>
          <HotGrid filter={filter} onFilter={pick} query={query} onQuery={setQuery} state={state} failed={failed} onRetry={() => setFailed(false)} onPlay={setOpen} />
          <Race onBoard={() => setBoard(true)} onPlayMore={playMore} state={state} />
          <RankRoad />
          <Schedule />
          <Bets onPlay={setOpen} state={state} />
        </main>
      </div>

      <GameDialog game={open} onClose={() => setOpen(null)} />
      <Dialog open={board} onOpenChange={setBoard}>
        <DialogContent title={RACE.name} description={`${formatAmount(RACE.pool, 0)} ${RACE.currency} shared by the top ten on amount played.`} className="a-page max-w-2xl !border-white/10 !bg-[#1A1745]">
          <ol aria-label="Leaderboard, top ten" className="flex flex-col gap-2">
            {LEADERS.map((l) => (
              <LeaderRow key={l.place} l={l} />
            ))}
          </ol>
          <div className="a-you flex h-[56px] items-center gap-3 rounded-[12px] px-2 pr-4">
            <RankBadge place={RACE.you.place} size={44} you />
            <img src="/art/avatars/john-sm.webp" alt="" className="h-6 w-6 rounded-full" />
            <span className="text-14 font-bold text-ink">@johnd</span>
            <TierShield tier="bronze" size={18} label="bronze rank" />
            <span className="num ml-auto text-14 font-semibold text-ink">{formatAmount(RACE.you.toTen, 0)} USDT more to reach the top ten</span>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={how} onOpenChange={setHow}>
        <DialogContent title="How the chest streak works" description="One chest opens every day. Open it within 24 hours and the next one pays more." className="a-page !border-white/10 !bg-[#1A1745]">
          <ul className="flex list-disc flex-col gap-2 pl-[20px] text-16 text-ink2">
            <li>
              This week pays {DAILY_CHEST.days.map((d) => d.amount).join(', ')} {DAILY_CHEST.currency}, Monday to Sunday.
            </li>
            <li>Any rank can open the chest, Bronze included.</li>
            <li>Miss a day and the streak starts again at day one.</li>
            <li>Chest payouts land in your wallet at once and can be played or withdrawn.</li>
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
