// V2 Linija. The United Carriers illustrated scroll story, 1:1 in Linde tokens. Flat technical
// vector drawings in side view on a pale ground. The forklift takes a pallet off the rack, turns
// toward the camera, lowers it, drives right while the floor turns into a black aisle, then the view
// tips to top down and the truck follows the aisle to the dock. SVG and GSAP only, the clock is
// useScrollStory. The UI around the drawing is a floating dashboard, one rounded panel on a grey
// page with white cards on top. The cards change with the story chapter, they leave and arrive with
// motion when the chapter changes. Every word is Geist in sentence case.
import { useEffect, useRef, type CSSProperties } from 'react';
import gsap from 'gsap';
import { useScrollStory, clamp01, range } from '../../scroll/useScrollStory';
import { hero, pillars, trust } from '../../content';
import { C } from '../../tokens';
import { ForkliftFront, ForkliftSide, LoadSide, RackSide, ServiceIcon } from './art';
import { YardMap } from './map';
import { Nav } from '../../ui/Nav';
import './v2.css';

const LENGTH = 9000;
// Frame units the black floor is carried below its old bottom edge, 930, so it reaches the panel edge.
const SKIRT = 120;

// The 1440 by 900 drawing sits in the panel as one scaled frame, so the active forklift stays clear of
// the two card columns. Panel coordinates. The yard map starts on the same frame and slides to the
// middle gap between the columns while the view tips.
const FRAME = { x: 327, y: -18, k: 0.86 };
const MAP_END = { x: -10, y: -18, k: 1 };

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
const SERVICES = pillars[2];
const PROMO_TITLE = 'Linde MT15 C'; // from content.ts promo.text, without the price
const STATUS = ['Na rafu', 'Utovar', 'Na putu', 'Isporučeno']; // dummy
const STOPS = ['Ekotehnika, Vrčin', 'Vaše skladište']; // dummy
const DELIVERY = 'Isporuka za 24 sata'; // dummy, from the najam line in content.ts
const MODELS = { n: 96, label: 'Linde modela' }; // from the novi line in content.ts
const WARRANTY = { n: 6, unit: 'meseci', line: 'ili 500 radnih sati garancije', title: 'Linde Approved Trucks' }; // from the polovni line in content.ts
const SIDE_TITLE = 'Servis na terenu'; // dummy
const PROMO_LINK = 'Saznajte više'; // dummy
const [PROMO_NAME, PROMO_PRICE] = hero.promo.text.split(', ');
const CLIENTS = { n: trust[1].count, label: 'klijenata', since: trust[0].text };

// The story chapters. Edges are the existing story beats, the pick off the rack, the turn, the drive
// and the tip to the yard. Each chapter lists the cards on screen, top down, in each column.
const EDGES = [0.1, 0.29, 0.44, 0.8];
const CHAPTERS = [
  { left: ['hero'], right: ['accent'] },
  { left: ['delivery', 'novi'], right: ['promo'] },
  { left: ['delivery', 'polovni'], right: ['gauge'] },
  { left: ['delivery', 'najam'], right: ['clients'] },
  { left: ['delivery', 'servis', 'service'], right: ['route'] },
];
// The rail follows the chapters, so its cards run novi, polovni, najam, servis.
const RAIL = [pillars[0], pillars[3], pillars[1], pillars[2]];
// Where a rail click lands, the middle of its chapter.
const REST = [0.2, 0.36, 0.62, 0.9];
const GAP = 12;

function chapterOf(p: number, cur: number) {
  let c = 0;
  EDGES.forEach((e, i) => {
    if (p >= e) c = i + 1;
  });
  if (cur >= 0 && c !== cur) {
    const edge = c > cur ? EDGES[c - 1] : EDGES[cur - 1];
    if (Math.abs(p - edge) < 0.003) return cur;
  }
  return c;
}

// The gauge, 270 degrees open at the bottom. Radius 78 around (100, 96).
const GAUGE = 'M 44.85 151.15 A 78 78 0 1 1 155.15 151.15';
// The route line in the service tile, 276 by 96.
const ROUTE_LINE = 'M 10 74 C 46 74 58 30 96 38 S 148 82 184 56 S 238 14 266 24';

