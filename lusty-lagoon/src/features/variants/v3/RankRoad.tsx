import { Check, Lock } from '@phosphor-icons/react';
import { ACCOUNT } from '../../../data/wallet';
import { RANKS, shortPoints } from '../../../data/ranks';
import { formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';

// The signature. A road across the page with the five ranks as milestones. Each milestone is one of
// our pillar cut-outs standing on the road, the pillars climb from Bronze to Diamond. The road is a
// flat accent band filled to the player's points, John's avatar rides at the head of the fill.
// Ranks ahead are dimmed, not hidden. Columns are even, so the fill is a straight line inside the
// segment the player is in.

const PILLARS = [
  { src: '/art/landing/pillar-flowers-left.webp', w: 282, h: 853, height: 190 },
  { src: '/art/landing/pillar-gems-a.webp', w: 267, h: 800, height: 214 },
  { src: '/art/landing/pillar-gems-b.webp', w: 285, h: 800, height: 240 },
  { src: '/art/landing/pillar-flowers-right.webp', w: 282, h: 854, height: 270 },
  { src: '/art/landing/pillar-girl.webp', w: 282, h: 853, height: 300 },
];

const ZONE = 190; // pillar zone above the road, the tallest pillars rise past it into the heading row
const ROAD = 48;

export function RankRoad() {
  const { points } = ACCOUNT.rank;
  const at = RANKS.reduce((n, r, i) => (points >= r.from ? i : n), 0);
  const next = RANKS[at + 1];
  const frac = next ? (points - RANKS[at].from) / (next.from - RANKS[at].from) : 1;
  const pos = ((at + 0.5 + frac) / RANKS.length) * 100;
  const left = next ? next.from - points : 0;

  return (
    <section aria-labelledby="road-title" className="relative rounded-2xl border border-line bg-panel">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[300px] overflow-hidden rounded-t-2xl [mask-image:linear-gradient(180deg,#000_55%,transparent)]">
        <img src="/art/lobby/hero-sunset.webp" alt="" className="h-full w-full -scale-x-100 object-cover object-top opacity-60" />
        <div className="absolute inset-y-0 left-0 w-[520px] [background-image:linear-gradient(90deg,rgb(var(--ll-panel)/0.9),transparent)]" />
      </div>
      <div className="relative z-10 px-6 pb-6 pt-6">
        <h2 id="road-title" className="font-display text-24 font-bold text-ink">
          Rank road
        </h2>
        <p className="mt-1 max-w-[340px] text-14 text-ink">One point for every cent you play. Each rank pays a reward from the day you reach it.</p>
      </div>

      <div className="relative">
        {/* The road. Flat track, flat accent fill. */}
        <div aria-hidden className="absolute inset-x-0 border-y border-line bg-raised" style={{ top: ZONE - 6, height: ROAD }}>
          <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 [background-image:repeating-linear-gradient(90deg,rgb(var(--ll-ink-3)/0.5)_0_14px,transparent_14px_28px)]" />
          <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pos}%` }} />
        </div>

        <ol className="relative grid grid-cols-5" aria-label="Ranks">
          {RANKS.map((r, i) => {
            const p = PILLARS[i];
            const reached = i <= at;
            const isNext = i === at + 1;
            const isHere = i === at;
            return (
              <li key={r.name} className="flex flex-col items-center">
                <div className="flex items-end justify-center" style={{ height: ZONE }}>
                  <img
                    src={p.src}
                    alt=""
                    width={Math.round((p.height * p.w) / p.h)}
                    height={p.height}
                    className={cn('relative z-10 max-w-none', !reached && 'opacity-60')}
                    style={{ height: p.height, width: 'auto', marginBottom: -2 }}
                  />
                </div>
                <div className="relative z-20 flex items-center justify-center" style={{ height: ROAD, marginTop: -6 }}>
                  <span
                    aria-hidden
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2',
                      reached ? 'border-page bg-page text-accent' : isNext ? 'border-accent bg-panel text-accent' : 'border-field bg-panel text-ink3',
                    )}
                  >
                    {reached ? <Check weight="bold" className="h-3 w-3" /> : <Lock weight="fill" className="h-[10px] w-[10px]" />}
                  </span>
                </div>
                <div className="flex w-full flex-col items-center px-4 pb-6 pt-4 text-center">
                  <h3 className={cn('font-display text-24 font-bold leading-8', reached ? 'text-ink' : 'text-ink2')}>{r.name}</h3>
                  <p className="num mt-1 text-16 font-semibold text-ink">{r.from ? `${formatPoints(r.from)} points` : 'From the start'}</p>
                  <p
                    className={cn(
                      'mt-2 flex h-6 items-center rounded-full px-3 text-12 font-semibold',
                      isHere && 'border border-accent text-accent',
                      isNext && 'bg-raised text-label',
                      !isHere && !isNext && 'text-transparent',
                    )}
                    aria-hidden={!isHere && !isNext}
                  >
                    {isHere ? 'Your rank' : isNext ? `${formatPoints(left)} to go` : 'Locked'}
                  </p>
                  <p className="mt-3 max-w-[210px] text-14 text-ink2">{r.reward}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* You are here, at the head of the fill. */}
        <div className="pointer-events-none absolute z-30 flex items-center" style={{ left: `${pos}%`, top: ZONE - 6, height: ROAD, transform: 'translateX(-50%)' }}>
          <span className="absolute right-full mr-3 whitespace-nowrap text-14 font-bold text-page">You are here</span>
          <img
            src="/art/avatars/john.webp"
            alt={`${ACCOUNT.name}, ${shortPoints(points)} points`}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full border-2 border-page object-cover"
          />
        </div>
      </div>
    </section>
  );
}
