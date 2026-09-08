import { useRef, useState, type KeyboardEvent } from 'react';
import { LEVELS, STATUS_LABEL, doneCount, type LevelStatus } from '../content';
import { Milestones } from '../shared';
import './Cabinet.css';

/**
 * Cabinet — the drawer seen from the front. One sheet, and a strip of seven tabs standing on its
 * top edge. The selected tab is the sheet's own paper: it is taller, it is white, and its bottom
 * edge is open into the panel — the tab's bottom border is painted in the card colour and pulled
 * 1px down over the panel's top rule, so the hairline is erased under exactly that tab. The other
 * six keep their bottom edge, sit a step lower and are filled a tone down from the band, which is
 * how a file behind the open one reads.
 *
 * The strip carries the number, the name and a status mark, so the order of the levels, what each
 * one is and where the project stands are all readable before anything is clicked.
 */

const TALLY = {
  done: LEVELS.filter((l) => l.status === 'done').length,
  live: LEVELS.filter((l) => l.status === 'live').length,
  next: LEVELS.filter((l) => l.status === 'next').length,
};

/** The mark on a tab: a tick once the level is finished, a filled node for the level in play,
 *  an open ring for the ones ahead — the same vocabulary as the milestone ticks. */
function Mark({ status }: { status: LevelStatus }) {
  if (status === 'done') {
    return (
      <svg className="rd-cabinet__mark" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
        <path
          d="M2 6.3 4.6 8.9 10 3.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return <i className="rd-cabinet__node" data-status={status} aria-hidden="true" />;
}

export function Cabinet() {
  // The drawer opens on the level in play, so "where we are" is what the panel shows first.
  const start = Math.max(0, LEVELS.findIndex((l) => l.status === 'live'));
  const [active, setActive] = useState(start);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const level = LEVELS[active];
  const done = doneCount(level);

  const move = (i: number) => {
    const n = (i + LEVELS.length) % LEVELS.length;
    setActive(n);
    tabs.current[n]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowDown: active + 1,
      ArrowLeft: active - 1,
      ArrowUp: active - 1,
      Home: 0,
      End: LEVELS.length - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    move(keys[e.key]);
  };

  return (
    <div className="rd-cabinet">
      <div className="rd-cabinet__cap rd-fam__part">
        <span className="rd-cabinet__capLabel">The drawer · seven levels</span>
        <span className="rd-cabinet__capStats">
          <b className="rd-digits">{TALLY.done}</b> complete
          <em aria-hidden="true">·</em>
          <b className="rd-digits" data-live>
            {TALLY.live}
          </b>{' '}
          in progress
          <em aria-hidden="true">·</em>
          <b className="rd-digits">{TALLY.next}</b> ahead
        </span>
      </div>

      <div className="rd-cabinet__sheet rd-fam__part">
        {/* The tabs. Bottom-aligned, so the unselected ones simply stand lower. */}
        <div className="rd-cabinet__strip" role="tablist" aria-label="Roadmap levels" onKeyDown={onKeyDown}>
          {LEVELS.map((l, i) => (
            <button
              key={l.n}
              type="button"
              role="tab"
              id={`rd-cab-tab-${l.n}`}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              className="rd-cabinet__tab"
              data-status={l.status}
              aria-selected={i === active}
              aria-controls="rd-cab-panel"
              tabIndex={i === active ? 0 : -1}
              aria-label={`Level ${l.n}, ${l.name} — ${STATUS_LABEL[l.status]}`}
              onClick={() => setActive(i)}
            >
              <span className="rd-cabinet__tabTop">
                <span className="rd-cabinet__tabN rd-digits">{l.n}</span>
                <Mark status={l.status} />
              </span>
              <span className="rd-cabinet__tabName">{l.name}</span>
            </button>
          ))}
        </div>

        {/* The sheet. Keyed on the level so the page deals itself out again on every change. */}
        <div
          className="rd-cabinet__panel"
          id="rd-cab-panel"
          role="tabpanel"
          aria-labelledby={`rd-cab-tab-${level.n}`}
          tabIndex={0}
        >
          <div className="rd-cabinet__page" key={level.n}>
            <header className="rd-cabinet__head">
              <span className="rd-cabinet__folio rd-digits" data-status={level.status} aria-hidden="true">
                {level.n}
              </span>
              <h3 className="rd-cabinet__name">{level.name}</h3>
              <span className="rd-cabinet__marker" data-status={level.status}>
                {level.marker}
              </span>
            </header>

            <div className="rd-cabinet__body">
              <div className="rd-cabinet__lede">
                <p className="rd-cabinet__blurb">{level.blurb}</p>
                <div className="rd-cabinet__progress">
                  <span className="rd-cabinet__meter" aria-hidden="true">
                    {level.items.map((it) => (
                      <i key={it.short} data-on={it.done || undefined} />
                    ))}
                  </span>
                  <p className="rd-cabinet__tally">
                    <b className="rd-digits">{done}</b> of <b className="rd-digits">{level.items.length}</b> milestones
                    complete
                  </p>
                </div>
              </div>

              <div className="rd-cabinet__miles">
                <Milestones level={level} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
