import { Suspense, lazy, useEffect, useState } from 'react';
import { variants } from './variants';
import { Placeholder } from './components/Placeholder';
import { scrollToTop } from './scroll/useScrollStory';

const Gate = lazy(() => import('./r3f/Gate').then((m) => ({ default: m.Gate })));

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const readVariant = () => {
  const v = Number(new URLSearchParams(window.location.search).get('v'));
  return variants.some((x) => x.n === v) ? v : 1;
};

export function App() {
  if (new URLSearchParams(window.location.search).has('gate'))
    return (
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
    );
  return <Variants />;
}

function Variants() {
  const [reduced, setReduced] = useState(reducedQuery.matches);
  const [v, setV] = useState(readVariant);

  useEffect(() => {
    const on = () => setReduced(reducedQuery.matches);
    reducedQuery.addEventListener('change', on);
    return () => reducedQuery.removeEventListener('change', on);
  }, []);

  const pick = (n: number) => {
    scrollToTop();
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(n));
    window.history.replaceState(null, '', url);
    setV(n);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      const n = Number(e.key);
      if (variants.some((x) => x.n === n)) pick(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A switch always lands at the top.
  useEffect(() => {
    const id = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(id);
  }, [v]);

  const { Component } = variants.find((x) => x.n === v)!;

  return (
    <>
      <div className={`variant variant-${v}`}>
        {/* The pin wraps the stage in its own spacer, so React must remove a wrapper it owns. */}
        <div key={v}>
          <Suspense fallback={<div style={{ height: '100vh' }} aria-hidden="true" />}>
            <Component reduced={reduced} />
          </Suspense>
        </div>
        <Placeholder />
      </div>
      {/* Review chrome for comparing the variants, not part of any design. */}
      <div className="dir-switch" role="group" aria-label="Varijante, tasteri 1 do 5">
        {variants.map((x) => (
          <button key={x.n} type="button" aria-pressed={x.n === v} onClick={() => pick(x.n)}>
            <span>{x.n}</span>
            {x.name}
          </button>
        ))}
      </div>
    </>
  );
}
