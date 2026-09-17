import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './lib/theme';
import '@fontsource-variable/manrope';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/geist-mono';
import '@fontsource-variable/darker-grotesque';
import './styles/global.css';

// Every section's pending state hides its animated parts, and only script can
// undo that. Marking the document means the CSS can hold a section back purely
// on the strength of there being something here to release it: if this file
// never runs, the rule never applies and the page renders plainly rather than
// blank. That replaces the timed failsafe the sections used to carry, which was
// wrong for anything gated on scroll -- it revealed a band four seconds in
// whether or not it had been reached.
document.documentElement.dataset.js = 'on';

// `./lib/theme` is imported for its side effects as much as for its exports:
// it adopts the `data-theme` the inline script in index.html has already
// written, and it attaches the `prefers-color-scheme` listener that keeps the
// page following the system while no explicit choice has been made. It is
// imported here, next to `data-js`, so that the two things this file does to
// the document element sit together rather than arriving through whichever
// section happened to pull in the motion layer first.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
