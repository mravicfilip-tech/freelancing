// Variant 4, Grad. The Emons hero 1:1 in Linde red. A bright soft lit miniature of Ekotehnika in
// Vrčin, a frosted glass card on the left with thin Outfit type, red pills top right, and a camera
// that flies stop to stop through the world on scroll.
import { Fragment, useEffect, useState, type JSX } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useScrollStory } from '../../scroll/useScrollStory';
import { hero, pillars, SITE } from '../../content';
import { Arrow, Phone, PillarIcon, Search, Van } from '../../components/Icons';
import { Stage, keyParam } from './Stage';
import { keys, stops, stopP, type IconId } from './story';
import './v4.css';

const LENGTH = 8000;
// dev only, the shot script renders in software at a frame or two a second, so it asks for the
// smoothing to settle at once
const SHOT = import.meta.env.DEV && new URLSearchParams(window.location.search).has('v4shot');

const Building = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M4 20.5V8.5l7-4v16M11 20.5h9V10.5h-9M14 13.5h3M14 17h3M7 11.5v.01M7 15v.01" />
  </svg>
);

const icon = (id: IconId): JSX.Element => {
  if (id === 'depo') return <Van size={18} />;
  if (id === 'hq') return <Building />;
  return <PillarIcon id={id} size={18} />;
};

// Which stop the card shows for a progress value. The last key closes on the opening copy.
function stopAt(p: number) {
  const u = keyParam(p);
  let best = 0;
  let bd = Infinity;
  keys.forEach((k, i) => {
    if (k.stop === undefined) return;
    const dd = Math.abs(i - u);
    if (dd < bd) {
      bd = dd;
      best = k.stop;
    }
  });
  return best >= stops.length ? 0 : best;
}

function Pill({ href, label, kind = 'line', cta, icon: ic }: { href: string; label: string; kind?: 'line' | 'fill'; cta?: string; icon?: JSX.Element }) {
  return (
    <a className={`v4-pill v4-pill-${kind}`} href={href} data-cta={cta}>
      {ic}
      <span>{label}</span>
      <i aria-hidden="true">
        <Arrow size={15} />
      </i>
    </a>
  );
}

export default function Variant4({ reduced }: { reduced: boolean }) {
  const { stageRef, progress, goTo } = useScrollStory({ length: LENGTH, reduced, smoothing: SHOT ? 0.45 : 0.06 });
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const [out, setOut] = useState(false);
  const [ready, setReady] = useState(false);

  // the van decals draw text on a canvas, so the font has to be in before the world mounts
  useEffect(() => {
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    document.fonts?.load('800 64px Archivo').then(go, go);
    const id = window.setTimeout(go, 1800);
    return () => window.clearTimeout(id);
  }, []);

  // read the scroll clock outside React, set state only when the stop changes
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const s = stopAt(progress.current);
      if (s !== last) {
        last = s;
        setIdx(s);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  // the card copy fades out, swaps, and its words rise back in
  useEffect(() => {
    if (idx === shown) return;
    if (reduced) {
      setShown(idx);
      return;
    }
    setOut(true);
    const id = window.setTimeout(() => {
      setShown(idx);
      setOut(false);
    }, 280);
    return () => window.clearTimeout(id);
  }, [idx, shown, reduced]);

  const s = stops[shown];
  const words = s.title.split(' ');

  return (
    <section className={`v4${reduced ? ' v4-still' : ''}`} ref={stageRef} aria-label="Ekotehnika, Linde viljuškari">
      <div className="v4-canvas" aria-hidden="true">
        <Canvas
          shadows="soft"
          dpr={[1, 1.5]}
          camera={{ position: [-110, 80, 80], fov: 20, near: 5, far: 2000 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl, scene }) => {
            // dev only, lets the shot script read draw calls and triangles
            if (import.meta.env.DEV) Object.assign(window, { __v4gl: gl, __v4scene: scene });
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.95;
          }}
        >
          {ready && <Stage progress={progress} reduced={reduced} idx={idx} />}
        </Canvas>
      </div>

      <header className="v4-top">
        <a className="v4-logo" href={SITE} aria-label="Ekotehnika, Linde partner, početna">
          <img src="/brand/linde-mh.png" alt="Linde Material Handling" width={67} height={40} />
          <img src="/brand/ekotehnika.png" alt="Ekotehnika" width={110} height={30} />
        </a>
        <nav className="v4-nav" aria-label="Brze veze">
          <Pill href={pillars[1].href} label={pillars[1].name} />
          <Pill href={pillars[2].href} label={pillars[2].name} />
          <a className="v4-pill v4-pill-line v4-phone" href={hero.sales.tel} data-cta="call-sales">
            <Phone size={16} />
            <span>
              {hero.sales.label} {hero.sales.number}
            </span>
          </a>
          <Pill href={hero.quote.href} label={hero.quote.label} kind="fill" cta="quote" />
          <a className="v4-icon-btn" href={`${SITE}/?s=`} aria-label="Pretraga">
            <Search size={18} />
          </a>
          <span className="v4-lang" aria-label="Jezik srpski">
            SR
          </span>
        </nav>
      </header>

      <div className="v4-card">
        <div className={`v4-copy${out ? ' out' : ''}`} key={shown}>
          <h1 className="v4-title">
            {words.map((w, i) => (
              <Fragment key={i}>
                <span className="v4-w">
                  <span style={{ animationDelay: `${i * 55}ms` }}>{w}</span>
                </span>{' '}
              </Fragment>
            ))}
          </h1>
          <p className="v4-line">{s.line}</p>
          <div className="v4-actions">
            <a className="v4-small" href={s.a.href}>
              {s.a.label}
            </a>
            <a className="v4-small" href={s.b.href}>
              {s.b.label}
            </a>
          </div>
        </div>
      </div>

      <ol className="v4-row" aria-label="Delovi priče">
        {stops.map((st, i) => (
          <li key={st.icon}>
            <button type="button" className={i === idx ? 'on' : ''} aria-current={i === idx ? 'step' : undefined} onClick={() => goTo(stopP[i])} aria-label={st.label}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              {icon(st.icon)}
              <span className="v4-row-label">{st.label}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* dummy label, the link goes to the home page */}
      <a className="v4-pill v4-pill-line v4-all" href={SITE}>
        <span>Sve usluge</span>
        <i aria-hidden="true">
          <Arrow size={15} />
        </i>
      </a>
    </section>
  );
}
