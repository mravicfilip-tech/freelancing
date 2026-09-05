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
  };
};
type Scene = ReturnType<typeof scene>;

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

/** A rail takes the route: its pill glows, its dashes turn indigo and flow toward the hub. */
const engage = (story: TL, sc: Scene, i: number, t: number, duration: number) =>
  story
    .to(sc.logos[i], { ...LIT, duration: 0.35, ease: 'power2.out' }, t)
    .to(sc.rails[i], { stroke: RAIL_LIVE, opacity: 1, duration: 0.3 }, t)
    .to(sc.rails[i], { strokeDashoffset: `-=${Math.round(duration * 26)}`, duration, ease: 'none' }, t);
/** The rail lets go. */
const disengage = (story: TL, sc: Scene, i: number, t: number) =>
  story.to(sc.logos[i], { ...UNLIT, duration: 0.6, ease: 'power2.inOut' }, t).to(sc.rails[i], { stroke: RAIL_REST, duration: 0.6 }, t);
/** A small light rides the rail from the pill into the hub, which answers with a ring. */
const beam = (story: TL, sc: Scene, i: number, t: number, duration = 0.7) =>
  story
    .fromTo(sc.beam, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.15 }, t)
    .to(sc.beam, { motionPath: { path: sc.rails[i], align: sc.rails[i], alignOrigin: [0.5, 0.5] }, duration, ease: 'power2.in' }, t)
    .to(sc.beam, { opacity: 0, scale: 0.4, duration: 0.15 }, t + duration - 0.05)
    .fromTo(sc.halo, { scale: 1, opacity: 0.5 }, { scale: 1.7, opacity: 0, duration: 0.9, ease: 'power2.out', transformOrigin: '50% 50%' }, t + duration);
/** The packet runs the line, with a highlight just ahead of it; the coin spins as it sends. */
const send = (story: TL, sc: Scene, dot: SVGCircleElement, t: number, duration = 1.4) =>
  story
    .fromTo(sc.coin, { rotation: 0 }, { rotation: 360, duration: 0.7, ease: 'power2.inOut', transformOrigin: '50% 50%' }, t - 0.2)
    .set(dot, { opacity: 1 }, t)
    .to(dot, { motionPath: { path: sc.path, align: sc.path, alignOrigin: [0.5, 0.5] }, duration, ease: 'power2.inOut' }, t)
    .to(dot, { opacity: 0, duration: 0.2 }, t + duration - 0.05)
    .set(sc.glow, { opacity: 1 }, t)
    .fromTo(sc.glow, { strokeDashoffset: sc.len + 34 }, { strokeDashoffset: -34, duration, ease: 'power2.inOut' }, t - 0.06)
    .to(sc.glow, { opacity: 0, duration: 0.2 }, t + duration - 0.1);
