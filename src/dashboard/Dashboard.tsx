import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { StatRow } from './panels/StatRow';
import { LevelCard } from './panels/LevelCard';
import { BuyPanel } from './panels/BuyPanel';
import { FlashSale } from './panels/FlashSale';
import { Referrals } from './panels/Referrals';
import { LiveOrders } from './panels/LiveOrders';
import { theme } from './theme';
import './dashboard.css';

export function Dashboard() {
  const mode = theme.use();

  // The ground colour has to reach <body>, or the page shows #EDEFF1 behind a
  // dark dashboard when the content is shorter than the viewport.
  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  return (
    <div className="dash" data-theme={mode}>
      <Sidebar active="presale" />

      <main className="dash__main">
        <Topbar />
        <StatRow />
        <LevelCard />

        {/* The buy panel is the tall focused rail; everything else reads as the
            feed running alongside it. */}
        <div className="dash__split">
          <BuyPanel />
          <div className="dash__stack">
            <FlashSale />
            <Referrals />
            <LiveOrders />
          </div>
        </div>
      </main>
    </div>
  );
}
