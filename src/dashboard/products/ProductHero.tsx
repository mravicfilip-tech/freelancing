import type { ReactNode } from 'react';

/**
 * The card each product page opens with: what state the product is in, one
 * short headline, the copy under it, and the page's one action. The right
 * side is either the product's line drawing on the site's flare field or,
 * on PayFi, the form that is the action.
 */
export function ProductHero({ status, title, body, children, aside, panel, id }: {
  status: string;
  title: string;
  body: string;
  /** The action and any note beneath it. */
  children?: ReactNode;
  /** What fills the right side. */
  aside: ReactNode;
  /** `aside` is a working panel (a form), not a drawing. */
  panel?: boolean;
  id: string;
}) {
  return (
    <section className={`card phero${panel ? ' phero--panel' : ''}`} aria-labelledby={id}>
      <div className="phero__copy">
        <p className="pstat">{status}</p>
        <h2 className="phero__title" id={id}>{title}</h2>
        <p className="phero__body">{body}</p>
        {children && <div className="phero__act">{children}</div>}
      </div>
      {panel ? aside : <div className="phero__art" aria-hidden="true">{aside}</div>}
    </section>
  );
}
