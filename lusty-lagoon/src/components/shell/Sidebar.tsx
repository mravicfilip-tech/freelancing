import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Dialog, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ACCOUNT } from '../../data/wallet';
import { RANKS, shortPoints } from '../../data/ranks';
import { formatPoints } from '../../lib/format';
import { useWallet } from '../../features/wallet/store';
import { cn } from '../../lib/cn';

// The Figma sidebar (Dashboard 339:1463), 248 wide. Menu items are 228 by 48 with a 48 icon well.
// Changed from the Figma only where a review note names it: no text glow (note 2), a flat rank bar
// with no sparkles or cast shadow (note 3), and the sign-up card shows the next rank reward to a
// signed-in player (decision 4).

const NAV = [
  { to: '/lobby', label: 'Lobby', icon: 'nav-lobby' },
  { to: '/agent', label: 'Send to agent', icon: 'nav-agent', caret: true },
  { to: '/wallet', label: 'Wallet', icon: 'nav-wallet' },
  { to: '/refer', label: 'Refer a friend', icon: 'nav-refer' },
  { to: '/faq', label: 'FAQ', icon: 'nav-faq' },
];

function RanksDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { rank } = ACCOUNT;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Ranks and rewards" description="You earn one point for every cent you play. Rewards start the day you reach a rank.">
        <ol className="flex flex-col divide-y divide-line rounded-xl border border-line">
          {RANKS.map((r) => {
            const current = r.name === rank.name;
            return (
              <li key={r.name} className={cn('flex items-start justify-between gap-6 px-4 py-3', current && 'bg-raised')}>
                <span className="flex flex-col gap-1">
                  <span className="text-16 font-semibold text-ink">
                    {r.name}
                    {current && <span className="ml-2 text-14 font-normal text-accent">Your rank</span>}
                  </span>
                  <span className="text-14 text-ink2">{r.reward}</span>
                </span>
                <span className="num shrink-0 text-14 text-ink3">{r.from ? `${formatPoints(r.from)} points` : 'From the start'}</span>
              </li>
            );
          })}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

function RankCard({ onLevels }: { onLevels: () => void }) {
  const { rank } = ACCOUNT;
  const pct = (rank.points / rank.nextAt) * 100;
  const left = rank.nextAt - rank.points;
  return (
    <section aria-labelledby="rank-title" className="ll-card-quiet relative h-[180px] w-full">
      <img src="/brand/rank-bronze.png" alt="" width={45} height={42} className="absolute left-4 top-[14px]" />
      <h2 id="rank-title" className="absolute left-[75px] top-[14px] font-display text-16 font-bold leading-5 text-ink">
        {rank.name} Rank
      </h2>
      <p className="absolute left-[75px] top-[36px] font-display text-14 leading-5 text-ink2">Next: {rank.next}</p>
      <button
        type="button"
        onClick={onLevels}
        aria-label="How ranks work"
        className="absolute right-[25px] top-3 flex h-6 w-6 items-center justify-center rounded hover:bg-raised"
      >
        <img src="/art/shell/rank-info.svg" alt="" width={24} height={24} />
      </button>
      <div className="absolute left-[7px] top-[72px] h-[70px] w-[215px] rounded-lg border border-rank-box-line bg-rank-box">
        <p className="absolute inset-x-[18px] top-[9px] flex items-baseline justify-between text-14 font-semibold uppercase leading-5 tracking-[-0.02em]">
          <span className="num text-ink">
            {shortPoints(rank.points)} <span className="font-normal text-ink2">/ {shortPoints(rank.nextAt)}</span>
          </span>
          <span className="num text-gold">
            {shortPoints(left)} to {rank.next}
          </span>
        </p>
        <div
          role="progressbar"
          aria-label={`${Math.floor(pct)}% of the way to ${rank.next}, ${formatPoints(left)} points to go`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(pct)}
          className="absolute left-3 top-[44px] h-[14px] w-[196px] overflow-hidden rounded-full bg-rank-track"
        >
          <div className="h-full rounded-full bg-rank-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button type="button" onClick={onLevels} className="absolute bottom-[10px] left-[13px] rounded px-2 py-0.5 font-display text-14 leading-5 text-ink2 hover:text-ink">
        Check All Levels
      </button>
    </section>
  );
}

