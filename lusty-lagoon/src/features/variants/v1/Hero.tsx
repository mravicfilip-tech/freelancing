import { Star } from '@phosphor-icons/react';
import { KitButton } from '../kit/parts';
import { DAILY_CHEST, LIVE_WINS, ONLINE_NOW } from '../shared/data';
import { gameById } from '../../../data/games';
import { amountText, CoinChip, CoinIcon, Live, handle } from './ui';

// The hero on a purple burst, after Snegbet's tournament art. Vivid at the top, deep at the bottom,
// rays from behind the woman, who shows whole and as large as the band allows. The one display
// headline on the page, a top win as the prize line, and the orange key.

const TOP = LIVE_WINS[0];

export function Hero({ onPlay }: { onPlay: () => void }) {
  const game = gameById(TOP.gameId)!;
  return (
    <section aria-labelledby="n1-hero-title" className="n1-hero relative isolate h-[440px] overflow-hidden rounded-[20px] [--bx:70%] w1920:h-[520px] w1920:[--bx:60%]">
      <span aria-hidden className="n1-rays pointer-events-none absolute left-[var(--bx)] top-[44%] -z-10 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 w1920:h-[1040px] w1920:w-[1040px]" />
      <span aria-hidden className="n1-mark pointer-events-none absolute right-0 top-0 -z-10 h-full w-1/2" />

      {/* The woman, whole. The art is 1012 square with a clear margin above her head, drawn at most 496. */}
      <img
        src="/art/lobby/hero-girl.webp"
        alt=""
        className="pointer-events-none absolute bottom-0 left-[calc(var(--bx)-212px)] h-[416px] w-[416px] max-w-none select-none w1920:left-[calc(var(--bx)-253px)] w1920:h-[496px] w1920:w-[496px]"
      />
      <span className="absolute bottom-6 left-[var(--bx)] z-10 flex h-8 -translate-x-1/2 items-center gap-[6px] whitespace-nowrap rounded-full bg-[linear-gradient(180deg,#FFE066,#F4C430)] px-3 text-12 font-extrabold uppercase tracking-[0.06em] text-[#2A1A00] shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-2px_0_rgb(150_100_0/0.4)]">
        <Star weight="fill" className="h-4 w-4" aria-hidden />
        <span className="num">{DAILY_CHEST.streak}</span> day streak
      </span>

      {/* From 1920 the top win stands on the burst as Snegbet's win card. Below 1920 it sits by the key. */}
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Top win today, ${handle(TOP.player)} won ${amountText(TOP.coin, TOP.amount)} BTC on ${game.name}. Play it`}
        className="n1-ring group absolute right-12 top-1/2 z-10 hidden w-[264px] -translate-y-1/2 flex-col gap-4 rounded-[20px] border border-white/[0.16] bg-[#14063F]/55 p-4 text-left backdrop-blur-[10px] transition-colors hover:border-white/30 w1920:flex"
      >
        <span className="text-12 font-bold uppercase tracking-[0.08em] text-ink/70">Top win today</span>
        <span className="flex items-center gap-3">
          <span className="h-[80px] w-[60px] shrink-0 overflow-hidden rounded-[10px] ring-1 ring-white/20">
            <img src={game.image} alt="" className="n1-zoom h-full w-full object-cover" />
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center gap-2 text-14 font-bold text-ink">
              <img src={TOP.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
              {handle(TOP.player)}
            </span>
            <span className="num flex items-center gap-2 text-28 font-extrabold leading-[32px] text-gold">
              <CoinIcon id={TOP.coin} size={24} />
              {amountText(TOP.coin, TOP.amount)}
            </span>
            <span className="flex items-center gap-2 text-12 font-semibold text-ink/70">
              <CoinChip id={TOP.coin} className="bg-white/[0.12] text-ink/80" />
              on {game.short ?? game.name}
            </span>
          </span>
        </span>
      </button>

      <div className="relative z-10 flex h-full w-[520px] flex-col justify-center gap-8 px-[40px] w1920:w-[600px] w1920:gap-12 w1920:px-12">
        <div className="flex flex-col items-start gap-6">
          <span className="flex h-8 items-center gap-2 rounded-full border border-white/[0.14] bg-[#12063A]/50 pl-3 pr-1 text-12 font-bold text-ink backdrop-blur-[6px]">
            <Live />
            <span className="num">{ONLINE_NOW.toLocaleString('en-US')}</span> online now
            <span aria-hidden className="ml-1 flex -space-x-2">
              {['peki', 'alice', 'ficko'].map((a) => (
                <img key={a} src={`/art/avatars/${a}.webp`} alt="" className="h-6 w-6 rounded-full border-2 border-[#3A128F] object-cover" />
              ))}
            </span>
          </span>
          <div className="flex flex-col gap-4">
            <h1 id="n1-hero-title" className="font-display text-[56px] font-bold uppercase leading-[56px] tracking-[-0.01em] text-ink">
              Where luck
              <br />
              meets lust.
            </h1>
            <p className="text-16 font-semibold text-ink/80">Spin, win and open a free chest every single day.</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <KitButton tone="primary" size="lg" onClick={onPlay} className="h-[56px] px-8">
            Play {game.short ?? game.name}
          </KitButton>
          <span className="flex h-[56px] items-center gap-3 whitespace-nowrap rounded-[12px] border border-white/[0.14] bg-[#12063A]/45 pl-2 pr-4 backdrop-blur-[6px] w1920:hidden">
            <span className="h-10 w-[30px] shrink-0 overflow-hidden rounded-[6px] ring-1 ring-white/20">
              <img src={game.image} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="flex flex-col">
              <span className="text-12 font-bold uppercase tracking-[0.08em] text-ink/70">Top win today</span>
              <span className="flex items-center gap-2">
                <CoinIcon id={TOP.coin} size={16} />
                <span className="num text-16 font-extrabold text-gold">{amountText(TOP.coin, TOP.amount)} BTC</span>
                <span className="text-12 font-semibold text-ink/70">{handle(TOP.player)}</span>
              </span>
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
