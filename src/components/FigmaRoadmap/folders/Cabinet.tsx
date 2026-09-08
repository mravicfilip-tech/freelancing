import { useEffect, useRef, useState } from 'react';
import { LEVELS, STATUS_LABEL, doneCount } from '../content';
import { Milestones } from '../shared';
import './Cabinet.css';

/**
 * Cabinet — the Index held in one drawer. The rail of seven levels runs across the top as it does
 * everywhere in this family; under it the stack lives inside a single white card, so the card is
 * the drawer and the rows are the files in it. The tabs sit on the rows' left edge, inside the
 * card, so the card's outer edge stays a clean 12px rectangle and the numbered index reads down
 * its left margin, with the name, the count and the marker ruled off to the right of it.
 *
 * Nothing here is drawn with a box: the rows are divided by the card's own [4,4] rules, the open
 * one is marked by the 2px indigo bar outside the content's padding, and it opens on the
 * grid-row transition — the page's own disclosure.
 */

/** Every milestone in the roadmap, and the ones already ticked — the figure the plate closes on. */
const TOTAL = LEVELS.reduce((n, l) => n + l.items.length, 0);
const TICKED = LEVELS.reduce((n, l) => n + doneCount(l), 0);
const COMPLETE = LEVELS.filter((l) => l.status === 'done').length;
const pad = (n: number) => String(n).padStart(2, '0');

/** The rail above the drawer: the seven levels, filled behind the one in play, hollow ahead. */
function Rail({ open, onPick }: { open: number; onPick: (i: number) => void }) {
  const rail = useRef<HTMLOListElement>(null);

  // On a phone the rail scrolls; keep the open level in view without moving the page.
  useEffect(() => {
    const el = rail.current;
    const stop = el?.children[open] as HTMLElement | undefined;
    if (!el || !stop || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: stop.offsetLeft - (el.clientWidth - stop.offsetWidth) / 2, behavior: 'smooth' });
  }, [open]);

  return (
    <ol className="rd-cabinet__rail rd-fam__part" ref={rail}>
      {LEVELS.map((l, i) => (
        <li className="rd-cabinet__stop" key={l.n} data-status={l.status} data-open={i === open || undefined}>
          <button
            type="button"
            aria-current={i === open ? 'true' : undefined}
            aria-label={`Level ${l.n}, ${l.name} — ${STATUS_LABEL[l.status]}`}
            onClick={() => onPick(i)}
          >
            <span className="rd-cabinet__dot" aria-hidden="true" />
            <span className="rd-cabinet__stopN rd-digits" aria-hidden="true">
              {l.n}
            </span>
            <span className="rd-cabinet__stopName" aria-hidden="true">
              {l.name}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function Cabinet() {
  // The drawer opens on the level in play, so "where we are" is the file already pulled out.
  const [open, setOpen] = useState(() => Math.max(0, LEVELS.findIndex((l) => l.status === 'live')));

  return (
    <div className="rd-cabinet">
      <Rail open={open} onPick={setOpen} />

      <div className="rd-cabinet__card rd-fam__part">
        <ol className="rd-cabinet__stack">
          {LEVELS.map((l, i) => (
            <li className="rd-cabinet__row" key={l.n} data-status={l.status} data-open={i === open || undefined}>
              {/* The open file's mark: the 2px indigo bar on the card's own edge, outside the padding. */}
              <span className="rd-cabinet__accent" aria-hidden="true">
                <i />
              </span>

              <h3 className="rd-cabinet__head">
                <button
                  type="button"
                  aria-expanded={i === open}
                  aria-controls={`rd-cab-${l.n}`}
                  onClick={() => setOpen(i)}
                >
                  <span className="rd-cabinet__tab" aria-hidden="true">
                    {l.n}
                  </span>
                  <span className="rd-cabinet__name">{l.name}</span>
                  {/* A closed file still says what it is; the sentence moves into the body when
                      the file is pulled out. */}
                  <span className="rd-cabinet__lede">{l.blurb}</span>
                  <span className="rd-cabinet__count rd-digits">
                    {doneCount(l)}/{l.items.length}
                  </span>
                  <span className="rd-cabinet__marker" data-status={l.status}>
                    {l.marker}
                  </span>
                </button>
              </h3>

              <div className="rd-cabinet__body" id={`rd-cab-${l.n}`} role="region">
                <div className="rd-cabinet__bodyInner">
                  <p className="rd-cabinet__blurb">{l.blurb}</p>
                  <Milestones level={l} />
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* The plate that closes the drawer. */}
        <p className="rd-cabinet__plate">
          <span className="rd-cabinet__eyebrow">Remittix roadmap</span>
          <span className="rd-cabinet__tally">
            <b className="rd-digits">{pad(COMPLETE)}</b> of <b className="rd-digits">{pad(LEVELS.length)}</b> levels
            complete
            <em aria-hidden="true">·</em>
            <b className="rd-digits">{TICKED}</b> of <b className="rd-digits">{TOTAL}</b> milestones
          </span>
        </p>
      </div>
    </div>
  );
}
