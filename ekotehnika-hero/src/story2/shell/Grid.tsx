// The fixed 12 column grid drawn over the whole story, plan A3. 48px outer margin, 24px gutters, a vertical line on
// columns 1, 4, 7, 10 and 13, a rule under the top row and one above the bottom, and a plus mark at every crossing. Every
// line is a pair, 1px black beside 1px white, so it reads on a light ground, on a dark ground and over the red and black
// truck. It sits over the scene and under the text and runs unbroken, the text layer sits on top of it. The shell drives
// --draw, --go and --rot from the story clock and switches data-tone on the dark span.
import type { CSSProperties, Ref } from 'react';

// The five vertical lines, as the left offset of each inside the stage. They are the --x1 to --x5 values of the stage,
// rounded to whole pixels, so the lines and the plus marks are placed from the very same numbers.
export const GRID_X = ['var(--x1)', 'var(--x2)', 'var(--x3)', 'var(--x4)', 'var(--x5)'];

// Top rule under the top row, bottom rule above the bottom band, both measured at 900px high.
export const RULE_TOP = 136;
export const RULE_BOTTOM = 64;

// The five vertical lines in whole stage pixels for a stage this wide, the same numbers as --x1 to --x5 in shell.css.
export function gridXs(w: number): number[] {
  const gx = (w - 96 - 264) / 12 + 24;
  return [48, Math.round(48 + 3 * gx), Math.round(48 + 6 * gx), Math.round(48 + 9 * gx), Math.round(w - 48)];
}

export type Mark = { i: number; y: number };

// A plus mark for every crossing of a vertical line with a block rule. A block rule is an element marked data-rule, t for a
// rule on its top edge, b for one on its bottom edge, tb for both. The pixel row of a rule is its box edge rounded, so a mark
// lands on the very pixel the rule is painted on. The top and bottom grid rules have their own marks and are left out.
export function ruleMarks(scope: HTMLElement, stage: HTMLElement): Mark[] {
  const s = stage.getBoundingClientRect();
  const xs = gridXs(stage.clientWidth);
  const skip = [RULE_TOP, Math.round(s.height) - RULE_BOTTOM - 1];
  const seen = new Set<string>();
  const out: Mark[] = [];
  scope.querySelectorAll<HTMLElement>('[data-rule]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    const sides = el.dataset.rule ?? '';
    const rows: number[] = [];
    if (sides.includes('t')) rows.push(Math.round(r.top - s.top));
    if (sides.includes('b')) rows.push(Math.round(r.bottom - s.top) - 1);
    const a = r.left - s.left;
    const b = r.right - s.left;
    for (const y of rows) {
      if (skip.includes(y)) continue;
      xs.forEach((x, i) => {
        const k = `${i}|${y}`;
        if (x >= a - 0.5 && x <= b + 0.5 && !seen.has(k)) {
          seen.add(k);
          out.push({ i, y });
        }
      });
    }
  });
  return out;
}

// Draw the marks into a wrapper inside .s2-plus, only when they changed.
export function paintMarks(host: HTMLElement, marks: Mark[]) {
  const key = marks.map((m) => `${m.i}|${m.y}`).join();
  if (host.dataset.key === key) return;
  host.dataset.key = key;
  host.replaceChildren(
    ...marks.map((m) => {
      const e = document.createElement('i');
      e.className = 'gp gp-rule';
      e.style.left = GRID_X[m.i];
      e.style.top = `${m.y - 4}px`;
      return e;
    }),
  );
}

// the four stretches of a horizontal rule, each three columns, the last one without the closing gutter
const SEGMENTS = [0, 1, 2, 3];

export function Grid({ rootRef }: { rootRef?: Ref<HTMLDivElement> }) {
  return (
    <>
      <div className="s2-grid" aria-hidden="true" ref={rootRef}>
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
      {/* the plus marks sit above the text layer and the frame, so a block rule never covers an arm of a mark. The wrapper
          holds the marks at block rules, the shell fills it from the rules on screen */}
      <div className="s2-plus" aria-hidden="true">
        {(['top', 'bottom'] as const).flatMap((row) =>
          GRID_X.map((x, i) => <i className={`gp gp-${row}`} style={{ left: x }} key={`${row}${i}`} />),
        )}
        <div className="gpg" />
      </div>
    </>
  );
}
