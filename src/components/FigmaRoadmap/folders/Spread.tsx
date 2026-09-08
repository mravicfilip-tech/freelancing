import { LEVELS } from '../content';
import './Spread.css';

/** Placeholder — this direction is being built. */
export function Spread() {
  return (
    <div className="rd-spread">
      {LEVELS.map((l) => (
        <p key={l.n}>
          {l.n} {l.name}
        </p>
      ))}
    </div>
  );
}
