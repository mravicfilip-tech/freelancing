import { Play } from '@phosphor-icons/react';
import { KitButton } from '../kit/parts';
import { ONLINE_NOW } from '../shared/data';

// The stage, Grimdrop's wide hero across the full content width, built from our sunset. A heavy
// two line headline with the second line in gold, one purple Play now, and the girl cut out large
// on the right, framed by two pillars, her head breaking past the stage's top edge.

const FACES = ['peki', 'alice', 'ficko', 'goodie'];

export function Stage({ onPlay }: { onPlay: () => void }) {
  return (
    <section aria-labelledby="stage-title" className="relative h-[312px]">
      <div aria-hidden className="absolute inset-0 overflow-hidden rounded-[24px] bg-sunken ring-1 ring-inset ring-ink/10">
        <img src="/art/lobby/hero-sunset.webp" alt="" className="h-full w-full -scale-x-100 object-cover object-[50%_40%]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(20_12_35/0.85)_0%,rgb(20_12_35/0.55)_36%,rgb(20_12_35/0)_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[120px] bg-[linear-gradient(180deg,transparent,rgb(20_12_35/0.55))]" />
        <img src="/art/landing/pillar-flowers-left.webp" alt="" className="absolute bottom-[-40px] right-[300px] h-[310px] w-auto max-w-none" />
        <img src="/art/landing/pillar-flowers-right.webp" alt="" className="absolute bottom-[-40px] right-[-12px] h-[310px] w-auto max-w-none" />
      </div>

      {/* The girl stands in her own layer, clipped at the stage's bottom edge only, so her head breaks out above. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 top-[-40px] [clip-path:inset(0_0_0_0_round_0_0_24px_24px)]">
        <img src="/art/landing/girl-lei.webp" alt="" className="absolute right-[96px] top-0 h-[520px] w-auto max-w-none" />
      </div>

      <div className="relative flex h-full max-w-[560px] flex-col justify-center gap-4 pl-12">
        <h1 id="stage-title" className="font-display text-[64px] font-bold uppercase leading-[60px] tracking-[-0.01em] text-ink">
          <span className="block">Where luck</span>
          <span className="block text-gold">meets lust</span>
        </h1>
        <p className="max-w-[400px] text-18 font-semibold leading-[26px] text-ink/90">Spin, win and open a free chest every day. The streak pays more each day.</p>
        <div className="flex items-center gap-6">
          <KitButton tone="purple" size="lg" onClick={onPlay} className="h-[56px] rounded-[14px] px-12 font-display text-18 uppercase">
            <Play weight="fill" className="h-5 w-5" aria-hidden />
            Play now
          </KitButton>
          <span className="flex items-center gap-3">
            <span aria-hidden className="flex -space-x-2">
              {FACES.map((f) => (
                <img key={f} src={`/art/avatars/${f}.webp`} alt="" className="h-9 w-9 rounded-[10px] border-2 border-[#1d1233] object-cover" />
              ))}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="num text-16 font-bold text-ink">{ONLINE_NOW.toLocaleString('en-US')}</span>
              <span className="text-14 font-semibold text-ink/80">players online</span>
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
