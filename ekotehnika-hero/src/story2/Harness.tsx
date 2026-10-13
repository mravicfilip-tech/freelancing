// Dev route for storyline 2, /?story2=sistem, version 5 without the app around it.
import { Sistem } from './versions';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export function Harness2() {
  return <Sistem reduced={reducedQuery.matches} />;
}
