import type { Content } from '../shared/content';
import { Icon, Guides } from './icons';
import { DOTS } from './dome';
import { pick } from './copy';

function Dome() {
  return (
    <div className="p2-dome" aria-hidden="true">
      <div className="p2-dome__body" />
      <svg className="p2-dome__dots" viewBox="0 0 800 800">
        <defs>
          <filter id="p2-dome-blur" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        {DOTS.map((d, i) => (
          <g key={i} transform={`rotate(${d.rot.toFixed(1)} ${d.cx.toFixed(1)} ${d.cy.toFixed(1)})`}>
            {d.glow && <ellipse cx={d.cx} cy={d.cy} rx={d.rx * 2.2} ry={d.ry * 2.2} fill="#d00b11" opacity="0.7" filter="url(#p2-dome-blur)" />}
            <ellipse
              cx={d.cx}
              cy={d.cy}
              rx={d.fill ? d.rx * 0.8 : d.rx}
              ry={d.fill ? d.ry * 0.8 : d.ry}
              fill={d.fill ? '#d00b11' : 'none'}
              stroke="#d00b11"
              strokeWidth="1.6"
              strokeOpacity={d.fill ? 1 : (0.3 + 0.6 * d.d).toFixed(2)}
            />
          </g>
        ))}
      </svg>
      <div className="p2-dome__sheen" />
    </div>
  );
}

export function Hero({ c }: { c: Content }) {
  const k = pick(c.lang).hero;
  return (
    <section className="p2-hero" id="top">
      <Guides />
      <div className="p2-wrap p2-hero__inner">
        <div className="p2-hero__text">
          <h1 className="p2-display p2-hero__title">
            <span>{c.hero.split[0]}</span> <span>{c.hero.split[1]}</span>
          </h1>
          <p className="p2-hero__lede">{c.hero.lede}</p>
          <div className="p2-hero__btns">
            <a className="p2-btn p2-btn--primary" href="#contact">
              {c.ui.send}
              <Icon name="arrow" size={16} />
            </a>
            <a className="p2-btn p2-btn--dark" href={c.contact.phoneHref}>
              {c.ui.call}
            </a>
          </div>
        </div>
        <div className="p2-hero__art">
          <Dome />
          <div className="p2-route" role="group" aria-label={k.cardTitle}>
            <div className="p2-route__bar">
              <span className="p2-route__ring" aria-hidden="true" />
              <span>{k.cardTitle}</span>
            </div>
            <div className="p2-route__body">
              <p className="p2-route__status">{k.status}</p>
              <dl className="p2-route__grid">
                <div>
                  <dt>{k.length}</dt>
                  <dd>{k.lengthV}</dd>
                </div>
                <div>
                  <dt>{k.ducts}</dt>
                  <dd>{k.ductsV}</dd>
                </div>
                <div>
                  <dt>{k.chambers}</dt>
                  <dd>{k.chambersV}</dd>
                </div>
                <div>
                  <dt>{k.progress}</dt>
                  <dd>
                    {k.progressV}
                    <span className="p2-chip p2-chip--red">{k.delta}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
