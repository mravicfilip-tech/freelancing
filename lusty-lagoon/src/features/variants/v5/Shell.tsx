import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as M from '@radix-ui/react-dropdown-menu';
import * as P from '@radix-ui/react-popover';
import { Bell, Broadcast, CaretDown, Gear, Headset, House, MagnifyingGlass, Question, SignOut, SquaresFour, UserCircle, UserPlus, Wallet } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { NotificationsPanel, useUnreadCount } from '../../account';
import { ACCOUNT } from '../../../data/wallet';
import { RANKS, shortPoints } from '../../../data/ranks';
import { formatPoints } from '../../../lib/format';
import { cn } from '../../../lib/cn';
import { useWallet } from '../../wallet/store';
import { ONLINE_NOW } from '../shared/data';
import { BalanceMenu } from './BalanceMenu';

// The shell. A top bar with no fill of its own, frosted only where the page slides under it, the
// trading shot's right cluster of the online count, a bell circle and the account pill. A full
// labelled glass sidebar, four promo tiles, three nav groups and the rank card.

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07060B]';

function SearchPill({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  // Slash jumps to the search from anywhere outside a field, as the hint in the pill says.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <form role="search" onSubmit={submit} className="gv-pill flex h-[48px] min-w-[220px] max-w-[400px] flex-1 items-center gap-3 rounded-full px-[18px] focus-within:ring-2 focus-within:ring-[#B47CFF]">
      <MagnifyingGlass weight="bold" className="h-5 w-5 shrink-0 text-[rgb(var(--gv-ink-2))]" aria-hidden />
      <label htmlFor="v5-search" className="sr-only">
        Search games or providers
      </label>
      <input
        ref={input}
        id="v5-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search games or providers"
        className="h-full min-w-0 flex-1 bg-transparent text-14 font-medium text-white outline-none placeholder:text-[rgb(var(--gv-ink-3))]"
      />
      <kbd aria-hidden className="gv-well hidden h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-12 font-semibold text-[rgb(var(--gv-ink-3))] w1440:flex">/</kbd>
    </form>
  );
}

