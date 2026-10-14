import { Accordion } from 'radix-ui';
import type { Content } from '../shared/content';
import { Bracket } from './Bracket';
import { Crosshairs } from './Crew';
import { sh, t } from './copy';

// The bull-red down right arrow before each question.
function Arrow() {
  return (
    <svg className="faq__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
      <path d="M3.5 3.5 L12 12" />
      <path d="M5 12.25 H12.25 V5" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2.5 5.5 L8 11 L13.5 5.5" />
    </svg>
  );
}

export function Faq({ c }: { c: Content }) {
  const x = t(c);
  return (
    <section className="faq" aria-labelledby="faq-title">
      <div className="g">
        <div className="faq__panel">
          <span className="faq__glow" aria-hidden="true" />
          <div className="faq__frame">
            <Crosshairs />
            <div className="faq__intro">
              <h2 id="faq-title" className="faq__title display">
                {sh(c, c.faq.title)}
              </h2>
              <Bracket href="#contact">{x.faqCta}</Bracket>
            </div>
            <Accordion.Root type="single" collapsible className="acc">
              {c.faq.items.map((it, i) => (
                <Accordion.Item key={it.q} value={`q${i}`} className="acc__item">
                  <Accordion.Header className="acc__h">
                    <Accordion.Trigger className="acc__trig">
                      <Arrow />
                      <span className="acc__q">{it.q}</span>
                      <span className="acc__tog" aria-hidden="true">
                        <Chevron />
                      </span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="acc__content">
                    <p>{it.a}</p>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>
        </div>
      </div>
    </section>
  );
}
