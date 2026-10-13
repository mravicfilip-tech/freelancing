// The text of each hold beat, laid on the 12 column grid. Plain markup, the shell drives it from the story clock, see
// ui.tsx for the data attributes. Copy comes from ../copy.ts. Every block starts on a column line.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { automatizacija, kompanija, markers, najam, prodaja, servis } from '../copy';
import { Btn, Fill, Marker, SpecRow, TitleLines, between, type SpecFact } from './ui';
import { REVEAL } from './reveal';

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

// The cut out is fit inside the stage at 78 by 66 percent with object-fit contain, see .p-fig img in shell.css. The anchors in
// copy.ts are in the file's own pixels, so each one is mapped to the screen through the box the image really fills, from its
// natural size and the contain fit, and not from percent of the stage. Run on load and on every resize of the stage.
const FIT = { w: 0.78, h: 0.66 };
const CALLS = ['a', 'b', 'c'] as const;

function placeLeaders(stage: HTMLElement) {
  const s = stage.getBoundingClientRect();
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  stage.querySelectorAll<HTMLElement>('.p-fig').forEach((fig) => {
    const t = prodaja.tabs[Number(fig.dataset.i)];
    const [nw, nh] = t.size;
    const k = Math.min((W * FIT.w) / nw, (H * FIT.h) / nh);
    const ox = (W - nw * k) / 2;
    const oy = (H - nh * k) / 2;
    for (const key of CALLS) {
      const call = fig.querySelector<HTMLElement>(`.p-call-${key}`);
      const lead = fig.querySelector<HTMLElement>(`.p-lead-${key}`);
      const dot = fig.querySelector<HTMLElement>(`.p-dot-${key}`);
      if (!call || !lead || !dot) continue;
      // Every end sits on the middle of a whole pixel. The leader is a 1px box turned about its own middle line, so on a whole
      // pixel edge a straight down leader would straddle two columns and draw 2px wide and grey, heavier than the callout's 1px rule
      // beside it (Filip 2026-10-12, "lines dont appear same stroke").
      const mid = (v: number) => Math.round(v - 0.5) + 0.5;
      const x1 = mid(ox + t[key][0] * k);
      const y1 = mid(oy + t[key][1] * k);
      // Every leader leaves its callout's rule straight down or up, never at an angle (Filip 2026-10-12, "angle lines are weirdly
      // executed"). The range row runs across both cells, and its words sit in the cell on the side of the stage its point is on.
      if (key === 'a') {
        const split = fig.querySelector<HTMLElement>('.p-call-c')?.offsetLeft ?? W / 2;
        call.classList.toggle('is-right', x1 >= split);
      }
      const r = call.getBoundingClientRect();
      const x0 = x1;
      const y0 = mid(key === 'a' ? r.bottom - s.top - 1 : r.top - s.top);
      lead.style.setProperty('--x0', String(x0));
      lead.style.setProperty('--y0', String(y0));
      lead.style.setProperty('--x1', String(x1));
      lead.style.setProperty('--y1', String(y1));
      dot.style.left = `${x1}px`;
      dot.style.top = `${y1}px`;
    }
  });
}

export function C1Pane() {
  const c = kompanija.c1;
  const facts: SpecFact[] = c.facts.map((f, i) => ({ ...f, icon: C1_ICONS[i] }));
  return (
    <div className="s2-pane s2-c1">
      {/* the marker stays in its cell on the top rule like on every beat, the title and the lede sit in the empty band under the road */}
      <div className="blk stack" style={{ ...between(1, 3), top: 168 }}>
        <Marker m={markers.c1} order={0} />
      </div>
      <div className="blk stack lb" style={between(1, 3)}>
        <TitleLines lines={c.title} order={1} className="s2-title-s" />
        <Fill text={c.text} />
      </div>
      {/* the cell lines sit on the third and fourth vertical and on the right edge, the first two facts share the first cell */}
      <SpecRow
        className="blk at-bottom"
        facts={facts}
        spans={[1, 1, 1]}
        template={SPLIT('--x3', '--x4')}
        order={2}
        style={between(3, 5)}
      />
    </div>
  );
}

