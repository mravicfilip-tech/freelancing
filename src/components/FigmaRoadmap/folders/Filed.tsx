import { useState, type CSSProperties } from 'react';
import { LEVELS, doneCount } from '../content';
import { Milestones } from '../shared';
import './Filed.css';

/**
 * Filed — the stack seen from above.
 *
 * Seven sheets filed one behind the next, each carrying its own tab cut from its own paper and
 * pushed above its top edge, the tabs stepping left to right across the stack. One folder is
 * pulled up at a time: it steps out past the stack's edges, opens a gap above and below itself and
 * sets its level as a page — the blurb in a caption column, the five milestones ruled beside it.
 *
 * Three things are meant to read without a click:
 *  - where the project is — the tabs run four solid, one indigo, two dashed across the stack;
 *  - what each level is — a closed sheet still carries its five milestones as short labels, the
 *    done ones in ink and the rest muted, so the row is a contents line rather than a name;
 *  - that the levels are ordered — the tabs step, and each tab carries its number.
 */
export function Filed() {
  const [open, setOpen] = useState(() => LEVELS.findIndex((l) => l.status === 'live'));
  const complete = LEVELS.filter((l) => l.status === 'done').length;

  return (
    <div className="rd-filed">
      <ol className="rd-filed__stack">
        {LEVELS.map((l, i) => {
          const done = doneCount(l);
          const isOpen = i === open;
          return (
            <li
              key={l.n}
              className="rd-filed__sheet rd-fam__part"
              data-status={l.status}
              data-open={isOpen || undefined}
              /* The sheet above the open one is the top of a sub-stack, so it takes its bottom
                 corners back; the tabs step across the stack on the index. */
              data-edge={i === open - 1 ? 'above' : undefined}
              style={{ '--i': i } as CSSProperties}
            >
              <h3 className="rd-filed__head">
                <button
                  type="button"
                  id={`rd-filed-tab-${l.n}`}
                  className="rd-filed__pull"
                  aria-expanded={isOpen}
                  aria-controls={`rd-filed-sheet-${l.n}`}
                  onClick={() => setOpen(i)}
                >
                  <span className="rd-filed__tab">
                    <span className="rd-filed__sr">Level </span>
                    <span className="rd-digits">{l.n}</span>
                  </span>

                  <span className="rd-filed__name">{l.name}</span>

                  {/* The contents of the folder, laid along the row: the ticked ones in ink. */}
                  <span className="rd-filed__contents" aria-hidden="true">
                    {l.items.map((it) => (
                      <span className="rd-filed__short" key={it.short} data-done={it.done || undefined}>
                        {it.short}
                      </span>
                    ))}
                  </span>

                  <span className="rd-filed__meta">
                    <span className="rd-filed__count rd-digits" aria-hidden="true">
                      {done}
                      <i>/{l.items.length}</i>
                    </span>
                    <span className="rd-filed__sr">
                      {done} of {l.items.length} milestones complete.
                    </span>
                    <span className="rd-filed__marker" data-status={l.status}>
                      {l.marker}
                    </span>
                  </span>
                </button>
              </h3>

              <div
                className="rd-filed__body"
                id={`rd-filed-sheet-${l.n}`}
                role="region"
                aria-labelledby={`rd-filed-tab-${l.n}`}
              >
                <div>
                  <div className="rd-filed__inner">
                    <div className="rd-filed__aside">
                      <p className="rd-filed__folio">
                        Level <span className="rd-digits">{l.n}</span> of{' '}
                        <span className="rd-digits">{String(LEVELS.length).padStart(2, '0')}</span>
                      </p>
                      <p className="rd-filed__blurb">{l.blurb}</p>
                    </div>
                    <Milestones level={l} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* The drawer's face, closing the stack. */}
      <p className="rd-filed__plate rd-fam__part">
        <span className="rd-filed__plateLabel">Remittix roadmap</span>
        <span className="rd-filed__tally">
          <b className="rd-digits">{String(complete).padStart(2, '0')}</b> of{' '}
          <b className="rd-digits">{String(LEVELS.length).padStart(2, '0')}</b> levels complete
        </span>
      </p>
    </div>
  );
}
