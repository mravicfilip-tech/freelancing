import { Suspense, lazy, useState } from 'react';
import { Nav } from './components/Nav';
import { PlanetSwitcher } from './components/PlanetSwitcher';
import { HERO_VARIANT } from './heroVariant';
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
import { tokFromParam } from './components/FigmaTokenomics/TokPicker';
import { FigmaFooter } from './components/FigmaFooter/FigmaFooter';
import { picksFromParam } from './components/FigmaFeatures/BentoPicker';

/* Every page is its own chunk: the dashboard never loads the landing page's
   three.js, and the landing page never loads the dashboard. */
const Hero = lazy(() => import('./components/Hero').then((m) => ({ default: m.Hero })));
const CaptureStage = lazy(() => import('./components/HeroPlanet/CaptureStage').then((m) => ({ default: m.CaptureStage })));
const Dashboard = lazy(() => import('./dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const AuthPage = lazy(() => import('./dashboard/auth/AuthPage').then((m) => ({ default: m.AuthPage })));
const EarnPage = lazy(() => import('./dashboard/earn/EarnPage').then((m) => ({ default: m.EarnPage })));
const MarketsPage = lazy(() => import('./dashboard/markets/MarketsPage').then((m) => ({ default: m.MarketsPage })));
const MarketsGate = lazy(() => import('./dashboard/markets/MarketsGate').then((m) => ({ default: m.MarketsGate })));
const PayFiPage = lazy(() => import('./dashboard/payfi/PayFiPage').then((m) => ({ default: m.PayFiPage })));
const ReferralsPage = lazy(() => import('./dashboard/referrals/ReferralsPage').then((m) => ({ default: m.ReferralsPage })));
const ClaimPage = lazy(() => import('./dashboard/claim/ClaimPage').then((m) => ({ default: m.ClaimPage })));
const UpdatesPage = lazy(() => import('./dashboard/updates/UpdatesPage').then((m) => ({ default: m.UpdatesPage })));
const ArticlePage = lazy(() => import('./dashboard/updates/ArticlePage').then((m) => ({ default: m.ArticlePage })));
const MysteryPage = lazy(() => import('./dashboard/mystery/MysteryPage').then((m) => ({ default: m.MysteryPage })));
const SettingsPage = lazy(() => import('./dashboard/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const FigmaHero = lazy(() => import('./components/FigmaHero/FigmaHero').then((m) => ({ default: m.FigmaHero })));
const TokPicker = lazy(() => import('./components/FigmaTokenomics/TokPicker').then((m) => ({ default: m.TokPicker })));
const BentoPicker = lazy(() => import('./components/FigmaFeatures/BentoPicker').then((m) => ({ default: m.BentoPicker })));

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

  const page =
    CAPTURE_MODE ? <CaptureStage /> :
    AUTH ? <AuthPage /> :
    EARN ? <EarnPage /> :
    TRANSACTIONS ? <MarketsPage /> :
    MARKETS ? <MarketsGate /> :
    PAYFI ? <PayFiPage /> :
    REFERRALS ? <ReferralsPage /> :
    CLAIM ? <ClaimPage /> :
    ARTICLE ? <ArticlePage id={Number(ARTICLE[1])} /> :
    UPDATES ? <UpdatesPage /> :
    MYSTERY ? <MysteryPage /> :
    SETTINGS ? <SettingsPage /> :
    DASHBOARD ? <Dashboard /> :
    BENTO_PICKER ? <BentoPicker /> :
    TOK_PICKER ? <TokPicker /> : null;
  if (page) return <Suspense fallback={null}>{page}</Suspense>;

  const figma = HERO_VARIANT === 'figma';
  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
}
