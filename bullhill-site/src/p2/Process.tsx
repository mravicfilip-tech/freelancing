import type { Content } from '../shared/content';
import { Media } from '../shared/Media';
import { Icon, Guides } from './icons';
import { pick } from './copy';

const BARS = [80, 70, 65];

export function Process({ c }: { c: Content }) {
  const k = pick(c.lang).proc;
  return (
    <section className="p2-process" id="process">
      <Guides />
      <div className="p2-wrap">
        <h2 className="p2-display p2-huge p2-process__title">{c.process.title}</h2>

        <ol className="p2-steps" aria-label={k.stepsLabel}>
          {c.process.steps.map((s) => (
            <li key={s.n} className="p2-step">
              <p className="p2-mono p2-step__n">{s.n}</p>
              <h3 className="p2-step__title">{s.title}</h3>
              <p className="p2-step__body">{s.body}</p>
              <span className="p2-step__mid" aria-hidden="true" />
            </li>
          ))}
        </ol>

        <div className="p2-pcards">
          <Media shot={c.services.items[2].shot} lang={c.lang} label={c.ui.photo} brief={false} focal="50% 62%" sizes="(min-width: 1200px) 25vw, (min-width: 768px) 50vw, 100vw" className="p2-ph p2-pcards__photo" />

          <article className="p2-card p2-card--sm">
            <h3 className="p2-card__upper">{k.cards.bars.title}</h3>
            <p className="p2-card__body">{k.cards.bars.body}</p>
            <div className="p2-card__widget">
              <div className="p2-w p2-bars">
                {k.cards.bars.rows.map((r, i) => (
                  <div key={r} className="p2-bars__row">
                    <p>{r}</p>
                    <div className="p2-bar p2-bar--hatch" role="img" aria-label={`${r} ${BARS[i]}%`}>
                      <span style={{ width: `${BARS[i]}%` }} />
                    </div>
                    <p className="p2-bars__v">{BARS[i]}%</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="p2-card p2-card--sm">
            <h3 className="p2-card__upper">{k.cards.check.title}</h3>
            <p className="p2-card__body">{k.cards.check.body}</p>
            <div className="p2-card__widget">
              <ul className="p2-w p2-checks">
                {c.process.steps.map((s, i) => (
                  <li key={s.n} className={i < 3 ? 'is-done' : ''}>
                    <span className="p2-checks__box" aria-hidden="true">{i < 3 && <Icon name="check" size={16} />}</span>
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="p2-card p2-card--sm">
            <h3 className="p2-card__upper">{k.cards.metrics.title}</h3>
            <p className="p2-card__body">{k.cards.metrics.body}</p>
            <div className="p2-card__widget">
              <div className="p2-w p2-metrics">
                <p className="p2-metrics__head p2-mono">
                  <span>{k.cards.metrics.heads[0]}</span>
                  <span>{k.cards.metrics.heads[1]}</span>
                </p>
                {k.cards.metrics.rows.map((r) => (
                  <p key={r[0]} className="p2-metrics__row">
                    <span>{r[0]}</span>
                    <span className="p2-chip p2-chip--black">{r[1]}</span>
                  </p>
                ))}
                <p className="p2-metrics__foot">{k.cards.metrics.foot}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
