import { useState } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { CaptureStage } from './components/HeroPlanet/CaptureStage';
import { PlanetSwitcher } from './components/PlanetSwitcher';
import { HERO_VARIANT } from './heroVariant';
import { FigmaHero } from './components/FigmaHero/FigmaHero';

const params = new URLSearchParams(window.location.search);
const CAPTURE_MODE = params.get('capture') === 'planet';
const DEV_TOOLS = params.has('devtools');

export function App() {
  // Dev-only: mount/unmount the hero to emulate a route change for the leak check.
  const [heroMounted, setHeroMounted] = useState(true);

  if (CAPTURE_MODE) return <CaptureStage />;

  const figma = HERO_VARIANT === 'figma';
  return (
    <>
      {!figma && <Nav />}
      <main>
        {heroMounted && (figma ? <FigmaHero /> : <Hero />)}
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
