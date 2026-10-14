import type { Content } from '../shared/content';
import { Icon, Guides } from './icons';
import { pick } from './copy';

type K = ReturnType<typeof pick>;

function Gauge({ k }: { k: K['gauge'] }) {
  const ticks = Array.from({ length: 11 }, (_, i) => i);
  return (
    <div className="p2-w p2-gauge">
      <div className="p2-gauge__ruler" aria-hidden="true">
        <div className="p2-gauge__fill" />
        {ticks.map((t) => (
          <i key={t} style={{ top: `${t * 10}%` }} className={t % 5 === 0 ? 'is-major' : ''} />
        ))}
      </div>
      <div className="p2-gauge__read">
        <p className="p2-mono p2-w__label">{k.label}</p>
        <p className="p2-gauge__value">
          {k.value}
          <span>{k.unit}</span>
        </p>
        <dl className="p2-gauge__rows">
          <div>
            <dt>{k.cover}</dt>
            <dd>{k.coverV}</dd>
          </div>
          <div>
            <dt>{k.width}</dt>
            <dd>{k.widthV}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function DuctTable({ k }: { k: K['duct'] }) {
  return (
    <div className="p2-w p2-w--black p2-table" role="table" aria-label={k.heads.join(', ')}>
      <div className="p2-table__row p2-table__head" role="row">
        {k.heads.map((h) => (
          <span key={h} role="columnheader">
            {h}
          </span>
        ))}
      </div>
      {k.rows.map((r) => (
        <div className="p2-table__row" role="row" key={r[0]}>
          <span role="cell">{r[0]}</span>
          <span role="cell">{r[1]}</span>
          <span role="cell">
            <span className={`p2-chip ${r[2] === k.done ? 'p2-chip--red' : 'p2-chip--ghost'}`}>{r[2]}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Counter({ c, k }: { c: Content; k: K['counter'] }) {
  const p = c.projects.items.find((x) => x.connections);
  return (
    <div className="p2-w p2-counter">
      <p className="p2-mono p2-w__label">{c.projects.labels.connections}</p>
      <p className="p2-counter__value">{p?.connections ?? '412'}</p>
      <div className="p2-bar" role="img" aria-label="86%">
        <span style={{ width: '86%' }} />
      </div>
      <p className="p2-counter__sub">
        <span>{k.done}</span>
        <span>{k.of}</span>
      </p>
    </div>
  );
}

function Surface({ k }: { k: K['surface'] }) {
  return (
    <div className="p2-w p2-surface">
      <p className="p2-mono p2-w__label">{k.label}</p>
      <ul className="p2-surface__chips">
        {k.items.map((x, i) => (
          <li key={x} className={i === 0 ? 'is-on' : ''}>
            {i === 0 && <Icon name="check" size={16} />}
            {x}
          </li>
        ))}
      </ul>
      <p className="p2-surface__status">
        <i aria-hidden="true" />
        {k.status}
      </p>
    </div>
  );
}

const ICONS = ['trench', 'duct', 'house', 'surface'];

export function Services({ c }: { c: Content }) {
  const k = pick(c.lang);
  return (
    <section className="p2-services" id="services">
      <Guides />
      <div className="p2-wrap">
        <h2 className="p2-display p2-h2 p2-services__title">
          {c.services.title} <span>{c.services.lede}</span>
        </h2>
        <div className="p2-bento">
          {c.services.items.map((s, i) => (
            <article key={s.id} className={`p2-card p2-card--${s.id}`}>
              <div className="p2-card__text">
                <p className="p2-mono p2-card__label">
                  <Icon name={ICONS[i]} />
                  {s.title}
                </p>
                <p className="p2-card__short">{s.short}</p>
                <p className="p2-card__body">{s.body}</p>
              </div>
              <div className="p2-card__widget">
                {i === 0 && <Gauge k={k.gauge} />}
                {i === 1 && <DuctTable k={k.duct} />}
                {i === 2 && <Counter c={c} k={k.counter} />}
                {i === 3 && <Surface k={k.surface} />}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
