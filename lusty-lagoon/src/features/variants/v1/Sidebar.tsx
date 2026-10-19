import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CaretRight, Fire, Headset, Question, UserPlus, Wallet } from '@phosphor-icons/react';
import { useWallet } from '../../wallet/store';
import { GIVEAWAY } from '../../lobby/data';
import { cn } from '../../../lib/cn';
import type { CatalogueGame } from '../../../data/games';
import { CoinIcon, Key, Label } from './ui';
import { ORIGINALS } from './data';
import { NAV, countOf, type Filter } from './nav';

// The sidebar, round 6, rebuilt from Filip's references (note 12). Turbo Bet's promo tiles, a dark
// panel that turns into one vivid hue under large art. Snegbet's first panel, the picks row with NEW
// and hot badges over Turbo Bet's Games list, every row its own faint pill and the active row lit
// from the left. Snegbet's grouped panel with colour icons and chevrons. Turbo Bet's bottom promo
// card for the hot streak giveaway, the chest breaking out of the card. Round 7 sets its title in the
// page's one heading style, Bai Jamjuree 700 in sentence case (note 2), and the row chevrons nudge on
// hover (note 11).

type Hue = 'ember' | 'blue' | 'purple' | 'green';

function Promo({ hue, label, art, artClass, onClick, to }: { hue: Hue; label: [string, string]; art: string; artClass: string; onClick?: () => void; to?: string }) {
  const cls = cn('n1-promo n1-ring group flex h-[72px] overflow-hidden rounded-[14px] text-left w1920:h-[80px]', `n1-hue-${hue}`);
  const inner = (
    <>
      <span className="relative z-10 flex flex-col justify-center pl-3 text-14 font-extrabold leading-[17px] tracking-[-0.01em] text-ink">
        <span>{label[0]}</span>
        <span>{label[1]}</span>
      </span>
      <img src={art} alt="" className={cn('n1-zoom pointer-events-none absolute max-w-none select-none object-contain drop-shadow-[0_6px_10px_rgb(0_0_0/0.35)]', artClass)} />
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

function NavRow({ icon, label, count, active, onClick }: { icon: ReactNode; label: string; count: number; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn('n1-ring flex h-10 w-full items-center gap-3 rounded-[12px] pl-3 pr-2 text-14 font-semibold', active ? 'n1-row-on text-ink' : 'n1-row text-[rgb(var(--n-muted))] hover:text-ink')}
    >
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]', active ? 'text-[rgb(var(--n-lilac))]' : 'text-[rgb(var(--n-dim))]')}>{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      <span className={cn('num flex h-6 min-w-[28px] items-center justify-center rounded-full px-2 text-12 font-bold', active ? 'bg-white/[0.1] text-ink' : 'text-[rgb(var(--n-dim))]')}>{count}</span>
    </button>
  );
}

