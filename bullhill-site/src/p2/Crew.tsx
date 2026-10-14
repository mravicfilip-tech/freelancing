import type { Content } from '../shared/content';
import { Placeholder } from '../shared/Placeholder';
import { Guides } from './icons';
import { pick } from './copy';

export function Crew({ c }: { c: Content }) {
  const k = pick(c.lang).crew;
  return (
    <section className="p2-crew" id="crew">
      <Guides />
      <div className="p2-wrap">
        <div className="p2-crew__head">
          <h2 className="p2-display p2-h2 p2-crew__title">{c.crew.title}</h2>
          <p className="p2-crew__body">{c.crew.body}</p>
        </div>
        <div className="p2-crew__grid">
          <ul className="p2-people">
            {c.crew.people.map((p, i) => (
              <li key={p.shot.id}>
                <Placeholder shot={p.shot} label={c.ui.photo} index={i + 1} brief={false} className="p2-ph p2-people__ph" />
                <p className="p2-people__name">{p.name}</p>
                <p className="p2-mono p2-people__role">{p.role}</p>
              </li>
            ))}
          </ul>
          <div className="p2-crew__side">
            <div className="p2-w p2-w--black p2-fleet">
              <p className="p2-mono p2-fleet__title">{c.crew.machinesTitle}</p>
              <div role="table" aria-label={c.crew.machinesTitle}>
                <div className="p2-fleet__row p2-fleet__head" role="row">
                  {k.heads.map((h) => (
                    <span key={h} role="columnheader">{h}</span>
                  ))}
                </div>
                {c.crew.machines.map((m) => (
                  <div className="p2-fleet__row" role="row" key={m.type}>
                    <span role="cell">{m.type}</span>
                    <span role="cell">{m.size || k.various}</span>
                    <span role="cell">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p2-area">
              <p className="p2-mono p2-area__title">{c.crew.areaTitle}</p>
              <ul className="p2-area__chips">
                {c.crew.regions.map((r) => (
                  <li key={r} className="p2-mono">{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
