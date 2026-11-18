// The model page's own facts, Filip 18 November, "the product page needs more work, needs description, bullet points why this works,
// extract data from google drive and populize this page as much as we can". Each model with a Linde data sheet on the client's Drive has
// a spec in specs/<slug>.json, written by scripts/shop-specs.py from that sheet and translated into Serbian. Nothing here is written by us,
// every line is the sheet's. The page grows by four parts, a description, four figures and why this model at the top, then the
// features in the grid's four frames, the versions side by side with the whole table and the masts closed under them, and the equipment
// by group, each group closed. A model without a sheet keeps the page it had.
import { useEffect, useRef, useState } from 'react';
import { Cell } from './parts';

export type Spec = {
  slug: string;
  source: { name: string | null; href: string };
  versions: string[];
  tagline: string | null;
  lede: string;
  benefits: string[];
  figures: { label: string; value: string; unit: string }[];
  masts: { name: string; rows: { h1: number; h2: number; h3: number; h4: number }[] }[];
  characteristics: { group: string; icon: string; bullets: string[] }[];
  table: { section: string; rows: { no: string; label: string; unit: string; values: (string | null)[]; notes: string[] }[] }[];
  compare: { label: string; unit: string; values: (string | null)[] }[];
  footnotes: { n: string; text: string }[];
  equipment: { group: string; icon: string; items: { t: string; only?: string[] }[] }[];
};

const SPECS = import.meta.glob<{ default: Spec }>('./specs/*.json');

// the spec of a model, loaded when its page opens, null while it loads or where the model has no sheet
export function useSpec(slug: string) {
  const [spec, setSpec] = useState<{ slug: string; spec: Spec | null } | null>(null);
  useEffect(() => {
    let live = true;
    const load = SPECS[`./specs/${slug}.json`];
    if (!load) {
      setSpec({ slug, spec: null });
      return;
    }
    load().then((m) => live && setSpec({ slug, spec: m.default }));
    return () => {
      live = false;
    };
  }, [slug]);
  return spec?.slug === slug ? spec : null;
}

const fmt = (n: number) => n.toLocaleString('de-DE');

// a group's icon, 20px and solid like every icon on the site, drawn in shop.css (.sp-ico), Filip 18 November, "icons, ticks etc"
const Icon = ({ name }: { name: string }) => <i className={`sp-ico is-${name}`} aria-hidden="true" />;
const nema = 'nema';

