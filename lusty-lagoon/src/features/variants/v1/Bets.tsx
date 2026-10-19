import { useEffect, useState } from 'react';
import { GameController, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';
import { CoinIcon, Live, NMessage, Skel, Tabs, handle, useStill } from './ui';

// Latest bets, round 6, after variant 5's Live wagers (note 17), copied into this folder. The title,
// a live line and the tabs sit inside one panel, the column labels in one sunken pill bar in sentence
// case, rows on a faint rule, numbers tabular, payouts as green text with a plus sign and no box. A
// new bet slides in at the top every few seconds, and holds still on ?still, on reduced motion and
// in the loading and error states.

type Tab = 'all' | 'high' | 'lucky' | 'mine';
const TABS: { value: Tab; label: string; pick: (b: Bet) => boolean }[] = [
  { value: 'all', label: 'All bets', pick: () => true },
  { value: 'high', label: 'High wins', pick: (b) => payout(b) >= 250 },
  { value: 'lucky', label: 'Lucky wins', pick: (b) => b.multiplier >= 5 },
  { value: 'mine', label: 'My bets', pick: (b) => !!b.mine },
];

const COLS = 'grid grid-cols-[minmax(0,2.7fr)_minmax(0,1.85fr)_0.8fr_1.05fr_0.85fr_1.1fr] items-center gap-3 w1920:gap-4';
const ROWS = 10;

type Row = Bet & { key: string; fresh?: boolean };

/** Bets from other players that come round again as new ones. */
const POOL = BETS.filter((b) => !b.mine);

function clock(step: number) {
  const mins = 52 + Math.floor(step / 2);
  const h = 3 + Math.floor(mins / 60);
  return `${h}:${String(mins % 60).padStart(2, '0')} PM`;
}

function useFeed(paused: boolean) {
  const [feed, setFeed] = useState<Row[]>(() => BETS.map((b) => ({ ...b, key: b.id })));
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let n = 0;
    const t = window.setInterval(() => {
      n += 1;
      const src = POOL[(n * 3) % POOL.length];
      const next: Row = { ...src, key: `${src.id}-${n}`, time: clock(n), fresh: true };
      setFeed((f) => [next, ...f.map((x) => ({ ...x, fresh: false }))].slice(0, 24));
    }, 4500);
    return () => window.clearInterval(t);
  }, [paused]);
  return feed;
}

