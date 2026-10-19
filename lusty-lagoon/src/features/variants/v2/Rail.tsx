import { Link } from 'react-router-dom';
import { BrandText } from '../../../components/ui/BrandText';
import { useWallet } from '../../wallet/store';
import { cn } from '../../../lib/cn';

// The 80 wide icon rail. The mark sits on top, the full wordmark lives in the stage. The active item
// takes the accent well, as in the sidebar's menu.
const ITEMS = [
  { to: '/lobby', label: 'Lobby', icon: 'nav-lobby', active: true },
  { to: '/wallet/deposit', label: 'Wallet', icon: 'nav-wallet' },
  { to: '/agent', label: 'Agent', icon: 'nav-agent', name: 'Send to agent' },
  { to: '/refer', label: 'Refer', icon: 'nav-refer', name: 'Refer a friend' },
  { to: '/faq', label: 'FAQ', icon: 'nav-faq' },
];

export function Rail() {
  const { transactions } = useWallet();
  const pending = transactions.filter((t) => t.status === 'pending').length;
  return (
    <aside className="relative z-20 w-[80px] shrink-0 self-stretch border-r border-side-line bg-sunken">
      <div className="sticky top-0 flex h-screen flex-col items-center pt-4">
      <Link to="/lobby" aria-label="Lusty Lagoon, go to the lobby" className="flex h-[48px] w-[48px] items-center justify-center rounded-xl">
        <BrandText drop={2} rim={1} className="text-[28px] leading-none">
          LL
        </BrandText>
      </Link>
      <nav aria-label="Main" className="mt-8 w-full">
        <ul className="flex flex-col items-center gap-3">
          {ITEMS.map((it) => (
            <li key={it.to} className="w-full px-2">
              <Link
                to={it.to}
                aria-label={it.name}
                aria-current={it.active ? 'page' : undefined}
                className="group flex w-full flex-col items-center gap-1 rounded-xl py-1"
              >
                <span
                  className={cn(
                    'relative flex h-[44px] w-[44px] items-center justify-center rounded-xl border transition-colors duration-150',
                    it.active ? 'border-ink/40 bg-menu-active-well' : 'border-transparent bg-menu-well group-hover:bg-menu-active',
                  )}
                >
                  <img src={`/art/shell/${it.icon}.svg`} alt="" className="h-5 w-5 object-contain" />
                  {it.to === '/wallet/deposit' && pending > 0 && (
                    <span className="num absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-12 font-bold leading-none text-on-gold">
                      {pending}
                      <span className="sr-only"> pending</span>
                    </span>
                  )}
                </span>
                <span className={cn('text-12 font-medium leading-4', it.active ? 'text-ink' : 'text-label group-hover:text-ink')}>{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      </div>
    </aside>
  );
}
