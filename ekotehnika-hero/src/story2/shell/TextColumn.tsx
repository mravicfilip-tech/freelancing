// The phone pathway of ?m=3, see preview.ts MSCROLL and briefs/mobile/round3.md. Mounted by StoryShell only for that pathway.
// On a tall screen the words of every section stand as one column under the scene, from half the stage height to the bar, and the column
// scrolls natively like a page. The block whose top passes a third of the way down the column is the one being read, and the scene glides
// to its stop. A wide screen draws nothing of it, see textcolumn.css.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { SceneProps } from '../clock';
import { frame, hero2, automatizacija, kompanija, markers, najam, prodaja, proizvodi, servis, servisMap, type Fact, type Marker as MarkerData } from '../copy';
import { NAJAM_TERMS, SERVIS_MAP, TIMELINE } from '../timeline';
import { glideTo, leaveStory, storyStops } from '../../scroll/useScrollStory';
import { BtnInner } from './ui';
import './textcolumn.css';

const span = (id: string) => TIMELINE.find((b) => b.id === id)!;

// The stop of each block, found among the story's anchors (storyStops) by the beat it belongs to. Each is the first anchor inside its span,
// past its start, which is where the words of that section have arrived. The hero is the top. A block with no anchor in its span keeps the one before it.
const SPANS: ([number, number] | null)[] = [
  null, // hero2, the top of the story
  [span('C1').start, span('C1').end],
  [span('R').start, span('R').end],
  [span('P').start, span('P').end],
  [span('S').start, SERVIS_MAP.start],
  [SERVIS_MAP.start, span('L').end],
  [span('N').start, NAJAM_TERMS.start],
  [NAJAM_TERMS.start, span('N').end],
  [span('AT').start, span('AT').end],
];

function stopOf(i: number, anchors: number[]): number | undefined {
  const s = SPANS[i];
  if (!s) return anchors[0];
  return anchors.find((a) => a > s[0] + 1 && a < s[1]);
}

// The figure as the count leaves it, the number and then its suffix, '24' and ' sata'. A figure that already ends in its suffix is as it stands.
const shown = (f: Fact) => (f.suffix && !f.figure.endsWith(f.suffix) ? f.figure + f.suffix : f.figure);

const Mk = ({ m }: { m: MarkerData }) => (
  <p className="tc-mk">
    <span>{m.name}</span>
    <span className="tc-mk-n">
      {m.n}/{frame.total}
    </span>
  </p>
);

const Title = ({ lines }: { lines: string[] }) => (
  <h2 className="tc-title">
    {lines.map((l) => (
      <span key={l}>{l}</span>
    ))}
  </h2>
);

const Cta = ({ href, children, kind = 'primary' }: { href: string; children: ReactNode; kind?: 'primary' | 'secondary' }) => (
  <a className={`btn btn-${kind} tc-btn`} href={href} data-cta="quote">
    <BtnInner>{children}</BtnInner>
  </a>
);

// A fact row, the figure at the left and its label at the right. A row with an href is one link.
const Row = ({ figure, label, href, small, external }: { figure: string; label: string; href?: string; small?: boolean; external?: boolean }) => {
  const body = (
    <>
      <b className={`tc-fig${small ? ' tc-fig-s' : ''}`}>{figure}</b>
      <span className="tc-lab">{label}</span>
    </>
  );
  return href ? (
    <a className="tc-row" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : { 'data-cta': 'call-service' })}>
      {body}
    </a>
  ) : (
    <div className="tc-row">{body}</div>
  );
};

