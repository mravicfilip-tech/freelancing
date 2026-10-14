import type { Content } from '../../../shared/content';
import { Bracket } from '../../Bracket';
import { WORK_FOCAL } from '../../copy';
import { NotchFrame } from './Notch';
import './hero.css';

// Hero 3, split. Text and the four stats in columns 1 to 6, one tall photo in the notched frame in
// columns 7 to 12, with its caption under it and the red glow behind it.
export function Hero3({ c }: { c: Content }) {
  const index = c.work.items.findIndex((i) => i.photo === 'ducts-fence');
  const item = c.work.items[index];
  const total = String(c.work.items.length).padStart(2, '0');
  return (
    <section className="hero hv hv3" data-hero="3" aria-labelledby="hv3-title">
      <div className="hv3__glow" aria-hidden="true" />
      <div className="hv3__in g gc">
        <div className="hv3__head">
          <p className="hv3__kicker mono">{c.hero.kicker}</p>
          <h1 id="hv3-title" className="hv3__title display">
            <span>{c.hero.split[0]}</span> <span>{c.hero.split[1]}</span>
          </h1>
        </div>
        <figure className="hv3__fig">
          <NotchFrame id="ducts-fence" lang={c.lang} focal={WORK_FOCAL['ducts-fence']} sizes="(min-width: 1200px) 680px, 100vw" priority />
          <figcaption className="hv__cap mono-body">
            <span className="hv__capn">
              {String(index + 1).padStart(2, '0')} / {total}
            </span>
            <span>{item.caption}</span>
          </figcaption>
        </figure>
        <div className="hv3__body">
          <p className="hv3__lede mono-body">{c.hero.lede}</p>
          <div className="hv__cta">
            <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>
            <Bracket href="#contact">{c.ui.send}</Bracket>
          </div>
          <dl className="hv3__stats">
            {c.stats.items.map((s) => (
              <div key={s.label} className="hv3__stat">
                <dt className="hv3__v">
                  {s.value}
                  {s.unit ? <span className="hv3__u"> {s.unit}</span> : null}
                </dt>
                <dd className="hv3__l mono">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
