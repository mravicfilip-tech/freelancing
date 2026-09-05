import { B, Layer, Stage } from './Stage';
import { all, one, roll, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "User-friendly interface" (Figma 2409:2544, 716×440): a connect-a-wallet panel with four wallet
 * rows, standing on soft yellow, blue and lavender blobs at the card's foot. A cursor connects a
 * wallet in every loop: the chosen row fills to its brand colour with white type and logo, a
 * dashed connector links it to the panel, and the heading reports the connection.
 */
// `whiten` marks glyph-only logos that turn white on the filled row; badge logos keep their disc
// and take a white ring instead.
const WALLETS: { id: string; label: string; icon: string; color: string; whiten: boolean }[] = [
  { id: 'metamask', label: 'MetaMask', icon: B('imgMetamask1.svg'), color: '#ff8d5d', whiten: true },
  { id: 'walletconnect', label: 'Walletconnect', icon: B('exWalletConnect.svg'), color: '#3b99fc', whiten: false },
  { id: 'coinbase', label: 'coinbase wallet', icon: B('exCoinbase.svg'), color: '#0e5bff', whiten: false },
  { id: 'phantom', label: 'phantom', icon: B('imgPhantom1.svg'), color: '#ab9ff2', whiten: true },
];

export function Ui() {
  return (
    <Stage id="ui" width={716} height={440} className="ff__art ff__art--ui il-ui">
      <span className="il-ui__dots" style={{ left: 470, top: 0, width: 246, height: 150 }} />
      <Layer className="il-ui__blob" src={B('imgEllipse3474.svg')} x={-142} y={192.7} w={796} h={852} style={{ transform: 'rotate(151.07deg) scaleY(-1)' }} />
      <Layer className="il-ui__blob" src={B('imgEllipse3475.svg')} x={-169} y={206.7} w={941} h={941} style={{ transform: 'rotate(-90deg) scaleY(-1)' }} />
      <Layer className="il-ui__blob" src={B('imgEllipse3476.svg')} x={38} y={170.7} w={796} h={852} style={{ transform: 'rotate(-90deg) scaleY(-1)' }} />

      <div className="il-ui__panel" style={{ left: 129.5, top: 160.7 }}>
        <div className="il-ui__intro">
          <span className="il-ui__introTop">
            <span className="il-ui__linkWrap">
              <img className="il-ui__link" src={B('imgHyperlink1.svg')} alt="" width={20} height={20} />
              <i className="il-ui__linkOk" />
            </span>
            <b>Connect a wallet</b>
          </span>
          <p>No account to create. Your wallet is your login, and payouts go to any bank you name.</p>
        </div>
        <div className="il-ui__rows">
          {WALLETS.map((w) => (
            <span key={w.id} className={`il-ui__row il-ui__row--${w.id}`} data-color={w.color} data-whiten={w.whiten ? '1' : undefined}>
              <i className="il-ui__hi" />
              <img src={w.icon} alt="" width={24} height={24} />
              {w.label}
            </span>
          ))}
        </div>
      </div>
      {/* A dashed connector from the link icon to the chosen row, drawn on connect. */}
      <svg className="il-ui__connector" viewBox="0 0 716 440" width={716} height={440} style={{ left: 0, top: 0 }} aria-hidden="true">
        <path className="il-ui__wire" d="M176 196 L 400 190" />
      </svg>
      <span className="il-ui__click" />
      <img className="il-ui__cursor" src="/figma/simple/imgCursor2StreamlineNova.svg" alt="" width={22} height={22} />
    </Stage>
  );
}

export const uiMotion: IllustrationMotion = {
  build(tl, il, at) {
    // The blobs settle, the panel rises, its copy appears in reading order, the wallet rows follow
    // one after another, and the cursor arrives last.
    tl.from(all(il, '.il-ui__blob'), { opacity: 0, duration: 1.4, stagger: 0.1, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-ui__dots'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-ui__panel'), { y: 32, opacity: 0, duration: 1.0, ease: EASE }, at + 0.15);
    tl.from(all(il, '.il-ui__linkWrap, .il-ui__introTop b, .il-ui__intro p'), { ...RISE, y: 8, duration: 0.6, stagger: 0.07 }, at + 0.45);
    tl.from(all(il, '.il-ui__row'), { ...RISE, duration: 0.6, stagger: 0.06 }, at + 0.5);
    tl.fromTo(one(il, '.il-ui__cursor'), { x: HOME.x, y: HOME.y, opacity: 0 }, { opacity: 1, duration: 0.5 }, at + 1.0);
  },
  idle: (gsap, il) => uiMotion.variants[0].idle(gsap, il),
  variants: [],
};

type G = Parameters<MotionVariant['idle']>[0];
type TL = gsap.core.Timeline;

// Where the cursor's tip goes, in design px. The rows column starts at 400.5 and each row is 56
// tall from 161.7; the tip lands on the row's label. The icon's tip sits at (4.4, 2.9) of the
// 22px image, so the element is offset by that.
const TIP = { x: 4.4, y: 2.9 };
const rowY = (i: number) => 189.7 + 56 * i;
const rowPoint = (i: number) => ({ x: 468 - TIP.x, y: rowY(i) - TIP.y });
const HOME = { x: 600 - TIP.x, y: 330 - TIP.y };
const LINK = { x: 176, y: 196 };

const parts = (il: HTMLElement) => ({
  rows: all(il, '.il-ui__row'),
  cursor: one(il, '.il-ui__cursor'),
  ring: one(il, '.il-ui__click'),
  panel: one(il, '.il-ui__panel'),
  intro: one(il, '.il-ui__intro'),
  title: one(il, '.il-ui__introTop b'),
  link: one(il, '.il-ui__link'),
  linkOk: one(il, '.il-ui__linkOk'),
  wire: one<SVGPathElement>(il, '.il-ui__wire'),
});
type P = ReturnType<typeof parts>;
const restBg = (row: HTMLElement) => getComputedStyle(row).backgroundColor;

const ambient = (gsap: G, il: HTMLElement) => {
  const idle = gsap.timeline();
  all(il, '.il-ui__blob').forEach((b, i) => idle.to(b, { x: i % 2 ? -10 : 10, duration: 8 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0));
  return idle;
};
/** The cursor glides to a row's label. */
const moveTo = (story: TL, p: P, i: number, t: number, duration = 0.75) => story.to(p.cursor, { ...rowPoint(i), duration, ease: 'power3.inOut' }, t);
/** A click you can feel: the cursor presses, a ring bursts from its tip, the row dips. */
const click = (story: TL, p: P, i: number, t: number) => {
  const row = p.rows[i];
  const at = rowPoint(i);
  return story
    .fromTo(p.cursor, { scale: 1 }, { scale: 0.8, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '20% 13%' }, t)
    .fromTo(p.ring, { x: at.x + TIP.x, y: at.y + TIP.y, scale: 0.15, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.6, ease: 'power2.out', transformOrigin: '50% 50%' }, t + 0.04)
    .fromTo(row, { scale: 1 }, { scale: 0.975, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, t);
};
/** The row fills to its wallet's full colour; its type and logo turn white. */
const fill = (story: TL, row: HTMLElement, t: number) => {
  story.to(row, { backgroundColor: row.dataset.color!, color: '#ffffff', duration: 0.35, ease: 'power2.out' }, t);
  return row.dataset.whiten
    ? story.to(one(row, 'img'), { filter: 'brightness(0) invert(1)', duration: 0.35, ease: 'power2.out' }, t)
    : story.to(one(row, 'img'), { boxShadow: '0 0 0 2px rgba(255,255,255,1)', duration: 0.35, ease: 'power2.out' }, t);
};
const unfill = (story: TL, row: HTMLElement, rest: string, t: number) => {
  story.to(row, { backgroundColor: rest, color: '#080d10', duration: 0.5, ease: 'power2.inOut' }, t);
  return row.dataset.whiten
    ? story.to(one(row, 'img'), { filter: 'brightness(1) invert(0)', duration: 0.5, ease: 'power2.inOut' }, t)
    : story.to(one(row, 'img'), { boxShadow: '0 0 0 0px rgba(255,255,255,0)', duration: 0.5, ease: 'power2.inOut' }, t);
};
/** The dashed connector draws from the link icon to the row, then flows while the connection is pending. */
const connect = (story: TL, p: P, gsap: G, i: number, t: number) =>
  story.add(() => {
    const y = rowY(i);
    p.wire.setAttribute('d', `M${LINK.x} ${LINK.y} C ${LINK.x + 90} ${LINK.y}, ${310} ${y}, 400 ${y}`);
    const len = p.wire.getTotalLength();
    gsap
      .timeline()
      .set(p.wire, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len, opacity: 1 }, 0)
      .to(p.wire, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' }, 0)
      .set(p.wire, { strokeDasharray: '3 4', strokeDashoffset: 0 }, 0.5)
      .to(p.wire, { strokeDashoffset: -40, duration: 1.6, ease: 'none' }, 0.5);
  }, t);
const disconnect = (story: TL, p: P, t: number) => story.to(p.wire, { opacity: 0, duration: 0.4 }, t);
/** The heading reports: Connecting…, then Connected with a green mark on the link icon, then resets. */
const report = (story: TL, p: P, gsap: G, t: number, hold = 1.4) =>
  story
    .add(() => roll(gsap, p.title, 'Connecting…'), t)
    .fromTo(p.link, { opacity: 1 }, { opacity: 0.4, duration: 0.35, yoyo: true, repeat: 3, ease: 'sine.inOut' }, t)
    .add(() => roll(gsap, p.title, 'Connected'), t + 1.5)
    .fromTo(p.linkOk, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)', transformOrigin: '50% 50%' }, t + 1.5)
    .add(() => roll(gsap, p.title, 'Connect a wallet'), t + 1.5 + hold)
    .to(p.linkOk, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in' }, t + 1.5 + hold);

uiMotion.variants = [
  {
    name: 'Connect + fill',
    blurb: 'The cursor clicks a wallet: the row fills to its brand colour with white type and logo, a dashed connector draws from the link icon to it and flows while "Connecting…", then "Connected" with a green mark; it all releases before the next.',
    idle(gsap, il) {
      const p = parts(il);
      const rest = p.rows.map(restBg);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 0.4 });
      p.rows.forEach((row, i) => {
        const t = i * 4.6;
        moveTo(story, p, i, t);
        click(story, p, i, t + 0.85);
        fill(story, row, t + 0.95);
        connect(story, p, gsap, i, t + 1.0);
        report(story, p, gsap, t + 1.0, 1.3);
        disconnect(story, p, t + 3.7);
        unfill(story, row, rest[i], t + 3.8);
      });
      story.to(p.cursor, { ...HOME, duration: 0.8, ease: 'power3.inOut' }, p.rows.length * 4.6);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Connect + stay',
    blurb: 'Like the first, but the connection persists: the chosen wallet stays filled and wired to the panel until the cursor picks the next one, so exactly one wallet is always connected.',
    idle(gsap, il) {
      const p = parts(il);
      const rest = p.rows.map(restBg);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, delay: 0.4 });
      p.rows.forEach((row, i) => {
        const t = i * 4.2;
        const prev = p.rows[(i + p.rows.length - 1) % p.rows.length];
        moveTo(story, p, i, t);
        click(story, p, i, t + 0.85);
        unfill(story, prev, rest[(i + p.rows.length - 1) % p.rows.length], t + 0.9);
        fill(story, row, t + 0.95);
        connect(story, p, gsap, i, t + 1.0);
        report(story, p, gsap, t + 1.0, 1.2);
      });
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Connect + tint',
    blurb: 'The whole panel takes the wallet\'s colour: as the row fills, the left column tints faintly to match and the connector carries the same hue, then everything returns to white.',
    idle(gsap, il) {
      const p = parts(il);
      const rest = p.rows.map(restBg);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 0.4 });
      p.rows.forEach((row, i) => {
        const t = i * 4.6;
        const c = row.dataset.color!;
        moveTo(story, p, i, t);
        click(story, p, i, t + 0.85);
        fill(story, row, t + 0.95);
        story.to(p.intro, { backgroundColor: `${c}14`, duration: 0.5 }, t + 0.95);
        story.to(p.wire, { stroke: c, duration: 0.1 }, t + 0.95);
        connect(story, p, gsap, i, t + 1.0);
        report(story, p, gsap, t + 1.0, 1.3);
        disconnect(story, p, t + 3.7);
        unfill(story, row, rest[i], t + 3.8);
        story.to(p.intro, { backgroundColor: 'rgba(255,255,255,0)', duration: 0.6 }, t + 3.8);
        story.to(p.wire, { stroke: '#4042d1', duration: 0.1 }, t + 4.3);
      });
      story.to(p.cursor, { ...HOME, duration: 0.8, ease: 'power3.inOut' }, p.rows.length * 4.6);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Connect + handshake',
    blurb: 'The connection is a round trip: the row fills, the connector draws to it, a light travels back along the connector into the link icon, and only then does the heading turn "Connected".',
    idle(gsap, il) {
      const p = parts(il);
      const rest = p.rows.map(restBg);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 0.4 });
      p.rows.forEach((row, i) => {
        const t = i * 4.8;
        moveTo(story, p, i, t);
        click(story, p, i, t + 0.85);
        fill(story, row, t + 0.95);
        connect(story, p, gsap, i, t + 1.0);
        story.add(() => roll(gsap, p.title, 'Connecting…'), t + 1.0);
        story.add(() => {
          gsap
            .timeline()
            .fromTo(p.ring, { scale: 0.3, opacity: 0.9 }, { opacity: 0.9, duration: 0.1 }, 0)
            .to(p.ring, { motionPath: { path: p.wire, align: p.wire, alignOrigin: [0.5, 0.5], start: 1, end: 0 }, duration: 0.9, ease: 'power2.inOut' }, 0)
            .to(p.ring, { opacity: 0, duration: 0.15 }, 0.85);
        }, t + 1.6);
        story
          .add(() => roll(gsap, p.title, 'Connected'), t + 2.6)
          .fromTo(p.linkOk, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)', transformOrigin: '50% 50%' }, t + 2.6)
          .add(() => roll(gsap, p.title, 'Connect a wallet'), t + 3.9)
          .to(p.linkOk, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in' }, t + 3.9);
        disconnect(story, p, t + 3.9);
        unfill(story, row, rest[i], t + 4.0);
      });
      story.to(p.cursor, { ...HOME, duration: 0.8, ease: 'power3.inOut' }, p.rows.length * 4.8);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Connect + rise',
    blurb: 'The connected wallet moves to the top: the row fills, slides up to the first slot as the others shift down, the connector redraws to it there and the heading reports; it releases and the list settles.',
    idle(gsap, il) {
      const p = parts(il);
      const rest = p.rows.map(restBg);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 0.4 });
      [1, 2, 3].forEach((pick, k) => {
        const t = k * 5.0;
        moveTo(story, p, pick, t);
        click(story, p, pick, t + 0.85);
        fill(story, p.rows[pick], t + 0.95);
        story.to(p.rows[pick], { y: -56 * pick, duration: 0.7, ease: 'power3.inOut' }, t + 1.2);
        story.to(p.cursor, { ...rowPoint(0), duration: 0.7, ease: 'power3.inOut' }, t + 1.2);
        for (let j = 0; j < pick; j++) story.to(p.rows[j], { y: 56, duration: 0.7, ease: 'power3.inOut' }, t + 1.2);
        connect(story, p, gsap, 0, t + 1.9);
        report(story, p, gsap, t + 1.9, 1.0);
        disconnect(story, p, t + 4.2);
        unfill(story, p.rows[pick], rest[pick], t + 4.2);
        story.to(p.rows, { y: 0, duration: 0.7, ease: 'power3.inOut' }, t + 4.4);
      });
      story.to(p.cursor, { ...HOME, duration: 0.8, ease: 'power3.inOut' }, 3 * 5.0);
      idle.add(story, 0);
      return idle;
    },
  },
];
