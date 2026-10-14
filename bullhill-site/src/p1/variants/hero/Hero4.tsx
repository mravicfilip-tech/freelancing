import type { Content } from '../../../shared/content';
import { HillArt } from '../../art';
import { Bracket } from '../../Bracket';
import { WORK_FOCAL } from '../../copy';
import { NotchFrame } from './Notch';
import './hero.css';

// Hero 4, giant type. The headline runs across all twelve columns, the dotted hill sits low behind
// the last line with the red glow, and the bottom row holds three notched thumbnails with their
// numbers, then the lede and the buttons.
export function Hero4({ c }: { c: Content }) {
  const total = String(c.work.items.length).padStart(2, '0');
  const thumbs = c.work.items.slice(0, 3);
  return (
    <section className="hero hv hv4" data-hero="4" aria-labelledby="hv4-title">
      <div className="hv4__glow" aria-hidden="true" />
      <HillArt className="hv4__art art" />
      <div className="hv4__in g">
        <p className="hv4__kicker mono">{c.hero.kicker}</p>
        <h1 id="hv4-title" className="hv4__title display">
          {c.hero.split[0]} {c.hero.split[1]}
        </h1>
        <div className="hv4__row gc">
          <ol className="hv4__thumbs">
            {thumbs.map((it, i) => (
              <li key={it.photo} className="hv4__thumb">
                <NotchFrame id={it.photo} lang={c.lang} focal={WORK_FOCAL[it.photo]} size="s" sizes="(min-width: 1200px) 220px, 120px" />
                <p className="hv4__n mono">
                  {String(i + 1).padStart(2, '0')} / {total}
                </p>
              </li>
            ))}
          </ol>
          <div className="hv4__copy">
            <p className="hv4__lede mono-body">{c.hero.lede}</p>
            <div className="hv__cta">
              <Bracket href={c.contact.phoneHref}>{c.ui.call}</Bracket>
              <Bracket href="#contact">{c.ui.send}</Bracket>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
