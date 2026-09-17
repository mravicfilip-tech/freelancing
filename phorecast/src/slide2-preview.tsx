/* Scratch harness: renders only the slide 2 illustration so its markup can be
   lifted into the real hero for measurement. Not part of the app. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/geist-mono';
import '@fontsource-variable/darker-grotesque';
import './styles/global.css';
import './components/hero/Hero.css';
import { SlideAccount } from './components/hero/slides/SlideAccount';

createRoot(document.getElementById('slide2-root')!).render(
  <StrictMode>
    <div className="hero">
      <div className="container container--wide hero__inner">
        <div className="hero__stage">
          <div className="hero__slide is-active">
            <div className="hero__copy" />
            <div className="hero__visual"><SlideAccount /></div>
          </div>
        </div>
      </div>
    </div>
  </StrictMode>,
);
