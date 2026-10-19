import { GameController, Pause } from '@phosphor-icons/react';
import { Avatar } from '../../../components/ui/Avatar';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { gameById } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatUsd } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';
import { Coin, LiveDot, SectionHead } from './parts';

const TABS = [
  { value: 'all', label: 'All wagers', pick: (_: Bet) => true },
  { value: 'high', label: 'High wins', pick: (b: Bet) => payout(b) >= 250 },
  { value: 'lucky', label: 'Lucky wins', pick: (b: Bet) => b.multiplier >= 5 },
  { value: 'mine', label: 'My wagers', pick: (b: Bet) => !!b.mine },
];

const COLS = 'grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)_72px_minmax(0,1.3fr)_80px_minmax(0,1.4fr)] items-center gap-x-4 px-4';
const ROWS = 8;

function Rows({ rows }: { rows: Bet[] }) {
  if (!rows.length) {
    return <Message className="py-12" icon={<GameController weight="fill" className="h-10 w-10 text-ink3" aria-hidden />} title="No wagers here yet" body="Wagers that match this tab show up the moment they land." />;
  }
  return (
    <ul aria-label="Latest wagers">
      {rows.slice(0, ROWS).map((b) => {
        const g = gameById(b.gameId)!;
        const coin = coinById(b.coin);
        const p = payout(b);
        return (
          <li key={b.id} className={cn(COLS, 'h-[52px] border-t border-line/60 text-14', b.mine && 'bg-raised/50')}>
            <span className="flex min-w-0 items-center gap-3">
              <img src={g.image} alt="" loading="lazy" className="h-[40px] w-[30px] shrink-0 rounded object-cover" />
              <span className="truncate font-medium text-ink">{g.short ?? g.name}</span>
            </span>
            <span className="flex min-w-0 items-center gap-2">
              {b.avatar ? <img src={b.avatar} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover" /> : <Avatar initials={b.initials} size="sm" className="h-6 w-6 text-12" />}
              <span className="truncate text-ink">{b.player}</span>
            </span>
            <span className="num text-ink2">{b.time}</span>
            <span className="num flex items-center gap-2 text-ink">
              {formatUsd(b.wager).replace('.00', '')}
              <Coin id={b.coin} size={18} />
              <span className="sr-only">{coin.symbol}</span>
            </span>
            <span className={cn('num', b.multiplier > 0 ? 'font-semibold text-gold' : 'text-ink3')}>{b.multiplier.toFixed(2)}x</span>
            <span className={cn('num text-right', p > 0 ? 'font-semibold text-win' : 'text-ink3')}>{p > 0 ? `+${formatUsd(p)}` : formatUsd(0)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Wagers({ state }: { state: string | null }) {
  return (
    <section aria-labelledby="v1-wagers" className="min-w-0">
      <SectionHead
        id="v1-wagers"
        title="Latest wagers"
        hint={
          state === 'error' ? (
            'Paused'
          ) : (
            <span className="inline-flex items-center gap-2">
              <LiveDot /> Live
            </span>
          )
        }
      />
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-panel">
        <Tabs defaultValue="all">
          <TabsList aria-label="Wagers" className="gap-6 px-4">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className={cn(COLS, 'h-[36px] bg-thead/[0.57] text-12 uppercase text-label')} aria-hidden>
            <span>Game</span>
            <span>Player</span>
            <span>Time</span>
            <span>Wager</span>
            <span>Multiplier</span>
            <span className="text-right">Payout</span>
          </div>
          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="outline-none">
              {state === 'loading' ? (
                <div className="flex flex-col gap-3 px-4 py-3">
                  {Array.from({ length: ROWS }, (_, i) => (
                    <Skeleton key={i} className="h-[40px] w-full" />
                  ))}
                </div>
              ) : state === 'error' ? (
                <Message
                  className="py-12"
                  icon={<Pause weight="fill" className="h-10 w-10 text-pending" aria-hidden />}
                  title="Live wagers are paused"
                  body="The feed lost its connection. It reconnects on its own, or reload the page."
                />
              ) : (
                <Rows rows={BETS.filter(t.pick)} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
