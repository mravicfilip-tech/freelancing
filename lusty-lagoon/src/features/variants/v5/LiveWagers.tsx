import { useState } from 'react';
import { GameController, WarningCircle } from '@phosphor-icons/react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Message } from '../../../components/ui/Message';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';
import { Coin } from '../kit/parts';
import { CardTitle, Segmented, handle } from './ui';

// The centre of the page, NewBettie's latest bets table at full size. Twelve rows, a header that
// pins under the top bar while the table scrolls past, the cover and name, the player, the time,
// the wager with its coin, the multiplier and the payout in a green box when it is above zero.

type Tab = 'all' | 'high' | 'lucky' | 'mine';
const TABS: { value: Tab; label: string; pick: (b: Bet) => boolean }[] = [
  { value: 'all', label: 'All wagers', pick: () => true },
  { value: 'high', label: 'High wins', pick: (b) => payout(b) >= 250 },
  { value: 'lucky', label: 'Lucky wins', pick: (b) => b.multiplier >= 5 },
  { value: 'mine', label: 'My wagers', pick: (b) => !!b.mine },
];

const COLS = 'grid grid-cols-[minmax(0,2.3fr)_minmax(0,1.7fr)_0.9fr_1.2fr_0.9fr_1.3fr] items-center gap-3';

function Row({ b, onPlay }: { b: Bet; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(b.gameId)!;
  const p = payout(b);
  const sym = coinById(b.coin).symbol;
  return (
    <li className={cn(COLS, 'k-rule h-[56px] border-t px-[16px] text-14 font-semibold first:border-t-0')}>
      <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}`} className="group flex min-w-0 items-center gap-3 rounded-[10px] text-left">
        <img src={g.image} alt="" className="h-10 w-10 shrink-0 rounded-[10px] object-cover ring-2 ring-transparent transition group-hover:ring-accent" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-14 font-bold text-ink group-hover:text-accent">{g.short ?? g.name}</span>
          <span className="truncate text-12 font-semibold text-[rgb(var(--k-dim))]">{g.provider}</span>
        </span>
      </button>
      <span className="flex min-w-0 items-center gap-2">
        {b.avatar ? (
          <img src={b.avatar} alt="" className="h-8 w-8 shrink-0 rounded-[10px] object-cover" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#3A2A63] text-12 font-bold text-ink">{b.initials}</span>
        )}
        <span className={cn('truncate', b.mine ? 'text-accent' : 'text-ink')}>{handle(b.player)}</span>
        {b.mine && <span className="shrink-0 rounded-[6px] bg-accent/15 px-[6px] text-12 font-bold leading-5 text-accent">You</span>}
      </span>
      <span className="num text-[rgb(var(--k-muted))]">{b.time}</span>
      <span className="num flex items-center gap-2 text-ink">
        <Coin id={b.coin} size={18} className="ring-1 ring-ink/20" />
        {formatAmount(b.wager)}
        <span className="sr-only"> {sym}</span>
      </span>
      <span className={cn('num', b.multiplier >= 5 ? 'text-gold' : b.multiplier > 0 ? 'text-ink' : 'text-[rgb(var(--k-dim))]')}>{b.multiplier.toFixed(2)}x</span>
      <span className="flex justify-end">
        {p > 0 ? (
          <span className="num inline-flex h-8 items-center gap-2 rounded-[10px] bg-win/10 px-3 text-win">
            <Coin id={b.coin} size={16} className="ring-1 ring-ink/20" />
            {formatAmount(p)}
            <span className="sr-only"> {sym}</span>
          </span>
        ) : (
          <span className="num pr-3 text-[rgb(var(--k-dim))]">0.00</span>
        )}
      </span>
    </li>
  );
}

export function LiveWagers({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const [tab, setTab] = useState<Tab>('all');
  const list = BETS.filter(TABS.find((t) => t.value === tab)!.pick).slice(0, 12);
  return (
    <section id="wagers" aria-labelledby="wagers-title" className="flex min-w-0 scroll-mt-[100px] flex-col gap-4">
      <div className="flex h-11 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CardTitle id="wagers-title" dot={state !== 'error'}>
            Live wagers
          </CardTitle>
          <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">{state === 'error' ? 'Paused' : 'Updating live'}</span>
        </div>
        <Segmented label="Wagers" items={TABS} value={tab} onChange={setTab} controls="wagers-panel" />
      </div>
      <div id="wagers-panel" role="tabpanel" aria-labelledby="wagers-title" className="k-surface min-h-[724px] rounded-[20px] p-3">
        <div aria-hidden className={cn(COLS, 'k-well sticky top-[96px] z-10 h-11 rounded-[12px] px-[16px] text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]')}>
          <span>Game</span>
          <span>Player</span>
          <span>Time</span>
          <span>Wager</span>
          <span>Multiplier</span>
          <span className="text-right">Payout</span>
        </div>
        {state === 'loading' ? (
          <div className="flex flex-col gap-2 px-[20px] py-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-[12px]" />
            ))}
          </div>
        ) : state === 'error' ? (
          <Message className="py-[72px]" icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />} title="Live wagers are paused" body="The feed lost its connection. It reconnects on its own, your balance is not affected." />
        ) : list.length === 0 ? (
          <Message className="py-[72px]" icon={<GameController weight="fill" className="h-10 w-10 text-[rgb(var(--k-dim))]" aria-hidden />} title="No wagers here yet" body="Wagers that match this tab show up the moment they land." />
        ) : (
          <ul aria-label="Latest wagers">
            {list.map((b) => (
              <Row key={b.id} b={b} onPlay={onPlay} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
