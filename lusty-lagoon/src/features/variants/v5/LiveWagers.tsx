import { useState } from 'react';
import { GameController, WarningCircle } from '@phosphor-icons/react';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Avatar } from '../../../components/ui/Avatar';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatUsd } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';
import { Coin, useStill } from './parts';

// The centre of the page. A table that reads like a ledger, a pinned header, flat rows with a
// hairline between them, the payout in win green. The game cell opens the game.

const TABS = [
  { value: 'all', label: 'All wagers', pick: (_: Bet) => true },
  { value: 'high', label: 'High wins', pick: (b: Bet) => payout(b) >= 250 },
  { value: 'lucky', label: 'Lucky wins', pick: (b: Bet) => b.multiplier >= 5 },
  { value: 'mine', label: 'My wagers', pick: (b: Bet) => !!b.mine },
];

const COLS = 'grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-4 px-6';

function Head() {
  return (
    <div role="row" className={cn(COLS, 'sticky top-[72px] z-10 h-10 rounded-t-2xl border-b border-line bg-sunken text-12 uppercase tracking-[0.05em] text-label')}>
      <span role="columnheader">Game</span>
      <span role="columnheader">Player</span>
      <span role="columnheader">Time</span>
      <span role="columnheader">Wager</span>
      <span role="columnheader" className="text-right">Multiplier</span>
      <span role="columnheader" className="text-right">Payout</span>
    </div>
  );
}

function Row({ bet, onPlay }: { bet: Bet; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(bet.gameId)!;
  const coin = coinById(bet.coin);
  const p = payout(bet);
  return (
    <div role="row" className={cn(COLS, 'h-[60px] border-b border-line/70 text-16 transition-colors last:border-b-0 hover:bg-raised/60')}>
      <span role="cell" className="min-w-0">
        <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}`} className="group flex max-w-full items-center gap-4 rounded text-left">
          <img src={g.image} alt="" loading="lazy" className="h-[44px] w-[33px] shrink-0 rounded object-cover" />
          <span className="truncate font-medium text-ink group-hover:text-accent">{g.name}</span>
        </button>
      </span>
      <span role="cell" className="flex min-w-0 items-center gap-3">
        {bet.avatar ? <img src={bet.avatar} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <Avatar initials={bet.initials} size="sm" />}
        <span className="truncate text-ink">{bet.player}</span>
        {bet.mine ? <span className="shrink-0 rounded border border-accent/50 px-1 text-12 text-accent">You</span> : null}
      </span>
      <span role="cell" className="num text-ink2">
        {bet.time}
      </span>
      <span role="cell" className="num flex items-center gap-2 text-ink">
        {formatUsd(bet.wager)}
        <Coin id={bet.coin} size={20} />
        <span className="sr-only">{coin.symbol}</span>
      </span>
      <span role="cell" className={cn('num text-right', bet.multiplier >= 5 ? 'font-semibold text-gold' : bet.multiplier > 0 ? 'text-ink' : 'text-ink3')}>
        {bet.multiplier.toFixed(2)}x
      </span>
      <span role="cell" className={cn('num text-right', p > 0 ? 'font-semibold text-win' : 'text-ink3')}>
        {formatUsd(p)}
      </span>
    </div>
  );
}

function Rows({ rows, state, onPlay }: { rows: Bet[]; state: string | null; onPlay: (g: CatalogueGame) => void }) {
  if (state === 'loading') {
    return (
      <div aria-busy className="flex flex-col">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={cn(COLS, 'h-[60px] border-b border-line/70 last:border-b-0')}>
            <span className="flex items-center gap-4">
              <Skeleton className="h-[44px] w-[33px]" />
              <Skeleton className="h-5 w-[140px]" />
            </span>
            <Skeleton className="h-5 w-[120px]" />
            <Skeleton className="h-5 w-[72px]" />
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="ml-auto h-5 w-[56px]" />
            <Skeleton className="ml-auto h-5 w-[80px]" />
          </div>
        ))}
      </div>
    );
  }
  if (state === 'error') {
    return (
      <Message
        className="py-16"
        icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
        title="Live wagers are paused"
        body="The feed lost its connection. It reconnects on its own, or reload the page."
      />
    );
  }
  if (!rows.length) {
    return <Message className="py-16" icon={<GameController weight="fill" className="h-10 w-10 text-ink3" aria-hidden />} title="No wagers here yet" body="Wagers that match this tab show up the moment they land." />;
  }
  return (
    <>
      {rows.map((b) => (
        <Row key={b.id} bet={b} onPlay={onPlay} />
      ))}
    </>
  );
}

export function LiveWagers({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const [tab, setTab] = useState('all');
  const still = useStill();
  const paused = state === 'error';
  return (
    <section aria-labelledby="v5-wagers" className="mt-12">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <h2 id="v5-wagers" className="font-display text-24 font-semibold leading-[1.2] text-ink">
              Live wagers
            </h2>
            <p className={cn('flex h-6 items-center gap-2 rounded-full border px-3 text-12 font-semibold', paused ? 'border-danger/50 text-danger' : 'border-success/40 text-success')}>
              <span aria-hidden className={cn('h-2 w-2 rounded-full', paused ? 'bg-danger' : 'bg-success', !paused && !still && 'animate-pulse')} />
              {paused ? 'Paused' : 'Live'}
            </p>
          </div>
          <TabsList aria-label="Wagers" className="gap-8 border-b-0">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="mt-4 rounded-2xl border border-line bg-panel">
          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="outline-none">
              <div role="table" aria-label="Latest wagers">
                <Head />
                <Rows rows={BETS.filter(t.pick)} state={state} onPlay={onPlay} />
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </section>
  );
}
