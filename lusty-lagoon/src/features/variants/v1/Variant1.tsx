import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CaretRight,
  Cherries,
  Coins,
  DiscordLogo,
  Fire,
  Fish,
  Headset,
  InstagramLogo,
  Lightning,
  List,
  MagnifyingGlass,
  Question,
  Sparkle,
  SquaresFour,
  TelegramLogo,
  UserPlus,
  Wallet,
  WarningCircle,
  XLogo,
} from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Message } from '../../../components/ui/Message';
import { Dialog, DialogContent } from '../../../components/ui/Dialog';
import { GameDialog } from '../../lobby/LobbyPage';
import { useWallet } from '../../wallet/store';
import { GAMES, gameById, type CatalogueGame, type Category } from '../../../data/games';
import { ACCOUNT } from '../../../data/wallet';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { EXPLORE_ORDER, GIVEAWAY } from '../../lobby/data';
import { DAILY_CHEST, RACE, ROOMS, useCountdown, useVariantState } from '../shared/data';
import { BalancePill, ChipRow, CountdownDigits, CoverCard, IconSquare, KitButton, NavItem, PromoMini, RailControls, SectionHead, SectionLabel, VividTile } from '../kit/parts';
import { BellSquare, SearchBox, UserBox } from '../kit/TopParts';
import { ChatPanel } from '../kit/ChatPanel';
import { BetsBoard, WinsStrip } from '../kit/Boards';

// Variant 1, Social lagoon. Turbo Bet's three column shell, NewBettie's bets board and the
// Wizard Casino and Grimdrop free bonus card on top of the chat, built from our own art.

type Filter = 'all' | Category;

const NAV_GAMES: { value: Filter; label: string; icon: ReactNode }[] = [
  { value: 'all', label: 'Lobby', icon: <SquaresFour weight="fill" /> },
  { value: 'slots', label: 'Slots', icon: <Cherries weight="fill" /> },
  { value: 'megaways', label: 'Megaways', icon: <Lightning weight="fill" /> },
  { value: 'hold-and-win', label: 'Hold and win', icon: <Coins weight="fill" /> },
  { value: 'fish', label: 'Fish games', icon: <Fish weight="fill" /> },
  { value: 'new', label: 'New', icon: <Sparkle weight="fill" /> },
];

const ORDERED = [...EXPLORE_ORDER.map((id) => gameById(id)!), ...GAMES.filter((g) => !g.wideOnly && !EXPLORE_ORDER.includes(g.id))];
const countOf = (c: Filter) => (c === 'all' ? ORDERED.length : ORDERED.filter((g) => g.category === c).length);
const players = (c: Category) => ROOMS.find((r) => r.id === c)?.players ?? 0;

function TopBar({ onDeposit, onRace }: { onDeposit: () => void; onRace: () => void }) {
  const { balance } = useWallet();
  const race = useCountdown(RACE.endsInSeconds);
  return (
    <header className="sticky top-0 z-10 flex h-[84px] items-center gap-4 bg-page px-4">
      <div className="flex w-[240px] shrink-0 items-center gap-4">
        <IconSquare label="Menu">
          <List weight="bold" className="h-6 w-6" aria-hidden />
        </IconSquare>
        <Link to="/variants/1" aria-label="Lusty Lagoon, lobby" className="rounded-lg">
          <Logo className="text-[20px] leading-[22px]" />
        </Link>
      </div>
      <button type="button" onClick={onRace} className="flex h-[52px] items-center gap-3 rounded-[14px] bg-[linear-gradient(90deg,#3B1F7A,rgb(var(--k-item)))] pl-3 pr-[6px] text-left hover:brightness-110">
        <img src="/art/landing/pillar-gems-b.webp" alt="" className="h-11 w-auto object-contain" />
        <span className="flex flex-col leading-tight">
          <span className="text-14 font-bold text-ink">Weekly race</span>
          <span className="num text-12 font-semibold text-[rgb(var(--k-muted))]">
            {race.d}d : {race.pad(race.h)}h : {race.pad(race.m)}m
          </span>
        </span>
        <span className="k-btn-purple ml-2 flex h-10 w-10 items-center justify-center rounded-[10px] text-ink" aria-hidden>
          <CaretRight weight="bold" className="h-5 w-5" />
        </span>
      </button>
      <div className="mx-auto">
        <BalancePill amount={formatAmount(balance)} currency={ACCOUNT.currency} onDeposit={onDeposit} depositLabel="Deposit" />
      </div>
      <UserBox />
      <BellSquare />
    </header>
  );
}

