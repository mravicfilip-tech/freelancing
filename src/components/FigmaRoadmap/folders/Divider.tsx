import { useState } from 'react';
import { LEVELS, doneCount } from '../content';
import { Milestones } from '../shared';
import './Divider.css';

const LIVE = LEVELS.findIndex((l) => l.status === 'live');
const COMPLETE = LEVELS.filter((l) => l.status === 'done').length;
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Direction 5 — binder dividers.
 *
 * Seven full-width rules stacked flush on the band itself; no card holds them. Each divider's tab
 * sits at the right, and because the tabs are flush they stack into one column of paper down the
 * right edge, crossed by the [4,4] seams — a set of index dividers seen from the front. Opening
 * one slots its milestones in between the rules and pushes the tabs below it down, so the column
 * breaks exactly where the sheet has been pulled out.
 *
 * Closed rows still say something: the level's name, its marker and its ticked count, with the
 * blurb across the middle, so the order and the position read without a click.
 */
export function Divider() {
  const [open, setOpen] = useState(LIVE);

  return (
    <div className="rd-divider">
      <p className="rd-divider__legend rd-fam__part">
        <span className="rd-divider__legendLabel">Seven levels</span>
        <span className="rd-divider__tally">
          <b className="rd-digits">{pad(COMPLETE)}</b> of <b className="rd-digits">{pad(LEVELS.length)}</b> complete
        </span>
      </p>

      <ol className="rd-divider__stack">
        {LEVELS.map((level, i) => {
          const isOpen = i === open;
          const headId = `rd-divider-h${level.n}`;
          const bodyId = `rd-divider-b${level.n}`;
          return (
            <li
              className="rd-divider__row rd-fam__part"
              key={level.n}
              data-status={level.status}
              data-open={isOpen || undefined}
            >
              {/* The open divider's accent, on the outer edge the tabs align to. */}
              <span className="rd-divider__accent" aria-hidden="true">
                <i />
              </span>

              <button
                type="button"
                id={headId}
                className="rd-divider__head"
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span className="rd-divider__name">{level.name}</span>
                <span className="rd-divider__blurb">{level.blurb}</span>
                <span className="rd-divider__meta">
                  <span className="rd-divider__marker">{level.marker}</span>
                  <span className="rd-divider__count rd-digits">
                    {doneCount(level)}/{level.items.length}
                  </span>
                </span>
                <span className="rd-divider__tab">
                  <span className="rd-divider__n rd-digits">{level.n}</span>
                </span>
              </button>

              <div className="rd-divider__body" id={bodyId} role="region" aria-labelledby={headId}>
                <div>
                  <Milestones level={level} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
