import { lazy, Suspense, useState, type ComponentType, type ReactNode } from 'react';
import { CHEST_REVIEW } from './components/FigmaHero/chestVariant';
import { HERO_VARIANT } from './heroVariant';
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
import { FigmaFooter } from './components/FigmaFooter/FigmaFooter';
import { picksFromParam } from './components/FigmaFeatures/BentoPicker';
import { tokFromParam } from './components/FigmaTokenomics/TokPicker';

const params = new URLSearchParams(window.location.search);
const CAPTURE_MODE = params.get('capture') === 'planet';
const DEV_TOOLS = params.has('devtools');
// Review page for the bento grid's loop variants; `?bento=` alone applies a choice to the real page.
const BENTO_PICKER = params.has('bento-picker');
const BENTO_PICKS = picksFromParam(params.get('bento'));
// Review page for the tokenomics motion variants; `?tok=` alone applies a choice to the real page.
const TOK_PICKER = params.has('tok-picker');
const TOK_VARIANT = tokFromParam(params.get('tok'));

/**
 * Everything below is reachable only by putting a parameter on the URL: the capture stage, the two
 * variant review pages, the switchers, and the three pre-Figma hero directions. None of it is on the
 * path a visitor takes, so none of it belongs in the bundle they wait for — `lazy` moves each into
 * its own chunk, fetched only when the parameter that asks for it is actually present. The legacy
 * hero is the expensive one: it carries HeroPlanet, its shaders, and three font families with it.
 */
const named = <K extends string>(key: K, load: () => Promise<Record<K, ComponentType>>) =>
  lazy(() => load().then((m) => ({ default: m[key] as ComponentType })));

const CaptureStage = named('CaptureStage', () => import('./components/HeroPlanet/CaptureStage'));
const BentoPicker = named('BentoPicker', () => import('./components/FigmaFeatures/BentoPicker'));
const TokPicker = named('TokPicker', () => import('./components/FigmaTokenomics/TokPicker'));
const PlanetSwitcher = named('PlanetSwitcher', () => import('./components/PlanetSwitcher'));
const ChestSwitcher = named('ChestSwitcher', () => import('./components/ChestSwitcher'));
const Nav = named('Nav', () => import('./components/Nav'));
const Hero = named('Hero', () => import('./components/Hero'));

/** These mount over a page that is already drawn, so there is nothing to show while they arrive. */
const Deferred = ({ children }: { children: ReactNode }) => <Suspense fallback={null}>{children}</Suspense>;

export function App() {
  // Dev-only: mount/unmount the hero to emulate a route change for the leak check.
  const [heroMounted, setHeroMounted] = useState(true);

  if (CAPTURE_MODE) return <Deferred><CaptureStage /></Deferred>;
  if (BENTO_PICKER) return <Deferred><BentoPicker /></Deferred>;
  if (TOK_PICKER) return <Deferred><TokPicker /></Deferred>;

  const figma = HERO_VARIANT === 'figma';
  return (
    <>
      {!figma && <Deferred><Nav /></Deferred>}
      <main>
        {heroMounted && (figma ? <FigmaHero /> : <Deferred><Hero /></Deferred>)}
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
      {HERO_VARIANT === '1' && <Deferred><PlanetSwitcher /></Deferred>}
      {CHEST_REVIEW && <Deferred><ChestSwitcher /></Deferred>}
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
