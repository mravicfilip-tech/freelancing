import { useState, type CSSProperties } from 'react';
import { LEVELS, doneCount } from '../content';
import { Milestones } from '../shared';
import './Filed.css';

/**
 * Filed — the stack seen from above.
 *
 * A rail of the seven levels over a stack of tabbed sheets, one open at a time, and a plate
 * closing the drawer. Each sheet carries its own tab, cut from its own paper and pushed above its
 * top edge so it lies over the sheet in front of it; the tabs step left to right across the stack
 * and every rail stop sits on the column of its own tab, so the rail and the stack are one object
 * rather than two. The open folder steps out past the stack's edges, opens air above and below
 * itself and sets its level as a page — the blurb in a caption column, the milestones ruled beside.
 *
 * Three things are meant to read without a click:
 *  - where the project is — the rail is drawn as far as the level in play, and the tabs run four
 *    solid, one indigo, two dashed across the stack;
 *  - what each level is — a closed sheet still carries its five milestones as short labels, the
 *    done ones in ink and the rest muted, so the row is a contents line rather than a name;
 *  - that the levels are ordered — the tabs step, and every one carries its number.
 */
export function Filed() {
  const live = LEVELS.findIndex((l) => l.status === 'live');
  const [open, setOpen] = useState(live);
  const complete = LEVELS.filter((l) => l.status === 'done').length;

  return (
    <div className="rd-filed" style={{ '--f-live': live } as CSSProperties}>
      {/* The rail over the drawer: one stop per level, each on the column of its own tab, the
          stroke drawn in ink as far as the level in play and dashed the rest of the way. */}
      <ol className="rd-filed__rail rd-fam__part" aria-label="Roadmap levels">
        <li className="rd-filed__railLine" aria-hidden="true">
          <i />
        </li>
        {LEVELS.map((l, i) => (
          <li
            key={l.n}
            className="rd-filed__stop"
            data-status={l.status}
            data-open={i === open || undefined}
            style={{ '--i': i } as CSSProperties}
          >
            <button
              type="button"
              aria-current={i === open ? 'true' : undefined}
              aria-controls={`rd-filed-sheet-${l.n}`}
              onClick={() => setOpen(i)}
            >
              <span className="rd-filed__stopName">{l.name}</span>
              <span className="rd-filed__dot" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>

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
                      <div>
                        <p className="rd-filed__folio">
                          Level <span className="rd-digits">{l.n}</span> of{' '}
                          <span className="rd-digits">{String(LEVELS.length).padStart(2, '0')}</span>
                        </p>
                        <p className="rd-filed__blurb">{l.blurb}</p>
                      </div>
                      {/* The level's five milestones as one figure, at the foot of the caption. */}
                      <p className="rd-filed__meter">
                        <span className="rd-filed__pips" aria-hidden="true">
                          {l.items.map((it) => (
                            <i key={it.short} data-done={it.done || undefined} />
                          ))}
                        </span>
                        <span className="rd-filed__meterCap">
                          <b className="rd-digits">{done}</b> of{' '}
                          <b className="rd-digits">{l.items.length}</b> milestones done
                        </span>
                      </p>
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
