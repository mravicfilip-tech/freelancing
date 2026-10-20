import type { ReactNode } from 'react';
import { ArrowRight, Check, Play } from '@phosphor-icons/react';
import { GIVEAWAY } from '../../lobby/data';
import { ONLINE_NOW, RACE, useCountdown } from '../shared/data';
import { ACCOUNT } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { KitButton } from '../kit/parts';

// The Mascot stage hero, round 7, plan lines G and H. The lagoon cove runs edge to edge, graded into
// the brand purple, and the art takes the right 55 percent at every width. The woman stands in the cove
// on the art recipe (briefs/round-7/art-recipe.md), back to front the scene, the sun and the haze, the
// contact shadows, her cut out graded toward the scene, a light wrap masked by her own alpha, the chest
// on the sand in front of her legs, a flower pillar in front of her edge, then the vignette. Left, the
// copy, then one glass bar that holds the prize pool, the live draw and the entries with the key at its
// end, after Snegbet's tournament block. Sizes live in v2.css under Stage, per width.

export const DRAW_IN_SECONDS = 2 * 86400 + 14 * 3600 + 8 * 60 + 22;
export const ENTRIES = Math.floor(RACE.you.wagered / GIVEAWAY.entryEvery);

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <span className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--m2-ink3))]">{label}</span>
      {children}
    </div>
  );
}

/** A cut out with its light wrap, one box so the wrap's alpha mask always matches her pixels. */
function Lit({ src, w, h, className, wrap }: { src: string; w: number; h: number; className: string; wrap: string }) {
  return (
    <span aria-hidden className={className} style={{ aspectRatio: `${w} / ${h}` }}>
      <img src={src} alt="" width={w} height={h} className="m2-st-cut absolute inset-0 h-full w-full" />
      <span className={wrap} style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }} />
    </span>
  );
}

