import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource-variable/manrope';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/geist-mono';
import '@fontsource-variable/darker-grotesque';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
