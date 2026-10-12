// Small parts every hold beat is built from. The shell reads these data attributes to drive them from the story clock.
//   data-wipe="n"  the element reveals with a block wipe, n is its order, each step is 80ms later
//   data-fill      a lede that fills from grey to ink letter by letter as the beat runs
//   data-count="n" a figure that counts up from 0, it starts with its own wipe
//   data-mask      a box the grid lines are hidden behind, with 16px of padding
// With none of the driving JS running, which is the reduced motion case, every part shows its end state.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { frame, type Fact, type Marker as MarkerData } from '../copy';

// A block of the 12 column grid, columns a to b counted from 1. The stage is the container that sets --cw and --gx.
export const cols = (a: number, b: number): CSSProperties => ({
  left: `calc(48px + ${a - 1} * var(--gx))`,
  width: `calc(${b - a + 1} * var(--cw) + ${b - a} * 24px)`,
});

// The section marker, a cell of the grid, the name at the left and the beat count at the right, the cell's top hairline sits on
// the grid rule. See .s2-marker in shell.css.
export const Marker = ({ m, order = 0 }: { m: MarkerData; order?: number }) => (
  <p className="s2-marker" data-wipe={order} data-mask>
    <span className="mk-name">{m.name}</span>
    <span className="mk-count">
      {m.n}/{frame.total}
    </span>
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

// The inside of every button. The label is in a box that clips for the text roll, with a copy for the roll, then the end tick
// or icon cell, the four bars of the border draw and the corner ticks. Which of them show depends on the structure and the
// hover, see the button rules in heroframe.css.
export function BtnInner({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="btn-t">
        <span className="btn-r">
          <span className="btn-l">{children}</span>
          <span className="btn-l2" aria-hidden="true">
            {children}
          </span>
        </span>
      </span>
      <i className="btn-x" aria-hidden="true" />
      <span className="btn-d" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <i className="btn-k" aria-hidden="true" />
    </>
  );
}

type BtnProps = {
  href: string;
  kind?: 'primary' | 'secondary';
  icon?: 'plus' | 'phone';
  hover?: boolean | 'frozen';
  order?: number;
  cta?: string;
  children: ReactNode;
  style?: CSSProperties;
};

export const Btn = ({ href, kind = 'primary', icon, hover, order = 0, cta, children, style }: BtnProps) => (
  <a
    className={`btn btn-${kind}${icon === 'phone' ? ' btn-phone' : ''}${hover === true ? ' is-hover' : hover === 'frozen' ? ' is-hover-60' : ''}`}
    href={href}
    data-wipe={order}
    data-mask
    data-cta={cta}
    style={style}
  >
    <BtnInner>{children}</BtnInner>
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
