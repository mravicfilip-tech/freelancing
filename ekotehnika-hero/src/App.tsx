import { Suspense, lazy, useEffect, useState } from 'react';
import { variants } from './variants';
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
  const [v] = useState(readVariant);

  useEffect(() => {
    const on = () => setReduced(reducedQuery.matches);
    reducedQuery.addEventListener('change', on);
    return () => reducedQuery.removeEventListener('change', on);
  }, []);

  // The page always opens at the top.
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
      </div>
    </>
  );
}
