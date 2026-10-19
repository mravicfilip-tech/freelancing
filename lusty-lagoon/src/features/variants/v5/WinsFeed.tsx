import { useState } from 'react';
import { Clover, Lightning, Trophy, WarningCircle } from '@phosphor-icons/react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById, type CoinId } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout } from '../../lobby/data';
import { LIVE_WINS } from '../shared/data';
import { Coin } from '../kit/parts';
import { CardTitle } from './ui';

// mines.gg's biggest wins column. A header with the trophy, the Highest and Luckiest tabs, then a
// card per win, the avatar beside a name line and a dark bubble of "won" plus the amount in green
// and the game and time under it. The list fades out at the foot as mines.gg's does.

type Item = { id: string; player: string; avatar?: string; initials: string; gameId: string; amount: number; coin: CoinId; line: string; mult?: number };

const value = (amount: number, coin: CoinId) => amount * coinById(coin).rate;
const initials = (n: string) => n.split(/\s|\./).filter(Boolean).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

const HIGHEST: Item[] = [...LIVE_WINS]
  .sort((a, b) => value(b.amount, b.coin) - value(a.amount, a.coin))
  .map((w) => ({ id: w.id, player: w.player, avatar: w.avatar, initials: w.initials ?? initials(w.player), gameId: w.gameId, amount: w.amount, coin: w.coin, line: `${w.ago} ago` }));

const LUCKIEST: Item[] = BETS.filter((b) => b.multiplier > 1)
  .sort((a, b) => b.multiplier - a.multiplier)
  .map((b) => ({ id: b.id, player: b.player, avatar: b.avatar, initials: b.initials, gameId: b.gameId, amount: payout(b), coin: b.coin, line: `Today, ${b.time}`, mult: b.multiplier }));

const TABS = [
  { value: 'high' as const, label: 'Highest wins', icon: <Lightning weight="fill" /> },
  { value: 'lucky' as const, label: 'Luckiest wins', icon: <Clover weight="fill" /> },
];

function WinCard({ w, onPlay }: { w: Item; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(w.gameId)!;
  const c = coinById(w.coin);
  const digits = c.decimals > 2 && w.amount < 100 ? 2 : 2;
  return (
    <li className="flex gap-3">
      {w.avatar ? (
        <img src={w.avatar} alt="" className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[rgb(var(--k-item))]" />
      ) : (
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3A2A63] text-14 font-bold text-ink">{w.initials}</span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-14 font-bold text-ink">{w.player}</span>
        <button type="button" onClick={() => onPlay(g)} aria-label={`${w.player} won ${formatAmount(w.amount, digits)} ${c.symbol} on ${g.name}. Play ${g.name}`} className="group flex items-center gap-3 rounded-[14px] bg-[rgb(var(--k-item))] py-2 pl-4 pr-2 text-left transition-colors hover:bg-[rgb(var(--k-item-hover))]">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex flex-wrap items-center gap-x-2 text-16 font-bold text-ink">
              {w.mult ? `Hit ${w.mult.toFixed(2)}x, won` : 'Won'}
              <span className="num inline-flex items-center gap-1 text-win">
                <Coin id={w.coin} size={16} className="ring-1 ring-ink/20" />
                {formatAmount(w.amount, digits)}
              </span>
            </span>
            <span className="truncate text-12 font-semibold text-[rgb(var(--k-muted))]">
              {g.short ?? g.name}, {w.line}
            </span>
          </span>
          <img src={g.image} alt="" className="h-11 w-11 shrink-0 rounded-[10px] object-cover ring-2 ring-transparent transition group-hover:ring-accent" />
        </button>
      </div>
    </li>
  );
}

export function WinsFeed({ state, onPlay, className }: { state: string | null; onPlay: (g: CatalogueGame) => void; className?: string }) {
  const [tab, setTab] = useState<'high' | 'lucky'>('high');
  const list = tab === 'high' ? HIGHEST : LUCKIEST;
  return (
    <section aria-labelledby="wins-title" className={cn('k-surface flex min-h-0 flex-col overflow-hidden rounded-[20px]', className)}>
      <div className="flex flex-col gap-4 k-rule border-b p-6 pb-4">
        <CardTitle id="wins-title">
          <Trophy weight="fill" className="h-6 w-6 text-gold" aria-hidden />
          Biggest wins
        </CardTitle>
        <div role="tablist" aria-label="Biggest wins" className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              aria-controls="wins-panel"
              onClick={() => setTab(t.value)}
              className={cn(
                'relative flex h-8 items-center gap-2 text-14 font-bold transition-colors',
                tab === t.value ? 'text-ink after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-accent' : 'text-[rgb(var(--k-muted))] hover:text-ink',
              )}
            >
              <span className={cn('flex h-4 w-4 [&>svg]:h-4 [&>svg]:w-4', tab === t.value ? 'text-gold' : '')}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div id="wins-panel" role="tabpanel" className="k-no-scrollbar relative min-h-0 flex-1 overflow-y-auto [mask-image:linear-gradient(180deg,#000_80%,transparent)] p-6 pb-12">
        {state === 'loading' ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <Skeleton className="h-[72px] flex-1 rounded-[14px]" />
              </div>
            ))}
          </div>
        ) : state === 'error' ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <WarningCircle weight="fill" className="h-8 w-8 text-danger" aria-hidden />
            <p className="text-16 font-bold text-ink">Wins are paused</p>
            <p className="max-w-[220px] text-14 text-[rgb(var(--k-muted))]">They come back with the live feed.</p>
          </div>
        ) : (
          <ul aria-label={tab === 'high' ? 'Highest wins' : 'Luckiest wins'} className="flex flex-col gap-4">
            {list.map((w) => (
              <WinCard key={w.id} w={w} onPlay={onPlay} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
