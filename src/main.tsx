import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
/* The faces the live page is set in. The pre-Figma directions' three load with them (./legacyFonts). */
import '@fontsource-variable/onest';
import '@fontsource-variable/doto';
import '@fontsource/silkscreen';
import './styles/global.css';
import './heroVariant';
/* Stamps <html data-theme> at import time, before the first paint. */
import './theme';
/* Last: it answers each section's token block, so it is read after every one of them. */
import './styles/dark.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
