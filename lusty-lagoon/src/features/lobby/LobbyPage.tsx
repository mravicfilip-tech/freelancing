import { useMemo, useState } from 'react';
import * as RG from '@radix-ui/react-radio-group';
import { CaretLeft, CaretRight, Clock, GameController, MagnifyingGlass, Trophy, WarningCircle } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogContent } from '../../components/ui/Dialog';
import { Field } from '../../components/ui/Field';
import { GameTile } from '../../components/ui/GameTile';
import { Message } from '../../components/ui/Message';
import { Rail } from '../../components/ui/Rail';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Avatar } from '../../components/ui/Avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { CATEGORIES, GAMES, gameById, type CatalogueGame } from '../../data/games';
import { coinById } from '../../data/wallet';
import { formatAmount, formatUsd } from '../../lib/format';
import { cn } from '../../lib/cn';
import { BETS, FEATURED, TOP_WINNERS, payout, type Bet } from './data';

// The lobby, rebuilt from the Figma dashboard on the flat system. ?state=loading|error|empty
// reaches the loading, failed and no results states for the shots.

const PAGE = 18;

function useLobbyState() {
  return useMemo(() => new URLSearchParams(window.location.search).get('state'), []);
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
            <img src={game.image} alt="" className={cn('shrink-0 rounded-xl border border-line object-cover', game.wideOnly ? 'aspect-[3/2] w-1/2' : 'aspect-[3/4] w-1/3')} />
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

function Hero({ onPlay }: { onPlay: (g: CatalogueGame) => void }) {
  const featured = gameById('sugar-rush')!;
  return (
    <section aria-labelledby="lobby-title" className="col-span-8 grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-panel">
      <div className="flex flex-col justify-center gap-6 p-8">
        <h1 id="lobby-title" className="font-display text-40 font-semibold text-ink">
          Where luck meets lust
        </h1>
        <p className="text-18 text-ink2">Pick up where you left off, or try one of 150+ slots and fish games.</p>
        <div>
          <Button size="lg" onClick={() => onPlay(featured)}>
            Play {featured.name}
          </Button>
        </div>
      </div>
      <div className="relative">
        <img src="/art/landing/hero-beach.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <img src="/art/landing/girl-offshoulder.webp" alt="" className="absolute bottom-0 left-1/2 h-[96%] w-auto -translate-x-1/2" />
      </div>
    </section>
  );
}

function Featured({ onPlay }: { onPlay: (g: CatalogueGame) => void }) {
  const [i, setI] = useState(0);
  const game = gameById(FEATURED[i])!;
  const step = (d: number) => setI((n) => (n + d + FEATURED.length) % FEATURED.length);
  return (
    <section aria-label="Featured slot" className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-4">
      <div className="relative overflow-hidden rounded-xl">
        <img src={game.wide ?? game.image} alt="" className="aspect-[16/9] w-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-14 text-ink3">Featured slot</span>
          <span className="truncate text-16 font-semibold text-ink">{game.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="quiet" size="icon" aria-label="Previous featured slot" onClick={() => step(-1)}>
            <CaretLeft className="h-5 w-5" aria-hidden />
          </Button>
          <span className="num text-14 text-ink3" aria-live="polite">
            {i + 1} of {FEATURED.length}
          </span>
          <Button variant="quiet" size="icon" aria-label="Next featured slot" onClick={() => step(1)}>
            <CaretRight className="h-5 w-5" aria-hidden />
          </Button>
          <Button variant="tertiary" onClick={() => onPlay(game)}>
            Play
          </Button>
        </div>
      </div>
    </section>
  );
}

function Giveaway() {
  const [joined, setJoined] = useState(false);
  return (
    <section aria-labelledby="giveaway-title" className="flex flex-1 flex-col justify-between gap-4 rounded-2xl border border-line bg-panel p-6">
      <div className="flex items-start gap-4">
        <Trophy weight="fill" className="h-6 w-6 shrink-0 text-accent" aria-hidden />
        <div className="flex flex-col gap-1">
          <h2 id="giveaway-title" className="text-18 font-semibold text-ink">
            Hot streak giveaway
          </h2>
          <p className="text-14 text-ink2">Win a share of 0.42 BTC. Every $10 you play this week is one entry.</p>
          <p className="flex items-center gap-2 text-14 text-ink3">
            <Clock className="h-4 w-4" aria-hidden />
            Ends Sunday at midnight
          </p>
        </div>
      </div>
      <Button variant="secondary" onClick={() => setJoined(true)} disabled={joined}>
        {joined ? 'You are in, good luck' : 'Join the giveaway'}
      </Button>
    </section>
  );
}

function TopWinners({ loading }: { loading: boolean }) {
  return (
    <section aria-labelledby="winners-title" className="col-span-4 flex flex-col gap-4">
      <SectionHeader id="winners-title" title="Top wins today" />
      <ol className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-panel">
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </li>
            ))
          : TOP_WINNERS.map((w, i) => {
              const g = gameById(w.gameId)!;
              const coin = coinById(w.coin);
              return (
                <li key={w.gameId} className="flex items-center gap-3 p-4">
                  <span className="num w-4 text-14 font-semibold text-ink3">{i + 1}</span>
                  <img src={g.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-16 font-semibold text-ink">{g.name}</span>
                    <span className="truncate text-14 text-ink2">{w.player}</span>
                  </div>
                  <span className="flex items-center gap-2">
                    <img src={coin.icon} alt="" width={20} height={20} className="rounded-full" />
                    <span className="num text-16 font-semibold text-success">
                      {formatAmount(w.amount, coin.decimals > 2 ? 4 : 2)} {coin.symbol}
                    </span>
                  </span>
                </li>
              );
            })}
      </ol>
    </section>
  );
}

