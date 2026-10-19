import { WarningCircle } from '@phosphor-icons/react';
import { gameById, type CatalogueGame } from '../../../data/games';
import { coinById } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Coin } from '../kit/parts';
import { LIVE_WINS } from '../shared/data';
import { handle } from './shared';

// Grimdrop's revenue strip, under the stage. One panel of rounded square covers, the winner under
// each and the amount in a boxed chip with its coin. Every cover opens its game.

export function WinsStrip({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  return (
    <section aria-label="Live wins" className="relative rounded-[20px] border border-ink/[0.06] bg-[rgb(var(--k-panel))] px-4 py-3">
      {state === 'error' ? (
        <p role="status" className="flex h-[118px] items-center justify-center gap-3 text-16 font-semibold text-ink">
          <WarningCircle weight="fill" className="h-6 w-6 text-danger" aria-hidden />
          Live wins are paused. The feed reconnects on its own.
        </p>
      ) : (
        <ul className="k-no-scrollbar flex justify-between gap-2 overflow-x-auto [mask-image:linear-gradient(90deg,#000_92%,transparent)] w1920:[mask-image:none]">
          {state === 'loading'
            ? Array.from({ length: 12 }, (_, i) => (
                <li key={i} className="flex w-[80px] shrink-0 flex-col items-center gap-2">
                  <Skeleton className="h-[64px] w-[64px] rounded-[16px]" />
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-[28px] w-[72px] rounded-[8px]" />
                </li>
              ))
            : LIVE_WINS.map((w) => {
                const g = gameById(w.gameId)!;
                const c = coinById(w.coin);
                const digits = c.decimals > 2 && w.amount < 100 ? 2 : w.amount >= 1000 ? 0 : 2;
                return (
                  <li key={w.id} className="w-[84px] shrink-0">
                    <button
                      type="button"
                      onClick={() => onPlay(g)}
                      aria-label={`${w.player} won ${formatAmount(w.amount, digits)} ${c.symbol} on ${g.name}, play it`}
                      className="group flex w-full flex-col items-center gap-2 rounded-[14px] text-center outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
                    >
                      <img src={g.image} alt="" className="h-[64px] w-[64px] rounded-[16px] object-cover object-top ring-2 ring-transparent transition group-hover:ring-[#B47CFF]" />
                      <span className="w-full truncate text-12 font-bold uppercase tracking-[0.04em] text-[rgb(var(--k-muted))]">{handle(w.player).slice(1)}</span>
                      <span className="num -mt-1 inline-flex h-[28px] items-center gap-[6px] rounded-[8px] border border-gold/40 bg-gold/10 px-2 text-14 font-bold text-ink">
                        <Coin id={w.coin} size={14} />
                        {formatAmount(w.amount, digits)}
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
