// Small parts every hold beat is built from. The shell reads these data attributes to drive them from the story clock.
//   data-wipe="n"  the element rises in, its text letter by letter, n is its order (see reveal.ts)
//   data-fill      a lede that fills from grey to ink letter by letter as the beat runs
//   data-count="n" a figure that counts up from 0, it starts with its own wipe
// With none of the driving JS running, which is the reduced motion case, every part shows its end state.
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { frame, type Fact, type Marker as MarkerData } from '../copy';

// A block of the 12 column grid, columns a to b counted from 1. The stage is the container that sets --cw and --gx.
export const cols = (a: number, b: number): CSSProperties => ({
  left: `calc(48px + ${a - 1} * var(--gx))`,
  width: `calc(${b - a + 1} * var(--cw) + ${b - a} * 24px)`,
});

// A block between two drawn vertical lines of the grid, a and b are the line numbers 1 to 5 (--x1 to --x5 of the stage). Its rules
// start and end on a line, never inside a column. The text inside it sits 24px in from the line, see .stack in shell.css.
export const between = (a: number, b: number): CSSProperties => ({
  left: `var(--x${a})`,
  width: `calc(var(--x${b}) - var(--x${a}))`,
});

// The section marker, a cell of the grid, the name at the left and the beat count at the right, the cell's top hairline sits on
// the grid rule. See .s2-marker in shell.css.
export const Marker = ({ m, order = 0 }: { m: MarkerData; order?: number }) => (
  <p className="s2-marker" data-wipe={order} data-rule="t">
    <span className="mk-name">{m.name}</span>
    <span className="mk-count">
      {m.n}/{frame.total}
    </span>
  </p>
);

export const TitleLines = ({ lines, order = 1, className = '' }: { lines: string[]; order?: number; className?: string }) => (
  <h2 className={`s2-title ${className}`}>
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
    <p className={`s2-lede fill ${className}`} data-fill>
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

// The inside of every button, the label block, the square icon cell and the four bars of the border that draws on at hover.
// See the button rules in heroframe.css.
export function BtnInner({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="btn-t">
        <span className="btn-r">
          <span className="btn-l">{children}</span>
        </span>
      </span>
      <i className="btn-x" aria-hidden="true" />
      <span className="btn-d" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </>
  );
}

type BtnProps = {
  href: string;
  kind?: 'primary' | 'secondary';
  icon?: 'plus' | 'phone';
  order?: number;
  cta?: string;
  children: ReactNode;
  style?: CSSProperties;
};

export const Btn = ({ href, kind = 'primary', icon, order = 0, cta, children, style }: BtnProps) => (
  <a
    className={`btn btn-${kind}${icon === 'phone' ? ' btn-phone' : ''}`}
    href={href}
    data-wipe={order}
    data-cta={cta}
    style={style}
  >
    <BtnInner>{children}</BtnInner>
  </a>
);

// A fact with an optional 20px solid icon above its figure, every spec row carries icons.
export type SpecFact = Fact & { icon?: ReactNode };

// A spec row, cells divided by hairlines that sit on grid columns. spans is the column span of each cell. A row whose cells do not
// divide the grid evenly passes its own column template instead, so a cell line can sit on a vertical of the grid.
export function SpecRow({
  facts,
  spans,
  template,
  order = 4,
  className = '',
  style,
}: {
  facts: SpecFact[];
  spans: number[];
  template?: string;
  order?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const total = spans.reduce((a, b) => a + b, 0);
  return (
    <div className={`spec ${className}`} data-rule="tb" style={{ ...style, gridTemplateColumns: template ?? `repeat(${total}, 1fr)` }}>
      {facts.map((f, i) => {
        const o = order + i * 2;
        const body = (
          <>
            {f.icon ? (
              <span className="ico" data-wipe={o} aria-hidden="true">
                {f.icon}
              </span>
            ) : null}
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
          <div className="cell" style={template ? undefined : { gridColumn: `span ${spans[i]}` }} key={f.label}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
