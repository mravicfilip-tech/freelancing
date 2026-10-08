import { useEffect, useState } from 'react';
import { directions } from './directions';
import { Placeholder } from './components/Placeholder';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const readDirection = () => {
  const d = Number(new URLSearchParams(window.location.search).get('d'));
  return directions.some((x) => x.n === d) ? d : 1;
};

export function App() {
  const [reduced, setReduced] = useState(reducedQuery.matches);
  const [d, setD] = useState(readDirection);

  useEffect(() => {
    const on = () => setReduced(reducedQuery.matches);
    reducedQuery.addEventListener('change', on);
    return () => reducedQuery.removeEventListener('change', on);
  }, []);

  // Switching replays the picked direction from the top.
  const pick = (n: number) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const url = new URL(window.location.href);
    url.searchParams.set('d', String(n));
    window.history.replaceState(null, '', url);
    setD(n);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      const n = Number(e.key);
      if (directions.some((x) => x.n === n)) pick(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A switch lands at the top even if the old story's snap was still scrolling when it unmounted.
  useEffect(() => {
    const id = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    return () => cancelAnimationFrame(id);
  }, [d]);

  const current = directions.find((x) => x.n === d)!;
  const { Component } = current;

  return (
    <>
      <div className={`direction direction-${d}`}>
        <Component key={d} reduced={reduced} />
        <Placeholder />
      </div>
      {/* Review chrome for comparing the directions, not part of any design. */}
      <div className="dir-switch" role="group" aria-label="Pravci, tasteri 1 do 5">
        {directions.map((x) => (
          <button key={x.n} type="button" aria-pressed={x.n === d} onClick={() => pick(x.n)}>
            <span>{x.n}</span>
            {x.name}
          </button>
        ))}
      </div>
    </>
  );
}
