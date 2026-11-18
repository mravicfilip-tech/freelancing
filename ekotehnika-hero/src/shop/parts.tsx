// The grid parts every shop page is built of, see shop.css. A rule across the top of a cell with a plus mark at each end, a cell of the
// four frames, the five verticals down the page, and the cap, the rule under a section's last row with its marks.
import type { ReactNode } from 'react';

export const Rule = () => (
  <>
    <i className="sp-rule" aria-hidden="true" />
    <i className="sp-p sp-p-l" aria-hidden="true" />
    <i className="sp-p sp-p-r" aria-hidden="true" />
  </>
);

export const Lines = () => (
  <div className="sp-lines" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((n) => (
      <i className="sp-vl" data-n={n} style={{ left: `var(--x${n})` }} key={n} />
    ))}
  </div>
);

export function Cell({ span = 1, className = '', children }: { span?: number; className?: string; children?: ReactNode }) {
  return (
    <div className={`sp-cell ${className}`} style={{ gridColumn: `span ${span}` }}>
      <Rule />
      {children}
    </div>
  );
}

// four empty cells of no height, so the rule under the last row has a mark at each of the five verticals
export const Cap = () => (
  <>
    {[0, 1, 2, 3].map((i) => (
      <div className="sp-cell sp-cap" aria-hidden="true" key={i}>
        <Rule />
      </div>
    ))}
  </>
);
