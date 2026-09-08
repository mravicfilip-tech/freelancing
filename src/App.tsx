import { useState } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { CaptureStage } from './components/HeroPlanet/CaptureStage';
import { PlanetSwitcher } from './components/PlanetSwitcher';
import { HERO_VARIANT } from './heroVariant';
import { FigmaHero } from './components/FigmaHero/FigmaHero';
import { FigmaFeatures } from './components/FigmaFeatures/FigmaFeatures';
import { FigmaSimple } from './components/FigmaSimple/FigmaSimple';
import { FigmaEcosystem } from './components/FigmaEcosystem/FigmaEcosystem';
import { FigmaReviews } from './components/FigmaReviews/FigmaReviews';
import { FigmaSeenIn } from './components/FigmaSeenIn/FigmaSeenIn';
import { FigmaFaq } from './components/FigmaFaq/FigmaFaq';
import { FigmaTokenomics } from './components/FigmaTokenomics/FigmaTokenomics';
import { TokPicker, tokFromParam } from './components/FigmaTokenomics/TokPicker';
import { FigmaFooter } from './components/FigmaFooter/FigmaFooter';
import { BentoPicker, picksFromParam } from './components/FigmaFeatures/BentoPicker';
import { FigmaRoadmap } from './components/FigmaRoadmap/FigmaRoadmap';
import { RoadPicker, roadFromParam } from './components/FigmaRoadmap/RoadPicker';

const params = new URLSearchParams(window.location.search);
const CAPTURE_MODE = params.get('capture') === 'planet';
const DEV_TOOLS = params.has('devtools');
// Review page for the bento grid's loop variants; `?bento=` alone applies a choice to the real page.
const BENTO_PICKER = params.has('bento-picker');
const BENTO_PICKS = picksFromParam(params.get('bento'));
// Review page for the tokenomics motion variants; `?tok=` alone applies a choice to the real page.
const TOK_PICKER = params.has('tok-picker');
const TOK_VARIANT = tokFromParam(params.get('tok'));
// Review page for the five roadmap directions; `?road=` alone applies a choice to the real page.
const ROAD_PICKER = params.has('road-picker');
const ROAD_VARIANT = roadFromParam(params.get('road'));

export function App() {
  // Dev-only: mount/unmount the hero to emulate a route change for the leak check.
  const [heroMounted, setHeroMounted] = useState(true);

  if (CAPTURE_MODE) return <CaptureStage />;
  if (BENTO_PICKER) return <BentoPicker />;
  if (TOK_PICKER) return <TokPicker />;
  if (ROAD_PICKER) return <RoadPicker />;

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
        {figma && <FigmaRoadmap variant={ROAD_VARIANT} />}
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
