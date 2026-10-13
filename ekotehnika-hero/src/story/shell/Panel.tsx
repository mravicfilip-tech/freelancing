// The left panel for the three UI themes. The copy is BEATS[beat].panel(k) from the board, the blocks
// (24 h ring, seven steps, warranty, model card) are drawn here per theme from the same numbers. The
// parts that follow k change their style every frame and never re-mount, the lines lift out and rise in
// only when the beat changes.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { BEATS } from '../../board/beats';
import { PalletTruckSide } from '../../board/vehicles';
import { hero } from '../../content';
import { SERVICES, TIMELINE } from '../timeline';
import { Ico } from './icons';
import type { UiTheme } from './StoryShell';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const L = (i: number) => ({ '--i': i }) as CSSProperties;
const SERVICE_ICON: Record<string, string> = { najam: 'Najam', polovni: 'Polovni', novi: 'Novi', servis: 'Servis' };

// Dots that fill with k. Dot i is lit by clamp(lit - i), so the dot being reached glows up smoothly.
function Dots({ n, lit, cols, label }: { n: number; lit: number; cols?: number; label: string }) {
  return (
    <div className="dots" role="img" aria-label={label} style={cols ? ({ '--cols': cols } as CSSProperties) : undefined}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ '--a': clamp(lit - i) } as CSSProperties} />
      ))}
    </div>
  );
}

