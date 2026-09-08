import { useRef, useState } from 'react';
import { LEVELS, STATUS_LABEL, doneCount } from '../content';
import { Milestones } from '../shared';
import './Deck.css';

/**
 * Deck — the files stood on their spines.
 *
 * The open level is a full card; the rest stand beside it in a rack of seven equal slots. The slot
 * belonging to the open level keeps its place but empties out — same paper gone, a [4,4] rule down
 * each edge, its number and name left in the rail grey — so the rack always reads 01 → 07 and the
 * gap says which file is in your hand. The widths never move: pulling a file out swaps two slots'
 * states, it does not reflow the rack.
 *
 * A spine has to say where the project is from a 64px strip, so it carries four things: the number
 * in the digits face, the name and the level's own marker word set with `writing-mode` (never a
 * rotate — the metrics have to survive), and a five-cell tally of the milestones, filled for the
 * ones that are done. Four full tallies, one part-filled, two empty is the whole roadmap at a
 * glance. Indigo marks exactly one thing: level 05, wherever it happens to be — the live spine's
 * tally and marker in the rack, or the card's accent bar and eyebrow once it is pulled out.
 */
export function Deck() {
  const [open, setOpen] = useState(() => Math.max(0, LEVELS.findIndex((l) => l.status === 'live')));
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const level = LEVELS[open];

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    let next = -1;
    if (step !== 0) next = (open + step + LEVELS.length) % LEVELS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = LEVELS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setOpen(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="rd-deck">
      <ol className="rd-deck__rack" role="tablist" aria-label="Roadmap levels">
        {LEVELS.map((l, i) => (
          <li
            className="rd-deck__slot rd-fam__part"
            key={l.n}
            data-status={l.status}
            data-out={i === open || undefined}
          >
            <button
              type="button"
              className="rd-deck__spine"
              role="tab"
              id={`rd-deck-tab-${l.n}`}
              aria-selected={i === open}
              aria-controls="rd-deck-panel"
              tabIndex={i === open ? 0 : -1}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              onClick={() => setOpen(i)}
              onKeyDown={onKey}
            >
              <span className="rd-deck__n rd-digits">{l.n}</span>
              {/* The spine's label: one vertical run, name then marker, as a spine is set. */}
              <span className="rd-deck__label">
                <span className="rd-deck__spineName">{l.name}</span>
                <span className="rd-deck__spineMarker">{l.marker}</span>
              </span>
              <span className="rd-deck__tally" aria-hidden="true">
                {l.items.map((item) => (
                  <i key={item.short} data-on={item.done || undefined} />
                ))}
              </span>
              <span className="rd-deck__sr">
                {`${STATUS_LABEL[l.status]} — ${doneCount(l)} of ${l.items.length} milestones done`}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <article
        className="rd-deck__card rd-fam__part"
        id="rd-deck-panel"
        role="tabpanel"
        aria-labelledby={`rd-deck-tab-${level.n}`}
        data-status={level.status}
      >
        {/* The 2px accent the design marks an open thing with — shown only on the live level. */}
        <i className="rd-deck__live" aria-hidden="true" />
        {/* Keyed on the level, so the page re-deals its rows every time a file is pulled. */}
        <div className="rd-deck__page" key={level.n}>
          <div className="rd-deck__head">
            <span className="rd-deck__eyebrow">{STATUS_LABEL[level.status]}</span>
            <span className="rd-deck__chip">{level.marker}</span>
          </div>
          <p className="rd-deck__folio rd-digits">{level.n}</p>
          <h3 className="rd-deck__name">
            <span className="rd-deck__line">
              <span className="rd-deck__lineInner">{level.name}</span>
            </span>
          </h3>
          <p className="rd-deck__blurb">{level.blurb}</p>
          <div className="rd-deck__miles">
            <Milestones level={level} />
          </div>
        </div>
      </article>
    </div>
  );
}
