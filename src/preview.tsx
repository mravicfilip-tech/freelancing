/**
 * Entry for the standalone dashboard preview file. Renders the dashboard on its
 * own — no router check, no hero — so the built HTML opens straight from disk.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/onest';
import '@fontsource-variable/doto';
import '@fontsource/silkscreen';
import './styles/global.css';
import { Dashboard } from './dashboard/Dashboard';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
);
