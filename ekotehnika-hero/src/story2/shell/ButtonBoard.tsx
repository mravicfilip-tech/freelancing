// The button board at /?buttons. Two axes, structure 1 to 6 down and hover A to E across, so one answer is a number and a
// letter, for example 3C. Each cell shows the primary and a phone secondary with the hover frozen at 60 percent of the move
// and at its end, on white and then on the dark servis ground. The site takes a pair with ?btn=3C, default 1A.
import { useEffect } from 'react';
import { hero } from '../../content';
import { Btn } from './ui';
import '../../ui/heroframe.css';
import './shell.css';

const STRUCTURES = [
  ['1', 'Solid'],
  ['2', 'Split, icon cell'],
  ['3', 'Notched corner'],
  ['4', 'Outline'],
  ['5', 'Text forward'],
  ['6', 'Bracket'],
];

const HOVERS = [
  ['A', 'Fill wipe from the left'],
  ['B', 'Fill rises from the bottom'],
  ['C', 'Text roll'],
  ['D', 'Border draws on'],
  ['E', 'Tick or icon cell fills'],
];

function Cell({ bs, bh }: { bs: string; bh: string }) {
  return (
    <div className="bb-cell" data-bs={bs} data-bh={bh}>
      {(['frozen', true] as const).map((h) => (
        <div className="bb-state" key={String(h)}>
          <span className="s2-label">{h === 'frozen' ? '60 posto' : 'Kraj'}</span>
          <Btn href="#" kind="primary" hover={h}>
            {hero.quote.label}
          </Btn>
          <Btn href="#" kind="secondary" icon="phone" hover={h}>
            {hero.sales.label} <span className="num">{hero.sales.number}</span>
          </Btn>
        </div>
      ))}
    </div>
  );
}

function Table({ dark }: { dark?: boolean }) {
  return (
    <section className={`bb-table${dark ? ' btn-ground-dark' : ''}`} data-ink={dark ? 'dark' : undefined} aria-label={dark ? 'Tamna podloga' : 'Bela podloga'}>
      <h2 className="bb-title">{dark ? 'Tamna podloga' : 'Bela podloga'}</h2>
      <div className="bb-grid">
        <div className="bb-row">
          <span />
          {HOVERS.map(([h, n]) => (
            <p className="bb-colhead" key={h}>
              <b>{h}</b>
              {n}
            </p>
          ))}
        </div>
        {STRUCTURES.map(([s, sn]) => (
          <div className="bb-row" key={s}>
            <p className="bb-rowhead">
              <b>{s}</b>
              {sn}
            </p>
            {HOVERS.map(([h]) => (
              <Cell bs={s} bh={h} key={h} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ButtonBoard() {
  useEffect(() => {
    document.documentElement.removeAttribute('data-bs');
    document.documentElement.removeAttribute('data-bh');
  }, []);
  return (
    <main className="s2 bb">
      <Table />
      <Table dark />
    </main>
  );
}
