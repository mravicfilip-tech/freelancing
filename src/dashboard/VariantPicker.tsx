import { headStyle, navStyle } from './theme';

const NAV = [
  ['1', 'Outline'],
  ['2', 'Solid'],
  ['3', 'Tiles'],
  ['4', 'Icons only'],
  ['5', 'Pills'],
] as const;

const HEAD = [
  ['1', 'Cards'],
  ['2', 'Strip'],
  ['3', 'Lead stat'],
  ['4', 'One panel'],
  ['5', 'Toolbar'],
] as const;

/** Review control for the two treatments under discussion. Drop this component
 *  from Dashboard.tsx once a variant is settled. */
export function VariantPicker() {
  const nav = navStyle.use();
  const head = headStyle.use();

  return (
    <div className="vpick">
      <div className="vpick__row">
        <span className="vpick__label">Rail</span>
        {NAV.map(([id, name]) => (
          <button
            key={id}
            type="button"
            className="vpick__opt"
            data-active={nav === id || undefined}
            onClick={() => navStyle.set(id)}
          >
            {id}. {name}
          </button>
        ))}
      </div>
      <div className="vpick__row">
        <span className="vpick__label">Header</span>
        {HEAD.map(([id, name]) => (
          <button
            key={id}
            type="button"
            className="vpick__opt"
            data-active={head === id || undefined}
            onClick={() => headStyle.set(id)}
          >
            {id}. {name}
          </button>
        ))}
      </div>
    </div>
  );
}
