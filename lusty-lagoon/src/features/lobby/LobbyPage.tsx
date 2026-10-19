import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { GameController, MagnifyingGlass, WarningCircle } from '@phosphor-icons/react';
import * as RT from '@radix-ui/react-tabs';
import { Button } from '../../components/ui/Button';
import { BrandText } from '../../components/ui/BrandText';
import { Dialog, DialogContent } from '../../components/ui/Dialog';
import { GameTile } from '../../components/ui/GameTile';
import { Message } from '../../components/ui/Message';
import { Skeleton } from '../../components/ui/Skeleton';
import { Avatar } from '../../components/ui/Avatar';
import { CATEGORIES, GAMES, gameById, type CatalogueGame } from '../../data/games';
import { coinById } from '../../data/wallet';
import { formatAmount, formatUsd } from '../../lib/format';
import { cn } from '../../lib/cn';
import { BETS, EXPLORE_ORDER, FEATURED, GIVEAWAY, RECOMMENDED, TOP_WINNERS, payout, type Bet } from './data';

// The lobby, the Figma Dashboard frame (339:1463) at 1440. Layout, imagery and component shapes
// follow the frame. Only what a review note names changed: flat or one soft tone in place of the
// strong gradients (1), no text glow and no inset tab shadow (2), flat coins and no glow on the
// play buttons (4), buttons without gloss, sunburst or bevel (7). Data that did not add up in the
// Figma is fixed. ?state=loading|error|empty reaches the other states, ?q= filters the grid.

const PAGE = 24;

function useLobbyState() {
  return useMemo(() => new URLSearchParams(window.location.search).get('state'), []);
}

function Coin({ id, size }: { id: Parameters<typeof coinById>[0]; size: number }) {
  const coin = coinById(id);
  return <img src={coin.icon} alt={coin.symbol} width={size} height={size} className="shrink-0 rounded-full ring-1 ring-ink/20" />;
}

function SectionTitle({ id, icon, children }: { id: string; icon: React.ReactNode; children: string }) {
  return (
    <h2 id={id} className="ll-heading flex h-[29px] items-center gap-2">
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">{icon}</span>
      {children}
    </h2>
  );
}

function RoundArrow({ dir, size, label, onClick, disabled, className }: { dir: 'prev' | 'next'; size: 32 | 48; label: string; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn('shrink-0 rounded-full transition-opacity hover:brightness-125 disabled:opacity-50 disabled:hover:brightness-100', className)}
    >
      <img src="/art/lobby/arrow-next.svg" alt="" width={size} height={size} className={dir === 'prev' ? 'rotate-180' : undefined} />
    </button>
  );
}