function Ring({ k }: { k: number }) {
  const r = 29;
  const c = 2 * Math.PI * r;
  return (
    <svg className="bk-ring" viewBox="0 0 72 72" width={72} height={72} role="img" aria-label={`${Math.round(k * 24)} od 24 sata`} focusable="false">
      <circle className="rg-track" cx={36} cy={36} r={r} fill="none" strokeWidth={6} />
      <circle className="rg-fill" cx={36} cy={36} r={r} fill="none" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${c * k} ${c}`} transform="rotate(-90 36 36)" />
      <path className="rg-hand" d="M36 22 V37 L45 43" fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A big light number with a small unit after a slash, 24 / h.
function BigNum({ num, unit, slash = true }: { num: string; unit: string; slash?: boolean }) {
  return (
    <div className="bk-num">
      <b>{num}</b>
      <span>
        {slash && <i>/ </i>}
        {unit}
      </span>
    </div>
  );
}

const FIGS: [string, string][] = [
  ['Nosivost', '1,5 t'],
  ['Podizanje', '115 mm'],
  ['Brzina', '4/4,5 km/h'],
  ['Radijus', '1.390 mm'],
];

function Block({ ui, id, k }: { ui: UiTheme; id: string; k: number }) {
  if (id === 'N2') {
    return (
      <div className="bk bk-hours">
        {ui === 'A' ? <BigNum num="24" unit="h" /> : <BigNum num="24" unit="h" slash={false} />}
        {ui === 'A' && <Ring k={k} />}
        {ui === 'B' && <Dots n={24} lit={k * 24} cols={12} label={`${Math.round(k * 24)} od 24 sata`} />}
        {ui === 'C' && <Dots n={24} lit={k * 24} label={`${Math.round(k * 24)} od 24 sata`} />}
      </div>
    );
  }
  if (id === 'P2') {
    const done = Math.round(k * 7);
    return (
      <div className="bk bk-steps">
        {ui === 'A' && (
          <>
            <BigNum num={String(done)} unit="7" />
            <div className="seg7" role="img" aria-label={`${done} od 7`}>
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} className={i < done ? 'on' : undefined} />
              ))}
            </div>
          </>
        )}
        {ui !== 'A' && (
          <div className="steps7" role="img" aria-label={`${done} od 7`}>
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className={i < done ? 'on' : undefined}>
                {i + 1}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (id === 'P3') {
    return (
      <div className="bk bk-warranty">
        {ui === 'A' ? (
          <div className="bk-num">
            <b>6</b>
            <span>
              <i>/ </i>12 meseci
            </span>
          </div>
        ) : (
          <div className="bk-num">
            <b>6/12</b>
            <span>meseci</span>
          </div>
        )}
        {ui === 'B' && <Dots n={12} lit={6} cols={12} label="6 od 12 meseci" />}
        {ui === 'C' && <Dots n={12} lit={6} label="6 od 12 meseci" />}
      </div>
    );
  }
  if (id === 'V3') {
    return (
      <div className="bk bk-model">
        <div className="mc-top">
          <span className="mc-price">
            1.390<small> €</small>
          </span>
          <svg className="mc-truck" viewBox="-60 -150 240 160" width={176} height={117} aria-hidden="true" focusable="false">
            <PalletTruckSide load={false} lift={0} />
          </svg>
        </div>
        <dl className="mc-figs">
          {FIGS.map(([l, v]) => (
            <div key={l}>
              <dt>{l}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  return null;
}

// Theme B shows the opening and closing facts as a row of round icon stats with captions.
const STAT_ICONS: Record<string, string[]> = {
  U1: ['Novi', 'Najam', 'Servis', 'since'],
  K1: ['since', 'people', 'Polovni'],
};

const hrefFor = (idx: number) => {
  const s = TIMELINE[idx].service;
  return s ? SERVICES.find((x) => x.id === s)!.href : hero.quote.href;
};

type BodyProps = { ui: UiTheme; idx: number; k: number; level?: 1 | 2; out?: boolean };

export function PanelBody({ ui, idx, k, level = 1, out = false }: BodyProps) {
  const beat = BEATS[idx];
  const spec = beat.panel(k);
  const service = TIMELINE[idx].service;
  const title = spec.title.join(' ');
  const size = title.length > 50 ? 'tl-xl' : title.length > 40 ? 'tl-l' : '';
  const Head = level === 1 ? 'h1' : 'h2';
  const stats = ui === 'B' ? STAT_ICONS[beat.id] : undefined;
  let n = 0;
  const nb = spec.bullets?.length ?? 0;
  return (
    <div className={out ? 'pn-body pn-out' : 'pn-body'} aria-hidden={out ? true : undefined}>
      <div className="pn-head ln" style={L(n++)}>
        <p className="pn-kick">{spec.kick}</p>
        {ui === 'A' && (
          <span className="pn-badge" aria-hidden="true">
            <Ico name={service ? SERVICE_ICON[service] : 'Početna'} size={20} />
          </span>
        )}
      </div>
      <Head className={`pn-title ln ${size}`} style={L(n++)}>
        {title}
      </Head>
      {['N2', 'P2', 'P3', 'V3'].includes(beat.id) && (
        <div className="pn-block ln" style={L(n++)}>
          <Block ui={ui} id={beat.id} k={k} />
        </div>
      )}
      {stats && spec.bullets ? (
        <ul className="pn-stats" style={L(n)} data-n={spec.bullets.length}>
          {spec.bullets.map((b, i) => (
            <li key={b} className="ln" style={L(n + i)}>
              <span className="st-ico">
                <Ico name={stats[i]} size={22} />
              </span>
              <span className="st-cap">{b}</span>
            </li>
          ))}
        </ul>
      ) : (
        spec.bullets &&
        spec.bullets.length > 0 && (
          <ul className="pn-list">
            {spec.bullets.map((b, i) => (
              <li key={b} className={spec.bold === i ? 'ln on' : 'ln'} style={L(n + i)}>
                <span>{b}</span>
                {ui === 'B' && <Ico name="arrow" size={18} />}
              </li>
            ))}
          </ul>
        )
      )}
      {spec.chip &&
        (spec.chip.dark ? (
          <a className="pn-chip pn-chip-dark ln" style={L(n + nb)} href={hero.service.tel}>
            <i aria-hidden="true" />
            {spec.chip.text}
          </a>
        ) : (
          <p className="pn-chip ln" style={L(n + nb)}>
            {spec.chip.text}
          </p>
        ))}
    </div>
  );
}

export function PanelFoot({ ui, idx, out = false }: { ui: UiTheme; idx: number; out?: boolean }) {
  const spec = BEATS[idx].panel(0);
  return (
    <div className="pn-foot" aria-hidden={out ? true : undefined}>
      {spec.under && (
        <a className="pn-under ln" style={L(0)} href={hero.sales.tel}>
          {spec.under}
        </a>
      )}
      <a className="pn-cta ln" style={L(1)} href={hrefFor(idx)} data-cta="story">
        <span>{spec.cta}</span>
        {ui === 'C' ? (
          <i className="pn-go" aria-hidden="true">
            <Ico name="arrow" size={20} sw={2} />
          </i>
        ) : null}
      </a>
    </div>
  );
}

// The panel on the live stage. When the beat changes, the old lines lift out and the new ones rise in.
export function LivePanel({ ui, beat, k }: { ui: UiTheme; beat: number; k: number }) {
  const [leave, setLeave] = useState<{ beat: number; k: number; n: number } | null>(null);
  const last = useRef({ beat, k });
  const count = useRef(0);
  useLayoutEffect(() => {
    if (last.current.beat !== beat) {
      count.current += 1;
      setLeave({ beat: last.current.beat, k: last.current.k, n: count.current });
    }
  }, [beat]);
  useLayoutEffect(() => {
    last.current = { beat, k };
  });
  useEffect(() => {
    if (!leave) return;
    const t = window.setTimeout(() => setLeave(null), 460);
    return () => window.clearTimeout(t);
  }, [leave]);
  return (
    <section className={`pn pn-${ui}`} aria-label={BEATS[beat].panel(k).kick}>
      <div className="pn-stage">
        <div className="pn-in" key={beat}>
          <PanelBody ui={ui} idx={beat} k={k} />
        </div>
        {leave && (
          <div className="pn-gone" key={`o${leave.n}`}>
            <PanelBody ui={ui} idx={leave.beat} k={leave.k} out />
          </div>
        )}
      </div>
      <div className="pn-in" key={`f${beat}`}>
        <PanelFoot ui={ui} idx={beat} />
      </div>
    </section>
  );
}

// One still panel, for the reduced motion sections.
export function StillPanel({ ui, idx, level }: { ui: UiTheme; idx: number; level: 1 | 2 }): ReactNode {
  return (
    <section className={`pn pn-${ui} pn-static`} aria-label={BEATS[idx].panel(1).kick}>
      <div className="pn-stage">
        <PanelBody ui={ui} idx={idx} k={1} level={level} />
      </div>
      <PanelFoot ui={ui} idx={idx} />
    </section>
  );
}