export function Hero({ joined, onJoin, onPlay, onRules }: { joined: boolean; onJoin: () => void; onPlay: () => void; onRules: () => void }) {
  const { d, h, m, s, pad } = useCountdown(DRAW_IN_SECONDS);
  return (
    <section aria-labelledby="m2-hero-title" className="relative">
      <div className="flex h-[56px] flex-col justify-center">
        <p className="text-20 font-extrabold leading-6 tracking-[-0.01em] text-ink">Welcome back, {ACCOUNT.name.split(' ')[0]}</p>
        <p className="flex items-center gap-2 text-14 font-semibold text-[rgb(var(--m2-ink2))]">
          <span aria-hidden className="k-live" />
          <span>
            <span className="num">{formatAmount(ONLINE_NOW, 0)}</span> players online, you are <span className="num">{formatAmount(ACCOUNT.rank.nextAt - ACCOUNT.rank.points, 0)}</span> points from {ACCOUNT.rank.next}
          </span>
        </p>
      </div>
      <div className="m2-stage relative mt-6 overflow-hidden rounded-[28px]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* 1, the scene. The cove turned so its beach lies under her and its rocks under the copy. */}
          <img src="/art/landing/hero-beach.webp" alt="" className="m2-st-scene absolute inset-0 h-full w-full object-cover" />
          <span className="m2-st-grade absolute inset-0" />
          {/* 2, the sun low on the water behind her, the brand purple from above, a pillar back in the haze. */}
          <span className="m2-st-sun absolute inset-0" />
          <img src="/art/landing/pillar-flowers-left.webp" alt="" width={282} height={853} className="m2-st-back absolute" />
          <span className="m2-st-haze-back absolute inset-x-0 bottom-0" />
          {/* 3, contact shadows on the sand, hers wide and soft, the chest's tight under its feet. */}
          <span className="m2-st-shadow-her absolute" />
          {/* 4 and 5, her, graded toward the scene, lit by its sun through a wrap masked by her alpha. */}
          <Lit src="/art/landing/girl-floral.webp" w={644} h={1100} className="m2-st-her m2-rise absolute" wrap="m2-st-wrap m2-st-wrap-her absolute inset-0" />
          <span className="m2-st-shadow-chest absolute" />
          <Lit src="/art/lobby/giveaway-chest.webp" w={420} h={420} className="m2-st-chest m2-rise m2-rise-late absolute" wrap="m2-st-wrap m2-st-wrap-chest absolute inset-0" />
          {/* 6, the foreground. A flower pillar in front of her edge and the haze over the sand. */}
          <img src="/art/landing/pillar-flowers-right.webp" alt="" width={282} height={854} className="m2-st-front absolute" />
          {/* The cove's own palm fronds, keyed out of the same picture and pulled forward, top right. */}
          <span className="m2-st-palm absolute right-0 top-0 overflow-hidden">
            <img src="/art/landing/hero-beach.webp" alt="" className="absolute right-0 top-0 h-auto max-w-none" />
          </span>
          <span className="m2-st-haze absolute inset-x-0 bottom-0" />
          {/* 7, the vignette, so the cove melts into the stage edge and the copy side stays calm. */}
          <span className="m2-st-vignette absolute inset-0" />
        </div>
        <div className="m2-st-copy relative z-20 flex h-full flex-col justify-center">
          <p className="flex items-center gap-2 text-12 font-bold uppercase tracking-[0.12em] text-[#FFB27A]">
            <span aria-hidden className="k-live" />
            Hot streak giveaway
          </p>
          <h1 id="m2-hero-title" className="mt-4 whitespace-nowrap font-display text-[64px] font-bold leading-[68px] tracking-[-0.02em] text-ink">
            Ride the hot streak
          </h1>
          <p className="mt-3 max-w-[440px] text-16 text-[rgb(var(--m2-ink2))]">
            Ten players split <span className="num font-semibold text-ink">{GIVEAWAY.pool} BTC</span> on {GIVEAWAY.ends}. Every ${GIVEAWAY.entryEvery} you play this week is one entry.
          </p>
          {/* One glass bar, the three numbers and the key read as a single unit. */}
          <div className="m2-glass mt-8 flex h-[72px] w-max items-center gap-4 rounded-full py-2 pl-6 pr-2 w1920:gap-6 w1920:pl-8">
            <Stat label="Prize pool">
              <span className="num text-20 font-bold leading-6 text-ink">{GIVEAWAY.pool} BTC</span>
            </Stat>
            <span aria-hidden className="h-8 w-[1px] shrink-0 bg-white/[0.12]" />
            <Stat label="Draw in">
              <span className="num text-20 font-bold leading-6 text-ink" aria-label={`${d} days ${h} hours ${m} minutes`}>
                {d}d {pad(h)}:{pad(m)}:{pad(s)}
              </span>
            </Stat>
            <span aria-hidden className="h-8 w-[1px] shrink-0 bg-white/[0.12]" />
            <Stat label={joined ? 'Your entries' : 'Entries waiting'}>
              <span className="flex items-center gap-2">
                <span className="num text-20 font-bold leading-6 text-ink">{ENTRIES}</span>
                {joined && (
                  <span role="status" className="flex h-5 items-center gap-1 rounded-full bg-[#3DD68C]/15 px-2 text-12 font-bold text-[#5FF0A0]">
                    <Check weight="bold" className="h-[12px] w-[12px]" aria-hidden />
                    You are in
                  </span>
                )}
              </span>
            </Stat>
            {joined ? (
              <KitButton tone="primary" shape="pill" size="lg" onClick={onPlay} className="ml-2 h-[56px] px-6 w1920:px-8">
                <Play weight="fill" className="h-5 w-5" aria-hidden />
                Play for more entries
              </KitButton>
            ) : (
              <KitButton tone="primary" shape="pill" size="lg" onClick={onJoin} className="ml-2 h-[56px] px-6 w1920:px-8">
                Join the giveaway
              </KitButton>
            )}
          </div>
          <button
            type="button"
            onClick={onRules}
            className="m2-link group mt-4 flex h-6 w-max items-center gap-2 rounded-full text-16 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#140b22]"
          >
            How it works
            <ArrowRight weight="bold" className="m2-link-arrow h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
