import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Topbar } from './Topbar';
import { StatRow } from './panels/StatRow';
import { BuyPanel } from './panels/BuyPanel';
import { StageLadder } from './panels/StageLadder';
import { FlashSale } from './panels/FlashSale';
import { Referrals } from './panels/Referrals';
import { LiveOrders } from './panels/LiveOrders';
import { theme } from './theme';
// The hero's stylesheet carries fh__btn, whose --fh-* fallbacks are written so
// the button works outside the hero.
import '../components/FigmaHero/FigmaHero.css';
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
        <StageLadder />

        <div className="dash__split">
          <BuyPanel />
          {/* One card, two parts: two separate boxes beside the buy panel read
              as clutter and each was half empty. */}
          <div className="card side">
            <FlashSale />
            <Referrals />
          </div>
        </div>

        <LiveOrders />
      </main>

      {/* CSS decides which of the two navs is visible; both are always in the
          DOM so the rail's collapsed state survives a resize. */}
      <MobileNav active="presale" />
    </div>
  );
}
