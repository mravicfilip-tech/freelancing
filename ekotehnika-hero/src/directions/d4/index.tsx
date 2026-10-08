import { useRef } from 'react';
import * as THREE from 'three';
import './d4.css';
import { hero, pillars, SITE, trust } from '../../content';
import { Arrow, Phone } from '../../components/Icons';
import { clamp01, show, useStory, windowed } from '../../story/useStory';
import type { StoryEngine } from '../../three/engine';
import { CALLOUTS, COPY, INDEX_NAMES, type Anchor } from './data';
import { LAST, REST, story } from './scene';

const pillar = (id: string) => pillars.find((p) => p.id === id)!;
const NAV = [
  { label: 'Novi', href: pillar('novi').href },
  { label: 'Polovni', href: pillar('polovni').href },
  { label: 'Iznajmljivanje', href: pillar('najam').href },
  { label: 'Servis', href: pillar('servis').href },
  { label: 'Kontakt', href: hero.quote.href },
];

const REST_POINTS = Array.from({ length: LAST + 1 }, (_, i) => i + REST);
REST_POINTS[0] = 0;
REST_POINTS[LAST] = LAST;

const tmp = new THREE.Vector3();

function anchorObject(engine: StoryEngine, a: Anchor): THREE.Object3D {
  const t = engine.truck;
  switch (a) {
    case 'w0':
      return t.wheels[0].g;
    case 'w1':
      return t.wheels[1].g;
    case 'w2':
      return t.wheels[2].g;
    case 'w3':
      return t.wheels[3].g;
    case 'spot':
      return t.spot;
    default:
      return t.parts[a];
  }
}

function QuoteButton({ id }: { id?: string }) {
  return (
    <a className="d4-quote" href={hero.quote.href} data-cta="quote" id={id}>
      {hero.quote.label}
      <Arrow size={18} />
    </a>
  );
}

function SalesPhone() {
  return (
    <a className="d4-phone" href={hero.sales.tel} data-cta="call-sales">
      <span className="d4-phone-ico">
        <Phone size={18} />
      </span>
      <span>
        <span className="d4-phone-label">{hero.sales.label}</span>
        <span className="d4-phone-num">{hero.sales.number}</span>
      </span>
    </a>
  );
}

