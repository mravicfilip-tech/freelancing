import { GLOBES } from './HeroPlanet/variants';
import { setGlobe, useGlobe } from '../heroVariant';

/** Review control: switches the globe treatment in place. State lives in the URL (?globe=) and localStorage. */
export function PlanetSwitcher() {
  const current = useGlobe();
  const active = GLOBES.find((g) => g.id === current) ?? GLOBES[0];
  return (
    <div className="switcher" role="radiogroup" aria-label="Globe treatment">
      <span className="switcher__label">Globe</span>
      {GLOBES.map((g) => (
        <button
          key={g.id}
          type="button"
          role="radio"
          aria-checked={g.id === current}
          className="switcher__option"
          data-active={g.id === current || undefined}
          onClick={() => setGlobe(g.id)}
          title={g.blurb}
        >
          {g.label}
        </button>
      ))}
      <span className="switcher__blurb" aria-live="polite">{active.blurb}</span>
    </div>
  );
}
