import { useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { formatAmount } from '../../../lib/format';
import { GIVEAWAY } from '../../lobby/data';
import { RACE } from '../shared/data';
import { Coin, KitButton } from '../kit/parts';

// The giveaway, the third thing the eye lands on. A dark band under a strong gold light, so the
// orange Join button and the gold prize both read on it. The chest is the one decorative image in
// the page that breaks out of a panel edge, here the top, as plan D4 allows. The prize is the 40.

export function Giveaway() {
  const [joined, setJoined] = useState(false);
  const entries = Math.floor(RACE.you.wagered / GIVEAWAY.entryEvery);
  return (
    <section aria-labelledby="give-title" className="k-surface relative flex h-[136px] items-center gap-8 rounded-[20px] pl-[212px] pr-[16px] [border-color:rgb(245_159_11/0.3)]">
      {/* The gold light, clipped to the band's corners. The chest sits outside this clip. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{
          backgroundImage:
            'radial-gradient(240px 240px at 108px 62%, rgb(255 190 40 / 0.62), transparent 100%), linear-gradient(90deg, rgb(150 92 14 / 0.42) 0%, rgb(126 78 14 / 0.36) 50%, rgb(245 159 11 / 0.28) 100%)',
        }}
      />
      <img src="/art/lobby/giveaway-chest.webp" alt="" width={168} height={168} className="pointer-events-none absolute -top-[32px] left-[24px] h-[168px] w-[168px]" />
      <div className="relative flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="give-title" className="text-20 font-extrabold uppercase leading-6 tracking-[-0.01em] text-ink">
          Hot streak giveaway
        </h2>
        <p className="max-w-[520px] [text-wrap:balance] text-14 font-semibold text-ink">
          Every ${GIVEAWAY.entryEvery} you play this week is one entry. The draw is {GIVEAWAY.ends}.
        </p>
      </div>
      <div className="relative flex shrink-0 items-center gap-6 rounded-[16px] border border-white/10 bg-[rgb(20_12_35/0.74)] py-4 pl-6 pr-4">
        <div className="flex flex-col gap-1">
          <span className="text-12 font-bold uppercase tracking-[0.08em] text-[rgb(var(--k-muted))]">Prize pool</span>
          <span className="flex items-center gap-3">
            <Coin id={GIVEAWAY.coin} size={32} />
            <span className="num font-display text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-gold">{GIVEAWAY.pool} BTC</span>
          </span>
        </div>
        {joined ? (
          <p role="status" className="flex h-11 w-[200px] items-center justify-center gap-2 rounded-[12px] bg-win/15 text-14 font-bold text-win">
            <CheckCircle weight="fill" className="h-5 w-5" aria-hidden />
            In, {formatAmount(entries, 0)} entries
          </p>
        ) : (
          <KitButton tone="primary" size="md" onClick={() => setJoined(true)} className="h-11 w-[200px]">
            Join the giveaway
          </KitButton>
        )}
      </div>
    </section>
  );
}
