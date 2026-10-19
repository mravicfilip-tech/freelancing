import { useRef } from 'react';
import { CaretLeft, CaretRight, Play, WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { formatUsd } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { Skeleton } from '../../../components/ui/Skeleton';
import { KitButton } from '../kit/parts';
import { CONTINUE_PLAYING } from '../shared/data';
import { RECOMMENDED } from '../../lobby/data';
import { CATEGORY_NAME, cardName, onlineFor } from './shared';

// Grimdrop's large custom game carousel. Big art cards with a dark lower fade, a tag in the corner
// and a dark box holding the name in capitals, a live count chip, the session result and a square
// play button. The player's own games come first, then the ones picked for them.

type Card = {
  game: CatalogueGame;
  lastPlayed?: string;
  session?: number;
  tag?: string;
};

const CARDS: Card[] = [
  { game: gameById('donny-dough')!, tag: 'New this week' },
  ...CONTINUE_PLAYING.map((c) => ({
    game: gameById(c.gameId)!,
    lastPlayed: c.lastPlayed,
    session: c.session,
  })),
  ...RECOMMENDED.filter((id) => !CONTINUE_PLAYING.some((c) => c.gameId === id))
    .slice(0, 4)
    .map((id) => ({ game: gameById(id)! })),
];

export function Heading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="font-display text-24 font-bold uppercase leading-[28px] tracking-[0.01em] text-ink">
      {children}
    </h2>
  );
}

function ArtCard({ card, wide, onPlay }: { card: Card; wide: boolean; onPlay: () => void }) {
  const g = card.game;
  const mine = card.session !== undefined;
  const win = (card.session ?? 0) > 0;
  return (
    <li className={cn('relative h-[280px] shrink-0 snap-start overflow-hidden rounded-[22px] bg-[rgb(var(--k-item))]', wide ? 'w-[420px]' : 'w-[272px]')}>
      <img src={wide && g.wide ? g.wide : g.image} alt="" className={cn('absolute inset-0 h-full w-full object-cover', wide ? 'object-[50%_20%]' : 'object-top')} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] bg-[linear-gradient(180deg,transparent,rgb(14_8_28/0.92)_78%)]" />
      <span className="absolute left-4 top-4 rounded-[8px] bg-gold px-2 py-1 text-12 font-bold uppercase leading-none tracking-[0.04em] text-on-gold">
        {mine ? `Played ${card.lastPlayed}` : (card.tag ?? g.tag ?? 'Picked for you')}
      </span>
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-[16px] bg-[rgb(18_10_36/0.78)] p-3 ring-1 ring-inset ring-ink/10 backdrop-blur-md">
        <div className="flex min-w-0 flex-1 flex-col gap-2 pl-1">
          <p className={cn('truncate font-display font-bold uppercase text-ink', wide ? 'text-20 leading-6' : 'text-16 leading-5')}>{cardName(g)}</p>
          <p className="flex items-center gap-2">
            <span className="num inline-flex h-[28px] shrink-0 items-center gap-2 rounded-[8px] border border-gold/40 bg-gold/10 px-2 text-12 font-bold text-ink">
              <span aria-hidden className="h-[6px] w-[6px] rounded-full bg-[#3DDC84]" />
              {onlineFor(g.id).toLocaleString('en-US')} online
            </span>
            {mine ? (
              <span className="truncate text-14 font-bold">
                <span className={cn('num', win ? 'text-win' : 'text-ink3')}>
                  {win ? '+' : '-'}
                  {formatUsd(Math.abs(card.session!))}
                </span>
                <span className="sr-only"> this session</span>
              </span>
            ) : (
              <span className="truncate text-14 font-semibold text-[rgb(var(--k-muted))]">{wide ? g.provider : CATEGORY_NAME[g.category]}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onPlay}
          aria-label={`Play ${g.name}`}
          className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[14px] bg-[#3DDC84] text-[#0A2A17] transition-[filter] hover:brightness-110"
        >
          <Play weight="fill" className="h-6 w-6" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function Carousel({ state, failed, onRetry, onPlay, className }: { state: string | null; failed: boolean; onRetry: () => void; onPlay: (g: CatalogueGame) => void; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const move = (d: 1 | -1) => ref.current?.scrollBy({ left: d * 288, behavior: 'smooth' });
  return (
    <section aria-labelledby="v2-carousel" className={className}>
      <h2 id="v2-carousel" className="sr-only">
        Made for you, new this week and your last four games
      </h2>
      {failed ? (
        <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-[22px] bg-[rgb(var(--k-panel))] text-center">
          <WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />
          <p className="text-18 font-bold text-ink">We could not load your games</p>
          <p className="text-16 text-[rgb(var(--k-muted))]">Your balance and bets are safe. Try again in a moment.</p>
          <KitButton tone="purple" onClick={onRetry} className="mt-2">
            Try again
          </KitButton>
        </div>
      ) : (
        <div className="relative">
          <ul ref={ref} className="k-no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth">
            {state === 'loading'
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className={cn('h-[280px] shrink-0 rounded-[22px]', i === 0 ? 'w-[420px]' : 'w-[272px]')} />)
              : CARDS.map((c, i) => <ArtCard key={c.game.id} card={c} wide={i === 0} onPlay={() => onPlay(c.game)} />)}
          </ul>
          {state !== 'loading' && (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous games"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[12px] border border-ink/15 bg-[rgb(var(--k-item))] text-ink shadow-[0_8px_20px_rgb(0_0_0/0.35)] hover:bg-[rgb(var(--k-item-hover))]"
              >
                <CaretLeft weight="bold" className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next games"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[12px] border border-ink/15 bg-[rgb(var(--k-item))] text-ink shadow-[0_8px_20px_rgb(0_0_0/0.35)] hover:bg-[rgb(var(--k-item-hover))]"
              >
                <CaretRight weight="bold" className="h-5 w-5" aria-hidden />
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
