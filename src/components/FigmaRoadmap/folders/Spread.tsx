import { useRef, useState } from 'react';
import { LEVELS, STATUS_LABEL, doneCount } from '../content';
import { Milestones } from '../shared';
import './Spread.css';

/**
 * Spread — the folder opened flat. One card, two facing pages, the design's [4,4] vertical rule
 * down the gutter between them.
 *
 * Verso (left): the contents page. All seven levels, numbered in the digits face, leadered across
 * to their milestone counts, ruled on the [4,4] stroke. It is a register, not a menu — everything
 * on it is small, quiet and in one column of numerals, so the eye reads the run of `5/5` breaking
 * to `2/5` and finds where the project is without a click.
 *
 * Recto (right): the level set as a page. Chapter opening (numeral + name + marker), a line of
 * prose, then the five milestones, and a foot that turns to the next page.
 *
 * The two pages carry their weight deliberately unevenly: the verso is 420px of 13–17px type on
 * hairlines; the recto holds the one big display line, the one chip of colour and the prose. Both
 * text blocks are justified between a head rule and a foot rule that run across the gutter, which
 * is what makes them read as one sheet rather than two panels.
 */

const TOTAL = LEVELS.reduce((n, l) => n + l.items.length, 0);
const DONE = LEVELS.reduce((n, l) => n + doneCount(l), 0);
const LIVE = Math.max(0, LEVELS.findIndex((l) => l.status === 'live'));

export function Spread() {
  const [open, setOpen] = useState(LIVE);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const level = LEVELS[open];
  const next = LEVELS[open + 1];
  const live = LEVELS[LIVE];

  /** A vertical tab set: the arrows move the selection and the focus together. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = LEVELS.length - 1;
    const to =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? (open + 1) % LEVELS.length
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? (open + last) % LEVELS.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : -1;
    if (to < 0) return;
    e.preventDefault();
    setOpen(to);
    tabs.current[to]?.focus();
  };

  return (
    <div className="rd-spread">
      {/* ---------------- Verso: the contents page ---------------- */}
      <div className="rd-spread__page rd-spread__page--index rd-fam__part">
        <div className="rd-spread__head">
          <span className="rd-spread__running">Contents</span>
          <span className="rd-spread__runningEnd">Seven levels</span>
        </div>

        <ol
          className="rd-spread__index"
          role="tablist"
          aria-orientation="vertical"
          aria-label="Roadmap levels"
          onKeyDown={onKeyDown}
        >
          {LEVELS.map((l, i) => (
            <li
              className="rd-spread__entry"
              key={l.n}
              role="presentation"
              data-status={l.status}
              data-open={i === open || undefined}
            >
              <i className="rd-spread__accent" aria-hidden="true">
                <i />
              </i>
              <button
                type="button"
                role="tab"
                id={`rd-spread-tab-${l.n}`}
                aria-selected={i === open}
                aria-controls="rd-spread-leaf"
                tabIndex={i === open ? 0 : -1}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                onClick={() => setOpen(i)}
                aria-label={`Level ${l.n}, ${l.name}. ${STATUS_LABEL[l.status]}. ${doneCount(l)} of ${l.items.length} milestones done.`}
              >
                <span className="rd-spread__folio rd-digits">{l.n}</span>
                <span className="rd-spread__entryName">{l.name}</span>
                <i className="rd-spread__leader" aria-hidden="true" />
                <span className="rd-spread__count rd-digits">
                  {doneCount(l)}/{l.items.length}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="rd-spread__foot">
          <span>
            Now on level <b className="rd-digits">{live.n}</b>
          </span>
          <span>
            <b className="rd-digits">
              {DONE}/{TOTAL}
            </b>{' '}
            complete
          </span>
        </div>
      </div>

      {/* The gutter: the crease the two pages are joined on. */}
      <i className="rd-spread__gutter rd-fam__part" aria-hidden="true" />

      {/* ---------------- Recto: the open level, set as a page ---------------- */}
      <div
        className="rd-spread__page rd-spread__page--leaf rd-fam__part"
        id="rd-spread-leaf"
        role="tabpanel"
        aria-labelledby={`rd-spread-tab-${level.n}`}
      >
        <div className="rd-spread__head">
          <span className="rd-spread__running">Remittix roadmap</span>
          <span className="rd-spread__runningEnd">{STATUS_LABEL[level.status]}</span>
        </div>

        {/* Keyed on the level, so choosing another entry sets the page again from the gutter. */}
        <div className="rd-spread__leaf" key={level.n}>
          <h3 className="rd-spread__title">
            <span className="rd-spread__titleN rd-digits">{level.n}</span>
            <span className="rd-spread__titleName">{level.name}</span>
            <span className="rd-spread__marker" data-status={level.status}>
              {level.marker}
            </span>
          </h3>
          <p className="rd-spread__blurb">{level.blurb}</p>
          <Milestones level={level} />

          <div className="rd-spread__foot rd-spread__foot--leaf">
            {next ? (
              <button type="button" className="rd-spread__turn" onClick={() => setOpen(open + 1)}>
                Turn to <b className="rd-digits">{next.n}</b> {next.name}
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path
                    d="M2.5 8h10M9 4.5 12.5 8 9 11.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <span>End of the roadmap</span>
            )}
            <span className="rd-spread__folioEnd rd-digits">
              {level.n}/{LEVELS[LEVELS.length - 1].n}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
