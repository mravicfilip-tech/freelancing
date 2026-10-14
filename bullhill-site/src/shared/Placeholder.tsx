import type { CSSProperties } from 'react';
import type { Shot } from './content';
import { MARK_PATHS, MARK_VIEWBOX } from './markPaths';

type Props = {
  shot: Shot;
  label: string;
  index?: number;
  ratio?: string;
  className?: string;
  style?: CSSProperties;
  brief?: boolean;
  mark?: boolean;
};

// A photo slot until BullHill's own photos arrive. It shows the brief for the shot to take, so
// the page doubles as a shot list. Restyle it with the --ph-* custom properties.
export function Placeholder({ shot, label, index, ratio, className, style, brief = true, mark = true }: Props) {
  const n = index === undefined ? '' : ` ${String(index).padStart(2, '0')}`;
  return (
    <figure className={`ph ${className ?? ''}`} style={{ aspectRatio: ratio, ...style }} role="img" aria-label={`${label}. ${shot.brief}`}>
      <span className="ph__grain" aria-hidden="true" />
      {mark && (
        <svg className="ph__mark" viewBox={MARK_VIEWBOX} aria-hidden="true">
          {MARK_PATHS.map((d, i) => (
            <path key={i} d={d} fill="currentColor" />
          ))}
        </svg>
      )}
      <span className="ph__label" aria-hidden="true">{label}{n}</span>
      {brief && <figcaption className="ph__brief" aria-hidden="true">{shot.brief}</figcaption>}
    </figure>
  );
}
