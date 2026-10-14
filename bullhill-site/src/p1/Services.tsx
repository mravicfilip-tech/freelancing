import type { Content } from '../shared/content';
import { ServiceArt } from './art';
import { Bracket } from './Bracket';
import { sh } from './copy';

const KINDS = ['trench', 'ducts', 'house', 'layers'] as const;
const TONES = ['black', 'charcoal', 'red', 'light'] as const;

export function Services({ c }: { c: Content }) {
  const total = String(c.services.items.length).padStart(2, '0');
  return (
    <section id="services" className="eth" aria-labelledby="eth-title">
      <div className="eth__top">
        <div className="eth__l">
          <p className="mono kicker">{c.ethos.kicker}</p>
          <h2 id="eth-title" className="eth__title display">
            {sh(c, c.ethos.title)}
          </h2>
        </div>
        <div className="eth__r">
          <p className="eth__body">{c.ethos.body}</p>
          <Bracket href="#crew">{c.ethos.cta}</Bracket>
        </div>
      </div>

      <div className="svc__head">
        <p className="mono kicker">{c.services.kicker}</p>
        <p className="mono kicker svc__lede">{c.services.title}</p>
      </div>
      <ul className="svc">
        {c.services.items.map((s, i) => (
          <li key={s.id} className={`card card--${TONES[i % 4]}`}>
            <h3 className="card__title display">{sh(c, s.title)}</h3>
            <ServiceArt kind={KINDS[i % 4]} className="card__art art" />
            <div className="card__foot">
              <p className="card__n mono">
                {s.n} / {total}
              </p>
              <p className="card__copy mono-body">{s.short}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