export function RPane() {
  const c = kompanija.r;
  return (
    <div className="s2-pane s2-r">
      <div className="blk stack" style={{ ...between(1, 3), top: 168 }}>
        <Marker m={markers.r} order={0} />
        <TitleLines lines={c.title} order={1} className="s2-title-s" />
        <Fill text={c.text} />
      </div>
      {/* the list sits on the bottom rule of the left column, each row has its solid icon like the spec rows */}
      <ul className="rlist blk at-bottom" data-rule="b" style={between(1, 3)}>
        {c.list.map((r, i) => (
          <li key={r.label} data-rule="t">
            <span className="ico" data-wipe={4 + i * 2} aria-hidden="true">
              {R_ICONS[i]}
            </span>
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
  );
}

// Prodaja, four tabs and one cut out. The loop in the shell steps the tabs with k until the visitor picks one.
export function PPane() {
  const c = prodaja;
  const [pick, setPick] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const choose = (i: number) => {
    setPick(i);
    if (root.current) setTab(root.current, i);
  };
  // the leader lines and the rings are placed from the fitted image, again whenever the stage or the fonts change
  useLayoutEffect(() => {
    const el = stage.current;
    if (el) placeLeaders(el);
  }, []);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const run = () => placeLeaders(el);
    const ro = new ResizeObserver(run);
    ro.observe(el);
    document.fonts?.ready.then(run);
    const settle = window.setTimeout(run, 800);
    return () => {
      ro.disconnect();
      window.clearTimeout(settle);
    };
  }, []);
  return (
    <div className="s2-pane s2-p" ref={root} data-tab={pick ?? 0} data-pick={pick ?? undefined}>
      <div className="blk stack" style={{ ...between(1, 3), top: 168 }}>
        <Marker m={markers.p} order={0} />
        <TitleLines lines={c.title} order={1} />
        <Fill text={c.text} />
      </div>
      {/* the tab list and its button sit at the bottom of the left column, the rules run from the first to the third vertical */}
      <div className="blk stack lb" style={between(1, 3)}>
        <div className="tabs" role="tablist" aria-label="Vrste viljuškara" aria-orientation="vertical" data-rule="t">
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
        <Btn href={c.cta.href} order={6} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <div className="p-stage" style={between(3, 5)} ref={stage}>
        {c.tabs.map((t, i) => (
          <figure className="p-fig" role="tabpanel" id={`p-panel-${i}`} aria-labelledby={`p-tab-${i}`} data-i={i} data-st={i === 0 ? 'on' : 'wait'} key={t.name}>
            <img src={t.img} alt={t.alt} loading="eager" decoding="async" />
            {/* a leader line from each callout's rule to a ringed point on the truck, placed by placeLeaders from the image pixels */}
            <div className="p-leads" aria-hidden="true">
              {CALLS.map((k) => (
                <i className={`p-lead p-lead-${k}`} key={`l${k}`} />
              ))}
              {CALLS.map((k) => (
                <i className={`p-dot p-dot-${k}`} key={`d${k}`} />
              ))}
            </div>
            <figcaption className="p-call p-call-a" data-rule="tb">
              <span className="lab">{c.callouts[0]}</span>
              <b>{t.range}</b>
            </figcaption>
            <div className="p-call p-call-b" data-rule="t">
              <span className="lab">{c.callouts[1]}</span>
              <b>{t.cap}</b>
            </div>
            <div className="p-call p-call-c" data-rule="t">
              <span className="lab">{c.callouts[2]}</span>
              <b>{t.model}</b>
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
      <div className="blk stack" style={{ ...between(1, 3), top: 168 }}>
        <Marker m={markers.s} order={0} />
        <TitleLines lines={c.title} order={1} />
        <Fill text={c.text} />
        <Btn href={c.cta.href} order={5} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <div className="dataline blk at-bottom" style={between(1, 3)} data-rule="tb">
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

// The icons of the spec rows, one per fact in order. N has a clock for 24 sata, a truck for delivery, a wrench for Održavanje and
// two overlapping squares for Zamena. AT has the clock, a pallet and a box. C1 has a calendar, a group and a certificate badge.
// All are solid, 20 by 20, in the ink colour, with sharp joins and no arrows. Holes, such as the hands of the clock, are cut
// with the even odd rule inside one path, shapes that touch are separate paths.
const ico = (d: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" fillRule="evenodd" focusable="false">
    {d}
  </svg>
);
const CLOCK = ico(<path d="M10 0a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM9 4h2v5.7l3.7 2.1-1 1.7L9 11Z" />);
const N_ICONS: ReactNode[] = [
  CLOCK,
  ico(<path d="M0 2h12.5v10.5H0ZM13.5 6h3.5L20 10v2.5h-6.5ZM2.25 17.25a2.75 2.75 0 1 0 5.5 0 2.75 2.75 0 1 0-5.5 0ZM12.25 17.25a2.75 2.75 0 1 0 5.5 0 2.75 2.75 0 1 0-5.5 0Z" />),
  ico(<path d="M4 0h4v5h4V0h4v8l-4.5 2.5V20h-3V10.5L4 8Z" transform="translate(10 10) rotate(45) scale(.88) translate(-10 -10)" />),
  ico(<path d="M0 0h12v6H6v6H0ZM8 8h12v12H8Z" />),
];

// AT, the clock for 24/7, a pallet and a box. The pallet is a deck, three blocks and a base board. The box has a lid seam and a grip.
const AT_ICONS: ReactNode[] = [
  CLOCK,
  ico(<path d="M0 2h20v4H0ZM0 6h3.5v8H0ZM8.25 6h3.5v8H8.25ZM16.5 6H20v8h-3.5ZM0 14h20v4H0Z" />),
  ico(<path d="M1 2h18v16H1ZM1 6h18v2H1ZM7.5 11h5v2h-5Z" />),
];

// Column template of a spec row whose first two cells share the stretch between two verticals and whose last cell takes the rest.
// The first cell takes 45 percent of the stretch and at least 150px, enough for a four digit figure with its 24px each side, and the
// 24px column gap is taken off each, so the cell line after the second lands on the second vertical.
const SPLIT = (a: string, b: string) => {
  const w = `(var(${b}) - var(${a}))`;
  const f = `max(150px, ${w} * 0.45)`;
  return `calc(${f} - 24px) calc(${w} - ${f} - 24px) 1fr`;
};

// C1, a calendar for the year, a group of three for the clients and a certificate badge for the partner. The badge is a rosette
// with a check cut out and two ribbon tails, never the Linde logo.
const C1_ICONS: ReactNode[] = [
  ico(
    <path d="M4 0h2v3H4ZM14 0h2v3h-2ZM1 3h18v16H1ZM4 8h3v3H4ZM8.5 8h3v3h-3ZM13 8h3v3h-3ZM4 13h3v3H4ZM8.5 13h3v3h-3Z" />,
  ),
  ico(
    <>
      <path d="M10 1.5a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4ZM6.5 18.5c0-4 1.5-7 3.5-7s3.5 3 3.5 7Z" />
      <path d="M3 5a2.3 2.3 0 1 0 0 4.6A2.3 2.3 0 0 0 3 5ZM0 17.5c0-3 1.3-5.5 3-5.5s3 2.5 3 5.5Z" />
      <path d="M17 5a2.3 2.3 0 1 0 0 4.6A2.3 2.3 0 0 0 17 5ZM14 17.5c0-3 1.3-5.5 3-5.5s3 2.5 3 5.5Z" />
    </>,
  ),
  ico(
    <>
      <path d="M10 0a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM6.2 7.8l1.4-1.4 1.8 1.8 3.4-3.4 1.4 1.4-4.8 4.8Z" />
      <path d="M5.5 13l-2 7 3.5-2 3 2V14.5ZM14.5 13l2 7-3.5-2-3 2V14.5Z" />
    </>,
  ),
];

// R, a factory for the service centre, a gear for the original parts and a mortarboard for the training. Solid, 20 by 20, like the
// spec row icons. The gear is a ring with a hole and eight teeth, the factory has a saw tooth roof, a chimney and three windows cut out.
const R_ICONS: ReactNode[] = [
  ico(<path d="M0 20V8l5 3V8l5 3V8l5 3V1h5v19ZM3 14h3v3H3ZM8.5 14h3v3h-3ZM14 14h3v3h-3Z" />),
  ico(
    <>
      <path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM10 7.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path d="M8.25 0h3.5v4h-3.5Z" transform={`rotate(${a} 10 10)`} key={a} />
      ))}
    </>,
  ),
  ico(
    <>
      <path d="M10 2 0 7l10 5 10-5Z" />
      <path d="M4 11.2v3.8c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3Z" />
      <path d="M18 9.5h1.6V15H18Z" />
    </>,
  ),
];

export function NPane() {
  const c = najam;
  const facts: SpecFact[] = c.facts.map((f, i) => ({ ...f, icon: N_ICONS[i] }));
  return (
    <div className="s2-pane s2-n">
      <div className="blk stack" style={{ ...between(1, 3), top: 168 }}>
        <Marker m={markers.n} order={0} />
        <TitleLines lines={c.title} order={1} className="s2-title-s" reveal={REVEAL} />
      </div>
      <div className="blk stack n-side" style={{ ...between(3, 5), top: 220 }}>
        <Fill text={c.text} reveal={REVEAL} />
        <Btn href={c.cta.href} order={3} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      <SpecRow className="blk n-row" facts={facts} spans={[3, 3, 3, 3]} order={3} style={between(1, 5)} />
    </div>
  );
}

// Three equal boxes, each starting on its own vertical, the first on the first, the second on the second and the third on the third.
// A cell's own left line is its start, so the first two columns are a pitch less the 24px gap and the last takes the rest.
const THIRDS = 'calc(var(--x2) - var(--x1) - 24px) calc(var(--x3) - var(--x2) - 24px) 1fr';

export function ATPane() {
  const c = automatizacija;
  const facts: SpecFact[] = c.facts.map((f, i) => ({ ...f, icon: AT_ICONS[i] }));
  return (
    <div className="s2-pane s2-at">
      <div className="blk stack" style={{ ...between(1, 3), top: 168 }}>
        <Marker m={markers.at} order={0} />
        <TitleLines lines={c.title} order={1} />
        <Fill text={c.text} />
        <Btn href={c.cta.href} order={4} cta="quote">
          {c.cta.label}
        </Btn>
      </div>
      {/* the facts sit on the bottom rule, three equal boxes from the first vertical to the fourth */}
      <SpecRow className="blk at-bottom" facts={facts} spans={[1, 1, 1]} template={THIRDS} order={6} style={between(1, 4)} />
    </div>
  );
}
