import { useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Content } from '../shared/content';
import { Bracket } from './Bracket';
import { sh } from './copy';
import { useInView, useScrollVar } from './motion/motion';
import { Rise } from './motion/Rise';
import './motion/sections-a.css';
import { ServiceArtMotion } from './variants/services/ServiceArtMotion';

const KINDS = ['trench', 'ducts', 'house', 'layers'] as const;
const TONES = ['black', 'charcoal', 'red', 'light'] as const;

export function Services({ c }: { c: Content }) {
  const secRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // the panel rides up over the work section. The cards hold their places and fade in once, and the
  // dot art inside each card moves, see variants/services.
  useScrollVar(secRef, '--sv', 1, 0.4);
  useInView(listRef);
  const total = String(c.services.items.length).padStart(2, '0');
  return (
    <section id="services" className="eth" aria-labelledby="eth-title" ref={secRef}>
      <div className="eth__top">
        <div className="eth__l">
          <Rise as="p" body className="mono kicker">
            {c.ethos.kicker}
          </Rise>
          <Rise id="eth-title" className="eth__title display">
            {sh(c, c.ethos.title)}
          </Rise>
        </div>
        <div className="eth__r">
          <Rise as="p" body className="eth__body">
            {c.ethos.body}
          </Rise>
          <Bracket href="#crew">{c.ethos.cta}</Bracket>
        </div>
      </div>

      <div className="svc__head">
        <p className="mono kicker">{c.services.kicker}</p>
        <p className="mono kicker svc__lede">{c.services.title}</p>
      </div>
      <ul className="svc" ref={listRef}>
        {c.services.items.map((s, i) => (
          <li key={s.id} className={`card card--${TONES[i % 4]}`} style={{ '--i': i } as CSSProperties}>
            <h3 className="card__title display">{sh(c, s.title)}</h3>
            <ServiceArtMotion kind={KINDS[i % 4]} className="card__art art" index={i} />
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
