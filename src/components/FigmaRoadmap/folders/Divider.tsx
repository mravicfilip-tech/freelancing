import { LEVELS } from '../content';
import './Divider.css';

/** Placeholder — this direction is being built. */
export function Divider() {
  return (
    <div className="rd-divider">
      {LEVELS.map((l) => (
        <p key={l.n}>
          {l.n} {l.name}
        </p>
      ))}
    </div>
  );
}
