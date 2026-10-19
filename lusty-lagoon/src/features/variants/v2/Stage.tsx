import { WarningCircle } from '@phosphor-icons/react';
import { BrandText } from '../../../components/ui/BrandText';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatPoints } from '../../../lib/format';
import { ONLINE_NOW } from '../shared/data';

// The stage. The sunset scene runs edge to edge, flipped so the sun sits behind the girl and the
// headline lands on the dark rocks. The girl and her two pillars stand on one baseline that falls
// past the stage's bottom edge, level with the bottom of the dock.
function LiveLine({ state }: { state: string | null }) {
  if (state === 'loading') return <Skeleton className="h-8 w-[260px] rounded-full" />;
  if (state === 'error') {
    return (
      <p role="status" className="flex h-8 items-center gap-2 rounded-full bg-page/70 px-3 text-14 text-ink backdrop-blur-md">
        <WarningCircle weight="fill" className="h-5 w-5 text-danger" aria-hidden />
        Live activity is paused, it reconnects on its own
      </p>
    );
  }
  return (
    <p className="flex h-8 items-center gap-2 rounded-full bg-page/70 px-3 text-14 text-ink backdrop-blur-md">
      <span aria-hidden className="h-[8px] w-[8px] shrink-0 rounded-full bg-success" />
      <span className="num font-semibold">{formatPoints(ONLINE_NOW)}</span> players in the lagoon now
    </p>
  );
}

export function Stage({ state, onPlay, onBrowse }: { state: string | null; onPlay: () => void; onBrowse: () => void }) {
  return (
    <section aria-labelledby="stage-title" className="relative h-[560px]">
      <div aria-hidden className="absolute inset-0 overflow-hidden bg-sunken">
        <img src="/art/lobby/hero-sunset.webp" alt="" className="h-full w-full -scale-x-100 object-cover object-[50%_0%]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(var(--ll-page)/0.72)_0,rgb(var(--ll-page)/0.4)_40%,transparent_66%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[140px] bg-[linear-gradient(180deg,transparent,rgb(var(--ll-page)))]" />
      </div>

      <div className="relative mx-auto h-full w-full max-w-[1600px] px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img src="/art/landing/pillar-flowers-left.webp" alt="" className="absolute bottom-0 right-[249px] h-[440px] w-auto max-w-none" />
          <img src="/art/landing/pillar-gems-b.webp" alt="" className="absolute bottom-0 right-[4px] h-[440px] w-auto max-w-none" />
          <img src="/art/landing/girl-lei.webp" alt="" className="absolute bottom-[-56px] right-[72px] h-[520px] w-auto max-w-none [mask-image:linear-gradient(180deg,#000_78%,transparent)]" />
        </div>

        <div className="relative flex h-full flex-col items-start justify-center pb-[80px] pt-[80px]">
          <LiveLine state={state} />
          <h1 id="stage-title" className="mt-4 text-[72px] leading-[76px] tracking-[-0.01em]">
            <BrandText drop={5} rim={2}>
              <span className="block">Where luck</span>
              <span className="block">meets lust</span>
            </BrandText>
          </h1>
          <p className="mt-4 max-w-[420px] text-18 text-ink">Pick up Sugar Rush where you left it, or find something new below.</p>
          <div className="mt-6 flex items-center gap-3">
            <Button size="cta" onClick={onPlay}>
              Play Sugar Rush
            </Button>
            <Button size="cta" variant="secondary" onClick={onBrowse}>
              Browse all games
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
