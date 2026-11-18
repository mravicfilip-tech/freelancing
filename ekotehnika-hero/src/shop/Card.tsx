// A model in a list, the shop's card. The picture on a pale panel, the kind, the name, the two numbers where the old site gives them and an
// inquiry button. The name is the link and its hit area stretches over the whole card, the button stands over it and goes to the form with
// the model filled in. Picture and Facts are also the model page's.
import { BtnInner } from '../story2/shell/ui';
import { fmt, hrefAsk, hrefProduct, type Product } from './data';
import { Link } from './route';
import { Cell } from './parts';

export function Facts({ p, big = false }: { p: Product; big?: boolean }) {
  if (p.kg === null && p.mm === null) return null;
  return (
    <dl className={`sp-facts${big ? ' is-big' : ''}`}>
      {p.kg !== null ? (
        <div>
          <dt>Nosivost</dt>
          <dd>
            {fmt(p.kg)} <span>kg</span>
          </dd>
        </div>
      ) : null}
      {p.mm !== null ? (
        <div>
          <dt>Visina podizanja</dt>
          <dd>
            {fmt(p.mm)} <span>mm</span>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

// the cut out render, or the photo picked by hand where the Drive has no render, or the name on a pale field
export function Picture({ p, size }: { p: Product; size: 'card' | 'hero' }) {
  const src = size === 'card' ? p.thumb : p.render;
  if (!src)
    return (
      <div className="sp-pic is-empty" aria-hidden="true">
        <span>{p.code}</span>
      </div>
    );
  return (
    <div className={`sp-pic is-${p.look ?? 'render'}`}>
      <img
        src={src}
        alt={`Linde ${p.code}, ${p.kind.toLowerCase()}`}
        loading={size === 'card' ? 'lazy' : 'eager'}
        decoding="async"
        width={size === 'card' ? 560 : 1200}
        height={size === 'card' ? 560 : 1200}
      />
    </div>
  );
}

export function Card({ p }: { p: Product }) {
  return (
    <Cell className="sp-card">
      <div className="sp-card-in">
        <Picture p={p} size="card" />
        <span className="sp-lab">{p.kind}</span>
        <h3 className="sp-card-code">
          <Link className="sp-card-a" href={hrefProduct(p)}>
            {p.code}
          </Link>
        </h3>
        <Facts p={p} />
        <div className="sp-card-acts">
          <Link className="btn btn-secondary sp-card-ask" href={hrefAsk(p, 'kupovina')} data-cta="quote-card" aria-label={`Zatražite ponudu za Linde ${p.code}`}>
            <BtnInner>
              <span className="sp-ask-l">Zatražite ponudu</span>
              <span className="sp-ask-s">Ponuda</span>
            </BtnInner>
          </Link>
        </div>
      </div>
    </Cell>
  );
}
