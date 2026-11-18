// The grid parts every shop page is built of, see shop.css. A cell draws its own lines, the rule across its top, a vertical down each of
// its two edges and a plus mark at each corner. So a line only runs where two cells meet and never through a cell, a bar of filters, a row
// of tabs or a block of words (Filip 18 November, "make sure grid doesn't interfere with UI"). A cell across two frames has no line in its
// middle. On a phone the cells draw no verticals and the page has its two edge lines only, Lines.
import type { ReactNode } from 'react';

export const Rule = () => (
  <>
    <i className="sp-rule" aria-hidden="true" />
    <i className="sp-edge sp-edge-l" aria-hidden="true" />
    <i className="sp-edge sp-edge-r" aria-hidden="true" />
    <i className="sp-p sp-p-l" aria-hidden="true" />
    <i className="sp-p sp-p-r" aria-hidden="true" />
    <i className="sp-p sp-p-bl" aria-hidden="true" />
    <i className="sp-p sp-p-br" aria-hidden="true" />
  </>
);

// the two edge lines of a phone page, 16px in, down the whole body
export const Lines = () => (
  <div className="sp-lines" aria-hidden="true">
    {[1, 5].map((n) => (
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
