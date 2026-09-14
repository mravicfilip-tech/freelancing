import { ChevronRight } from './icons';

/**
 * Which page numbers to show. Up to seven pages are all listed; past that the
 * ends stay put and a window follows the current page, with a gap either side.
 */
export function pageItems(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const lo = Math.max(2, Math.min(current - 1, total - 4));
  const hi = Math.min(total - 1, Math.max(current + 1, 5));
  const out: (number | 'gap')[] = [1];
  if (lo > 2) out.push('gap');
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < total - 1) out.push('gap');
  out.push(total);
  return out;
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  return (
    <nav className="pager" aria-label="Pages">
      <button
        type="button"
        className="pager__btn pager__btn--step"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronRight className="icon-16 pager__prev" />
      </button>
      {pageItems(page, pages).map((item, i) =>
        item === 'gap' ? (
          <span className="pager__gap" key={`gap-${i}`} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            type="button"
            className="pager__btn num"
            key={item}
            onClick={() => onPage(item)}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Page ${item}`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="pager__btn pager__btn--step"
        onClick={() => onPage(page + 1)}
        disabled={page === pages}
        aria-label="Next page"
      >
        <ChevronRight className="icon-16" />
      </button>
    </nav>
  );
}
