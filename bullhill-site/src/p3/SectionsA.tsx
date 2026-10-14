import type { CSSProperties } from 'react';
import type { Content } from '../shared/content';
import { Placeholder } from '../shared/Placeholder';
import { ChevronDown, Corners, Crosshairs, Descent, MINI_SCENES, TRENCH_VIEW, TrenchWireframe, trenchAnchors } from './art';
import { stepShot, t } from './copy';
import { useActiveId } from './Header';
import { ArrowList, GreyBtn, Kicker, Tag } from './ui';

/* ---------- hero and descent ---------- */

export function Hero({ c }: { c: Content }) {
  return (
    <section id="top" className="p3-hero">
      <Placeholder shot={c.hero.shot} label={c.ui.photo} className="p3-hero__ph" />
      <Corners />
      <h1 className="p3-hero__title">{c.hero.title}</h1>
      <span className="p3-hero__chev" aria-hidden="true">
        <ChevronDown size={24} />
      </span>
    </section>
  );
}

export function DescentBand() {
  return <Descent />;
}

/* ---------- process wireframe ---------- */

const A = trenchAnchors();
const PINS: { id: string; at: [number, number]; up: boolean; to: [number, number] }[] = [
  { id: 'surface', at: [90, 100], up: true, to: A.surface },
  { id: 'tape', at: [560, 70], up: true, to: A.tape },
  { id: 'sand', at: [330, 565], up: false, to: A.sand },
  { id: 'ducts', at: [660, 565], up: false, to: A.ducts },
];

export function Process({ c }: { c: Content }) {
  return (
    <section id="process" className="p3-process p3-grid" aria-labelledby="p3-process-h">
      <div className="p3-process__fig">
        <TrenchWireframe leaders={PINS.map((p) => ({ from: p.at, to: p.to }))} />
        {PINS.map((p) => {
          const layer = c.process.layers.find((l) => l.id === p.id);
          if (!layer) return null;
          const style: CSSProperties = { left: `${p.at[0] / (TRENCH_VIEW.w / 100)}%`, top: `${p.at[1] / (TRENCH_VIEW.h / 100)}%` };
          return (
            <span key={p.id} className={`p3-pin${p.up ? ' p3-pin--up' : ''}`} style={style} title={layer.note}>
              <Tag>{layer.label}</Tag>
            </span>
          );
        })}
      </div>
      <div className="p3-process__text">
        <h2 id="p3-process-h" className="p3-h2">
          {c.process.title}
        </h2>
        <p className="p3-lede">{c.process.lede}</p>
        <p className="p3-mono p3-process__note">{c.process.note}</p>
      </div>
    </section>
  );
}

/* ---------- services ---------- */

export function Services({ c }: { c: Content }) {
  const items = c.services.items;
  const ids = items.map((s) => `svc-${s.id}`);
  const active = useActiveId(ids, '-40% 0px -50% 0px');
  const points = t(c, 'servicePoints');
  return (
    <section id="services" className="p3-services p3-grid" aria-labelledby="p3-services-h">
      <h2 className="sr-only" id="p3-services-h">
        {c.services.title}
      </h2>
      <span className="p3-glow p3-glow--a" aria-hidden="true" />
      <span className="p3-glow p3-glow--b" aria-hidden="true" />
      <nav className="p3-index" aria-label={t(c, 'serviceIndex')}>
        <ol>
          {items.map((s) => (
            <li key={s.id}>
              <a href={`#svc-${s.id}`} aria-current={active === `svc-${s.id}` ? 'true' : undefined}>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="p3-services__list">
        {items.map((s, i) => {
          const Mini = MINI_SCENES[i];
          return (
            <article key={s.id} id={`svc-${s.id}`} className="p3-svc" data-flip={i % 2 === 1 ? 'true' : undefined}>
              <p className="p3-svc__body">{s.body}</p>
              <div className="p3-svc__media">
                <h3 className="p3-svc__tag">
                  <Tag>{s.title}</Tag>
                </h3>
                <div className="p3-svc__frame">
                  <Mini />
                </div>
              </div>
              <ArrowList items={points[i]} className="p3-svc__list" />
              <div className="p3-svc__cta">
                <GreyBtn href="#contact" onLight={false}>
                  {t(c, 'serviceCta')}
                </GreyBtn>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- steps panel ---------- */

function Notch({ shot, label }: { shot: { id: string; brief: string }; label: string }) {
  return (
    <div className="p3-notch">
      <Crosshairs long />
      <div className="p3-notch__clip">
        <Placeholder shot={shot} label={label} className="p3-notch__ph" />
      </div>
      <span className="p3-notch__bar" aria-hidden="true" />
    </div>
  );
}

export function Steps({ c }: { c: Content }) {
  return (
    <section className="p3-panel p3-steps" aria-labelledby="p3-steps-h">
      <Kicker>{c.process.kicker}</Kicker>
      <h2 id="p3-steps-h" className="p3-h2 p3-steps__line">
        {t(c, 'stepsLine')}
      </h2>
      <ol className="p3-steps__list">
        {c.process.steps.map((s, i) => (
          <li key={s.n} className="p3-step" data-flip={i % 2 === 1 ? 'true' : undefined}>
            <Notch shot={stepShot(c, i)} label={c.ui.photo} />
            <div className="p3-step__text">
              <span className="p3-num">{`0${s.n}`}</span>
              <h3 className="p3-step__title">{s.title}</h3>
              <p className="p3-step__body">{s.body}</p>
              <GreyBtn href="#services">{t(c, 'knowMore')}</GreyBtn>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- full bleed crew photo ---------- */

export function CrewPhoto({ c }: { c: Content }) {
  return (
    <section className="p3-crewphoto" aria-label={c.crew.kicker}>
      <Placeholder shot={c.crew.shot} label={c.ui.photo} className="p3-crewphoto__ph" />
      <Corners />
      <div className="p3-ruler" aria-hidden="true" />
      <div className="p3-thumbs" aria-hidden="true">
        {c.crew.people.map((p, i) => (
          <span key={p.shot.id} className="p3-thumb" data-active={i === 0 ? 'true' : undefined}>
            <Placeholder shot={p.shot} label={c.ui.photo} brief={false} mark={false} className="p3-thumb__ph" />
          </span>
        ))}
      </div>
    </section>
  );
}
