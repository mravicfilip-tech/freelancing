import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './shared/base.css';

// Three design pathways in one app. ?v=1 Foundry, ?v=2 Daylight, ?v=3 Underground, ?lang=de for
// German. Keys 1, 2 and 3 switch pathway outside form fields.
const PATHWAYS = {
  '1': lazy(() => import('./p1/Foundry')),
  '2': lazy(() => import('./p2/Daylight')),
  '3': lazy(() => import('./p3/Underground')),
} as const;
type Key = keyof typeof PATHWAYS;

function current(): Key {
  const v = new URLSearchParams(window.location.search).get('v');
  return v === '2' || v === '3' ? v : '1';
}

function App() {
  const v = current();
  const Pathway = PATHWAYS[v];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest('input, textarea, select, [contenteditable]')) return;
      if ((e.key === '1' || e.key === '2' || e.key === '3') && e.key !== v) {
        const url = new URL(window.location.href);
        url.searchParams.set('v', e.key);
        window.location.assign(url);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [v]);
  return (
    <Suspense fallback={null}>
      <Pathway />
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
