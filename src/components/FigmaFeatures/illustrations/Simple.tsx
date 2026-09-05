import lines from './svg/imgGroup2085662421.svg?raw';
import { B, Layer, Stage, Strokes } from './Stage';
import { all, count, draw, one, roll, traveller, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "Crypto-to-fiat payments made simple" (Figma 2409:2462, 747×334): BTC flows along a line through
 * the Remittix hub and an exchange into a bank receipt, over a lavender blob ringed by orbits.
 */
export function Simple() {
  return (
    <Stage id="simple" width={747} height={334} className="ff__art ff__art--simple il-simple">
      <Layer className="il-simple__blob" src={B('imgGroup2085662428.svg')} x={-71} y={-537} w={949} h={1050} />
      <span className="il-simple__ring il-ring" style={{ left: 143, top: -93, width: 395, height: 395 }} />
      <Layer className="il-simple__haze" src={B('ellipse3438.webp')} x={219} y={-190} w={584} h={584} />
      <span className="il-simple__ring il-ring il-ring--bold" style={{ left: 258, top: -154, width: 443, height: 443 }} />
      <span className="il-simple__orbit" style={{ left: 258, top: -154, width: 443, height: 443 }}>
        <i />
      </span>

      {/* Dashed rails from each processor into the Remittix hub; the chosen one carries the route. */}
      <svg className="il-simple__rails" viewBox="0 0 747 334" width={747} height={334} style={{ left: 0, top: 0 }} aria-hidden="true">
        <path className="il-simple__rail" d="M297 63 C 297 112, 284 142, 278 166" />
        <path className="il-simple__rail" d="M236 116 C 246 140, 252 158, 255 172" />
        <path className="il-simple__rail" d="M190 166 C 210 172, 228 182, 243 189" />
      </svg>
      <Strokes className="il-simple__lines" svg={lines} x={132} y={138} w={272} h={121.75} />
      <i className="il-simple__beam" />
      <i className="il-simple__railDot" style={{ left: 331, top: 27 }} />
      <i className="il-simple__railDot" style={{ left: 249, top: 76 }} />
      <i className="il-simple__railDot" style={{ left: 184, top: 147 }} />

      <div className="il-simple__btc il-simple__node" style={{ left: 17, top: 239 }}>
        <img src={B('imgFrame2085662026.svg')} alt="" width={30.8} height={30.8} />
        <span>0.0128 BTC</span>
      </div>
      <Layer className="il-simple__logo" src={B('imgFrame2085662273.svg')} x={257} y={31} w={80} h={32} />
      <Layer className="il-simple__logo" src={B('imgFrame2085662272.svg')} x={149} y={80} w={106} h={36} />
      <div className="il-simple__wise il-simple__logo" style={{ left: 112, top: 151 }}>
        <span style={{ maskImage: `url(${B('imgRectangle34624647.png')})`, WebkitMaskImage: `url(${B('imgRectangle34624647.png')})` }} />
      </div>
      <div className="il-simple__hub il-simple__node" style={{ left: 242, top: 166 }}>
        <i className="il-simple__hubHalo" />
        <img src={B('imgGroup3.svg')} alt="" width={35.5} height={18.3} />
      </div>
      <div className="il-simple__swap" style={{ left: 410, top: 130 }}>
        <img src={B('imgMoveHorizontal.svg')} alt="" width={16} height={13.4} />
      </div>

      <div className="il-simple__stack" style={{ left: 425, top: 34 }}>
        <div className="il-rc">
          <div className="il-rc__row il-rc__head">
            <span className="il-rc__bank">
              <img src={B('imgFrame2085662286.svg')} alt="" width={24} height={24} />
              <span>
                <b>New Bank</b>
                <small>EUR ····4417</small>
              </span>
            </span>
            <span className="il-rc__badge">
              <img src={B('imgEllipse3432.svg')} alt="" width={2.7} height={2.7} />
              Settled
            </span>
          </div>
          <div className="il-rc__row">
            <span className="il-rc__label">Recipient receives</span>
            <span className="il-rc__amount">
              <b className="il-count" data-count="eur">€1,240</b>
              <i>.00</i>
            </span>
          </div>
          <div className="il-rc__row il-rc__rule" />
          <div className="il-rc__row il-rc__line"><span>Rate</span><span className="il-mono" data-count="rate">1 BTC = €96,840</span></div>
          <div className="il-rc__row il-rc__line"><span>FX fee</span><span className="il-mono">0.00</span></div>
          <div className="il-rc__row il-rc__line"><span>Arrived in</span><span className="il-mono" data-count="arrived">4.2 sec</span></div>
        </div>
        <div className="il-toast">
          <img src={B('imgFrame2085662288.svg')} alt="" width={20} height={20} />
          <span>
            Credited to bank account
            <small className="il-mono" data-count="time">TODAY · 14:02</small>
          </span>
        </div>
      </div>
    </Stage>
  );
}

export const simpleMotion: IllustrationMotion = {
  build(tl, il, at, gsap) {
    // The scene settles from the back forward: the blob and orbit rings, the BTC chip, the line
    // drawing itself with its stops appearing as it passes, the hub and exchange, the network
    // logos, then the receipt rising and filling row by row with its figures counting, and the
    // toast last.
    tl.from(one(il, '.il-simple__blob'), { opacity: 0, scale: 0.94, duration: 1.4, ease: 'power2.out', transformOrigin: '40% 60%' }, at);
    tl.from(all(il, '.il-simple__ring, .il-simple__haze'), { opacity: 0, scale: 0.92, duration: 1.2, stagger: 0.1, ease: 'power2.out', transformOrigin: '50% 50%' }, at + 0.1);
    tl.from(one(il, '.il-simple__btc'), { ...RISE, y: 12 }, at + 0.3);
    draw(tl, gsap, all<SVGGeometryElement>(il, '.il-simple__lines path'), at + 0.45, 1.0);
    draw(tl, gsap, all<SVGGeometryElement>(il, '.il-simple__rail'), at + 0.9, 0.6, 0.1);
    tl.set(all(il, '.il-simple__rail'), { strokeDasharray: '3 4' }, at + 1.75);
    const dots = all<SVGCircleElement>(il, '.il-simple__lines circle').sort((a, b) => Number(a.getAttribute('cx')) - Number(b.getAttribute('cx')));
    dots.forEach((dot, i) => tl.from(dot, { opacity: 0, scale: 0.4, duration: 0.4, ease: EASE, transformOrigin: '50% 50%' }, at + 0.5 + i * 0.8));
    tl.from(all(il, '.il-simple__logo'), { ...RISE, stagger: 0.08 }, at + 0.6);
    tl.from(one(il, '.il-simple__hub'), { scale: 0.9, opacity: 0, duration: 0.7, ease: EASE, transformOrigin: '50% 50%' }, at + 1.0);
    tl.from(one(il, '.il-simple__swap'), { scale: 0.6, opacity: 0, duration: 0.6, ease: EASE, transformOrigin: '50% 50%' }, at + 1.4);
    tl.from(one(il, '.il-rc'), { y: 24, opacity: 0, duration: 0.9, ease: EASE }, at + 1.3);
    tl.from(all(il, '.il-rc__row'), { ...RISE, y: 8, duration: 0.6, stagger: 0.06 }, at + 1.5);
    tl.from(one(il, '.il-rc__rule'), { scaleX: 0, duration: 0.6, ease: EASE, transformOrigin: '0% 50%' }, at + 1.7);
    count(tl, one(il, '[data-count="eur"]'), 0, 1240, at + 1.6, 0.9, (n) => `€${Math.round(n).toLocaleString('en-US')}`);
    count(tl, one(il, '[data-count="rate"]'), 0, 96840, at + 1.8, 0.8, (n) => `1 BTC = €${Math.round(n).toLocaleString('en-US')}`);
    count(tl, one(il, '[data-count="arrived"]'), 0, 4.2, at + 1.9, 0.7, (n) => `${n.toFixed(1)} sec`);
    tl.from(one(il, '.il-rc__badge'), { opacity: 0, scale: 0.8, duration: 0.5, ease: EASE, transformOrigin: '50% 50%' }, at + 2.3);
    tl.from(one(il, '.il-toast'), { y: 16, opacity: 0, duration: 0.8, ease: EASE }, at + 2.4);
  },
  idle: (gsap, il) => simpleMotion.variants[0].idle(gsap, il),
  variants: [],
};

type G = Parameters<MotionVariant['idle']>[0];
type TL = gsap.core.Timeline;

const HUB = { x: 273, y: 197 };
/** A rail lights: brighter with a soft white glow. It never moves. */
const LIT = { filter: 'brightness(1.25) drop-shadow(0 0 9px rgba(255,255,255,0.75))' };
const UNLIT = { filter: 'brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0))' };
const RAIL_REST = 'rgba(255,255,255,0.7)';
const RAIL_DIM = 0.45;
const RAIL_LIVE = '#4042d1';

/** Everything that moves between beats: the rings turn and the blob drifts. */
const ambient = (gsap: G, il: HTMLElement) => {
  const idle = gsap.timeline();
  all(il, '.il-simple__ring').forEach((r, i) => idle.to(r, { rotation: i ? -360 : 360, duration: 90 + i * 30, repeat: -1, ease: 'none', transformOrigin: '50% 50%' }, 0));
  idle.to(one(il, '.il-simple__blob'), { x: 10, y: 6, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  return idle;
};

/** The scene's moving parts, looked up once. */
const scene = (gsap: G, il: HTMLElement) => {
  const svg = one<SVGSVGElement>(il, '.il-simple__lines svg');
  const path = one<SVGPathElement>(svg, 'path');
  const len = path.getTotalLength();
  // A short highlight that can run the line ahead of the packet.
  const glow = path.cloneNode() as SVGPathElement;
  glow.setAttribute('stroke', '#b3b5f5');
  glow.setAttribute('stroke-width', '2.5');
  glow.setAttribute('stroke-linecap', 'round');
  glow.style.strokeDasharray = `34 ${len}`;
  glow.style.strokeDashoffset = String(len + 34);
  glow.style.opacity = '0';
  path.parentNode!.insertBefore(glow, path.nextSibling);
  return {
    svg,
    path,
    len,
    glow,
    logos: all(il, '.il-simple__logo'),
    rails: all<SVGPathElement>(il, '.il-simple__rail'),
    railDots: all(il, '.il-simple__railDot'),
    beam: one(il, '.il-simple__beam'),
    btc: one(il, '.il-simple__btc'),
    coin: one(il, '.il-simple__btc img'),
    hub: one(il, '.il-simple__hub'),
    halo: one(il, '.il-simple__hubHalo'),
    swap: one(il, '.il-simple__swap'),
    rows: all(il, '.il-rc__row'),
    badge: one(il, '.il-rc__badge'),
    badgeDot: one(il, '.il-rc__badge img'),
    toast: one(il, '.il-toast'),
    book: ledger(gsap, il),
    hubAt: 0,
  };
};
type Scene = ReturnType<typeof scene>;
const sceneOf = (gsap: G, il: HTMLElement): Scene => {
  const sc: Scene = scene(gsap, il);
  sc.hubAt = hubFraction(sc);
  sc.rails.forEach((r: SVGPathElement) => (r.style.opacity = String(RAIL_DIM)));
  return sc;
};

/** The receipt state every variant advances: another €10, one more minute, a fresh arrival time. */
function ledger(gsap: G, il: HTMLElement) {
  const amount = one(il, '[data-count="eur"]');
  const arrived = one(il, '[data-count="arrived"]');
  const clock = one(il, '[data-count="time"]');
  let eur = 1240;
  let minutes = 14 * 60 + 2;
  return {
    amount,
    arrived,
    clock,
    settle(add = 10) {
      eur += add;
      minutes += 1;
      const seconds = Math.round((3.6 + ((eur / 10) % 7) * 0.2) * 10) / 10;
      roll(gsap, amount, `€${eur.toLocaleString('en-US')}`);
      roll(gsap, arrived, `${seconds.toFixed(1)} sec`);
      roll(gsap, clock, `TODAY · ${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
      gsap.fromTo(amount, { color: '#4042d1' }, { color: '#000', duration: 1.2, ease: 'power1.out', delay: 0.35 });
    },
  };
}

/** Where along the main line the hub sits (fraction of its length), found once by sampling. */
const hubFraction = (sc: Scene) => {
  const target = { x: HUB.x - 132, y: HUB.y - 138 }; // hub centre in the line's own coordinates
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i <= 400; i++) {
    const s = (i / 400) * sc.len;
    const q = sc.path.getPointAtLength(s);
    const d = (q.x - target.x) ** 2 + (q.y - target.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i / 400;
    }
  }
  return best;
};
/** A rail is queried: the pill glows, its rail turns indigo and its dashes flow out from the hub. */
const engage = (story: TL, sc: Scene, i: number, t: number, duration: number) =>
  story
    .to(sc.logos[i], { ...LIT, duration: 0.3, ease: 'power2.out' }, t)
    .to(sc.rails[i], { stroke: RAIL_LIVE, opacity: 1, duration: 0.25 }, t)
    .to(sc.rails[i], { strokeDashoffset: `+=${Math.round(duration * 26)}`, duration, ease: 'none' }, t);
/** The rail lets go. */
const disengage = (story: TL, sc: Scene, i: number, t: number) =>
  story.to(sc.logos[i], { ...UNLIT, duration: 0.6, ease: 'power2.inOut' }, t).to(sc.rails[i], { stroke: RAIL_REST, opacity: RAIL_DIM, duration: 0.6 }, t);
/** The hub asks a processor: a light runs up the rail to the pill, and the pill answers with a light back. */
const query = (story: TL, sc: Scene, i: number, t: number) =>
  story
    .fromTo(sc.beam, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.12 }, t)
    .to(sc.beam, { motionPath: { path: sc.rails[i], align: sc.rails[i], alignOrigin: [0.5, 0.5], start: 1, end: 0 }, duration: 0.45, ease: 'power2.out' }, t)
    .to(sc.beam, { opacity: 0, duration: 0.1 }, t + 0.5)
    .fromTo(sc.beam, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.1 }, t + 0.75)
    .to(sc.beam, { motionPath: { path: sc.rails[i], align: sc.rails[i], alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 0.4, ease: 'power2.in' }, t + 0.75)
    .to(sc.beam, { opacity: 0, scale: 0.4, duration: 0.1 }, t + 1.1)
    .fromTo(sc.halo, { scale: 1, opacity: 0.5 }, { scale: 1.7, opacity: 0, duration: 0.8, ease: 'power2.out', transformOrigin: '50% 50%' }, t + 1.15);
/** The packet runs a stretch of the main line with a highlight ahead of it. */
const run = (story: TL, sc: Scene, dot: SVGCircleElement, from: number, to: number, t: number, duration: number, ease: string) =>
  story
    .set(dot, { opacity: 1 }, t)
    .to(dot, { motionPath: { path: sc.path, align: sc.path, alignOrigin: [0.5, 0.5], start: from, end: to }, duration, ease }, t)
    .set(sc.glow, { opacity: 1 }, t)
    .fromTo(sc.glow, { strokeDashoffset: sc.len + 34 - from * sc.len }, { strokeDashoffset: sc.len + 34 - to * sc.len - 34, duration, ease }, t - 0.04)
    .to(sc.glow, { opacity: 0, duration: 0.2 }, t + duration - 0.1);
/** The exchange turns and the receipt takes the payment: rows ripple, figures roll, the badge blinks, the toast nods. */
const land = (story: TL, sc: Scene, t: number, add = 10) =>
  story
    .to(sc.swap, { rotation: '+=180', duration: 0.5, ease: 'power3.inOut', transformOrigin: '50% 50%' }, t - 0.15)
    .fromTo(sc.rows, { y: 0 }, { y: -2, duration: 0.18, stagger: 0.05, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t)
    .add(() => sc.book.settle(add), t + 0.1)
    .fromTo(sc.badgeDot, { opacity: 1 }, { opacity: 0.15, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, t + 0.2)
    .fromTo(sc.toast, { y: 0 }, { y: -3, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t + 0.5);
/**
 * The whole journey: the coin sends, the packet runs to the hub, the hub queries a processor up
 * its rail and gets an answer back, then the packet carries on to the receipt and lands.
 */
const journey = (story: TL, sc: Scene, dot: SVGCircleElement, rail: number, t: number) => {
  const f = sc.hubAt;
  story.fromTo(sc.coin, { rotation: 0 }, { rotation: 360, duration: 0.7, ease: 'power2.inOut', transformOrigin: '50% 50%' }, t);
  run(story, sc, dot, 0, f, t + 0.2, 0.8, 'power2.in');
  story.to(dot, { opacity: 0, duration: 0.15 }, t + 0.95);
  engage(story, sc, rail, t + 1.0, 1.4);
  query(story, sc, rail, t + 1.0);
  run(story, sc, dot, f, 1, t + 2.25, 0.8, 'power2.out');
  story.to(dot, { opacity: 0, duration: 0.15 }, t + 3.0);
  disengage(story, sc, rail, t + 2.5);
  land(story, sc, t + 3.05);
  return story;
};

simpleMotion.variants = [
  {
    name: 'Routed',
    blurb: 'One journey: the coin sends, the packet runs to the hub and waits while the hub asks a processor up its rail and gets an answer back, then it carries on to the receipt and lands. A different rail each time.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      let n = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.2, onRepeat: () => { n = (n + 1) % 3; } });
      story.add(() => journey(gsap.timeline(), sc, dot, n, 0), 0);
      story.to({}, { duration: 3.8 }, 0); // the beat's length; the journey itself is built when it runs
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Best rate',
    blurb: 'At the hub all three processors are asked at once: every rail flows and every pill glows, then two dim and the best one holds while its answer returns, and the packet takes that route on to the receipt.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      let n = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.2, onRepeat: () => { n = (n + 1) % 3; } });
      story.add(() => {
        const b = gsap.timeline();
        b.fromTo(sc.coin, { rotation: 0 }, { rotation: 360, duration: 0.7, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0);
        run(b, sc, dot, 0, sc.hubAt, 0.2, 0.8, 'power2.in');
        b.to(dot, { opacity: 0, duration: 0.15 }, 0.95);
        [0, 1, 2].forEach((i) => engage(b, sc, i, 1.0 + i * 0.08, 0.9));
        [0, 1, 2].filter((i) => i !== n).forEach((i) => disengage(b, sc, i, 1.7));
        query(b, sc, n, 1.75);
        run(b, sc, dot, sc.hubAt, 1, 3.0, 0.8, 'power2.out');
        b.to(dot, { opacity: 0, duration: 0.15 }, 3.75);
        disengage(b, sc, n, 3.2);
        land(b, sc, 3.8);
      }, 0);
      story.to({}, { duration: 4.5 }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Split',
    blurb: 'A larger payment splits at the hub: two processors are queried and both answer, two packets leave the hub a beat apart and the receipt takes them one after another.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dots = [traveller(sc.svg, '#4042d1', 3.5), traveller(sc.svg, '#4042d1', 3.5)];
      let n = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.2, onRepeat: () => { n = (n + 1) % 3; } });
      story.add(() => {
        const a = n;
        const c = (n + 1) % 3;
        const b = gsap.timeline();
        b.fromTo(sc.coin, { rotation: 0 }, { rotation: 360, duration: 0.7, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0);
        run(b, sc, dots[0], 0, sc.hubAt, 0.2, 0.8, 'power2.in');
        b.to(dots[0], { opacity: 0, duration: 0.15 }, 0.95);
        engage(b, sc, a, 1.0, 1.4);
        engage(b, sc, c, 1.2, 1.4);
        query(b, sc, a, 1.0);
        b.add(() => {
          const q = gsap.timeline();
          query(q, sc, c, 0);
        }, 1.35);
        run(b, sc, dots[0], sc.hubAt, 1, 2.5, 0.8, 'power2.out');
        run(b, sc, dots[1], sc.hubAt, 1, 2.85, 0.8, 'power2.out');
        b.to(dots[0], { opacity: 0, duration: 0.15 }, 3.25).to(dots[1], { opacity: 0, duration: 0.15 }, 3.6);
        disengage(b, sc, a, 2.7);
        disengage(b, sc, c, 2.9);
        land(b, sc, 3.3, 10);
        land(b, sc, 3.7, 10);
      }, 0);
      story.to({}, { duration: 4.6 }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Live receipt',
    blurb: 'The routed journey with the receipt reporting live: the badge drops to PENDING as the coin sends, "Arrived in" counts up while the packet travels and the processor answers, and everything settles on landing.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      const badgeText = sc.badge.lastChild as Text;
      let n = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.2, onRepeat: () => { n = (n + 1) % 3; } });
      story.add(() => {
        const timer = { t: 0 };
        const b = gsap.timeline();
        b.add(() => { badgeText.textContent = 'Pending'; }, 0);
        b.fromTo(sc.badge, { backgroundColor: '#f1fbf6', borderColor: '#d9f1e6', color: '#02774d' }, { backgroundColor: '#f3f4f6', borderColor: '#e2e5e9', color: '#7c858d', duration: 0.3 }, 0);
        b.fromTo(timer, { t: 0 }, { t: 4.2, duration: 2.9, ease: 'none', onUpdate: () => { sc.book.arrived.textContent = `${timer.t.toFixed(1)} sec`; } }, 0.2);
        journey(b, sc, dot, n, 0);
        b.add(() => { badgeText.textContent = 'Settled'; }, 3.05);
        b.to(sc.badge, { backgroundColor: '#f1fbf6', borderColor: '#d9f1e6', color: '#02774d', duration: 0.3 }, 3.05);
      }, 0);
      story.to({}, { duration: 3.8 }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Throughput',
    blurb: 'Steady volume: a packet leaves every couple of seconds and passes straight through, the hub answering each with a quick rail flash on alternating processors, and the receipt climbs €10 on each landing.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      let n = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.9, delay: 1.2, onRepeat: () => { n = (n + 1) % 3; } });
      story.add(() => {
        const b = gsap.timeline();
        run(b, sc, dot, 0, 1, 0, 1.5, 'power1.inOut');
        b.to(dot, { opacity: 0, duration: 0.15 }, 1.45);
        engage(b, sc, n, 0.55, 0.6);
        b.fromTo(sc.halo, { scale: 1, opacity: 0.45 }, { scale: 1.6, opacity: 0, duration: 0.7, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.7);
        disengage(b, sc, n, 1.2);
        land(b, sc, 1.55);
      }, 0);
      story.to({}, { duration: 2.2 }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
];
