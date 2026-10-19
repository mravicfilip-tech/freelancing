import { useState } from 'react';
import { GameController, Lightning, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';
import { Coin } from '../kit/parts';
import { Face, SectionTitle, Skel, StateNote, handle, useWide } from './ui';

// A compact bets list, calm on the surface. Header in one sunken bar, rows split by space, numbers
// right aligned and tabular, profit in green, your own rows in the selection purple. At 1920 the
// rows run in two columns, so a row never stretches across the whole page.

const TABS = [
  { value: 'all', label: 'All bets', pick: (_: Bet) => true },
  { value: 'high', label: 'High wins', pick: (b: Bet) => payout(b) >= 250 },
  { value: 'mine', label: 'My bets', pick: (b: Bet) => !!b.mine },
];

const COLS = 'grid grid-cols-[2fr_1.5fr_0.8fr_0.9fr_0.8fr_1fr] items-center gap-4';

function Head() {
  return (
    <div aria-hidden className={cn(COLS, 'rounded-full bg-[rgb(var(--m2-sunken))] px-4 py-2 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--m2-ink3))]')}>
      <span>Game</span>
      <span>Player</span>
      <span>Time</span>
      <span className="text-right">Bet</span>
      <span className="text-right">Multiplier</span>
      <span className="text-right">Payout</span>
    </div>
  );
}

function Row({ b, onPlay }: { b: Bet; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(b.gameId)!;
  const p = payout(b);
  return (
    <li className={cn(COLS, 'h-[48px] rounded-full px-4 text-14 font-semibold transition-colors hover:bg-white/[0.03]')}>
      <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}`} className="flex min-w-0 items-center gap-3 rounded-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
        <img src={g.image} alt="" className="h-8 w-8 shrink-0 rounded-[10px] object-cover" />
        <span className="truncate font-bold text-ink">{g.short ?? g.name}</span>
      </button>
      <span className="flex min-w-0 items-center gap-2">
        <Face src={b.avatar} initials={b.initials} size={24} />
        <span className={cn('truncate', b.mine ? 'text-[#C9A2FF]' : 'text-ink')}>{handle(b.player)}</span>
      </span>
      <span className="num text-[rgb(var(--m2-ink3))]">{b.time}</span>
      <span className="flex items-center justify-end gap-2">
        <span className="num text-ink">{formatAmount(b.wager, 0)}</span>
        <Coin id={b.coin} size={16} />
      </span>
      <span className={cn('num text-right', b.multiplier > 0 ? 'text-ink' : 'text-[rgb(var(--m2-ink3))]')}>{b.multiplier.toFixed(2)}x</span>
      <span className="flex items-center justify-end gap-2">
        {p > 0 ? (
          <>
            <span className="num font-bold text-[#5FF0A0]">+{formatAmount(p, p >= 1000 ? 0 : 2)}</span>
            <Coin id={b.coin} size={16} />
          </>
        ) : (
          <span className="num pr-6 text-[rgb(var(--m2-ink3))]">0.00</span>
        )}
      </span>
    </li>
  );
}

export function Bets({ onPlay, state }: { onPlay: (g: CatalogueGame) => void; state: string | null }) {
  const wide = useWide();
  const [tab, setTab] = useState(state === 'empty' ? 'mine' : 'all');
  const source = state === 'empty' ? BETS.filter((b) => !b.mine) : BETS;
  const list = source.filter(TABS.find((t) => t.value === tab)!.pick).slice(0, wide ? 12 : 8);
  const half = Math.ceil(list.length / 2);
  const columns = wide ? [list.slice(0, half), list.slice(half)] : [list];
  return (
    <section id="m2-bets" aria-labelledby="m2-bets-title" className="flex scroll-mt-[96px] flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <SectionTitle id="m2-bets-title" icon={<Lightning weight="fill" className="text-[#5FF0A0]" />} sub="Every bet across the lagoon, as it lands">
          Live bets
        </SectionTitle>
        <div role="tablist" aria-label="Bets" className="m2-box flex gap-1 rounded-full p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'h-9 rounded-full px-4 text-14 font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#B47CFF]',
                tab === t.value ? 'm2-nav-on' : 'text-[rgb(var(--m2-ink2))] hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab)!.label} className="m2-box overflow-hidden rounded-[24px] p-2">
        {state === 'loading' ? (
          <div className="grid grid-cols-1 gap-x-4 w1920:grid-cols-2">
            {Array.from({ length: wide ? 2 : 1 }, (_, c) => (
              <div key={c} className="flex flex-col gap-1">
                <Head />
                {Array.from({ length: wide ? 6 : 8 }, (_, i) => (
                  <Skel key={i} className="mt-1 h-11 w-full rounded-full" />
                ))}
              </div>
            ))}
          </div>
        ) : state === 'error' ? (
          <>
            <Head />
            <StateNote icon={<WarningCircle weight="fill" className="text-danger" />} title="Live bets are paused" body="The feed lost its connection. It reconnects on its own, or reload the page." />
          </>
        ) : list.length === 0 ? (
          <>
            <Head />
            <StateNote icon={<GameController weight="fill" className="text-[rgb(var(--m2-ink3))]" />} title={tab === 'mine' ? 'You have no bets yet today' : 'No bets here yet'} body={tab === 'mine' ? 'Open any game and your bets show here as they settle.' : 'Bets that match this tab show up the moment they land.'} />
          </>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 w1920:grid-cols-2">
            {columns.map((col, c) => (
              <div key={c} className="flex min-w-0 flex-col">
                <Head />
                <ul aria-label={c === 0 ? 'Latest bets' : 'Earlier bets'} className="flex flex-col pt-1">
                  {col.map((b) => (
                    <Row key={b.id} b={b} onPlay={onPlay} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
