import { useState } from 'react';
import { LEVELS, doneCount } from '../content';
import { Milestones } from '../shared';
import './Deck.css';

/**
 * Deck — the Index compressed.
 *
 * The same anatomy as the drawer: a rail of the seven levels, a stack of tabbed folders under it
 * with one open at a time, a plate closing it. What differs is the density. A closed level is not
 * a row but a 44px strip — the edge of a file pressed flush against its neighbours — so all seven
 * fit inside the height of one open sheet and the composition is almost entirely edges.
 *
 * At that height the alignment is the whole job. One dashed [4,4] gutter rule runs at a fixed 60px
 * down every sheet in the stack, the numbers filed to its left in the digits face and everything
 * else — names, the open sheet's blurb, its milestone rows — squared to its right. The right end
 * of each strip is a fixed grid too: the level's marker word, then its ticked count in a track of
 * its own so the counts line up whatever the marker's length. State is carried a third time by the
 * strip's own bottom edge, which is drawn solid across the fraction of the level that is done —
 * four full edges, one part edge, two blank is the roadmap read off the rules themselves.
 *
 * The open sheet expands out of the strip it came from: the strip stays as its head, the body
 * opens on the grid-row transition and the strips below shift down with it.
 */
export function Deck() {
  const [open, setOpen] = useState(() => Math.max(0, LEVELS.findIndex((l) => l.status === 'live')));
  const live = Math.max(0, LEVELS.findIndex((l) => l.status === 'live'));
  const complete = LEVELS.filter((l) => l.status === 'done').length;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="rd-deck">
      {/* The rail: seven stops on the [8,8] line, solid as far as the level in play. */}
      <ol
        className="rd-deck__rail rd-fam__part"
        style={{ '--travel': `${((live + 0.5) / LEVELS.length) * 100}%` } as React.CSSProperties}
      >
        {LEVELS.map((l, i) => (
          <li className="rd-deck__stop" key={l.n} data-status={l.status} data-open={i === open || undefined}>
            <button type="button" aria-current={i === open ? 'true' : undefined} onClick={() => setOpen(i)}>
              <span className="rd-deck__stopN rd-digits">{l.n}</span>
              <span className="rd-deck__dot" aria-hidden="true" />
              <span className="rd-deck__stopName">{l.name}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="rd-deck__stack">
        {LEVELS.map((l, i) => (
          <article
            className="rd-deck__file rd-fam__part"
            key={l.n}
            data-status={l.status}
            data-open={i === open || undefined}
            /* The fraction of the level that is done, drawn along the strip's bottom edge. */
            style={{ '--p': doneCount(l) / l.items.length } as React.CSSProperties}
          >
            <h3 className="rd-deck__head">
              <button
                type="button"
                aria-expanded={i === open}
                aria-controls={`rd-deck-${l.n}`}
                onClick={() => setOpen(i)}
              >
                <span className="rd-deck__n rd-digits">{l.n}</span>
                <span className="rd-deck__name">{l.name}</span>
                <span className="rd-deck__marker">{l.marker}</span>
                <span className="rd-deck__count rd-digits">
                  {doneCount(l)}/{l.items.length}
                </span>
                <span className="rd-deck__sign" aria-hidden="true" />
                <i className="rd-deck__gauge" aria-hidden="true" />
              </button>
            </h3>
            <div className="rd-deck__body" id={`rd-deck-${l.n}`}>
              <div>
                <p className="rd-deck__blurb">{l.blurb}</p>
                <Milestones level={l} />
              </div>
            </div>
            <i className="rd-deck__accent" aria-hidden="true" />
          </article>
        ))}

        {/* The plate that closes the drawer, on the same 44px module as a closed strip. */}
        <p className="rd-deck__plate rd-fam__part">
          <span className="rd-deck__eyebrow">Remittix roadmap</span>
          <span className="rd-deck__tally">
            <b className="rd-digits">{pad(complete)}</b> of <b className="rd-digits">{pad(LEVELS.length)}</b> levels
            complete
          </span>
        </p>
      </div>
    </div>
  );
}
