import { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { theme } from '../theme';
import { Countdown, EarnBuy, EarnOrders, Promos, Raised, StageLine } from './sections';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './earn.css';

/**
 * Earn. Promotions lead as a single-slide carousel, the stage card carries
 * the clock, bar and facts, and the orders feed and buy form split beneath.
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
        <section className="card earn-hero">
          <div className="earn-hero__top">
            <div>
              <p className="ladder__label">Presale</p>
              <StageLine />
            </div>
            <Countdown size="md" />
          </div>
          <Raised inline />
        </section>
        <div className="earn-split">
          <EarnOrders limit={6} />
          <EarnBuy compact />
        </div>
      </main>
      <MobileNav active="earn" />
    </div>
  );
}
