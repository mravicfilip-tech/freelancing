import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { BalancePill, ChipRow, CountdownLine, CoverCard, KitButton, LiveDot, NavItem, Panel, PromoMini, RailControls, SectionHead, SectionLabel, SegmentBar, VividTile } from '../kit/parts';
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

/** Columns of the cover grid, 5 below 1920 and 7 from 1920, the same break the grid classes use. */
function useCoverColumns() {
  const q = '(min-width: 1920px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide ? 7 : 5;
}

function TopBar({ onDeposit, onRace }: { onDeposit: () => void; onRace: () => void }) {
  const { balance } = useWallet();
  const race = useCountdown(RACE.endsInSeconds);
  return (
    <header className="k-glass sticky top-0 z-10 flex h-[84px] items-center gap-4 px-4">
      <div className="flex w-[240px] shrink-0 items-center px-3">
        <Link to="/variants/1" aria-label="Lusty Lagoon, lobby" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]">
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
        <BalancePill amount={formatAmount(balance)} balance={balance} currency={ACCOUNT.currency} onDeposit={onDeposit} depositLabel="Deposit" />
      </div>
      <UserBox />
      <BellSquare />
    </header>
  );
}

function Sidebar({ filter, onFilter, onGiveaway }: { filter: Filter; onFilter: (f: Filter) => void; onGiveaway: () => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  // The sidebar never clips and never scrolls inside itself. It sticks under the top bar, and when
  // it is taller than the window it sticks by its bottom edge so every row can be reached.
  const ref = useRef<HTMLElement>(null);
  const [top, setTop] = useState(100);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setTop(Math.min(100, Math.round(window.innerHeight - el.offsetHeight - 16)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);
  return (
    <aside ref={ref} style={{ top }} className="k-surface sticky flex w-[240px] shrink-0 flex-col gap-4 self-start rounded-[20px] p-3">
      <div className="grid grid-cols-2 gap-2">
        <PromoMini hue="purple" label={['Daily', 'chest']} art="/art/lobby/giveaway-chest.webp" to="#chest" />
        <PromoMini hue="blue" label={['Rank', 'road']} art="/brand/rank-bronze.png" artClass="h-[44px]" to="/variants/3" />
        <PromoMini hue="gold" label={['Hot', 'streak']} art="/art/landing/pillar-gems-b.webp" artClass="h-[60px]" onClick={onGiveaway} />
        <PromoMini hue="green" label={['Refer', 'friends']} art="/art/money/refer-megaphone.webp" artClass="h-[64px] top-[60%]" to="/refer" />
      </div>
      <nav aria-label="Games" className="flex flex-col gap-1 [&>a]:h-11 [&>button]:h-11">
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
      <nav aria-label="Account" className="flex flex-col gap-1 [&>a]:h-11 [&>button]:h-11">
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
      <div className="relative shrink-0 overflow-hidden rounded-[18px] k-hue-gold p-4 pb-6">
        <p className="relative z-10 w-[130px] text-20 font-extrabold uppercase leading-[24px] tracking-[-0.01em] text-ink">Hot streak giveaway</p>
        <p className="relative z-10 mt-1 w-[150px] text-14 font-semibold text-ink/90">
          Win a share of {GIVEAWAY.pool} BTC
        </p>
        <KitButton tone="white" size="sm" onClick={onGiveaway} className="relative z-10 mt-4 h-10 px-[20px]">
          Join now
        </KitButton>
        <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute bottom-3 right-3 w-[80px]" />
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
  const today = DAILY_CHEST.days.find((d) => d.status === 'today')!;
  return (
    <section aria-labelledby="v1-title" className="k-hero-purple relative isolate h-[400px] overflow-hidden rounded-[24px] border border-white/[0.12] w1920:h-[440px]">
      <span aria-hidden className="k-mark absolute inset-0 -z-10" />
      <span aria-hidden className="pointer-events-none absolute -bottom-[120px] right-[-60px] -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(206_150_255/0.55),rgb(160_90_255/0.22)_55%,transparent)] w1920:right-[40px]" />
      <img src="/art/landing/girl-lei.webp" alt="" className="pointer-events-none absolute bottom-0 right-[12px] h-[calc(100%-32px)] w-auto max-w-none w1920:right-[48px]" />
      <div className="relative flex h-full w-[60%] flex-col justify-between p-8 w1920:w-[72%]">
        <div className="flex flex-col gap-4">
          <h1 id="v1-title" className="font-display text-[40px] font-bold uppercase leading-[44px] tracking-[-0.02em] text-ink w1920:text-[64px] w1920:leading-[68px]">
            Where luck
            <br />
            meets lust.
          </h1>
          <p className="max-w-[210px] text-14 font-semibold leading-5 text-ink/90">Spin, win and open a free chest every single day.</p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <p className="flex items-center gap-2 whitespace-nowrap text-14 font-semibold text-ink">
            <LiveDot />
            <span>
              <span className="num">{DAILY_CHEST.streak}</span> day streak, <span className="num text-gold">{today.amount} {DAILY_CHEST.currency}</span> today
            </span>
          </p>
          <KitButton tone="primary" size="md" onClick={onPlay}>
            Play Sugar Rush
          </KitButton>
        </div>
      </div>
    </section>
  );
}

function ChestCard({ id }: { id?: string }) {
  const { h, m, s, left } = useCountdown(DAILY_CHEST.readyInSeconds);
  const [remind, setRemind] = useState(false);
  const today = DAILY_CHEST.days.find((d) => d.status === 'today')!;
  const todayIndex = DAILY_CHEST.days.indexOf(today);
  const last = DAILY_CHEST.days[DAILY_CHEST.days.length - 1];
  return (
    <Panel lit id={id} aria-labelledby="chest-title" className="shrink-0 overflow-hidden p-6">
      <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute right-[12px] top-[12px] w-[112px]" />
      <h2 id="chest-title" className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">
        Daily chest
      </h2>
      <p className="num mt-2 text-28 font-extrabold leading-8 tracking-[-0.01em] text-gold">
        {today.amount} <span className="text-14 font-semibold tracking-normal text-[rgb(var(--k-muted))]">{DAILY_CHEST.currency}</span>
      </p>
      <p className="mt-1 w-[120px] text-14 leading-5 text-[rgb(var(--k-muted))]">Today's chest, day {DAILY_CHEST.streak + 1} of your streak.</p>
      <p className="mt-6 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">Opens in</p>
      <CountdownLine
        className="mt-2"
        parts={[
          { value: h, unit: 'hrs' },
          { value: m, unit: 'min' },
          { value: s, unit: 'sec' },
        ]}
      />
      <div className="mt-6 flex items-baseline justify-between">
        <p className="text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--k-dim))]">Streak</p>
        <p className="num text-12 font-semibold text-[rgb(var(--k-muted))]">
          Day {todayIndex + 1} of {DAILY_CHEST.days.length}
        </p>
      </div>
      <SegmentBar className="mt-2" total={DAILY_CHEST.days.length} done={todayIndex} current={todayIndex} label={`Day ${todayIndex + 1} of ${DAILY_CHEST.days.length} of this week's chests`} />
      <p className="mt-2 text-12 text-[rgb(var(--k-dim))]">
        Day {DAILY_CHEST.days.length} pays <span className="num font-semibold text-gold">{last.amount} {DAILY_CHEST.currency}</span>
      </p>
      <KitButton tone={left > 0 ? 'dark' : 'primary'} size="md" aria-pressed={left > 0 ? remind : undefined} onClick={() => setRemind((r) => !r)} className="mt-6 w-full">
        {left > 0 ? (remind ? 'Reminder on' : 'Remind me when it opens') : 'Open the chest'}
      </KitButton>
    </Panel>
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
  const cols = useCoverColumns();
  // Whole rows only. Two rows closed, every whole row open. A short list shows as it is.
  const whole = list.length < cols ? list.length : Math.floor(list.length / cols) * cols;
  const shown = list.slice(0, all ? whole : Math.min(whole, cols * 2));
  const more = whole > cols * 2;
  return (
    <section id="games" aria-labelledby="games-title" className="flex scroll-mt-[116px] flex-col gap-4">
      <SectionHead id="games-title" icon={<Fire weight="fill" className="text-[#FF8A3D]" />} title="All games">
        <RailControls label="All games" onAll={more || all ? () => setAll((a) => !a) : undefined} onPrev={() => onFilter(NAV_GAMES[(NAV_GAMES.findIndex((n) => n.value === filter) + NAV_GAMES.length - 1) % NAV_GAMES.length].value)} onNext={() => onFilter(NAV_GAMES[(NAV_GAMES.findIndex((n) => n.value === filter) + 1) % NAV_GAMES.length].value)} />
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
        <div className="grid grid-cols-5 gap-3 w1920:grid-cols-7">
          {Array.from({ length: 14 }, (_, i) => (
            <Skeleton key={i} className={cn('aspect-[3/4] w-full rounded-[16px]', i >= 10 && 'hidden w1920:block')} />
          ))}
        </div>
      ) : failed ? (
        <div className="k-surface rounded-[20px]">
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
        <div className="k-surface rounded-[20px]">
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
    <div className="k-page min-h-screen">
      <TopBar onDeposit={() => navigate('/wallet/deposit')} onRace={() => setRace(true)} />
      <div className="flex gap-4 px-4 pb-4 pt-4">
        <Sidebar filter={filter} onFilter={pick} onGiveaway={() => setGive(true)} />
        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <div className="grid grid-cols-[1.04fr_1fr] w1920:grid-cols-[1.1fr_1fr] gap-4">
            <Hero onPlay={() => setOpen(gameById('sugar-rush')!)} />
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              <VividTile hue="purple" title="Slots" count={players('slots')} art="/art/landing/slot-machine.webp" artClass="bottom-3 right-3 h-[80%] w1920:h-[88%]" onClick={() => pick('slots')} />
              <VividTile hue="blue" title="Megaways" count={players('megaways')} art="/art/kit/neon-reels.webp" artClass="bottom-3 right-3 h-[72%] w1920:h-[84%] mix-blend-screen" onClick={() => pick('megaways')} />
              <VividTile hue="gold" title="Hold & win" count={players('hold-and-win')} art="/art/lobby/giveaway-chest.webp" artClass="bottom-3 right-3 h-[62%] w1920:h-[74%]" onClick={() => pick('hold-and-win')} />
              <VividTile hue="pink" title="Refer" count={12} countLabel="friends joined" art="/art/money/refer-megaphone.webp" artClass="bottom-0 right-3 h-[72%] w1920:h-[94%]" to="/refer" />
            </div>
          </div>
          <WinsStrip onPlay={setOpen} loading={state === 'loading'} />
          <Games filter={filter} onFilter={pick} state={state} onPlay={setOpen} />
          <BetsBoard onPlay={setOpen} state={state} />
        </main>
        <aside aria-label="Chest and chat" className="sticky top-[100px] flex h-[calc(100vh-116px)] min-h-[640px] w-[300px] shrink-0 flex-col gap-4">
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
              <KitButton tone="primary" onClick={() => setJoined(true)}>
                Join the giveaway
              </KitButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
