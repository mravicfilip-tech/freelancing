import { useEffect, useState } from 'react';
import { Stage } from './components/Stage';
import { Placeholder } from './components/Placeholder';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function App() {
  const [reduced, setReduced] = useState(reducedQuery.matches);

  useEffect(() => {
    const on = () => setReduced(reducedQuery.matches);
    reducedQuery.addEventListener('change', on);
    return () => reducedQuery.removeEventListener('change', on);
  }, []);

  return (
    <>
      <Stage reduced={reduced} />
      <Placeholder />
    </>
  );
}
