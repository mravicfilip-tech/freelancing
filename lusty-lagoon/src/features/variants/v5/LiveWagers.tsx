import { useEffect, useState } from 'react';
import { GameController, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';
import { Coin } from '../kit/parts';
import { Note, Skel, Tabs, Title, handle, useStill } from './ui';

// The trading shot's lower table. The title and tabs sit inside the glass, the column labels in one
// sunken pill bar in sentence case, rows on a faint rule, numbers tabular, payouts as green text with
// a plus sign and no box. A new wager slides in at the top every few seconds, and holds still on
// ?still, on reduced motion and when the feed is paused.

type Tab = 'all' | 'high' | 'lucky' | 'mine';
const TABS: { value: Tab; label: string; pick: (b: Bet) => boolean }[] = [
  { value: 'all', label: 'All wagers', pick: () => true },
  { value: 'high', label: 'High wins', pick: (b) => payout(b) >= 250 },
  { value: 'lucky', label: 'Lucky wins', pick: (b) => b.multiplier >= 5 },
  { value: 'mine', label: 'My wagers', pick: (b) => !!b.mine },
];

const COLS = 'grid grid-cols-[minmax(0,2.7fr)_minmax(0,1.85fr)_0.8fr_1.05fr_0.85fr_1.1fr] items-center gap-3 w1920:gap-4';
const ROWS = 12;

type Live = Bet & { key: string; fresh?: boolean };

/** Wagers from other players that come round again as new ones. */
const POOL = BETS.filter((b) => !b.mine);

function clock(step: number) {
  const mins = 52 + Math.floor(step / 2);
  const h = 3 + Math.floor(mins / 60);
  return `${h}:${String(mins % 60).padStart(2, '0')} PM`;
}

function useFeed(paused: boolean) {
  const [feed, setFeed] = useState<Live[]>(() => BETS.map((b) => ({ ...b, key: b.id })));
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let n = 0;
    const t = window.setInterval(() => {
      n += 1;
      const src = POOL[(n * 3) % POOL.length];
      const next: Live = { ...src, key: `${src.id}-${n}`, time: clock(n), fresh: true };
      setFeed((f) => [next, ...f.map((x) => ({ ...x, fresh: false }))].slice(0, 24));
    }, 4500);
    return () => window.clearInterval(t);
  }, [paused]);
  return feed;
}

function Row({ b, onPlay }: { b: Live; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(b.gameId)!;
  const p = payout(b);
  const sym = coinById(b.coin).symbol;
  return (
    <li className={cn(COLS, 'gv-rule h-[56px] border-t px-6 text-14 first:border-t-0', b.fresh && 'gv-enter')}>
      <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}`} className="group flex min-w-0 items-center gap-3 rounded-[12px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[12px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
          <img src={g.image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.08]" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-14 font-semibold text-white">{g.short ?? g.name}</span>
          <span className="truncate text-12 text-[rgb(var(--gv-ink-3))]">{g.provider}</span>
        </span>
      </button>
      <span className="flex min-w-0 items-center gap-2">
        {b.avatar ? (
          <img src={b.avatar} alt="" className="h-[28px] w-[28px] shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-12 font-semibold text-white">{b.initials}</span>
        )}
        <span className={cn('truncate font-medium', b.mine ? 'text-[rgb(var(--gv-violet))]' : 'text-white')}>{handle(b.player)}</span>
        {b.mine && <span className="shrink-0 rounded-full bg-[#B47CFF]/[0.14] px-2 text-12 font-semibold leading-5 text-[rgb(var(--gv-violet))]">You</span>}
      </span>
      <span className="num text-[rgb(var(--gv-ink-3))]">{b.time}</span>
      <span className="num flex items-center gap-2 font-medium text-white">
        <Coin id={b.coin} size={18} />
        {formatAmount(b.wager)}
        <span className="sr-only"> {sym}</span>
      </span>
      <span className={cn('num font-medium', b.multiplier >= 5 ? 'text-[rgb(var(--gv-violet))]' : b.multiplier > 0 ? 'text-white' : 'text-[rgb(var(--gv-ink-3))]')}>{b.multiplier.toFixed(2)}x</span>
      <span className="flex justify-end">
        {p > 0 ? (
          <span className="num inline-flex items-center gap-2 font-semibold text-[#38EE59]">
            +{formatAmount(p)}
            <Coin id={b.coin} size={18} />
            <span className="sr-only"> {sym}</span>
          </span>
        ) : (
          <span className="num pr-[26px] text-[rgb(var(--gv-ink-3))]">0.00</span>
        )}
      </span>
    </li>
  );
}

export function LiveWagers({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const still = useStill();
  const [tab, setTab] = useState<Tab>('all');
  const feed = useFeed(still || state === 'error' || state === 'loading');
  const list = state === 'empty' ? [] : feed.filter(TABS.find((t) => t.value === tab)!.pick).slice(0, ROWS);
  return (
    <section id="wagers" aria-labelledby="wagers-title" className="gv-glass gv-edge flex min-w-0 scroll-mt-[104px] flex-col gap-4 rounded-3xl p-4">
      <div className="flex h-11 items-center justify-between gap-4 pl-2">
        <div className="flex items-center gap-3">
          <Title id="wagers-title">Live wagers</Title>
          {state === 'error' ? (
            <span className="text-14 font-medium text-[rgb(var(--gv-ink-3))]">Paused</span>
          ) : (
            <span className="flex items-center gap-2 text-14 font-medium text-[rgb(var(--gv-ink-3))]">
              <span aria-hidden className="gv-live" />
              Updating live
            </span>
          )}
        </div>
        <Tabs label="Wagers" items={TABS} value={tab} onChange={setTab} controls="wagers-panel" />
      </div>
      <div id="wagers-panel" role="tabpanel" aria-labelledby="wagers-title" className="flex min-h-[716px] flex-col gap-2">
        <div aria-hidden className={cn(COLS, 'gv-thead h-11 rounded-full px-6 text-14 font-medium text-[rgb(var(--gv-ink-2))]')}>
          <span>Game</span>
          <span>Player</span>
          <span>Time</span>
          <span>Wager</span>
          <span>Multiplier</span>
          <span className="text-right">Payout</span>
        </div>
        {state === 'loading' ? (
          <div className="flex flex-col" role="status" aria-label="Loading live wagers">
            {Array.from({ length: ROWS }, (_, i) => (
              <div key={i} className={cn(COLS, 'h-[56px] px-6')}>
                <span className="flex items-center gap-3">
                  <Skel className="h-10 w-10" />
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
          <Note className="flex-1" icon={<WarningCircle weight="fill" className="text-[#FF7A88]" aria-hidden />} title="Live wagers are paused" body="The feed lost its connection. It reconnects on its own, your balance is not affected." />
        ) : list.length === 0 ? (
          <Note className="flex-1" icon={<GameController weight="regular" className="text-[rgb(var(--gv-ink-2))]" aria-hidden />} title="No wagers here yet" body="Wagers that match this tab show up the moment they land." />
        ) : (
          <ul aria-label="Latest wagers" aria-live="off">
            {list.map((b) => (
              <Row key={b.key} b={b} onPlay={onPlay} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
