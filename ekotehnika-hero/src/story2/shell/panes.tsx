// The text and tiles of each hold beat. Plain markup, the shell lays it out. Every element that rises in
// with its beat carries data-rise, in reading order. Copy comes from ../copy.ts.
import type { ReactNode } from 'react';
import { automatizacija, kompanija, najam, prodaja, servis, type Cta, type Tile } from '../copy';
import { TruckIcon } from './icons';

export const Kicker = ({ children }: { children: ReactNode }) => (
  <p className="s2-kicker" data-rise>
    <i className="s2-dot" aria-hidden="true" />
    {children}
  </p>
);

export const CtaLink = ({ cta, id }: { cta: Cta; id: string }) => (
  <a className="s2-cta" href={cta.href} data-cta={id} data-rise>
    {cta.label}
  </a>
);

function TileBox({ t, icon }: { t: Tile & { icon?: string }; icon?: boolean }) {
  const body = (
    <>
      {icon && t.icon ? <TruckIcon name={t.icon} size={64} /> : null}
      <b>{t.big}</b>
      <span>{t.small}</span>
    </>
  );
  return t.href ? (
    <a className="s2-tile" href={t.href} data-rise>
      {body}
    </a>
  ) : (
    <div className="s2-tile" data-rise>
      {body}
    </div>
  );
}

export function C1Pane() {
  const c = kompanija.c1;
  return (
    <div className="s2-pane s2-c1">
      <div className="s2-c1-head">
        <Kicker>{c.kicker}</Kicker>
        <h2 className="s2-title" data-rise>
          {c.title}
        </h2>
      </div>
      <p className="s2-text s2-c1-text" data-rise>
        {c.text}
      </p>
      <div className="s2-tiles s2-c1-tiles">
        {c.tiles.map((t) => (
          <TileBox key={t.big} t={t} />
        ))}
      </div>
    </div>
  );
}

export function RPane() {
  const c = kompanija.r;
  return (
    <div className="s2-pane s2-r">
      <Kicker>{c.kicker}</Kicker>
      <h2 className="s2-title" data-rise>
        {c.title}
      </h2>
      <p className="s2-text" data-rise>
        {c.text}
      </p>
      <div className="s2-tiles s2-r-tiles">
        {c.tiles.map((t) => (
          <TileBox key={t.big} t={t} />
        ))}
      </div>
    </div>
  );
}

export function PPane() {
  const c = prodaja;
  return (
    <div className="s2-pane s2-p">
      <Kicker>{c.kicker}</Kicker>
      <h2 className="s2-title" data-rise>
        {c.title}
      </h2>
      <div className="s2-p-block s2-card" data-rise>
        <div>
          <p className="s2-lead">{c.text}</p>
          <p className="s2-text">{c.detail}</p>
        </div>
        <a className="s2-cta" href={c.cta.href} data-cta="quote">
          {c.cta.label}
        </a>
      </div>
      <div className="s2-tiles s2-p-tiles">
        {c.tiles.map((t) => (
          <TileBox key={t.big} t={t} icon />
        ))}
      </div>
    </div>
  );
}

export function SPane() {
  const c = servis;
  return (
    <div className="s2-pane s2-s">
      <Kicker>{c.kicker}</Kicker>
      <h2 className="s2-title" data-rise>
        {c.title}
      </h2>
      <p className="s2-text" data-rise>
        {c.text}
      </p>
      <div className="s2-tiles s2-s-tiles">
        {c.tiles.map((t) => (
          <TileBox key={t.big} t={t} />
        ))}
      </div>
      <CtaLink cta={c.cta} id="quote" />
    </div>
  );
}

export function NPane() {
  const c = najam;
  return (
    <div className="s2-pane s2-n">
      <Kicker>{c.kicker}</Kicker>
      <h2 className="s2-title" data-rise>
        {c.title}
      </h2>
      <div className="s2-n-block s2-card" data-rise>
        <p className="s2-lead">{c.text}</p>
        <a className="s2-cta" href={c.cta.href} data-cta="quote">
          {c.cta.label}
        </a>
      </div>
      <div className="s2-tiles s2-n-tiles">
        {c.tiles.map((t) => (
          <TileBox key={t.big} t={t} />
        ))}
      </div>
    </div>
  );
}

export function ATPane() {
  const c = automatizacija;
  return (
    <div className="s2-pane s2-at">
      <h2 className="s2-at-word" data-rise>
        {c.word}
      </h2>
      <p className="s2-at-line" data-rise>
        {c.text}
      </p>
    </div>
  );
}