// The story beat a progress value sits in, for the status chip and the pillar strip.
const beatOf = (p: number) => (p < 0.2 ? 0 : p < 0.44 ? 1 : p < 0.97 ? 2 : 3);

type Els = Record<string, HTMLElement | SVGElement | null>;

export default function Variant2({ reduced }: { reduced: boolean }) {
  const { stageRef, progress, goTo } = useScrollStory({ length: LENGTH, reduced, smoothing: 0.07 });
  const els = useRef<Els>({});
  const r = (k: string) => (el: HTMLElement | SVGElement | null) => {
    els.current[k] = el;
  };

  useEffect(() => {
    const e = els.current as Record<string, any>;
    const frontRods = Array.from(stageRef.current?.querySelectorAll<SVGRectElement>('.v2-front .v2-frod') ?? []);
    const frontChains = Array.from(stageRef.current?.querySelectorAll<SVGLineElement>('.v2-front .v2-fchain') ?? []);
    const stage = stageRef.current as HTMLElement;
    const cardEls = Array.from(stage.querySelectorAll<HTMLElement>('[data-card]'));
    const railEls = Array.from(stage.querySelectorAll<HTMLElement>('.v2-ritem'));

    const route = e.route as SVGPathElement;
    const total = route.getTotalLength();
    e.reveal.setAttribute('stroke-dasharray', `${total} ${total}`);
    const line = e.line as SVGPathElement;
    const lineLen = line.getTotalLength();
    line.setAttribute('stroke-dasharray', `${lineLen} ${lineLen}`);

    const intro = { v: reduced ? 1 : 0 };
    let beat = -1;
    let ch = -1;
    const shown = new Set<string>();
    const isIn = (c: number, id: string) => CHAPTERS[c].left.includes(id) || CHAPTERS[c].right.includes(id);

    // Top of each card in its column for a chapter, cards keep their natural height.
    const layout = (c: number) => {
      const out: Record<string, number> = {};
      [CHAPTERS[c].left, CHAPTERS[c].right].forEach((col) => {
        let y = 0;
        col.forEach((id) => {
          out[id] = y;
          y += (stage.querySelector<HTMLElement>(`[data-card="${id}"]`)?.offsetHeight ?? 0) + GAP;
        });
      });
      return out;
    };

    // Cards that leave drop opacity and lift a little with a slight blur, cards that arrive rise from
    // below, a beat later and staggered. Cards that stay slide to their new place. Not scrubbed.
    const goChapter = (c: number, instant: boolean) => {
      const target = layout(c);
      let n = 0;
      cardEls.forEach((el) => {
        const id = el.dataset.card as string;
        const was = shown.has(id);
        if (isIn(c, id)) {
          const y = target[id];
          if (instant) {
            gsap.killTweensOf(el);
            gsap.set(el, { y, opacity: 1, filter: 'none', visibility: 'visible' });
          } else if (was) {
            gsap.to(el, { y, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
          } else {
            gsap.killTweensOf(el);
            if (el.style.visibility !== 'visible') gsap.set(el, { visibility: 'visible', opacity: 0, y: y + 24, filter: 'blur(3px)' });
            gsap.to(el, {
              y,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.55,
              delay: 0.14 + n * 0.06,
              ease: 'power3.out',
              onComplete: () => {
                gsap.set(el, { filter: 'none' });
              },
            });
            n++;
          }
          el.removeAttribute('aria-hidden');
          shown.add(id);
        } else if (instant) {
          gsap.killTweensOf(el);
          gsap.set(el, { opacity: 0, visibility: 'hidden', filter: 'none' });
          el.setAttribute('aria-hidden', 'true');
          shown.delete(id);
        } else if (was) {
          gsap.killTweensOf(el);
          el.setAttribute('aria-hidden', 'true');
          gsap.to(el, {
            y: '-=16',
            opacity: 0,
            filter: 'blur(4px)',
            duration: 0.45,
            ease: 'power2.out',
            onComplete: () => {
              gsap.set(el, { visibility: 'hidden', filter: 'none' });
            },
          });
          shown.delete(id);
        }
      });
      // The rail, the card of the current chapter grows wider and shows its line.
      railEls.forEach((li, i) => {
        li.toggleAttribute('data-current', i === c - 1);
        li.querySelector('button')?.setAttribute('aria-current', i === c - 1 ? 'step' : 'false');
        const to = i === c - 1 ? 2.6 : 1;
        if (instant) gsap.set(li, { flexGrow: to });
        else gsap.to(li, { flexGrow: to, duration: 0.6, ease: 'power3.out', overwrite: true });
      });
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
      e.ground2.setAttribute('y1', String(gy));
      e.ground2.setAttribute('y2', String(gy));
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

      // The map layer slides from the frame offset to the middle gap while the view tips.
      const mt = io(range(p, 0.83, 0.9));
      e.mapframe.style.transform = `translate(${lerp(FRAME.x, MAP_END.x, mt)}px, ${lerp(FRAME.y, MAP_END.y, mt)}px) scale(${lerp(FRAME.k, MAP_END.k, mt)})`;
      // A panel coloured lane behind the right column hides scene bits in its gaps until the world is gone.
      e.lane2.style.opacity = String(1 - range(p, 0.46, 0.5));
      // A panel coloured band under the strip keeps yard doors out of the gaps between its cards.
      e.foot.style.opacity = String(range(p, 0.9, 0.93));

      // The floor sits inside a panel and the frame is scaled, so a skirt under the floor carries
      // the black down to the panel edge. It grows and retracts with the floor.
      const skirt = SKIRT * k2 * (1 - io(range(p, 0.78, 0.82)));
      e.skirt.setAttribute('x', e.floor.getAttribute('x'));
      e.skirt.setAttribute('width', e.floor.getAttribute('width'));
      e.skirt.setAttribute('y', String(bottom - 0.5));
      e.skirt.setAttribute('height', String(Math.max(0, skirt)));
      e.skirt.style.visibility = e.floor.style.visibility;

      // UI layer. A new chapter swaps the cards, values inside a card follow the scroll.
      const c = chapterOf(p, ch);
      if (c !== ch) {
        goChapter(c, ch < 0 || reduced);
        ch = c;
      }
      const bt = beatOf(p);
      if (bt !== beat) {
        beat = bt;
        e.status.textContent = STATUS[bt];
      }
      const prog = range(p, 0, 0.985);
      e.fill.style.transform = `scaleX(${prog})`;
      e.marker.style.left = `${prog * 100}%`;
      e.models.textContent = String(Math.round(MODELS.n * Math.max(intro.v, range(p, 0, 0.1))));
      e.gauge.setAttribute('stroke-dashoffset', String(1 - io(range(p, 0.29, 0.44))));
      const cn = Math.round(CLIENTS.n * io(range(p, 0.44, 0.58)));
      e.clients.textContent = cn >= 1000 ? '1.000+' : `${cn}+`;
      const rl = io(range(p, 0.8, 0.985));
      line.setAttribute('stroke-dashoffset', String(lineLen * (1 - rl)));
      const tip = line.getPointAtLength(lineLen * rl);
      const tipOn = clamp01((rl - 0.06) / 0.04);
      e.tip.style.opacity = String(tipOn);
      e.tip.setAttribute('cx', String(tip.x));
      e.tip.setAttribute('cy', String(tip.y));
      e.tipDrop.setAttribute('x1', String(tip.x));
      e.tipDrop.setAttribute('x2', String(tip.x));
      e.tipDrop.setAttribute('y1', String(tip.y));
      e.tipDrop.style.opacity = String(tipOn);
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
    document.fonts?.ready.then(() => {
      if (ch >= 0) goChapter(ch, true);
    });
    gsap.ticker.add(tick);
    return () => {
      tw.kill();
      gsap.killTweensOf(cardEls);
      gsap.killTweensOf(railEls);
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
      <div className="v2-panel">
        <div className="v2-frame" style={{ transform: `translate(${FRAME.x}px, ${FRAME.y}px) scale(${FRAME.k})` }}>
          <svg className="v2-layer" ref={r('side')} viewBox="0 0 1440 900" aria-hidden="true" focusable="false">
            <defs>
              <filter id="v2-mb" x="-20%" y="-5%" width="140%" height="110%">
                <feGaussianBlur ref={r('mb')} stdDeviation="0 0" />
              </filter>
            </defs>
            <line ref={r('ground')} x1={0} x2={1440} y1={860} y2={860} stroke={C.shadeGrey} strokeWidth={1} />
            <line ref={r('ground2')} x1={-1200} x2={0} y1={860} y2={860} stroke={C.shadeGrey} strokeWidth={1} />
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
            <rect ref={r('skirt')} x={0} y={900} width={0} height={0} fill={C.ink} />
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
        </div>

        <div className="v2-frame" ref={r('mapframe')} style={{ transform: `translate(${FRAME.x}px, ${FRAME.y}px) scale(${FRAME.k})` }}>
          <svg className="v2-layer v2-map" ref={r('map')} viewBox="0 0 1440 900" aria-hidden="true" focusable="false">
            <rect x={-3000} y={-3000} width={7500} height={7500} fill={C.hoverLightGrey} />
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
        </div>

        <div className="v2-lane" ref={r('lane2')} aria-hidden="true" />
        <div className="v2-foot" ref={r('foot')} aria-hidden="true" />

        <Nav theme="segment" className="v2-topnav" />

        <h1 className="v2-sr">{hero.headline.join(' ')}</h1>

        <div className="v2-col v2-left">
          <section className="v2-card v2-herocard v2-rise" data-card="hero" style={{ '--i': 1 } as CSSProperties}>
            <p className="v2-chip">
              <i className="v2-dot" />
              {hero.kicker}
            </p>
            <p className="v2-h1" aria-hidden="true">
              {hero.headline.join(' ')}
            </p>
            <p className="v2-sub">{hero.sub}</p>
            <a className="v2-link" href={SERVICES.href}>
              {SERVICES.more}
              <Arrow />
            </a>
          </section>

          <section className="v2-card v2-delivery" data-card="delivery" aria-label="Isporuka">
            <div className="v2-row">
              <h2>{PROMO_TITLE}</h2>
              <p className="v2-chip v2-chip--sm">
                <i className="v2-dot" />
                <span ref={r('status')}>{STATUS[0]}</span>
              </p>
            </div>
            <div className="v2-bar" aria-hidden="true">
              <span ref={r('fill')} className="v2-bar-fill" />
              <span ref={r('marker')} className="v2-bar-mark" />
            </div>
            <ul className="v2-stops">
              {STOPS.map((t, i) => (
                <li key={t} className={i === 1 ? 'v2-stop--end' : ''}>
                  {t}
                </li>
              ))}
            </ul>
            <p className="v2-note">{DELIVERY}</p>
          </section>

          {[
            ['novi', pillars[0]],
            ['polovni', pillars[3]],
            ['najam', pillars[1]],
            ['servis', pillars[2]],
          ].map(([id, pl]) => (
            <section key={id as string} className="v2-card v2-pillar" data-card={id as string} aria-label={(pl as (typeof pillars)[number]).name}>
              <svg viewBox="0 0 44 44" aria-hidden="true" focusable="false">
                <ServiceIcon id={(pl as (typeof pillars)[number]).id} color={C.ink} />
              </svg>
              <h2>{(pl as (typeof pillars)[number]).name}</h2>
              <p>{(pl as (typeof pillars)[number]).line}</p>
              <a className="v2-link" href={(pl as (typeof pillars)[number]).href}>
                {(pl as (typeof pillars)[number]).cta}
                <Arrow />
              </a>
            </section>
          ))}

          <section className="v2-card v2-contact" data-card="service" aria-label={hero.service.label}>
            <span className="v2-avatar" aria-hidden="true">
              <Headset />
            </span>
            <div className="v2-who">
              <h2>{hero.service.label}</h2>
              <p>{hero.service.number}</p>
            </div>
            <a className="v2-icobtn" href={hero.service.tel} aria-label={`Pozovite hitan servis, ${hero.service.number}`} title={hero.service.number}>
              <Icon d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
            </a>
          </section>
        </div>

        <div className="v2-col v2-right">
          <section className="v2-card v2-accent v2-rise" data-card="accent" style={{ '--i': 4 } as CSSProperties} aria-label="Linde modeli">
            <svg className="v2-wave" viewBox="0 0 316 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M0 0 H316 V16 C 264 36 224 2 166 14 S 68 36 0 14 Z" fill={C.primary700} />
            </svg>
            <svg className="v2-fork" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
              <ServiceIcon id="novi" color={C.white} />
            </svg>
            <p className="v2-big">
              <span ref={r('models')}>{MODELS.n}</span>
            </p>
            <p className="v2-cap">{MODELS.label}</p>
          </section>

          <section className="v2-card v2-promo" data-card="promo" aria-label="Akcija">
            <p className="v2-chip v2-chip--sm">
              <i className="v2-dot" />
              {hero.promo.lead.replace('.', '')}
            </p>
            <h2>{PROMO_NAME}</h2>
            <p className="v2-big v2-big--price">{PROMO_PRICE}</p>
            <a className="v2-link" href={hero.promo.href}>
              {PROMO_LINK}
              <Arrow />
            </a>
          </section>

          <section className="v2-card v2-gauge" data-card="gauge" aria-label={WARRANTY.title}>
            <h2>{WARRANTY.title}</h2>
            <div className="v2-arc">
              <svg viewBox="0 0 200 160" aria-hidden="true" focusable="false">
                <path d={GAUGE} fill="none" stroke={C.shadeGrey} strokeWidth={14} strokeLinecap="round" />
                <path ref={r('gauge')} d={GAUGE} pathLength={1} strokeDasharray={1} strokeDashoffset={1} fill="none" stroke={C.lindeRed} strokeWidth={14} strokeLinecap="round" />
              </svg>
              <p className="v2-big v2-big--md">
                {WARRANTY.n} {WARRANTY.unit}
              </p>
            </div>
            <p className="v2-cap v2-cap--grey">{WARRANTY.line}</p>
          </section>

          <section className="v2-card v2-clients" data-card="clients" aria-label="Klijenti">
            <p className="v2-big v2-big--red">
              <span ref={r('clients')}>0+</span>
            </p>
            <p className="v2-cap">{CLIENTS.label}</p>
            <p className="v2-cap v2-cap--grey">{CLIENTS.since}</p>
          </section>

          <section className="v2-card v2-routecard" data-card="route" aria-label={SIDE_TITLE}>
            <h2>{SIDE_TITLE}</h2>
            <p className="v2-cap v2-cap--grey">{trust[3].text}</p>
            <svg className="v2-line" viewBox="0 0 276 96" aria-hidden="true" focusable="false">
              <path d={ROUTE_LINE} fill="none" stroke={C.shadeGrey} strokeWidth={3} strokeLinecap="round" />
              <path ref={r('line')} d={ROUTE_LINE} fill="none" stroke={C.lindeRed} strokeWidth={3} strokeLinecap="round" />
              <line x1={10} x2={10} y1={74} y2={96} stroke={C.shadeGrey} strokeWidth={1.5} strokeDasharray="3 4" />
              <line ref={r('tipDrop')} x1={266} x2={266} y1={24} y2={96} stroke={C.shadeGrey} strokeWidth={1.5} strokeDasharray="3 4" />
              <circle cx={10} cy={74} r={6} fill={C.white} stroke={C.lindeRed} strokeWidth={2.5} />
              <circle ref={r('tip')} cx={10} cy={74} r={6} fill={C.white} stroke={C.lindeRed} strokeWidth={2.5} />
            </svg>
          </section>
        </div>

        <ul className="v2-strip" aria-label="Poglavlja">
          {RAIL.map((pl, i) => (
            <li key={pl.id} className="v2-ritem v2-rise" style={{ '--i': 7 + i } as CSSProperties}>
              <button type="button" className="v2-pcard" onClick={() => goTo(REST[i])}>
                <span className="v2-ptext">
                  <strong>{pl.name}</strong>
                  <span className="v2-pl">{pl.line}</span>
                </span>
                <svg viewBox="0 0 44 44" aria-hidden="true" focusable="false">
                  <ServiceIcon id={pl.id} color={C.ink} />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// A 24 unit line icon from one path.
function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

// The sales avatar, a headset line drawing, never a photo of a person.
function Headset() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <rect x="3.5" y="13" width="3.8" height="5.5" rx="1.6" />
      <rect x="16.7" y="13" width="3.8" height="5.5" rx="1.6" />
      <path d="M18.5 18.5c0 1.6-1.6 2.5-4 2.5h-1.5" />
    </svg>
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
