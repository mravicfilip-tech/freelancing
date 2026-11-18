// The shop's listing, Filip 18 November, "add more sorting/filter options, make it look like a shop". One list for a category and for all
// the models. On the left the categories, then the filters, each value with how many models it leaves, nosivost and visina podizanja in
// bands, the kind of truck where a category has more than one, the category where the list holds all of them, and the data sheet. Over
// the models the count, a search, the sort and the filters that are on, each a chip that takes itself off. Within a filter any value
// counts, across filters all must hold. The choice lives in the address, so a link or the back button keeps it. On a phone the filters
// are a sheet over the page, opened from the bar over the models.
import { useEffect, useMemo, useRef, useState } from 'react';
import { BtnInner } from '../story2/shell/ui';
import {
  CATEGORIES,
  KG_BANDS,
  MM_BANDS,
  SORTS,
  categoryOf,
  hrefCategory,
  inBand,
  matches,
  modela,
  sorted,
  type Product,
  type Sort,
} from './data';
import { Card } from './Card';
import { Link } from './route';
import { Cap, Cell, Rule } from './parts';

type Facet = 'kat' | 'nosivost' | 'visina' | 'vrsta' | 'list';
type State = { q: string; sort: Sort; on: Record<Facet, string[]> };

const FACETS: Facet[] = ['kat', 'nosivost', 'visina', 'vrsta', 'list'];

function read(): State {
  const p = new URLSearchParams(window.location.search);
  const on = Object.fromEntries(FACETS.map((f) => [f, (p.get(f) ?? '').split(',').filter(Boolean)])) as Record<Facet, string[]>;
  const sort = (SORTS.find((s) => s.id === p.get('sort'))?.id ?? 'preporuceno') as Sort;
  return { q: p.get('q') ?? '', sort, on };
}

