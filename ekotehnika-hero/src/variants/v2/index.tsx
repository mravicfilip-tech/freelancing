// V2 Linija. The United Carriers illustrated scroll story, 1:1 in Linde tokens. Flat technical
// vector drawings in side view on a pale ground. The forklift takes a pallet off the rack, turns
// toward the camera, lowers it, drives right while the floor turns into a black aisle, headline and
// service columns reveal word by word, then the view tips to top down and the truck follows the aisle to
// the dock. SVG and GSAP only, the clock is useScrollStory. The shared nav sits on top, every word is
// Geist in sentence case, and the camera keeps the drawing under about 60 percent of the screen.
import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useScrollStory, clamp01, range } from '../../scroll/useScrollStory';
import { hero, pillars, trust } from '../../content';
import { C } from '../../tokens';
import { ForkliftFront, ForkliftSide, LoadSide, RackSide, ServiceIcon } from './art';
import { YardMap } from './map';
import { makeWords, setWords } from './reveal';
import { Nav } from '../../ui/Nav';
import './v2.css';

const LENGTH = 9000;

const io = (t: number) => 0.5 - Math.cos(Math.PI * clamp01(t)) / 2;
const ein = (t: number) => clamp01(t) ** 2;
const eout = (t: number) => 1 - (1 - clamp01(t)) ** 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Keyframes [p, value], eased in and out between each pair.
function kf(p: number, keys: [number, number][]) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i];
    const [p0, v0] = keys[i - 1];
    if (p <= p1) return v0 + (v1 - v0) * io((p - p0) / (p1 - p0));
  }
  return keys[keys.length - 1][1];
}

// Distance driven in the long drive, eased in then steady.
function drive(p: number) {
  const t = range(p, 0.44, 0.84);
  const a = 0.18;
  const d = t < a ? (t * t) / (2 * a) : t - a / 2;
  return d / (1 - a / 2);
}

const RACK_X = 300;
const PICK_Y = 300;

// Copy. Lines marked dummy are new and not from content.ts.
// The content.ts headline, rebroken into two balanced lines.
const HERO_LINES = ['Linde viljuškari. Prodaja,', 'najam i servis na jednom mestu.'];
const SERVICES = pillars[2];
const DARK_LINES = ['Sve što vašem skladištu', 'treba, jedan partner']; // dummy
const DARK_LINK = 'Naše usluge'; // dummy
const CLOSE_LINES = ['Pouzdanost', 'na svakom koraku']; // dummy
const CLOSE_SUB = 'Od 1997. uz vaše viljuškare, od prve ponude do svakog servisa.'; // dummy
const SIDE_TITLE = 'Servis na terenu'; // dummy

type Els = Record<string, HTMLElement | SVGElement | null>;

