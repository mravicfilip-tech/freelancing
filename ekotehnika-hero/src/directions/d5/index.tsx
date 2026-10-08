// Direction 5, Nacrt. The plan becomes the real thing. White lines on Linde red, drawn like an
// engineering sheet, then the lines give way to the real flat shaded scene.
// The 3D side lives in story.ts, the pinned furniture data in pins.ts, the look in d5.css.

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { StoryEngine } from '../../three/engine';
import { useStory, clamp01, smooth, windowed } from '../../story/useStory';
import { finale, hero, nav, pillars, SITE, trust } from '../../content';
import { Arrow, Phone } from '../../components/Icons';
import { LAST, STORY, mix, resetSolid } from './story';
import { dims, pins, type Win } from './pins';
import './d5.css';

const najam = pillars.find((p) => p.id === 'najam')!;

// Sheet names for the title block, one per chapter. Dummy copy.
const SHEETS = [
  'Pregled, tlocrt',
  'Trasa palete',
  'Presek, polica',
  'Prevoz, tlocrt',
  'Zone, servis i polovni',
  'Prostorni prikaz',
  'Isporuka, najam',
  'Izvedeno stanje',
];

// Names on the chapter rail. Dummy copy.
const RAIL = ['Uvod', 'Trasa', 'Presek', 'Prevoz', 'Zone', 'Prostor', 'Rampa', 'Cilj'];
const REST = [0, 1.22, 2.55, 3.45, 4.22, 5.22, 6.22, 7];

// Where each chapter's copy shows, from and to in story time.
const SPAN: [number, number][] = [
  [-1, 0.45],
  [0.65, 1.45],
  [1.65, 2.75],
  [2.9, 3.55],
  [3.75, 4.55],
  [4.75, 5.3],
  [5.7, 6.3],
  [6.4, 99],
];

// Links in the drawing's nav. Delovi and O nama paths are dummy guesses on the live site.
const links: { label: string; href: string }[] = [
  { label: 'Novi', href: `${SITE}/viljuskari/` },
  { label: 'Polovni', href: pillars.find((p) => p.id === 'polovni')!.href },
  { label: 'Iznajmljivanje', href: najam.href },
  { label: 'Servis', href: pillars.find((p) => p.id === 'servis')!.href },
  { label: 'Delovi', href: `${SITE}/delovi/` },
  { label: 'O nama', href: `${SITE}/o-nama/` },
  { label: 'Kontakt', href: `${SITE}/kontakt/` },
].filter((l) => nav.includes(l.label));

const fmt = (n: number) => n.toFixed(1).replace('.', ',');
const win = (b: number, w: Win) => windowed(b, w[0], w[1], w[2] ?? 0.3, w[3] ?? 0.25);

function Quote({ label = hero.quote.label, href = hero.quote.href, cta = 'quote', big = false }: { label?: string; href?: string; cta?: string; big?: boolean }) {
  return (
    <a className={big ? 'btn btn-big' : 'btn'} href={href} data-cta={cta}>
      {label}
      <Arrow size={18} />
    </a>
  );
}

function Sales() {
  return (
    <a className="tel" href={hero.sales.tel} data-cta="call-sales">
      <Phone size={18} />
      <span>{hero.sales.label}</span>
      <b>{hero.sales.number}</b>
    </a>
  );
}

function Service() {
  return (
    <a className="tel tel-sm" href={hero.service.tel} data-cta="call-service">
      <span>{hero.service.label}</span>
      <b>{hero.service.number}</b>
    </a>
  );
}