function Sidebar({ filter, onFilter, onGiveaway }: { filter: Filter; onFilter: (f: Filter) => void; onGiveaway: () => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  return (
    <aside className="sticky top-[84px] flex h-[calc(100vh-100px)] w-[240px] shrink-0 flex-col gap-4 overflow-y-auto rounded-[20px] bg-[rgb(var(--k-panel))] p-3 k-no-scrollbar">
      <div className="grid grid-cols-2 gap-2">
        <PromoMini hue="purple" label={['Daily', 'chest']} art="/art/lobby/giveaway-chest.webp" to="#chest" />
        <PromoMini hue="blue" label={['Rank', 'road']} art="/brand/rank-bronze.png" artClass="h-[44px]" to="/variants/3" />
        <PromoMini hue="gold" label={['Hot', 'streak']} art="/art/landing/pillar-gems-b.webp" artClass="h-[60px]" onClick={onGiveaway} />
        <PromoMini hue="green" label={['Refer', 'friends']} art="/art/money/refer-megaphone.webp" artClass="h-[64px] top-[60%]" to="/refer" />
      </div>
      <nav aria-label="Games" className="flex flex-col gap-2">
        <SectionLabel>Games</SectionLabel>
        {NAV_GAMES.map((n) => (
          <NavItem
            key={n.value}
            icon={n.icon}
            label={n.label}
            active={filter === n.value}
            onClick={() => onFilter(n.value)}
            badge={<span className="num text-12 font-semibold text-[rgb(var(--k-dim))]">{countOf(n.value)}</span>}
          />
        ))}
      </nav>
      <nav aria-label="Account" className="flex flex-col gap-2">
        <SectionLabel>Others</SectionLabel>
        <NavItem
          to="/wallet/deposit"
          icon={<Wallet weight="fill" />}
          label="Wallet"
          badge={
            pending > 0 ? (
              <span className="num flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gold px-[6px] text-12 font-bold text-on-gold">
                {pending}
                <span className="sr-only"> pending</span>
              </span>
            ) : undefined
          }
        />
        <NavItem to="/agent" icon={<Headset weight="fill" />} label="Send to agent" />
        <NavItem to="/refer" icon={<UserPlus weight="fill" />} label="Refer a friend" />
        <NavItem to="/faq" icon={<Question weight="fill" />} label="FAQ" />
      </nav>
      <div className="relative mt-auto shrink-0 overflow-hidden rounded-[18px] k-hue-gold p-4 pb-[20px]">
        <p className="relative z-10 w-[130px] font-display text-[22px] font-bold uppercase leading-[24px] text-ink">Hot streak giveaway</p>
        <p className="relative z-10 mt-1 w-[150px] text-14 font-semibold text-ink/90">
          Win a share of {GIVEAWAY.pool} BTC
        </p>
        <KitButton tone="white" size="sm" onClick={onGiveaway} className="relative z-10 mt-4 h-10 px-[20px]">
          Join now
        </KitButton>
        <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute -bottom-4 -right-8 w-[112px] rotate-[8deg]" />
      </div>
      <div className="grid shrink-0 grid-cols-4 gap-2">
        {[
          { l: 'X', i: <XLogo weight="bold" className="h-5 w-5" /> },
          { l: 'Instagram', i: <InstagramLogo weight="bold" className="h-5 w-5" /> },
          { l: 'Telegram', i: <TelegramLogo weight="bold" className="h-5 w-5" /> },
          { l: 'Discord', i: <DiscordLogo weight="bold" className="h-5 w-5" /> },
        ].map((x) => (
          <a key={x.l} href="#" aria-label={`Lusty Lagoon on ${x.l}`} className="flex h-11 items-center justify-center rounded-[12px] bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] hover:text-ink">
            {x.i}
          </a>
        ))}
      </div>
    </aside>
  );
}

function Hero({ onPlay }: { onPlay: () => void }) {
  return (
    <section aria-labelledby="v1-title" className="k-hero-purple relative isolate h-[364px] overflow-hidden rounded-[24px]">
      <span aria-hidden className="k-mark absolute inset-0 -z-10" />
      <img src="/art/landing/pillar-flowers-right.webp" alt="" className="pointer-events-none absolute bottom-[-24px] right-[150px] -z-10 h-[330px] opacity-80" />
      <img src="/art/landing/girl-lei.webp" alt="" className="pointer-events-none absolute bottom-[-56px] right-[-8px] h-[430px] w-auto max-w-none" />
      <div className="relative flex h-full w-[62%] flex-col justify-between p-8">
        <div className="flex flex-col gap-4">
          <h1 id="v1-title" className="font-display text-[40px] font-bold uppercase leading-[40px] text-ink">
            Where luck
            <br />
            meets
            <br />
            lust.
          </h1>
          <p className="max-w-[240px] text-16 font-semibold leading-6 text-ink/90">Spin, win and open a free chest every single day.</p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-[16px] bg-black/30 p-[6px] pl-4">
          <span className="text-16 font-bold text-ink">@{ACCOUNT.name.replace(/\s|\./g, '').toLowerCase()}</span>
          <KitButton tone="purple" size="md" onClick={onPlay} className="ml-2 h-11 rounded-[12px]">
            Play Sugar Rush
          </KitButton>
        </div>
      </div>
    </section>
  );
}

function ChestCard({ id }: { id?: string }) {
  const { h, m, s, pad, left } = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(false);
  const today = DAILY_CHEST.days.find((d) => d.status === 'today')!;
  return (
    <section id={id} aria-labelledby="chest-title" className="k-hue-purple relative isolate shrink-0 overflow-hidden rounded-[20px] p-[20px]">
      <span aria-hidden className="k-mark absolute inset-0 -z-10" />
      <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute -right-6 -top-4 w-[140px] rotate-[10deg]" />
      <h2 id="chest-title" className="w-[150px] font-display text-[28px] font-bold uppercase leading-[28px] text-ink">
        Daily chest
      </h2>
      <p className="mt-2 w-[150px] text-14 font-semibold leading-5 text-ink/90">
        Today pays {today.amount} {DAILY_CHEST.currency}. Day {DAILY_CHEST.streak + 1} of your streak.
      </p>
      <p className="mt-4 text-12 font-semibold uppercase tracking-[0.06em] text-ink/80">Opens in</p>
      <div className="mt-2">
        <CountdownDigits h={h} m={m} s={s} pad={pad} />
      </div>
      <ol aria-label="This week's chests" className="mt-4 grid grid-cols-7 gap-1">
        {DAILY_CHEST.days.map((d) => (
          <li
            key={d.day}
            className={cn(
              'flex h-11 flex-col items-center justify-center rounded-[8px] text-12 font-bold leading-4',
              d.status === 'claimed' && 'bg-black/25 text-ink/80',
              d.status === 'today' && 'bg-ink text-[#3B1A7A]',
              d.status === 'locked' && 'bg-black/10 text-ink/70',
            )}
          >
            <span>{d.day}</span>
            <span className="num">{d.status === 'claimed' ? '✓' : d.amount}</span>
          </li>
        ))}
      </ol>
      <KitButton tone="white" size="md" aria-pressed={remind} onClick={() => setRemind((r) => !r)} className="mt-4 h-11 w-full">
        {left > 0 ? (remind ? 'Reminder on, we will ping you' : 'Remind me when it opens') : 'Open the chest'}
      </KitButton>
    </section>
  );
}

function Games({ filter, onFilter, state, onPlay }: { filter: Filter; onFilter: (f: Filter) => void; state: string | null; onPlay: (g: CatalogueGame) => void }) {
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [all, setAll] = useState(false);
  const [failed, setFailed] = useState(state === 'error');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ORDERED.filter((g) => (filter === 'all' || g.category === filter) && (!q || g.name.toLowerCase().includes(q) || g.provider.toLowerCase().includes(q)));
  }, [filter, query]);
  const shown = all ? list : list.slice(0, 10);
  return (
    <section id="games" aria-labelledby="games-title" className="flex scroll-mt-[100px] flex-col gap-4">
      <SectionHead id="games-title" icon={<Fire weight="fill" className="text-[#FF8A3D]" />} title="All games">
        <RailControls label="All games" onAll={() => setAll((a) => !a)} onPrev={() => onFilter(NAV_GAMES[(NAV_GAMES.findIndex((n) => n.value === filter) + NAV_GAMES.length - 1) % NAV_GAMES.length].value)} onNext={() => onFilter(NAV_GAMES[(NAV_GAMES.findIndex((n) => n.value === filter) + 1) % NAV_GAMES.length].value)} />
      </SectionHead>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 overflow-x-auto k-no-scrollbar">
          <ChipRow
            wrap={false}
            label="Category"
            value={filter}
            onChange={onFilter}
            items={NAV_GAMES.map((n) => ({ value: n.value, label: n.value === 'all' ? 'All' : n.label, icon: n.icon }))}
          />
        </div>
        <SearchBox id="v1-search" value={query} onChange={setQuery} className="h-11 w-[220px] shrink-0 rounded-[12px]" />
      </div>
      {state === 'loading' ? (
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-[16px]" />
          ))}
        </div>
      ) : failed ? (
        <div className="rounded-[20px] bg-[rgb(var(--k-panel))]">
          <Message
            icon={<WarningCircle weight="fill" className="h-10 w-10 text-danger" aria-hidden />}
            title="We could not load the games"
            body="Your balance and bets are safe. Try again in a moment."
            action={
              <KitButton tone="purple" onClick={() => setFailed(false)}>
                Try again
              </KitButton>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-[20px] bg-[rgb(var(--k-panel))]">
          <Message
            icon={<MagnifyingGlass weight="bold" className="h-10 w-10 text-[rgb(var(--k-dim))]" aria-hidden />}
            title={`No games match "${query.trim()}"`}
            body="Check the spelling, or search by provider, such as Pragmatic Play."
            action={
              <KitButton tone="purple" onClick={() => setQuery('')}>
                Clear the search
              </KitButton>
            }
          />
        </div>
      ) : (
        <ul className="grid grid-cols-5 gap-3 w1920:grid-cols-7">
          {shown.map((g) => (
            <li key={g.id}>
              <CoverCard image={g.image} name={g.name} provider={g.provider} onPlay={() => onPlay(g)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Variant1() {
  const state = useVariantState();
  const navigate = useNavigate();
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [race, setRace] = useState(false);
  const [give, setGive] = useState(false);
  const [joined, setJoined] = useState(false);
  const pick = (f: Filter) => {
    setFilter(f);
    document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <div className="min-h-screen bg-page">
      <TopBar onDeposit={() => navigate('/wallet/deposit')} onRace={() => setRace(true)} />
      <div className="flex gap-4 px-4 pb-4">
        <Sidebar filter={filter} onFilter={pick} onGiveaway={() => setGive(true)} />
        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <div className="grid grid-cols-[1.3fr_1fr] gap-4">
            <Hero onPlay={() => setOpen(gameById('sugar-rush')!)} />
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              <VividTile hue="purple" title="Slots" count={players('slots')} art="/art/landing/slot-machine.webp" artClass="h-[92%] -right-3" onClick={() => pick('slots')} />
              <VividTile hue="blue" title="Megaways" count={players('megaways')} art="/art/kit/neon-reels.webp" artClass="h-[78%] -bottom-4 -right-6 mix-blend-screen" onClick={() => pick('megaways')} />
              <VividTile hue="gold" title="Hold & win" count={players('hold-and-win')} art="/art/lobby/giveaway-chest.webp" artClass="h-[80%] right-[-20px]" onClick={() => pick('hold-and-win')} />
              <VividTile hue="pink" title="Refer" count={12} countLabel="friends joined" art="/art/money/refer-megaphone.webp" artClass="h-[100%] -bottom-6 right-0" to="/refer" />
            </div>
          </div>
          <WinsStrip onPlay={setOpen} loading={state === 'loading'} />
          <Games filter={filter} onFilter={pick} state={state} onPlay={setOpen} />
          <BetsBoard onPlay={setOpen} state={state} />
        </main>
        <aside aria-label="Chest and chat" className="sticky top-[84px] flex h-[calc(100vh-100px)] w-[300px] shrink-0 flex-col gap-4">
          <ChestCard id="chest" />
          <ChatPanel className="min-h-0 flex-1" />
        </aside>
      </div>
      <GameDialog game={open} onClose={() => setOpen(null)} />
      <Dialog open={race} onOpenChange={setRace}>
        <DialogContent title="Weekly race" description={`${formatAmount(RACE.pool, 0)} ${RACE.currency} shared by the top ten on amount played.`}>
          <ol className="flex flex-col divide-y divide-line rounded-xl border border-line">
            {RACE.leaders.map((l) => (
              <li key={l.place} className="flex items-center gap-3 px-4 py-3">
                <span className="num w-6 text-16 font-bold text-ink">{l.place}</span>
                <img src={l.avatar} alt="" className="h-8 w-8 rounded-full" />
                <span className="flex-1 text-16 text-ink">{l.player}</span>
                <span className="num text-16 font-semibold text-gold">{formatAmount(l.prize, 0)} USDT</span>
              </li>
            ))}
          </ol>
          <p className="text-14 text-ink2">
            You are {RACE.you.place}th. {formatAmount(RACE.you.toTen, 0)} USDT more played reaches the top ten.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog open={give} onOpenChange={setGive}>
        <DialogContent title="Hot streak giveaway" description={`Win a share of ${GIVEAWAY.pool} BTC. The draw is ${GIVEAWAY.ends}.`}>
          <ul className="flex list-disc flex-col gap-2 pl-[20px] text-16 text-ink2">
            <li>Every ${GIVEAWAY.entryEvery} you play this week is one entry.</li>
            <li>Ten winners share the pool, paid to your wallet in BTC.</li>
          </ul>
          {joined ? (
            <p role="status" className="rounded-lg border border-success/40 bg-sunken p-4 text-16 text-ink">
              You are in. Good luck for {GIVEAWAY.ends}.
            </p>
          ) : (
            <div>
              <KitButton tone="purple" onClick={() => setJoined(true)}>
                Join the giveaway
              </KitButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
