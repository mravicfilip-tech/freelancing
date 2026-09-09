import { LEVEL } from '../data';
import { ChevronRight, RankBadge } from '../icons';
import { Progress } from '../Progress';

export function LevelCard() {
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

        <Progress value={LEVEL.progress} label={`Progress to level ${LEVEL.next}`} />

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
