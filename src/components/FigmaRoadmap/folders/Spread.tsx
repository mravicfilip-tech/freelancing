import { useEffect, useRef, useState } from 'react';
import { LEVELS, doneCount } from '../content';
import { Milestones, Tick } from '../shared';
import './Spread.css';

/**
 * Spread — the Index, opening into two columns.
 *
 * The anatomy is the family's: a rail of the seven levels across the top, a stack of tabbed
 * sheets under it, one open at a time, and a plate closing the stack. What is different is what
 * a level does when it opens. Instead of the milestones running on under the row, the sheet is
 * ruled down the middle on the [4,4] stroke and the level lays out as a page: its number, name,
 * marker and blurb hold the left column; its five milestones stand in the right column beside
 * them. The open level is therefore *wide* rather than tall, and the whole stack stays short.
 *
 * The gutter is drawn on every sheet, open or closed, so the composition is two-columned before
 * anything is clicked: the left column carries the level's identity, the right column carries a
 * measure of its five milestones — the same ticks that head the rows once the page opens. Opening
 * a level lets those ticks fall into their sentences.
 *
 * Ratio: the ecosystem card's own — 620px against the remainder of its 1440 card
 * (FigmaEcosystem.css:35-44) — held here as `min(620px, 46%)` so the milestone column keeps its
 * measure whatever width the band's rails run to.
 */

const COMPLETE = LEVELS.filter((l) => l.status === 'done').length;

export function Spread() {
  const [open, setOpen] = useState(() => Math.max(0, LEVELS.findIndex((l) => l.status === 'live')));
  const rail = useRef<HTMLOListElement>(null);

  // On a phone the rail scrolls; keep the open stop in view without moving the page.
  useEffect(() => {
    const el = rail.current;
    const stop = el?.children[open] as HTMLElement | undefined;
    if (!el || !stop || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: stop.offsetLeft - (el.clientWidth - stop.offsetWidth) / 2, behavior: 'smooth' });
  }, [open]);

  return (
    <div className="rd-spread">
      {/* The rail: the seven levels in order, filled behind the one in play. */}
      <ol className="rd-spread__rail rd-fam__part" ref={rail}>
        {LEVELS.map((l, i) => (
          <li className="rd-spread__stop" key={l.n} data-status={l.status} data-open={i === open || undefined}>
            <button type="button" aria-current={i === open ? 'true' : undefined} onClick={() => setOpen(i)}>
              <span className="rd-spread__dot" aria-hidden="true" />
              <span className="rd-spread__stopName">
                <span className="rd-digits">{l.n}</span> {l.name}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="rd-spread__stack">
        {LEVELS.map((l, i) => {
          const isOpen = i === open;
          const done = doneCount(l);
          return (
            <article
              className="rd-spread__level rd-fam__part"
              key={l.n}
              data-status={l.status}
              data-open={isOpen || undefined}
            >
              {/* The sheet's own tab, in one column down the stack — the file's number, raised. */}
              <span className="rd-spread__tab" aria-hidden="true">
                <span className="rd-digits">{l.n}</span>
              </span>
              <i className="rd-spread__accent" aria-hidden="true">
                <i />
              </i>

              <h3 className="rd-spread__head">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`rd-spread-lead-${l.n} rd-spread-pane-${l.n}`}
                  onClick={() => setOpen(i)}
                >
                  <span className="rd-spread__name">{l.name}</span>
                  <span className="rd-spread__count rd-digits">
                    {done}/{l.items.length}
                  </span>
                  <span className="rd-spread__marker" data-status={l.status}>
                    {l.marker}
                  </span>
                </button>
              </h3>

              {/* Left column: the level's page copy, under its number and name. */}
              <div className="rd-spread__lead" id={`rd-spread-lead-${l.n}`}>
                <div>
                  <p className="rd-spread__blurb">{l.blurb}</p>
                  <p className="rd-spread__tally">
                    <span>
                      <b className="rd-digits">{done}</b> of <b className="rd-digits">{l.items.length}</b> milestones
                      complete
                    </span>
                    <span className="rd-spread__folio rd-digits">{l.n}</span>
                  </p>
                </div>
              </div>

              {/* Right column: the level's five milestones — a measure while it is closed, the
                  page's second column once it opens. */}
              <div className="rd-spread__pane" id={`rd-spread-pane-${l.n}`}>
                <div className="rd-spread__stripWrap" aria-hidden="true">
                  <div>
                    <div className="rd-spread__strip">
                      {l.items.map((item) => (
                        <Tick key={item.short} done={item.done} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rd-spread__milesWrap">
                  <div>
                    <Milestones level={l} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        <p className="rd-spread__plate rd-fam__part">
          <span className="rd-spread__plateLabel">Remittix roadmap</span>
          <span className="rd-spread__plateTally">
            <b className="rd-digits">{String(COMPLETE).padStart(2, '0')}</b> of{' '}
            <b className="rd-digits">{String(LEVELS.length).padStart(2, '0')}</b> levels complete
          </span>
        </p>
      </div>
    </div>
  );
}