function BetRow({ b, onPlay }: { b: Row; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(b.gameId)!;
  const p = payout(b);
  const sym = coinById(b.coin).symbol;
  return (
    <li className={cn(COLS, 'n1-rule h-[56px] border-t px-6 text-14 first:border-t-0', b.fresh && 'n1-enter')}>
      <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}`} className="n1-ring group flex min-w-0 items-center gap-3 rounded-[12px] text-left">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[12px]">
          <img src={g.image} alt="" className="n1-zoom h-full w-full object-cover" />
          <span aria-hidden className="absolute inset-0 rounded-[12px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-14 font-semibold text-ink">{g.short ?? g.name}</span>
          <span className="truncate text-12 text-[rgb(var(--n-dim))]">{g.provider}</span>
        </span>
      </button>
      <span className="flex min-w-0 items-center gap-2">
        {b.avatar ? (
          <img src={b.avatar} alt="" className="h-[28px] w-[28px] shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-12 font-semibold text-ink">{b.initials}</span>
        )}
        <span className={cn('truncate font-medium', b.mine ? 'text-[rgb(var(--n-lilac))]' : 'text-ink')}>{handle(b.player)}</span>
        {b.mine && <span className="shrink-0 rounded-full bg-[rgb(var(--n-purple)/0.18)] px-2 text-12 font-semibold leading-5 text-[rgb(var(--n-lilac))]">You</span>}
      </span>
      <span className="num text-[rgb(var(--n-dim))]">{b.time}</span>
      <span className="num flex items-center gap-2 font-medium text-ink">
        <CoinIcon id={b.coin} size={18} />
        {formatAmount(b.wager)}
        <span className="sr-only"> {sym}</span>
      </span>
      <span className={cn('num font-medium', b.multiplier > 0 ? 'text-ink' : 'text-[rgb(var(--n-dim))]')}>{b.multiplier.toFixed(2)}x</span>
      <span className="flex justify-end">
        {p > 0 ? (
          <span className="num inline-flex items-center gap-2 font-semibold text-[rgb(var(--n-win))]">
            +{formatAmount(p)}
            <CoinIcon id={b.coin} size={18} />
            <span className="sr-only"> {sym}</span>
          </span>
        ) : (
          <span className="num pr-[26px] text-[rgb(var(--n-dim))]">0.00</span>
        )}
      </span>
    </li>
  );
}

export function Bets({ onPlay, state }: { onPlay: (g: CatalogueGame) => void; state: string | null }) {
  const still = useStill();
  const [tab, setTab] = useState<Tab>('all');
  const feed = useFeed(still || state === 'error' || state === 'loading');
  const list = state === 'empty' ? [] : feed.filter(TABS.find((t) => t.value === tab)!.pick).slice(0, ROWS);
  return (
    <section aria-labelledby="n1-bets-title" className="n1-panel n1-top flex min-w-0 flex-col gap-4 rounded-[20px] p-4">
      {/* The title sits on the panel's 16px inset, the same edge as the column bar and the rows under
          it (round 7, note 4), in the page's one heading style (note 2). */}
      <div className="flex h-11 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 id="n1-bets-title" className="font-display text-20 font-bold tracking-[-0.01em] text-ink">
            Latest bets
          </h2>
          {state === 'error' ? (
            <span className="text-14 font-medium text-[rgb(var(--n-dim))]">Paused</span>
          ) : (
            <span className="flex items-center gap-2 text-14 font-medium text-[rgb(var(--n-dim))]">
              <Live />
              Updating live
            </span>
          )}
        </div>
        <Tabs label="Bets" items={TABS} value={tab} onChange={setTab} controls="n1-bets-panel" />
      </div>
      <div id="n1-bets-panel" role="tabpanel" aria-labelledby="n1-bets-title" className="flex min-h-[620px] flex-col gap-2">
        <div aria-hidden className={cn(COLS, 'n1-thead h-11 rounded-full px-6 text-14 font-medium text-[rgb(var(--n-muted))]')}>
          <span>Game</span>
          <span>Player</span>
          <span>Time</span>
          <span>Wager</span>
          <span>Multiplier</span>
          <span className="text-right">Payout</span>
        </div>
        {state === 'loading' ? (
          <div className="flex flex-col" role="status" aria-label="Loading latest bets">
            {Array.from({ length: ROWS }, (_, i) => (
              <div key={i} className={cn(COLS, 'h-[56px] px-6')}>
                <span className="flex items-center gap-3">
                  <Skel className="h-10 w-10 rounded-[12px]" />
                  <Skel className="h-4 w-[120px] rounded-full" />
                </span>
                <Skel className="h-4 w-[100px] rounded-full" />
                <Skel className="h-4 w-[56px] rounded-full" />
                <Skel className="h-4 w-[72px] rounded-full" />
                <Skel className="h-4 w-[48px] rounded-full" />
                <Skel className="ml-auto h-4 w-[72px] rounded-full" />
              </div>
            ))}
          </div>
        ) : state === 'error' ? (
          <NMessage className="flex-1 justify-center" icon={<WarningCircle weight="fill" className="text-danger" />} title="Live bets are paused" body="The feed lost its connection. It reconnects on its own, your balance is not affected." />
        ) : list.length === 0 ? (
          <NMessage className="flex-1 justify-center" icon={<GameController weight="fill" className="text-[rgb(var(--n-muted))]" />} title="No bets here yet" body="Bets that match this tab show up the moment they land." />
        ) : (
          <ul aria-label="Latest bets" aria-live="off">
            {list.map((b) => (
              <BetRow key={b.key} b={b} onPlay={onPlay} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
