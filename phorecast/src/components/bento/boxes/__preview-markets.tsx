/* Scratch harness: BoxMarkets inside the real Bento container chain.
   Not part of the app; deleted once verification is done. */
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/geist-mono';
import '@fontsource-variable/darker-grotesque';
import '../../../styles/global.css';
import '../Bento.css';
import { BoxMarkets } from './BoxMarkets';

createRoot(document.getElementById('root')!).render(
  <section className="bento">
    <div className="container">
      <div className="bento__card">
        <header className="bento__head">
          <h2 className="bento__title">Why Traders Move to Phorecast</h2>
          <p className="bento__sub">The tools incumbents can't give you.</p>
        </header>
        <div className="bento__grid">
          <div className="bento__col bento__col--left">
            <article className="bcard bcard--onboard" />
            <article className="bcard bcard--funds" />
          </div>
          <div className="bento__col bento__col--right">
            <article className="bcard bcard--bonus" />
            <BoxMarkets />
          </div>
        </div>
      </div>
    </div>
  </section>,
);
