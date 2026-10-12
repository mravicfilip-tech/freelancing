// The text of each hold beat, laid on the 12 column grid. Plain markup, the shell drives it from the story clock, see
// ui.tsx for the data attributes. Copy comes from ../copy.ts. Every block starts on a column line.
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { automatizacija, kompanija, markers, najam, prodaja, proizvodi, servis } from '../copy';
import { Btn, Fill, Marker, SpecRow, TitleLines, cols, type SpecFact } from './ui';

// Show tab i on the Prodaja pane, for the loop that steps with k and for a click. -1 shows no model yet. Each cut out
// is in one of three states, wait (off to the right, ready to come in), on, and gone (off to the left), see .p-fig in
// shell.css. The one that was on goes to gone, the new one is put back to wait and then on, so it always comes in from the right.
export function setTab(root: HTMLElement, i: number) {
  root.setAttribute('data-tab', String(i));
  root.querySelectorAll<HTMLElement>('[role="tab"]').forEach((t, j) => {
    t.setAttribute('aria-selected', String(j === i));
    t.tabIndex = j === Math.max(i, 0) ? 0 : -1;
  });
  root.querySelectorAll<HTMLElement>('.p-fig').forEach((f, j) => {
    const st = f.dataset.st;
    if (j === i) {
      if (st === 'on') return;
      f.dataset.st = 'wait';
      void f.offsetWidth;
      f.dataset.st = 'on';
    } else if (i < 0) f.dataset.st = 'wait';
    else if (st === 'on') f.dataset.st = 'gone';
  });
}

// The custom properties of a leader line, from its start to its dot, in percent of the stage.
const leader = (x0: number, y0: number, to: number[]) => ({ '--x0': x0, '--y0': y0, '--x1': to[0], '--y1': to[1] }) as CSSProperties;

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
        <ul className="rlist" data-rule="b">
          {c.list.map((r, i) => (
            <li key={r.label} data-rule="t">
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
        <div className="tabs" role="tablist" aria-label="Vrste viljuškara" aria-orientation="vertical" data-rule="t" style={{ width: 'calc(4 * var(--cw) + 3 * 24px)' }}>
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
              data-rule="b"
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
        <Btn href={c.cta.href} kind="secondary" order={5} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <div className="p-stage" style={cols(7, 12)}>
        {c.tabs.map((t, i) => (
          <figure className="p-fig" role="tabpanel" id={`p-panel-${i}`} aria-labelledby={`p-tab-${i}`} data-i={i} data-st={i === 0 ? 'on' : 'wait'} key={t.name}>
            <img src={t.img} alt={t.alt} loading="eager" decoding="async" />
            {/* the two leader lines run from the end of each callout rule to a dot on the truck, the numbers are percent of the stage */}
            <div className="p-leads" aria-hidden="true">
              <i className="p-lead p-lead-a" style={leader(34, 12, t.a)} />
              <i className="p-lead p-lead-b" style={leader(69.1, 88, t.b)} />
              <i className="p-dot p-dot-a" style={{ left: `${t.a[0]}%`, top: `${t.a[1]}%` }} />
              <i className="p-dot p-dot-b" style={{ left: `${t.b[0]}%`, top: `${t.b[1]}%` }} />
            </div>
            <figcaption className="p-call p-call-a" data-rule="tb">
              <span className="lab">{c.callouts[0]}</span>
              <b>{t.range}</b>
            </figcaption>
            <div className="p-call p-call-b" data-rule="t">
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
      <div className="blk stack" style={{ ...cols(1, 4), top: 168 }}>
        <Marker m={markers.s} order={0} />
        <TitleLines lines={c.title} order={1} />
        <Fill text={c.text} />
        <Btn href={c.cta.href} kind="secondary" order={5} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <div className="dataline blk at-bottom" style={cols(1, 4)} data-rule="tb">
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

// The four delivery photos of N as an overlapping collage in columns 1 to 6, from the line under the stat row to the bottom
// rule. Position and size are whole steps of one unit u, 24px at 1920 by 1080, so the offsets sit on the 24px step. The
// collage is 37.5 by 20 units. Listed bottom to top, the E20 EVO badge detail on top. depth is the parallax in px, the
// reveal and the parallax are driven by the shell, see data-rt in StoryShell.tsx.
const COLLAGE = [
  { photo: 2, x: 9, y: 1, w: 18, h: 16, depth: 6, pos: '50% 45%' },
  { photo: 1, x: 23, y: 0, w: 14, h: 8, depth: 18, pos: '50% 38%' },
  { photo: 3, x: 26, y: 6, w: 10, h: 14, depth: 12, pos: '50% 60%' },
  { photo: 0, x: 4, y: 10, w: 8, h: 9, depth: 24, pos: '50% 50%' },
];

// The four icons of the N row, one per fact in order, 24 sata a clock, delivery a truck, Održavanje a wrench, Zamena two squares
// that overlap. All are solid, 20 by 20, in the ink colour, with sharp joins and no arrows.
const ico = (d: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" fillRule="evenodd" focusable="false">
    {d}
  </svg>
);
const N_ICONS: ReactNode[] = [
  ico(<path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM9 4h2v5.7l3.7 2.1-1 1.7L9 11Z" />),
  ico(<path d="M0 2h12.5v10.5H0ZM13.5 6h3.5L20 10v2.5h-6.5ZM2.25 17.25a2.75 2.75 0 1 0 5.5 0 2.75 2.75 0 1 0-5.5 0ZM12.25 17.25a2.75 2.75 0 1 0 5.5 0 2.75 2.75 0 1 0-5.5 0Z" />),
  ico(<path d="M4 0h4v5h4V0h4v8l-4.5 2.5V20h-3V10.5L4 8Z" transform="translate(10 10) rotate(45) scale(.88) translate(-10 -10)" />),
  ico(<path d="M0 0h12v6H6v6H0ZM8 8h12v12H8Z" />),
];

export function NPane() {
  const c = najam;
  const facts: SpecFact[] = c.facts.map((f, i) => ({ ...f, icon: N_ICONS[i] }));
  return (
    <div className="s2-pane s2-n">
      <div className="blk stack" style={{ ...cols(1, 5), top: 168 }}>
        <Marker m={markers.n} order={0} />
        <TitleLines lines={c.title} order={1} className="s2-title-s" />
      </div>
      <div className="blk stack n-side" style={{ ...cols(7, 12), top: 220 }}>
        <Fill text={c.text} />
        <Btn href={c.cta.href} kind="secondary" order={3} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <SpecRow className="blk n-row" facts={facts} spans={[3, 3, 3, 3]} order={3} style={cols(1, 12)} />
      <div className="n-collage">
        {COLLAGE.map((p, i) => (
          <figure
            className="pw"
            data-rt={i}
            data-depth={p.depth}
            style={{ '--ox': p.x, '--oy': p.y, '--ow': p.w, '--oh': p.h } as CSSProperties}
            key={p.photo}
          >
            <img src={proizvodi.photos[p.photo].src} alt={proizvodi.photos[p.photo].alt} loading="eager" decoding="async" style={{ objectPosition: p.pos }} />
          </figure>
        ))}
      </div>
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
        <Btn href={c.cta.href} kind="secondary" order={4} cta="quote">
          {c.cta.label}
        </Btn>
        <SpecRow className="at-row" facts={c.facts} spans={[2, 2, 2]} order={6} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
