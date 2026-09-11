import { VARIANTS } from './HeroLogo/variants';
import { setVariant, useVariant } from '../site';

/** Review control: switches the treatment of the mark in place. State lives in the URL (?variant=) and localStorage. */
export function VariantSwitcher() {
  const current = useVariant();
  const active = VARIANTS.find((v) => v.id === current) ?? VARIANTS[0];
  return (
    <div className="ph-switcher" role="radiogroup" aria-label="Mark treatment">
      <span className="ph-switcher__label">Mark</span>
      {VARIANTS.map((v) => (
        <button
          key={v.id}
          type="button"
          role="radio"
          aria-checked={v.id === current}
          className="ph-switcher__option"
          data-active={v.id === current || undefined}
          onClick={() => setVariant(v.id)}
          title={v.blurb}
        >
          {v.label}
        </button>
      ))}
      <span className="ph-switcher__blurb" aria-live="polite">{active.blurb}</span>
    </div>
  );
}