function GroupRow({ to, icon, hue, label, badge }: { to: string; icon: ReactNode; hue: string; label: string; badge?: ReactNode }) {
  return (
    <Link to={to} className="n1-ring group flex h-11 items-center gap-3 rounded-[10px] px-2 text-14 font-semibold text-ink transition-colors hover:bg-white/[0.05]">
      <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] [&>svg]:h-4 [&>svg]:w-4" style={{ color: `rgb(${hue})`, background: `rgb(${hue} / 0.14)` }}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge}
      <span data-icon="arrow" className="k-hov-icon flex h-6 w-6 items-center justify-center rounded-[6px] bg-white/[0.06] text-[rgb(var(--n-muted))] transition-colors group-hover:bg-white/[0.12] group-hover:text-ink">
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
        <Promo hue="ember" label={['Daily', 'chest']} art="/art/lobby/giveaway-chest.webp" artClass="-bottom-[10px] -right-[12px] h-[76px] w1920:h-[84px]" onClick={onChest} />
        <Promo hue="blue" label={['Rank', 'road']} art="/brand/rank-bronze.png" artClass="-bottom-[8px] -right-[6px] h-[64px] rotate-[8deg] w1920:h-[72px]" onClick={onRank} />
        <Promo hue="purple" label={['Hot', 'streak']} art="/art/landing/slot-machine.webp" artClass="-bottom-[16px] right-[2px] h-[84px] w1920:h-[94px]" onClick={onGiveaway} />
        <Promo hue="green" label={['Refer', 'friends']} art="/art/money/refer-megaphone.webp" artClass="-bottom-[22px] -right-[8px] h-[96px] w1920:h-[108px]" to="/refer" />
      </div>

      <div className="n1-panel n1-top flex flex-col gap-4 rounded-[16px] p-3">
        <section aria-labelledby="n1-picks" className="flex flex-col gap-3">
          <Label id="n1-picks" className="px-1">
            Lagoon picks
          </Label>
          <ul className="grid grid-cols-5 gap-[6px]">
            {ORIGINALS.map(({ game, badge }) => (
              <li key={game.id} className="relative">
                <button type="button" onClick={() => onPlay(game)} aria-label={`Play ${game.name}${badge === 'new' ? ', new' : badge === 'hot' ? ', hot' : ''}`} className="n1-ring group relative block aspect-square w-full overflow-hidden rounded-[10px]">
                  <img src={game.image} alt="" className="h-full w-full scale-[1.35] object-cover object-[50%_18%] transition-transform duration-500 group-hover:scale-[1.45]" />
                  <span aria-hidden className="absolute inset-0 rounded-[10px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-shadow group-hover:shadow-[inset_0_0_0_2px_#B47CFF]" />
                </button>
                {badge === 'new' && <span aria-hidden className="pointer-events-none absolute -top-[8px] left-1/2 -translate-x-1/2 rounded-[6px] bg-[#2F6FE8] px-1 text-12 font-extrabold leading-4 text-ink shadow-[0_0_0_2px_rgb(var(--n-panel))]">NEW</span>}
                {badge === 'hot' && (
                  <span aria-hidden className="pointer-events-none absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[linear-gradient(180deg,#FF8A3D,#E8430F)] text-ink shadow-[0_0_0_2px_rgb(var(--n-panel))]">
                    <Fire weight="fill" className="h-[12px] w-[12px]" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
        <nav aria-labelledby="n1-games-nav" className="flex flex-col gap-1">
          <Label id="n1-games-nav" className="px-1 pb-1">
            Games
          </Label>
          {NAV.map((n) => (
            <NavRow key={n.value} icon={n.icon} label={n.label} count={countOf(n.value)} active={filter === n.value} onClick={() => onFilter(n.value)} />
          ))}
        </nav>
      </div>

      <nav aria-label="Account" className="n1-group flex flex-col rounded-[16px] p-2">
        <GroupRow
          to="/wallet/deposit"
          icon={<Wallet weight="fill" />}
          hue="92 200 255"
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
        <GroupRow to="/agent" icon={<Headset weight="fill" />} hue="190 166 255" label="Send to agent" />
        <span aria-hidden className="mx-2 h-px bg-white/[0.06]" />
        <GroupRow to="/refer" icon={<UserPlus weight="fill" />} hue="255 143 194" label="Refer a friend" />
        <span aria-hidden className="mx-2 h-px bg-white/[0.06]" />
        <GroupRow to="/faq" icon={<Question weight="fill" />} hue="125 227 196" label="FAQ" />
      </nav>

      <section aria-labelledby="n1-streak" className="n1-card-promo mt-6 rounded-[16px] p-4 pt-[20px]">
        {/* The chest breaks out of the card's top right, whole, 420 square drawn at 120. */}
        <img src="/art/lobby/giveaway-chest.webp" alt="" className="pointer-events-none absolute -top-[44px] right-1 h-[116px] w-[116px] select-none drop-shadow-[0_10px_18px_rgb(10_4_30/0.55)] w1920:-top-[50px] w1920:right-2 w1920:h-[128px] w1920:w-[128px]" />
        <p className="n1-label text-[rgb(var(--n-lilac))]">Draw {GIVEAWAY.ends.replace(' at midnight', '')}</p>
        <h2 id="n1-streak" className="mt-2 max-w-[140px] font-display text-20 font-bold leading-[22px] tracking-[-0.01em] text-ink w1920:max-w-[160px]">
          Hot streak giveaway
        </h2>
        <div className="mt-4 flex items-end justify-between">
          <span className="flex flex-col gap-1">
            <span className="text-12 font-semibold text-[rgb(var(--n-muted))]">Prize pool</span>
            <span className="num flex items-center gap-2 text-20 font-extrabold leading-6 text-ink">
              <CoinIcon id="btc" size={20} />
              {GIVEAWAY.pool} BTC
            </span>
          </span>
          <span className="num pb-[2px] text-12 font-semibold text-[rgb(var(--n-muted))]">{joined ? 'You have 1 entry' : '10 winners'}</span>
        </div>
        <Key tone="purple" size={48} onClick={onGiveaway} className="mt-4 w-full">
          {joined ? 'You are in' : 'Join the draw'}
        </Key>
      </section>
    </aside>
  );
}
