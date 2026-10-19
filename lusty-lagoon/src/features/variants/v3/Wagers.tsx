import { GameController, WarningCircle } from '@phosphor-icons/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Avatar } from '../../../components/ui/Avatar';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import { gameById } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatUsd } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';

const TABS = [
  { value: 'all', label: 'All wagers', pick: (_: Bet) => true },
  { value: 'high', label: 'High wins', pick: (b: Bet) => payout(b) >= 250 },
  { value: 'mine', label: 'My wagers', pick: (b: Bet) => !!b.mine },
];

const COLS = 'grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-4 px-6';

function Rows({ rows, loading, paused }: { rows: Bet[]; loading: boolean; paused: boolean }) {
  if (paused) {
    return (
      <Message
        className="py-10"
        icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
        title="Live wagers are paused"
        body="The feed lost its connection. It reconnects on its own, or reload the page."
      />
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col gap-2 px-6 py-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    );
  }
  if (!rows.length) {
    return <Message className="py-10" icon={<GameController weight="fill" className="h-10 w-10 text-ink3" aria-hidden />} title="No wagers here yet" body="Wagers that match this tab show up the moment they land." />;
  }
  return (
    <ul aria-label="Latest wagers" className="divide-y divide-line">
      {rows.map((b) => {
        const g = gameById(b.gameId)!;
        const coin = coinById(b.coin);
        const p = payout(b);
        return (
          <li key={b.id} className={cn(COLS, 'h-[48px] text-14')}>
            <span className="flex min-w-0 items-center gap-3">
              <img src={g.image} alt="" className="h-8 w-6 shrink-0 rounded object-cover" />
              <span className="truncate text-ink">{g.short ?? g.name}</span>
            </span>
            <span className="flex min-w-0 items-center gap-2">
              {b.avatar ? <img src={b.avatar} alt="" width={24} height={24} className="h-6 w-6 rounded-full" /> : <Avatar initials={b.initials} size="sm" className="h-6 w-6 text-12" />}
              <span className={cn('truncate', b.mine ? 'font-semibold text-accent' : 'text-ink2')}>{b.player}</span>
            </span>
            <span className="num text-ink3">{b.time}</span>
            <span className="num flex items-center gap-2 text-ink">
              {formatUsd(b.wager).replace('.00', '')}
              <img src={coin.icon} alt="" width={18} height={18} />
              <span className="sr-only">{coin.symbol}</span>
            </span>
            <span className={cn('num', b.multiplier > 0 ? 'text-gold' : 'text-ink3')}>{b.multiplier.toFixed(2)}x</span>
            <span className={cn('num', p > 0 ? 'font-semibold text-win' : 'text-ink3')}>{formatUsd(p)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Wagers({ loading, paused }: { loading: boolean; paused: boolean }) {
  return (
    <section aria-labelledby="wagers-title" className="overflow-hidden rounded-2xl border border-line bg-panel">
      <Tabs defaultValue="all">
        <div className="flex items-end justify-between gap-6 border-b border-line px-6 pt-4">
          <h2 id="wagers-title" className="ll-heading pb-2">
            Latest wagers
          </h2>
          <TabsList aria-label="Wagers" className="border-b-0">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className={cn(COLS, 'h-9 bg-thead/[0.57] text-12 uppercase text-label')} aria-hidden>
          <span>Game</span>
          <span>Player</span>
          <span>Time</span>
          <span>Wager</span>
          <span>Multiplier</span>
          <span>Payout</span>
        </div>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="outline-none">
            <Rows rows={BETS.filter(t.pick).slice(0, 8)} loading={loading} paused={paused} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
