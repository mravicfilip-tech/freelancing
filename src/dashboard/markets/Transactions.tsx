import { useEffect, useState } from 'react';
import { money, usd } from '../data';
import { Button } from '../Button';
import { EmptyState, OrdersArt } from '../EmptyState';
import { ChevronRight, PayMark } from '../icons';
import { ago, PAGE_SIZE, type TxRow } from './data';

const label = (method: string) => (method === 'CARD' ? 'Card' : method);

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

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
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

const toBuy = () => window.location.assign('/dashboard#buy');

export function Transactions({ rows }: { rows: TxRow[] }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE;
  const slice = rows.slice(from, from + PAGE_SIZE);

  /* On a phone the pager sits a screen below the head, so turning a page
     lands the reader mid-list; bring the head back only when it has actually
     scrolled off, since on a desktop the whole card is in view and moving it
     read as a jump. */
  useEffect(() => {
    const head = document.getElementById('tx-title');
    if (!head || head.getBoundingClientRect().top >= 0) return;
    head.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  /* The last page is shorter; invisible rows hold the card's height so the
     pager stays put under the pointer. */
  const filler = Array.from({ length: PAGE_SIZE - slice.length }, (_, i) => i);

  return (
    <section className="card orders tx" aria-labelledby="tx-title">
      <header className="card__head">
        <div>
          <h2 className="card__title" id="tx-title">
            My transactions
          </h2>
          <p className="orders__sub">Every purchase this wallet has made, newest first</p>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          art={OrdersArt}
          title="No purchases yet"
          body="Each $RTX purchase lands here once it clears, with what you paid and what it is worth at listing."
        >
          <Button onClick={toBuy}>Buy your first $RTX</Button>
        </EmptyState>
      ) : (
        <>
          <div className="orders__scroll">
            <table className="orders__table tx__table">
              <thead>
                <tr>
                  <th scope="col">Paid with</th>
                  <th scope="col">Order</th>
                  <th scope="col">$RTX</th>
                  <th scope="col" className="tx__price">Price</th>
                  <th scope="col">Paid</th>
                  <th scope="col" className="tx__worth">Worth at launch</th>
                  <th scope="col" className="is-right">When</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="orders__method">
                        <PayMark id={t.method} className="icon-22" />
                        {label(t.method)}
                      </span>
                    </td>
                    <td className="num orders__id">#{t.id}</td>
                    <td className="num orders__rtx">{money(t.rtx)}</td>
                    <td className="num tx__price">${t.price.toFixed(2)}</td>
                    <td className="num orders__usd">{usd(t.usd)}</td>
                    <td className="num tx__worth">{usd(t.worth)}</td>
                    <td className="num is-right orders__time">{ago(t.hoursAgo)}</td>
                  </tr>
                ))}
                {filler.map((i) => (
                  <tr key={`f${i}`} className="tx__filler" aria-hidden="true">
                    <td colSpan={7}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="tx__foot">
            <p className="tx__count num">
              Showing {from + 1}–{from + slice.length} of {rows.length}
            </p>
            {pages > 1 && <Pager page={page} pages={pages} onPage={setPage} />}
          </footer>
        </>
      )}
    </section>
  );
}
