import './r3-process.css';
import type { CSSProperties } from 'react';
import type { Content } from '../shared/content';
import { Media } from '../shared/Media';
import { Bracket } from './Bracket';
import { CUT_EDGE, CUT_PINS, CUT_VB, RadialField, TrenchCut, type CutId } from './art';
import { sh } from './copy';
import { tp } from './copy-process';

const pct = (v: number, o: number, s: number) => `${(((v - o) / s) * 100).toFixed(3)}%`;

// A square cross with a hairline box, the tag icon of the labels.
function TagIcon() {
  return (
    <svg className="cl__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" />
      <path d="M4.5 4.5 L11.5 11.5 M11.5 4.5 L4.5 11.5" />
    </svg>
  );
}

// The notched photo frame of round 3 note 1. A hairline frame 8px outside the photo, crosshairs
// at the frame corners and the skewed bar in the notch.
function Frame({ c, i }: { c: Content; i: number }) {
  const s = c.process.steps[i];
  const shot = { id: `s${i + 1}`, brief: tp(c).stepBrief, photo: s.photo };
  return (
    <div className="pframe">
      {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
        <i key={k} className={`pframe__xh pframe__xh--${k}`} aria-hidden="true" />
      ))}
      <div className="pframe__clip">
        <Media shot={shot} lang={c.lang} label={c.ui.photo} className="pframe__ph" sizes="(min-width: 1200px) 58vw, (min-width: 768px) 45vw, 92vw" />
      </div>
      <span className="pframe__bar" aria-hidden="true" />
    </div>
  );
}

export function Process({ c }: { c: Content }) {
  const total = String(c.process.steps.length).padStart(2, '0');
  const x = tp(c);
  return (
    <section id="process" className="proc" aria-labelledby="proc-title">
      <div className="proc__field" aria-hidden="true">
        <RadialField className="art art--light proc__field-d" w={1440} h={900} inner={430} />
        <RadialField className="art art--light proc__field-p" w={390} h={760} inner={150} />
      </div>
      <div className="g">
        <div className="proc__head gc">
          <p className="mono kicker proc__kicker">{c.process.kicker}</p>
          <h2 id="proc-title" className="proc__title display">
            {sh(c, c.process.title)}
          </h2>
          <p className="proc__lede">{c.process.lede}</p>
        </div>

        <figure className="pfig" aria-hidden="true">
          <span className="pfig__hill" />
          <div className="pfig__clip">
            <div className="pfig__box">
              <TrenchCut className="pfig__svg" />
              {c.process.layers.map((l, i) => {
                const p = CUT_PINS[l.id as CutId];
                if (!p) return null;
                const n = String(i + 1).padStart(2, '0');
                const edge: CSSProperties = { left: pct(CUT_EDGE[p.side], CUT_VB.x, CUT_VB.w), top: pct(p.ty, CUT_VB.y, CUT_VB.h) };
                return (
                  <span key={l.id}>
                    <span className={`cl cl--${p.side}`} style={edge}>
                      <TagIcon />
                      <span className="cl__l">{l.label}</span>
                    </span>
                    <span className={`cn cn--${p.side} mono`} style={edge}>
                      {n}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </figure>

        <ol className="layers">
          {c.process.layers.map((l, i) => (
            <li key={l.id} className={`layer gc layer--${l.id}${l.id === 'ducts' ? ' layer--focus' : ''}`}>
              <span className="layer__k mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="layer__l display">{sh(c, l.label)}</span>
              <span className="layer__note mono">{l.note}</span>
            </li>
          ))}
        </ol>
        <p className="layers__depth mono">{c.process.note}</p>

        <ol className="steps">
          {c.process.steps.map((s, i) => (
            <li key={s.n} className="step gc" data-flip={i % 2 === 1 ? 'true' : undefined}>
              <div className="step__media">
                <Frame c={c} i={i} />
              </div>
              <div className="step__text">
                <div className="step__top">
                  <p className="mono step__n">
                    {s.n} / {total}
                  </p>
                  <h3 className="step__title display">{sh(c, s.title)}</h3>
                </div>
                <div className="step__bot">
                  <p className="step__body">{s.body}</p>
                  <Bracket href="#services" className="step__btn">
                    {x.knowMore}
                  </Bracket>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
