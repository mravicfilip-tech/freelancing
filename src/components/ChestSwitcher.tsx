import { CHESTS, setChest, useChest } from './FigmaHero/chestVariant';

/** Review control: switches the chest direction in place. State lives in the URL (?chest=) and localStorage. */
export function ChestSwitcher() {
  const current = useChest();
  const active = CHESTS.find((c) => c.id === current) ?? CHESTS[0];
  return (
    <div className="switcher" role="radiogroup" aria-label="Chest animation">
      <span className="switcher__label">Chest</span>
      {CHESTS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={c.id === current}
          className="switcher__option"
          data-active={c.id === current || undefined}
          onClick={() => setChest(c.id)}
          title={c.blurb}
        >
          {c.label}
        </button>
      ))}
      <span className="switcher__blurb" aria-live="polite">{active.blurb}</span>
    </div>
  );
}
