import { useEffect } from 'react';
import { Sidebar } from '../Sidebar';
import { MobileNav } from '../MobileNav';
import { Topbar } from '../Topbar';
import { StatSkel, Skel, skelRows } from '../Skeleton';
import { theme } from '../theme';
import { useTransactions } from './useTransactions';
import { Transactions } from './Transactions';
import { StatsRow, type StatsVariant } from './stats';
import '../../components/FigmaHero/FigmaHero.css';
import '../dashboard.css';
import './markets.css';

const params = new URLSearchParams(window.location.search);
/** `?empty=1` renders the page a wallet sees before its first purchase. */
const EMPTY = params.get('empty') === '1';
/** `?s=1..5` picks the form of the figures; the strip is the review tool. */
const S = Math.min(5, Math.max(1, Number(params.get('s')) || 1)) as StatsVariant;
const FORMS = [
  { n: 1, name: 'Facts', blurb: 'Two inset fact tiles under each figure, as the stage card does.' },
  { n: 2, name: 'Ladder', blurb: 'The presale ladder under each figure: per stage.' },
  { n: 3, name: 'One card', blurb: 'One wide card modelled on the presale stage card.' },
  { n: 4, name: 'Striped bar', blurb: 'The hero bar, one per figure.' },
  { n: 5, name: 'Rows', blurb: 'Three zebra rows under each figure.' },
] as const;

function Picker() {
  return (
    <nav className="vpick" aria-label="Figure forms">
      {FORMS.map((f) => (
        <a key={f.n} className="vpick__item" href={`?s=${f.n}`} aria-current={f.n === S ? 'page' : undefined} title={f.blurb}>
          <b>S{f.n}</b> {f.name}
        </a>
      ))}
    </nav>
  );
}

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
 * Markets: what this wallet has bought. Figures sum the history, and the
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
      <Sidebar active="markets" />
      <main className="dash__main">
        <Topbar title="Markets" />
        <Picker />
        {!rows ? (
          <MarketsSkeleton />
        ) : (
          <>
            {rows.length > 0 && <StatsRow rows={rows} variant={S} />}
            <Transactions rows={rows} />
          </>
        )}
      </main>
      <MobileNav active="markets" />
    </div>
  );
}