export function TextColumn(_props: SceneProps) {
  const col = useRef<HTMLDivElement>(null);
  const cur = useRef(0);
  const [pick, setPick] = useState(0);

  const sync = useCallback(() => {
    const el = col.current;
    if (!el || el.offsetParent === null) return;
    const blocks = el.querySelectorAll<HTMLElement>('[data-block]');
    const r = el.getBoundingClientRect();
    const line = r.top + el.clientHeight / 3;
    let at = 0;
    blocks.forEach((b, i) => {
      if (b.getBoundingClientRect().top <= line + 0.5) at = i;
    });
    if (at === cur.current) return;
    cur.current = at;
    // the last block leaves the story and has no stop of its own
    const anchors = storyStops();
    if (anchors.length < 3) return;
    let to: number | undefined;
    for (let i = Math.min(at, SPANS.length - 1); i >= 0 && to === undefined; i--) to = stopOf(i, anchors);
    if (to !== undefined) glideTo(to);
  }, []);

  useEffect(() => {
    const el = col.current;
    if (!el) return;
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sync();
      });
    };
    el.addEventListener('scroll', on, { passive: true });
    return () => {
      el.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, [sync]);

  const t = prodaja.tabs[pick];
  const c1 = kompanija.c1;
  const r = kompanija.r;
  return (
    <div className="tc" ref={col} data-lenis-prevent role="region" aria-label="Tekst priče" tabIndex={-1}>
      <section className="tc-b" data-block="hero">
        <h2 className="tc-title tc-title-l">
          <span>{hero2.title}</span>
        </h2>
        <p className="tc-lede">{hero2.lede}</p>
        <Cta href={hero2.quote.href} kind="secondary">
          {hero2.quote.label}
        </Cta>
      </section>

      <section className="tc-b" data-block="c1">
        <Mk m={markers.c1} />
        <Title lines={c1.title} />
        <p className="tc-lede">{c1.text}</p>
        <div className="tc-rows">
          {c1.facts.map((f) => (
            <Row key={f.figure} figure={f.figure} label={f.label} />
          ))}
        </div>
      </section>

      <section className="tc-b" data-block="r">
        <Mk m={markers.r} />
        <Title lines={r.title} />
        <p className="tc-lede">{r.text}</p>
        <div className="tc-rows">
          {r.list.map((x) => (
            <div className="tc-item" key={x.label}>
              <b>{x.label}</b>
              <span>{x.line}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tc-b" data-block="p">
        <Mk m={markers.p} />
        <Title lines={prodaja.title} />
        <p className="tc-lede">{prodaja.text}</p>
        <Cta href={prodaja.cta.href}>{prodaja.cta.label}</Cta>
        <div className="tc-rows tc-tabs" role="tablist" aria-label="Vrste viljuškara">
          {prodaja.tabs.map((x, i) => (
            <button
              type="button"
              role="tab"
              className="tc-tab"
              aria-selected={i === pick}
              aria-controls="tc-panel"
              key={x.name}
              onClick={() => setPick(i)}
            >
              <span className="tc-tab-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="tc-tab-name">{x.name}</span>
              <span className="tc-tab-range">{x.range.replace('Linde ', '')}</span>
            </button>
          ))}
        </div>
        <figure className="tc-fig-img" id="tc-panel" role="tabpanel">
          <img key={t.img} src={t.img} alt={t.alt} width={t.size[0]} height={t.size[1]} decoding="async" />
        </figure>
        <div className="tc-rows">
          <Row figure={t.range} label={prodaja.callouts[0]} />
          <Row figure={t.cap} label={prodaja.callouts[1]} />
          <Row figure={t.model} label={prodaja.callouts[2]} />
        </div>
      </section>

      <section className="tc-b" data-block="s">
        <Mk m={markers.s} />
        <Title lines={servis.title} />
        <p className="tc-lede">{servis.text}</p>
        <Cta href={servis.cta.href}>{servis.cta.label}</Cta>
        <div className="tc-rows">
          <Row figure={servis.giant} label={servis.giantLabel} />
          <Row figure={servis.dataNumber} label={servis.dataLabel} href={servis.dataTel} small />
        </div>
      </section>

      <section className="tc-b" data-block="sm">
        <Mk m={markers.s} />
        <Title lines={servisMap.title} />
        <p className="tc-lede">{servisMap.text}</p>
        <Cta href={servisMap.cta.href}>{servisMap.cta.label}</Cta>
        {servisMap.bases.map((b) => (
          <div className="tc-base" key={b.id}>
            <b className="tc-base-name">{b.label}</b>
            <span className="tc-base-line">{b.line}</span>
            <div className="tc-rows">
              <a className="tc-row tc-adr" href={b.maps} target="_blank" rel="noopener noreferrer" aria-label={`${b.address}, otvori u Google mapama`} data-cta="maps">
                {b.address}
              </a>
              <Row figure={b.phone.number} label={b.phone.label} href={b.phone.tel} small />
            </div>
          </div>
        ))}
      </section>

      <section className="tc-b" data-block="n">
        <Mk m={markers.n} />
        <Title lines={najam.title} />
        <p className="tc-lede">{najam.text}</p>
        <Cta href={najam.cta.href}>{najam.cta.label}</Cta>
        <div className="tc-rows">
          {najam.facts.map((f) => (
            <Row key={f.figure} figure={shown(f)} label={f.label} />
          ))}
        </div>
      </section>

      <section className="tc-b" data-block="nt">
        <Mk m={markers.n} />
        <Title lines={najam.terms.title} />
        <p className="tc-lede">{najam.terms.text}</p>
        <div className="tc-rows">
          {najam.terms.cells.map((f) => (
            <Row key={f.figure} figure={f.figure} label={f.label} />
          ))}
        </div>
      </section>

      <section className="tc-b" data-block="at">
        <Mk m={markers.at} />
        <Title lines={automatizacija.title} />
        <p className="tc-lede">{automatizacija.text}</p>
        <Cta href={automatizacija.cta.href}>{automatizacija.cta.label}</Cta>
        <div className="tc-rows">
          {automatizacija.facts.map((f) => (
            <Row key={f.figure} figure={f.figure} label={f.label} />
          ))}
        </div>
      </section>

      <section className="tc-b tc-last" data-block="end">
        <p className="tc-mk">
          <span>{proizvodi.label}</span>
        </p>
        <Title lines={proizvodi.title} />
        <p className="tc-lede">{proizvodi.lede}</p>
        <button type="button" className="btn btn-primary tc-btn" onClick={() => leaveStory()}>
          <BtnInner>{proizvodi.cta.label}</BtnInner>
        </button>
      </section>
    </div>
  );
}
