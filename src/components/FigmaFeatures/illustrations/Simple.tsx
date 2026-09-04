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

      <Strokes className="il-simple__lines" svg={lines} x={132} y={138} w={272} h={121.75} />

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
const ambient = (gsap: G, il: HTMLElement) => {
  const idle = gsap.timeline();
  all(il, '.il-simple__ring').forEach((r, i) => idle.to(r, { rotation: i ? -360 : 360, duration: 90 + i * 30, repeat: -1, ease: 'none', transformOrigin: '50% 50%' }, 0));
  idle.to(one(il, '.il-simple__blob'), { x: 10, y: 6, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  return idle;
};
/** The receipt state every variant advances: another €10, one more minute, a fresh arrival time. */
const ledger = (gsap: G, il: HTMLElement) => {
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
};

simpleMotion.variants = [
  {
    name: 'Payment',
    blurb: 'A packet travels the line through the hub, which sends out a soft ring; the exchange turns and the receipt takes another €10 with a new arrival time and clock.',
    idle(gsap, il) {
      const svg = one<SVGSVGElement>(il, '.il-simple__lines svg');
      const path = one<SVGPathElement>(svg, 'path');
      const dot = traveller(svg, '#4042d1', 3.5);
      const halo = one(il, '.il-simple__hubHalo');
      const swap = one(il, '.il-simple__swap');
      const badgeDot = one(il, '.il-rc__badge img');
      const book = ledger(gsap, il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.4, delay: 1.2 });
      story
        .set(dot, { opacity: 1 }, 0)
        .to(dot, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1.4, ease: 'power2.inOut' }, 0)
        .to(dot, { opacity: 0, duration: 0.2 }, 1.35)
        .fromTo(halo, { scale: 1, opacity: 0.5 }, { scale: 1.7, opacity: 0, duration: 0.9, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.7)
        .to(swap, { rotation: '+=180', duration: 0.5, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 1.25)
        .add(() => book.settle(), 1.5)
        .fromTo(badgeDot, { opacity: 1 }, { opacity: 0.15, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 1.6)
        .fromTo(one(il, '.il-toast'), { y: 0 }, { y: -3, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 1.95);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Batch',
    blurb: 'Three packets run the line in quick succession like a settlement batch; the amount climbs €30 as they land and the hub rings for each.',
    idle(gsap, il) {
      const svg = one<SVGSVGElement>(il, '.il-simple__lines svg');
      const path = one<SVGPathElement>(svg, 'path');
      const dots = [0, 1, 2].map(() => traveller(svg, '#4042d1', 3));
      const halo = one(il, '.il-simple__hubHalo');
      const swap = one(il, '.il-simple__swap');
      const book = ledger(gsap, il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.8, delay: 1.2 });
      dots.forEach((d, i) => {
        const t = i * 0.4;
        story
          .set(d, { opacity: 1 }, t)
          .to(d, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1.4, ease: 'power2.inOut' }, t)
          .to(d, { opacity: 0, duration: 0.2 }, t + 1.35)
          .fromTo(halo, { scale: 1, opacity: 0.45 }, { scale: 1.6, opacity: 0, duration: 0.8, ease: 'power2.out', transformOrigin: '50% 50%' }, t + 0.7)
          .add(() => book.settle(10), t + 1.5);
      });
      story.to(swap, { rotation: '+=180', duration: 0.5, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 1.25);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Network handoff',
    blurb: 'The stripe, coinbase and wise pills light up one after another as the local rails pick the route, then the payment runs the line and lands on the receipt.',
    idle(gsap, il) {
      const svg = one<SVGSVGElement>(il, '.il-simple__lines svg');
      const path = one<SVGPathElement>(svg, 'path');
      const dot = traveller(svg, '#4042d1', 3.5);
      const logos = all(il, '.il-simple__logo');
      const halo = one(il, '.il-simple__hubHalo');
      const book = ledger(gsap, il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.2, delay: 1.2 });
      logos.forEach((l, i) => {
        story
          .fromTo(l, { scale: 1, filter: 'brightness(1)' }, { scale: 1.06, filter: 'brightness(1.25)', duration: 0.3, ease: 'power2.out', transformOrigin: '50% 50%' }, i * 0.35)
          .to(l, { scale: 1, filter: 'brightness(1)', duration: 0.5, ease: 'power2.inOut' }, i * 0.35 + 0.4);
      });
      story
        .set(dot, { opacity: 1 }, 1.2)
        .to(dot, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1.4, ease: 'power2.inOut' }, 1.2)
        .to(dot, { opacity: 0, duration: 0.2 }, 2.55)
        .fromTo(halo, { scale: 1, opacity: 0.5 }, { scale: 1.7, opacity: 0, duration: 0.9, ease: 'power2.out', transformOrigin: '50% 50%' }, 1.9)
        .add(() => book.settle(), 2.7);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Live receipt',
    blurb: 'The receipt behaves like a terminal: the badge drops to PENDING as the packet leaves, "Arrived in" counts up in real time while it travels, and flips back to SETTLED on landing.',
    idle(gsap, il) {
      const svg = one<SVGSVGElement>(il, '.il-simple__lines svg');
      const path = one<SVGPathElement>(svg, 'path');
      const dot = traveller(svg, '#4042d1', 3.5);
      const badge = one(il, '.il-rc__badge');
      const badgeText = badge.lastChild as Text;
      const book = ledger(gsap, il);
      const timer = { t: 0 };
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 4.2, delay: 1.2 });
      story
        .add(() => {
          badgeText.textContent = 'Pending';
        }, 0)
        .fromTo(badge, { backgroundColor: '#f1fbf6', borderColor: '#d9f1e6', color: '#02774d' }, { backgroundColor: '#f3f4f6', borderColor: '#e2e5e9', color: '#7c858d', duration: 0.3 }, 0)
        .set(dot, { opacity: 1 }, 0.1)
        .to(dot, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1.5, ease: 'power2.inOut' }, 0.1)
        .fromTo(timer, { t: 0 }, { t: 4.2, duration: 1.5, ease: 'none', onUpdate: () => { book.arrived.textContent = `${timer.t.toFixed(1)} sec`; } }, 0.1)
        .to(dot, { opacity: 0, duration: 0.2 }, 1.55)
        .add(() => {
          badgeText.textContent = 'Settled';
          book.settle();
        }, 1.7)
        .to(badge, { backgroundColor: '#f1fbf6', borderColor: '#d9f1e6', color: '#02774d', duration: 0.3 }, 1.7);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Orbit',
    blurb: 'Nothing transacts. A small satellite rides the outer orbit ring, the hub breathes very gently, and the blob drifts.',
    idle(gsap, il) {
      const idle = ambient(gsap, il);
      idle.to(one(il, '.il-simple__orbit'), { rotation: 360, duration: 24, repeat: -1, ease: 'none', transformOrigin: '50% 50%' }, 0);
      idle.to(one(il, '.il-simple__hub'), { scale: 1.03, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0);
      return idle;
    },
  },
];
