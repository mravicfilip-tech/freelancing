import { LEVEL } from '../data';
import { ChevronRight, RankBadge } from '../icons';

export function LevelCard() {
  const pct = Math.round(LEVEL.progress * 100);
  return (
    <section className="level" aria-label="Your level">
      <div className="card__head">
        <h2 className="card__title">Your level</h2>
        <a className="level__link" href="#leaderboard">
          View leaderboard
          <ChevronRight className="icon-14" />
        </a>
      </div>

      <div className="level__body">
        <div className="level__rank">
          <RankBadge tone="bronze" className="level__badge" />
          <div>
            <p className="level__rank-name">Level {LEVEL.current}</p>
            <p className="level__rank-note">Current rank</p>
          </div>
        </div>

        <div
          className="meter"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress to level ${LEVEL.next}`}
        >
          <span className="meter__fill" style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>

        <div className="level__rank level__rank--next">
          <RankBadge tone="silver" className="level__badge" />
          <div>
            <p className="level__rank-name">Level {LEVEL.next}</p>
            <p className="level__rank-note">Next rank</p>
          </div>
        </div>
      </div>
    </section>
  );
}
