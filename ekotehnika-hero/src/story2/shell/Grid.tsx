// The fixed 12 column grid drawn over the whole story, plan A3. 48px outer margin, 24px gutters, 1px hairlines on
// columns 1, 4, 7, 10 and 13, a rule under the top row and one above the bottom, and a plus mark at every crossing.
// It sits over the scene and under the text. The shell hides the lines behind every text box, drives --draw,
// --go and --rot from the story clock, and switches data-tone on the dark beat.
import type { CSSProperties, Ref } from 'react';

// The five vertical lines, as the left offset of each inside the stage. They are the --x1 to --x5 values of the stage,
// rounded to whole pixels, so the lines and the plus marks are placed from the very same numbers.
export const GRID_X = ['var(--x1)', 'var(--x2)', 'var(--x3)', 'var(--x4)', 'var(--x5)'];

// Top rule under the top row, bottom rule above the bottom band, both measured at 900px high.
export const RULE_TOP = 136;
export const RULE_BOTTOM = 64;

// the four stretches of a horizontal rule, each three columns, the last one without the closing gutter
const SEGMENTS = [0, 1, 2, 3];

export function Grid({ rootRef }: { rootRef?: Ref<HTMLDivElement> }) {
  return (
    <>
      <div className="s2-grid" aria-hidden="true" ref={rootRef}>
        {/* the lines hide behind text boxes, the plus marks below never do, so every crossing keeps its mark */}
        <div className="s2-lines">
          {GRID_X.map((x, i) => (
            <div className="gv" style={{ left: x }} key={i}>
              <i className="gs gs-top" />
              <i className="gs gs-ma" />
              <i className="gs gs-mb" />
              <i className="gs gs-bot" />
            </div>
          ))}
          {(['top', 'bottom'] as const).map((row) => (
            <div className={`gh gh-${row}`} key={row}>
              {SEGMENTS.map((s) => (
                <span className="hs" style={{ '--s': s } as CSSProperties} key={s}>
                  <i className="hl" />
                  <i className="hr" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* the plus marks sit above the text layer, so a spec row hairline never covers an arm of a mark */}
      <div className="s2-plus" aria-hidden="true">
        {(['top', 'bottom'] as const).flatMap((row) =>
          GRID_X.map((x, i) => <i className={`gp gp-${row}`} style={{ left: x }} key={`${row}${i}`} />),
        )}
      </div>
    </>
  );
}
