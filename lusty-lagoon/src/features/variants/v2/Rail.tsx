import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Cherries, Coins, Headset, Lightning, Question, SquaresFour, UserPlus, Wallet } from '@phosphor-icons/react';
import { Logo } from '../../../components/ui/Logo';
import { useWallet } from '../../wallet/store';
import { cn } from '../../../lib/cn';
import type { Filter } from './shared';

// The 80 wide icon rail. A weekly race tile with its pillar breaking out on top, as Grimdrop's
// sidebar opens on its bonus tiles. Then each item a dark rounded square with a 12px label under it,
// the active one on the kit's purple wash. Rooms set the finder's filter, money and help are links.

const ROOMS: { value: Filter; label: string; icon: ReactNode }[] = [
  { value: 'all', label: 'Lobby', icon: <SquaresFour weight="fill" /> },
  { value: 'slots', label: 'Slots', icon: <Cherries weight="fill" /> },
  { value: 'megaways', label: 'Megaways', icon: <Lightning weight="fill" /> },
  { value: 'hold-and-win', label: 'Hold & win', icon: <Coins weight="fill" /> },
];

const LINKS = [
  { to: '/wallet/deposit', label: 'Wallet', icon: <Wallet weight="fill" /> },
  {
    to: '/agent',
    label: 'Agent',
    name: 'Send to agent',
    icon: <Headset weight="fill" />,
  },
  {
    to: '/refer',
    label: 'Refer',
    name: 'Refer a friend',
    icon: <UserPlus weight="fill" />,
  },
  { to: '/faq', label: 'FAQ', icon: <Question weight="fill" /> },
];

function Square({ active, children, badge }: { active?: boolean; children: ReactNode; badge?: ReactNode }) {
  return (
    <span
      className={cn(
        'relative flex h-11 w-[52px] items-center justify-center rounded-[14px] border transition-colors duration-150 [&>svg]:h-[22px] [&>svg]:w-[22px]',
        active ? 'k-nav-active text-[#C9A2FF]' : 'border-transparent bg-[rgb(var(--k-item))] text-[rgb(var(--k-muted))] group-hover:bg-[rgb(var(--k-item-hover))] group-hover:text-ink',
      )}
    >
      {children}
      {badge}
    </span>
  );
}

const itemCls = 'group flex w-full flex-col items-center gap-1 rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#B47CFF]';
const labelCls = (active?: boolean) => cn('text-12 font-semibold leading-4', active ? 'text-ink' : 'text-[rgb(var(--k-muted))] group-hover:text-ink');

export function Rail({ filter, onFilter, onRace }: { filter: Filter; onFilter: (f: Filter) => void; onRace: () => void }) {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  return (
    <aside className="sticky top-4 z-20 ml-4 mt-4 flex h-[calc(100vh-32px)] w-[80px] shrink-0 flex-col items-center gap-4 overflow-y-auto rounded-[20px] bg-[rgb(var(--k-panel))] px-2 pb-4 pt-4 k-no-scrollbar">
      <Link to="/variants/2" aria-label="Lusty Lagoon, lobby" className="flex h-11 items-center rounded-lg">
        <Logo className="text-[14px] leading-[15px]" />
      </Link>
      <button type="button" onClick={onRace} aria-label="Weekly race, see the leaders" className={cn(itemCls, 'mt-4')}>
        <span className="k-hue-gold relative flex h-[56px] w-[60px] items-end justify-center rounded-[16px] transition-transform duration-150 group-hover:-translate-y-0.5">
          <img src="/art/landing/pillar-gems-b.webp" alt="" className="pointer-events-none absolute bottom-1 left-1/2 h-[68px] w-auto max-w-none -translate-x-1/2" />
        </span>
        <span className="text-12 font-bold leading-4 text-ink">Race</span>
      </button>
      <nav aria-label="Game rooms" className="w-full">
        <ul className="flex flex-col gap-3">
          {ROOMS.map((r) => {
            const on = filter === r.value;
            return (
              <li key={r.value}>
                <button type="button" aria-pressed={on} onClick={() => onFilter(r.value)} className={itemCls}>
                  <Square active={on}>{r.icon}</Square>
                  <span className={labelCls(on)}>{r.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <span aria-hidden className="h-px w-8 shrink-0 bg-ink/10" />
      <nav aria-label="Money and help" className="w-full">
        <ul className="flex flex-col gap-3">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link to={l.to} aria-label={l.name} className={itemCls}>
                <Square
                  badge={
                    l.to === '/wallet/deposit' && pending > 0 ? (
                      <span className="num absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-12 font-bold leading-none text-on-gold">
                        {pending}
                        <span className="sr-only"> pending</span>
                      </span>
                    ) : undefined
                  }
                >
                  {l.icon}
                </Square>
                <span className={labelCls()}>{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
