import { ROADMAPS } from './Roadmap';
import { setRoadmap, useRoadmap } from '../heroVariant';

/** Review control: switches the roadmap direction in place. State lives in the URL (?roadmap=) and localStorage. */
export function RoadmapSwitcher() {
  const current = useRoadmap();
  const active = ROADMAPS.find((r) => r.id === current) ?? ROADMAPS[0];
  return (
    <div className="switcher switcher--roadmap" role="radiogroup" aria-label="Roadmap direction">
      <span className="switcher__label">Roadmap</span>
      {ROADMAPS.map((r) => (
        <button
          key={r.id}
          type="button"
          role="radio"
          aria-checked={r.id === current}
          className="switcher__option"
          data-active={r.id === current || undefined}
          onClick={() => setRoadmap(r.id)}
          title={r.blurb}
        >
          {r.label}
        </button>
      ))}
      <span className="switcher__blurb" aria-live="polite">{active.blurb}</span>
    </div>
  );
}
