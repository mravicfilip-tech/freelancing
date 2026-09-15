import { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { StatSkel, Skel, skelRows } from '../Skeleton';
import { theme } from '../theme';
import { useTransactions } from './useTransactions';
import { Transactions } from './Transactions';
import { StatsRow } from './stats';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './markets.css';

const params = new URLSearchParams(window.location.search);
/** `?empty=1` renders the page a wallet sees before its first purchase. */
const EMPTY = params.get('empty') === '1';
function MarketsSkeleton() {
  return (
    <div className="skel-page" aria-busy="true" aria-live="polite" aria-label="Loading your transactions">
      <section className="stat-row">
        <StatSkel />
        <StatSkel />
        <StatSkel />
      </section>
      <section className="card orders">
        <Skel w={164} h={20} r={8} />
        <div className="skel-stack skel-orders">{skelRows(8, 46)}</div>
      </section>
    </div>
  );
}

/**
 * My transactions: what this wallet has bought. Figures sum the history, and the
 * table beneath lists every purchase with what it cost and what it is
 * worth at the listing price.
 */
export function MarketsPage() {
  const mode = theme.use();
  const rows = useTransactions(EMPTY);

  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  return (
    <div className="dash markets" data-theme={mode}>
      <Sidebar active="transactions" />
      <main className="dash__main">
        <Topbar title="My transactions" />
        {!rows ? (
          <MarketsSkeleton />
        ) : (
          <>
            {rows.length > 0 && <StatsRow rows={rows} />}
            <Transactions rows={rows} />
          </>
        )}
      </main>
      <MobileNav active="transactions" />
    </div>
  );
}
