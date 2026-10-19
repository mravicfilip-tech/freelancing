import { Check, LockSimple, Trophy } from '@phosphor-icons/react';
import { RANKS, shortPoints } from '../../../data/ranks';
import { formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { SectionHead } from '../kit/parts';
import { POINTS, PROGRESS, RANK_ART, RANK_INDEX, REWARD_SHORT, TO_NEXT } from './games-data';

// The signature. Five pillar cut-outs stand on one road, each taller than the last, and break out
// of the panel's top edge. The road is a flat fill to John's 550,000 points with his marker on it.
// Under the road each rank is a card in Cybet's level card execution, with its reward. Ranks ahead
// are dimmed, never hidden.

const GAP = 12;
/** The x of a point on the road, as a CSS length, where 0 is Bronze's centre and 4 Diamond's. */
const at = (pos: number) => `calc((100% - ${GAP * 4}px) / 5 * ${pos + 0.5} + ${GAP * pos}px)`;

export function RankRoad() {
  const you = RANK_INDEX + PROGRESS;
  return (
    <section id="rank" aria-labelledby="v3-rank-title" className="flex scroll-mt-[100px] flex-col gap-4">
      <SectionHead id="v3-rank-title" icon={<Trophy weight="fill" className="text-[#F5B800]" />} title="Rank road" sub="One point for every cent you play. Each rank pays from the day you reach it." />
      <div className="relative mt-6">
        {/* One card per rank behind the stage, road and details. The pillars rise out of its top edge. */}
        <div aria-hidden className="absolute inset-0 grid grid-cols-5" style={{ columnGap: GAP }}>
          {RANKS.map((r, i) => {
            const art = RANK_ART[r.name];
            const current = i === RANK_INDEX;
            const ahead = i > RANK_INDEX;
            return (
              <span
                key={r.name}
                className="mt-[56px] rounded-[20px] border"
                style={{
                  borderColor: current ? `${art.hue}AA` : 'rgb(255 255 255 / 0.05)',
                  background: `radial-gradient(90% 55% at 50% 22%, ${art.hue}${ahead ? '30' : '5C'}, transparent 70%), linear-gradient(180deg, rgb(var(--k-item)) 0%, rgb(var(--k-panel)) 100%)`,
                }}
              />
            );
          })}
        </div>
        {/* Stage. Pillars stand on the road and rise out of the cards. */}
        <div className="grid grid-cols-5" style={{ columnGap: GAP }}>
          {RANKS.map((r, i) => {
            const art = RANK_ART[r.name];
            const ahead = i > RANK_INDEX;
            return (
              <div key={r.name} className="relative flex h-[172px] items-end justify-center">
                <span aria-hidden className="absolute -bottom-[10px] left-1/2 h-[24px] w-[120px] -translate-x-1/2 rounded-[50%]" style={{ background: `radial-gradient(closest-side, ${art.hue}${ahead ? '40' : '80'}, transparent)` }} />
                <img
                  src={art.pillar}
                  alt=""
                  className={cn('relative -mb-[6px] w-auto', ahead && 'opacity-60 saturate-[0.6]')}
                  style={{ height: art.height }}
                />
              </div>
            );
          })}
        </div>

        {/* Road. */}
        <div className="relative h-[72px]" aria-hidden>
          <span className="absolute top-[8px] h-[14px] rounded-full bg-[#0E0819] ring-1 ring-ink/10" style={{ left: at(0), width: `calc(${at(4)} - ${at(0)})` }} />
          <span className="absolute top-[8px] h-[14px] rounded-full bg-[#8D3BF0]" style={{ left: at(0), width: `calc(${at(you)} - ${at(0)})` }} />
          {RANKS.map((r, i) => {
            const done = i <= RANK_INDEX;
            return (
              <span
                key={r.name}
                className={cn(
                  'absolute top-[1px] flex h-[28px] w-[28px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-[rgb(var(--k-panel))]',
                  done ? 'bg-[#8D3BF0] text-ink' : 'bg-[rgb(var(--k-item-hover))] text-[rgb(var(--k-muted))]',
                )}
                style={{ left: at(i) }}
              >
                {done ? <Check weight="bold" className="h-[14px] w-[14px]" /> : <LockSimple weight="fill" className="h-[12px] w-[12px]" />}
              </span>
            );
          })}
          <span className="absolute top-[6px] h-[18px] w-[18px] -translate-x-1/2 rounded-full border-[4px] border-[#8D3BF0] bg-ink" style={{ left: at(you) }} />
          <span className="absolute top-[30px] flex -translate-x-1/2 flex-col items-center" style={{ left: at(you) }}>
            <span className="block w-0 border-x-[6px] border-b-[6px] border-x-transparent border-b-ink" />
            <span className="flex h-[30px] items-center gap-2 whitespace-nowrap rounded-full bg-ink py-0.5 pl-0.5 pr-3 text-12 font-bold text-[#3B1A7A]">
              <img src="/art/avatars/john-sm.webp" alt="" className="h-[26px] w-[26px] rounded-full object-cover" />
              <span className="num">You are here, {shortPoints(POINTS)}</span>
            </span>
          </span>
        </div>

        {/* Rank cards. */}
        <ol aria-label="Ranks" className="grid grid-cols-5" style={{ columnGap: GAP }}>
          {RANKS.map((r, i) => {
            const art = RANK_ART[r.name];
            const current = i === RANK_INDEX;
            const next = i === RANK_INDEX + 1;
            const ahead = i > RANK_INDEX;
            return (
              <li
                key={r.name}
                aria-current={current ? 'step' : undefined}
                className="relative flex flex-col gap-2 px-4 pb-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-24 font-bold uppercase leading-[26px]" style={{ color: ahead ? 'rgb(var(--k-muted))' : art.ink }}>
                    {r.name}
                  </h3>
                  {current ? (
                    <span className="flex h-6 items-center rounded-[8px] bg-[#3DDC84]/15 px-2 text-12 font-bold text-[#5FF0A0]">Your rank</span>
                  ) : next ? (
                    <span className="num flex h-6 items-center rounded-[8px] bg-[#8D3BF0]/30 px-2 text-12 font-bold text-[#D9C4FF]">{shortPoints(TO_NEXT)} to go</span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-black/25 text-[rgb(var(--k-dim))]">
                      <LockSimple weight="fill" className="h-[14px] w-[14px]" aria-label="Locked" />
                    </span>
                  )}
                </div>
                <p className="num text-14 font-semibold text-[rgb(var(--k-muted))]">{r.from === 0 ? 'From your first spin' : `${formatPoints(r.from)} points`}</p>
                <p className={cn('mt-1 flex h-10 items-center rounded-[10px] px-3 text-14 font-bold', ahead ? 'bg-black/20 text-[rgb(var(--k-muted))]' : 'bg-black/25 text-ink')} title={r.reward}>
                  <span className="truncate">{REWARD_SHORT[r.name]}</span>
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
