import { useEffect, useRef, useState } from 'react';
import { LEVELS, doneCount } from '../content';
import { Milestones } from '../shared';
import './Divider.css';

const LIVE = LEVELS.findIndex((l) => l.status === 'live');
const COMPLETE = LEVELS.filter((l) => l.status === 'done').length;
const pad = (n: number) => String(n).padStart(2, '0');

/** The rail over the stack: the seven levels on the [8,8] rhythm, filled behind the one in play. */
function Rail({ open, onPick }: { open: number; onPick: (i: number) => void }) {
  const rail = useRef<HTMLOListElement>(null);

  // Once the names stop fitting the rail scrolls; keep the open stop in view without moving the page.
  useEffect(() => {
    const el = rail.current;
    const stop = el?.children[open] as HTMLElement | undefined;
    if (!el || !stop || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: stop.offsetLeft - (el.clientWidth - stop.offsetWidth) / 2, behavior: 'smooth' });
  }, [open]);

  return (
    <ol className="rd-divider__rail rd-fam__part" ref={rail}>
      {LEVELS.map((l, i) => (
        <li
          className="rd-divider__stop"
          key={l.n}
          data-status={l.status}
          data-open={i === open || undefined}
        >
          <button type="button" aria-current={i === open ? 'true' : undefined} onClick={() => onPick(i)}>
            <span className="rd-divider__dot" aria-hidden="true" />
            <span className="rd-divider__stopLabel">
              <span className="rd-divider__stopN rd-digits">{l.n}</span>
              <span className="rd-divider__stopName">{l.name}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/**
 * Direction 5 — binder dividers.
 *
 * The Index's anatomy — a rail of the seven levels, a stack of tabbed levels under it with one
 * open, a plate closing the stack — executed with no card at all. Each level is a single
 * full-width [4,4] rule with its tab at the right, and because the tabs sit flush they stack into
 * one column of paper down the right edge, the rules crossing them as the seams between sheets.
 * Opening a level slots its milestones in between the rules and pushes the tabs below it down, so
 * the column breaks exactly where the sheet has been pulled out.
 *
 * Closed rows still say something: the name, the marker and the ticked count, with the blurb
 * across the middle, so the order and the position read without a click.
 */
export function Divider() {
  const [open, setOpen] = useState(LIVE);

  return (
    <div className="rd-divider">
      <Rail open={open} onPick={(i) => setOpen(i)} />

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

      {/* The plate that closes the stack — no card to close it, so the tally does the job. */}
      <p className="rd-divider__plate rd-fam__part">
        <span className="rd-divider__plateLabel">Remittix roadmap</span>
        <span className="rd-divider__tally">
          <b className="rd-digits">{pad(COMPLETE)}</b> of <b className="rd-digits">{pad(LEVELS.length)}</b> levels
          complete
        </span>
      </p>
    </div>
  );
}
