import { LEVELS } from '../content';
import './Cabinet.css';

/** Placeholder — this direction is being built. */
export function Cabinet() {
  return (
    <div className="rd-cabinet">
      {LEVELS.map((l) => (
        <p key={l.n}>
          {l.n} {l.name}
        </p>
      ))}
    </div>
  );
}
