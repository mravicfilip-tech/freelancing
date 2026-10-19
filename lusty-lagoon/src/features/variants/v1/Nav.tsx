import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Cherries, Coins, Fish, Lightning, Sparkle } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { Dialog, DialogContent } from '../../../components/ui/Dialog';
import { Progress } from '../../../components/ui/Progress';
import { GAMES, type Category } from '../../../data/games';
import { ACCOUNT } from '../../../data/wallet';
import { RANKS, shortPoints } from '../../../data/ranks';
import { formatAmount, formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { useWallet } from '../../wallet/store';
import { DAILY_CHEST, RACE, useCountdown } from '../shared/data';

// The left column, 232 wide. Two small promo tiles on one surface, three labelled groups, a compact
// rank card. Casino rows with a category filter the games below, so they are buttons that say so.

const ITEM = 'group flex h-[40px] w-full items-center gap-3 rounded-lg border px-3 text-left text-14 font-medium transition-colors duration-150';
const ITEM_OFF = 'border-transparent text-label hover:bg-menu-active/60 hover:text-ink';
const ITEM_ON = 'border-menu-active-line bg-menu-active text-ink';

const ICON_CLS = 'h-5 w-5 shrink-0 text-[#C992F2]';
const CATEGORY_ROWS: { id: Category; label: string; icon: ReactNode }[] = [
  { id: 'slots', label: 'Slots', icon: <Cherries weight="fill" className={ICON_CLS} aria-hidden /> },
  { id: 'megaways', label: 'Megaways', icon: <Lightning weight="fill" className={ICON_CLS} aria-hidden /> },
  { id: 'hold-and-win', label: 'Hold and win', icon: <Coins weight="fill" className={ICON_CLS} aria-hidden /> },
  { id: 'fish', label: 'Fish games', icon: <Fish weight="fill" className={ICON_CLS} aria-hidden /> },
  { id: 'new', label: 'New', icon: <Sparkle weight="fill" className={ICON_CLS} aria-hidden /> },
];

function ShellIcon({ name }: { name: string }) {
  return <img src={`/art/shell/${name}.svg`} alt="" className="h-5 w-5 shrink-0 object-contain" />;
}

function Count({ n, label }: { n: number; label: string }) {
  return (
    <span className="num ml-auto text-12 text-ink3 group-hover:text-ink2">
      {n}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

function GroupLabel({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="px-3 pb-1 text-12 font-medium text-ink3">
      {children}
    </h2>
  );
}

function RaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const left = useCountdown(RACE.endsInSeconds);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Weekly race" description={`${formatAmount(RACE.pool, 0)} ${RACE.currency} shared by the top ten. Every dollar you play counts. Ends in ${left.d} days ${left.h} hours ${left.m} minutes.`}>
        <ol className="flex flex-col divide-y divide-line rounded-xl border border-line">
          {RACE.leaders.map((l) => (
            <li key={l.place} className="flex items-center gap-4 px-4 py-3">
              <span className="num w-6 text-16 font-bold text-ink3">{l.place}</span>
              <img src={l.avatar} alt="" width={32} height={32} className="rounded-full" />
              <span className="flex-1 text-16 font-semibold text-ink">{l.player}</span>
              <span className="num text-14 text-ink2">{formatAmount(l.wagered, 0)} played</span>
              <span className="num w-[96px] text-right text-16 font-semibold text-win">
                {formatAmount(l.prize, 0)} {RACE.currency}
              </span>
            </li>
          ))}
          <li className="flex items-center gap-4 bg-raised px-4 py-3">
            <span className="num w-6 text-16 font-bold text-ink3">{RACE.you.place}</span>
            <img src="/art/avatars/john-sm.webp" alt="" width={32} height={32} className="rounded-full" />
            <span className="flex-1 text-16 font-semibold text-ink">You</span>
            <span className="num text-14 text-ink2">{formatAmount(RACE.you.wagered, 0)} played</span>
            <span className="num w-[136px] text-right text-14 text-ink2">{formatAmount(RACE.you.toTen, 0)} to top ten</span>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}

function RanksDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Ranks and rewards" description="You earn one point for every cent you play. Rewards start the day you reach a rank.">
        <ol className="flex flex-col divide-y divide-line rounded-xl border border-line">
          {RANKS.map((r) => {
            const current = r.name === ACCOUNT.rank.name;
            return (
              <li key={r.name} className={cn('flex items-start justify-between gap-6 px-4 py-3', current && 'bg-raised')}>
                <span className="flex flex-col gap-1">
                  <span className="text-16 font-semibold text-ink">
                    {r.name}
                    {current && <span className="ml-2 text-14 font-normal text-accent">Your rank</span>}
                  </span>
                  <span className="text-14 text-ink2">{r.reward}</span>
                </span>
                <span className="num shrink-0 text-14 text-ink3">{r.from ? `${formatPoints(r.from)} points` : 'From the start'}</span>
              </li>
            );
          })}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

export function Nav({ category, onCategory }: { category: 'all' | Category; onCategory: (c: 'all' | Category) => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  const chest = useCountdown(DAILY_CHEST.readyInSeconds);
  const race = useCountdown(RACE.endsInSeconds);
  const [raceOpen, setRaceOpen] = useState(false);
  const [ranksOpen, setRanksOpen] = useState(false);
  const count = (c: Category) => GAMES.filter((g) => g.category === c).length;
  const { rank } = ACCOUNT;
  const pct = (rank.points / rank.nextAt) * 100;

  return (
    <aside className="w-[232px] shrink-0 border-r border-side-line bg-[linear-gradient(180deg,rgb(var(--ll-side-top)/0.7)_0,rgb(var(--ll-side))_160px)]">
      <div className="sticky top-0 flex h-screen flex-col gap-4 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-4 [scrollbar-width:thin]">
      <Link to="/lobby" aria-label="Lusty Lagoon, go to the lobby" className="ml-2 flex w-fit shrink-0 rounded-lg">
        <Logo />
      </Link>

      <div className="grid shrink-0 grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => document.getElementById('v1-chest')?.focus()}
          className="relative flex h-[104px] flex-col justify-end overflow-hidden rounded-xl border border-line bg-panel p-3 text-left hover:border-field focus-visible:border-field"
        >
          <img aria-hidden src="/art/lobby/giveaway-chest.webp" alt="" width={56} height={56} className="pointer-events-none absolute right-1 top-1 h-[56px] w-[56px] max-w-none" />
          <span className="block text-14 font-semibold leading-5 text-ink">Daily chest</span>
          <span className="num block text-12 text-ink2">{chest.hms}</span>
          <span className="sr-only"> until it is ready, open the chest card</span>
        </button>
        <button
          type="button"
          onClick={() => setRaceOpen(true)}
          className="relative flex h-[104px] flex-col justify-end overflow-hidden rounded-xl border border-line bg-panel p-3 text-left hover:border-field focus-visible:border-field"
        >
          <img aria-hidden src="/art/landing/pillar-gems-b.webp" alt="" width={20} height={60} className="pointer-events-none absolute right-3 top-2 h-[60px] w-auto max-w-none" />
          <span className="block text-14 font-semibold leading-5 text-ink">Weekly race</span>
          <span className="num block text-12 text-ink2">
            {race.d}d {race.h}h {race.m}m
          </span>
          <span className="sr-only"> left, see the leaderboard</span>
        </button>
      </div>

      <nav aria-label="Main" className="flex shrink-0 flex-col gap-3">
        <section aria-labelledby="v1-nav-casino">
          <GroupLabel id="v1-nav-casino">Casino</GroupLabel>
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link to="/lobby" aria-current="page" className={cn(ITEM, ITEM_ON)}>
                <ShellIcon name="nav-lobby" />
                Lobby
                <Count n={GAMES.length} label="games" />
              </Link>
            </li>
            {CATEGORY_ROWS.map((r) => {
              const on = category === r.id;
              return (
                <li key={r.id}>
                  <button type="button" aria-pressed={on} onClick={() => onCategory(on ? 'all' : r.id)} className={cn(ITEM, on ? ITEM_ON : ITEM_OFF)}>
                    {r.icon}
                    {r.label}
                    <Count n={count(r.id)} label="games" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="v1-nav-money">
          <GroupLabel id="v1-nav-money">Money</GroupLabel>
          <ul className="flex flex-col gap-0.5">
            <li>
              <Link to="/wallet/deposit" className={cn(ITEM, ITEM_OFF)}>
                <ShellIcon name="nav-wallet" />
                Wallet
                {pending > 0 && (
                  <span className="num ml-auto flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-12 font-bold leading-none text-on-gold">
                    {pending}
                    <span className="sr-only"> pending</span>
                  </span>
                )}
              </Link>
            </li>
            <li>
              <Link to="/agent" className={cn(ITEM, ITEM_OFF)}>
                <ShellIcon name="nav-agent" />
                Send to agent
              </Link>
            </li>
            <li>
              <Link to="/refer" className={cn(ITEM, ITEM_OFF)}>
                <ShellIcon name="nav-refer" />
                Refer a friend
              </Link>
            </li>
          </ul>
        </section>

        <section aria-labelledby="v1-nav-help">
          <GroupLabel id="v1-nav-help">Help</GroupLabel>
          <ul>
            <li>
              <Link to="/faq" className={cn(ITEM, ITEM_OFF)}>
                <ShellIcon name="nav-faq" />
                FAQ
              </Link>
            </li>
          </ul>
        </section>
      </nav>

      <button
        type="button"
        onClick={() => setRanksOpen(true)}
        aria-label={`${rank.name} rank, ${formatPoints(rank.points)} of ${formatPoints(rank.nextAt)} points. See all ranks`}
        className="mt-auto flex shrink-0 flex-col gap-2 rounded-xl border border-rank-box-line bg-rank-box p-3 text-left hover:border-field"
      >
        <span className="flex items-center gap-3">
          <img src="/brand/rank-bronze.png" alt="" width={32} height={30} className="h-[30px] w-[32px] shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-14 font-semibold leading-5 text-ink">{rank.name} rank</span>
            <span className="num text-12 text-ink2">
              {shortPoints(rank.points)} of {shortPoints(rank.nextAt)} points
            </span>
          </span>
        </span>
        <Progress value={pct} label={`${Math.floor(pct)}% of the way to ${rank.next}`} className="h-[6px] bg-rank-track [&>div]:bg-rank-fill" />
        <span className="num flex items-center gap-1 text-14 text-gold">
          {shortPoints(rank.nextAt - rank.points)} points to {rank.next}
        </span>
      </button>

      <RaceDialog open={raceOpen} onOpenChange={setRaceOpen} />
      <RanksDialog open={ranksOpen} onOpenChange={setRanksOpen} />
      </div>
    </aside>
  );
}
