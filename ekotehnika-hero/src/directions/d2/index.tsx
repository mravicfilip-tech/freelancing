// Direction 2, Rendgen. A light cinematic hero that goes to ink for the x-ray chapters and back.
// Statements in Inter Tight 300 reveal word by word with story time, a floating pill nav sits on top,
// and a white panel with notched corners slides up over the scene at the end.

import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { useStory, clamp01, show, smooth } from '../../story/useStory';
import { setSolidOpacity } from '../../three/edges';
import { material } from '../../three/tone';
import { hero, nav, pillars } from '../../content';
import { Arrow, Phone, PillarIcon } from '../../components/Icons';
import { LAST, STORY, tracks, xray } from './scene';
import './d2.css';

type Copy = { label: string; text: string; sub?: string };

// Chapter copy. Lines marked dummy are placeholder copy for the prototype.
const COPY: Copy[] = [
  { label: hero.kicker, text: `${hero.headline[0]} ${hero.headline[1]}` },
  // dummy
  { label: 'Cela flota', text: 'Jedan partner za celu flotu.', sub: hero.sub },
  // dummy
  { label: 'Rendgen', text: 'Svaki viljuškar i svaka ruta, na jednom mestu.' },
  // dummy
  { label: 'Rute', text: 'Svaka ruta, od rampe do police.' },
  { label: 'Bezbednost', text: 'Crvena tačka na podu upozorava pešake pre nego što viljuškar stigne.' },
  { label: 'Servis', text: 'Redovno održavanje, hitne intervencije, ugovori o punom servisu.' },
];

// Rails in the chapter bar, with the story time each one jumps to.
const RAIL = ['Uvod', 'Flota', 'Rendgen', 'Rute', 'Bezbednost', 'Servis', 'Ponuda'];
const REST = (k: number) => (k === 0 ? 0 : k === LAST ? LAST : k + 0.22);
const RESTS = RAIL.map((_, k) => REST(k));

const OFFER = ['novi', 'najam', 'servis'] as const;
const links = [pillars[0], pillars[3], pillars[1], pillars[2]];
const navLabels = [nav[0], nav[1], nav[2], nav[3]];
// dummy tags
const TAGS = ['Viljuškar A', 'Viljuškar B', 'Viljuškar C', 'Pešak'];

const words = (s: string) => s.split(' ');

