// Dev route for storyline 2, /?story2=<linija|grad|sistem>, one version without the version switcher.
import { Grad, Linija, Sistem } from './versions';

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const VERSIONS = { linija: Linija, grad: Grad, sistem: Sistem };

export function Harness2() {
  const id = new URLSearchParams(window.location.search).get('story2') ?? '';
  const Version = VERSIONS[id as keyof typeof VERSIONS] ?? Linija;
  return <Version reduced={reducedQuery.matches} />;
}
