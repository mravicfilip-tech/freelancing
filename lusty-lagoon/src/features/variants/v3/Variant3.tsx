import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '../../../components/ui/Dialog';
import { GameDialog } from '../../lobby/LobbyPage';
import { type CatalogueGame } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { DAILY_CHEST, RACE, useVariantState } from '../shared/data';
import { BetsBoard } from '../kit/Boards';
import { Sidebar, TopBar } from './Shell';
import { ChestHero, LevelCard } from './Hero';
import { RankRoad } from './RankRoad';
import { Schedule } from './Schedule';
import { Race } from './Race';
import { ContinuePlaying, HotGrid, TopWins } from './Games';
import type { Filter } from './games-data';

// Dashboard variant 3, Rank road, rebuilt on the reference kit. Round 4 order, D3. The hero and the
// rank card always on top, then pick up where you left off with top wins, hot right now, the weekly
// race, the rank road, and last the unlock schedule and the bets. Cybet's shell, chest hero, level card and unlock schedule, Krush's race block, and the
// rank road as the signature, five pillar cut-outs on one road filled to John's points.
// ?state=loading|empty|error and ?still are read as the brief says.

export default function Variant3() {
  const state = useVariantState();
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

  return (
    <div className="k-page min-h-screen">
      <TopBar query={query} onQuery={setQuery} onSearch={() => jump('hot')} onDeposit={() => navigate('/wallet/deposit')} />
      <div className="flex gap-4 px-4 pb-8">
        <Sidebar filter={filter} onFilter={pick} onJump={jump} />
        <main className="flex min-w-0 flex-1 flex-col gap-12 pb-4">
          <div className="flex gap-4 pt-4 -mb-4">
            <ChestHero onHow={() => setHow(true)} />
            <LevelCard onRoad={() => jump('rank')} />
          </div>
          <div className="flex gap-6">
            <ContinuePlaying onPlay={setOpen} />
            <TopWins onPlay={setOpen} loading={state === 'loading'} />
          </div>
          <HotGrid filter={filter} onFilter={pick} query={query} onQuery={setQuery} state={state} failed={failed} onRetry={() => setFailed(false)} onPlay={setOpen} />
          <Race onBoard={() => setBoard(true)} />
          <RankRoad />
          <Schedule />
          <BetsBoard onPlay={setOpen} state={state} rows={6} />
        </main>
      </div>

      <GameDialog game={open} onClose={() => setOpen(null)} />
      <Dialog open={board} onOpenChange={setBoard}>
        <DialogContent title={RACE.name} description={`${formatAmount(RACE.pool, 0)} ${RACE.currency} shared by the top ten on amount played.`}>
          <ol className="flex flex-col divide-y divide-line rounded-xl border border-line">
            {RACE.leaders.map((l) => (
              <li key={l.place} className="flex items-center gap-3 px-4 py-3">
                <span className="num w-6 text-16 font-bold text-ink">{l.place}</span>
                <img src={l.avatar} alt="" className="h-8 w-8 rounded-full" />
                <span className="flex-1 text-16 text-ink">{l.player}</span>
                <span className="num text-16 font-semibold text-gold">{formatAmount(l.prize, 0)} USDT</span>
              </li>
            ))}
          </ol>
          <p className="text-14 text-ink2">
            You are {RACE.you.place}th. {formatAmount(RACE.you.toTen, 0)} USDT more played reaches the top ten.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog open={how} onOpenChange={setHow}>
        <DialogContent title="How the chest streak works" description="One chest opens every day. Open it within 24 hours and the next one pays more.">
          <ul className="flex list-disc flex-col gap-2 pl-[20px] text-16 text-ink2">
            <li>
              This week pays {DAILY_CHEST.days.map((d) => d.amount).join(', ')} {DAILY_CHEST.currency}, Monday to Sunday.
            </li>
            <li>Miss a day and the streak starts again at day one.</li>
            <li>Chest payouts land in your wallet at once and can be played or withdrawn.</li>
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}