export default function Direction2({ reduced }: { reduced: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const intro = useRef({ v: reduced ? 1 : 0 });
  const lastB = useRef(0);
  const paintRef = useRef<(b: number, project?: (p: THREE.Vector3) => { x: number; y: number; visible: boolean }) => void>(() => {});

  const { stageRef, canvasRef, failed, goTo } = useStory({
    story: STORY,
    reduced,
    scrollPerBeat: 1000,
    rests: RESTS,
    onFrame: (b, engine) => {
      lastB.current = b;
      paintRef.current(b, (p) => engine.project(p));
    },
  });

  // Put the shared material back the way every other direction expects it.
  useEffect(() => () => setSolidOpacity(material, 1), []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
    const chapters = q('[data-ch]');
    const wordSets = chapters.map((c) => Array.from(c.querySelectorAll<HTMLElement>('.d2-w')));
    const fades = q('[data-late]');
    const panel = root.querySelector<HTMLElement>('.d2-panel');
    const panelItems = q('[data-panel-in]');
    const dots = q('[data-rail]');
    const count = root.querySelector<HTMLElement>('[data-count]');
    const name = root.querySelector<HTMLElement>('[data-name]');
    const tags = q('[data-tag]');
    let dark = -1;
    let active = -1;

    paintRef.current = (b, project) => {
      const x = xray(b);
      const isDark = x > 0.5 ? 1 : 0;
      if (isDark !== dark) {
        dark = isDark;
        root.dataset.dark = String(isDark);
      }

      chapters.forEach((el, k) => {
        // chapter 0 reveals on a clock, the rest follow story time
        const p = k === 0 ? Math.min(intro.current.v, 1) : clamp01((b - (k - 0.34)) / 0.44);
        const out = 1 - smooth(clamp01((b - (k + 0.34)) / 0.26));
        const inn = k === 0 ? 1 : smooth(clamp01((b - (k - 0.42)) / 0.16));
        const vis = inn * out;
        show(el, vis, reduced ? 0 : (1 - out) * -18);
        const ws = wordSets[k];
        const n = ws.length;
        const spread = 0.72;
        ws.forEach((w, i) => {
          const local = reduced ? 1 : smooth(clamp01((p - (i / n) * spread) / (1 - spread)));
          w.style.opacity = String(0.14 + 0.86 * local);
          w.style.transform = `translateY(${(1 - local) * 14}px)`;
        });
        for (const f of fades.filter((f) => f.closest('[data-ch]') === el)) {
          const o = reduced ? 1 : smooth(clamp01((p - 0.78) / 0.22));
          f.style.opacity = String(o);
          f.style.transform = `translateY(${(1 - o) * 10}px)`;
          f.style.pointerEvents = o < 0.5 ? 'none' : '';
        }
      });

      // the panel
      const slide = reduced ? (b > 5.7 ? 1 : 0) : smooth(clamp01((b - 5.4) / 0.55));
      if (panel) {
        panel.style.transform = `translateY(${(1 - slide) * 104}%)`;
        panel.style.visibility = slide < 0.01 ? 'hidden' : 'visible';
        panel.inert = slide < 0.6;
      }
      const q = reduced ? (b > 5.7 ? 1 : 0) : clamp01((b - 5.55) / 0.45);
      panelItems.forEach((el, i) => {
        const o = reduced ? q : smooth(clamp01((q - i * 0.1) / 0.5));
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 16}px)`;
      });

      // the chapter bar
      const a = Math.min(LAST, Math.floor(b + 0.35));
      if (a !== active) {
        active = a;
        dots.forEach((d, i) => d.setAttribute('aria-current', i === a ? 'step' : 'false'));
        if (count) count.textContent = `0${a + 1} / 0${LAST + 1}`;
        if (name) name.textContent = RAIL[a];
      }

      // tags pinned to the trucks in the x-ray, the person's tag only while the circles are open
      const tagO = smooth(clamp01((x - 0.6) / 0.4)) * (1 - smooth(clamp01((b - 4.5) / 0.2)));
      tags.forEach((el, i) => {
        const pt = project?.(new THREE.Vector3(tracks[i].x, i === 3 ? 1.9 : 2.7, tracks[i].z));
        if (!pt || !pt.visible) {
          el.style.opacity = '0';
          return;
        }
        const o = i === 3 ? tagO * smooth(clamp01((b - 3.6) / 0.3)) : tagO;
        el.style.opacity = String(o);
        el.style.transform = `translate(${pt.x}px, ${pt.y - 16}px) translate(-50%, -100%)`;
      });
    };
    paintRef.current(lastB.current);

    if (!reduced) {
      const tween = gsap.to(intro.current, {
        v: 1,
        duration: 2.4,
        delay: 0.35,
        ease: 'power1.inOut',
        onUpdate: () => paintRef.current(lastB.current),
      });
      return () => {
        tween.kill();
      };
    }
  }, [reduced]);

  return (
    <div className="d2" ref={rootRef} data-dark="0">
      <div className="d2-stage" ref={stageRef}>
        <canvas className="d2-canvas" ref={canvasRef} aria-hidden="true" />

        <header className="d2-nav">
          <a className="d2-logos" href="https://ekotehnika.rs" aria-label="Ekotehnika, početna">
            <img src="/brand/linde-mh.png" alt="Linde Material Handling" height={36} />
            <img src="/brand/ekotehnika.png" alt="Ekotehnika" height={26} />
          </a>
          <nav className="d2-links" aria-label="Glavna navigacija">
            {links.map((p, i) => (
              <a key={p.id} href={p.href}>
                {navLabels[i]}
              </a>
            ))}
          </nav>
          <a className="d2-quote d2-quote-nav" href={hero.quote.href} data-cta="quote">
            {hero.quote.label}
          </a>
        </header>

        {COPY.map((c, k) => (
          <section className="d2-copy" data-ch={k} key={k} aria-label={c.label} data-solid={k === 5 ? '' : undefined}>
            <div className="d2-block">
            <p className="d2-label">{c.label}</p>
            {k === 0 ? (
              <h1 className="d2-statement d2-statement-xl">{words(c.text).map(wordSpan)}</h1>
            ) : (
              <h2 className="d2-statement">{words(c.text).map(wordSpan)}</h2>
            )}
            {c.sub && (
              <p className="d2-sub" data-late>
                {c.sub}
              </p>
            )}
            </div>
            {k === 0 && (
              <div className="d2-row" data-late>
                <a className="d2-quote" href={hero.quote.href} data-cta="quote">
                  {hero.quote.label}
                </a>
                <a className="d2-call" href={hero.sales.tel} data-cta="call-sales">
                  <Phone size={18} />
                  <span>{hero.sales.label}</span>
                  <strong>{hero.sales.number}</strong>
                </a>
              </div>
            )}
          </section>
        ))}

        {TAGS.map((t) => (
          <span className="d2-tag" data-tag key={t} aria-hidden="true">
            {t}
          </span>
        ))}

        <section className="d2-panel" aria-label="Ponuda">
          <div className="d2-panel-in">
            <div className="d2-panel-head">
              <div data-panel-in>
                <p className="d2-label">Ekotehnika</p>
                <h2 className="d2-panel-title">Jedan partner. Cela flota.</h2>
              </div>
              <div className="d2-panel-cta" data-panel-in>
                <a className="d2-quote" href={hero.quote.href} data-cta="quote">
                  {hero.quote.label}
                </a>
                <a className="d2-service" href={hero.service.tel} data-cta="call-service">
                  <Phone size={16} />
                  <span>{hero.service.label}</span>
                  <strong>{hero.service.number}</strong>
                </a>
              </div>
            </div>
            <div className="d2-cards">
              {OFFER.map((id) => {
                const p = pillars.find((x) => x.id === id)!;
                return (
                  <a className="d2-card" href={p.href} key={id} data-panel-in>
                    <span className="d2-card-icon">
                      <PillarIcon id={id} size={24} />
                    </span>
                    <span className="d2-card-name">{p.name}</span>
                    <span className="d2-card-line">{p.line}</span>
                    <span className="d2-card-more">
                      {p.more}
                      <Arrow size={16} />
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <div className="d2-rail" role="group" aria-label="Poglavlja">
          <p className="d2-count">
            <span data-count>01 / 07</span>
            <span data-name>Uvod</span>
          </p>
          <div className="d2-ticks">
            {RAIL.map((r, k) => (
              <button key={r} type="button" data-rail aria-label={r} aria-current={k === 0 ? 'step' : 'false'} onClick={() => goTo(REST(k))} />
            ))}
          </div>
        </div>

        {failed && <p className="d2-failed">3D prikaz nije dostupan u ovom pregledaču.</p>}
      </div>
    </div>
  );
}

function wordSpan(w: string, i: number) {
  return (
    <span className="d2-wl" key={i}>
      <span className="d2-w">{w}</span>{' '}
    </span>
  );
}
