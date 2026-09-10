import { flashStyle } from './theme';

const FLASH = [
  ['1', 'Big clock'],
  ['2', 'Clock left'],
  ['3', 'Accent band'],
  ['4', 'Centred'],
  ['5', 'Ticket'],
] as const;

/** Review control for the flash sale. Remove once a variant is settled. */
export function VariantPicker() {
  const flash = flashStyle.use();
  return (
    <div className="vpick">
      <div className="vpick__row">
        <span className="vpick__label">Flash</span>
        {FLASH.map(([id, name]) => (
          <button
            key={id}
            type="button"
            className="vpick__opt"
            data-active={flash === id || undefined}
            onClick={() => flashStyle.set(id)}
          >
            {id}. {name}
          </button>
        ))}
      </div>
    </div>
  );
}
