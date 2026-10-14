import type { Content } from '../shared/content';
import { Placeholder } from '../shared/Placeholder';
import { Icon, Guides } from './icons';

export function Cluster({ c }: { c: Content }) {
  const shots = [
    c.projects.items[0].shot,
    c.services.items[1].shot,
    c.projects.items[1].shot,
    c.services.items[3].shot,
    c.crew.shot,
    c.projects.items[2].shot,
    c.services.items[2].shot,
    c.projects.items[3].shot,
  ];
  return (
    <section className="p2-cluster">
      <Guides />
      <div className="p2-wrap">
        <div className="p2-cluster__stage">
          {shots.map((s, i) => (
            <Placeholder key={`${s.id}${i}`} shot={s} label={c.ui.photo} index={i + 1} brief={false} className={`p2-ph p2-cluster__ph p2-cluster__ph--${i + 1}`} />
          ))}
          <div className="p2-cluster__text">
            <p>{c.ethos.body}</p>
            <div className="p2-cluster__actions">
              <a className="p2-btn p2-btn--primary" href="#crew">
                {c.ethos.cta}
                <Icon name="arrow" size={16} />
              </a>
              <a className="p2-link" href="#process">
                {c.nav[1].label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
