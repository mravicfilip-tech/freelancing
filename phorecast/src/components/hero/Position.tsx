import './Position.css';

type Props = {
  index: number;      // zero-based
  count: number;
  onSelect: (i: number) => void;
  label?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "01 / 04" counter with a four-segment ladder (Figma "Position" component). */
export function Position({ index, count, onSelect, label = 'Slide' }: Props) {
  return (
    <div className="position">
      <div className="position__counter" aria-live="polite">
        <span className="position__current">{pad(index + 1)}</span>
        <span className="position__slash">/</span>
        <span className="position__total">{pad(count)}</span>
      </div>
      <div className="position__ladder" role="tablist" aria-label={`${label} navigation`}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${label} ${i + 1}`}
            className={`position__seg${i === index ? ' is-active' : ''}`}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>
    </div>
  );
}
