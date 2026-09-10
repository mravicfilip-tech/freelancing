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
import { DashboardSkeleton } from './Skeleton';
import { useDashboardData } from './useDashboardData';
import { theme } from './theme';
// The hero's stylesheet carries fh__btn, whose --fh-* fallbacks are written so
// the button works outside the hero.
import '../components/FigmaHero/FigmaHero.css';
import './dashboard.css';

/** `?empty=1` renders the dashboard a wallet sees before it has bought anything. */
const EMPTY = new URLSearchParams(window.location.search).get('empty') === '1';

export function Dashboard() {
  const mode = theme.use();
  const data = useDashboardData(EMPTY);

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

        {!data ? (
          <DashboardSkeleton />
        ) : (
          <>
            <StatRow holdings={data.holdings} referrals={data.referrals} presale={data.presale} />
            <StageLadder />

            <div className="dash__split">
              <BuyPanel presale={data.presale} flashSale={data.flashSale} />
              {/* One card, two parts: two separate boxes beside the buy panel
                  read as clutter and each was half empty. */}
              <div className="card side">
                <FlashSale sale={data.flashSale} />
                <Referrals referrals={data.referrals} rows={data.referralRows} />
              </div>
            </div>

            <LiveOrders orders={data.orders} />
          </>
        )}
      </main>

      {/* CSS decides which of the two navs is visible; both are always in the
          DOM so the rail's collapsed state survives a resize. */}
      <MobileNav active="presale" />
    </div>
  );
}
