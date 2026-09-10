import { NavIcon } from './icons';
import { rail } from './theme';

type Id = keyof typeof NavIcon;

/** Two groups, split exactly where the reference breaks. */
const GROUPS: Id[][] = [
  ['presale', 'earn', 'markets', 'payfi'],
  ['referrals', 'updates', 'claim'],
];

const META: Record<Id, { label: string; badge?: string }> = {
  presale: { label: 'Presale' },
  earn: { label: 'Earn' },
  markets: { label: 'Markets' },
  payfi: { label: 'PayFi', badge: 'NEW' },
  referrals: { label: 'Referrals' },
  updates: { label: 'Updates' },
  claim: { label: 'Claim', badge: 'NEW' },
};

export function Sidebar({ active = 'presale' }: { active?: Id }) {
  const mode = rail.use();
  const collapsed = mode === 'collapsed';

  return (
    <aside className="rail" data-mode={mode}>
      <a className="rail__brand" href="/" aria-label="Remittix home">
        <img className="rail__logo" src="/figma/logo.svg" alt="" width={33} height={17} />
        <span className="rail__wordmark">Remittix</span>
      </a>

      <nav className="rail__nav" aria-label="Dashboard">
        {GROUPS.map((group, i) => (
          <ul className="rail__group" key={i}>
            {group.map((id) => {
              const Icon = NavIcon[id];
              const { label, badge } = META[id];
              const current = id === active;
              return (
                <li key={id}>
                  <a
                    className="rail__item"
                    href={`#${id}`}
                    aria-current={current ? 'page' : undefined}
                    title={collapsed ? label : undefined}
                  >
                    <span className="rail__icon">
                      <Icon className="icon-22" />
                    </span>
                    <span className="rail__label">{label}</span>
                    {badge && <span className="rail__badge">{badge}</span>}
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
