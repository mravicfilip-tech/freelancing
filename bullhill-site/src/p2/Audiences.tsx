import type { Audience, Content } from '../shared/content';
import { Placeholder } from '../shared/Placeholder';
import { Icon, Guides } from './icons';
import { pick } from './copy';

function AudienceCard({ c, a, shots, id }: { c: Content; a: Audience; shots: Content['hero']['shot'][]; id: string }) {
  return (
    <article className="p2-aud" aria-labelledby={id}>
      <div className="p2-aud__photos">
        {shots.map((s, i) => (
          <Placeholder key={s.id} shot={s} label={c.ui.photo} index={i + 1} brief={false} mark={false} className="p2-ph p2-ph--dark p2-aud__ph" />
        ))}
      </div>
      <div className="p2-aud__body">
        <p className="p2-mono p2-aud__kicker">{a.kicker}</p>
        <h3 className="p2-aud__title" id={id}>{a.title}</h3>
        <p className="p2-aud__text">{a.body}</p>
        <ul className="p2-aud__points">
          {a.points.map((p) => (
            <li key={p.title}>
              <span className="p2-aud__check" aria-hidden="true">
                <Icon name="check" size={20} />
              </span>
              <div>
                <h4>{p.title}</h4>
                <p>{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <a className="p2-btn p2-btn--primary" href="#contact">
          {a.cta}
          <Icon name="arrow" size={16} />
        </a>
      </div>
    </article>
  );
}

export function Audiences({ c }: { c: Content }) {
  const k = pick(c.lang).why;
  const s = c.services.items;
  const p = c.projects.items;
  return (
    <section className="p2-why">
      <Guides />
      <div className="p2-wrap">
        <div className="p2-why__head">
          <h2 className="p2-display p2-huge p2-why__title">{k.title}</h2>
          <p className="p2-why__body">{k.body}</p>
        </div>

        <ul className="p2-stats" aria-label={k.statsLabel}>
          {c.stats.items.map((x) => (
            <li key={x.label} className="p2-stats__item">
              <p className="p2-stats__value">
                {x.value}
                {x.unit && <span>{x.unit}</span>}
              </p>
              <p className="p2-mono p2-stats__label">{x.label}</p>
            </li>
          ))}
        </ul>

        <div className="p2-auds">
          <AudienceCard c={c} a={c.audiences.operators} shots={[s[0].shot, p[0].shot, s[1].shot]} id="p2-aud-op" />
          <AudienceCard c={c} a={c.audiences.contractors} shots={[p[1].shot, s[2].shot, p[3].shot]} id="p2-aud-co" />
        </div>
      </div>
    </section>
  );
}
