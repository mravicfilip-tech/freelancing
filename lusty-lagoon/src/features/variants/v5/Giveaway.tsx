import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { formatAmount } from '../../../lib/format';
import { GIVEAWAY } from '../../lobby/data';
import { RACE } from '../shared/data';
import { Coin, KitButton } from '../kit/parts';

// The giveaway, compact. The only place on the page that carries the chest, which sits on the
// strip's left edge and breaks out of its top.

export function Giveaway() {
  const [joined, setJoined] = useState(false);
  const entries = Math.floor(RACE.you.wagered / GIVEAWAY.entryEvery);
  return (
    <section aria-labelledby="give-title" className="relative flex h-[80px] items-center gap-6 rounded-[20px] bg-[rgb(var(--k-panel))] pl-[132px] pr-4">
      <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute -top-6 left-4 w-[104px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 id="give-title" className="font-display text-20 font-bold uppercase leading-6 text-ink">
          Hot streak giveaway
        </h2>
        <p className="truncate text-14 font-semibold text-[rgb(var(--k-muted))]">
          Every ${GIVEAWAY.entryEvery} you play this week is one entry. The draw is {GIVEAWAY.ends}.
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="text-12 font-semibold text-[rgb(var(--k-dim))]">Prize pool</span>
        <span className="flex items-center gap-2">
          <Coin id={GIVEAWAY.coin} size={22} />
          <span className="num font-display text-24 font-bold leading-7 text-gold">{GIVEAWAY.pool} BTC</span>
        </span>
      </div>
      <span aria-hidden className="h-10 w-px bg-ink/10" />
      {joined ? (
        <p role="status" className="flex h-11 w-[188px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-win/10 text-14 font-bold text-win">
          <CheckCircle weight="fill" className="h-5 w-5" aria-hidden />
          In, {formatAmount(entries, 0)} entries
        </p>
      ) : (
        <KitButton tone="purple" size="md" onClick={() => setJoined(true)} className="h-11 w-[188px] shrink-0">
          Join the giveaway
        </KitButton>
      )}
    </section>
  );
}
