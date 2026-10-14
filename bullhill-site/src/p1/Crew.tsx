import type { Content } from '../shared/content';
import { Placeholder } from '../shared/Placeholder';
import { sh, t } from './copy';

export function Crew({ c }: { c: Content }) {
  const x = t(c);
  return (
    <section id="crew" className="crew" aria-labelledby="crew-title">
      <div className="crew__bar mono">
        <span>{c.crew.kicker}</span>
        <span>{c.contact.area}</span>
        <span>{c.contact.hours}</span>
      </div>

      <div className="crew__main">
        <p className="crew__intro mono-body">{c.crew.body}</p>
        <h2 id="crew-title" className="crew__title display">
          {sh(c, c.crew.title)}
        </h2>

        <ul className="crew__strip">
          {c.crew.people.map((p, i) => (
            <li key={i} className="crew__p">
              <Placeholder shot={p.shot} label={c.ui.photo} index={i + 1} className="crew__ph" brief={false} />
              <p className="crew__name mono">{p.name}</p>
              <p className="crew__role mono">{p.role}</p>
            </li>
          ))}
        </ul>

        <p className="crew__title crew__title--2 display">{sh(c, x.crewLine)}</p>
      </div>

      <div className="stats">
        <p className="mono kicker stats__k">{c.stats.kicker}</p>
        <ul className="stats__row">
          {c.stats.items.map((s) => (
            <li key={s.label} className="stat">
              <p className="stat__v display">
                {s.value}
                {s.unit && <span className="stat__u">{s.unit}</span>}
              </p>
              <p className="stat__l mono">{s.label}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="fleet">
        <div className="fleet__col">
          <h3 className="mono kicker">{c.crew.machinesTitle}</h3>
          <ul className="fleet__rows">
            {c.crew.machines.map((m) => (
              <li key={m.type} className="fleet__row mono">
                <span>{m.type}</span>
                <span>{m.size}</span>
                <span>{m.count} ×</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="fleet__col">
          <h3 className="mono kicker">{c.crew.areaTitle}</h3>
          <p className="fleet__regions mono">{c.crew.regions.join(' / ')}</p>
        </div>
      </div>
    </section>
  );
}
