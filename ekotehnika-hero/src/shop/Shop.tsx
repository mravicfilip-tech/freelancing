// The shop, Filip 18 November, briefs/shop/brief.md. The homepage story leads here. Prodavnica with the 10 categories of the client's
// Drive, a category page with its models, a model page, and Kontakt, the form with the model filled in. No prices and no cart, every
// model leads to the form. The look is the homepage's without the scroll story, the white ground, the five verticals of the grid with
// a plus mark where a rule crosses one, Daxline, the red primary with its black plus cell, the same top row and footer. On a screen held
// upright the edge lines only, no middle line and no marks (Filip 4 November).
import { useEffect } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { Footer } from '../story2/shell/sections';
import { SITE, hero, pillars } from '../content';
import { CATEGORIES, categoryOf, faceOf, fmt, hrefAsk, hrefCategory, hrefProduct, modela, productOf, productsOf, PRODUCTS, type Product } from './data';
import { Link, useRoute } from './route';
import { ShopFrame } from './ShopFrame';
import { Contact } from './Contact';
import { Cap, Cell, Lines, Rule } from './parts';
import './shop.css';

function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="sp-crumbs" aria-label="Putanja">
      <ol>
        {items.map((it, i) => (
          <li key={it.label}>
            {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
            {i < items.length - 1 ? <span aria-hidden="true"> / </span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Facts({ p, big = false }: { p: Product; big?: boolean }) {
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

// the picture of a model, its cut out render, or the photo picked by hand where the Drive has no render, or its name on a pale field
function Picture({ p, size }: { p: Product; size: 'card' | 'hero' }) {
  const src = size === 'card' ? p.thumb : p.render;
  if (!src)
    return (
      <div className="sp-pic is-empty" aria-hidden="true">
        <span>{p.code}</span>
      </div>
    );
  return (
    <div className={`sp-pic is-${p.look ?? 'render'}`}>
      <img src={src} alt={`Linde ${p.code}, ${p.kind.toLowerCase()}`} loading={size === 'card' ? 'lazy' : 'eager'} decoding="async" width={size === 'card' ? 560 : 1200} height={size === 'card' ? 560 : 1200} />
    </div>
  );
}

function Card({ p }: { p: Product }) {
  return (
    <Cell className="sp-card">
      <Link className="sp-card-a" href={hrefProduct(p)}>
        <Picture p={p} size="card" />
        <span className="sp-lab">{p.kind}</span>
        <span className="sp-card-code">{p.code}</span>
        <Facts p={p} />
        <i className="sp-go" aria-hidden="true" />
      </Link>
    </Cell>
  );
}

function Home() {
  useTitle('Prodavnica, novi Linde viljuškari');
  return (
    <>
      <section className="sp-frame sp-intro">
        <Cell span={2}>
          <p className="sp-lab">Prodavnica</p>
          <h1 className="sp-h1">Novi Linde viljuškari</h1>
        </Cell>
        <Cell span={2} className="sp-intro-r">
          <p className="sp-lede">
            {PRODUCTS.length} modela u {CATEGORIES.length} kategorija. Izaberite vrstu viljuškara, a ponudu za model vam šaljemo na upit.
          </p>
          <Link className="btn btn-secondary" href="/kontakt?tema=kupovina">
            <BtnInner>Pošaljite upit</BtnInner>
          </Link>
        </Cell>
      </section>
      <section className="sp-frame sp-cats" aria-label="Kategorije">
        {CATEGORIES.map((c) => (
          <Cell className="sp-tile" key={c.slug}>
            <Link className="sp-tile-a" href={hrefCategory(c.slug)}>
              <span className="sp-lab">{modela(c.count)}</span>
              <span className="sp-pic">{faceOf(c.slug) ? <img src={faceOf(c.slug)!} alt="" loading="lazy" decoding="async" width={560} height={560} /> : null}</span>
              <span className="sp-tile-name">{c.name}</span>
              <i className="sp-go" aria-hidden="true" />
            </Link>
          </Cell>
        ))}
        <Cell className="sp-tile sp-help">
          <span className="sp-lab">Pomoć pri izboru</span>
          <p className="sp-help-t">Niste sigurni koji model vam treba?</p>
          <a className="sp-help-num" href={hero.sales.tel} data-cta="call-sales">
            {hero.sales.number}
          </a>
          <Link className="btn btn-secondary" href="/kontakt?tema=kupovina">
            <BtnInner>Pošaljite upit</BtnInner>
          </Link>
        </Cell>
        <Cell className="sp-tile sp-help">
          <span className="sp-lab">Polovni viljuškari</span>
          <p className="sp-help-t">{pillars.find((x) => x.id === 'polovni')?.line}</p>
          <a className="btn btn-secondary" href={`${SITE}/polovni-linde-viljuskari/`}>
            <BtnInner>Polovni na ekotehnika.rs</BtnInner>
          </a>
        </Cell>
        <Cap />
      </section>
    </>
  );
}

function CategoryPage({ cat }: { cat: string }) {
  const c = categoryOf(cat);
  useTitle(c ? `${c.name}, Linde` : 'Kategorija nije pronađena');
  if (!c) return <Missing />;
  const items = productsOf(cat);
  return (
    <>
      <section className="sp-frame sp-intro">
        <Cell span={2}>
          <Crumbs items={[{ label: 'Prodavnica', href: '/prodavnica' }, { label: c.name }]} />
          <h1 className="sp-h1">{c.name}</h1>
        </Cell>
        <Cell span={2} className="sp-intro-r">
          <p className="sp-count">
            <span>{items.length}</span> {modela(items.length).split(' ')[1]}
          </p>
        </Cell>
      </section>
      <section className="sp-frame sp-list">
        <nav className="sp-side" aria-label="Kategorije">
          <Rule />
          <p className="sp-lab">Kategorije</p>
          <ul>
            {CATEGORIES.map((k) => (
              <li key={k.slug}>
                <Link href={hrefCategory(k.slug)} aria-current={k.slug === cat ? 'page' : undefined}>
                  <span>{k.name}</span> <span className="sp-side-n">{k.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sp-models">
          {items.map((p) => (
            <Card p={p} key={p.slug} />
          ))}
          {Array.from({ length: (3 - (items.length % 3)) % 3 }, (_, i) => (
            <Cell className="sp-card is-blank" key={`b${i}`} />
          ))}
        </div>
        <Cap />
      </section>
    </>
  );
}

function ModelPage({ cat, model }: { cat: string; model: string }) {
  const c = categoryOf(cat);
  const p = productOf(cat, model);
  useTitle(p ? `Linde ${p.code}, ${p.kind.toLowerCase()}` : 'Model nije pronađen');
  if (!c || !p) return <Missing />;
  const others = productsOf(cat).filter((x) => x.slug !== p.slug);
  const start = Math.max(0, others.findIndex((x) => x.slug > p.slug));
  const related = [...others.slice(start), ...others.slice(0, start)].slice(0, 4);
  return (
    <>
      <section className="sp-frame sp-model">
        <Cell span={2} className="sp-model-pic">
          <Crumbs items={[{ label: 'Prodavnica', href: '/prodavnica' }, { label: c.name, href: hrefCategory(c.slug) }, { label: p.code }]} />
          <Picture p={p} size="hero" />
        </Cell>
        <Cell span={2} className="sp-model-info">
          <p className="sp-lab">{p.kind}</p>
          <h1 className="sp-h1">{p.code}</h1>
          <p className="sp-series">Linde serija {p.series}</p>
          <Facts p={p} big />
          <div className="sp-acts">
            <Link className="btn btn-primary" href={hrefAsk(p, 'kupovina')} data-cta="quote">
              <BtnInner>Zatražite ponudu</BtnInner>
            </Link>
            <Link className="btn btn-secondary" href={hrefAsk(p, 'najam')} data-cta="rent">
              <BtnInner>Pitajte za najam</BtnInner>
            </Link>
          </div>
          {p.datasheet ? (
            <a className="sp-pdf" href={p.datasheet.href} target="_blank" rel="noopener noreferrer" data-cta="datasheet">
              <span className="sp-pdf-i" aria-hidden="true" />
              <span>
                Tehnički list <span className="sp-pdf-s">PDF, na engleskom</span>
              </span>
            </a>
          ) : null}
        </Cell>
      </section>
      {p.photos.length ? (
        <section className="sp-frame sp-photos" aria-label="Fotografije">
          {p.photos.map((src, i) => (
            <Cell span={2} className="sp-photo" key={src}>
              {i === 0 ? <p className="sp-lab">Fotografije</p> : <p className="sp-lab" aria-hidden="true">&nbsp;</p>}
              <img src={src} alt={`Linde ${p.code}, fotografija ${i + 1}`} loading="lazy" decoding="async" />
            </Cell>
          ))}
          {p.photos.length === 1 ? <Cell span={2} className="sp-photo is-blank" /> : null}
        </section>
      ) : null}
      {related.length ? (
        <section className="sp-frame sp-related" aria-label="Iz iste kategorije">
          <Cell span={4} className="sp-related-h">
            <p className="sp-lab">Iz iste kategorije</p>
            <Link className="sp-more" href={hrefCategory(c.slug)}>
              Svi modeli, {c.name.toLowerCase()}
            </Link>
          </Cell>
          {related.map((x) => (
            <Card p={x} key={x.slug} />
          ))}
          {Array.from({ length: 4 - related.length }, (_, i) => (
            <Cell className="sp-card is-blank" key={`b${i}`} />
          ))}
          <Cap />
        </section>
      ) : null}
    </>
  );
}

function Missing() {
  useTitle('Stranica nije pronađena');
  return (
    <section className="sp-frame sp-intro">
      <Cell span={2}>
        <p className="sp-lab">Prodavnica</p>
        <h1 className="sp-h1">Ova stranica ne postoji</h1>
      </Cell>
      <Cell span={2} className="sp-intro-r">
        <p className="sp-lede">Model ili kategorija sa ove adrese nisu u prodavnici. Svi modeli su na prvoj strani prodavnice.</p>
        <Link className="btn btn-secondary" href="/prodavnica">
          <BtnInner>Prodavnica</BtnInner>
        </Link>
      </Cell>
      <Cap />
    </section>
  );
}

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Ekotehnika`;
  }, [title]);
}

export function Shop() {
  const route = useRoute();
  return (
    <div className="sp">
      <ShopFrame page={route.page === 'contact' ? 'Kontakt' : 'Novi'} />
      <main id="sp-main" className="sp-main" tabIndex={-1}>
        <Lines />
        {route.page === 'home' ? <Home /> : null}
        {route.page === 'category' ? <CategoryPage cat={route.cat} key={route.cat} /> : null}
        {route.page === 'model' ? <ModelPage cat={route.cat} model={route.model} key={route.model} /> : null}
        {route.page === 'contact' ? <Contact tema={route.tema} model={route.model} /> : null}
        {route.page === 'missing' ? <Missing /> : null}
      </main>
      <Footer />
    </div>
  );
}