function GameDialog({ game, onClose }: { game: CatalogueGame | null; onClose: () => void }) {
  const [opened, setOpened] = useState<'play' | 'demo' | null>(null);
  return (
    <Dialog
      open={!!game}
      onOpenChange={(o) => {
        if (!o) {
          setOpened(null);
          onClose();
        }
      }}
    >
      {game && (
        <DialogContent title={game.name} description={game.provider}>
          <div className="flex gap-6">
            <img src={game.image} alt="" className={cn('shrink-0 rounded-lg border border-line object-cover', game.wideOnly ? 'aspect-[3/2] w-1/2' : 'aspect-[134/200] w-1/3')} />
            <dl className="flex flex-1 flex-col gap-3">
              {[
                ['Return to player', `${game.rtp}%`],
                ['Volatility', game.volatility],
                ['Category', CATEGORIES.find((c) => c.value === game.category)?.label ?? ''],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-14 text-ink2">{k}</dt>
                  <dd className="num text-16 text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {opened ? (
            <p role="status" className="rounded-lg border border-line bg-sunken p-4 text-14 text-ink2">
              {game.name} {opened === 'demo' ? 'demo ' : ''}opens on the partner platform. Launching games is not part of this prototype.
            </p>
          ) : null}
          <div className="flex gap-3">
            <Button size="lg" onClick={() => setOpened('play')}>
              Play
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setOpened('demo')}>
              Try the demo
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

// Hero, 698 by 412. The girl and the pillar reach past the card's left edge into the gutter, as in the Figma.
function Hero({ onPlay }: { onPlay: (g: CatalogueGame) => void }) {
  const featured = gameById('sugar-rush')!;
  return (
    <section aria-labelledby="lobby-title" className="relative h-[412px] min-w-0">
      <div
        aria-hidden
        className="absolute inset-0 rounded-[10px] bg-no-repeat [background-image:url(/art/lobby/hero-sunset.webp)] [background-size:max(932px,100%)_auto] [mask-image:linear-gradient(180deg,#000_157px,transparent_360px)]"
      />
      <div aria-hidden className="pointer-events-none absolute -left-8 bottom-0 right-0 top-0 overflow-hidden">
        <img src="/art/lobby/hero-girl.webp" alt="" width={506} height={506} className="absolute left-[-117px] top-[3px] max-w-none" />
      </div>
      <img aria-hidden src="/art/lobby/hero-pillar.webp" alt="" width={301} height={301} className="pointer-events-none absolute left-[-118px] top-[122px] max-w-none" />
      <div className="absolute left-[246px] top-[67px] flex flex-col items-start">
        <p className="flex h-[26px] items-center rounded-full border border-[#7D2905]/30 bg-[#E45176]/[0.57] px-6 text-14 font-medium uppercase tracking-[0.08em] text-[#E1F5FF] backdrop-blur-[6px]">
          Ultra Fun Tropical Casino
        </p>
        <h1 id="lobby-title" className="mt-[11px] text-[61px] leading-[68px] tracking-[-0.01em]">
          <BrandText drop={5} rim={2}>
            <span className="block">Where luck</span>
            <span className="block">meets lust</span>
          </BrandText>
        </h1>
        <Button variant="secondary" size="cta" className="mt-[47px] w-[243px]" onClick={() => onPlay(featured)}>
          Play now
        </Button>
      </div>
    </section>
  );
}

function FeaturedSlot({ onPlay }: { onPlay: (g: CatalogueGame) => void }) {
  const [i, setI] = useState(0);
  const slide = FEATURED[i];
  const game = gameById(slide.gameId)!;
  const step = (d: number) => setI((n) => (n + d + FEATURED.length) % FEATURED.length);
  return (
    <section aria-roledescription="carousel" aria-label="Featured slot" className="relative h-[200px] overflow-hidden rounded-[10px]">
      <button type="button" onClick={() => onPlay(game)} aria-label={`Play ${game.name}, featured slot ${i + 1} of ${FEATURED.length}`} className="absolute inset-0 rounded-[10px]">
        <img
          src={slide.art ?? game.wide ?? game.image}
          alt=""
          className="h-full w-full object-cover [mask-image:linear-gradient(180deg,#000_89px,transparent_200px)]"
        />
      </button>
      <p className="pointer-events-none absolute left-[21px] top-[155px] flex h-[26px] items-center rounded-md border border-[#FEFC8F] bg-[#A36F07]/[0.62] px-3 font-display text-14 font-bold text-ink">
        Featured Slot
      </p>
      <div className="absolute left-[295px] top-[137px] flex gap-[6px]">
        <RoundArrow dir="prev" size={48} label="Previous featured slot" onClick={() => step(-1)} />
        <RoundArrow dir="next" size={48} label="Next featured slot" onClick={() => step(1)} />
      </div>
    </section>
  );
}

function Giveaway() {
  const [open, setOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const coin = coinById(GIVEAWAY.coin);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Hot Streak Giveaway, win a share of ${GIVEAWAY.pool} ${coin.symbol}. See how to enter`}
        className="relative block h-[200px] w-full rounded-[10px] bg-[linear-gradient(119.75deg,rgb(var(--ll-giveaway-a))_15%,rgb(var(--ll-giveaway-b))_99%)] text-left hover:brightness-105"
      >
        <img aria-hidden src="/art/lobby/giveaway-pillar.webp" alt="" width={216} height={216} className="pointer-events-none absolute left-[-85px] top-[-8px] max-w-none" />
        <img
          aria-hidden
          src="/art/lobby/giveaway-chest.webp"
          alt=""
          width={210}
          height={210}
          className="pointer-events-none absolute left-[229px] top-[28px] max-w-none rotate-[6.58deg]"
        />
        <span className="absolute left-[76px] top-[19px] text-28 font-bold leading-[1.2] tracking-[-0.04em] text-[#020B22]/80">
          Hot Streak
          <br />
          Giveaway
        </span>
        <span className="absolute left-[78px] top-[97px] font-display text-14 font-bold capitalize leading-5 tracking-[-0.02em] text-[#222120]/85">Win a share of</span>
        <span className="absolute left-[76px] top-[134px] flex h-9 items-center gap-[6px] rounded-md bg-[#A03615]/[0.64] px-3">
          <Coin id={GIVEAWAY.coin} size={20} />
          <span className="num font-display text-18 font-bold tracking-[-0.02em] text-ink">
            {GIVEAWAY.pool} {coin.symbol}
          </span>
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Hot Streak Giveaway" description={`Win a share of ${GIVEAWAY.pool} ${coin.symbol}. The draw is ${GIVEAWAY.ends}.`}>
          <ul className="flex list-disc flex-col gap-2 pl-[20px] text-16 text-ink2">
            <li>Every ${GIVEAWAY.entryEvery} you play this week is one entry.</li>
            <li>Ten winners share the pool, paid to your wallet in {coin.symbol}.</li>
            <li>Entries count from the moment you join.</li>
          </ul>
          {joined ? (
            <p role="status" className="rounded-lg border border-success/40 bg-sunken p-4 text-16 text-ink">
              You are in. Good luck for {GIVEAWAY.ends}.
            </p>
          ) : (
            <div>
              <Button size="lg" onClick={() => setJoined(true)}>
                Join the giveaway
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Recommended({ loading, onPlay }: { loading: boolean; onPlay: (g: CatalogueGame) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const games = RECOMMENDED.map((id) => gameById(id)!);
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 4);
    setAtEnd(el.scrollLeft + el.clientWidth > el.scrollWidth - 4);
  };
  const move = (d: 1 | -1) => ref.current?.scrollBy({ left: d * 161 * 4, behavior: 'smooth' });
  return (
    <section aria-labelledby="recommended-title" className="min-w-0">
      <div className="flex items-start justify-between pr-[10px]">
        <SectionTitle
          id="recommended-title"
          icon={
            <>
              <img src="/art/lobby/icon-gem-a.svg" alt="" width={21} height={24} />
              <img src="/art/lobby/icon-gem-b.svg" alt="" className="absolute left-[3px] top-0 w-[11px] opacity-60" />
            </>
          }
        >
          Recommended For You
        </SectionTitle>
        <div className="flex gap-[5px]">
          <RoundArrow dir="prev" size={32} label="Previous, Recommended for you" onClick={() => move(-1)} disabled={atStart} />
          <RoundArrow dir="next" size={32} label="Next, Recommended for you" onClick={() => move(1)} disabled={atEnd} />
        </div>
      </div>
      <div ref={ref} onScroll={update} className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none]">
        {loading
          ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[222px] w-[149px] shrink-0" />)
          : games.map((g) => (
              <div key={g.id} className="w-[149px] shrink-0 snap-start">
                <GameTile game={g} onPlay={() => onPlay(g)} />
              </div>
            ))}
      </div>
    </section>
  );
}

function TopWinning({ loading, onPlay }: { loading: boolean; onPlay: (g: CatalogueGame) => void }) {
  return (
    <section aria-labelledby="winners-title" className="min-w-0 pt-[3px]">
      <SectionTitle id="winners-title" icon={<img src="/art/lobby/icon-star.svg" alt="" width={24} height={24} />}>
        Top Winning Games
      </SectionTitle>
      <ul className="mt-[13px] grid grid-cols-2 gap-x-[11px] gap-y-[10px]">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[106px] w-full" />)
          : TOP_WINNERS.map((w) => {
              const g = gameById(w.gameId)!;
              const coin = coinById(w.coin);
              return (
                <li key={w.gameId} className="ll-card relative h-[106px]">
                  <img src={g.image} alt="" className="absolute left-[8px] top-[6px] h-[92px] w-16 rounded-md object-cover" />
                  <p className="absolute left-[87px] right-2 top-[9px] truncate font-display text-16 font-bold leading-5 tracking-[-0.02em] text-ink">{g.short ?? g.name}</p>
                  <p className="absolute left-[87px] top-[33px] flex items-center gap-[6px]">
                    <Coin id={w.coin} size={20} />
                    <span className="num font-display text-14 font-bold tracking-[-0.02em] text-ink">
                      {formatAmount(w.amount, 2)} {coin.symbol}
                    </span>
                  </p>
                  <p className="absolute left-[87px] top-[75px] flex items-center gap-[6px]">
                    <img src={w.avatar} alt="" width={20} height={20} className="rounded-full" />
                    <span className="font-display text-14 font-bold tracking-[-0.02em] text-ink2">{w.player}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => onPlay(g)}
                    aria-label={`Play ${g.name}`}
                    className="absolute left-[165px] top-[71px] rounded-full hover:brightness-110"
                  >
                    <img src="/art/lobby/play-gold.svg" alt="" width={28} height={28} />
                  </button>
                </li>
              );
            })}
      </ul>
    </section>
  );
}

const BET_TABS = [
  { value: 'all', label: 'All', width: 'w-[119px]', pick: (_: Bet) => true },
  { value: 'high', label: 'High wins', width: 'w-[174px]', pick: (b: Bet) => payout(b) >= 250 },
  { value: 'lucky', label: 'Lucky wins', width: 'w-[187px]', pick: (b: Bet) => b.multiplier >= 5 },
  { value: 'mine', label: 'My wagers', width: '', pick: (b: Bet) => !!b.mine },
];

// Column widths from the Figma, after the table's 41px inset, kept in proportion at wider screens.
const COLS = 'grid grid-cols-[248fr_182fr_135fr_178fr_176fr_170fr] pl-[41px]';
const ROWS_SHOWN = 7;

function BetRows({ rows }: { rows: Bet[] }) {
  if (!rows.length) {
    return <Message className="py-12" icon={<GameController weight="fill" className="h-10 w-10 text-ink3" aria-hidden />} title="No wagers here yet" body="Wagers that match this tab show up the moment they land." />;
  }
  const shown = rows.slice(0, ROWS_SHOWN);
  return (
    <ul aria-label="Latest wagers" className={cn('mt-[23px] flex flex-col gap-[19px]', rows.length >= ROWS_SHOWN && '[mask-image:linear-gradient(180deg,#000_calc(100%-100px),transparent)]')}>
      {shown.map((b) => {
        const g = gameById(b.gameId)!;
        const coin = coinById(b.coin);
        const p = payout(b);
        return (
          <li key={b.id} className={cn(COLS, 'h-[48px] items-center text-16 font-medium tracking-[-0.02em]')}>
            <span className="flex items-center gap-4">
              <img src={g.image} alt="" className="h-[48px] w-12 shrink-0 rounded-md object-cover" />
              <span className="line-clamp-2 leading-5 text-ink3">{g.name}</span>
            </span>
            <span className="flex items-center gap-[13px]">
              {b.avatar ? <img src={b.avatar} alt="" width={32} height={32} className="rounded-full" /> : <Avatar initials={b.initials} size="sm" />}
              <span className="truncate text-ink">{b.player}</span>
            </span>
            <span className="num text-ink3">{b.time}</span>
            <span className="flex items-center gap-[14px]">
              <span className="num w-8 text-ink">{formatUsd(b.wager).replace('.00', '')}</span>
              <Coin id={b.coin} size={24} />
              <span className="sr-only">{coin.symbol}</span>
            </span>
            <span className={cn('num uppercase', b.multiplier > 0 ? 'text-gold' : 'text-ink3')}>{b.multiplier.toFixed(2)}x</span>
            <span className={cn('num uppercase', p > 0 ? 'font-semibold text-win' : 'text-ink3')}>{formatUsd(p)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Bets({ state }: { state: string | null }) {
  return (
    <section aria-label="Latest wagers" className="ll-card-quiet relative mt-[19px] h-[607px] overflow-hidden">
      <RT.Root defaultValue="all">
        <RT.List aria-label="Wagers" className="ll-card-quiet flex h-[68px] items-stretch rounded-lg pl-[41px]">
          {BET_TABS.map((t) => (
            <RT.Trigger
              key={t.value}
              value={t.value}
              className={cn('group flex items-center text-left text-14 font-black uppercase tracking-[-0.02em] text-ink outline-none', t.width)}
            >
              <span className="relative rounded px-0.5 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-accent">
                {t.label}
                <span aria-hidden className="absolute -bottom-[23px] -left-[11px] -right-[11px] hidden h-[3px] rounded-full bg-accent group-data-[state=active]:block" />
              </span>
            </RT.Trigger>
          ))}
        </RT.List>
        <div className={cn(COLS, 'mt-[6px] h-[41px] items-center bg-thead/[0.57] text-12 uppercase text-label')} aria-hidden>
          <span>Game</span>
          <span>Player</span>
          <span>Time</span>
          <span>Wager</span>
          <span>Multiplier</span>
          <span>Payout</span>
        </div>
        {BET_TABS.map((t) => (
          <RT.Content key={t.value} value={t.value} className="outline-none">
            {state === 'loading' ? (
              <div className="mt-[23px] flex flex-col gap-[19px] px-[41px]">
                {Array.from({ length: ROWS_SHOWN }, (_, i) => (
                  <Skeleton key={i} className="h-[48px] w-full" />
                ))}
              </div>
            ) : state === 'error' ? (
              <Message
                className="py-12"
                icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
                title="Live wagers are paused"
                body="The feed lost its connection. It reconnects on its own, or reload the page."
              />
            ) : (
              <BetRows rows={BETS.filter(t.pick)} />
            )}
          </RT.Content>
        ))}
      </RT.Root>
    </section>
  );
}

function Explore({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? (state === 'empty' ? 'Starburst' : '');
  const [shown, setShown] = useState(PAGE);
  const [failed, setFailed] = useState(state === 'error');
  const location = useLocation();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    setShown(PAGE);
    if (location.hash === '#explore') ref.current?.scrollIntoView({ block: 'start' });
  }, [query, location.hash]);

  const ordered = useMemo(() => {
    const first = EXPLORE_ORDER.map((id) => gameById(id)!);
    const rest = GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id));
    return [...first, ...rest];
  }, []);
  const q = query.trim().toLowerCase();
  const list = q ? ordered.filter((g) => g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)) : ordered;
  const clear = () => {
    params.delete('q');
    setParams(params);
  };

  return (
    <section ref={ref} id="explore" aria-labelledby="explore-title" className="mt-[25px] scroll-mt-[110px]">
      <div className="flex items-center justify-between gap-4">
        <SectionTitle id="explore-title" icon={<img src="/art/lobby/icon-slot.svg" alt="" width={24} height={20} />}>
          {q ? `Results for "${query.trim()}"` : 'Explore Our Games'}
        </SectionTitle>
        {q && (
          <Button variant="tertiary" onClick={clear}>
            Clear the search
          </Button>
        )}
      </div>

      <div className="mt-[17px]">
        {state === 'loading' ? (
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 16 }, (_, i) => (
              <Skeleton key={i} className="aspect-[134/200] w-full" />
            ))}
          </div>
        ) : failed ? (
          <div className="ll-card">
            <Message
              icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
              title="We could not load the games"
              body="Your balance and wagers are safe. Try again in a moment."
              action={
                <Button variant="secondary" onClick={() => setFailed(false)}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : list.length === 0 ? (
          <div className="ll-card">
            <Message
              icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-ink3" aria-hidden />}
              title={`No games match "${query.trim()}"`}
              body="Check the spelling, or search by provider, such as Pragmatic Play."
              action={
                <Button variant="secondary" onClick={clear}>
                  Clear the search
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-8 gap-2">
              {list.slice(0, shown).map((g) => (
                <li key={g.id}>
                  <GameTile game={g} onPlay={() => onPlay(g)} />
                </li>
              ))}
            </ul>
            {list.length > shown && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <p className="num text-14 text-ink2" aria-live="polite">
                  Showing {shown} of {list.length}
                </p>
                <Button variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
                  Show {Math.min(PAGE, list.length - shown)} more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function LobbyPage() {
  const state = useLobbyState();
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-x-3">
        <Hero onPlay={setOpen} />
        <div className="flex flex-col gap-3">
          <FeaturedSlot onPlay={setOpen} />
          <Giveaway />
        </div>
      </div>
      <div className="mt-[34px] grid grid-cols-[minmax(0,1fr)_420px] gap-x-3">
        <Recommended loading={state === 'loading'} onPlay={setOpen} />
        <TopWinning loading={state === 'loading'} onPlay={setOpen} />
      </div>
      <Bets state={state} />
      <Explore state={state} onPlay={setOpen} />
      <GameDialog game={open} onClose={() => setOpen(null)} />
    </div>
  );
}
