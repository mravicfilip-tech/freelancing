import type { ReactNode } from 'react';

/**
 * The card each product page opens with: what state the product is in, one
 * short headline, the copy under it, and the page's one action. Slim, it is
 * a single row: copy on the left, the action on the right, and the product
 * itself is the band beneath.
 */
export function ProductHero({ status, title, body, children, aside, panel, slim, id }: {
  status: string;
  title: string;
  body: string;
  /** The action and any note beneath it. */
  children?: ReactNode;
  /** What fills the right side of the tall hero. */
  aside?: ReactNode;
  /** `aside` is a working panel (a form), not a drawing. */
  panel?: boolean;
  /** One compact row; the action sits at the right. */
  slim?: boolean;
  id: string;
}) {
  return (
    <section className={`card phero${panel ? ' phero--panel' : ''}${slim ? ' phero--slim' : ''}`} aria-labelledby={id}>
      <div className="phero__copy">
        <p className="pstat">{status}</p>
        <h2 className="phero__title" id={id}>{title}</h2>
        <p className="phero__body">{body}</p>
        {children && !slim && <div className="phero__act">{children}</div>}
      </div>
      {slim ? <div className="phero__act phero__act--side">{children}</div> : panel ? aside : <div className="phero__art" aria-hidden="true">{aside}</div>}
    </section>
  );
}
