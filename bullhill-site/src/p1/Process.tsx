import type { Content } from '../shared/content';
import { RadialField } from './art';
import { sh } from './copy';

export function Process({ c }: { c: Content }) {
  const total = String(c.process.steps.length).padStart(2, '0');
  return (
    <section id="process" className="proc" aria-labelledby="proc-title">
      <div className="proc__field" aria-hidden="true">
        <RadialField className="art art--light proc__field-d" w={1440} h={900} inner={430} />
        <RadialField className="art art--light proc__field-p" w={390} h={760} inner={150} />
      </div>
      <div className="proc__head">
        <p className="mono kicker">{c.process.kicker}</p>
        <h2 id="proc-title" className="proc__title display">
          {sh(c, c.process.title)}
        </h2>
        <p className="proc__lede">{c.process.lede}</p>
      </div>

      <ol className="layers">
        {c.process.layers.map((l) => (
          <li key={l.id} className={`layer layer--${l.id}${l.id === 'ducts' ? ' layer--focus' : ''}`}>
            <span className="layer__l display">{sh(c, l.label)}</span>
            <span className="layer__note mono">{l.note}</span>
          </li>
        ))}
      </ol>
      <p className="layers__depth mono">{c.process.note}</p>

      <ol className="steps">
        {c.process.steps.map((s) => (
          <li key={s.n} className="step">
            <p className="mono step__n">
              {s.n} / {total}
            </p>
            <h3 className="step__title display">{sh(c, s.title)}</h3>
            <p className="step__body">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
