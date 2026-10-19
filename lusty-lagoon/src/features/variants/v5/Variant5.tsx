import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CatalogueGame } from '../../../data/games';
import { formatAmount } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { RACE, useVariantState } from '../shared/data';
import { Activity } from './Activity';
import { GameSheet, GlassDialog } from './Dialogs';
import { BalanceCard } from './BalanceCard';
import { QuickDeposit } from './QuickDeposit';
import { Giveaway } from './Giveaway';
import { LiveWagers } from './LiveWagers';
import { WinsFeed } from './WinsFeed';
import { AllGames, JumpBackIn } from './Games';
import { Sidebar, TopBar } from './Shell';
import { useStill } from './ui';
import './glass.css';

// Dashboard variant 5, Glass vault (round 5 direction 5). Calm, luxurious, fintech. True black with
// three soft lights fixed behind the page and frosted glass over them, after the Dribbble trading
// dashboard and task card, Player 145's glass cards and Cloudbet's edge light. The D4 order, the
// balance and Quick deposit inside one vault frame, the giveaway band, then Live wagers with Biggest
// wins level beside it, then Jump back in and All games. Eye order, the balance, Checkout, the
// giveaway.
export default function Variant5() {
  const state = useVariantState();
  const still = useStill();
  const [query, setQuery] = useState(state === 'empty' ? 'Starburst' : '');
  const [open, setOpen] = useState<CatalogueGame | null>(null);
  const [race, setRace] = useState(false);
  const [give, setGive] = useState(false);
  const [past, setPast] = useState(false);
  const games = useRef<HTMLElement>(null);
  const vault = useRef<HTMLDivElement>(null);
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Once the balance leaves the screen, the top bar carries it.
  useEffect(() => {
    const el = vault.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={cn('gv-page', still && 'gv-still')}>
      <div aria-hidden className="gv-blobs">
        <span className="gv-blob gv-blob-purple" />
        <span className="gv-blob gv-blob-ember" />
        <span className="gv-blob gv-blob-violet" />
        <span className="gv-blob gv-blob-low" />
      </div>
      <TopBar query={query} onQuery={setQuery} onSearch={() => games.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} showBalance={past} />
      <div className="flex gap-6 px-6 pb-12 pt-2">
        <Sidebar onJump={jump} onRace={() => setRace(true)} onGiveaway={() => setGive(true)} />
        <main className="flex min-w-0 flex-1 flex-col gap-12">
          <h1 className="sr-only">Lobby</h1>
          <div className="flex flex-col gap-4">
            <div ref={vault} className="gv-frame gv-edge rounded-[36px] p-3" style={{ '--gv-e': 0.7 } as CSSProperties}>
              <div className="grid grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)] gap-3 w1920:grid-cols-[minmax(0,1fr)_500px_372px]">
                <BalanceCard loading={state === 'loading'} />
                <QuickDeposit />
                <Activity className="hidden w1920:flex" />
              </div>
            </div>
            <Giveaway open={give} onOpen={setGive} />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6 w1920:grid-cols-[minmax(0,1fr)_420px]">
            <LiveWagers state={state} onPlay={setOpen} />
            <div className="relative">
              <WinsFeed state={state} onPlay={setOpen} className="absolute inset-0" />
            </div>
          </div>
          <div className="flex flex-col gap-12 w1920:grid w1920:grid-cols-[minmax(0,1fr)_420px] w1920:items-start w1920:gap-6">
            <JumpBackIn state={state} onPlay={setOpen} className="w1920:order-2" />
            <AllGames ref={games} state={state} query={query} clearQuery={() => setQuery('')} onPlay={setOpen} className="w1920:order-1" />
          </div>
        </main>
      </div>

      <GameSheet game={open} onClose={() => setOpen(null)} />
      <GlassDialog open={race} onOpenChange={setRace} title="Weekly race" description={`${formatAmount(RACE.pool, 0)} ${RACE.currency} shared by the top ten on amount played.`}>
          <ol className="flex flex-col">
            {RACE.leaders.map((l) => (
              <li key={l.place} className="flex h-[56px] items-center gap-3 border-b border-white/[0.06]">
                <span className="num flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-14 font-semibold text-white">{l.place}</span>
                <img src={l.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="flex-1 text-16 font-medium text-white">{l.player}</span>
                <span className="num text-14 text-[rgb(var(--gv-ink-2))]">{formatAmount(l.wagered, 0)} played</span>
                <span className="num w-[96px] text-right text-16 font-semibold text-white">{formatAmount(l.prize, 0)}</span>
              </li>
            ))}
          </ol>
          <p className="text-14 text-[rgb(var(--gv-ink-2))]">
            You are <span className="num font-semibold text-white">{RACE.you.place}th</span>. {formatAmount(RACE.you.toTen, 0)} USDT more played reaches the top ten.
          </p>
      </GlassDialog>
    </div>
  );
}