// the four figures, in the facts block the page already had
export function SpecFigures({ spec }: { spec: Spec }) {
  if (!spec.figures.length) return null;
  return (
    <dl className="sp-facts is-big is-spec">
      {spec.figures.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>
            {/* a range or a ceiling, the "do" set small like the unit */}
            {f.value.split(/(do )/).map((x, i) => (x === 'do ' ? <span key={i}>do </span> : x))} <span>{f.unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SpecWhy({ spec }: { spec: Spec }) {
  if (!spec.benefits.length) return null;
  return (
    <div className="sp-why">
      <h2 className="sp-lab">Zašto ovaj model</h2>
      <ul className="sp-list">
        {spec.benefits.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

function Head({ id, label, note }: { id: string; label: string; note?: string }) {
  return (
    <Cell span={4} className="sp-sec-h">
      <h2 className="sp-lab" id={id}>
        {label}
      </h2>
      {note ? <p className="sp-sec-note">{note}</p> : null}
    </Cell>
  );
}

const blanks = (n: number, cls: string) => Array.from({ length: (4 - (n % 4)) % 4 }, (_, i) => <Cell className={`${cls} is-blank`} key={`b${i}`} />);

export function SpecFeatures({ spec }: { spec: Spec }) {
  const groups = spec.characteristics;
  if (!groups.length) return null;
  return (
    <section className="sp-frame sp-feats" aria-labelledby="sp-feats-h">
      <Head id="sp-feats-h" label="Karakteristike" />
      {groups.map((g, gi) => (
        <Cell className="sp-feat" key={gi}>
          <Icon name={g.icon} />
          <h3 className="sp-feat-h">{g.group}</h3>
          <ul className="sp-list">
            {g.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </Cell>
      ))}
      {blanks(groups.length, 'sp-feat')}
    </section>
  );
}

// a value of the table, the footnote it carries raised after it
function Val({ v, note }: { v: string | null; note?: string }) {
  return (
    <>
      {v ?? <span className="sp-tbl-none">{nema}</span>}
      {note ? <sup>{note}</sup> : null}
    </>
  );
}

const versionWord = (n: number) => (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'verzije' : 'verzija');

// The versions of one model side by side, Filip 18 November, "1,2, or evne 3 rows should stand out". Versions named like H16 D, H16 T,
// H16 CNG fall into one group per model, the model's name over its group and every other group on a tint, so the eye takes a model at
// a time. A series whose versions are all different models keeps one column each.
type Group = { name: string; n: number };
function groupsOf(versions: string[]): Group[] | null {
  const out: Group[] = [];
  versions.forEach((v) => {
    const name = v.split(' ')[0];
    const last = out[out.length - 1];
    if (last && last.name === name) last.n += 1;
    else out.push({ name, n: 1 });
  });
  return out.length > 1 && out.length < versions.length ? out : null;
}

function TableHead({ versions, groups }: { versions: string[]; groups: Group[] | null }) {
  const band = bandsOf(versions, groups);
  return (
    <thead>
      {groups ? (
        <tr className="is-grp">
          <td />
          {groups.map((g, i) => (
            <th scope="colgroup" colSpan={g.n} className={i % 2 ? 'is-band' : undefined} key={i}>
              {g.name}
            </th>
          ))}
        </tr>
      ) : null}
      <tr>
        <th scope="col">
          <span className="sr-only">Podatak</span>
        </th>
        {versions.map((v, i) => (
          <th scope="col" className={band[i] ? 'is-band' : undefined} key={i}>
            {groups ? v.split(' ').slice(1).join(' ') || v : v}
          </th>
        ))}
      </tr>
    </thead>
  );
}

const bandsOf = (versions: string[], groups: Group[] | null) => {
  if (!groups) return versions.map(() => false);
  return groups.flatMap((g, i) => Array.from({ length: g.n }, () => i % 2 === 1));
};

export function SpecVersions({ spec }: { spec: Spec }) {
  const { versions, compare, table, masts, footnotes } = spec;
  if (!versions.length || !compare.length) return null;
  const groups = groupsOf(versions);
  const band = bandsOf(versions, groups);
  const cell = (i: number) => (band[i] ? 'is-band' : undefined);
  return (
    <section className="sp-frame sp-vers" aria-labelledby="sp-vers-h">
      <Head id="sp-vers-h" label="Verzije" note={`${versions.length} ${versionWord(versions.length)}, podaci po VDI 2198`} />
      <Cell span={4} className="sp-vers-c">
        <div className="sp-tbl-wrap" role="region" aria-labelledby="sp-vers-h" tabIndex={0}>
          <table className="sp-tbl">
            <TableHead versions={versions} groups={groups} />
            <tbody>
              {compare.map((r, ri) => (
                <tr key={ri}>
                  <th scope="row">
                    {r.label}
                    {r.unit ? <span className="sp-tbl-u">{r.unit}</span> : null}
                  </th>
                  {versions.map((_, i) => (
                    <td className={cell(i)} key={i}>
                      <Val v={r.values[i] ?? null} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <details className="sp-more-d">
          <summary>
            <span>Sve tehničke karakteristike</span>
          </summary>
          <div className="sp-tbl-wrap" role="region" aria-label="Sve tehničke karakteristike" tabIndex={0}>
            <table className="sp-tbl is-full">
              <TableHead versions={versions} groups={groups} />
              {table.map((s, si) => (
                <tbody key={si}>
                  <tr className="is-sec">
                    <th scope="rowgroup" colSpan={versions.length + 1}>
                      {s.section}
                    </th>
                  </tr>
                  {s.rows.map((r, ri) => (
                    <tr key={ri}>
                      <th scope="row">
                        <span className="sp-tbl-no">{r.no}</span>
                        {r.label}
                        {r.unit ? <span className="sp-tbl-u">{r.unit}</span> : null}
                      </th>
                      {versions.map((_, i) => (
                        <td className={cell(i)} key={i}>
                          <Val v={r.values[i] ?? null} note={r.notes[i]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
          {footnotes.length ? (
            <ol className="sp-notes">
              {footnotes.map((f, fi) => (
                <li key={fi}>
                  <sup>{f.n}</sup> {f.text}
                </li>
              ))}
            </ol>
          ) : null}
        </details>
        {masts.length ? (
          <details className="sp-more-d">
            <summary>
              <span>Stubovi i visine podizanja</span>
            </summary>
            <div className="sp-tbl-wrap" role="region" aria-label="Stubovi i visine podizanja" tabIndex={0}>
              <table className="sp-tbl is-masts">
                <thead>
                  <tr>
                    <th scope="col">Stub</th>
                    <th scope="col">
                      Visina podizanja <span className="sp-tbl-u">h3, mm</span>
                    </th>
                    <th scope="col">
                      Visina spuštenog stuba <span className="sp-tbl-u">h1, mm</span>
                    </th>
                    <th scope="col">
                      Slobodno podizanje <span className="sp-tbl-u">h2, mm</span>
                    </th>
                    <th scope="col">
                      Visina izvučenog stuba <span className="sp-tbl-u">h4, mm</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {masts.flatMap((m) =>
                    m.rows.map((r, i) => (
                      <tr key={`${m.name}-${i}`}>
                        <th scope="row">{i === 0 ? m.name : <span className="sr-only">{m.name}</span>}</th>
                        <td>{fmt(r.h3)}</td>
                        <td>{fmt(r.h1)}</td>
                        <td>{fmt(r.h2)}</td>
                        <td>{fmt(r.h4)}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}
      </Cell>
    </section>
  );
}

// The equipment by group, each group a cell with its icon. On a wide screen the first row of groups is open when the page opens, on a
// phone all are closed, Filip 18 November, "keep top row open always (but not on mobile)".
export function SpecEquipment({ spec }: { spec: Spec }) {
  const groups = spec.equipment;
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.matchMedia('(max-aspect-ratio: 4/5)').matches) return;
    root.current?.querySelectorAll('details').forEach((d, i) => {
      if (i < 4) d.open = true;
    });
  }, [spec.slug]);
  if (!groups.length) return null;
  return (
    <section className="sp-frame sp-equip" aria-labelledby="sp-equip-h" ref={root}>
      <Head id="sp-equip-h" label="Oprema" note="Šta je standardno, a šta dodatna oprema, piše u tehničkom listu." />
      {groups.map((g, gi) => (
        <Cell className="sp-eq" key={gi}>
          <Icon name={g.icon} />
          <details className="sp-more-d">
            <summary>
              <span>{g.group}</span>
              <span className="sp-eq-n">{g.items.length}</span>
            </summary>
            <ul className="sp-list">
              {g.items.map((it, i) => (
                <li key={i}>
                  {it.t}
                  {it.only ? <span className="sp-eq-only"> Samo {it.only.join(', ')}.</span> : null}
                </li>
              ))}
            </ul>
          </details>
        </Cell>
      ))}
      {blanks(groups.length, 'sp-eq')}
    </section>
  );
}
