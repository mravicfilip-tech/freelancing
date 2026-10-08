import { useEffect, useState } from 'react';
import { Stage } from './components/Stage';
import type { Variant } from './components/Stage';
import { Placeholder } from './components/Placeholder';
import { Switcher } from './components/Switcher';

const readVariant = (): Variant => {
  const v = Number(new URLSearchParams(window.location.search).get('v'));
  return v === 2 || v === 3 ? v : 1;
};

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function App() {
  const [variant, setVariant] = useState<Variant>(readVariant);
  const [run, setRun] = useState(0);
  const [reduced, setReduced] = useState(reducedQuery.matches);

  useEffect(() => {
    const on = () => setReduced(reducedQuery.matches);
    reducedQuery.addEventListener('change', on);
    return () => reducedQuery.removeEventListener('change', on);
  }, []);

  // Switching, or picking the same variant again, replays it from the top.
  const pick = (v: Variant) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(v));
    window.history.replaceState(null, '', url);
    setVariant(v);
    setRun((n) => n + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      if (e.key === '1' || e.key === '2' || e.key === '3') pick(Number(e.key) as Variant);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Stage key={`${variant}-${run}`} variant={variant} reduced={reduced} />
      <Placeholder />
      <Switcher variant={variant} onPick={pick} />
    </>
  );
}
