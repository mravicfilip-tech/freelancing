import { useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Content } from '../shared/content';
import { ServiceArt } from './art';
import { Bracket } from './Bracket';
import { sh } from './copy';
import { useInView, useScrollVar } from './motion/motion';
import { Rise } from './motion/Rise';
import './motion/sections-a.css';

const KINDS = ['trench', 'ducts', 'house', 'layers'] as const;
const TONES = ['black', 'charcoal', 'red', 'light'] as const;

export function Services({ c }: { c: Content }) {
  const secRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // the panel rides up over the work section, then from 1200 the cards slide out of the first card's
  // place as the row goes from the bottom to the middle of the screen. Under 1200 they rise once.
  useScrollVar(secRef, '--sv', 1, 0.4);
  useScrollVar(listRef, '--sp', 1, 0.5);
  useInView(listRef);
  const total = String(c.services.items.length).padStart(2, '0');
  return (
    <section id="services" className="eth" aria-labelledby="eth-title" ref={secRef}>
      <div className="eth__top">
        <div className="eth__l">
          <p className="mono kicker">{c.ethos.kicker}</p>
          <Rise id="eth-title" className="eth__title display">
            {sh(c, c.ethos.title)}
          </Rise>
        </div>
        <div className="eth__r">
          <p className="eth__body">{c.ethos.body}</p>
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
            <ServiceArt kind={KINDS[i % 4]} className="card__art art" />
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
