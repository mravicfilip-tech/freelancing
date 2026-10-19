import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { GameTile } from '../../../components/ui/GameTile';
import { Message } from '../../../components/ui/Message';
import { Skeleton } from '../../../components/ui/Skeleton';
import { GAMES, gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount, formatUsd } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { CONTINUE_PLAYING, LIVE_WINS } from '../shared/data';

export type Play = (g: CatalogueGame) => void;

export function FailedGames({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-panel">
      <Message
        icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
        title="We could not load the games"
        body="Your balance and wagers are safe. Try again in a moment."
        action={
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    </div>
  );
}

function Heading({ id, children, aside }: { id: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 id={id} className="ll-heading">
        {children}
      </h2>
      {aside}
    </div>
  );
}

// Pick up where you left off. A cover that bleeds to the card's left edge, the name, when you
// played and what the session came to, signed and coloured.
export function ContinueRow({ loading, failed, onRetry, onPlay }: { loading: boolean; failed: boolean; onRetry: () => void; onPlay: Play }) {
  return (
    <section aria-labelledby="continue-title" className="min-w-0">
      <Heading id="continue-title">Pick up where you left off</Heading>
      <div className="mt-4">
        {failed ? (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3" role="alert">
            <WarningCircle weight="fill" className="h-6 w-6 shrink-0 text-danger" aria-hidden />
            <p className="flex-1 text-14 text-ink">Your recent games did not load.</p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {CONTINUE_PLAYING.map((c) => {
              const g = gameById(c.gameId)!;
              if (loading) return <Skeleton key={c.gameId} className="h-[112px] rounded-xl" />;
              const won = c.session > 0;
              return (
                <li key={c.gameId} className="group relative flex h-[112px] overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-field">
                  <img src={g.image} alt="" className="h-full w-[84px] shrink-0 object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-16 font-semibold text-ink">{g.name}</p>
                      <p className="text-14 text-ink3">{c.lastPlayed}</p>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <p className="flex flex-col">
                        <span className={cn('num font-display text-20 font-bold leading-6', won ? 'text-win' : 'text-ink3')}>
                          {won ? '+' : '-'}
                          {formatUsd(Math.abs(c.session))}
                        </span>
                        <span className="text-12 text-ink3">last session</span>
                      </p>
                      <span className="rounded-lg px-2 py-1 text-14 font-semibold text-accent group-hover:bg-raised">Play</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}, last session ${won ? 'won' : 'lost'} ${formatUsd(Math.abs(c.session))}`} className="absolute inset-0 rounded-xl" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

// The five biggest live wins by value in USDT, so a bitcoin win and a tether win sort fairly.
const TOP = LIVE_WINS.map((w) => ({ ...w, usd: w.amount * coinById(w.coin).rate }))
  .sort((a, b) => b.usd - a.usd)
  .slice(0, 5);

export function TopWins({ loading, paused, onPlay }: { loading: boolean; paused: boolean; onPlay: Play }) {
  return (
    <section aria-labelledby="wins-title" className="min-w-0">
      <Heading id="wins-title">Top wins today</Heading>
      <div className="mt-4">
        {paused ? (
          <Message
            className="rounded-2xl border border-line bg-panel py-8"
            icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
            title="Live wins are paused"
            body="The feed lost its connection. It reconnects on its own."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {loading
              ? Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="py-[6px]">
                    <Skeleton className="h-[44px]" />
                  </li>
                ))
              : TOP.map((w) => {
                  const g = gameById(w.gameId)!;
                  const coin = coinById(w.coin);
                  return (
                    <li key={w.id} className="relative flex h-[56px] items-center gap-3 hover:bg-panel">
                      <img src={g.image} alt="" className="h-10 w-[30px] shrink-0 rounded object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-14 font-semibold text-ink">{g.short ?? g.name}</p>
                        <p className="flex items-center gap-1 text-14 text-ink3">
                          {w.avatar ? <img src={w.avatar} alt="" width={16} height={16} className="rounded-full" /> : null}
                          <span className="truncate">{w.player}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="num text-16 font-bold text-win">{formatUsd(Math.round(w.usd))}</span>
                        <span className="num flex items-center gap-1 text-14 text-ink3">
                          <img src={coin.icon} alt="" width={14} height={14} />
                          {formatAmount(w.amount, w.amount < 10 ? 2 : 0)} {coin.symbol}
                        </span>
                      </div>
                      <button type="button" onClick={() => onPlay(g)} aria-label={`Play ${g.name}`} className="absolute inset-0 rounded" />
                    </li>
                  );
                })}
          </ul>
        )}
      </div>
    </section>
  );
}

const ORDER = [...GAMES.filter((g) => !g.wideOnly && g.tag === 'Hot'), ...GAMES.filter((g) => !g.wideOnly && g.tag !== 'Hot')];

export function HotGrid({
  query,
  onClear,
  loading,
  failed,
  onRetry,
  onPlay,
}: {
  query: string;
  onClear: () => void;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onPlay: Play;
}) {
  const [more, setMore] = useState(false);
  const q = query.trim().toLowerCase();
  const list = useMemo(() => (q ? ORDER.filter((g) => g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)) : ORDER), [q]);
  const shown = q || more ? list : list.slice(0, 20);
  return (
    <section id="hot" aria-labelledby="hot-title" className="scroll-mt-[88px]">
      <Heading
        id="hot-title"
        aside={
          q ? (
            <Button variant="tertiary" onClick={onClear}>
              Clear the search
            </Button>
          ) : (
            <Link to="/lobby#explore" className="rounded text-14 font-semibold text-accent hover:text-ink">
              Browse the whole lobby
            </Link>
          )
        }
      >
        {q ? `Results for "${query.trim()}"` : 'Hot right now'}
      </Heading>
      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-8 gap-2 min-[1700px]:grid-cols-10">
            {Array.from({ length: 16 }, (_, i) => (
              <Skeleton key={i} className="aspect-[134/200] w-full" />
            ))}
          </div>
        ) : failed ? (
          <FailedGames onRetry={onRetry} />
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-line bg-panel">
            <Message
              icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-ink3" aria-hidden />}
              title={`No games match "${query.trim()}"`}
              body="Check the spelling, or search by provider, such as Pragmatic Play."
              action={
                <Button variant="secondary" onClick={onClear}>
                  Clear the search
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-8 gap-2 min-[1700px]:grid-cols-10">
              {shown.map((g, i) => (
                <li key={g.id} className={cn(i >= 16 && 'hidden min-[1700px]:block', more && 'block')}>
                  <GameTile game={g} onPlay={() => onPlay(g)} />
                </li>
              ))}
            </ul>
            {!q && !more && list.length > 16 && (
              <div className="mt-6 flex justify-center">
                <Button variant="secondary" onClick={() => setMore(true)}>
                  Show more games
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