// Decision 4. The Figma's sign-up offer slot, same art and shape, telling a signed-in player what
// the next rank brings instead.
function RewardCard({ onRewards }: { onRewards: () => void }) {
  const first = ACCOUNT.name.split(' ')[0];
  return (
    <section aria-labelledby="reward-title" className="relative h-[276px] w-full">
      <div className="absolute inset-0 overflow-hidden rounded-lg border border-card-line/50">
        <img src="/art/shell/reward-room.webp" alt="" className="h-full w-full object-cover" />
      </div>
      <img src="/art/shell/reward-pillar.webp" alt="" width={288} height={288} className="pointer-events-none absolute left-[56px] top-1 max-w-none" />
      <div className="absolute left-[15px] top-[18px] h-[120px] w-[167px]">
        <img src="/art/shell/promo-bubble.svg" alt="" width={167} height={120} className="absolute inset-0 -scale-x-100" />
        <h2 id="reward-title" className="absolute left-[17px] top-[13px] font-display text-16 font-bold leading-5 text-ink">
          Hey {first}...
        </h2>
        <p className="absolute left-[17px] top-[44px] w-[130px] font-display text-14 font-bold uppercase leading-[1.4] tracking-[-0.02em] text-gold">
          {RANKS[1].name} unlocks weekly cash drops
        </p>
      </div>
      <Button size="cta-sm" onClick={onRewards} className="absolute left-[13px] top-[205px] w-[197px]">
        See rewards
      </Button>
    </section>
  );
}

export function Sidebar() {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  const [levels, setLevels] = useState(false);
  return (
    <aside className="sticky top-0 flex h-screen w-sidebar shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-side-line bg-[linear-gradient(180deg,rgb(var(--ll-side-top))_0,rgb(var(--ll-side))_140px)] px-[10px] pb-6 [scrollbar-width:thin]">
      <Link to="/lobby" className="ml-[14px] mt-[18px] flex w-fit shrink-0 items-center rounded-lg" aria-label="Lusty Lagoon, go to the lobby">
        <Logo />
      </Link>
      <nav aria-label="Main" className="mt-[43px]">
        <ul className="flex flex-col gap-[6px]">
          {NAV.map(({ to, label, icon, caret }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'group flex h-[48px] items-center rounded-lg border text-14 uppercase leading-5 transition-colors duration-150',
                    isActive ? 'border-menu-active-line bg-menu-active text-ink' : 'border-transparent bg-panel text-label hover:bg-menu-active/60 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-[48px] w-12 shrink-0 items-center justify-center rounded-lg',
                        isActive ? '-ml-px border border-ink/40 bg-menu-active-well' : '-ml-px bg-menu-well',
                      )}
                    >
                      <img src={`/art/shell/${icon}.svg`} alt="" className="h-5 w-5 object-contain" />
                    </span>
                    <span className="ml-[21px] flex-1 truncate">{label}</span>
                    {to === '/wallet' && pending > 0 && (
                      <span className="num mr-[10px] flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-gold px-1 text-14 font-extrabold leading-none text-on-gold">
                        {pending}
                        <span className="sr-only"> pending</span>
                      </span>
                    )}
                    {caret && <img src="/art/shell/nav-caret.svg" alt="" width={20} height={20} className="mr-[13px] -rotate-90" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-[74px] flex shrink-0 flex-col">
        <RankCard onLevels={() => setLevels(true)} />
        <div className="mt-[34px]">
          <RewardCard onRewards={() => setLevels(true)} />
        </div>
        <p className="mt-[34px] w-[126px] pl-[13px] text-12 leading-[14px] text-ink3">All Rights Reserved, Lusty Lagoon</p>
      </div>
      <RanksDialog open={levels} onOpenChange={setLevels} />
    </aside>
  );
}
