import { Bell, CalendarDays, LayoutGrid, Menu, Plug, Settings, WandSparkles, Workflow } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Tab = 'overview' | 'workflows' | 'generator' | 'schedule' | 'integrations' | 'settings';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'generator', label: 'Generator', icon: WandSparkles },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface Props {
  tab: Tab;
  onTab: (tab: Tab) => void;
  onMenu: () => void;
  unread: number;
}

export function TopNav({ tab, onTab, onMenu, unread }: Props) {
  return (
    <header className="topnav">
      <a className="brand" href="#" aria-label="Auralis home" onClick={(e) => { e.preventDefault(); onTab('overview'); }}>
        <BrandMark />
        <span>Auralis</span>
      </a>

      <nav className="tabs" aria-label="Primary">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className="tab"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => onTab(id)}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="topnav-actions">
        <button className="icon-btn" aria-label={`Notifications${unread ? `, ${unread} new` : ''}`}>
          <Bell size={19} strokeWidth={1.75} />
          {unread > 0 && <span className="badge-dot" />}
        </button>
        <button className="icon-btn" aria-label="Toggle sidebar" onClick={onMenu}>
          <Menu size={20} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="brand-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M4 20 L10.5 4 h3 L20 20 h-3.6 l-1.5-4 h-5.8 l-1.5 4z M10.6 12.6 h2.8 L12 8.6z" fill="url(#brand-g)" />
      <circle cx="5.2" cy="6.2" r="2.2" fill="#8b5cf6" />
    </svg>
  );
}
