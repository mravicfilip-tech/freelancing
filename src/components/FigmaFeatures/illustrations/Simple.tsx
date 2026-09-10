import lines from './svg/imgGroup2085662421.svg?raw';
import linesM from './svg/imgGroup2085662421-m.svg?raw';
import { B, Layer, Stage, Strokes } from './Stage';
import { all, count, draw, isMobile, one, roll, traveller, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "Crypto-to-fiat payments made simple" (Figma 2409:2462, 747×334 landscape; 2597:844, 394×606
 * portrait): BTC flows along a line through the Remittix hub and an exchange into a bank receipt,
 * over a lavender blob ringed by orbits.
 *
 * The portrait design builds the scene the way the file does: one 606×394 box holding the whole
 * corridor, given a quarter turn to fill the tall card, with every chip and card turned back
 * upright inside it. Keeping that construction (rather than re-deriving each coordinate in the
 * card's own axes) means the payment line and everything that rides it stay in one transform
 * space, so the motion below needs no special case for the packets.
 */
export function Simple({ mobile = false }: { mobile?: boolean } = {}) {
  return mobile ? <SimplePortrait /> : <SimpleLandscape />;
}

/** Where each part of the corridor sits, in the coordinates of the box that holds it. */
type SimpleGeo = typeof LANDSCAPE;

const LANDSCAPE = {
  box: { w: 747, h: 334 },
  // Each layout carries its own export. The file draws this corridor twice, and the two are not
  // one drawing at two sizes: the blob is 949x1050 here against 1186x1106.3 on the phone, and the
  // payment line 272x121.75 against 240x112.203. Stretching one into the other's box — which is
  // what a shared asset does under preserveAspectRatio="none" — skews the gradient's soft edges
  // into a flat wash and pulls the line's ends off the chips they are drawn to meet.
  art: { blob: 'imgGroup2085662428.svg', lines },
  // The hub's mark is one vector at two sizes — 0.758 of this on the phone, uniformly — so it
  // takes a size rather than its own file, and drawing the landscape's inside the phone's smaller
  // disc had it a third too big for the circle it sits in.
  hubMark: { w: 35.4959, h: 18.3367 },
  blob: { x: -71, y: -537, w: 949, h: 1050 },
  ring1: { x: 143, y: -93, d: 395 },
  haze: { x: 219, y: -190, d: 584 },
  ring2: { x: 258, y: -154, d: 443 },
  lines: { x: 132, y: 138, w: 272, h: 121.75 },
  rail: 'M190 166 C 210 172, 228 182, 243 189',
  btc: { x: 17, y: 239 },
  coinbase: { x: 257, y: 31, w: 80, h: 32 },
  stripe: { x: 149, y: 80, w: 106, h: 36 },
  wise: { x: 112, y: 151 },
  hub: { x: 242, y: 166 },
  swap: { x: 410, y: 130 },
  stack: { x: 425, y: 34 },
};

/**
 * Portrait (Figma 2597:844), in the turned box's own coordinates. Upright parts are placed by
 * their centres and given the design's counter-rotation in CSS.
 */
const PORTRAIT: SimpleGeo = {
  box: { w: 606, h: 394 },
  art: { blob: 'imgGroup2085662428-m.svg', lines: linesM },
  hubMark: { w: 26.908, h: 13.901 },
  blob: { x: -303, y: -515.3, w: 1186, h: 1106.3 },
  ring1: { x: 148, y: -93, d: 395 },
  haze: { x: 224, y: -190, d: 584 },
  ring2: { x: 263, y: -154, d: 443 },
  lines: { x: 88, y: 133.25, w: 240, h: 112.203 },
  rail: 'M226 149 C 222 175, 214 200, 207 221',
  btc: { x: 20, y: 116 },
  coinbase: { x: 187, y: 119, w: 78, h: 30 },
  stripe: { x: 211, y: 293, w: 104, h: 34 },
  wise: { x: 124, y: 48 },
  hub: { x: 178, y: 221 },
  // The badge meets the receipt's top edge and no more: the design has it 10px clear of the card
  // (2597:1025 against 2597:981), and at the export's own 288 our taller receipt column rises to
  // meet it, putting the badge through the middle of "New Bank".
  swap: { x: 267, y: 176 },
  // The receipt column renders 298 tall against the export's 279, so it is placed by the design's
  // top edge rather than its centre — the toast then clears the card's foot.
  stack: { x: 340, y: 41 },
};

/** The corridor itself: blob and orbits, the payment line, its stops, and the receipt at the end. */
function Corridor({ g }: { g: SimpleGeo }) {
  return (
    <>
      <Layer className="il-simple__blob" src={B(g.art.blob)} x={g.blob.x} y={g.blob.y} w={g.blob.w} h={g.blob.h} />
      <span className="il-simple__ring il-ring" style={{ left: g.ring1.x, top: g.ring1.y, width: g.ring1.d, height: g.ring1.d }} />
      <Layer className="il-simple__haze" src={B('ellipse3438.webp')} x={g.haze.x} y={g.haze.y} w={g.haze.d} h={g.haze.d} />
      <span className="il-simple__ring il-ring il-ring--bold" style={{ left: g.ring2.x, top: g.ring2.y, width: g.ring2.d, height: g.ring2.d }} />
      <span className="il-simple__orbit" style={{ left: g.ring2.x, top: g.ring2.y, width: g.ring2.d, height: g.ring2.d }}>
        <i />
      </span>

      {/* One dashed rail from the front processor slot into the Remittix hub; whoever sits there routes. */}
      <svg className="il-simple__rails" viewBox={`0 0 ${g.box.w} ${g.box.h}`} width={g.box.w} height={g.box.h} style={{ left: 0, top: 0 }} aria-hidden="true">
        <path className="il-simple__rail" d={g.rail} />
      </svg>
      <Strokes className="il-simple__lines" svg={g.art.lines} x={g.lines.x} y={g.lines.y} w={g.lines.w} h={g.lines.h} />
      <i className="il-simple__beam" />

      <div className="il-simple__btc il-simple__node" style={{ left: g.btc.x, top: g.btc.y }}>
        <img loading="lazy" decoding="async" src={B('imgFrame2085662026.svg')} alt="" width={30.8} height={30.8} />
        <span>0.0128 BTC</span>
      </div>
      <Layer className="il-simple__logo" src={B('imgFrame2085662273.svg')} x={g.coinbase.x} y={g.coinbase.y} w={g.coinbase.w} h={g.coinbase.h} />
      <Layer className="il-simple__logo" src={B('imgFrame2085662272.svg')} x={g.stripe.x} y={g.stripe.y} w={g.stripe.w} h={g.stripe.h} />
      <div className="il-simple__wise il-simple__logo" style={{ left: g.wise.x, top: g.wise.y }}>
        <span style={{ maskImage: `url(${B('imgRectangle34624647.png')})`, WebkitMaskImage: `url(${B('imgRectangle34624647.png')})` }} />
      </div>
      <div className="il-simple__hub il-simple__node" style={{ left: g.hub.x, top: g.hub.y }}>
        <i className="il-simple__hubHalo" />
        <img loading="lazy" decoding="async" src={B('imgGroup3.svg')} alt="" width={g.hubMark.w} height={g.hubMark.h} />
      </div>
      <div className="il-simple__swap" style={{ left: g.swap.x, top: g.swap.y }}>
        <img loading="lazy" decoding="async" src={B('imgMoveHorizontal.svg')} alt="" width={16} height={13.4} />
      </div>

      <div className="il-simple__stack" style={{ left: g.stack.x, top: g.stack.y }}>
        <div className="il-rc">
          <div className="il-rc__row il-rc__head">
            <span className="il-rc__bank">
              <img loading="lazy" decoding="async" src={B('imgFrame2085662286.svg')} alt="" width={24} height={24} />
              <span>
                <b>New Bank</b>
                <small>EUR ····4417</small>
              </span>
            </span>
            <span className="il-rc__badge">
              <img loading="lazy" decoding="async" src={B('imgEllipse3432.svg')} alt="" width={2.7} height={2.7} />
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
          <img loading="lazy" decoding="async" src={B('imgFrame2085662288.svg')} alt="" width={20} height={20} />
          <span>
            Credited to bank account
            <small className="il-mono" data-count="time">TODAY · 14:02</small>
          </span>
        </div>
      </div>
    </>
  );
}

function SimpleLandscape() {
  return (
    <Stage id="simple" width={747} height={334} className="ff__art ff__art--simple il-simple">
      <Corridor g={LANDSCAPE} />
    </Stage>
  );
}

/**
 * The 606×394 corridor, centred in the 394×606 card and turned a quarter turn — the design's own
 * construction (2597:963). `.il-simple__turn` carries the turn; the CSS stands the chips, hub,
 * exchange and receipt back up inside it.
 */
function SimplePortrait() {
  return (
    <Stage id="simple" width={394} height={606} layout="mobile" className="ff__art ff__art--simple il-simple il-simple--m">
      <div className="il-simple__turn" style={{ left: (394 - 606) / 2, top: (606 - 394) / 2, width: 606, height: 394 }}>
        <Corridor g={PORTRAIT} />
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

/**
 * The motion's own geometry, per layout: the hub's centre, the line's offset inside the box, the
 * three processor slots (in the order the logos appear), and which slot is wired to the hub.
 */
const MGEO = {
  desktop: { hub: { x: 273, y: 197 }, lines: { x: 132, y: 138 }, slots: [{ x: 297, y: 47 }, { x: 202, y: 98 }, { x: 151, y: 166 }], front: 2 },
  mobile: { hub: { x: 202, y: 245 }, lines: { x: 88, y: 134 }, slots: [{ x: 226, y: 134 }, { x: 263, y: 310 }, { x: 163, y: 63 }], front: 0 },
} as const;
type MGeo = (typeof MGEO)[keyof typeof MGEO];
const mgeo = (il: HTMLElement): MGeo => (isMobile(il) ? MGEO.mobile : MGEO.desktop);
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
    /** The layout's own hub, line offset and processor slots. */
    g: mgeo(il),
    svg,
    path,
    len,
    glow,
    logos: all(il, '.il-simple__logo'),
    rail: one<SVGPathElement>(il, '.il-simple__rail'),
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
  sc.rail.style.opacity = String(RAIL_DIM);
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
      /* The figure flashes to the live tint and settles back to the page's hardest ink. Both were
         literals — an indigo and a black — and GSAP writes what it is given as an inline style, so
         after the first settle the receipt's own number was a light-mode black on a dark card,
         whatever the sheet said. Read off the scene instead. */
      const tone = (n: string, f: string) => getComputedStyle(il).getPropertyValue(n).trim() || f;
      gsap.fromTo(
        amount,
        { color: tone('--il-indigo', '#4042d1') },
        { color: tone('--il-figure', '#000'), duration: 1.2, ease: 'power1.out', delay: 0.35 },
      );
    },
  };
}

/** Where along the main line the hub sits (fraction of its length), found once by sampling. */
const hubFraction = (sc: Scene) => {
  // The hub's centre in the line's own coordinates.
  const target = { x: sc.g.hub.x - sc.g.lines.x, y: sc.g.hub.y - sc.g.lines.y };
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

/**
 * The processors sit in three slots around the hub (the design's stripe, coinbase and wise
 * positions, as pill centres — see MGEO). One slot is the front: it is wired to the hub and routes
 * the payment. Between payments the carousel turns, so the next processor comes to the front.
 */
/** A curved move from one slot to another, bowing away from the hub. */
const arc = (g: MGeo, from: { x: number; y: number }, to: { x: number; y: number }) => {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = mx - g.hub.x;
  const dy = my - g.hub.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: mx + (dx / d) * 22, y: my + (dy / d) * 22 };
};
/** Carousel state: which processor (0 stripe, 1 coinbase, 2 wise) sits in each slot. */
const carousel = (gsap: G, sc: Scene) => {
  const inSlot = [0, 1, 2];
  const SLOTS = sc.g.slots;
  const pos = sc.logos.map((_, i) => ({ ...SLOTS[i] })); // each logo's current centre
  return {
    front: () => inSlot[sc.g.front],
    /** Every processor advances one slot, all at once, along arcs around the hub. */
    turn(duration = 1.3) {
      const tl = gsap.timeline();
      const next = [inSlot[2], inSlot[0], inSlot[1]]; // the front goes back to the far slot

      // The portrait frame keeps the design's own three logo positions, and those sit at very
      // uneven distances from the hub — 89 to 186 — with two of them barely 24 degrees apart. An
      // arc that bows a flat 22px off the chord has nowhere near the room to clear that: swept
      // round, the pills run through each other and across the hub, which is what the carousel was
      // doing on a phone. They change places instead — each dips out at its slot, is set to the
      // next, and comes back up — staggered so the swap still reads as the carousel turning
      // rather than as three pills blinking at once. The design's positions are left untouched.
      if (sc.g === MGEO.mobile) {
        const out = duration * 0.32;
        next.forEach((logo, slot) => {
          const to = SLOTS[slot];
          const home = SLOTS[logo];
          const at = slot * 0.12;
          tl.to(sc.logos[logo], { opacity: 0, scale: 0.92, duration: out, ease: 'power2.in' }, at);
          tl.set(sc.logos[logo], { x: to.x - home.x, y: to.y - home.y }, at + out);
          tl.to(sc.logos[logo], { opacity: 1, scale: 1, duration: duration * 0.44, ease: 'power2.out' }, at + out + 0.02);
          pos[logo] = { ...to };
        });
        for (let k = 0; k < 3; k++) inSlot[k] = next[k];
        return tl;
      }

      next.forEach((logo, slot) => {
        const from = pos[logo];
        const to = SLOTS[slot];
        const via = arc(sc.g, from, to);
        const home = SLOTS[logo]; // the logo's design position, which its transform is relative to
        tl.to(sc.logos[logo], { motionPath: { path: [{ x: from.x - home.x, y: from.y - home.y }, { x: via.x - home.x, y: via.y - home.y }, { x: to.x - home.x, y: to.y - home.y }], curviness: 1.2 }, duration, ease: 'power3.inOut' }, 0);
        pos[logo] = { ...to };
      });
      for (let k = 0; k < 3; k++) inSlot[k] = next[k];
      return tl;
    },
  };
};

/** The front processor takes the route: it glows and the rail flows indigo toward the hub. */
const engage = (story: TL, sc: Scene, logo: number, t: number, duration: number) =>
  story
    .to(sc.logos[logo], { ...LIT, duration: 0.3, ease: 'power2.out' }, t)
    .to(sc.rail, { stroke: RAIL_LIVE, opacity: 1, duration: 0.25 }, t)
    .to(sc.rail, { strokeDashoffset: `-=${Math.round(duration * 26)}`, duration, ease: 'none' }, t);
const disengage = (story: TL, sc: Scene, logo: number, t: number) =>
  story.to(sc.logos[logo], { ...UNLIT, duration: 0.6, ease: 'power2.inOut' }, t).to(sc.rail, { stroke: RAIL_REST, opacity: RAIL_DIM, duration: 0.6 }, t);
/** The hub asks the front processor: a light runs up the rail, and the answer comes back. */
const query = (story: TL, sc: Scene, t: number) =>
  story
    .fromTo(sc.beam, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.12 }, t)
    .to(sc.beam, { motionPath: { path: sc.rail, align: sc.rail, alignOrigin: [0.5, 0.5], start: 1, end: 0 }, duration: 0.4, ease: 'power2.out' }, t)
    .to(sc.beam, { opacity: 0, duration: 0.1 }, t + 0.45)
    .fromTo(sc.beam, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.1 }, t + 0.65)
    .to(sc.beam, { motionPath: { path: sc.rail, align: sc.rail, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 0.35, ease: 'power2.in' }, t + 0.65)
    .to(sc.beam, { opacity: 0, scale: 0.4, duration: 0.1 }, t + 0.95)
    .fromTo(sc.halo, { scale: 1, opacity: 0.5 }, { scale: 1.7, opacity: 0, duration: 0.8, ease: 'power2.out', transformOrigin: '50% 50%' }, t + 1.0);
/** The packet runs a stretch of the main line with a highlight ahead of it. */
const run = (story: TL, sc: Scene, dot: SVGCircleElement, from: number, to: number, t: number, duration: number, ease: string) =>
  story
    .set(dot, { opacity: 1 }, t)
    .to(dot, { motionPath: { path: sc.path, align: sc.path, alignOrigin: [0.5, 0.5], start: from, end: to }, duration, ease }, t)
    .set(sc.glow, { opacity: 1 }, t)
    .fromTo(sc.glow, { strokeDashoffset: sc.len + 34 - from * sc.len }, { strokeDashoffset: sc.len - to * sc.len, duration, ease }, t - 0.04)
    .to(sc.glow, { opacity: 0, duration: 0.2 }, t + duration - 0.1);
/** The exchange turns and the receipt takes the payment: rows ripple, figures roll, the badge blinks, the toast nods. */
const land = (story: TL, sc: Scene, t: number, add = 10) =>
  story
    .to(sc.swap, { rotation: '+=180', duration: 0.5, ease: 'power3.inOut', transformOrigin: '50% 50%' }, t - 0.15)
    .fromTo(sc.rows, { y: 0 }, { y: -2, duration: 0.18, stagger: 0.05, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t)
    .add(() => sc.book.settle(add), t + 0.1)
    .fromTo(sc.badgeDot, { opacity: 1 }, { opacity: 0.15, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, t + 0.2)
    .fromTo(sc.toast, { y: 0 }, { y: -3, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t + 0.5);
/** One payment through the front processor: send, reach the hub, ask and be answered, carry on, land. */
const payment = (b: TL, sc: Scene, dot: SVGCircleElement, logo: number, t = 0) => {
  const f = sc.hubAt;
  b.fromTo(sc.coin, { rotation: 0 }, { rotation: 360, duration: 0.7, ease: 'power2.inOut', transformOrigin: '50% 50%' }, t);
  run(b, sc, dot, 0, f, t + 0.2, 0.8, 'power2.in');
  b.to(dot, { opacity: 0, duration: 0.15 }, t + 0.95);
  engage(b, sc, logo, t + 1.0, 1.2);
  query(b, sc, t + 1.0);
  run(b, sc, dot, f, 1, t + 2.05, 0.8, 'power2.out');
  b.to(dot, { opacity: 0, duration: 0.15 }, t + 2.8);
  disengage(b, sc, logo, t + 2.3);
  land(b, sc, t + 2.85);
  return t + 3.4;
};

simpleMotion.variants = [
  {
    name: 'Carousel',
    blurb: 'The processors sit around the hub and the front one is wired to it. A payment runs to the hub, the front processor is asked and answers, the payment lands, then the carousel turns smoothly so the next processor comes to the front.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      const car = carousel(gsap, sc);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 1.2 });
      story.add(() => {
        const b = gsap.timeline();
        const end = payment(b, sc, dot, car.front());
        b.add(car.turn(1.3), end + 0.3);
      }, 0);
      story.to({}, { duration: 5.3 }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Carousel + compare',
    blurb: 'Before routing, the hub compares: all three processors glow briefly in turn, then the front one holds and is asked; the payment lands and the carousel turns for the next.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      const car = carousel(gsap, sc);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 1.2 });
      story.add(() => {
        const b = gsap.timeline();
        sc.logos.forEach((l, i) => b.fromTo(l, { ...UNLIT }, { ...LIT, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1, repeatDelay: 0.1 }, i * 0.22));
        const end = payment(b, sc, dot, car.front(), 0.7);
        b.add(car.turn(1.3), end + 0.3);
      }, 0);
      story.to({}, { duration: 6.0 }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Orbit',
    blurb: 'The processors drift around the hub in a slow, continuous orbit, and whichever is at the front when a payment arrives is the one asked. Constant gentle motion, a payment every few seconds.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      const idle = ambient(gsap, il);
      const { hub: HUB, slots: SLOTS, front: FRONT } = sc.g;
      // Each processor rides a circle around the hub through its own design position.
      const angles = sc.logos.map((_, i) => Math.atan2(SLOTS[i].y - HUB.y, SLOTS[i].x - HUB.x));
      const radii = sc.logos.map((_, i) => Math.hypot(SLOTS[i].x - HUB.x, SLOTS[i].y - HUB.y));
      const spin = { a: 0 };
      idle.to(spin, {
        a: Math.PI * 2,
        duration: 48,
        ease: 'none',
        repeat: -1,
        onUpdate: () => {
          sc.logos.forEach((l, i) => {
            const a = angles[i] - spin.a; // clockwise, as the line flows
            gsap.set(l, { x: HUB.x + Math.cos(a) * radii[i] - SLOTS[i].x, y: HUB.y + Math.sin(a) * radii[i] - SLOTS[i].y });
          });
        },
      }, 0);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 2.2, delay: 1.2 });
      story.add(() => {
        // The processor nearest the front slot right now routes; the rail is redrawn to it.
        const frontAngle = Math.atan2(SLOTS[FRONT].y - HUB.y, SLOTS[FRONT].x - HUB.x);
        let best = 0;
        let bestD = Infinity;
        sc.logos.forEach((_, i) => {
          const a = angles[i] - spin.a;
          const d = Math.abs(Math.atan2(Math.sin(a - frontAngle), Math.cos(a - frontAngle)));
          if (d < bestD) { bestD = d; best = i; }
        });
        const a = angles[best] - spin.a;
        const px = HUB.x + Math.cos(a) * radii[best];
        const py = HUB.y + Math.sin(a) * radii[best];
        const ex = HUB.x + Math.cos(a) * 33;
        const ey = HUB.y + Math.sin(a) * 33;
        sc.rail.setAttribute('d', `M${px.toFixed(1)} ${py.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`);
        payment(gsap.timeline(), sc, dot, best);
      }, 0);
      story.to({}, { duration: 3.4 }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Carousel + live receipt',
    blurb: 'The carousel, with the receipt reporting live: the badge drops to PENDING as the coin sends, "Arrived in" counts up while the front processor answers, and it all settles on landing before the carousel turns.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      const car = carousel(gsap, sc);
      const badgeText = sc.badge.lastChild as Text;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 1.2 });
      story.add(() => {
        const timer = { t: 0 };
        const b = gsap.timeline();
        b.add(() => { badgeText.textContent = 'Pending'; }, 0);
        b.fromTo(sc.badge, { backgroundColor: '#f1fbf6', borderColor: '#d9f1e6', color: '#02774d' }, { backgroundColor: '#f3f4f6', borderColor: '#e2e5e9', color: '#7c858d', duration: 0.3 }, 0);
        b.fromTo(timer, { t: 0 }, { t: 4.2, duration: 2.7, ease: 'none', onUpdate: () => { sc.book.arrived.textContent = `${timer.t.toFixed(1)} sec`; } }, 0.2);
        const end = payment(b, sc, dot, car.front());
        b.add(() => { badgeText.textContent = 'Settled'; }, 2.85);
        b.to(sc.badge, { backgroundColor: '#f1fbf6', borderColor: '#d9f1e6', color: '#02774d', duration: 0.3 }, 2.85);
        b.add(car.turn(1.3), end + 0.3);
      }, 0);
      story.to({}, { duration: 5.3 }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Carousel + stream',
    blurb: 'Volume: packets pass straight through every couple of seconds, each routed by the front processor with a quick rail flash, and after every third the carousel turns to the next processor.',
    idle(gsap, il) {
      const sc = sceneOf(gsap, il);
      const dot = traveller(sc.svg, '#4042d1', 3.5);
      const car = carousel(gsap, sc);
      let k = 0;
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.7, delay: 1.2 });
      story.add(() => {
        const b = gsap.timeline();
        const logo = car.front();
        run(b, sc, dot, 0, 1, 0, 1.5, 'power1.inOut');
        b.to(dot, { opacity: 0, duration: 0.15 }, 1.45);
        engage(b, sc, logo, 0.5, 0.7);
        b.fromTo(sc.halo, { scale: 1, opacity: 0.45 }, { scale: 1.6, opacity: 0, duration: 0.7, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.7);
        disengage(b, sc, logo, 1.3);
        land(b, sc, 1.55);
        k += 1;
        if (k % 3 === 0) b.add(car.turn(1.2), 2.2);
      }, 0);
      story.to({}, { duration: 2.4 }, 0);
      idle.add(story, 0);
      return idle;
    },
  },
];
