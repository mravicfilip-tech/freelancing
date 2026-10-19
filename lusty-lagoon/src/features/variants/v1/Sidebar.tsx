import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CaretRight, Fire, Headset, Question, UserPlus, Wallet } from '@phosphor-icons/react';
import { useWallet } from '../../wallet/store';
import { GIVEAWAY } from '../../lobby/data';
import { cn } from '../../../lib/cn';
import type { CatalogueGame } from '../../../data/games';
import { KitButton } from '../kit/parts';
import { CoinIcon, Label } from './ui';
import { ORIGINALS } from './data';
import { NAV, countOf, type Filter } from './nav';

// The sidebar after Snegbet, a column of panels on the ground. The four promo tiles, the row of five
// picks with NEW and hot badges, a quiet nav list with a clear active row, the grouped panel with
// colour icons and chevrons, and the hot streak card.

type Hue = 'gold' | 'blue' | 'pink' | 'green';

function Promo({ hue, label, art, artClass, onClick, to }: { hue: Hue; label: [string, string]; art: string; artClass?: string; onClick?: () => void; to?: string }) {
  const cls = cn('n1-promo n1-ring group relative flex h-[64px] overflow-hidden rounded-[14px] text-left w1920:h-[72px]', `n1-hue-${hue}`);
  const inner = (
    <>
      <span className="relative z-10 flex flex-col justify-center pl-3 text-14 font-extrabold leading-[17px] text-ink">
        <span>{label[0]}</span>
        <span>{label[1]}</span>
      </span>
      <img src={art} alt="" className={cn('n1-zoom pointer-events-none absolute -right-2 top-1/2 h-[64px] w-auto -translate-y-1/2 object-contain', artClass)} />
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function NavRow({ icon, label, active, badge, onClick }: { icon: ReactNode; label: string; active?: boolean; badge?: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'n1-ring flex h-10 w-full items-center gap-3 rounded-[12px] border pl-[6px] pr-3 text-14 font-bold transition-colors',
        active ? 'border-[var(--n-edge-hi)] bg-[rgb(var(--n-raised))] text-ink' : 'border-transparent text-[rgb(var(--n-muted))] hover:bg-white/[0.04] hover:text-ink',
      )}
    >
      <span className={cn('flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] [&>svg]:h-4 [&>svg]:w-4', active ? 'n1-keysq text-ink' : 'text-[rgb(var(--n-dim))]')}>{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      {badge}
    </button>
  );
}

function GroupRow({ to, icon, color, label, badge }: { to: string; icon: ReactNode; color: string; label: string; badge?: ReactNode }) {
  return (
    <Link to={to} className="n1-ring group flex h-11 items-center gap-3 rounded-[10px] px-2 text-14 font-bold text-ink transition-colors hover:bg-white/[0.05]">
      <span className="flex h-6 w-6 items-center justify-center [&>svg]:h-[22px] [&>svg]:w-[22px]" style={{ color }}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge}
      <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/[0.07] text-[rgb(var(--n-muted))] transition-colors group-hover:bg-white/[0.12] group-hover:text-ink">
        <CaretRight weight="bold" className="h-[12px] w-[12px]" aria-hidden />
      </span>
    </Link>
  );
}

