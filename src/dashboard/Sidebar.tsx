import type { ReactElement } from 'react';
import { NavIcon } from './icons';
import { rail } from './theme';

type Item = {
  id: string;
  label: string;
  icon: (p: { className?: string }) => ReactElement;
  badge?: string;
};

/** Two groups, split exactly where the reference breaks. */
const GROUPS: Item[][] = [
  [
    { id: 'presale', label: 'Presale', icon: NavIcon.presale },
    { id: 'earn', label: 'Earn', icon: NavIcon.earn },
    { id: 'markets', label: 'Markets', icon: NavIcon.markets },
    { id: 'payfi', label: 'PayFi', icon: NavIcon.payfi, badge: 'NEW' },
  ],
  [
    { id: 'referrals', label: 'Referrals', icon: NavIcon.referrals },
    { id: 'updates', label: 'Updates', icon: NavIcon.updates },
    { id: 'claim', label: 'Claim', icon: NavIcon.claim, badge: 'NEW' },
  ],
];

export function Sidebar({ active = 'presale' }: { active?: string }) {
  const mode = rail.use();
  const collapsed = mode === 'collapsed';

  return (
    <aside className="rail" data-mode={mode}>
      <a className="rail__brand" href="/" aria-label="Remittix home">
        <span className="rail__mark" aria-hidden="true" />
        <span className="rail__wordmark">Remittix</span>
      </a>

      <nav className="rail__nav" aria-label="Dashboard">
        {GROUPS.map((group, i) => (
          <ul className="rail__group" key={i}>
            {group.map((item) => {
              const Icon = item.icon;
              const current = item.id === active;
              return (
                <li key={item.id}>
                  <a
                    className="rail__item"
                    href={`#${item.id}`}
                    aria-current={current ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="rail__icon">
                      <Icon className="icon-22" />
                    </span>
                    <span className="rail__label">{item.label}</span>
                    {item.badge && <span className="rail__badge">{item.badge}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>

      <button
        type="button"
        className="rail__toggle"
        onClick={() => rail.set(collapsed ? 'extended' : 'collapsed')}
        aria-pressed={collapsed}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon-20"
          aria-hidden="true"
        >
          <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
          <path d="M10 4.5v15" />
        </svg>
        <span className="rail__label">{collapsed ? 'Expand' : 'Collapse'}</span>
      </button>
    </aside>
  );
}
