import { StrictMode, Suspense, lazy, useEffect, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import './shared/base.css';

// Three design pathways in one app. ?v=1 Foundry, ?v=2 Daylight, ?v=3 Underground, ?lang=de for
// German. Keys 1, 2 and 3 switch pathway outside form fields. The public build, `npm run build:public`,
// keeps Foundry only, with no keys and no pathway switch, so the root address opens Foundry.
// The env check is written out here, not imported, so the build drops the other two pathways.
const PUBLIC = import.meta.env.VITE_PUBLIC === '1';
const Foundry = lazy(() => import('./p1/Foundry'));
const PATHWAYS: Record<'1' | '2' | '3', ComponentType> = PUBLIC
  ? { '1': Foundry, '2': Foundry, '3': Foundry }
  : {
      '1': Foundry,
      '2': lazy(() => import('./p2/Daylight')),
      '3': lazy(() => import('./p3/Underground')),
    };
type Key = keyof typeof PATHWAYS;

// The legal notice and the privacy page have their own addresses, /legal and /privacy.
const Legal = lazy(() => import('./legal/Legal'));
function legalPage(): 'legal' | 'privacy' | null {
  const p = window.location.pathname.replace(/\/+$/, '');
  return p === '/legal' || p === '/privacy' ? (p.slice(1) as 'legal' | 'privacy') : null;
}

function current(): Key {
  if (PUBLIC) return '1';
  const v = new URLSearchParams(window.location.search).get('v');
  return v === '2' || v === '3' ? v : '1';
}

function App() {
  const v = current();
  const Pathway = PATHWAYS[v];
  useEffect(() => {
    if (PUBLIC) return;
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
  const page = legalPage();
  return <Suspense fallback={null}>{page ? <Legal page={page} /> : <Pathway />}</Suspense>;
}

// the frame meter for a review build, ?perf=1, see shared/perfHud.ts. The public build drops it.
if (!PUBLIC && new URLSearchParams(window.location.search).get('perf') === '1') void import('./shared/perfHud').then((m) => m.startPerfHud());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