export function Sidebar({ filter, onFilter, onPlay, onChest, onRank, onGiveaway, joined }: { filter: Filter; onFilter: (f: Filter) => void; onPlay: (g: CatalogueGame) => void; onChest: () => void; onRank: () => void; onGiveaway: () => void; joined: boolean }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  // Never clips and never scrolls inside itself. It sticks under the top bar, and when it is taller
  // than the window it sticks by its bottom edge so every row can be reached.
  const ref = useRef<HTMLElement>(null);
  const [top, setTop] = useState(88);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setTop(Math.min(88, Math.round(window.innerHeight - el.offsetHeight - 16)));
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
    <aside ref={ref} aria-label="Sidebar" style={{ top }} className="sticky flex w-[240px] shrink-0 flex-col gap-3 self-start w1920:w-[264px]">
      <div className="grid grid-cols-2 gap-2">
        <Promo hue="gold" label={['Daily', 'chest']} art="/art/lobby/giveaway-chest.webp" artClass="h-[58px] w1920:h-[64px]" onClick={onChest} />
        <Promo hue="blue" label={['Rank', 'road']} art="/brand/rank-bronze.png" artClass="h-[48px] right-1 w1920:h-[52px]" onClick={onRank} />
        <Promo hue="pink" label={['Hot', 'streak']} art="/art/landing/slot-machine.webp" artClass="h-[62px] right-1 top-[56%] w1920:h-[68px]" onClick={onGiveaway} />
        <Promo hue="green" label={['Refer', 'friends']} art="/art/money/refer-megaphone.webp" artClass="h-[64px] top-[58%] w1920:h-[72px]" to="/refer" />
      </div>

      <section aria-labelledby="n1-picks" className="n1-panel rounded-[16px] p-3">
        <Label id="n1-picks">Lagoon picks</Label>
        <ul className="mt-3 grid grid-cols-5 gap-[6px]">
          {ORIGINALS.map(({ game, badge }) => (
            <li key={game.id} className="relative">
              <button type="button" onClick={() => onPlay(game)} aria-label={`Play ${game.name}${badge === 'new' ? ', new' : badge === 'hot' ? ', hot' : ''}`} className="n1-ring group relative block aspect-square w-full overflow-hidden rounded-[10px] ring-1 ring-inset ring-white/10">
                <img src={game.image} alt="" className="h-full w-full scale-[1.35] object-cover object-[50%_18%] transition-transform duration-500 group-hover:scale-[1.45]" />
                <span aria-hidden className="absolute inset-0 rounded-[10px] ring-1 ring-inset ring-white/10 transition group-hover:ring-2 group-hover:ring-[#B47CFF]" />
              </button>
              {badge === 'new' && <span aria-hidden className="pointer-events-none absolute -top-[7px] left-1/2 -translate-x-1/2 rounded-[6px] bg-[#2F7BFF] px-1 text-12 font-extrabold leading-4 text-ink">NEW</span>}
              {badge === 'hot' && (
                <span aria-hidden className="pointer-events-none absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#FF5A1F] text-ink ring-2 ring-[rgb(var(--n-panel))]">
                  <Fire weight="fill" className="h-[12px] w-[12px]" />
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Games" className="n1-panel flex flex-col gap-[2px] rounded-[16px] p-2">
        <Label className="px-2 pb-2 pt-1">Games</Label>
        {NAV.map((n) => (
          <NavRow key={n.value} icon={n.icon} label={n.label} active={filter === n.value} onClick={() => onFilter(n.value)} badge={<span className="num text-12 font-bold text-[rgb(var(--n-dim))]">{countOf(n.value)}</span>} />
        ))}
      </nav>

      <nav aria-label="Account" className="n1-group flex flex-col rounded-[16px] p-2">
        <GroupRow
          to="/wallet/deposit"
          icon={<Wallet weight="fill" />}
          color="#5CC8FF"
          label="Wallet"
          badge={
            pending > 0 ? (
              <span className="num flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-[6px] text-12 font-extrabold text-on-gold">
                {pending}
                <span className="sr-only"> pending</span>
              </span>
            ) : undefined
          }
        />
        <span aria-hidden className="mx-2 h-px bg-white/[0.06]" />
        <GroupRow to="/agent" icon={<Headset weight="fill" />} color="#B794FF" label="Send to agent" />
        <span aria-hidden className="mx-2 h-px bg-white/[0.06]" />
        <GroupRow to="/refer" icon={<UserPlus weight="fill" />} color="#FF8FC2" label="Refer a friend" />
        <span aria-hidden className="mx-2 h-px bg-white/[0.06]" />
        <GroupRow to="/faq" icon={<Question weight="fill" />} color="#7DE3C4" label="FAQ" />
      </nav>

      <section aria-labelledby="n1-streak" className="n1-panel relative overflow-hidden rounded-[16px] p-4">
        <span aria-hidden className="pointer-events-none absolute -right-[40px] -top-[60px] h-[180px] w-[180px] rounded-full bg-[radial-gradient(closest-side,rgb(255_120_40/0.32),transparent)]" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#FF9A40,#F2620C)] text-[#2A1200] shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]">
            <Fire weight="fill" className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col">
            <span id="n1-streak" className="text-14 font-extrabold text-ink">
              Hot streak giveaway
            </span>
            <span className="text-12 font-semibold text-[rgb(var(--n-muted))]">Draw {GIVEAWAY.ends}</span>
          </span>
        </div>
        <div className="relative mt-4 flex items-end justify-between">
          <span className="flex flex-col gap-1">
            <span className="n1-label">Prize pool</span>
            <span className="num flex items-center gap-2 text-20 font-extrabold text-gold">
              <CoinIcon id="btc" size={20} />
              {GIVEAWAY.pool} BTC
            </span>
          </span>
          <span className="num pb-[2px] text-12 font-bold text-[rgb(var(--n-muted))]">{joined ? '1 entry' : '10 winners'}</span>
        </div>
        <KitButton tone="purple" size="md" onClick={onGiveaway} className="relative mt-4 h-[48px] w-full">
          {joined ? 'You are in' : 'Join the draw'}
        </KitButton>
      </section>
    </aside>
  );
}
