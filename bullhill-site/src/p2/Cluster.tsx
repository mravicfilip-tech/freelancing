import type { Content } from '../shared/content';
import { Media } from '../shared/Media';
import type { Shot } from '../shared/content';
import { Icon, Guides } from './icons';

export function Cluster({ c }: { c: Content }) {
  const shots: { shot: Shot; focal?: string }[] = [
    { shot: c.hero.shot, focal: '50% 50%' },
    { shot: c.services.items[1].shot },
    { shot: c.projects.items[1].shot, focal: '50% 40%' },
    { shot: c.services.items[3].shot, focal: '50% 62%' },
    { shot: c.projects.items[3].shot, focal: '30% 56%' },
    { shot: c.services.items[0].shot, focal: '50% 72%' },
    { shot: c.projects.items[4].shot },
    { shot: c.hero.shot, focal: '50% 62%' },
  ];
  return (
    <section className="p2-cluster">
      <Guides />
      <div className="p2-wrap">
        <div className="p2-cluster__stage">
          {shots.map((s, i) => (
            <Media key={`${s.shot.id}${i}`} shot={s.shot} lang={c.lang} label={c.ui.photo} index={i + 1} brief={false} focal={s.focal} sizes="(min-width: 1200px) 18vw, (min-width: 768px) 36vw, 44vw" className={`p2-ph p2-cluster__ph p2-cluster__ph--${i + 1}`} />
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