function write(s: State) {
  const p = new URLSearchParams();
  if (s.q.trim()) p.set('q', s.q.trim());
  FACETS.forEach((f) => s.on[f].length && p.set(f, s.on[f].join(',')));
  if (s.sort !== 'preporuceno') p.set('sort', s.sort);
  const q = p.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${q ? `?${q}` : ''}`);
}

type Option = { id: string; label: string; test: (p: Product) => boolean };

export function Listing({ items, current }: { items: Product[]; current: string | null }) {
  const [s, setS] = useState<State>(read);
  const [sheet, setSheet] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => write(s), [s]);

  // the options of each filter, only those this list has
  const facets = useMemo(() => {
    const kinds = [...new Set(items.map((p) => p.kind))].sort((a, b) => a.localeCompare(b, 'sr'));
    const cats = CATEGORIES.filter((c) => items.some((p) => p.category === c.slug));
    const out: { id: Facet; label: string; note?: string; options: Option[] }[] = [];
    if (!current) out.push({ id: 'kat', label: 'Kategorija', options: cats.map((c) => ({ id: c.slug, label: c.name, test: (p) => p.category === c.slug })) });
    out.push({ id: 'nosivost', label: 'Nosivost', note: 'Modeli sa poznatom nosivošću', options: KG_BANDS.map((b) => ({ id: b.id, label: b.label, test: (p) => p.category !== 'tegljaci' && inBand(p.kg, b) })) });
    out.push({ id: 'visina', label: 'Visina podizanja', note: 'Modeli sa poznatom visinom', options: MM_BANDS.map((b) => ({ id: b.id, label: b.label, test: (p) => inBand(p.mm, b) })) });
    if (kinds.length > 1) out.push({ id: 'vrsta', label: 'Vrsta', options: kinds.map((k) => ({ id: k, label: k, test: (p) => p.kind === k })) });
    out.push({ id: 'list', label: 'Dokumentacija', options: [{ id: 'pdf', label: 'Sa tehničkim listom', test: (p) => Boolean(p.datasheet) }] });
    return out;
  }, [items, current]);

  // a model passes a filter when the filter is off or any of its values holds
  const pass = (p: Product, skip?: Facet) =>
    matches(p, s.q) &&
    facets.every((f) => f.id === skip || !s.on[f.id].length || f.options.some((o) => s.on[f.id].includes(o.id) && o.test(p)));
  const shown = sorted(items.filter((p) => pass(p)), s.sort);
  // how many a value would leave, with the other filters as they are
  const countOf = (f: Facet, o: Option) => items.filter((p) => pass(p, f) && o.test(p)).length;
  const active = facets.flatMap((f) => f.options.filter((o) => s.on[f.id].includes(o.id)).map((o) => ({ f: f.id, o })));

  const toggle = (f: Facet, id: string) =>
    setS((x) => ({ ...x, on: { ...x.on, [f]: x.on[f].includes(id) ? x.on[f].filter((v) => v !== id) : [...x.on[f], id] } }));
  const clear = () => setS((x) => ({ ...x, q: '', on: Object.fromEntries(FACETS.map((f) => [f, []])) as unknown as Record<Facet, string[]> }));

  // the sheet on a phone, Escape shuts it and the focus goes into it
  useEffect(() => {
    if (!sheet) return;
    sheetRef.current?.querySelector<HTMLElement>('button, input')?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [sheet]);

  const filters = (
    <>
      {facets.map((f) => {
        const opts = f.options.map((o) => ({ o, n: countOf(f.id, o), on: s.on[f.id].includes(o.id) })).filter((x) => x.n > 0 || x.on);
        if (!opts.length) return null;
        return (
          <fieldset className="sp-facet" key={f.id}>
            <legend>{f.label}</legend>
            {opts.map(({ o, n, on }) => (
              <label className="sp-opt" key={o.id}>
                <input type="checkbox" checked={on} onChange={() => toggle(f.id, o.id)} />
                <span className="sp-opt-t">{o.label}</span>
                <span className="sp-opt-n">{n}</span>
              </label>
            ))}
            {f.note ? <p className="sp-facet-note">{f.note}</p> : null}
          </fieldset>
        );
      })}
    </>
  );

  return (
    <section className="sp-frame sp-shop">
      <aside className="sp-side sp-filters" aria-label="Kategorije i filteri">
        <Rule />
        <p className="sp-lab">Kategorije</p>
        <ul className="sp-side-cats">
          <li>
            <Link href="/prodavnica/svi-modeli" aria-current={current === null ? 'page' : undefined}>
              <span>Svi modeli</span> <span className="sp-side-n">{CATEGORIES.reduce((a, c) => a + c.count, 0)}</span>
            </Link>
          </li>
          {CATEGORIES.map((k) => (
            <li key={k.slug}>
              <Link href={hrefCategory(k.slug)} aria-current={k.slug === current ? 'page' : undefined}>
                <span>{k.name}</span> <span className="sp-side-n">{k.count}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="sp-sheet" ref={sheetRef} data-open={sheet || undefined} role={sheet ? 'dialog' : undefined} aria-modal={sheet || undefined} aria-label="Filteri">
          <div className="sp-sheet-head">
            <p className="sp-lab">Filteri</p>
            <button type="button" className="btn btn-secondary sp-sheet-x" aria-label="Zatvori filtere" onClick={() => setSheet(false)}>
              <BtnInner>Zatvori</BtnInner>
            </button>
          </div>
          {filters}
          <div className="sp-sheet-foot">
            <button type="button" className="btn btn-primary" onClick={() => setSheet(false)}>
              <BtnInner>Prikaži {modela(shown.length)}</BtnInner>
            </button>
            {active.length ? (
              <button type="button" className="sp-clear" onClick={clear}>
                Poništi filtere
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="sp-results">
        <Cell span={3} className="sp-bar">
          <p className="sp-shown" aria-live="polite">
            <strong>{shown.length}</strong> {shown.length === items.length ? modela(items.length).split(' ')[1] : `od ${modela(items.length)}`}
          </p>
          <label className="sp-search">
            <span className="sr-only">Pretražite modele</span>
            <input type="search" placeholder="Pretraga, npr. X20 ili slagač" value={s.q} onChange={(e) => setS((x) => ({ ...x, q: e.target.value }))} />
          </label>
          <label className="sp-sort">
            <span className="sp-sort-l">Redosled</span>
            <span className="sp-select">
              <select value={s.sort} onChange={(e) => setS((x) => ({ ...x, sort: e.target.value as Sort }))}>
                {SORTS.map((o) => (
                  <option value={o.id} key={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <button type="button" className="btn btn-secondary sp-open" aria-expanded={sheet} onClick={() => setSheet(true)}>
            <BtnInner>Filteri{active.length ? ` (${active.length})` : ''}</BtnInner>
          </button>
          {active.length || s.q.trim() ? (
            <div className="sp-chips">
              {s.q.trim() ? (
                <button type="button" className="sp-chip" onClick={() => setS((x) => ({ ...x, q: '' }))} aria-label={`Ukloni pretragu ${s.q.trim()}`}>
                  „{s.q.trim()}”
                </button>
              ) : null}
              {active.map(({ f, o }) => (
                <button type="button" className="sp-chip" onClick={() => toggle(f, o.id)} aria-label={`Ukloni filter ${o.label}`} key={`${f}-${o.id}`}>
                  {f === 'kat' ? categoryOf(o.id)?.name : o.label}
                </button>
              ))}
              <button type="button" className="sp-clear" onClick={clear}>
                Poništi sve
              </button>
            </div>
          ) : null}
        </Cell>

        {shown.length ? (
          <div className="sp-models">
            {shown.map((p) => (
              <Card p={p} key={p.slug} />
            ))}
            {Array.from({ length: (3 - (shown.length % 3)) % 3 }, (_, i) => (
              <Cell className="sp-card is-blank" key={`b${i}`} />
            ))}
          </div>
        ) : (
          <Cell span={3} className="sp-none">
            <p className="sp-none-t">Nijedan model ne odgovara izboru.</p>
            <p className="sp-lede">Skinite neki od filtera, ili nam pošaljite upit i pomoći ćemo vam da izaberete.</p>
            <div className="sp-acts">
              <button type="button" className="btn btn-secondary" onClick={clear}>
                <BtnInner>Poništi filtere</BtnInner>
              </button>
              <Link className="btn btn-primary" href="/kontakt?tema=kupovina">
                <BtnInner>Pošaljite upit</BtnInner>
              </Link>
            </div>
          </Cell>
        )}
      </div>
      <Cap />
    </section>
  );
}
