import { useState } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { CaptureStage } from './components/HeroPlanet/CaptureStage';

const params = new URLSearchParams(window.location.search);
const CAPTURE_MODE = params.get('capture') === 'planet';
const DEV_TOOLS = params.has('devtools');

export function App() {
  // Dev-only: mount/unmount the hero to emulate a route change for the leak check.
  const [heroMounted, setHeroMounted] = useState(true);

  if (CAPTURE_MODE) return <CaptureStage />;

  return (
    <>
      <Nav />
      <main>
        {heroMounted && <Hero />}
        <section className="section" id="how">
          <h2>How it works</h2>
          <p>
            Connect a wallet, pick a currency and a bank account, and Remittix handles the rest:
            conversion, compliance and settlement, in one transaction.
          </p>
        </section>
        <section className="section section--dark" id="coverage">
          <h2>Built for the corridors that matter</h2>
          <p>
            From Lagos to London and Manila to Madrid. Local rails in every market we launch, so
            money lands as local currency without a detour through a correspondent bank.
          </p>
        </section>
        <section className="section" id="tokenomics">
          <h2>Tokenomics</h2>
          <p>A fixed supply, a transparent release schedule, and fees that flow back to holders.</p>
        </section>
      </main>
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
