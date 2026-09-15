import { useState } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { CaptureStage } from './components/HeroPlanet/CaptureStage';
import { PlanetSwitcher } from './components/PlanetSwitcher';
import { HERO_VARIANT } from './heroVariant';
import { Dashboard } from './dashboard/Dashboard';
import { AuthPage } from './dashboard/auth/AuthPage';
import { EarnPage } from './dashboard/earn/EarnPage';
import { MarketsPage } from './dashboard/markets/MarketsPage';
import { MarketsGate } from './dashboard/markets/MarketsGate';
import { PayFiPage } from './dashboard/payfi/PayFiPage';
import { ReferralsPage } from './dashboard/referrals/ReferralsPage';
import { ClaimPage } from './dashboard/claim/ClaimPage';
import { UpdatesPage } from './dashboard/updates/UpdatesPage';
import { ArticlePage } from './dashboard/updates/ArticlePage';
import { MysteryPage } from './dashboard/mystery/MysteryPage';
import { SettingsPage } from './dashboard/settings/SettingsPage';
import { FigmaHero } from './components/FigmaHero/FigmaHero';
import { FigmaFeatures } from './components/FigmaFeatures/FigmaFeatures';
import { FigmaSimple } from './components/FigmaSimple/FigmaSimple';
import { FigmaEcosystem } from './components/FigmaEcosystem/FigmaEcosystem';
import { FigmaReviews } from './components/FigmaReviews/FigmaReviews';
import { FigmaSeenIn } from './components/FigmaSeenIn/FigmaSeenIn';
import { FigmaFaq } from './components/FigmaFaq/FigmaFaq';
import { FigmaTokenomics } from './components/FigmaTokenomics/FigmaTokenomics';
import { FigmaAudits } from './components/FigmaAudits/FigmaAudits';
import { FigmaHowToBuy } from './components/FigmaHowToBuy/FigmaHowToBuy';
import { RoadmapStage } from './components/FigmaRoadmap/RoadmapStage';
import { TokPicker, tokFromParam } from './components/FigmaTokenomics/TokPicker';
import { FigmaFooter } from './components/FigmaFooter/FigmaFooter';
import { BentoPicker, picksFromParam } from './components/FigmaFeatures/BentoPicker';

const params = new URLSearchParams(window.location.search);
const CAPTURE_MODE = params.get('capture') === 'planet';
const DEV_TOOLS = params.has('devtools');
/**
 * The dashboard lives at /dashboard, and `?view=dashboard` works too for
 * previews. It also has a host of its own: on rtxdash.vercel.app the root is
 * the dashboard, so the link people are given has nothing after the domain.
 * Matched on the exact subdomain — Vercel's per-deploy hostnames are prefixed
 * with the project name, so a looser test would catch marketing previews.
 */
const DASHBOARD_HOSTS = ['rtxdash.vercel.app'];
const PATH = window.location.pathname.replace(/\/+$/, '');
/** Sign in and register share one route; the page's own toggle picks which. */
const AUTH = PATH === '/auth' || PATH === '/login' || PATH === '/register' || params.get('view') === 'auth';
const EARN = PATH === '/earn' || params.get('view') === 'earn';
const TRANSACTIONS = PATH === '/transactions' || params.get('view') === 'transactions';
const MARKETS = PATH === '/markets' || params.get('view') === 'markets';
const PAYFI = PATH === '/payfi' || params.get('view') === 'payfi';
const REFERRALS = PATH === '/referrals' || params.get('view') === 'referrals';
const CLAIM = PATH === '/claim' || params.get('view') === 'claim';
const UPDATES = PATH === '/updates' || params.get('view') === 'updates';
/** One update in full: /updates/122. */
const ARTICLE = PATH.match(/^\/updates\/(\d+)$/);
const MYSTERY = PATH === '/mystery' || params.get('view') === 'mystery';
const SETTINGS = PATH === '/settings' || PATH === '/profile' || params.get('view') === 'settings';
const DASHBOARD =
  window.location.pathname.replace(/\/+$/, '') === '/dashboard' ||
  params.get('view') === 'dashboard' ||
  DASHBOARD_HOSTS.includes(window.location.hostname);
// Review page for the bento grid's loop variants; `?bento=` alone applies a choice to the real page.
const BENTO_PICKER = params.has('bento-picker');
const BENTO_PICKS = picksFromParam(params.get('bento'));
// Review page for the tokenomics motion variants; `?tok=` alone applies a choice to the real page.
const TOK_PICKER = params.has('tok-picker');
const TOK_VARIANT = tokFromParam(params.get('tok'));

export function App() {
  // Dev-only: mount/unmount the hero to emulate a route change for the leak check.
  const [heroMounted, setHeroMounted] = useState(true);

  if (CAPTURE_MODE) return <CaptureStage />;
  if (AUTH) return <AuthPage />;
  if (EARN) return <EarnPage />;
  if (TRANSACTIONS) return <MarketsPage />;
  if (MARKETS) return <MarketsGate />;
  if (PAYFI) return <PayFiPage />;
  if (REFERRALS) return <ReferralsPage />;
  if (CLAIM) return <ClaimPage />;
  if (ARTICLE) return <ArticlePage id={Number(ARTICLE[1])} />;
  if (UPDATES) return <UpdatesPage />;
  if (MYSTERY) return <MysteryPage />;
  if (SETTINGS) return <SettingsPage />;
  if (DASHBOARD) return <Dashboard />;
  if (BENTO_PICKER) return <BentoPicker />;
  if (TOK_PICKER) return <TokPicker />;

  const figma = HERO_VARIANT === 'figma';
  return (
    <>
      {!figma && <Nav />}
      <main>
        {heroMounted && (figma ? <FigmaHero /> : <Hero />)}
        {figma && <FigmaSimple />}
        {figma && <FigmaFeatures picks={BENTO_PICKS} />}
        {figma && <FigmaEcosystem />}
        {figma && <FigmaReviews />}
      {figma && <FigmaSeenIn />}
        {figma && <FigmaTokenomics variant={TOK_VARIANT} />}
        {figma && <RoadmapStage />}
        {figma && <FigmaAudits />}
        {figma && <FigmaHowToBuy />}
        {figma && <FigmaFaq />}
      </main>
      {figma && <FigmaFooter />}
      {HERO_VARIANT === '1' && <PlanetSwitcher />}
      {DEV_TOOLS && (
        <div className="devbar">
          <button type="button" id="dev-toggle-hero" onClick={() => setHeroMounted((m) => !m)}>
            {heroMounted ? 'Unmount hero' : 'Mount hero'}
          </button>
        </div>
      )}
    </>
  );
}
