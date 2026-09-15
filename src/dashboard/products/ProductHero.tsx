/**
 * The card each product page opens with: what state the product is in, one
 * short headline, the copy under it, and the page's one action at the
 * right. The product itself is the band beneath.
 */
export function ProductHero({ status, title, body, children, id }: {
  status: string;
  title: string;
  body: string;
  /** The action and any note beneath it. */
  children?: React.ReactNode;
  id: string;
}) {
  return (
    <section className="card phero phero--slim" aria-labelledby={id}>
      <div className="phero__copy">
        <p className="pstat">{status}</p>
        <h2 className="phero__title" id={id}>{title}</h2>
        <p className="phero__body">{body}</p>
      </div>
      <div className="phero__act phero__act--side">{children}</div>
    </section>
  );
}
