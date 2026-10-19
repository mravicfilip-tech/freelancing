import { Skeleton } from '../../../components/ui/Skeleton';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { TOP_WINNERS } from '../../lobby/data';
import { CONTINUE_PLAYING } from '../shared/data';
import { Coin, SectionHead, signed } from './parts';

// Two plain lists side by side. No boxes, a hairline between rows, so the table above stays the
// one heavy element on the page.

function ListSkeleton() {
  return (
    <div aria-hidden className="mt-4 flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[64px] w-full" />
      ))}
    </div>
  );
}

export function JumpBackIn({ loading, onPlay }: { loading: boolean; onPlay: (g: CatalogueGame) => void }) {
  return (
    <section aria-labelledby="v5-jump" className="min-w-0">
      <SectionHead id="v5-jump" title="Jump back in" sub="Your last games, with how the session ended" />
      {loading ? (
        <ListSkeleton />
      ) : (
        <ul className="mt-4 flex flex-col border-t border-line">
          {CONTINUE_PLAYING.map((c) => {
            const g = gameById(c.gameId)!;
            return (
              <li key={c.gameId} className="border-b border-line">
                <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}, last played ${c.lastPlayed}`} className="group flex h-[72px] w-full items-center gap-4 rounded px-2 text-left transition-colors hover:bg-raised/60">
                  <img src={g.image} alt="" loading="lazy" className="h-[56px] w-[42px] shrink-0 rounded object-cover" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-16 font-medium text-ink group-hover:text-accent">{g.name}</span>
                    <span className="text-14 text-ink3">{c.lastPlayed}</span>
                  </span>
                  <span className={cn('num text-16 font-semibold', c.session > 0 ? 'text-win' : 'text-ink3')}>{signed(c.session)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function TopWins({ loading, onPlay }: { loading: boolean; onPlay: (g: CatalogueGame) => void }) {
  return (
    <section aria-labelledby="v5-top" className="min-w-0">
      <SectionHead id="v5-top" title="Top wins today" sub="The biggest payouts in the last 24 hours" />
      {loading ? (
        <ListSkeleton />
      ) : (
        <ul className="mt-4 flex flex-col border-t border-line">
          {TOP_WINNERS.map((w) => {
            const g = gameById(w.gameId)!;
            const coin = coinById(w.coin);
            return (
              <li key={w.gameId} className="border-b border-line">
                <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}, ${w.player} won ${formatAmount(w.amount)} ${coin.symbol}`} className="group flex h-[72px] w-full items-center gap-4 rounded px-2 text-left transition-colors hover:bg-raised/60">
                  <img src={g.image} alt="" loading="lazy" className="h-[56px] w-[42px] shrink-0 rounded object-cover" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-16 font-medium text-ink group-hover:text-accent">{g.name}</span>
                    <span className="flex items-center gap-2 text-14 text-ink3">
                      <img src={w.avatar} alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                      {w.player}
                    </span>
                  </span>
                  <span className="num flex items-center gap-2 text-16 font-semibold text-win">
                    {formatAmount(w.amount)}
                    <Coin id={w.coin} size={20} />
                    <span className="sr-only">{coin.symbol}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
