import { Link } from 'react-router-dom';
import { Broadcast, Headset, House, Question, SquaresFour, UserCircle, UserPlus, Wallet } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { ACCOUNT } from '../../../data/wallet';
import { RANKS, shortPoints } from '../../../data/ranks';
import { formatPoints } from '../../../lib/format';
import { useWallet } from '../../wallet/store';
import { ONLINE_NOW } from '../shared/data';
import { NavItem, SectionLabel } from '../kit/parts';
import { BellSquare, SearchBox, UserBox } from '../kit/TopParts';

// The quiet shell. A flat sidebar panel of kit nav pills and a compact rank card, and a top bar of
// boxed items, search, the online count, the bell and the account.

export function TopBar({ query, onQuery, onSearch }: { query: string; onQuery: (q: string) => void; onSearch: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-[84px] items-center gap-4 bg-page px-4">
      <div className="flex w-[232px] shrink-0 items-center pl-3">
        <Link to="/variants/5" aria-label="Lusty Lagoon, lobby" className="rounded-lg">
          <Logo className="text-[20px] leading-[22px]" />
        </Link>
      </div>
      <SearchBox id="v5-search" value={query} onChange={onQuery} onSubmit={onSearch} placeholder="Search games or providers" className="w-[420px]" />
      <div className="ml-auto flex items-center gap-2">
        <div className="flex h-[52px] items-center gap-2 rounded-[14px] bg-[rgb(var(--k-item))] px-4">
          <span aria-hidden className="h-[8px] w-[8px] rounded-full bg-win" />
          <span className="num text-16 font-bold text-ink">{ONLINE_NOW.toLocaleString('en-US')}</span>
          <span className="text-14 font-semibold text-[rgb(var(--k-muted))]">online</span>
        </div>
        <BellSquare />
        <UserBox />
      </div>
    </header>
  );
}

function RankCard() {
  const r = ACCOUNT.rank;
  const pct = Math.round((r.points / r.nextAt) * 100);
  const next = RANKS.find((x) => x.name === r.next)!;
  return (
    <Link to="/account" className="flex flex-col gap-3 rounded-[16px] bg-[rgb(var(--k-item))] p-4 hover:bg-[rgb(var(--k-item-hover))]">
      <span className="flex items-center gap-3">
        <img src="/brand/rank-bronze.png" alt="" className="h-10 w-10 object-contain" />
        <span className="flex flex-col">
          <span className="font-display text-18 font-bold uppercase leading-5 text-ink">{r.name}</span>
          <span className="num text-12 font-semibold text-[rgb(var(--k-muted))]">
            {shortPoints(r.points)} of {shortPoints(r.nextAt)} points
          </span>
        </span>
      </span>
      <span className="block h-[8px] overflow-hidden rounded-full bg-[rgb(var(--k-panel))]" role="progressbar" aria-label={`Rank progress to ${r.next}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-12 font-semibold text-[rgb(var(--k-muted))]">
        <span className="num text-ink">{formatPoints(next.from - r.points)}</span> points to {r.next}
      </span>
    </Link>
  );
}

export function Sidebar({ onJump }: { onJump: (id: string) => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  return (
    <aside className="k-no-scrollbar sticky top-[84px] flex h-[calc(100vh-100px)] w-[232px] shrink-0 flex-col gap-4 overflow-y-auto rounded-[20px] bg-[rgb(var(--k-panel))] p-3">
      <nav aria-label="Play" className="flex flex-col gap-2">
        <SectionLabel>Play</SectionLabel>
        <NavItem to="/variants/5" active icon={<House weight="fill" />} label="Lobby" />
        <NavItem icon={<Broadcast weight="fill" />} label="Live wagers" onClick={() => onJump('wagers')} />
        <NavItem icon={<SquaresFour weight="fill" />} label="All games" onClick={() => onJump('games')} />
      </nav>
      <nav aria-label="Money" className="flex flex-col gap-2">
        <SectionLabel>Money</SectionLabel>
        <NavItem
          to="/wallet/deposit"
          icon={<Wallet weight="fill" />}
          label="Wallet"
          badge={
            pending > 0 ? (
              <span className="num flex h-6 min-w-[24px] items-center justify-center rounded-full bg-pending px-[6px] text-12 font-bold text-[#1A0F2B]">
                {pending}
                <span className="sr-only"> pending</span>
              </span>
            ) : undefined
          }
        />
        <NavItem to="/agent" icon={<Headset weight="fill" />} label="Send to agent" />
        <NavItem to="/refer" icon={<UserPlus weight="fill" />} label="Refer a friend" />
      </nav>
      <nav aria-label="Help" className="flex flex-col gap-2">
        <SectionLabel>Help</SectionLabel>
        <NavItem to="/faq" icon={<Question weight="fill" />} label="FAQ" />
        <NavItem to="/account" icon={<UserCircle weight="fill" />} label="Account" />
      </nav>
      <div className="mt-auto">
        <RankCard />
      </div>
    </aside>
  );
}
