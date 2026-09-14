import { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { theme } from '../theme';
import { EarnBuy, EarnOrders, Promos, StageCard } from './sections';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './earn.css';

/**
 * Earn. Promotions lead as four cards, the stage card carries the price,
 * bar, clock and facts, and the orders feed and buy form split beneath.
 */
export function EarnPage() {
  const mode = theme.use();

  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  return (
    <div className="dash earn" data-theme={mode}>
      <Sidebar active="earn" />
      <main className="dash__main">
        <Topbar title="Earn" />
        <Promos />
        <StageCard />
        <div className="earn-split">
          <EarnOrders limit={6} />
          <EarnBuy compact />
        </div>
      </main>
      <MobileNav active="earn" />
    </div>
  );
}