export default function Direction5({ reduced }: { reduced: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const lnRefs = useRef<HTMLElement[][]>([]);
  const bgRefs = useRef<(HTMLElement | null)[]>([]);
  const pinRefs = useRef<Record<string, HTMLElement | null>>({});
  const leadRefs = useRef<Record<string, SVGGElement | null>>({});
  const dimRefs = useRef<Record<string, SVGGElement | null>>({});
  const railRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sheetRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLElement>(null);
  const coordRef = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLElement>(null);
  const memo = useRef({ sheet: -1, tone: '' });

  const onFrame = (b: number, e: StoryEngine) => {
    const root = rootRef.current;
    if (!root) return;
    const m = memo.current;

    const tone = mix.paper(b) > 0.5 ? 'paper' : 'draft';
    if (tone !== m.tone) {
      m.tone = tone;
      root.dataset.tone = tone;
    }

    // Chapter copy. Each line rises after the one before it, and the box ground fades as one.
    SPAN.forEach(([from, to], i) => {
      const el = panelRefs.current[i];
      if (!el) return;
      const all = windowed(b, from, to, 0.35, 0.25);
      el.style.visibility = all < 0.01 ? 'hidden' : 'visible';
      el.inert = all < 0.5;
      const bg = bgRefs.current[i];
      if (bg) bg.style.opacity = String(all);
      const out = 1 - smooth(clamp01((b - to) / 0.25));
      (lnRefs.current[i] ?? []).forEach((ln, k) => {
        const rise = smooth(clamp01((b - from - k * 0.05) / 0.28));
        const o = rise * out;
        ln.style.opacity = String(o);
        ln.style.transform = `translateY(${(1 - rise) * 26}px)`;
      });
    });

    // Pins and their leader lines.
    for (const pin of pins) {
      const el = pinRefs.current[pin.id];
      const lead = leadRefs.current[pin.id];
      if (!el) continue;
      const o = win(b, pin.win);
      const p = e.project(pin.at(e));
      const hidden = o < 0.02 || !p.visible;
      el.style.visibility = hidden ? 'hidden' : 'visible';
      if (lead) lead.style.display = hidden ? 'none' : 'inline';
      if (hidden) continue;
      el.style.opacity = String(o);
      const bx = p.x + pin.dx;
      const by = p.y + pin.dy;
      el.style.transform = `translate3d(${bx}px,${by}px,0)`;
      if (lead) {
        const ax = pin.kind === 'marker' ? bx : bx + (pin.fx ?? 0) * (pin.w ?? 0);
        const ay = pin.kind === 'marker' ? by : by + (pin.fy ?? 0) * (pin.h ?? 0);
        lead.style.opacity = String(o);
        const [ln, cross] = [lead.children[0], lead.children[1]] as SVGElement[];
        ln.setAttribute('x1', String(p.x));
        ln.setAttribute('y1', String(p.y));
        ln.setAttribute('x2', String(ax));
        ln.setAttribute('y2', String(ay));
        cross.setAttribute('transform', `translate(${p.x} ${p.y})`);
      }
    }

    // Dimension lines.
    for (const d of dims) {
      const g = dimRefs.current[d.id];
      if (!g) continue;
      const o = win(b, d.win);
      const pa = e.project(d.a);
      const pb = e.project(d.b);
      if (o < 0.02 || !pa.visible || !pb.visible) {
        g.style.display = 'none';
        continue;
      }
      g.style.display = 'inline';
      g.style.opacity = String(o);
      const pea = e.project(d.ea);
      const peb = e.project(d.eb);
      const k = g.children;
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const ext = (line: Element, from: { x: number; y: number }, to: { x: number; y: number }) => {
        const ex = to.x - from.x;
        const ey = to.y - from.y;
        const el = Math.hypot(ex, ey) || 1;
        line.setAttribute('x1', String(from.x + (ex / el) * 6));
        line.setAttribute('y1', String(from.y + (ey / el) * 6));
        line.setAttribute('x2', String(to.x + (ex / el) * 9));
        line.setAttribute('y2', String(to.y + (ey / el) * 9));
      };
      ext(k[0], pea, pa);
      ext(k[1], peb, pb);
      k[2].setAttribute('x1', String(pa.x));
      k[2].setAttribute('y1', String(pa.y));
      k[2].setAttribute('x2', String(pb.x));
      k[2].setAttribute('y2', String(pb.y));
      // slashes at both ends, 45 degrees to the line
      const sx = (ux - uy) * 7;
      const sy = (uy + ux) * 7;
      k[3].setAttribute('d', `M${pa.x - sx} ${pa.y - sy}L${pa.x + sx} ${pa.y + sy}M${pb.x - sx} ${pb.y - sy}L${pb.x + sx} ${pb.y + sy}`);
      let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (deg > 90) deg -= 180;
      if (deg < -90) deg += 180;
      k[4].setAttribute('transform', `translate(${(pa.x + pb.x) / 2} ${(pa.y + pb.y) / 2}) rotate(${deg})`);
    }

    // Title block, live position of the truck, and the rail.
    const sheet = Math.min(LAST, Math.max(0, Math.floor(b + 0.3)));
    if (sheet !== m.sheet) {
      m.sheet = sheet;
      if (sheetRef.current) sheetRef.current.textContent = String(sheet + 1).padStart(2, '0');
      if (nameRef.current) nameRef.current.textContent = SHEETS[sheet];
      railRefs.current.forEach((r, i) => r && (r.dataset.on = i === sheet ? '1' : '0'));
    }
    const tp = e.truck.group.position;
    if (coordRef.current) coordRef.current.textContent = `X ${fmt(tp.x)}  Z ${fmt(tp.z)}`;

    // The client count ticks up as the finale lands.
    if (countRef.current) {
      const n = Math.round(1000 * smooth(clamp01((b - 6.3) / 0.5)));
      countRef.current.textContent = n >= 1000 ? '1.000+' : String(n);
    }
  };

  const { stageRef, canvasRef, failed, goTo } = useStory({ story: STORY, reduced, scrollPerBeat: 950, rests: REST, onFrame });

  useLayoutEffect(() => {
    lnRefs.current = panelRefs.current.map((p) => (p ? Array.from(p.querySelectorAll<HTMLElement>('[data-ln]')) : []));
  }, []);

  // The shared solid material belongs to every direction, so give it back as found.
  useEffect(() => resetSolid, []);

  const headWords = useMemo(() => hero.headline[0].split(' '), []);
  const claims = trust.filter((t) => t.id !== 'coverage');

  const setPanel = (i: number) => (el: HTMLElement | null) => {
    panelRefs.current[i] = el;
  };
  const setBg = (i: number) => (el: HTMLElement | null) => {
    bgRefs.current[i] = el;
  };

  return (
    <div className="d5" ref={rootRef} data-tone="draft">
      <div className="d5-stage" ref={stageRef}>
        <canvas className="d5-canvas" ref={canvasRef} />
        {failed && <p className="d5-fail">WebGL nije dostupan na ovom uređaju.</p>}

        {/* Sheet furniture, behind the copy. */}
        <svg className="d5-ov" aria-hidden="true">
          {pins.map((p) => (
            <g key={p.id} className="lead" ref={(el) => void (leadRefs.current[p.id] = el)}>
              <line />
              <path d="M-7 0H7M0 -7V7" />
            </g>
          ))}
          {dims.map((d) => (
            <g key={d.id} className="dim" ref={(el) => void (dimRefs.current[d.id] = el)}>
              <line />
              <line />
              <line />
              <path />
              <g>
                <rect x={-(d.label.length * 4.8 + 9)} y={-12} width={d.label.length * 9.6 + 18} height={24} />
                <text textAnchor="middle" dominantBaseline="central">
                  {d.label}
                </text>
              </g>
            </g>
          ))}
        </svg>

        <div className="d5-frame" aria-hidden="true">
          <i className="zr zr-t">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <b key={n}>{n}</b>
            ))}
          </i>
          <i className="zr zr-l">
            {['A', 'B', 'C', 'D', 'E'].map((n) => (
              <b key={n}>{n}</b>
            ))}
          </i>
          <i className="zr zr-r">
            {['A', 'B', 'C', 'D', 'E'].map((n) => (
              <b key={n}>{n}</b>
            ))}
          </i>
          <i className="tick tl" />
          <i className="tick tr" />
          <i className="tick bl" />
        </div>

        {/* Nav, a strip of the drawing. */}
        <header className="d5-nav">
          <a className="tile" href={SITE} aria-label="Ekotehnika, Linde Material Handling">
            <img src="/brand/linde-mh.png" alt="Linde Material Handling" width={72} height={43} />
            <span className="tile-sep" />
            <img src="/brand/ekotehnika.png" alt="Ekotehnika" width={132} height={36} />
          </a>
          <nav aria-label="Glavna navigacija">
            {links.map((l) => (
              <a key={l.label} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <Quote />
        </header>

        {/* 0 Intro */}
        <section className="cp cp0" ref={setPanel(0)} aria-label="Uvod">
          <p className="kick" data-ln>
            {hero.kicker}
          </p>
          <h1 className="head" data-ln>
            {headWords.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </h1>
          <div className="cp0-r">
            <p className="lede" data-ln>
              {hero.headline[1]}
            </p>
            <div className="conv" data-ln>
              <Quote big />
              <Sales />
            </div>
            <div data-ln>
              <Service />
            </div>
          </div>
        </section>

        {/* 1 Route */}
        <section className="cp cp1" ref={setPanel(1)} aria-label="Trasa">
          <p className="kick" data-ln>
            01 / Trasa palete
          </p>
          {/* dummy */}
          <h2 className="big" data-ln>
            Jedna paleta.
            <br />
            Od police do rampe.
          </h2>
        </section>

        {/* 2 Elevation */}
        <section className="cp cp2" ref={setPanel(2)} aria-label="Podizanje">
          <p className="kick" data-ln>
            02 / Presek A-A
          </p>
          <h2 className="big" data-ln>
            Podizanje.
          </h2>
          {/* dummy */}
          <p className="line" data-ln>
            Mirno i precizno, i sa najviše police.
          </p>
        </section>

        {/* 3 Plan, driving */}
        <section className="cp cp3 solid" ref={setPanel(3)} aria-label="Bezbednost">
          <div className="cp-bg" ref={setBg(3)} />
          <p className="kick" data-ln>
            03 / Tlocrt, prevoz
          </p>
          <h2 className="big" data-ln>
            Bezbednost.
          </h2>
          {/* dummy, the spot is white in this direction */}
          <p className="line" data-ln>
            Svetlosna tačka na podu upozorava pešake pre nego što viljuškar stigne.
          </p>
        </section>

        {/* 4 Zones */}
        <section className="cp cp4 solid" ref={setPanel(4)} aria-label="Servis i polovni">
          <div className="cp-bg" ref={setBg(4)} />
          <p className="kick" data-ln>
            04 / Zone
          </p>
          {/* dummy */}
          <h2 className="big" data-ln>
            Servis i polovni.
          </h2>
          <p className="line" data-ln>
            Dve zone na istom crtežu.
          </p>
        </section>

        {/* 5 The tilt */}
        <section className="cp cp5 solid" ref={setPanel(5)} aria-label="Prostor">
          <div className="cp-bg" ref={setBg(5)} />
          <p className="kick" data-ln>
            05 / Prostorni prikaz
          </p>
          {/* dummy */}
          <h2 className="big" data-ln>
            Crtež postaje prostor.
          </h2>
        </section>

        {/* 6 Materialise, Najam */}
        <section className="cp cp6 solid" ref={setPanel(6)} aria-label="Najam">
          <div className="cp-bg" ref={setBg(6)} />
          <p className="kick" data-ln>
            06 / {najam.name}
          </p>
          <h2 className="big" data-ln>
            {najam.name}.
          </h2>
          <p className="line" data-ln>
            {najam.line}
          </p>
          <div className="conv" data-ln>
            <Quote label={najam.cta} href={najam.href} cta="quote-rental" />
            <a className="more" href={najam.href}>
              {najam.more}
            </a>
          </div>
        </section>

        {/* 7 Finale */}
        <section className="cp cp7 solid" ref={setPanel(7)} aria-label="Zaključak">
          <div className="cp-bg" ref={setBg(7)} />
          <p className="kick" data-ln>
            07 / Izvedeno stanje
          </p>
          <h2 className="big" data-ln>
            {finale.title}
          </h2>
          <p className="line" data-ln>
            {finale.line}
          </p>
          <ul className="claims" data-ln>
            {claims.map((c) => (
              <li key={c.id}>
                {c.id === 'clients' ? (
                  <>
                    <b ref={countRef}>1.000+</b> klijenata
                  </>
                ) : (
                  c.text
                )}
              </li>
            ))}
          </ul>
          <div className="conv" data-ln>
            <Quote big cta="quote-finale" />
            <Sales />
          </div>
        </section>

        {/* Pinned markers, notes and cards. */}
        {pins.map((p) => (
          <div
            key={p.id}
            className={`pin pin-${p.kind}${p.paper ? ' pin-paper' : ''}${p.flip ? ' pin-flip' : ''}`}
            ref={(el) => void (pinRefs.current[p.id] = el)}
            style={p.kind === 'note' || p.kind === 'card' ? { width: p.w, minHeight: p.h } : undefined}
          >
            {p.kind === 'marker' && (
              <>
                <span className="dot">{p.letter}</span>
                <span className="txt">
                  <b>{p.title}</b>
                  <i>{p.sub}</i>
                </span>
              </>
            )}
            {p.kind === 'note' && (
              <>
                <b>{p.title}</b>
                <i>{p.sub}</i>
              </>
            )}
            {p.kind === 'card' && (
              <>
                <span className="zl">{p.letter}</span>
                <b>{p.title}</b>
                <i>{p.sub}</i>
              </>
            )}
            {p.kind === 'axis' && <b>{p.title}</b>}
          </div>
        ))}

        {/* Title block, bottom right like a drawing. */}
        <aside className="tb" aria-label="Naslovni blok crteža">
          <div className="tb-1">
            <b>EKOTEHNIKA</b>
            <span>
              LIST <i ref={sheetRef}>01</i> / 08
            </span>
          </div>
          <div className="tb-2">
            <span className="k">NAZIV</span>
            <span ref={nameRef}>{SHEETS[0]}</span>
          </div>
          <div className="tb-3">
            <span className="k">CRTAO</span>
            <span>Ekotehnika</span>
            <span ref={coordRef} className="co">
              X 0,0 Z 0,0
            </span>
          </div>
          <div className="tb-4">
            <p>
              <b>1997</b>
              <span>radionica</span>
            </p>
            <p>
              <b>2000</b>
              <span>uvoz Linde</span>
            </p>
            <p>
              <b>2023</b>
              <span>dealer</span>
            </p>
          </div>
        </aside>

        {/* Chapter rail. */}
        <nav className="rail" aria-label="Poglavlja">
          {RAIL.map((name, i) => (
            <button key={name} type="button" data-on={i === 0 ? '1' : '0'} ref={(el) => void (railRefs.current[i] = el)} onClick={() => goTo(REST[i])}>
              <span className="rn">{name}</span>
              <span className="ri">{String(i).padStart(2, '0')}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
