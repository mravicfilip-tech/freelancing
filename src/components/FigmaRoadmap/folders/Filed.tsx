import { LEVELS } from '../content';
import './Filed.css';

/** Placeholder — this direction is being built. */
export function Filed() {
  return (
    <div className="rd-filed">
      {LEVELS.map((l) => (
        <p key={l.n}>
          {l.n} {l.name}
        </p>
      ))}
    </div>
  );
}
