import { useState } from 'react';
import { GameController, Lightning, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { BETS, payout, type Bet } from '../../lobby/data';
import { Coin } from '../kit/parts';
import { SectionTitle, Skel, StateNote, handle } from './ui';

// One bets table at every width, after variant 5's Live wagers table. The column labels sit in one
// sunken pill bar in sentence case, rows on a faint rule, the game as a cover with its provider under
// it, numbers tabular, payouts as green text with a plus sign and no box, your own rows tagged You.

const TABS = [
  { value: 'all', label: 'All bets', pick: (_: Bet) => true },
  { value: 'high', label: 'High wins', pick: (b: Bet) => payout(b) >= 250 },
  { value: 'mine', label: 'My bets', pick: (b: Bet) => !!b.mine },
];

const COLS = 'grid grid-cols-[minmax(0,2.7fr)_minmax(0,1.85fr)_0.8fr_1.05fr_0.85fr_1.1fr] items-center gap-3 w1920:gap-4';
const ROWS = 8;

function Head() {
  return (
    <div aria-hidden className={cn(COLS, 'm2-thead h-11 rounded-full px-6 text-14 font-medium text-[rgb(var(--m2-ink2))]')}>
      <span>Game</span>
      <span>Player</span>
      <span>Time</span>
      <span>Bet</span>
      <span>Multiplier</span>
      <span className="text-right">Payout</span>
    </div>
  );
}

function Row({ b, onPlay }: { b: Bet; onPlay: (g: CatalogueGame) => void }) {
  const g = gameById(b.gameId)!;
  const p = payout(b);
  const sym = coinById(b.coin).symbol;
  return (
    <li className={cn(COLS, 'm2-rule h-[56px] border-t px-6 text-14 first:border-t-0')}>
      <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}`} className="group flex min-w-0 items-center gap-3 rounded-[12px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[12px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]">
          <img src={g.image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.08]" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-14 font-semibold text-ink">{g.short ?? g.name}</span>
          <span className="truncate text-12 text-[rgb(var(--m2-ink3))]">{g.provider}</span>
        </span>
      </button>
      <span className="flex min-w-0 items-center gap-2">
        {b.avatar ? (
          <img src={b.avatar} alt="" className="h-[28px] w-[28px] shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-12 font-semibold text-ink">{b.initials}</span>
        )}
        <span className={cn('truncate font-medium', b.mine ? 'text-[#C9A2FF]' : 'text-ink')}>{handle(b.player)}</span>
        {b.mine && <span className="shrink-0 rounded-full bg-[#B47CFF]/[0.14] px-2 text-12 font-semibold leading-5 text-[#C9A2FF]">You</span>}
      </span>
      <span className="num text-[rgb(var(--m2-ink3))]">{b.time}</span>
      <span className="num flex items-center gap-2 font-medium text-ink">
        <Coin id={b.coin} size={18} />
        {formatAmount(b.wager)}
        <span className="sr-only"> {sym}</span>
      </span>
      <span className={cn('num font-medium', b.multiplier > 0 ? 'text-ink' : 'text-[rgb(var(--m2-ink3))]')}>{b.multiplier.toFixed(2)}x</span>
      <span className="flex justify-end">
        {p > 0 ? (
          <span className="num inline-flex items-center gap-2 font-semibold text-[#5FF0A0]">
            +{formatAmount(p)}
            <Coin id={b.coin} size={18} />
            <span className="sr-only"> {sym}</span>
          </span>
        ) : (
          <span className="num pr-[26px] text-[rgb(var(--m2-ink3))]">0.00</span>
        )}
      </span>
    </li>
  );
}

export function Bets({ onPlay, state }: { onPlay: (g: CatalogueGame) => void; state: string | null }) {
  const [tab, setTab] = useState(state === 'empty' ? 'mine' : 'all');
  const source = state === 'empty' ? BETS.filter((b) => !b.mine) : BETS;
  const list = source.filter(TABS.find((t) => t.value === tab)!.pick).slice(0, ROWS);
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
      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab)!.label} className="m2-box flex flex-col gap-2 overflow-hidden rounded-[24px] p-4">
        <Head />
        {state === 'loading' ? (
          <div className="flex flex-col" role="status" aria-label="Loading live bets">
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
          <StateNote icon={<WarningCircle weight="fill" className="text-danger" />} title="Live bets are paused" body="The feed lost its connection. It reconnects on its own, or reload the page." />
        ) : list.length === 0 ? (
          <StateNote icon={<GameController weight="fill" className="text-[rgb(var(--m2-ink3))]" />} title={tab === 'mine' ? 'You have no bets yet today' : 'No bets here yet'} body={tab === 'mine' ? 'Open any game and your bets show here as they settle.' : 'Bets that match this tab show up the moment they land.'} />
        ) : (
          <ul aria-label="Latest bets">
            {list.map((b) => (
              <Row key={b.id} b={b} onPlay={onPlay} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
