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
 * Five layouts of the same sections. `?v=1..5` picks one; the strip at the top
 * is the review tool for flipping between them and goes when one is chosen.
 */
const VARIANTS = [
  { n: 1, name: 'Reference', blurb: 'Promos on top, orders left, buy right — the screenshot as given.' },
  { n: 2, name: 'Buy first', blurb: 'The step-up countdown is a band; the form sits under it before anything else.' },
  { n: 3, name: 'Three columns', blurb: 'Promotions as a column, orders in the middle, buy on the right.' },
  { n: 4, name: 'Ticker', blurb: 'Orders run as a live strip under the title; the form is the page.' },
  { n: 5, name: 'Stage hero', blurb: 'One wide stage card — clock, bar, facts — with the split beneath it.' },
] as const;

const params = new URLSearchParams(window.location.search);
const V = Math.min(5, Math.max(1, Number(params.get('v')) || 1));

function Picker() {
  return (
    <nav className="vpick" aria-label="Earn layout variants">
      {VARIANTS.map((v) => (
        <a key={v.n} className="vpick__item" href={`?v=${v.n}`} aria-current={v.n === V ? 'page' : undefined} title={v.blurb}>
          <b>V{v.n}</b> {v.name}
        </a>
      ))}
    </nav>
  );
}

/* ---------- The five ---------- */

function V1() {
  return (
    <>
      <Promos layout="row" />
      <div className="earn-split">
        <EarnOrders />
        <EarnBuy>
          <Countdown size="sm" />
          <Raised />
        </EarnBuy>
      </div>
    </>
  );
}

function V2() {
  return (
    <>
      <section className="card earn-band">
        <div className="earn-band__l">
          <StageLine />
          <Countdown size="lg" title="Until the price steps up" />
        </div>
        <Raised />
      </section>
      <div className="earn-split earn-split--buy-left">
        <EarnBuy compact />
        <Promos layout="stack" />
      </div>
      <EarnOrders limit={6} />
    </>
  );
}

function V3() {
  return (
    <div className="earn-three">
      <Promos layout="stack" />
      <EarnOrders limit={8} />
      <EarnBuy compact>
        <Countdown size="sm" />
        <Raised />
      </EarnBuy>
    </div>
  );
}

function V4() {
  return (
    <>
      <EarnOrders layout="ticker" />
      <div className="earn-centre">
        <EarnBuy>
          <Countdown size="md" />
          <Raised />
        </EarnBuy>
      </div>
      <Promos layout="grid" />
    </>
  );
}

function V5() {
  return (
    <>
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
      <Promos layout="grid" />
    </>
  );
}

const LAYOUTS = { 1: V1, 2: V2, 3: V3, 4: V4, 5: V5 } as const;

export function EarnPage() {
  const mode = theme.use();
  const Layout = LAYOUTS[V as keyof typeof LAYOUTS];

  useEffect(() => {
    document.documentElement.dataset.dashTheme = mode;
    return () => {
      delete document.documentElement.dataset.dashTheme;
    };
  }, [mode]);

  return (
    <div className="dash earn" data-theme={mode} data-variant={V}>
      <Sidebar active="earn" />
      <main className="dash__main">
        <Picker />
        <Topbar title="Earn" eyebrow={`Variant ${V} · ${VARIANTS[V - 1].name}`} />
        <Layout />
      </main>
      <MobileNav active="earn" />
    </div>
  );
}
