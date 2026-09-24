import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './lib/theme';
import '@fontsource-variable/manrope';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/darker-grotesque';
import './styles/global.css';

// Every section's pending state hides its animated parts, and only script can
// undo that. The CSS holds a section back only under `data-js="on"`, so if
// this file never runs the page renders plainly rather than blank. This is
// deliberately not a timed failsafe, which would reveal scroll-gated bands
// before they were reached.
document.documentElement.dataset.js = 'on';

// `./lib/theme` is imported for its side effects: it adopts the `data-theme`
// that the inline script in index.html wrote, and attaches the
// `prefers-color-scheme` listener used while no explicit choice is stored.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
