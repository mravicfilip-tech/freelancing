import { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { coinById } from '../../../data/wallet';
import { GIVEAWAY } from '../../lobby/data';

// The giveaway band. A flat tonal band with the chest standing upright, breaking out of its top edge.
export function GiveawayBand() {
  const [joined, setJoined] = useState(false);
  const coin = coinById(GIVEAWAY.coin);
  return (
    <section aria-labelledby="giveaway-title" className="relative mt-24">
      <div className="relative flex h-[168px] items-center gap-12 rounded-2xl border border-tonal-line bg-tonal pl-[260px] pr-8">
        <img aria-hidden src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute -top-12 left-6 h-[230px] w-[230px] max-w-none" />
        <div className="min-w-0 flex-1">
          <h2 id="giveaway-title" className="font-display text-28 font-bold leading-[1.2] text-ink">
            Hot Streak Giveaway
          </h2>
          <p className="mt-2 max-w-[360px] text-14 text-ink2">
            Every ${GIVEAWAY.entryEvery} you play this week is one entry. Ten winners share the pool, the draw is {GIVEAWAY.ends}.
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-14 text-ink2">Win a share of</p>
          <p className="mt-1 flex items-center gap-3">
            <img src={coin.icon} alt="" width={36} height={36} className="rounded-full" />
            <span className="num font-display text-40 font-bold leading-none text-ink">
              {GIVEAWAY.pool} {coin.symbol}
            </span>
          </p>
        </div>
        <div className="flex w-[200px] shrink-0 justify-end">
          {joined ? (
            <p role="status" className="flex h-11 items-center gap-2 rounded-lg border border-success/60 bg-page/50 px-4 text-16 font-semibold text-ink">
              <Check weight="bold" className="h-5 w-5 text-success" aria-hidden />
              You are in
            </p>
          ) : (
            <Button size="lg" onClick={() => setJoined(true)}>
              Join the giveaway
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
