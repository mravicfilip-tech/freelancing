import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GlossaryPage } from './GlossaryPage';
import '@fontsource-variable/onest';
import '@fontsource-variable/archivo-narrow';
import '@fontsource-variable/inter';
import '@fontsource-variable/syne';
import './glossary.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlossaryPage />
  </StrictMode>,
);
