import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CaretDown, CaretRight, Cherries, Coins, Crown, Fish, Gift, Headset, Lightning, MagnifyingGlass, Question, Sparkle, SquaresFour, Timer, Trophy, UserPlus, Wallet } from '@phosphor-icons/react';
import { useWallet } from '../../wallet/store';
import { ACCOUNT } from '../../../data/wallet';
import { formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { DAILY_CHEST, useCountdown } from '../shared/data';
import { countOf, type Filter } from './data';

// The sidebar after Betsera. Search, four vivid promo tiles, nav groups in boxes on the ground, and a
// VIP card at the foot. The active row is a solid lit purple pill.

export const NAV: { value: Filter; label: string; icon: ReactNode }[] = [
  { value: 'all', label: 'Lobby', icon: <SquaresFour weight="fill" /> },
  { value: 'slots', label: 'Slots', icon: <Cherries weight="fill" /> },
  { value: 'megaways', label: 'Megaways', icon: <Lightning weight="fill" /> },
  { value: 'hold-and-win', label: 'Hold and win', icon: <Coins weight="fill" /> },
  { value: 'fish', label: 'Fish games', icon: <Fish weight="fill" /> },
  { value: 'new', label: 'New', icon: <Sparkle weight="fill" /> },
];

type Promo = { label: [string, string]; hue: string; art: ReactNode; run?: () => void; to?: string; caret?: boolean };

function PromoTile({ p }: { p: Promo }) {
  const cls = cn('m2-tile m2-hue group relative block h-[80px] overflow-hidden rounded-[20px] text-left outline-none [--lx:80%] [--ly:64%] focus-visible:ring-2 focus-visible:ring-[#B47CFF]', p.hue);
  const inner = (
    <>
      <span className="absolute left-3 top-[10px] z-10 flex flex-col text-14 font-extrabold leading-4 text-ink">
        <span>{p.label[0]}</span>
        <span>{p.label[1]}</span>
      </span>
      <span aria-hidden className="m2-obj pointer-events-none absolute inset-0">
        {p.art}
      </span>
      {p.caret !== false && (
        <span aria-hidden className="absolute bottom-2 left-3 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-ink">
          <CaretRight weight="bold" className="h-[12px] w-[12px]" />
        </span>
      )}
    </>
  );
  if (p.to)
    return (
      <Link to={p.to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={p.run} className={cls}>
      {inner}
    </button>
  );
}

function Row({ icon, label, active, badge, onClick, to }: { icon: ReactNode; label: string; active?: boolean; badge?: ReactNode; onClick?: () => void; to?: string }) {
  const cls = cn(
    'flex h-10 w-full items-center gap-3 rounded-full px-3 text-14 font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#B47CFF]',
    active ? 'm2-nav-on' : 'text-[rgb(var(--m2-ink2))] hover:bg-[rgb(var(--m2-raised))] hover:text-ink',
  );
  const inner = (
    <>
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]', active ? 'text-ink' : 'text-[rgb(var(--m2-ink3))]')}>{icon}</span>
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {badge}
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" aria-current={active ? 'page' : undefined} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function Group({ icon, label, open, onToggle, children }: { icon: ReactNode; label: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  const id = `m2-group-${label.toLowerCase().replace(/\s/g, '-')}`;
  return (
    <div className="m2-box rounded-[20px] p-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex h-10 w-full items-center gap-3 rounded-full pl-3 pr-2 text-left text-14 font-bold text-ink outline-none hover:bg-[rgb(var(--m2-raised))] focus-visible:ring-2 focus-visible:ring-[#B47CFF]"
      >
        <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
        <span className="flex-1">{label}</span>
        <CaretDown weight="bold" className={cn('h-4 w-4 text-[rgb(var(--m2-ink3))] transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div id={id} className="mt-1 flex flex-col gap-1 border-t border-white/[0.06] pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

function VipCard({ onOpen }: { onOpen: () => void }) {
  const r = ACCOUNT.rank;
  const pct = Math.round((r.points / r.nextAt) * 100);
  return (
    <section aria-labelledby="m2-vip" className="m2-tile m2-hue m2-hue-vip relative shrink-0 [--lx:88%] [--ly:4%] overflow-hidden rounded-[24px] p-4 pt-3">
      <img src="/brand/rank-bronze.png" alt="" className="pointer-events-none absolute -right-2 -top-1 w-[88px]" />
      <p className="text-12 font-bold uppercase tracking-[0.08em] text-ink/80">VIP club</p>
      <h2 id="m2-vip" className="mt-1 w-[120px] text-20 font-black uppercase leading-[22px] tracking-[-0.01em] text-ink">
        {r.name} to {r.next}
      </h2>
      <div className="mt-4 flex items-baseline justify-between text-12 font-semibold">
        <span className="num text-ink">{formatPoints(r.points)} pts</span>
        <span className="num text-ink/80">{pct}%</span>
      </div>
      <span role="img" aria-label={`${pct} percent of the way to ${r.next}`} className="mt-2 block h-[6px] w-full overflow-hidden rounded-full bg-black/35">
        <span className="block h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
      </span>
      <p className="num mt-2 text-12 font-semibold text-ink/80">{formatPoints(r.nextAt - r.points)} pts to {r.next}</p>
      <button
        type="button"
        onClick={onOpen}
        className="m2-quiet mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full text-14 outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        See rewards
        <CaretRight weight="bold" className="h-4 w-4 text-ink/70" aria-hidden />
      </button>
    </section>
  );
}

export function Sidebar({ filter, onFilter, onSearch, onOpen }: { filter: Filter; onFilter: (f: Filter) => void; onSearch: (q: string) => void; onOpen: (d: 'giveaway' | 'chest' | 'race' | 'vip') => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState({ casino: true, rewards: false, money: false });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(q);
  };
  // The sidebar never clips. It sticks under the top bar, and when it is taller than the window it
  // sticks by its bottom edge so every row can be reached.
  const ref = useRef<HTMLElement>(null);
  const [top, setTop] = useState(96);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setTop(Math.min(96, Math.round(window.innerHeight - el.offsetHeight - 16)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);
  const chest = useCountdown(DAILY_CHEST.readyInSeconds);
  const promos: Promo[] = [
    { label: ['Hot', 'streak'], hue: 'm2-hue-ember', art: <img src="/art/auth/login-player.webp" alt="" className="absolute -right-[14px] top-[6px] h-[148px] w-auto max-w-none" />, run: () => onOpen('giveaway') },
    {
      label: ['Daily', 'chest'],
      hue: 'm2-hue-amber',
      // Betsera's Promo tile shows its 10% as the art. This one shows the chest's own countdown.
      art: (
        <span className="absolute bottom-[8px] left-2 flex h-[26px] items-center gap-1 rounded-full bg-black/40 pl-[6px] pr-[10px] text-ink">
          <Timer weight="fill" className="h-4 w-4 text-gold" />
          <span className="num text-14 font-black tracking-[-0.01em]">
            {chest.pad(chest.h)}:{chest.pad(chest.m)}:{chest.pad(chest.s)}
          </span>
        </span>
      ),
      run: () => onOpen('chest'),
      caret: false,
    },
    { label: ['Weekly', 'race'], hue: 'm2-hue-blue', art: <img src="/art/landing/pillar-gems-b.webp" alt="" className="absolute right-0 top-[8px] h-[120px] w-auto rotate-[14deg]" />, run: () => onOpen('race') },
    { label: ['Refer', 'friends'], hue: 'm2-hue-green', art: <img src="/art/money/refer-megaphone.webp" alt="" className="absolute -right-[16px] top-[8px] h-[96px] w-auto max-w-none" />, to: '/refer' },
  ];
  return (
    <aside ref={ref} aria-label="Site" style={{ top }} className="sticky flex w-[232px] shrink-0 flex-col gap-3 self-start">
      <form role="search" onSubmit={submit} className="m2-box flex h-11 items-center gap-2 rounded-full pl-4 pr-1 focus-within:ring-2 focus-within:ring-[#B47CFF]">
        <MagnifyingGlass weight="bold" className="h-4 w-4 shrink-0 text-[rgb(var(--m2-ink3))]" aria-hidden />
        <label htmlFor="m2-side-search" className="sr-only">
          Search games
        </label>
        <input
          id="m2-side-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search games"
          className="h-full min-w-0 flex-1 bg-transparent text-14 font-semibold text-ink outline-none placeholder:text-[rgb(var(--m2-ink3))]"
        />
      </form>
      <div className="grid grid-cols-2 gap-2">
        {promos.map((p) => (
          <PromoTile key={p.label.join(' ')} p={p} />
        ))}
      </div>
      <nav aria-label="Games and account" className="flex flex-col gap-2">
        <Group icon={<Cherries weight="fill" className="text-[#C9A2FF]" />} label="Casino" open={open.casino} onToggle={() => setOpen((o) => ({ ...o, casino: !o.casino }))}>
          {NAV.map((n) => (
            <Row
              key={n.value}
              icon={n.icon}
              label={n.label}
              active={filter === n.value}
              onClick={() => onFilter(n.value)}
              badge={<span className={cn('num text-12 font-semibold', filter === n.value ? 'text-ink/80' : 'text-[rgb(var(--m2-ink3))]')}>{countOf(n.value)}</span>}
            />
          ))}
        </Group>
        <Group icon={<Crown weight="fill" className="text-gold" />} label="Rewards" open={open.rewards} onToggle={() => setOpen((o) => ({ ...o, rewards: !o.rewards }))}>
          <Row icon={<Gift weight="fill" />} label="Daily chest" onClick={() => onOpen('chest')} />
          <Row icon={<Trophy weight="fill" />} label="Weekly race" onClick={() => onOpen('race')} />
          <Row icon={<Lightning weight="fill" />} label="Hot streak" onClick={() => onOpen('giveaway')} />
        </Group>
        <Group icon={<Wallet weight="fill" className="text-[#5FF0A0]" />} label="Wallet" open={open.money} onToggle={() => setOpen((o) => ({ ...o, money: !o.money }))}>
          <Row
            to="/wallet/deposit"
            icon={<Wallet weight="fill" />}
            label="Deposit and withdraw"
            badge={
              pending > 0 ? (
                <span className="num flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-[6px] text-12 font-bold text-on-gold">
                  {pending}
                  <span className="sr-only"> pending</span>
                </span>
              ) : undefined
            }
          />
          <Row to="/agent" icon={<Headset weight="fill" />} label="Send to agent" />
          <Row to="/refer" icon={<UserPlus weight="fill" />} label="Refer a friend" />
          <Row to="/faq" icon={<Question weight="fill" />} label="Help and FAQ" />
        </Group>
      </nav>
      <VipCard onOpen={() => onOpen('vip')} />
    </aside>
  );
}
