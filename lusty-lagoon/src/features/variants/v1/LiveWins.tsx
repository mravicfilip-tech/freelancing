import { Pause } from '@phosphor-icons/react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { LIVE_WINS } from '../shared/data';
import { Avatar } from '../../../components/ui/Avatar';
import { Coin, LiveDot, RailArrows, SectionHead, useRail } from './parts';

// Live wins, one flat strip. Each win is a button that opens the game it came from.
export function LiveWins({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const rail = useRail(248 * 3);
  const paused = state === 'error';
  return (
    <section aria-labelledby="v1-wins" className="min-w-0">
      <SectionHead id="v1-wins" title="Live wins" hint={paused ? 'Paused' : 'Happening now'}>
        {!paused && state !== 'loading' && <RailArrows rail={rail} name="live wins" />}
      </SectionHead>
      {paused ? (
        <div role="status" className="mt-3 flex h-[78px] items-center gap-3 rounded-xl border border-line bg-panel px-4">
          <Pause weight="fill" className="h-6 w-6 shrink-0 text-pending" aria-hidden />
          <p className="text-14 text-ink2">
            <span className="font-semibold text-ink">Live wins are paused.</span> The feed lost its connection and reconnects on its own.
          </p>
        </div>
      ) : (
        <div ref={rail.ref} onScroll={rail.update} className="mt-3 flex snap-x gap-2 overflow-x-auto [scrollbar-width:none]">
          {state === 'loading'
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[78px] w-[240px] shrink-0 rounded-xl" />)
            : LIVE_WINS.map((w) => {
                const g = gameById(w.gameId)!;
                const coin = coinById(w.coin);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onPlay(g)}
                    aria-label={`${w.player} won ${formatAmount(w.amount)} ${coin.symbol} on ${g.name}, ${w.ago} ago. Play ${g.name}`}
                    className="flex h-[78px] w-[240px] shrink-0 snap-start items-center gap-3 rounded-xl border border-line bg-panel p-2 pr-3 text-left transition-colors hover:border-field"
                  >
                    <img src={g.image} alt="" loading="lazy" className="h-[62px] w-[46px] shrink-0 rounded-md object-cover" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        {w.avatar ? <img src={w.avatar} alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover" /> : <Avatar initials={w.initials ?? ''} size="sm" className="h-5 w-5 text-12" />}
                        <span className="truncate text-14 font-semibold text-ink">{w.player}</span>
                      </span>
                      <span className="num flex items-center gap-1 font-display text-18 font-bold leading-6 text-win">
                        <Coin id={w.coin} size={18} />
                        {formatAmount(w.amount)} {coin.symbol}
                      </span>
                      <span className="flex items-center gap-2 text-12 text-ink2">
                        <LiveDot />
                        <span className="num">{w.ago} ago</span>
                      </span>
                    </span>
                  </button>
                );
              })}
        </div>
      )}
    </section>
  );
}
