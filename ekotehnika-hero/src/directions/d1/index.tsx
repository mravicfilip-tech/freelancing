// Direction 1, Nocna smena. A dark warehouse at 02:14, a stopped forklift, a swap truck and a
// service lift, told by one camera until 06:00. The story and props live in story.ts, the copy in copy.ts.
import { useEffect, useRef, type CSSProperties } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { useStory, windowed, show, clamp01, smooth } from '../../story/useStory';
import type { StoryEngine } from '../../three/engine';
import { DOCK_X } from '../../three/warehouse';
import { hero, SITE, trust } from '../../content';
import { Phone } from '../../components/Icons';
import { STORY, LAST, CH_LAST, REST, live, dawnAt, clockAt } from './story';
import { chapters, links, tags, type TagDef } from './copy';
import './d1.css';

const POOL = 'ABCČĆDĐEFGHIJKLMNOPRSŠTUVZŽ0123456789#/<>+=*';
const RESTS = Array.from({ length: CH_LAST + 1 }, (_, i) => REST(i));
const pad = (i: number) => String(i + 1).padStart(2, '0');

// A cheap hash so the scramble is the same for the same story time.
const noise = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// Letters scramble through random glyphs and settle left to right as p runs 0 to 1.
function decode(final: string, p: number, b: number, salt: number) {
  if (p >= 1) return final;
  const n = final.length;
  let out = '';
  for (let i = 0; i < n; i++) {
    const c = final[i];
    if (c === ' ' || c === '.' || c === ',') {
      out += c;
      continue;
    }
    const settle = (i / n) * 0.7 + noise(i + salt) * 0.25;
    if (p > settle + 0.05) out += c;
    else if (p < 0.02) out += '<i> </i>';
    else out += `<i>${POOL[Math.floor(noise(i * 7.3 + Math.floor(b * 60) * 1.7 + salt) * POOL.length)]}</i>`;
  }
  return out;
}

const tagPoint = (t: TagDef, out: THREE.Vector3) => {
  switch (t.target) {
    case 'dock':
      return out.set(DOCK_X, t.rise, -2);
    case 'lift':
      return out.set(24, t.rise, -6.4);
    default: {
      const o = live[t.target];
      if (!o) return null;
      return out.set(o.position.x, o.position.y + t.rise, o.position.z);
    }
  }
};

function Conversion() {
  return (
    <div className="d1-row">
      <a className="d1-btn" href={hero.quote.href} data-cta="quote">
        {hero.quote.label}
      </a>
      <a className="d1-btn d1-btn-line" href={hero.sales.tel} data-cta="call-sales">
        <Phone size={18} />
        <span>
          {hero.sales.label} <b>{hero.sales.number}</b>
        </span>
      </a>
    </div>
  );
}

function Title({ i, as: Tag = 'h2' }: { i: number; as?: 'h1' | 'h2' }) {
  const c = chapters[i];
  return (
    <Tag className="d1-title" aria-label={c.title.join(' ')}>
      {c.title.map((line, k) => (
        <span key={k} className="d1-line" aria-hidden="true" data-decode={line} data-ch={i} data-salt={k * 17 + i * 5}>
          {line}
        </span>
      ))}
    </Tag>
  );
}

