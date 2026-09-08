import { LEVELS } from '../content';
import './Deck.css';

/** Placeholder — this direction is being built. */
export function Deck() {
  return (
    <div className="rd-deck">
      {LEVELS.map((l) => (
        <p key={l.n}>
          {l.n} {l.name}
        </p>
      ))}
    </div>
  );
}
