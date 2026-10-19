import { Button } from '../../../components/ui/Button';
import { BrandText } from '../../../components/ui/BrandText';
import { gameById, type CatalogueGame } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { coinById } from '../../../data/wallet';
import { LIVE_WINS, ONLINE_NOW } from '../shared/data';
import { Coin, LiveDot, scrollToId } from './parts';

// The sunset scene fills the panel and the girl stands on its bottom edge, her head and the pillar
// reaching past the top. A flat dark tone over the scene keeps the headline readable.
const FACES = ['peki', 'ficko', 'alice', 'goodie', 'niksa'];

export function Hero({ onPlay }: { onPlay: (g: CatalogueGame) => void }) {
  const featured = gameById('sugar-rush')!;
  const win = LIVE_WINS[1];
  const winGame = gameById(win.gameId)!;
  return (
    <section aria-labelledby="v1-title" className="relative mt-16 h-[304px] min-w-0">
      <div aria-hidden className="absolute inset-0 overflow-hidden rounded-2xl border border-line">
        <img src="/art/lobby/hero-sunset.webp" alt="" className="h-full w-full object-cover object-[50%_42%]" />
        <div className="absolute inset-0 bg-page/35" />
      </div>
      <img
        aria-hidden
        src="/art/landing/girl-lei.webp"
        alt=""
        width={216}
        height={446}
        className="pointer-events-none absolute bottom-0 left-4 h-[360px] w-auto max-w-none"
      />

      <div className="absolute inset-y-0 left-[216px] flex flex-col justify-center">
        <p className="flex items-center gap-3 text-14 font-medium text-ink">
          <span className="flex -space-x-2">
            {FACES.map((f) => (
              <img key={f} src={`/art/avatars/${f}.webp`} alt="" width={28} height={28} className="h-[28px] w-[28px] rounded-full border-2 border-page object-cover" />
            ))}
          </span>
          <span className="flex items-center gap-2">
            <LiveDot />
            <span className="num">{ONLINE_NOW.toLocaleString('en-US')}</span> players in the lagoon
          </span>
        </p>
        <h1 id="v1-title" className="mt-3 text-48 leading-[56px] tracking-[-0.01em]">
          <BrandText drop={4} rim={2}>
            <span className="block">Where luck</span>
            <span className="block">meets lust</span>
          </BrandText>
        </h1>
        <div className="mt-6 flex items-center gap-3">
          <Button size="lg" variant="secondary" onClick={() => onPlay(featured)}>
            Play Sugar Rush
          </Button>
          <Button size="lg" variant="quiet" className="border border-ink/50 bg-page/50 text-ink hover:bg-page/70" onClick={() => scrollToId('v1-games')}>
            Browse all games
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onPlay(winGame)}
        aria-label={`${win.player} won ${formatAmount(win.amount)} ${coinById(win.coin).symbol} on ${winGame.name}. Play ${winGame.name}`}
        className="absolute bottom-4 right-4 flex w-[212px] items-center gap-3 rounded-xl border border-line bg-page/85 p-3 text-left hover:border-field"
      >
        <img src={winGame.image} alt="" className="h-[64px] w-[48px] shrink-0 rounded-md object-cover" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-12 font-medium text-ink2">Biggest win this hour</span>
          <span className="truncate text-14 font-semibold text-ink">{win.player}</span>
          <span className="num flex items-center gap-1 font-display text-18 font-bold text-win">
            <Coin id={win.coin} size={18} />
            {formatAmount(win.amount, 0)}
          </span>
        </span>
      </button>
    </section>
  );
}