/** The exchange turns and the receipt takes the payment: rows ripple, figures roll, the badge blinks, the toast nods. */
const land = (story: TL, sc: Scene, t: number, add = 10) =>
  story
    .to(sc.swap, { rotation: '+=180', duration: 0.5, ease: 'power3.inOut', transformOrigin: '50% 50%' }, t - 0.15)
    .fromTo(sc.rows, { y: 0 }, { y: -2, duration: 0.18, stagger: 0.05, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t)
    .add(() => sc.book.settle(add), t + 0.1)
    .fromTo(sc.badgeDot, { opacity: 1 }, { opacity: 0.15, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, t + 0.2)
    .fromTo(sc.toast, { y: 0 }, { y: -3, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t + 0.5);

simpleMotion.variants = [
  {
    name: 'Payment',
    blurb: 'One rail takes the route each beat: its pill glows and its dashed rail flows indigo into the hub, a light rides the rail in and the hub rings, then the packet runs the line and the receipt takes the payment.',
    idle(gsap, il) {
      const sc = scene(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      let n = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.6, delay: 1.2, onRepeat: () => { n = (n + 1) % 3; } });
      // The rail changes each beat, so its tweens are built when the beat runs.
      story.add(() => {
        const beat = gsap.timeline();
        engage(beat, sc, n, 0, 1.6);
        beam(beat, sc, n, 0.5, 0.7);
        disengage(beat, sc, n, 2.6);
      }, 0);
      send(story, sc, dot, 1.3);
      land(story, sc, 2.8);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Batch',
    blurb: 'Three payments settle as a batch, one per rail: stripe, coinbase and wise light in turn, each rail flows and sends its light into the hub as its packet runs the line, and the receipt climbs €30.',
    idle(gsap, il) {
      const sc = scene(gsap, il);
      const dots = [0, 1, 2].map(() => traveller(sc.svg, '#4042d1', 3));
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.2, delay: 1.2 });
      dots.forEach((d, i) => {
        const t = i * 0.55;
        engage(story, sc, i, t, 1.4);
        beam(story, sc, i, t + 0.15, 0.6);
        send(story, sc, d, t + 0.45);
        disengage(story, sc, i, t + 1.7);
        land(story, sc, t + 1.9, 10);
      });
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Route search',
    blurb: 'The route is negotiated: the rails flow one after another as the hub tries each, the winning rail holds its glow and sends its light in, then the payment runs the line to the receipt.',
    idle(gsap, il) {
      const sc = scene(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.8, delay: 1.2 });
      [0, 1].forEach((i) => {
        engage(story, sc, i, i * 0.5, 0.5);
        disengage(story, sc, i, i * 0.5 + 0.5);
      });
      engage(story, sc, 2, 1.0, 1.8);
      beam(story, sc, 2, 1.3, 0.7);
      send(story, sc, dot, 2.1);
      land(story, sc, 3.6);
      disengage(story, sc, 2, 3.4);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Live receipt',
    blurb: 'A rail takes the route and a status dot blinks beside its pill while the transfer is pending; the badge drops to PENDING, "Arrived in" counts up live as the packet travels, and all of it turns settled on landing.',
    idle(gsap, il) {
      const sc = scene(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      const badgeText = sc.badge.lastChild as Text;
      const timer = { t: 0 };
      let n = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 3.8, delay: 1.2, onRepeat: () => { n = (n + 1) % 3; } });
      story
        .add(() => {
          badgeText.textContent = 'Pending';
          const beat = gsap.timeline();
          engage(beat, sc, n, 0, 2.0);
          beam(beat, sc, n, 0.2, 0.6);
          beat.fromTo(sc.railDots[n], { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }, 0);
          beat.fromTo(sc.railDots[n], { opacity: 1 }, { opacity: 0.2, duration: 0.3, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 0.3);
          beat.to(sc.railDots[n], { opacity: 0, scale: 0.5, duration: 0.3 }, 2.1);
          disengage(beat, sc, n, 2.2);
        }, 0)
        .fromTo(sc.badge, { backgroundColor: '#f1fbf6', borderColor: '#d9f1e6', color: '#02774d' }, { backgroundColor: '#f3f4f6', borderColor: '#e2e5e9', color: '#7c858d', duration: 0.3 }, 0)
        .fromTo(timer, { t: 0 }, { t: 4.2, duration: 1.7, ease: 'none', onUpdate: () => { sc.book.arrived.textContent = `${timer.t.toFixed(1)} sec`; } }, 0.5);
      send(story, sc, dot, 0.5, 1.7);
      story
        .add(() => {
          badgeText.textContent = 'Settled';
        }, 2.25)
        .to(sc.badge, { backgroundColor: '#f1fbf6', borderColor: '#d9f1e6', color: '#02774d', duration: 0.3 }, 2.25);
      land(story, sc, 2.3);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Orbit',
    blurb: 'The network idles: all three rails flow gently into the hub at different speeds, a satellite rides the outer ring, the hub breathes, and a faint packet drifts the line every ten seconds.',
    idle(gsap, il) {
      const sc = scene(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3);
      const idle = ambient(gsap, il);
      idle.to(one(il, '.il-simple__orbit'), { rotation: 360, duration: 24, repeat: -1, ease: 'none', transformOrigin: '50% 50%' }, 0);
      idle.to(sc.hub, { scale: 1.03, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0);
      sc.rails.forEach((r, i) => idle.to(r, { strokeDashoffset: -14, duration: 1.6 + i * 0.5, ease: 'none', repeat: -1 }, 0));
      const drift = gsap.timeline({ repeat: -1, repeatDelay: 8.5, delay: 3 });
      drift.set(dot, { opacity: 0.6 }, 0).to(dot, { motionPath: { path: sc.path, align: sc.path, alignOrigin: [0.5, 0.5] }, duration: 2.4, ease: 'power1.inOut' }, 0).to(dot, { opacity: 0, duration: 0.3 }, 2.2);
      idle.add(drift, 0);
      return idle;
    },
  },
];
void HUB;
