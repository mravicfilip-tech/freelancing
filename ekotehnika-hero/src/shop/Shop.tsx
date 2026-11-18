// The shop, Filip 18 November, briefs/shop/brief.md. The homepage story leads here. Prodavnica with the 10 categories of the client's
// Drive, a category page with its models, a model page, and Kontakt, the form with the model filled in. No prices and no cart, every
// model leads to the form. The look is the homepage's without the scroll story, the white ground, the five verticals of the grid with
// a plus mark where a rule crosses one, Daxline, the red primary with its black plus cell, the same top row and footer. On a screen held
// upright the edge lines only, no middle line and no marks (Filip 4 November).
import { useEffect, useState } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { Footer } from '../story2/shell/sections';
import { SITE, hero, pillars } from '../content';
import { type Product, CATEGORIES, GROUPS, categoryOf, faceOf, fmt, hrefAsk, hrefCategory, modela, productOf, productsOf, PRODUCTS, statsOf } from './data';
import { Link, useRoute } from './route';
import { ShopFrame } from './ShopFrame';
import { Contact } from './Contact';
import { Cap, Cell, Lines } from './parts';
import { Card, Facts, Picture } from './Card';
import { Hero } from './Hero';
import { Listing } from './Listing';
import { SearchBox } from './SearchBox';
import { SpecEquipment, SpecFeatures, SpecFigures, SpecVersions, SpecWhy, useSpec } from './ModelSpec';
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

