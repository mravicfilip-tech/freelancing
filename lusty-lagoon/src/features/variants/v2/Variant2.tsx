import { useRef, useState } from 'react';
import { GameDialog } from '../../lobby/LobbyPage';
import { gameById, type CatalogueGame } from '../../../data/games';
import { Dialog, DialogContent } from '../../../components/ui/Dialog';
import { cn } from '../../../lib/cn';
import { KitButton } from '../kit/parts';
import { DAILY_CHEST, RACE, useCountdown, useVariantState } from '../shared/data';
import { formatAmount } from '../../../lib/format';
import { Carousel } from './Carousel';
import { GameFinder } from './GameFinder';
import { Rail } from './Rail';
import { BonusCard, Social } from './SideColumn';
import { Stage } from './Stage';
import { TopBar } from './TopBar';
import { WinsStrip } from './WinsStrip';
import type { Filter } from './shared';

// Dashboard variant 2, Sunset stage, rebuilt on the reference kit to Grimdrop's lobby. An icon
// rail, a wide stage of our sunset with the girl breaking its edge, the live wins strip, a carousel
// of big art cards, the category bar and trending grid, and a right column with the free bonus
// card over chat. Briefs in studio/clients/lusty-lagoon/briefs/round-3/.

function ChestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { left, h, m } = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Free daily chest" description={`Day ${DAILY_CHEST.streak + 1} of your streak. It opens in ${h} hours ${m} minutes.`}>
        <ol aria-label="This week's chests" className="grid grid-cols-7 gap-2">
          {DAILY_CHEST.days.map((d) => (
            <li
              key={d.day}
              className={cn(
                'flex h-[64px] flex-col items-center justify-center gap-1 rounded-[12px] border text-14 font-bold',
                d.status === 'claimed' && 'border-[#3DDC84]/40 bg-[#3DDC84]/10 text-ink',
                d.status === 'today' && 'border-gold bg-gold/10 text-ink',
                d.status === 'locked' && 'border-ink/10 bg-black/20 text-ink3',
              )}
            >
              <span className="text-12">{d.day}</span>
              <span className="num">{d.status === 'claimed' ? 'Paid' : d.amount}</span>
            </li>
          ))}
        </ol>
        <p className="text-16 text-ink2">Amounts are in {DAILY_CHEST.currency}. Miss a day and the streak starts again at day 1.</p>
        <div>
          <KitButton tone="purple" aria-pressed={remind} onClick={() => setRemind((r) => !r)}>
            {left > 0 ? (remind ? 'Reminder on' : 'Remind me when it opens') : 'Open the chest'}
          </KitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Variant2() {
  const state = useVariantState();
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [failed, setFailed] = useState(state === 'error');
  const [chest, setChest] = useState(false);
  const [race, setRace] = useState(false);
  const games = useRef<HTMLElement>(null);
  const toGames = () => games.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const pick = (f: Filter) => {
    setFilter(f);
    toGames();
  };

  return (
    <div className="flex min-h-screen bg-page text-ink">
      <Rail filter={filter} onFilter={pick} onRace={() => setRace(true)} />
      <div className="min-w-0 flex-1 pl-4">
        <TopBar query={query} onQuery={setQuery} onSearch={toGames} />
        <div className="flex gap-4 pb-12 pr-4">
          <main className="flex min-w-0 flex-1 flex-col gap-8 pt-[44px]">
            <div className="flex flex-col gap-4">
              <Stage onPlay={() => setOpen(gameById('sugar-rush')!)} />
              <WinsStrip state={state} onPlay={setOpen} />
              <Carousel state={state} failed={failed} onRetry={() => setFailed(false)} onPlay={setOpen} className="mt-2" />
            </div>
            <GameFinder ref={games} filter={filter} onFilter={setFilter} query={query} onQuery={setQuery} state={state} failed={failed} onRetry={() => setFailed(false)} onPlay={setOpen} />
          </main>
          <aside aria-label="Bonus and chat" className="sticky top-[84px] flex h-[calc(100vh-100px)] w-[300px] shrink-0 flex-col gap-4">
            <BonusCard onOpen={() => setChest(true)} />
            <Social />
          </aside>
        </div>
      </div>
      <GameDialog game={open} onClose={() => setOpen(null)} />
      <ChestDialog open={chest} onOpenChange={setChest} />
      <Dialog open={race} onOpenChange={setRace}>
        <DialogContent title="Weekly race" description={`${formatAmount(RACE.pool, 0)} ${RACE.currency} shared by the top ten on amount played.`}>
          <ol className="flex flex-col gap-2">
            {RACE.leaders.map((l) => (
              <li key={l.place} className="flex items-center gap-3 rounded-[12px] bg-black/20 px-4 py-3">
                <span className="num w-6 font-display text-18 font-bold text-ink">{l.place}</span>
                <img src={l.avatar} alt="" className="h-9 w-9 rounded-[10px] object-cover" />
                <span className="flex-1 text-16 font-semibold text-ink">{l.player}</span>
                <span className="num text-16 font-bold text-gold">{formatAmount(l.prize, 0)} USDT</span>
              </li>
            ))}
          </ol>
          <p className="text-16 text-ink2">
            You are {RACE.you.place}th with {formatAmount(RACE.you.wagered, 0)} USDT played. {formatAmount(RACE.you.toTen, 0)} USDT more reaches the top ten.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
