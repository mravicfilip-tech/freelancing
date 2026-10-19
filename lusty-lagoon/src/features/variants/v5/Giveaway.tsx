import { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent } from '../../../components/ui/Dialog';
import { coinById } from '../../../data/wallet';
import { GIVEAWAY } from '../../lobby/data';
import { Coin } from './parts';

// Compact. The chest is the only prop art on the page below the balance card.
export function Giveaway() {
  const [open, setOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const coin = coinById(GIVEAWAY.coin);
  return (
    <section aria-labelledby="v5-giveaway" className="relative mt-8 flex h-[88px] items-center rounded-2xl border border-line bg-sunken pl-[172px] pr-6">
      <img src="/art/lobby/giveaway-chest.webp" alt="" aria-hidden width={136} height={136} className="pointer-events-none absolute -top-[22px] left-4 h-[136px] w-[136px] max-w-none" />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 id="v5-giveaway" className="font-display text-20 font-semibold leading-6 text-ink">
          Hot Streak giveaway
        </h2>
        <p className="text-14 text-ink2">
          Every ${GIVEAWAY.entryEvery} you play is one entry. The draw is {GIVEAWAY.ends}.
        </p>
      </div>
      <p className="mr-8 flex items-center gap-3">
        <span className="text-14 text-ink2">Win a share of</span>
        <span className="num flex items-center gap-2 font-display text-24 font-semibold text-gold">
          <Coin id={GIVEAWAY.coin} size={24} />
          {GIVEAWAY.pool} {coin.symbol}
        </span>
      </p>
      {joined ? (
        <p role="status" className="flex h-10 items-center gap-2 rounded-lg border border-success/50 px-4 text-14 font-semibold text-success">
          <Check weight="bold" className="h-4 w-4" aria-hidden />
          You are in
        </p>
      ) : (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Join the giveaway
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Hot Streak giveaway" description={`Win a share of ${GIVEAWAY.pool} ${coin.symbol}. The draw is ${GIVEAWAY.ends}.`}>
          <ul className="flex list-disc flex-col gap-2 pl-[20px] text-16 text-ink2">
            <li>Every ${GIVEAWAY.entryEvery} you play this week is one entry.</li>
            <li>Ten winners share the pool, paid to your wallet in {coin.symbol}.</li>
            <li>Entries count from the moment you join.</li>
          </ul>
          <div>
            <Button
              size="lg"
              onClick={() => {
                setJoined(true);
                setOpen(false);
              }}
            >
              Join the giveaway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
