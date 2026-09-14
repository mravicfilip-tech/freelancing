import { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { Stat } from '../panels/StatRow';
import { StatSkel, Skel, skelRows } from '../Skeleton';
import { money, PRESALE, stagePrice } from '../data';
import { theme } from '../theme';
import { summarise } from './data';
import { useTransactions } from './useTransactions';
import { Transactions } from './Transactions';
import { PriceRange, SpendMix, WeekBars } from './viz';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './markets.css';

/** `?empty=1` renders the page a wallet sees before its first purchase. */
const EMPTY = new URLSearchParams(window.location.search).get('empty') === '1';

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
 * Markets: what this wallet has bought. Three figures sum the history, and
 * the table beneath lists every purchase with what it cost and what it is
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

  const sum = rows ? summarise(rows) : null;
  const uplift = sum && sum.avgPrice ? Math.round((PRESALE.listPrice / sum.avgPrice - 1) * 100) : 0;

  return (
    <div className="dash markets" data-theme={mode}>
      <Sidebar active="markets" />
      <main className="dash__main">
        <Topbar title="Markets" />
        {!rows || !sum ? (
          <MarketsSkeleton />
        ) : (
          <>
            {rows.length > 0 && (
              <section className="stat-row" aria-label="Your purchases">
                <Stat
                  label="Completed purchases"
                  value={String(sum.count)}
                  note={`Across stages ${sum.firstStage} to ${sum.lastStage}`}
                >
                  <WeekBars rows={rows} />
                </Stat>
                <Stat
                  label="Total spent"
                  symbol="$"
                  value={money(sum.spent)}
                  suffix="USDT"
                  note={`For ${money(sum.rtx)} $RTX`}
                  mark="usdt"
                >
                  <SpendMix rows={rows} />
                </Stat>
                <Stat
                  label="Average price paid"
                  symbol="$"
                  value={sum.avgPrice.toFixed(3)}
                  note={`Listing at $${PRESALE.listPrice.toFixed(2)} is ${uplift}% higher`}
                  mark="coin"
                >
                  <PriceRange
                    avg={sum.avgPrice}
                    low={Math.min(...rows.map((r) => r.price))}
                    stages={Array.from({ length: sum.lastStage - sum.firstStage + 1 }, (_, i) => ({ n: sum.firstStage + i, price: stagePrice(sum.firstStage + i) }))}
                  />
                </Stat>
              </section>
            )}
            <Transactions rows={rows} />
          </>
        )}
      </main>
      <MobileNav active="markets" />
    </div>
  );
}
