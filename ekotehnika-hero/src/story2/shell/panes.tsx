// The text of each hold beat, laid on the 12 column grid. Plain markup, the shell drives it from the story clock, see
// ui.tsx for the data attributes. Copy comes from ../copy.ts. Every block starts on a column line.
import { useRef, useState } from 'react';
import { automatizacija, kompanija, markers, najam, prodaja, servis } from '../copy';
import { Btn, Fill, Marker, SpecRow, TitleLines, cols } from './ui';

// Show tab i on the Prodaja pane, for the loop that steps with k and for a click.
export function setTab(root: HTMLElement, i: number) {
  root.setAttribute('data-tab', String(i));
  root.querySelectorAll<HTMLElement>('[role="tab"]').forEach((t, j) => {
    t.setAttribute('aria-selected', String(j === i));
    t.tabIndex = j === i ? 0 : -1;
  });
}

export function C1Pane() {
  const c = kompanija.c1;
  return (
    <div className="s2-pane s2-c1">
      <div className="blk stack" style={{ ...cols(1, 6), top: 168 }}>
        <Marker m={markers.c1} order={0} />
        <TitleLines lines={c.title} order={1} className="s2-title-s" />
        <Fill text={c.text} />
      </div>
      <SpecRow className="blk at-bottom" facts={c.facts} spans={[2, 2, 2]} order={2} style={cols(7, 12)} />
    </div>
  );
}

export function RPane() {
  const c = kompanija.r;
  return (
    <div className="s2-pane s2-r">
      <div className="blk stack" style={{ ...cols(1, 4), top: 168 }}>
        <Marker m={markers.r} order={0} />
        <TitleLines lines={c.title} order={1} className="s2-title-s" />
        <Fill text={c.text} />
        <ul className="rlist" data-mask>
          {c.list.map((r, i) => (
            <li key={r.label}>
              <b className="lab" data-wipe={5 + i * 2}>
                {r.label}
              </b>
              <span className="line" data-wipe={6 + i * 2}>
                {r.line}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Prodaja, four tabs and one cut out. The loop in the shell steps the tabs with k until the visitor picks one.
export function PPane() {
  const c = prodaja;
  const [pick, setPick] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const choose = (i: number) => {
    setPick(i);
    if (root.current) setTab(root.current, i);
  };
  return (
    <div className="s2-pane s2-p" ref={root} data-tab={pick ?? 0} data-pick={pick ?? undefined}>
      <div className="blk stack" style={{ ...cols(1, 6), top: 168 }}>
        <Marker m={markers.p} order={0} />
        <TitleLines lines={c.title} order={1} />
        <Fill text={c.text} />
        <div className="tabs" role="tablist" aria-label="Vrste viljuškara" aria-orientation="vertical" data-mask style={{ width: 'calc(4 * var(--cw) + 3 * 24px)' }}>
          {c.tabs.map((t, i) => (
            <button
              type="button"
              role="tab"
              className="tab"
              id={`p-tab-${i}`}
              aria-controls={`p-panel-${i}`}
              aria-selected={i === (pick ?? 0)}
              tabIndex={i === (pick ?? 0) ? 0 : -1}
              data-i={i}
              data-wipe={2 + i}
              key={t.name}
              onClick={() => choose(i)}
              onKeyDown={(e) => {
                const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
                if (!d) return;
                e.preventDefault();
                const n = (i + d + c.tabs.length) % c.tabs.length;
                choose(n);
                root.current?.querySelector<HTMLElement>(`[data-i="${n}"][role="tab"]`)?.focus();
              }}
            >
              <span className="tab-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="tab-name">{t.name}</span>
              <span className="tab-range">{t.range.replace('Linde ', '')}</span>
            </button>
          ))}
        </div>
        <Btn href={c.cta.href} kind="primary" order={5} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <div className="p-stage" style={cols(7, 12)}>
        {c.tabs.map((t, i) => (
          <figure className="p-fig" role="tabpanel" id={`p-panel-${i}`} aria-labelledby={`p-tab-${i}`} data-i={i} key={t.name}>
            <img src={t.img} alt={t.alt} loading="eager" decoding="async" />
            <svg className="p-leader" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={`34,12 ${t.a[0]},${t.a[1]}`} />
              <polyline points={`69.1,88 ${t.b[0]},${t.b[1]}`} />
            </svg>
            <i className="p-dot" style={{ left: `${t.a[0]}%`, top: `${t.a[1]}%` }} aria-hidden="true" />
            <i className="p-dot" style={{ left: `${t.b[0]}%`, top: `${t.b[1]}%` }} aria-hidden="true" />
            <figcaption className="p-call p-call-a" data-mask>
              <span className="lab">{c.callouts[0]}</span>
              <b>{t.range}</b>
            </figcaption>
            <div className="p-call p-call-b" data-mask>
              <span className="lab">{c.callouts[1]}</span>
              <b>{t.cap}</b>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function SPane() {
  const c = servis;
  return (
    <div className="s2-pane s2-s">
      <div className="s2-giant" aria-hidden="true" style={cols(5, 12)}>
        <b>{c.giant}</b>
        <span>{c.giantLabel}</span>
      </div>
      <div className="blk stack" style={{ ...cols(1, 4), top: 168 }}>
        <Marker m={markers.s} order={0} />
        <TitleLines lines={c.title} order={1} />
        <Fill text={c.text} />
        <Btn href={c.cta.href} kind="primary" order={5} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <div className="dataline blk at-bottom" style={cols(1, 4)} data-mask>
        <span className="lab" data-wipe={6}>
          {c.dataLabel}
        </span>
        <a className="num" href={c.dataTel} data-cta="call-service" data-wipe={7}>
          {c.dataNumber}
        </a>
      </div>
    </div>
  );
}

export function NPane() {
  const c = najam;
  return (
    <div className="s2-pane s2-n">
      <div className="blk stack" style={{ ...cols(1, 5), top: 168 }}>
        <Marker m={markers.n} order={0} />
        <TitleLines lines={c.title} order={1} className="s2-title-s" />
      </div>
      <div className="blk stack n-side" style={{ ...cols(7, 12), top: 220 }}>
        <Fill text={c.text} />
        <Btn href={c.cta.href} kind="primary" order={3} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <SpecRow className="blk n-row" facts={c.facts} spans={[3, 3, 3, 3]} order={3} style={cols(1, 12)} />
    </div>
  );
}

export function ATPane() {
  const c = automatizacija;
  return (
    <div className="s2-pane s2-at">
      <div className="blk stack" style={{ ...cols(1, 6), top: 168 }}>
        <Marker m={markers.at} order={0} />
        <TitleLines lines={c.title} order={1} />
        <Fill text={c.text} />
        <Btn href={c.cta.href} kind="primary" order={4} cta="quote">
          {c.cta.label}
        </Btn>
        <SpecRow className="at-row" facts={c.facts} spans={[2, 2, 2]} order={6} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
