// Small parts every hold beat is built from. The shell reads these data attributes to drive them from the story clock.
//   data-wipe="n"  the element reveals with a block wipe, n is its order, each step is 80ms later
//   data-fill      a lede that fills from grey to ink letter by letter as the beat runs
//   data-count="n" a figure that counts up from 0, it starts with its own wipe
//   data-mask      a box the grid lines are hidden behind, with 16px of padding
// With none of the driving JS running, which is the reduced motion case, every part shows its end state.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { Fact, Marker as MarkerData } from '../copy';

// A block of the 12 column grid, columns a to b counted from 1. The stage is the container that sets --cw and --gx.
export const cols = (a: number, b: number): CSSProperties => ({
  left: `calc(48px + ${a - 1} * var(--gx))`,
  width: `calc(${b - a + 1} * var(--cw) + ${b - a} * 24px)`,
});

export const Marker = ({ m, order = 0 }: { m: MarkerData; order?: number }) => (
  <p className="s2-marker" data-wipe={order} data-mask>
    <span className="mk-n">{m.n}</span>
    <span className="mk-name">{m.name}</span>
  </p>
);

export const TitleLines = ({ lines, order = 1, className = '' }: { lines: string[]; order?: number; className?: string }) => (
  <h2 className={`s2-title ${className}`} data-mask>
    {lines.map((t, i) => (
      <span className="ln" data-wipe={order + i} key={t}>
        {t}
      </span>
    ))}
  </h2>
);

// The lede. Split into words and letters for the scroll fill, kept as one string for screen readers.
export function Fill({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ');
  return (
    <p className={`s2-lede fill ${className}`} data-fill data-mask>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="fw">
              {Array.from(w).map((c, j) => (
                <span className="fl" key={j}>
                  {c}
                </span>
              ))}
            </span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    </p>
  );
}

type BtnProps = { href: string; kind?: 'primary' | 'secondary'; icon?: 'plus' | 'phone'; hover?: boolean; order?: number; cta?: string; children: ReactNode; style?: CSSProperties };

// One button, five looks. The variant is picked on the page with ?btn=1 to 5, see variant.ts and the button rules in
// heroframe.css. btn-x is the small cell some variants use, a plus or a phone, it is empty and hidden in the others.
export const Btn = ({ href, kind = 'primary', icon, hover, order = 0, cta, children, style }: BtnProps) => (
  <a className={`btn btn-${kind}${icon === 'phone' ? ' btn-phone' : ''}${hover ? ' is-hover' : ''}`} href={href} data-wipe={order} data-mask data-cta={cta} style={style}>
    <span className="btn-t">{children}</span>
    <i className="btn-x" aria-hidden="true" />
  </a>
);

// A spec row, cells divided by hairlines that sit on grid columns. spans is the column span of each cell.
export function SpecRow({ facts, spans, order = 4, className = '', style }: { facts: Fact[]; spans: number[]; order?: number; className?: string; style?: CSSProperties }) {
  const total = spans.reduce((a, b) => a + b, 0);
  return (
    <div className={`spec ${className}`} data-mask style={{ ...style, gridTemplateColumns: `repeat(${total}, 1fr)` }}>
      {facts.map((f, i) => {
        const o = order + i * 2;
        const body = (
          <>
            <b className="fig" data-wipe={o} data-count={f.count} data-suffix={f.suffix}>
              {f.figure}
            </b>
            <span className="lab" data-wipe={o + 1}>
              {f.label}
            </span>
            {f.note ? <span className="note">{f.note}</span> : null}
          </>
        );
        return (
          <div className="cell" style={{ gridColumn: `span ${spans[i]}` }} key={f.label}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
