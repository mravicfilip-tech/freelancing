// The button board at /?buttons. The five button variants side by side, each with its number, on white and on the dark
// servis ground, at rest and with the hover look forced on. The site itself takes a variant with ?btn=1 to 5.
import { useEffect } from 'react';
import { hero, pillars } from '../../content';
import { Btn } from './ui';
import '../../ui/heroframe.css';
import './shell.css';

const VARIANTS = ['1', '2', '3', '4', '5'];

const NAMES: Record<string, string> = {
  '1': 'Solid, 2px radius',
  '2': 'Pill with a sliding dot',
  '3': 'Split, label and cell',
  '4': 'Notched corner',
  '5': 'Text forward',
};

function Set({ hover }: { hover?: boolean }) {
  return (
    <div className="bb-set">
      <Btn href="#" kind="primary" hover={hover}>
        {hero.quote.label}
      </Btn>
      <Btn href="#" kind="secondary" hover={hover}>
        {pillars[2].more}
      </Btn>
      <Btn href="#" kind="secondary" icon="phone" hover={hover}>
        {hero.sales.label} <span className="num">{hero.sales.number}</span>
      </Btn>
      <Btn href="#" kind="secondary" icon="phone" hover={hover}>
        {hero.service.label} <span className="num">{hero.service.number}</span>
      </Btn>
    </div>
  );
}

export function ButtonBoard() {
  useEffect(() => {
    document.documentElement.removeAttribute('data-btn');
  }, []);
  return (
    <main className="s2 bb">
      <h1 className="bb-title">Varijante dugmadi</h1>
      <div className="bb-cols">
        {VARIANTS.map((v) => (
          <section className="bb-col" data-btn={v} key={v} aria-label={`Varijanta ${v}`}>
            <h2 className="bb-head">
              <b>{v}</b>
              {NAMES[v]}
            </h2>
            <div className="bb-ground">
              <p className="s2-label">Bela podloga</p>
              <Set />
              <p className="s2-label">Hover</p>
              <Set hover />
            </div>
            <div className="bb-ground btn-ground-dark" data-ink="dark">
              <p className="s2-label">Tamna podloga</p>
              <Set />
              <p className="s2-label">Hover</p>
              <Set hover />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
