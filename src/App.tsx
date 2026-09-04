import { useState } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { CaptureStage } from './components/HeroPlanet/CaptureStage';
import { PlanetSwitcher } from './components/PlanetSwitcher';
import { HERO_VARIANT } from './heroVariant';
import { FigmaHero } from './components/FigmaHero/FigmaHero';
import { FigmaFeatures } from './components/FigmaFeatures/FigmaFeatures';
import { FigmaSimple } from './components/FigmaSimple/FigmaSimple';
import { BentoPicker, picksFromParam } from './components/FigmaFeatures/BentoPicker';

const params = new URLSearchParams(window.location.search);
const CAPTURE_MODE = params.get('capture') === 'planet';
const DEV_TOOLS = params.has('devtools');
// Review page for the bento grid's loop variants; `?bento=` alone applies a choice to the real page.
const BENTO_PICKER = params.has('bento-picker');
const BENTO_PICKS = picksFromParam(params.get('bento'));

export function App() {
  // Dev-only: mount/unmount the hero to emulate a route change for the leak check.
  const [heroMounted, setHeroMounted] = useState(true);

  if (CAPTURE_MODE) return <CaptureStage />;
  if (BENTO_PICKER) return <BentoPicker />;

  const figma = HERO_VARIANT === 'figma';
  return (
    <>
      {!figma && <Nav />}
      <main>
        {heroMounted && (figma ? <FigmaHero /> : <Hero />)}
        {figma && <FigmaSimple />}
        {figma && <FigmaFeatures picks={BENTO_PICKS} />}
      </main>
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
