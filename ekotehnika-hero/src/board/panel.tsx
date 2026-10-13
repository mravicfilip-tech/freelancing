// The left panel and the service rail of the board frames. Geist only, sentence case. Red appears
// on the call to action alone, kickers, chips, rings and dots are ink and greys.
import type { CSSProperties, ReactNode } from 'react';
import { C } from '../tokens';
import { ServiceIcon } from '../variants/v2/art';
import { PalletTruckSide } from './vehicles';

export type PanelSpec = {
  kick: string;
  title: string[];
  block?: ReactNode;
  bullets?: string[];
  bold?: number;
  chip?: { text: string; dark?: boolean };
  under?: string;
  cta: string;
  op?: number;
  dy?: number;
};

export function Panel({ spec }: { spec: PanelSpec }) {
  const op = spec.op ?? 1;
  const style: CSSProperties = { opacity: op, transform: `translateY(${spec.dy ?? 0}px)` };
  return (
    <section className="bd-panel" aria-label={spec.kick}>
      <div className="bd-panel-body" style={style}>
        <p className="bd-kick">{spec.kick}</p>
        <h1 className="bd-title">{spec.title.join(' ')}</h1>
        {spec.block && <div className="bd-block">{spec.block}</div>}
        {spec.bullets && spec.bullets.length > 0 && (
          <ul className="bd-bullets">
            {spec.bullets.map((b, i) => (
              <li key={b} className={spec.bold === i ? 'bd-on' : undefined}>
                {b}
              </li>
            ))}
          </ul>
        )}
        {spec.chip && (
          <p className={spec.chip.dark ? 'bd-chip bd-chip-dark' : 'bd-chip'}>
            {spec.chip.dark && <i aria-hidden="true" />}
            {spec.chip.text}
          </p>
        )}
        {spec.under && <p className="bd-under">{spec.under}</p>}
      </div>
      <a className="bd-cta" href="#" onClick={(e) => e.preventDefault()}>
        {spec.cta}
      </a>
    </section>
  );
}

const RAIL = [
  { name: 'Najam', id: 'najam' },
  { name: 'Polovni', id: 'polovni' },
  { name: 'Novi', id: 'novi' },
  { name: 'Servis', id: 'servis' },
];

export function Rail({ active, op = 1 }: { active: string; op?: number }) {
  return (
    <nav className="bd-rail" aria-label="Usluge" style={{ opacity: op }}>
      {RAIL.map((r) => (
        <span key={r.id} className={r.name === active ? 'bd-pill bd-pill-on' : 'bd-pill'}>
          <svg viewBox="0 0 44 44" width={22} height={22} aria-hidden="true" focusable="false">
            <ServiceIcon id={r.id} color="currentColor" />
          </svg>
          {r.name}
        </span>
      ))}
    </nav>
  );
}

// A big light number with a small unit, and optionally a ring that fills.
export function Big({ num, unit, ring }: { num: string; unit: string; ring?: number }) {
  const r = 29;
  const c = 2 * Math.PI * r;
  return (
    <div className="bd-big">
      <span className="bd-num">{num}</span>
      <span className="bd-unit">{unit}</span>
      {ring !== undefined && (
        <svg className="bd-ring" viewBox="0 0 72 72" width={72} height={72} aria-hidden="true" focusable="false">
          <circle cx={36} cy={36} r={r} fill="none" stroke={C.shadeGrey} strokeWidth={7} />
          <circle cx={36} cy={36} r={r} fill="none" stroke={C.ink} strokeWidth={7} strokeLinecap="round" strokeDasharray={`${c * ring} ${c}`} transform="rotate(-90 36 36)" />
          <path d="M36 22 V37 L45 43" fill="none" stroke={C.textGrey} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// Seven numbered renewal steps as dots, filled in step with the line.
export function Dots7({ done }: { done: number }) {
  return (
    <div className="bd-dots" role="img" aria-label={`${done} od 7`}>
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className={i < done ? 'on' : undefined}>
          {i + 1}
        </span>
      ))}
    </div>
  );
}

// The MT15 C model card, price, the drawing and the four real figures in a hairline split row.
export function ModelCard() {
  const figs = [
    ['Nosivost', '1,5 t'],
    ['Podizanje', '115 mm'],
    ['Brzina', '4/4,5 km/h'],
    ['Radijus', '1.390 mm'],
  ];
  return (
    <div className="bd-model">
      <div className="bd-model-top">
        <span className="bd-price">
          1.390<small> €</small>
        </span>
        <svg viewBox="-60 -150 240 160" width={168} height={112} aria-hidden="true" focusable="false">
          <PalletTruckSide load={false} lift={0} />
        </svg>
      </div>
      <dl className="bd-figs">
        {figs.map(([l, v]) => (
          <div key={l}>
            <dt>{l}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