function BellCircle() {
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  return (
    <P.Root open={open} onOpenChange={setOpen}>
      <P.Trigger aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className={cn('gv-pill relative flex h-[48px] w-[48px] items-center justify-center rounded-full text-[rgb(var(--gv-ink-2))] hover:text-white data-[state=open]:text-white', FOCUS)}>
        <Bell weight="regular" className="h-5 w-5" aria-hidden />
        {unread > 0 && <span aria-hidden className="absolute right-[12px] top-[11px] h-[8px] w-[8px] rounded-full bg-[#FF7A1A] ring-2 ring-[#07060B]" />}
      </P.Trigger>
      <P.Portal>
        <P.Content align="end" sideOffset={10} className="z-30 overflow-hidden rounded-[22px] border border-white/10 bg-[#15131C] shadow-[0_24px_64px_rgb(0_0_0/0.6)] outline-none">
          <NotificationsPanel
            onNavigate={(to) => {
              setOpen(false);
              navigate(to);
            }}
          />
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}

const MENU = 'z-30 min-w-[240px] rounded-[20px] border border-white/10 bg-[#15131C]/95 p-2 shadow-[0_24px_64px_rgb(0_0_0/0.6)] backdrop-blur-[24px]';
const ITEM = 'flex h-11 cursor-pointer select-none items-center gap-3 rounded-full px-4 text-14 font-medium text-white outline-none data-[highlighted]:bg-white/[0.07] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[rgb(var(--gv-ink-2))]';

function AccountPill() {
  const navigate = useNavigate();
  return (
    <M.Root>
      <M.Trigger aria-label={`Account menu, ${ACCOUNT.name}`} className={cn('gv-pill group flex h-[48px] items-center gap-3 rounded-full pl-[6px] pr-4 data-[state=open]:bg-white/[0.08]', FOCUS)}>
        <img src="/art/avatars/john.webp" alt="" className="h-9 w-9 rounded-full object-cover" />
        <span className="flex flex-col items-start whitespace-nowrap leading-none">
          <span className="text-14 font-semibold text-white">{ACCOUNT.name}</span>
          <span className="mt-[3px] text-12 font-medium text-[rgb(var(--gv-ink-3))]">{ACCOUNT.rank.name} rank</span>
        </span>
        <CaretDown weight="bold" className="ml-1 h-4 w-4 text-[rgb(var(--gv-ink-2))] transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
      </M.Trigger>
      <M.Portal>
        <M.Content align="end" sideOffset={10} className={MENU}>
          <M.Item onSelect={() => navigate('/account')} className={ITEM}>
            <Gear aria-hidden />
            Account settings
          </M.Item>
          <M.Item onSelect={() => navigate('/wallet/deposit')} className={ITEM}>
            <Wallet aria-hidden />
            Wallet
          </M.Item>
          <M.Item onSelect={() => navigate('/refer')} className={ITEM}>
            <UserPlus aria-hidden />
            Refer a friend
          </M.Item>
          <M.Separator className="mx-3 my-2 h-px bg-white/[0.08]" />
          <M.Item onSelect={() => navigate('/login')} className={ITEM}>
            <SignOut aria-hidden />
            Log out
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

/** The top bar. Once the balance card leaves the screen, a compact balance pill and the Deposit key fade in. */
export function TopBar({ query, onQuery, onSearch, showBalance }: { query: string; onQuery: (q: string) => void; onSearch: () => void; showBalance: boolean }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 flex h-[80px] items-center gap-6 px-6 [-webkit-backdrop-filter:blur(24px)] [backdrop-filter:blur(24px)] [background:linear-gradient(180deg,rgb(7_6_11/0.92),rgb(7_6_11/0.7))]">
      <div className="flex w-[248px] shrink-0 items-center pl-4">
        <Link to="/variants/5" aria-label="Lusty Lagoon, lobby" className={cn('rounded-[8px]', FOCUS)}>
          <Logo className="text-[20px] leading-[22px]" />
        </Link>
      </div>
      <SearchPill value={query} onChange={onQuery} onSubmit={onSearch} />
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {showBalance && (
          <div className="gv-fade flex items-center gap-3">
            <BalanceMenu variant="pill" />
            <button type="button" onClick={() => navigate('/wallet/deposit')} className={cn('k-key k-key-pill inline-flex h-[48px] items-center justify-center px-6 text-16', FOCUS)}>
              Deposit
            </button>
            <span aria-hidden className="mx-1 h-6 w-px bg-white/10" />
          </div>
        )}
        <div className="gv-pill flex h-[48px] items-center gap-2 rounded-full px-4">
          <span aria-hidden className="gv-live" />
          <span className="num text-14 font-semibold text-white">{ONLINE_NOW.toLocaleString('en-US')}</span>
          <span className="text-14 font-medium text-[rgb(var(--gv-ink-2))]">online</span>
        </div>
        <BellCircle />
        <AccountPill />
      </div>
    </header>
  );
}

type Tile = { label: [string, string]; art: string; artClass: string; hue: string; to?: string; onClick?: () => void };

function PromoTile({ t }: { t: Tile }) {
  const cls = cn('gv-glass gv-edge gv-hover group relative flex h-[68px] overflow-hidden rounded-2xl text-left', FOCUS);
  const inner = (
    <>
      <span aria-hidden className="gv-light" style={{ backgroundImage: `radial-gradient(90% 120% at 100% 100%, rgb(${t.hue} / 0.32), rgb(${t.hue} / 0.08) 55%, rgb(${t.hue} / 0) 80%)` }} />
      <span aria-hidden className="gv-seg" style={{ bottom: 0, left: '35%', width: '60%', background: `linear-gradient(90deg, rgb(${t.hue} / 0), rgb(${t.hue} / 0.8), rgb(${t.hue} / 0))` }} />
      <span className="relative z-10 flex flex-col justify-center pl-3 text-14 font-semibold leading-[17px] text-white">
        <span>{t.label[0]}</span>
        <span>{t.label[1]}</span>
      </span>
      <img src={t.art} alt="" className={cn('pointer-events-none absolute object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]', t.artClass)} />
    </>
  );
  if (t.to)
    return (
      <Link to={t.to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={t.onClick} className={cls}>
      {inner}
    </button>
  );
}

function NavRow({ to, icon, iconOn, label, active, badge, onClick }: { to?: string; icon: ReactNode; iconOn?: ReactNode; label: string; active?: boolean; badge?: ReactNode; onClick?: () => void }) {
  const cls = cn(
    'flex h-11 w-full items-center gap-3 rounded-full px-4 text-16 font-medium transition-colors duration-200',
    FOCUS,
    active ? 'gv-on text-white' : 'text-[rgb(var(--gv-ink-2))] hover:bg-white/[0.04] hover:text-white',
  );
  const inner = (
    <>
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5', active && 'text-[rgb(var(--gv-violet))]')}>{active && iconOn ? iconOn : icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      {badge}
    </>
  );
  if (to)
    return (
      <Link to={to} aria-current={active ? 'page' : undefined} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label} className="flex flex-col gap-1">
      <p className="px-4 pb-1 text-12 font-semibold uppercase tracking-[0.08em] text-[rgb(var(--gv-ink-3))]">{label}</p>
      {children}
    </nav>
  );
}

function RankCard() {
  const r = ACCOUNT.rank;
  const pct = Math.round((r.points / r.nextAt) * 100);
  const next = RANKS.find((x) => x.name === r.next)!;
  return (
    <Link to="/account" className={cn('gv-well group flex flex-col gap-3 rounded-2xl p-4 transition-colors hover:bg-white/[0.05]', FOCUS)}>
      <span className="flex items-center gap-3">
        <img src="/brand/rank-bronze.png" alt="" className="h-10 w-10 object-contain" />
        <span className="flex min-w-0 flex-col">
          <span className="text-16 font-semibold leading-5 text-white">{r.name}</span>
          <span className="num text-12 font-medium text-[rgb(var(--gv-ink-3))]">
            {shortPoints(r.points)} of {shortPoints(r.nextAt)} points
          </span>
        </span>
        <span className="num ml-auto text-14 font-semibold text-[rgb(var(--gv-violet))]">{pct}%</span>
      </span>
      <span className="block h-[6px] overflow-hidden rounded-full bg-white/[0.08]" role="progressbar" aria-label={`Rank progress to ${r.next}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span className="block h-full rounded-full bg-[#9A4BFF]" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-12 font-medium text-[rgb(var(--gv-ink-3))]">
        <span className="num text-white">{formatPoints(next.from - r.points)}</span> points to {r.next}
      </span>
    </Link>
  );
}

export function Sidebar({ onJump, onRace, onGiveaway }: { onJump: (id: string) => void; onRace: () => void; onGiveaway: () => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  const tiles: Tile[] = [
    { label: ['Weekly', 'race'], art: '/art/landing/slot-machine.webp', artClass: 'right-[6px] top-1/2 h-[58px] -translate-y-1/2', hue: '141 38 231', onClick: onRace },
    { label: ['Hot', 'streak'], art: '/art/lobby/giveaway-chest.webp', artClass: 'right-[2px] top-1/2 h-[56px] -translate-y-1/2', hue: '245 166 35', onClick: onGiveaway },
    { label: ['Refer', 'friends'], art: '/art/money/refer-megaphone.webp', artClass: 'right-[2px] top-[6px] h-[60px]', hue: '56 238 89', to: '/refer' },
    { label: ['Gift', 'cards'], art: '/art/landing/pillar-gems-b.webp', artClass: 'right-[14px] top-1/2 h-[58px] -translate-y-1/2', hue: '59 130 246', to: '/wallet/gift-card' },
  ];
  return (
    <aside className="gv-glass gv-edge gv-noscroll sticky top-[88px] flex h-[calc(100vh-112px)] w-[248px] shrink-0 flex-col gap-4 overflow-y-auto rounded-3xl p-3">
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <PromoTile key={t.label.join(' ')} t={t} />
        ))}
      </div>
      <Group label="Play">
        <NavRow to="/variants/5" active icon={<House />} iconOn={<House weight="fill" />} label="Lobby" />
        <NavRow icon={<Broadcast />} label="Live wagers" onClick={() => onJump('wagers')} />
        <NavRow icon={<SquaresFour />} label="All games" onClick={() => onJump('games')} />
      </Group>
      <Group label="Money">
        <NavRow
          to="/wallet/deposit"
          icon={<Wallet />}
          label="Wallet"
          badge={
            pending > 0 ? (
              <span className="num flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#F4D543] px-[7px] text-12 font-bold text-[#1A0F2B]">
                {pending}
                <span className="sr-only"> pending</span>
              </span>
            ) : undefined
          }
        />
        <NavRow to="/agent" icon={<Headset />} label="Send to agent" />
        <NavRow to="/refer" icon={<UserPlus />} label="Refer a friend" />
      </Group>
      <Group label="Help">
        <NavRow to="/faq" icon={<Question />} label="FAQ" />
        <NavRow to="/account" icon={<UserCircle />} label="Account" />
      </Group>
      <div className="mt-auto">
        <RankCard />
      </div>
    </aside>
  );
}