// the facts of a category on its tile, from its models where the old site gives them
function TileFacts({ cat }: { cat: string }) {
  const st = statsOf(cat);
  if (!st.kg && !st.mm) return null;
  return (
    <dl className="sp-facts sp-tile-facts">
      {st.kg ? (
        <div>
          <dt>Nosivost</dt>
          <dd>
            {st.kg[0] === st.kg[1] ? fmt(st.kg[0]) : `${fmt(st.kg[0])} do ${fmt(st.kg[1])}`} <span>kg</span>
          </dd>
        </div>
      ) : null}
      {st.mm ? (
        <div>
          <dt>Podizanje</dt>
          <dd>
            do {fmt(st.mm)} <span>mm</span>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function Home() {
  useTitle('Prodavnica, novi Linde viljuškari');
  const [vrsta, setVrsta] = useState(() => new URLSearchParams(window.location.search).get('vrsta') ?? '');
  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}${vrsta ? `?vrsta=${vrsta}` : ''}`);
  }, [vrsta]);
  const group = GROUPS.find((g) => g.id === vrsta);
  const cats = group ? CATEGORIES.filter((c) => group.cats.includes(c.slug)) : CATEGORIES;
  const count = (cs: string[]) => CATEGORIES.filter((c) => cs.includes(c.slug)).reduce((a, c) => a + c.count, 0);
  const blanks = (4 - ((cats.length + 2) % 4)) % 4;
  return (
    <>
      <Hero />
      <section className="sp-frame sp-cats" aria-labelledby="sp-cats-h">
        <Cell span={4} className="sp-bar sp-cats-bar">
          <h2 className="sp-lab" id="sp-cats-h">
            Kategorije
          </h2>
          <div className="sp-pills" role="group" aria-label="Vrsta vozila">
            {[{ id: '', label: 'Sve', cats: CATEGORIES.map((c) => c.slug) }, ...GROUPS].map((g) => (
              <button type="button" className="sp-pill" aria-pressed={vrsta === g.id} onClick={() => setVrsta(g.id)} key={g.id || 'sve'}>
                {g.label} <span>{count(g.cats)}</span>
              </button>
            ))}
          </div>
          <SearchBox />
        </Cell>
        {cats.map((c) => (
          <Cell className="sp-tile" key={c.slug}>
            <Link className="sp-tile-a" href={hrefCategory(c.slug)}>
              <span className="sp-lab">{modela(c.count)}</span>
              <span className="sp-pic">{faceOf(c.slug) ? <img src={faceOf(c.slug)!} alt="" loading="lazy" decoding="async" width={560} height={560} /> : null}</span>
              <span className="sp-tile-name">{c.name}</span>
              <TileFacts cat={c.slug} />
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
        {Array.from({ length: blanks }, (_, i) => (
          <Cell className="sp-tile is-blank" key={`b${i}`} />
        ))}
        <Cap />
      </section>
    </>
  );
}

// the intro of a list, the way back, the title and the count
function ListHead({ title, crumbs, count }: { title: string; crumbs: { label: string; href?: string }[]; count: number }) {
  return (
    <section className="sp-frame sp-intro sp-intro-list">
      <Cell span={2}>
        <Crumbs items={crumbs} />
        <h1 className="sp-h1">{title}</h1>
      </Cell>
      <Cell span={2} className="sp-intro-r">
        <p className="sp-count">
          <span>{count}</span> {modela(count).split(' ')[1]}
        </p>
      </Cell>
    </section>
  );
}

function CategoryPage({ cat }: { cat: string }) {
  const c = categoryOf(cat);
  useTitle(c ? `${c.name}, Linde` : 'Kategorija nije pronađena');
  if (!c) return <Missing />;
  const items = productsOf(cat);
  return (
    <>
      <ListHead title={c.name} crumbs={[{ label: 'Prodavnica', href: '/prodavnica' }, { label: c.name }]} count={items.length} />
      <Listing items={items} current={cat} />
    </>
  );
}

function AllPage() {
  useTitle('Svi modeli, Linde');
  return (
    <>
      <ListHead title="Svi modeli" crumbs={[{ label: 'Prodavnica', href: '/prodavnica' }, { label: 'Svi modeli' }]} count={PRODUCTS.length} />
      <Listing items={PRODUCTS} current={null} />
    </>
  );
}

function ModelPage({ cat, model }: { cat: string; model: string }) {
  const c = categoryOf(cat);
  const p = productOf(cat, model);
  useTitle(p ? `Linde ${p.code}, ${p.kind.toLowerCase()}` : 'Model nije pronađen');
  // the facts of the model's data sheet, Filip 18 November, see ModelSpec.tsx. Null while they load, and a model with no sheet keeps
  // the old site's two facts.
  const loaded = useSpec(model);
  if (!c || !p) return <Missing />;
  const spec = loaded?.spec ?? null;
  const others = productsOf(cat).filter((x) => x.slug !== p.slug);
  const start = Math.max(0, others.findIndex((x) => x.slug > p.slug));
  const related = [...others.slice(start), ...others.slice(0, start)].slice(0, 4);
  return (
    <>
      <section className="sp-frame sp-model">
        <Cell span={2} className="sp-model-pic">
          <Crumbs items={[{ label: 'Prodavnica', href: '/prodavnica' }, { label: c.name, href: hrefCategory(c.slug) }, { label: p.code }]} />
          <Gallery p={p} />
        </Cell>
        <Cell span={2} className="sp-model-info">
          <p className="sp-lab">{p.kind}</p>
          <h1 className="sp-h1">{p.code}</h1>
          <p className="sp-series">Linde serija {p.series}</p>
          {spec ? (
            <>
              {spec.tagline ? <p className="sp-model-tag">{spec.tagline}</p> : null}
              <p className="sp-lede sp-model-lede">{spec.lede}</p>
              <SpecFigures spec={spec} />
            </>
          ) : loaded ? (
            <Facts p={p} big />
          ) : null}
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
          {spec ? <SpecWhy spec={spec} /> : null}
        </Cell>
      </section>
      {spec ? (
        <>
          <SpecFeatures spec={spec} />
          <SpecVersions spec={spec} />
          <SpecEquipment spec={spec} />
        </>
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

// The model's pictures, Filip 18 November, "these should be moved above here and have gallery preview". The render in the main frame,
// and under it a row of thumbnails, the render then the Drive's photos. A thumbnail shows its picture in the main frame.
function Gallery({ p }: { p: Product }) {
  const [at, setAt] = useState(0);
  useEffect(() => setAt(0), [p.slug]);
  const shots = [...(p.render ? [{ src: p.render, thumb: p.thumb ?? p.render, render: true }] : []), ...p.photos.map((src) => ({ src, thumb: src, render: false }))];
  if (shots.length < 2) return <Picture p={p} size="hero" />;
  const s = shots[Math.min(at, shots.length - 1)];
  const n = (i: number) => i + (p.render ? 0 : 1);
  return (
    <div className="sp-gal">
      {s.render ? (
        <Picture p={p} size="hero" />
      ) : (
        <div className="sp-pic is-photo">
          <img src={s.src} alt={`Linde ${p.code}, fotografija ${n(at)}`} decoding="async" />
        </div>
      )}
      <div className="sp-gal-row" role="group" aria-label="Slike modela">
        {shots.map((x, i) => (
          <button
            type="button"
            className={`sp-gal-t${x.render ? ' is-render' : ''}`}
            aria-pressed={i === at}
            aria-label={x.render ? `Linde ${p.code}, model` : `Fotografija ${n(i)}`}
            onClick={() => setAt(i)}
            key={x.src}
          >
            <img src={x.thumb} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
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
        {route.page === 'all' ? <AllPage /> : null}
        {route.page === 'category' ? <CategoryPage cat={route.cat} key={route.cat} /> : null}
        {route.page === 'model' ? <ModelPage cat={route.cat} model={route.model} key={route.model} /> : null}
        {route.page === 'contact' ? <Contact tema={route.tema} model={route.model} /> : null}
        {route.page === 'missing' ? <Missing /> : null}
      </main>
      <Footer />
    </div>
  );
}
