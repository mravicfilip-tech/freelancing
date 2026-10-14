import type { Content } from '../shared/content';
import { Arrow, HillArt } from './art';
import { Bracket } from './Bracket';

export function Hero({ c }: { c: Content }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <HillArt className="hero__art art art--hero" />
      <div className="hero__in">
        <h1 id="hero-title" className="hero__title display">
          <span className="hero__a">{c.hero.split[0]}</span> <span className="hero__b">{c.hero.split[1]}</span>
        </h1>
        <div className="hero__foot">
          <div className="hero__copy">
            <p className="hero__lede mono-body">{c.hero.lede}</p>
            <div className="hero__cta">
              <Bracket variant="solid" href={c.contact.phoneHref}>{c.ui.call}</Bracket>
              <Bracket href="#contact">{c.ui.send}</Bracket>
            </div>
          </div>
          <a className="hero__scroll mono" href="#work">
            {c.ui.scroll}
            <Arrow dir="down" />
          </a>
        </div>
      </div>
    </section>
  );
}
