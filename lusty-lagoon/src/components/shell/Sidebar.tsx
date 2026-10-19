import { Link, NavLink } from 'react-router-dom';
import { Gift, Headset, Question, Spiral, UserPlus, Wallet } from '@phosphor-icons/react';
import { Logo } from '../ui/Logo';
import { Progress } from '../ui/Progress';
import { ACCOUNT } from '../../data/wallet';
import { formatPoints } from '../../lib/format';
import { useWallet } from '../../features/wallet/store';
import { cn } from '../../lib/cn';

const NAV = [
  { to: '/lobby', label: 'Lobby', Icon: Spiral },
  { to: '/agent', label: 'Send to agent', Icon: Headset },
  { to: '/wallet', label: 'Wallet', Icon: Wallet },
  { to: '/refer', label: 'Refer a friend', Icon: UserPlus },
  { to: '/faq', label: 'FAQ', Icon: Question },
];

function RankCard() {
  const { rank } = ACCOUNT;
  const pct = (rank.points / rank.nextAt) * 100;
  const left = rank.nextAt - rank.points;
  return (
    <section aria-labelledby="rank-title" className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4">
      <div className="flex items-center gap-3">
        <img src="/brand/rank-bronze.png" alt="" width={32} height={31} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 id="rank-title" className="text-16 font-semibold text-ink">
            {rank.name} rank
          </h2>
          <p className="text-14 text-ink2">Next is {rank.next}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-14">
          <span className="num text-ink">
            {formatPoints(rank.points)} <span className="text-ink3">of {formatPoints(rank.nextAt)}</span>
          </span>
          <span className="num font-semibold text-ink">{Math.floor(pct)}%</span>
        </div>
        <Progress value={pct} label={`${Math.floor(pct)}% of the way to ${rank.next}`} />
        <p className="num text-14 text-ink2">{formatPoints(left)} points to {rank.next}</p>
      </div>
    </section>
  );
}

// Decision 4. Signed in players see the next rank reward here, never a sign-up offer.
function RewardCard() {
  return (
    <section aria-labelledby="reward-title" className="flex gap-3 rounded-xl border border-line bg-panel p-4">
      <Gift weight="fill" className="h-6 w-6 shrink-0 text-accent" aria-hidden />
      <div className="flex flex-col gap-1">
        <h2 id="reward-title" className="text-14 font-semibold text-ink">
          Silver reward
        </h2>
        <p className="text-14 text-ink2">Your first cash drop. Drops grow up to $1,000 at the top rank.</p>
      </div>
    </section>
  );
}

export function Sidebar() {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  return (
    <aside className="sticky top-0 flex h-screen w-sidebar shrink-0 flex-col gap-6 overflow-y-auto border-r border-line bg-page px-4 pb-6">
      <Link to="/lobby" className="flex shrink-0 items-center rounded-lg px-2 py-4" aria-label="Lusty Lagoon, go to the lobby">
        <Logo />
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center gap-3 rounded-lg px-3 text-14 font-medium transition-colors duration-150',
                    isActive ? 'bg-raised text-ink' : 'text-ink2 hover:bg-panel hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon weight={isActive ? 'fill' : 'regular'} className={cn('h-5 w-5', isActive && 'text-accent')} aria-hidden />
                    <span className="flex-1">{label}</span>
                    {to === '/wallet' && pending > 0 && (
                      <span className="num flex h-5 min-w-5 items-center justify-center rounded-full bg-pending px-1 text-12 font-semibold text-on-gold">
                        {pending}
                        <span className="sr-only"> pending</span>
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <RankCard />
        <RewardCard />
        <p className="px-2 text-12 text-ink3">All rights reserved, Lusty Lagoon</p>
      </div>
    </aside>
  );
}
