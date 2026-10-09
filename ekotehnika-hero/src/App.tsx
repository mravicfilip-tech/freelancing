import { Suspense, lazy, useEffect, useState } from 'react';
import { variants } from './variants';
import { Placeholder } from './components/Placeholder';
import { scrollToTop } from './scroll/useScrollStory';

const Gate = lazy(() => import('./r3f/Gate').then((m) => ({ default: m.Gate })));
const Board = lazy(() => import('./board/Board').then((m) => ({ default: m.Board })));
const StoryHarness = lazy(() => import('./story/Harness').then((m) => ({ default: m.Harness })));
const StoryHarness2 = lazy(() => import('./story2/Harness').then((m) => ({ default: m.Harness2 })));

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const readVariant = () => {
  const v = (new URLSearchParams(window.location.search).get('v') ?? '').toUpperCase();
  return variants.some((x) => x.id === v) ? v : variants[0].id;
};

export function App() {
  if (new URLSearchParams(window.location.search).has('gate'))
    return (
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
    );
  if (new URLSearchParams(window.location.search).has('story2'))
    return (
      <Suspense fallback={null}>
        <StoryHarness2 />
      </Suspense>
    );
  if (new URLSearchParams(window.location.search).has('story'))
    return (
      <Suspense fallback={null}>
        <StoryHarness />
      </Suspense>
    );
  if (new URLSearchParams(window.location.search).has('board'))
    return (
      <Suspense fallback={null}>
        <Board />
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

  const pick = (id: string) => {
    scrollToTop();
    const url = new URL(window.location.href);
    url.searchParams.set('v', id);
    window.history.replaceState(null, '', url);
    setV(id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      // Keys 2, 4 and 5 pick the versions.
      if (variants.some((x) => x.id === e.key)) pick(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A switch always lands at the top.
  useEffect(() => {
    const id = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(id);
  }, [v]);

  const { Component } = variants.find((x) => x.id === v)!;

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
      <div className="dir-switch" role="group" aria-label="Verzije, tasteri 2, 4 i 5">
        {variants.map((x) => (
          <button key={x.id} type="button" aria-pressed={x.id === v} onClick={() => pick(x.id)} title={x.name}>
            <span>{x.id}</span>
            {x.name}
          </button>
        ))}
      </div>
    </>
  );
}