const BET_TABS = [
  { value: 'all', label: 'All bets', pick: (_: Bet) => true },
  { value: 'high', label: 'High wins', pick: (b: Bet) => payout(b) >= 500 },
  { value: 'lucky', label: 'Lucky wins', pick: (b: Bet) => b.multiplier >= 5 },
  { value: 'mine', label: 'My bets', pick: (b: Bet) => !!b.mine },
];

function BetsTable({ rows }: { rows: Bet[] }) {
  if (!rows.length) {
    return <Message icon={<GameController weight="fill" className="h-10 w-10 text-ink3" aria-hidden />} title="No bets here yet" body="Bets that match this tab show up the moment they land." />;
  }
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">Latest bets</caption>
      <thead className="bg-sunken">
        <tr className="text-14 font-medium text-ink3">
          <th scope="col" className="h-11 px-6">Game</th>
          <th scope="col" className="h-11 px-4">Player</th>
          <th scope="col" className="h-11 px-4">Time</th>
          <th scope="col" className="h-11 px-4 text-right">Wager</th>
          <th scope="col" className="h-11 px-4 text-right">Multiplier</th>
          <th scope="col" className="h-11 px-6 text-right">Payout</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => {
          const g = gameById(b.gameId)!;
          const coin = coinById(b.coin);
          const p = payout(b);
          return (
            <tr key={b.id} className="border-t border-line">
              <td className="px-6 py-3">
                <span className="flex items-center gap-3">
                  <img src={g.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <span className="text-16 text-ink">{g.name}</span>
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2">
                  <Avatar initials={b.initials} size="sm" />
                  <span className="text-16 text-ink">{b.player}</span>
                </span>
              </td>
              <td className="num px-4 py-3 text-16 text-ink2">{b.time}</td>
              <td className="px-4 py-3">
                <span className="flex items-center justify-end gap-2">
                  <span className="num text-16 text-ink">{formatUsd(b.wager)}</span>
                  <img src={coin.icon} alt={coin.symbol} width={20} height={20} className="rounded-full" />
                </span>
              </td>
              <td className={cn('num px-4 py-3 text-right text-16', b.multiplier >= 1 ? 'text-ink' : 'text-ink3')}>{b.multiplier.toFixed(2)}x</td>
              <td className={cn('num px-6 py-3 text-right text-16 font-semibold', p > b.wager ? 'text-success' : 'text-ink3')}>{formatUsd(p)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function LiveBets({ state }: { state: string | null }) {
  return (
    <section aria-labelledby="bets-title" className="flex flex-col gap-4">
      <SectionHeader id="bets-title" title="Latest bets" />
      <Tabs defaultValue="all">
        <TabsList aria-label="Bets">
          {BET_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {BET_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="pt-4 outline-none">
            <div className="overflow-hidden rounded-2xl border border-line bg-panel">
              {state === 'loading' ? (
                <div className="flex flex-col gap-3 p-6">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : state === 'error' ? (
                <Message
                  icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
                  title="Live bets are paused"
                  body="The feed lost its connection. It reconnects on its own, or reload the page."
                />
              ) : (
                <BetsTable rows={BETS.filter(t.pick)} />
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function Explore({ state, onPlay }: { state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [category, setCategory] = useState<string>('all');
  const [shown, setShown] = useState(PAGE);
  const [failed, setFailed] = useState(state === 'error');
  const list = GAMES.filter((g) => !g.wideOnly && (category === 'all' || g.category === category) && g.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section aria-labelledby="explore-title" className="flex flex-col gap-6">
      <SectionHeader id="explore-title" title="Explore the games" />
      <div className="flex items-end justify-between gap-6">
        <RG.Root
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setShown(PAGE);
          }}
          aria-label="Category"
          className="flex flex-wrap gap-2"
        >
          {CATEGORIES.map((c) => (
            <RG.Item
              key={c.value}
              value={c.value}
              className="flex h-10 items-center rounded-full border-2 border-line bg-panel px-4 text-14 font-medium text-ink2 transition-colors hover:border-field hover:text-ink data-[state=checked]:border-accent data-[state=checked]:bg-raised data-[state=checked]:text-ink"
            >
              {c.label}
            </RG.Item>
          ))}
        </RG.Root>
        <Field
          label="Search the games"
          className="w-full max-w-sm [&_label]:sr-only"
          prefix={<MagnifyingGlass className="h-5 w-5" aria-hidden />}
          type="search"
          placeholder="Search by game name"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
        />
      </div>

      {state === 'loading' ? (
        <div className="grid grid-cols-6 gap-4 w1920:grid-cols-8">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full" />
          ))}
        </div>
      ) : failed ? (
        <div className="rounded-2xl border border-line bg-panel">
          <Message
            icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
            title="We could not load the games"
            body="Your balance and bets are safe. Try again in a moment."
            action={
              <Button variant="secondary" onClick={() => setFailed(false)}>
                Try again
              </Button>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-line bg-panel">
          <Message
            icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-ink3" aria-hidden />}
            title={`No games match "${query.trim()}"`}
            body="Check the spelling, or clear the search to see every game in this category."
            action={
              <Button variant="secondary" onClick={() => setQuery('')}>
                Clear the search
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-6 gap-4 w1920:grid-cols-8">
            {list.slice(0, shown).map((g) => (
              <li key={g.id}>
                <GameTile game={g} onPlay={() => onPlay(g)} />
              </li>
            ))}
          </ul>
          {list.length > shown && (
            <div className="flex items-center justify-between gap-4">
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
    </section>
  );
}

export function LobbyPage() {
  const state = useLobbyState();
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const recommended = GAMES.filter((g) => !g.wideOnly).slice(0, 10);
  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-12 gap-6">
        <Hero onPlay={setOpen} />
        <div className="col-span-4 flex flex-col gap-6">
          <Featured onPlay={setOpen} />
          <Giveaway />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 min-w-0">
          <Rail id="recommended-title" title="Recommended for you">
            {state === 'loading'
              ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] w-1/5 shrink-0" />)
              : recommended.map((g) => (
                  <div key={g.id} className="w-1/5 shrink-0 snap-start">
                    <GameTile game={g} onPlay={() => setOpen(g)} />
                  </div>
                ))}
          </Rail>
        </div>
        <TopWinners loading={state === 'loading'} />
      </div>
      <LiveBets state={state} />
      <Explore state={state} onPlay={setOpen} />
      <GameDialog game={open} onClose={() => setOpen(null)} />
    </div>
  );
}
