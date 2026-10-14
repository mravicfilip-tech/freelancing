import { useRef, type CSSProperties } from 'react';
import type { Content, Shot } from '../shared/content';
import { Media } from '../shared/Media';
import { Photo } from '../shared/Photo';
import { photoAlt } from '../shared/photos';
import { ChevronDown, ChevronLeft, ChevronRightLg, Corners, Crosshairs, Descent, MINI_SCENES, TRENCH_VIEW, TrenchWireframe, trenchAnchors } from './art';
import { stepShot, t } from './copy';
import { useActiveId } from './Header';
import { ArrowList, GreyBtn, Kicker, Tag } from './ui';

/* ---------- hero and descent ---------- */

export function Hero({ c }: { c: Content }) {
  return (
    <section id="top" className="p3-hero">
      <Media shot={c.hero.shot} lang={c.lang} label={c.ui.photo} className="p3-hero__ph" sizes="100vw" priority focal="var(--p3-hero-focal)" />
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

/* ---------- work photos, right after the hero ---------- */

export function Work({ c }: { c: Content }) {
  const row = useRef<HTMLUListElement>(null);
  const items = c.work.items;
  const num = (i: number) => String(i + 1).padStart(3, '0');
  const go = (d: number) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector('li');
    el.scrollBy({ left: d * ((card?.getBoundingClientRect().width ?? 320) + 16), behavior: 'smooth' });
  };
  return (
    <section id="work" className="p3-work p3-grid" aria-labelledby="p3-work-h">
      <div className="p3-work__head">
        <div className="p3-work__intro">
          <Tag>{c.work.kicker}</Tag>
          <h2 id="p3-work-h" className="p3-h2 p3-work__title">
            {c.work.title}
          </h2>
          <p className="p3-lede">{c.work.lede}</p>
        </div>
        <div className="p3-work__nav">
          <span className="p3-mono">{`${String(items.length).padStart(2, '0')} ${c.work.count}`}</span>
          <button type="button" className="p3-sqbtn" onClick={() => go(-1)} aria-label={c.ui.prev}>
            <ChevronLeft />
          </button>
          <button type="button" className="p3-sqbtn" onClick={() => go(1)} aria-label={c.ui.next}>
            <ChevronRightLg />
          </button>
        </div>
      </div>
      <ul className="p3-work__row" ref={row} tabIndex={0} aria-label={c.work.title}>
        {items.map((it, i) => (
          <li key={it.photo} className="p3-work__card">
            <div className="p3-notch">
              <Crosshairs />
              <div className="p3-notch__clip">
                <Photo id={it.photo} alt={photoAlt(it.photo, c.lang)} sizes="(min-width: 1200px) 400px, 280px" className="p3-notch__ph" />
              </div>
              <span className="p3-notch__bar" aria-hidden="true" />
            </div>
            <p className="p3-work__cap">
              <span className="p3-work__n">{num(i)}</span>
              <span>{it.caption}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
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

function Notch({ shot, label, lang }: { shot: Shot; label: string; lang: Content['lang'] }) {
  return (
    <div className="p3-notch">
      <Crosshairs long />
      <div className="p3-notch__clip">
        <Media shot={shot} lang={lang} label={label} className="p3-notch__ph" sizes="(min-width: 1200px) 40vw, (min-width: 768px) 45vw, 90vw" />
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
            <Notch shot={{ ...stepShot(c, i), photo: s.photo }} label={c.ui.photo} lang={c.lang} />
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

const CREW_THUMBS = ['ducts-fence', 'restored-lane', 'route-trench-village'] as const;

export function CrewPhoto({ c }: { c: Content }) {
  return (
    <section className="p3-crewphoto" aria-label={c.crew.kicker}>
      <Media shot={c.crew.shot} lang={c.lang} label={c.ui.photo} className="p3-crewphoto__ph" sizes="100vw" />
      <Corners />
      <div className="p3-ruler" aria-hidden="true" />
      <div className="p3-thumbs" aria-hidden="true">
        {CREW_THUMBS.map((id) => (
          <span key={id} className="p3-thumb">
            <Photo id={id} alt="" sizes="88px" className="p3-thumb__ph" />
          </span>
        ))}
      </div>
    </section>
  );
}
