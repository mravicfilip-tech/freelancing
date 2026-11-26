// The Polovni shop, Filip 26 November, "create a new filter for polovni which is used shop products shop, this will be a standalone shop
// but access by filtering, the new filter will show the current products". Built from the shop's own parts, the kit, so it needs no
// round of its own (/newui, a client with a kit). A switch of two cells, Novi and Polovni, stands at the top of every list of the shop.
// Polovni has its own list, the used machines as the shop's cards with a photo, the year, the hours and the price, and a page per
// machine laid out as the model page, the gallery beside the facts, the price and one red button, then the data, the equipment and
// the other used machines. A sample machine carries a Primer mark, a sold one leaves the list and its page says Prodato.
import { useEffect, useState, type CSSProperties } from 'react';
import { BtnInner } from '../story2/shell/ui';
import { hero } from '../content';
import { fmt, PRODUCTS } from './data';
import { Link } from './route';
import { Cap, Cell, Crumbs } from './parts';
import { askUsed, groupName, hrefUsed, masina, pdvOf, priceOf, usedOf, usedOnSale, type UsedItem } from './used';

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Ekotehnika`;
  }, [title]);
}

// Novi or Polovni, two cells at the top of the shop's lists, links and not a filter in place, each list has its own address
export function KindSwitch({ current }: { current: 'novi' | 'polovni' }) {
  return (
    <section className="sp-frame sp-kind">
      <Cell span={4} className="sp-kind-c">
        <nav className="sp-kind-seg" aria-label="Novi ili polovni">
          <Link href="/prodavnica" className={current === 'novi' ? 'is-on' : undefined} aria-current={current === 'novi' ? 'page' : undefined}>
            Novi <span>{PRODUCTS.length}</span>
          </Link>
          <Link href="/prodavnica/polovni" className={current === 'polovni' ? 'is-on' : undefined} aria-current={current === 'polovni' ? 'page' : undefined}>
            Polovni <span>{usedOnSale.length}</span>
          </Link>
        </nav>
      </Cell>
    </section>
  );
}

function Mark({ u }: { u: UsedItem }) {
  if (u.status === 'primer') return <span className="sp-used-mark">Primer</span>;
  if (u.status === 'prodato') return <span className="sp-used-mark is-sold">Prodato</span>;
  return null;
}

function UsedFacts({ u, big = false }: { u: UsedItem; big?: boolean }) {
  const rows: [string, string, string?][] = [];
  if (u.year !== null) rows.push(['Godište', String(u.year)]);
  if (u.hours !== null) rows.push(['Radni sati', fmt(u.hours), 'h']);
  if (u.kg !== null) rows.push(['Nosivost', fmt(u.kg), 'kg']);
  if (u.mm !== null) rows.push(['Visina podizanja', fmt(u.mm), 'mm']);
  if (big && u.location) rows.push(['Lokacija', u.location]);
  if (!rows.length) return null;
  return (
    <dl className={`sp-facts${big ? ' is-big' : ''}`}>
      {rows.map(([k, v, unit]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>
            {v} {unit ? <span>{unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function UsedCard({ u }: { u: UsedItem }) {
  const pdv = pdvOf(u);
  return (
    <Cell className="sp-card sp-used">
      <div className="sp-card-in">
        <span className="pg-pc-pic">{u.photos[0] ? <img src={u.photos[0]} alt="" loading="lazy" decoding="async" /> : null}</span>
        <span className="sp-lab">
          {u.kind}
          <Mark u={u} />
        </span>
        <h3 className="sp-card-code">
          <Link className="sp-card-a" href={hrefUsed(u)}>
            {u.title}
          </Link>
        </h3>
        <UsedFacts u={u} />
        <p className="sp-used-price">
          {priceOf(u)} {pdv ? <span>{pdv}</span> : null}
        </p>
        <div className="sp-card-acts">
          <Link className="btn btn-secondary sp-card-ask" href={askUsed(u)} data-cta="quote-used" aria-label={`Zatražite ponudu za ${u.title}`}>
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

// the list at /prodavnica/polovni, every machine not yet sold, chips by category or group once there are two of them
export function UsedPage() {
  useTitle('Polovni viljuškari i mašine');
  const groups = [...new Set(usedOnSale.map((u) => u.group))];
  const [group, setGroup] = useState('');
  const shown = group ? usedOnSale.filter((u) => u.group === group) : usedOnSale;
  const blanks = (4 - (shown.length % 4)) % 4;
  return (
    <>
      <KindSwitch current="polovni" />
      <section className="sp-frame sp-intro sp-intro-list">
        <Cell span={2}>
          <Crumbs items={[{ label: 'Prodavnica', href: '/prodavnica' }, { label: 'Polovni' }]} />
          <h1 className="sp-h1">Polovni viljuškari i mašine</h1>
        </Cell>
        <Cell span={2} className="sp-intro-r">
          <p className="sp-count">
            <span>{usedOnSale.length}</span> {masina(usedOnSale.length).split(' ')[1]}
          </p>
        </Cell>
      </section>
      {groups.length >= 2 ? (
        <section className="sp-frame" aria-labelledby="sp-used-cats">
          <Cell span={4} className="sp-bar sp-cats-bar">
            <h2 className="sp-lab" id="sp-used-cats">
              Vrsta
            </h2>
            <div className="sp-pills" role="group" aria-label="Vrsta mašine">
              {['', ...groups].map((g) => (
                <button type="button" className="sp-pill" aria-pressed={group === g} onClick={() => setGroup(g)} key={g || 'sve'}>
                  {g ? groupName(g) : 'Sve'} <span>{g ? usedOnSale.filter((u) => u.group === g).length : usedOnSale.length}</span>
                </button>
              ))}
            </div>
          </Cell>
        </section>
      ) : null}
      {shown.length ? (
        <section className="sp-frame sp-grid" aria-label="Polovni viljuškari i mašine">
          {shown.map((u) => (
            <UsedCard u={u} key={u.slug} />
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <Cell className="is-blank" key={`b${i}`} />
          ))}
          <Cap />
        </section>
      ) : (
        <section className="sp-frame">
          <Cell span={2}>
            <p className="sp-lede">Trenutno nema polovnih mašina na stanju.</p>
          </Cell>
          <Cell span={2} className="sp-used-empty">
            <Link className="btn btn-secondary" href="/prodavnica">
              <BtnInner>Pogledajte modele</BtnInner>
            </Link>
            <a className="btn btn-secondary btn-phone" href={hero.sales.tel} data-cta="call-sales">
              <BtnInner>{`${hero.sales.label} ${hero.sales.number}`}</BtnInner>
            </a>
          </Cell>
          <Cap />
        </section>
      )}
    </>
  );
}

function UsedGallery({ u }: { u: UsedItem }) {
  const [at, setAt] = useState(0);
  if (!u.photos.length) return <div className="sp-pic is-photo is-none" aria-hidden="true" />;
  const src = u.photos[Math.min(at, u.photos.length - 1)];
  return (
    <div className="sp-gal">
      <div className="sp-pic is-photo">
        <img src={src} alt={`${u.title}, fotografija ${at + 1}`} decoding="async" />
      </div>
      {u.photos.length > 1 ? (
        <div className="sp-gal-row" role="group" aria-label="Fotografije" style={{ '--n': u.photos.length <= 4 ? u.photos.length : 3 } as CSSProperties}>
          {u.photos.map((p, i) => (
            <button type="button" className="sp-gal-t" aria-pressed={i === at} aria-label={`Fotografija ${i + 1}`} onClick={() => setAt(i)} key={p}>
              <img src={p} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// a used machine's page at /prodavnica/polovni/<slug>
export function UsedItemPage({ slug }: { slug: string }) {
  const u = usedOf(slug);
  useTitle(u ? `${u.title}, polovni ${u.kind.toLowerCase()}` : 'Mašina nije pronađena');
  if (!u) {
    return (
      <section className="sp-frame sp-intro">
        <Cell span={2}>
          <p className="sp-lab">Polovni</p>
          <h1 className="sp-h1">Ova mašina nije u ponudi</h1>
        </Cell>
        <Cell span={2} className="sp-intro-r">
          <p className="sp-lede">Možda je već prodata. Sve polovne mašine su na listi polovnih.</p>
          <Link className="btn btn-secondary" href="/prodavnica/polovni">
            <BtnInner>Polovni</BtnInner>
          </Link>
        </Cell>
        <Cap />
      </section>
    );
  }
  const pdv = pdvOf(u);
  const sold = u.status === 'prodato';
  const others = usedOnSale.filter((x) => x.slug !== u.slug).slice(0, 4);
  const data = u.specs.length > 0 || u.equipment.length > 0 || u.text.length > 0;
  return (
    <>
      <section className="sp-frame sp-model">
        <Cell span={2} className="sp-model-pic">
          <Crumbs items={[{ label: 'Prodavnica', href: '/prodavnica' }, { label: 'Polovni', href: '/prodavnica/polovni' }, { label: u.title }]} />
          <UsedGallery u={u} />
        </Cell>
        <Cell span={2} className="sp-model-info">
          <p className="sp-lab">
            Polovni, {u.kind.toLowerCase()}
            <Mark u={u} />
          </p>
          <h1 className="sp-h1">{u.title}</h1>
          {u.status === 'primer' ? <p className="sp-used-note">Primer oglasa, napravljen iz oglasa sa {u.source?.site ?? 'portala'} da pokaže kako izgleda polovna mašina na sajtu. Nije ponuda.</p> : null}
          <div className="sp-used-cost">
            <p className="sp-lab">Cena</p>
            <p className="sp-used-cost-v">
              {priceOf(u)} {pdv ? <span>{pdv}</span> : null}
            </p>
          </div>
          <UsedFacts u={u} big />
          <div className="sp-acts">
            {sold ? (
              <Link className="btn btn-secondary" href="/prodavnica/polovni">
                <BtnInner>Pogledajte polovne</BtnInner>
              </Link>
            ) : (
              <>
                <Link className="btn btn-primary" href={askUsed(u)} data-cta="quote-used">
                  <BtnInner>Zatražite ponudu</BtnInner>
                </Link>
                <a className="btn btn-secondary btn-phone" href={hero.sales.tel} data-cta="call-sales">
                  <BtnInner>{`${hero.sales.label} ${hero.sales.number}`}</BtnInner>
                </a>
              </>
            )}
          </div>
        </Cell>
        {data || others.length ? null : <Cap />}
      </section>

      {data ? (
        <section className={`sp-frame sp-used-data${others.length ? '' : ' is-last'}`} aria-label="Podaci o mašini">
          <Cell span={2}>
            {u.text.length ? (
              <div className="sp-used-text">
                {u.text.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
            ) : null}
            {u.specs.length ? (
              <>
                <h2 className="sp-lab">Tehnički podaci</h2>
                <table className="sp-tbl sp-used-tbl">
                  <tbody>
                    {u.specs.map(([k, v]) => (
                      <tr key={k}>
                        <th scope="row">{k}</th>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}
          </Cell>
          <Cell span={2}>
            {u.equipment.length ? (
              <>
                <h2 className="sp-lab">Oprema</h2>
                <ul className="sp-list sp-used-eq">
                  {u.equipment.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </Cell>
          {others.length ? null : <Cap />}
        </section>
      ) : null}

      {others.length ? (
        <section className="sp-frame sp-grid" aria-labelledby="sp-used-more">
          <Cell span={4} className="sp-sec-h">
            <h2 className="sp-lab" id="sp-used-more">
              Još polovnih
            </h2>
          </Cell>
          {others.map((x) => (
            <UsedCard u={x} key={x.slug} />
          ))}
          {Array.from({ length: (4 - (others.length % 4)) % 4 }, (_, i) => (
            <Cell className="is-blank" key={`b${i}`} />
          ))}
          <Cap />
        </section>
      ) : null}
    </>
  );
}
