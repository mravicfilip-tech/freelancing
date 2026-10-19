import { CheckCircle, Gift, LockSimple, ShieldStar } from '@phosphor-icons/react';
import { RANKS, shortPoints } from '../../../data/ranks';
import { formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { Head, TierShield } from './parts';
import { NEXT, POINTS, PROGRESS, RANK_INDEX, TIER_ART, TO_NEXT, tierOf } from './games-data';

// The rank road as five tier cards, each coloured by its tier, bronze, silver, gold, platinum and
// diamond. A tier light at the top, a tier edge, the pillar whole on a floor light, the tier name in
// its colour, the points it starts at and what it pays. Your rank is lit and carries the bar.

export function RankRoad() {
  const pct = Math.round(PROGRESS * 100);
  return (
    <section id="rank" aria-labelledby="v3-rank-title" className="flex scroll-mt-[96px] flex-col gap-4">
      <Head id="v3-rank-title" icon={<ShieldStar weight="fill" />} tint="#D9825B" title="Rank road" sub="One EXP for every cent you play. Each rank pays from the day you reach it.">
        <span className="a-row flex h-11 items-center gap-2 rounded-[12px] px-4 text-14 font-bold text-ink">
          <TierShield tier="bronze" size={18} />
          <span className="num">{formatPoints(POINTS)}</span>
          <span className="a-muted font-semibold">EXP</span>
        </span>
      </Head>
      <ol aria-label="Ranks" className="grid grid-cols-5 gap-4">
        {RANKS.map((r, i) => {
          const t = tierOf(r.name);
          const art = TIER_ART[t];
          const current = i === RANK_INDEX;
          const next = i === RANK_INDEX + 1;
          const ahead = i > RANK_INDEX;
          return (
            <li key={r.name} aria-current={current ? 'step' : undefined} className={cn('a-tier a-tier-card relative isolate flex flex-col overflow-hidden rounded-[24px] p-4', `a-tier-${t}`)}>
              <div className="flex items-center justify-between gap-2">
                <TierShield tier={t} size={28} />
                {current ? (
                  <span className="flex h-[28px] items-center gap-1 rounded-[8px] bg-[#3DD68C]/15 px-2 text-12 font-bold text-[#3DD68C]">
                    <CheckCircle weight="fill" className="h-4 w-4" aria-hidden />
                    Your rank
                  </span>
                ) : next ? (
                  <span className="num a-tier-chip flex h-[28px] items-center rounded-[8px] px-2 text-12 font-bold">{shortPoints(TO_NEXT)} to go</span>
                ) : (
                  <span className="a-muted flex h-[28px] w-[28px] items-center justify-center rounded-[8px] bg-white/[0.06]">
                    <LockSimple weight="fill" className="h-4 w-4" aria-label="Locked" />
                  </span>
                )}
              </div>
              <div className="relative mt-2 flex h-[232px] items-end justify-center w1920:h-[264px]">
                <span aria-hidden className="a-tier-floor absolute -bottom-[10px] left-1/2 h-[28px] w-[150px] -translate-x-1/2 rounded-[50%]" />
                <img src={art.pillar} alt="" className={cn('relative h-[216px] w-auto transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] w1920:h-[248px]', ahead && 'opacity-80')} />
              </div>
              <h3 className="a-tier-ink mt-6 font-display text-20 font-bold uppercase leading-[24px] tracking-[0.04em]">{r.name}</h3>
              <p className="num a-muted mt-1 text-14 font-semibold">{r.from === 0 ? 'From your first spin' : `From ${formatPoints(r.from)} EXP`}</p>
              <p className="a-row mt-4 flex items-center justify-between gap-2 rounded-[12px] px-3 py-2" title={r.reward}>
                <span className="flex min-w-0 flex-col">
                  <span className="a-caps truncate">{art.reward[0]}</span>
                  <span className="num text-16 font-bold leading-[20px] text-gold">{art.reward[1]}</span>
                </span>
                <span className="a-tier-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]">
                  <Gift weight="fill" className="h-5 w-5" aria-hidden />
                </span>
              </p>
              {current && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% of the way to ${NEXT.name}`}>
                    <span className="block h-full rounded-full bg-[#D9825B]" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="num text-12 font-bold text-ink">{pct}%</span>
                </div>
              )}
              {!current && <div className="mt-3 h-[16px]" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