export default function Direction1({ reduced }: { reduced: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const introRef = useRef({ p: reduced ? 1 : 0 });
  const lastB = useRef(0);
  const cache = useRef({ clock: '', day: false, rail: -1 });
  const frameFn = useRef<(b: number, e: StoryEngine) => void>(() => {});
  const engineRef = useRef<StoryEngine | null>(null);

  const onFrame = (b: number, engine: StoryEngine) => {
    lastB.current = b;
    engineRef.current = engine;
    frameFn.current(b, engine);
  };

  const { stageRef, canvasRef, failed, goTo } = useStory({ story: STORY, reduced, scrollPerBeat: 1000, rests: RESTS, onFrame });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
    const chs = q('.d1-ch');
    const ghosts = q('.d1-ghost');
    const decodes = q('[data-decode]');
    const tagEls = q('.d1-tag');
    const clockEl = root.querySelector<HTMLElement>('.d1-clock-time');
    const clockBar = root.querySelector<HTMLElement>('.d1-clock-bar i');
    const ground = root.querySelector<HTMLElement>('.d1-ground');
    const rail = q('.d1-rail button');
    const counter = root.querySelector<HTMLElement>('[data-count]');
    const pt = new THREE.Vector3();

    frameFn.current = (b, engine) => {
      const d = dawnAt(b);
      const day = d > 0.5;
      if (day !== cache.current.day) {
        cache.current.day = day;
        root.classList.toggle('is-day', day);
      }
      if (ground) ground.style.opacity = String(d);

      chs.forEach((el, i) => {
        const o = windowed(b, i === 0 ? -1 : i - 0.05, i === CH_LAST ? 99 : i + 0.55, 0.25, 0.28);
        show(el, o, (1 - o) * 14);
      });

      ghosts.forEach((el, i) => {
        const o = windowed(b, i === 0 ? -1 : i - 0.4, i === CH_LAST ? 99 : i + 0.7, 0.4, 0.3);
        el.style.opacity = String(o);
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        el.style.transform = `translate3d(${(b - i) * -90}px, -50%, 0)`;
      });

      decodes.forEach((el) => {
        const i = Number(el.dataset.ch);
        let p = clamp01((b - (i - 0.05)) / 0.3);
        if (i === 0) p = reduced ? 1 : b > 0.25 ? 1 : introRef.current.p;
        if (reduced) p = 1;
        const html = decode(el.dataset.decode!, p, b, Number(el.dataset.salt));
        if (el.dataset.cur !== html) {
          el.dataset.cur = html;
          el.innerHTML = html;
        }
      });

      tagEls.forEach((el, k) => {
        const t = tags[k];
        const o = windowed(b, t.win[0], t.win[1], 0.2, 0.18);
        const at = o > 0.01 ? tagPoint(t, pt) : null;
        const s = at ? engine.project(pt) : null;
        if (!s || !s.visible || o < 0.01) {
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          return;
        }
        el.style.visibility = 'visible';
        el.style.opacity = String(o);
        el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
      });

      const clock = clockAt(b);
      if (clock !== cache.current.clock && clockEl) {
        cache.current.clock = clock;
        clockEl.textContent = clock;
      }
      if (clockBar) clockBar.style.transform = `scaleX(${clamp01(b / LAST)})`;

      const near = Math.min(CH_LAST, Math.max(0, Math.floor(b + 0.5)));
      if (near !== cache.current.rail) {
        cache.current.rail = near;
        rail.forEach((r, i) => r.setAttribute('aria-current', i === near ? 'step' : 'false'));
      }

      if (counter) {
        const n = Math.round(1000 * smooth(clamp01((b - 7.7) / 0.3)));
        counter.textContent = n >= 1000 ? '1.000+' : String(n);
      }
    };
    frameFn.current(lastB.current, engineRef.current as StoryEngine);

    // The first headline decodes on load with a short timer, since story time has not moved yet.
    let tween: gsap.core.Tween | null = null;
    if (!reduced) {
      tween = gsap.to(introRef.current, {
        p: 1,
        duration: 1.5,
        delay: 0.2,
        ease: 'power1.inOut',
        onUpdate: () => engineRef.current && frameFn.current(lastB.current, engineRef.current),
      });
    }
    return () => {
      tween?.kill();
    };
  }, [reduced]);

  const claimItems = trust.map((t) => t.text);

  return (
    <div className="d1" ref={rootRef}>
      <div className="d1-stage" ref={stageRef}>
        <div className="d1-ground" aria-hidden="true" />
        <canvas className="d1-canvas" ref={canvasRef} aria-hidden="true" />
        {failed && <p className="d1-failed">3D prikaz nije dostupan u ovom pregledaču.</p>}

        <div className="d1-ghosts" aria-hidden="true">
          {chapters.map((c, i) => (
            <div key={i} className="d1-ghost" style={{ fontSize: Math.min(320, Math.floor(1360 / (c.ghost.length * 0.56))) }}>
              {c.ghost}
            </div>
          ))}
        </div>

        <div className="d1-tags" aria-hidden="true">
          {tags.map((t) => (
            <div key={t.id} className="d1-tag" style={{ '--dx': `${t.dx}px`, '--dy': `${t.dy}px` } as CSSProperties}>
              <svg className="d1-lead" width="1" height="1" overflow="visible">
                <line x1="0" y1="0" x2={t.dx} y2={t.dy} />
              </svg>
              <span className="d1-dot" />
              <div className="d1-lab" style={t.dx > 0 ? { left: t.dx, top: t.dy } : { right: -t.dx, top: t.dy }}>
                <b>{t.label}</b>
                <i>{t.sub}</i>
              </div>
            </div>
          ))}
        </div>

        <header className="d1-nav">
          <a className="d1-logos" href={SITE} aria-label="Ekotehnika, Linde partner, početna">
            <img src="/brand/linde-mh.png" alt="Linde Material Handling" width="56" height="34" />
            <img src="/brand/ekotehnika.png" alt="Ekotehnika" width="124" height="34" />
          </a>
          <nav aria-label="Glavna navigacija">
            {links.map((l) => (
              <a key={l.label} href={l.href}>
                {l.label}
              </a>
            ))}
          </nav>
          <a className="d1-btn d1-btn-nav" href={hero.quote.href} data-cta="quote">
            {hero.quote.label}
          </a>
        </header>

        <div className="d1-chapters">
          {/* Intro */}
          <section className="d1-ch d1-intro" aria-label="Uvod">
            <div className="d1-in">
              <p className="d1-kicker">
                <span>{chapters[0].time}</span>
                <span>{chapters[0].tag}</span>
                <span>Vrčin, Srbija</span>
              </p>
              <Title i={0} as="h1" />
              <p className="d1-body d1-sub">{chapters[0].body}</p>
              <Conversion />
              <ul className="d1-claims">
                {claimItems.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </section>

          {chapters.slice(1, CH_LAST).map((c, k) => {
            const i = k + 1;
            return (
              <section key={i} className="d1-ch" aria-label={c.tag}>
                <div className="d1-in">
                  <p className="d1-kicker">
                    <span>{pad(i)}</span>
                    <span>{c.time}</span>
                    <span>{c.tag}</span>
                  </p>
                  <Title i={i} />
                  <p className="d1-body">{c.body}</p>
                  {i === 2 && (
                    <div className="d1-call">
                      <p className="d1-call-top">
                        <span className="d1-pulse" aria-hidden="true" />
                        Linija otvorena
                      </p>
                      <p className="d1-call-label">{hero.service.label}</p>
                      <a className="d1-call-num" href={hero.service.tel} data-cta="call-service">
                        {hero.service.number}
                      </a>
                      <p className="d1-call-note">Pozovite i servis kreće odmah.</p>
                    </div>
                  )}
                  {c.link && (
                    <a className="d1-more" href={c.link.href}>
                      {c.link.label}
                      <span aria-hidden="true"> →</span>
                    </a>
                  )}
                </div>
              </section>
            );
          })}

          {/* Finale */}
          <section className="d1-ch d1-finale" aria-label="Ekotehnika">
            <div className="d1-in">
              <p className="d1-kicker">
                <span>{pad(CH_LAST)}</span>
                <span>{chapters[CH_LAST].time}</span>
                <span>{chapters[CH_LAST].tag}</span>
              </p>
              <Title i={CH_LAST} />
              <dl className="d1-stats">
                <div>
                  <dt>Na tržištu</dt>
                  <dd>{trust[0].text}</dd>
                </div>
                <div>
                  <dt>Klijenata</dt>
                  <dd data-count>1.000+</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{trust[2].text}</dd>
                </div>
              </dl>
              <Conversion />
            </div>
          </section>
        </div>

        <div className="d1-clock" aria-hidden="true">
          <span className="d1-clock-label">Smena</span>
          <span className="d1-clock-time">02:14</span>
          <span className="d1-clock-bar">
            <i />
          </span>
        </div>

        <ol className="d1-rail" aria-label="Poglavlja">
          {chapters.map((c, i) => (
            <li key={i}>
              <button type="button" aria-label={`${pad(i)} ${c.tag}`} aria-current={i === 0 ? 'step' : 'false'} onClick={() => goTo(REST(i))}>
                {pad(i)}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