export default function Direction4({ reduced }: { reduced: boolean }) {
  const chRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tagRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const heights = useRef<number[]>([]);
  const cueRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const idxRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastIdx = useRef(-1);

  const onFrame = (b: number, engine: StoryEngine) => {
    // copy blocks, one per chapter
    for (let i = 0; i <= LAST; i++) {
      const o = windowed(b, i - 0.45, i + 0.55, 0.4, 0.3);
      show(chRefs.current[i], o, (1 - o) * 22);
    }
    show(cueRef.current, windowed(b, -1, 0.1, 0.1, 0.3), 0);

    // callouts pinned to the parts
    CALLOUTS.forEach((c, k) => {
      const tag = tagRefs.current[k];
      const path = pathRefs.current[k];
      const dot = dotRefs.current[k];
      if (!tag || !path || !dot) return;
      const n = CALLOUTS.slice(0, k).filter((x) => x.ch === c.ch).length;
      const o = windowed(b, c.ch + 0.02 + n * 0.05, c.ch + 0.5, 0.18, 0.18);
      tag.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      path.style.visibility = tag.style.visibility;
      dot.style.visibility = tag.style.visibility;
      if (o < 0.01) return;
      const obj = anchorObject(engine, c.anchor);
      tmp.set(...c.at);
      obj.localToWorld(tmp);
      const p = engine.project(tmp);
      const W = 208;
      let h = heights.current[k];
      if (!h) h = heights.current[k] = tag.offsetHeight || 60;
      const lx = Math.min(1416 - W, Math.max(24, p.x + c.ox));
      const ly = p.y + c.oy;
      tag.style.transform = `translate(${lx}px, ${ly}px)`;
      tag.style.opacity = String(o);
      // the leader runs into the nearest edge of the label
      let d: string;
      if (p.x < lx - 6) d = `M${p.x} ${p.y} L${lx - 24} ${ly + 13} L${lx} ${ly + 13}`;
      else if (p.x > lx + W + 6) d = `M${p.x} ${p.y} L${lx + W + 24} ${ly + 13} L${lx + W} ${ly + 13}`;
      else d = p.y < ly ? `M${p.x} ${p.y} L${p.x} ${ly}` : `M${p.x} ${p.y} L${p.x} ${ly + h}`;
      path.setAttribute('d', d);
      path.style.strokeDashoffset = String(1 - o);
      dot.setAttribute('cx', String(p.x));
      dot.setAttribute('cy', String(p.y));
      dot.style.opacity = String(o);
    });

    // chapter index
    const active = b >= 0.7 && b < LAST - 0.45 ? Math.min(6, Math.max(1, Math.round(b - 0.05))) : 0;
    if (active !== lastIdx.current) {
      lastIdx.current = active;
      idxRefs.current.forEach((el, n) => {
        if (!el) return;
        el.dataset.state = n + 1 === active ? 'on' : n + 1 < active || b >= LAST - 0.45 ? 'done' : 'off';
        if (n + 1 === active) el.setAttribute('aria-current', 'step');
        else el.removeAttribute('aria-current');
      });
    }
    // the index fades out on the intro and finale frames, and stays reachable by keyboard
    if (indexRef.current) {
      const o = reduced ? 1 : windowed(b, 0.45, LAST - 0.6, 0.35, 0.3);
      indexRef.current.style.opacity = String(o);
      indexRef.current.style.pointerEvents = o < 0.3 ? 'none' : 'auto';
    }
    if (railRef.current) railRef.current.style.transform = `scaleY(${clamp01((b - 1) / 5)})`;
  };

  const { stageRef, canvasRef, failed, goTo } = useStory({
    story,
    reduced,
    scrollPerBeat: 900,
    rests: REST_POINTS,
    onFrame,
  });

  return (
    <div className={`d4${failed ? ' d4-failed' : ''}`} ref={stageRef}>
      <canvas ref={canvasRef} className="d4-canvas" aria-hidden="true" />

      <svg className="d4-leaders" aria-hidden="true">
        {CALLOUTS.map((_, k) => (
          <g key={k}>
            <path ref={(el) => {
              pathRefs.current[k] = el;
            }} pathLength={1} className="d4-leader" />
            <circle ref={(el) => {
              dotRefs.current[k] = el;
            }} r={4.5} className="d4-dot" />
          </g>
        ))}
      </svg>

      {CALLOUTS.map((c, k) => (
        <div key={k} className="d4-tag" ref={(el) => {
              tagRefs.current[k] = el;
            }} aria-hidden="true">
          <b>{c.title}</b>
          <span>{c.line}</span>
        </div>
      ))}

      <header className="d4-nav">
        <a className="d4-logos" href={SITE} aria-label="Ekotehnika, početna">
          <img src="/brand/linde-mh.png" width={74} height={44} alt="Linde Material Handling" />
          <i aria-hidden="true" />
          <img src="/brand/ekotehnika.png" width={110} height={30} alt="Ekotehnika" />
        </a>
        <nav className="d4-links" aria-label="Glavna navigacija">
          {NAV.map((n) => (
            <a key={n.label} href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>
        <QuoteButton />
      </header>

      <nav className="d4-index" aria-label="Poglavlja" ref={indexRef}>
        <span className="d4-rail" aria-hidden="true">
          <span ref={railRef} />
        </span>
        {INDEX_NAMES.map((name, n) => (
          <button
            key={name}
            type="button"
            data-state="off"
            ref={(el) => {
              idxRefs.current[n] = el;
            }}
            onClick={() => goTo(n + 1 + REST)}
          >
            <span className="d4-idx-n">{String(n + 1).padStart(2, '0')}</span>
            <span className="d4-idx-t">{name}</span>
          </button>
        ))}
      </nav>

      <div className="d4-copy">
        <div className="d4-ch d4-ch0" ref={(el) => {
              chRefs.current[0] = el;
            }}>
          <p className="d4-kick">{hero.kicker}</p>
          <h1 className="d4-h1">
            <em>Linde</em>
            <em>viljuškari.</em>
          </h1>
          <p className="d4-lead">{hero.headline[1]}</p>
          <p className="d4-body">{hero.sub}</p>
          <div className="d4-cta">
            <QuoteButton />
            <SalesPhone />
          </div>
        </div>

        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div className="d4-ch" key={i} ref={(el) => {
              chRefs.current[i] = el;
            }}>
            <span className="d4-num" aria-hidden="true">
              {String(i).padStart(2, '0')}
            </span>
            <p className="d4-kick">{COPY[i].kicker}</p>
            <h2 className="d4-state">
              <em>{COPY[i].statement}</em>
            </h2>
            <p className="d4-body">{COPY[i].body}</p>
            {i === 5 && (
              <a className="d4-link" href={hero.quote.href}>
                Pitajte nas o bezbednosti
                <Arrow size={16} />
              </a>
            )}
            {i === 6 && (
              <>
                <div className="d4-cta d4-cta-tight">
                  <a className="d4-link d4-link-red" href={pillar('servis').href}>
                    {pillar('servis').cta}
                    <Arrow size={16} />
                  </a>
                  <a className="d4-link" href={hero.service.tel} data-cta="call-service">
                    {hero.service.label} {hero.service.number}
                  </a>
                </div>
                <ul className="d4-more">
                  {(['polovni', 'najam'] as const).map((id) => (
                    <li key={id}>
                      <b>{pillar(id).name}</b>
                      <span>{pillar(id).line}</span>
                      <a href={pillar(id).href}>
                        {pillar(id).more}
                        <Arrow size={15} />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}

        <div className="d4-ch d4-ch7" ref={(el) => {
              chRefs.current[7] = el;
            }}>
          <p className="d4-kick">{hero.kicker}</p>
          {/* dummy */}
          <h2 className="d4-h1 d4-h1-fin">
            <em>Sklopljen.</em>
            <em>Spreman za posao.</em>
          </h2>
          <ul className="d4-claims">
            {trust.slice(0, 3).map((t) => (
              <li key={t.id}>{t.text}</li>
            ))}
          </ul>
          <div className="d4-cta">
            <QuoteButton />
            <SalesPhone />
          </div>
        </div>
      </div>

      <div className="d4-cue" ref={cueRef} aria-hidden="true">
        <span />
        Skrolujte da rastavite viljuškar
      </div>
      {failed && <p className="d4-fail">3D prikaz nije dostupan u ovom pregledaču.</p>}
    </div>
  );
}
