import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/schibsted-grotesk';
import '@fontsource/bebas-neue';
import '@fontsource-variable/manrope';
import '@fontsource-variable/onest';
import '@fontsource-variable/darker-grotesque';
import './styles/global.css';
import './site';
import './heroVariant';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