export default function Variant2({ reduced }: { reduced: boolean }) {
  const { stageRef, progress } = useScrollStory({ length: LENGTH, reduced, smoothing: 0.07 });
  const frameRef = useRef<HTMLDivElement>(null);
  const els = useRef<Els>({});
  const r = (k: string) => (el: HTMLElement | SVGElement | null) => {
    els.current[k] = el;
  };

  // Keeps the 1440 by 900 composition covering the stage at any desktop size.
  useLayoutEffect(() => {
    const fit = () => {
      const f = frameRef.current;
      const st = stageRef.current;
      if (!f || !st) return;
      const k = Math.max(st.clientWidth / 1440, st.clientHeight / 900);
      f.style.transform = `translate(-50%, -50%) scale(${k})`;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [stageRef]);

  useEffect(() => {
    const e = els.current as Record<string, any>;
    const q = (sel: string) => Array.from(stageRef.current?.querySelectorAll<HTMLElement>(sel) ?? []);
    const heroLines = q('[data-l="hero"]').map(makeWords);
    const darkLines = q('[data-l="dark"]').map(makeWords);
    const darkPara = q('[data-l="darkp"]').map(makeWords);
    const svcTitles = q('[data-l="svc"]').map(makeWords);
    const closeLines = q('[data-l="close"]').map(makeWords);
    const sideTitle = q('[data-l="side"]').map(makeWords);
    const svcItems = q('.v2-svc li');
    const svcIcons = svcItems.map((li) => Array.from(li.querySelectorAll<SVGElement>('path, rect, circle')));
    const sideIcon = q('.v2-cside svg path, .v2-cside svg rect, .v2-cside svg circle');
    const frontRods = q('.v2-front .v2-frod') as unknown as SVGRectElement[];
    const frontChains = q('.v2-front .v2-fchain') as unknown as SVGLineElement[];

    const route = e.route as SVGPathElement;
    const total = route.getTotalLength();
    e.reveal.setAttribute('stroke-dasharray', `${total} ${total}`);

    const intro = { v: reduced ? 1 : 0 };
    const vis = (el: HTMLElement | null, o: number, y = 0) => {
      if (!el) return;
      el.style.opacity = String(o);
      el.style.transform = y ? `translateY(${y}px)` : '';
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    };

    let last = -1;
    let lastIntro = -1;
    const render = (p: number) => {
      // Truck position, mast height and tilt.
      const fx =
        p < 0.44
          ? kf(p, [[0.04, -300], [0.11, 89], [0.18, 89], [0.215, 229], [0.24, 229], [0.29, 40]])
          : 40 + 2600 * drive(p);
      const lift = kf(p, [[0.11, 0], [0.18, 303], [0.215, 303], [0.24, 323], [0.36, 323], [0.4, 18]]);
      const tilt = p < 0.31 ? kf(p, [[0.24, 0], [0.28, -3], [0.29, -3], [0.31, 0]]) : kf(p, [[0.42, 0], [0.47, -3]]);
      const off = Math.max(0, lift - 120);
      const carried = p > 0.24 || (p > 0.215 && lift >= 305);

      // Turn toward the camera and back. The world mirrors so the rack ends up behind the truck.
      const sxTruck = p < 0.29 ? 1 : p < 0.31 ? 1 - ein(range(p, 0.29, 0.31)) : p < 0.42 ? 0 : eout(range(p, 0.42, 0.44));
      const sFront = p < 0.31 ? 0 : p < 0.33 ? eout(range(p, 0.31, 0.33)) : p < 0.4 ? 1 : p < 0.42 ? 1 - ein(range(p, 0.4, 0.42)) : 0;
      const sxWorld = p < 0.29 ? 1 : p < 0.31 ? 1 - ein(range(p, 0.29, 0.31)) : p < 0.42 ? 0 : -eout(range(p, 0.42, 0.44));
      const pivot = fx - 20;

      // Side camera. World point (cx, cy) sits at the screen centre at scale s. The scale stays low
      // enough that the rack, about 530 units tall, and the raised front view stay under 60 percent
      // of the screen, and every beat at rest frames the whole drawing inside the page margins.
      const s = kf(p, [[0, 0.84], [0.04, 0.84], [0.11, 1.0], [0.18, 1.0], [0.24, 1.0], [0.29, 1.0], [0.33, 1.2], [0.36, 1.2], [0.4, 1.5], [0.44, 1.0], [0.52, 1.0], [0.78, 1.0]]);
      const cy = kf(p, [[0, -431], [0.04, -431], [0.11, -340], [0.18, -340], [0.24, -340], [0.29, -330], [0.33, -212], [0.36, -212], [0.4, -113], [0.44, -310], [0.52, 50], [0.78, 55], [0.84, 70]]);
      const cxKF = kf(p, [[0, 237], [0.04, 237], [0.11, 431], [0.18, 431], [0.24, 431]]);
      const offX = kf(p, [[0.44, 0], [0.52, 90]]);
      const cx = lerp(cxKF, pivot + offX / s, io(range(p, 0.24, 0.29)));
      const cam = `translate(720 450) scale(${s}) translate(${-cx} ${-cy})`;
      const gy = (0 - cy) * s + 450;
      const truckSX = (pivot - cx) * s + 720;

      e.cam1.setAttribute('transform', cam);
      e.cam2.setAttribute('transform', cam);
      // The world turns about the spot where the truck turned, x 20, so the rack stays behind it.
      e.world.setAttribute('transform', `translate(20 0) scale(${Math.abs(sxWorld) < 1e-4 ? 1e-4 : sxWorld} 1) translate(-20 0)`);
      // The rack and the parked truck dissolve as the truck drives off, so they never sit cut by the edge.
      e.world.style.opacity = String(Math.min(1, Math.abs(sxWorld) * 1.6) * (1 - range(p, 0.445, 0.485)));
      e.truckTurn.setAttribute('transform', `translate(${pivot} 0) scale(${Math.max(1e-4, sxTruck)} 1) translate(${-pivot} 0)`);
      e.truckPos.setAttribute('transform', `translate(${fx} 0)`);
      e.front.setAttribute('transform', `translate(${pivot} 0) scale(${Math.max(1e-4, sFront)} 1)`);
      e.front.style.visibility = sFront > 0.001 ? 'visible' : 'hidden';
      const turning = (p > 0.29 && p < 0.33) || (p > 0.4 && p < 0.44);
      const blurX = turning ? 6 * Math.sin(Math.PI * (p < 0.35 ? range(p, 0.29, 0.33) : range(p, 0.4, 0.44))) : 0;
      e.mb.setAttribute('stdDeviation', `${blurX.toFixed(2)} 0`);
      const fl = blurX > 0.05 ? 'url(#v2-mb)' : '';
      if (e.cam2.getAttribute('filter') !== fl) {
        if (fl) {
          e.cam2.setAttribute('filter', fl);
          e.cam1.setAttribute('filter', fl);
        } else {
          e.cam2.removeAttribute('filter');
          e.cam1.removeAttribute('filter');
        }
      }
      e.truckTurn.style.visibility = sxTruck > 0.001 ? 'visible' : 'hidden';

      // Mast, carriage, chain and wheels.
      e.mast.setAttribute('transform', `rotate(${tilt} 42 -14)`);
      e.inner.setAttribute('transform', `translate(0 ${-off})`);
      e.rod.setAttribute('y', String(-196 - off));
      e.rod.setAttribute('height', String(off));
      e.chain.setAttribute('y1', String(-212 - off));
      e.chain.setAttribute('y2', String(-lift - 45));
      e.carriage.setAttribute('transform', `translate(0 ${-lift - 5})`);
      e.load.setAttribute('transform', carried ? 'translate(66 10)' : `translate(${RACK_X - 5 - fx} ${lift - PICK_Y + 5})`);
      e.wheelF.setAttribute('transform', `rotate(${(fx / 31) * 57.3})`);
      e.wheelR.setAttribute('transform', `rotate(${(fx / 27) * 57.3})`);
      e.finner.setAttribute('transform', `translate(0 ${-off})`);
      e.fcarriage.setAttribute('transform', `translate(0 ${-lift - 5})`);
      frontRods.forEach((rod) => {
        rod.setAttribute('y', String(-196 - off));
        rod.setAttribute('height', String(off));
      });
      frontChains.forEach((ch) => {
        ch.setAttribute('y1', String(-212 - off));
        ch.setAttribute('y2', String(-lift - 45));
      });

      // Floor line, then the black aisle drawing out under the truck and filling the bottom.
      const k1 = io(range(p, 0.455, 0.49));
      const k2 = eout(range(p, 0.48, 0.515));
      const bottom = p < 0.78 ? lerp(gy + 4, 930, k2) : lerp(930, 570, io(range(p, 0.78, 0.82)));
      e.floor.setAttribute('x', String(truckSX - 1700 * k1));
      e.floor.setAttribute('width', String(3400 * k1));
      e.floor.setAttribute('y', String(gy - 1));
      e.floor.setAttribute('height', String(Math.max(0, bottom - gy + 1)));
      e.floor.style.visibility = p > 0.83 ? 'hidden' : 'visible';
      e.ground.setAttribute('y1', String(gy));
      e.ground.setAttribute('y2', String(gy));
      e.lane.setAttribute('y1', String(gy + 46));
      e.lane.setAttribute('y2', String(gy + 46));
      e.lane.setAttribute('stroke-dashoffset', String(fx * s));
      e.lane.style.opacity = String(0.5 * range(p, 0.51, 0.53) * (1 - range(p, 0.78, 0.8)));

      // Tip from side view to top down. The side truck folds flat onto the aisle.
      const fold = range(p, 0.8, 0.825);
      const py = gy - 110 * s;
      const sy = Math.max(1e-4, 1 - ein(fold));
      const ty = (475 - py) * io(fold);
      e.squash.setAttribute('transform', `translate(0 ${ty}) translate(0 ${py}) scale(1 ${sy}) translate(0 ${-py})`);
      e.side.style.opacity = p > 0.835 ? '0' : '1';

      // Top down yard.
      const mapOn = range(p, 0.82, 0.83);
      e.map.style.opacity = String(mapOn);
      e.map.style.visibility = mapOn > 0.001 ? 'visible' : 'hidden';
      if (mapOn > 0.001) {
        const L = total * io(range(p, 0.85, 0.985));
        const P = route.getPointAtLength(L);
        const P1 = route.getPointAtLength(Math.max(0, L - 2));
        const P2 = route.getPointAtLength(Math.min(total, L + 2));
        const ang = (Math.atan2(P2.y - P1.y, P2.x - P1.x) * 180) / Math.PI;
        const A = route.getPointAtLength(Math.min(total, L + 260));
        const la = 0.45 * range(p, 0.86, 0.9) * (1 - range(p, 0.95, 0.985));
        const lx = lerp(P.x, A.x, la);
        const ly = lerp(P.y, A.y, la);
        const ms = kf(p, [[0.85, 1], [0.9, 0.9], [0.95, 0.92], [0.985, 1]]);
        const sx = kf(p, [[0.85, 640], [0.95, 700], [0.985, 740]]);
        const sy2 = kf(p, [[0.85, 475], [0.985, 480]]);
        const camx = lx - (sx - 720) / ms;
        const camy = ly - (sy2 - 450) / ms;
        e.mapCam.setAttribute('transform', `translate(720 450) scale(${ms}) translate(${-camx} ${-camy})`);
        e.mapTruck.setAttribute('transform', `translate(${P.x} ${P.y}) rotate(${ang})`);
        e.mapTruckInner.setAttribute('transform', `scale(1 ${Math.max(1e-4, io(range(p, 0.825, 0.85)))})`);
        e.reveal.setAttribute('stroke-dashoffset', String(total - Math.min(total, L + 650)));
      }

      // Hero copy at scroll zero.
      const heroT = Math.min(intro.v, 1 - range(p, 0.012, 0.045));
      heroLines.forEach((l, i) => setWords(l, clamp01(heroT * 1.25 - i * 0.08)));
      const ho = Math.min(intro.v, 1 - range(p, 0.01, 0.035));
      vis(e.kicker, ho);
      vis(e.heroSub, ho, (1 - ho) * -10);
      vis(e.heroCtas, ho, (1 - ho) * -10);

      // Black aisle headline, paragraph and pill.
      const dOut = 1 - range(p, 0.665, 0.69);
      darkLines.forEach((l, i) => setWords(l, Math.min(range(p, 0.545 + i * 0.012, 0.6 + i * 0.012), dOut)));
      e.darkDot.style.opacity = Math.min(range(p, 0.57, 0.625), dOut) >= 1 ? '1' : '0';
      darkPara.forEach((l) => setWords(l, Math.min(range(p, 0.565, 0.62), dOut)));
      vis(e.darkLink, Math.min(range(p, 0.6, 0.625), dOut));

      // Service columns.
      const sOut = 1 - range(p, 0.775, 0.8);
      svcItems.forEach((li, i) => {
        const t = Math.min(range(p, 0.69 + i * 0.014, 0.745 + i * 0.014), sOut);
        setWords(svcTitles[i], t);
        svcIcons[i].forEach((n) => (n.style.strokeDashoffset = String(1 - Math.min(1, t * 1.6))));
        const rule = li.querySelector<HTMLElement>('.v2-rule');
        if (rule) rule.style.transform = `scaleX(${io(t)})`;
        const para = li.querySelector<HTMLElement>('p');
        vis(para, clamp01(t * 2 - 1), (1 - t) * 8);
        li.style.visibility = t > 0.001 ? 'visible' : 'hidden';
      });
      vis(e.dark, p > 0.5 && p < 0.81 ? 1 : 0);

      // Closing over the yard.
      closeLines.forEach((l, i) => setWords(l, range(p, 0.96 + i * 0.008, 0.984 + i * 0.008)));
      e.closeDot.style.opacity = range(p, 0.976, 0.998) >= 1 ? '1' : '0';
      const cf = range(p, 0.972, 0.995);
      vis(e.closeFoot, cf, (1 - cf) * 14);
      const ct = range(p, 0.966, 0.995);
      sideTitle.forEach((l) => setWords(l, ct));
      sideIcon.forEach((n) => (n.style.strokeDashoffset = String(1 - Math.min(1, ct * 1.5))));
      vis(e.sidePara, clamp01(ct * 2 - 1));
      vis(e.close, p > 0.955 ? 1 : 0);
    };

    if (reduced) {
      render(0);
      return;
    }
    const tw = gsap.to(intro, { v: 1, duration: 1.5, delay: 0.25, ease: 'power2.out' });
    const tick = () => {
      const p = progress.current;
      if (Math.abs(p - last) < 1e-6 && intro.v === lastIntro) return;
      last = p;
      lastIntro = intro.v;
      render(p);
    };
    render(0);
    gsap.ticker.add(tick);
    return () => {
      tw.kill();
      gsap.ticker.remove(tick);
    };
  }, [reduced, progress, stageRef]);

  const rack1 = (
    <RackSide x={RACK_X}>
      <LoadSide x={-5} y={0} kind="wrap" />
      <LoadSide x={-5} y={-150} kind="crates" />
      <LoadSide x={-5} y={-450} kind="cartons" />
    </RackSide>
  );
  const rack2 = (
    <RackSide x={RACK_X + 140}>
      <LoadSide x={-5} y={0} kind="tall" />
      <LoadSide x={-5} y={-150} kind="cartons" />
      <LoadSide x={-5} y={-300} kind="wrap" />
    </RackSide>
  );

  return (
    <div className="v2" ref={stageRef} role="region" aria-label="Ekotehnika, Linde viljuškari">
      <Nav theme="light" className="v2-topnav" />
      <div className="v2-frame" ref={frameRef}>
        <svg className="v2-layer" ref={r('side')} viewBox="0 0 1440 900" aria-hidden="true" focusable="false">
          <defs>
            <filter id="v2-mb" x="-20%" y="-5%" width="140%" height="110%">
              <feGaussianBlur ref={r('mb')} stdDeviation="0 0" />
            </filter>
          </defs>
          <line ref={r('ground')} x1={0} x2={1440} y1={860} y2={860} stroke={C.shadeGrey} strokeWidth={1} />
          <g ref={r('cam1')}>
            <g ref={r('world')}>
              {rack1}
              {rack2}
              <g transform="translate(774 0) scale(-1 1)">
                <ForkliftSide lift={0} load={<LoadSide x={66} y={10} kind="tall" />} />
              </g>
            </g>
          </g>
          <rect ref={r('floor')} x={0} y={900} width={0} height={0} fill={C.ink} />
          <line ref={r('lane')} x1={-200} x2={1640} y1={0} y2={0} stroke={C.textGrey} strokeWidth={2} strokeDasharray="70 110" style={{ opacity: 0 }} />
          <g ref={r('squash')}>
            <g ref={r('cam2')}>
              <g ref={r('truckTurn')}>
                <g ref={r('truckPos')}>
                  <ForkliftSide
                    parts={{
                      mast: r('mast') as never,
                      inner: r('inner') as never,
                      rod: r('rod') as never,
                      chain: r('chain') as never,
                      carriage: r('carriage') as never,
                      wheelF: r('wheelF') as never,
                      wheelR: r('wheelR') as never,
                    }}
                    load={
                      <g ref={r('load')}>
                        <LoadSide kind="cartons" />
                      </g>
                    }
                  />
                </g>
              </g>
              <g ref={r('front')} className="v2-front" style={{ visibility: 'hidden' }}>
                <ForkliftFront parts={{ inner: r('finner') as never, carriage: r('fcarriage') as never }} />
              </g>
            </g>
          </g>
        </svg>

        <svg className="v2-layer v2-map" ref={r('map')} viewBox="0 0 1440 900" aria-hidden="true" focusable="false">
          <rect x={-100} y={-100} width={1640} height={1100} fill={C.hoverLightGrey} />
          <YardMap
            refs={{
              cam: r('mapCam') as never,
              truck: r('mapTruck') as never,
              truckInner: r('mapTruckInner') as never,
              route: r('route') as never,
              reveal: r('reveal') as never,
            }}
          />
        </svg>

        <div className="v2-hero">
          <p ref={r('kicker')} className="v2-kicker">
            {hero.kicker}
          </p>
          <h1 aria-label={hero.headline.join(' ')}>
            {HERO_LINES.map((t) => (
              <span key={t} className="v2-l" data-l="hero" data-text={t} aria-hidden="true" />
            ))}
          </h1>
          <p ref={r('heroSub')} className="v2-sub">
            {hero.sub}
          </p>
          <div ref={r('heroCtas')} className="v2-ctas">
            <a className="v2-link" href={SERVICES.href}>
              {SERVICES.more}
              <Arrow />
            </a>
          </div>
        </div>

        <div ref={r('dark')} className="v2-dark" style={{ visibility: 'hidden' }}>
          <h2 className="v2-bh" aria-label={DARK_LINES.join(' ')}>
            {DARK_LINES.map((t, i) => (
              <span key={t} className="v2-l" aria-hidden="true">
                <span data-l="dark" data-text={t} />
                {i === DARK_LINES.length - 1 && (
                  <span ref={r('darkDot')} className="v2-dot" style={{ opacity: 0 }}>
                    .
                  </span>
                )}
              </span>
            ))}
          </h2>
          <p className="v2-bp">
            <span data-l="darkp" data-text={hero.sub} />
          </p>
          <a ref={r('darkLink')} className="v2-link v2-link--dark v2-blink" href={SERVICES.href}>
            {DARK_LINK}
            <Arrow />
          </a>
          <ul className="v2-svc">
            {pillars.map((pl) => (
              <li key={pl.id} style={{ visibility: 'hidden' }}>
                <a href={pl.href}>
                  <svg viewBox="0 0 44 44" aria-hidden="true" focusable="false">
                    <ServiceIcon id={pl.id} />
                  </svg>
                  <h3 aria-label={pl.name}>
                    <span data-l="svc" data-text={pl.name} aria-hidden="true" />
                  </h3>
                  <span className="v2-rule" />
                  <p>{pl.line}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div ref={r('close')} className="v2-close" style={{ visibility: 'hidden' }}>
          <h2 className="v2-ch" aria-label={CLOSE_LINES.join(' ')}>
            {CLOSE_LINES.map((t, i) => (
              <span key={t} className={`v2-l${i === 0 ? ' v2-red' : ''}`} aria-hidden="true">
                <span data-l="close" data-text={t} />
                {i === CLOSE_LINES.length - 1 && (
                  <span ref={r('closeDot')} className="v2-dot" style={{ opacity: 0 }}>
                    .
                  </span>
                )}
              </span>
            ))}
          </h2>
          <div ref={r('closeFoot')} className="v2-cfoot">
            <p>{CLOSE_SUB}</p>
            <a className="v2-link" href={SERVICES.href}>
              {SERVICES.more}
              <Arrow />
            </a>
          </div>
          <div className="v2-cside">
            <svg viewBox="0 0 44 44" aria-hidden="true" focusable="false">
              <ServiceIcon id="servis" color={C.ink} />
            </svg>
            <h3 aria-label={SIDE_TITLE}>
              <span data-l="side" data-text={SIDE_TITLE} aria-hidden="true" />
            </h3>
            <p ref={r('sidePara')}>{trust[3].text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small line arrow for the text links.
function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3 8 H13 M9 4 L13 8 L9 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
