import { B, Layer, Stage } from './Stage';
import { all, isMobile, one, roll, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "User-friendly interface" (Figma 2409:2544, 716×440 landscape; 2597:1126, 394×467 portrait): a
 * connect-a-wallet panel with four wallet rows, standing on soft blobs at the card's foot. A cursor
 * connects a wallet in every loop: the chosen row fills to its brand colour with white type and
 * logo, and the panel itself reports the connection: a progress bar under the heading, the heading
 * rolling to Connecting… then Connected, a green mark on the link icon.
 *
 * The phone design turns the panel through 90°: the intro sits above its rows instead of beside
 * them, and the panel grows to 330×442. The cursor's path is derived from GEO below, so the same
 * loop plays against whichever geometry is on screen.
 */
// `whiten` marks glyph-only logos that turn white on the filled row; badge logos keep their disc
// and take a white ring instead.
const WALLETS: { id: string; label: string; icon: string; color: string; whiten: boolean }[] = [
  { id: 'metamask', label: 'MetaMask', icon: B('imgMetamask1.svg'), color: '#ff8d5d', whiten: true },
  { id: 'walletconnect', label: 'Walletconnect', icon: B('exWalletConnect.svg'), color: '#3b99fc', whiten: false },
  { id: 'coinbase', label: 'coinbase wallet', icon: B('exCoinbase.svg'), color: '#0e5bff', whiten: false },
  { id: 'phantom', label: 'phantom', icon: B('imgPhantom1.svg'), color: '#ab9ff2', whiten: true },
];

export function Ui({ mobile = false }: { mobile?: boolean } = {}) {
  return mobile ? <UiPortrait /> : <UiLandscape />;
}

/** The panel's contents (Figma 2597:1148): the intro, and the four wallet rows. */
function Panel({ x, y }: { x: number; y: number }) {
  return (
    <div className="il-ui__panel" style={{ left: x, top: y }}>
      <div className="il-ui__intro">
        <span className="il-ui__introTop">
          <span className="il-ui__linkWrap">
            <img className="il-ui__link" src={B('imgHyperlink1.svg')} alt="" width={20} height={20} />
            <i className="il-ui__linkOk" />
            <img className="il-ui__avatar" src={B('imgMetamask1.svg')} alt="" width={24} height={24} />
          </span>
          <b>Connect a wallet</b>
          <i className="il-ui__progress">
            <i />
          </i>
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
  );
}

function UiLandscape() {
  return (
    <Stage id="ui" width={716} height={440} className="ff__art ff__art--ui il-ui">
      <span className="il-ui__dots" style={{ left: 470, top: 0, width: 246, height: 150 }} />
      <Layer className="il-ui__blob" src={B('imgEllipse3474.svg')} x={-142} y={192.7} w={796} h={852} style={{ transform: 'rotate(151.07deg) scaleY(-1)' }} />
      <Layer className="il-ui__blob" src={B('imgEllipse3475.svg')} x={-169} y={206.7} w={941} h={941} style={{ transform: 'rotate(-90deg) scaleY(-1)' }} />
      <Layer className="il-ui__blob" src={B('imgEllipse3476.svg')} x={38} y={170.7} w={796} h={852} style={{ transform: 'rotate(-90deg) scaleY(-1)' }} />
      <Panel x={129.5} y={160.7} />
      <span className="il-ui__click" />
      <span className="il-ui__cursor" aria-hidden="true" />
    </Stage>
  );
}

/**
 * Portrait (Figma 2597:1126). Two blobs stand behind the panel: the design's combined orbit group
 * across the card's foot, and a single ellipse turned 151° over it.
 */
function UiPortrait() {
  return (
    <Stage id="ui" width={394} height={467} layout="mobile" className="ff__art ff__art--ui il-ui il-ui--m">
      <span className="il-ui__dots" style={{ left: 0, top: 0, width: 0, height: 0 }} />
      {/* Both blobs are centred in their Figma wrapper rather than laid at its corner, so they are
          placed by the centre the file gives them: (224, 377) and (314.5, 431.5). */}
      <Layer className="il-ui__blob" src={B('imgEllipse3470.svg')} x={-74} y={51} w={596} h={652} style={{ transform: 'rotate(151.07deg) scaleY(-1)' }} />
      <Layer className="il-ui__blob" src={B('mobile/ui-orbits.svg')} x={-60} y={16} w={749} h={831} style={{ transform: 'rotate(90deg)' }} />
      <Panel x={32} y={0} />
      <span className="il-ui__click" />
      <span className="il-ui__cursor" aria-hidden="true" />
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
    const h = home(geo(il));
    tl.fromTo(one(il, '.il-ui__cursor'), { x: h.x, y: h.y, opacity: 0 }, { opacity: 1, duration: 0.5 }, at + 1.0);
  },
  idle: (gsap, il) => uiMotion.variants[0].idle(gsap, il),
  variants: [],
};

type G = Parameters<MotionVariant['idle']>[0];
type TL = gsap.core.Timeline;

// Where the cursor's tip goes, in design px. The icon's tip sits at (4.4, 2.9) of the 22px image,
// so the element is offset by that.
const TIP = { x: 4.4, y: 2.9 };
/**
 * Each layout's cursor geometry. `labelX` is where a row's label starts, `row0`/`step` walk the
 * rows' centres, `home` is where the cursor rests between rounds, and `avatar` is the offset from
 * the link icon out to the first row's logo (each row adds `step`).
 */
const GEO = {
  // Rows column from x 400.5, four 56px rows from y 161.7; the panel sits at (129.5, 160.7).
  desktop: { labelX: 468, row0: 189.7, step: 56, home: { x: 600, y: 330 }, avatarX: 246, avatarY0: -6 },
  // Panel at (32, 0), 330×442: 24px of padding, a 168px intro, a 24px gap, then the rows from 192.
  mobile: { labelX: 123.5, row0: 220, step: 56, home: { x: 300, y: 400 }, avatarX: 16, avatarY0: 186 },
} as const;
const geo = (il: HTMLElement) => (isMobile(il) ? GEO.mobile : GEO.desktop);
const rowY = (g: Geo, i: number) => g.row0 + g.step * i;
const rowPoint = (g: Geo, i: number) => ({ x: g.labelX - TIP.x, y: rowY(g, i) - TIP.y });
const home = (g: Geo) => ({ x: g.home.x - TIP.x, y: g.home.y - TIP.y });
const avatarFrom = (g: Geo, i: number) => ({ x: g.avatarX, y: g.avatarY0 + g.step * i });
type Geo = (typeof GEO)[keyof typeof GEO];
const ADDRESSES = ['0x9f3c…27e4', '0x51ab…c0d9', '0xe7a1…4f2b', '0x3d8e…91aa'];

const parts = (il: HTMLElement) => ({
  /** The cursor geometry of whichever layout is on screen. */
  g: geo(il),
  rows: all(il, '.il-ui__row'),
  cursor: one(il, '.il-ui__cursor'),
  ring: one(il, '.il-ui__click'),
  panel: one(il, '.il-ui__panel'),
  intro: one(il, '.il-ui__intro'),
  copy: one(il, '.il-ui__intro p'),
  title: one(il, '.il-ui__introTop b'),
  link: one(il, '.il-ui__link'),
  linkOk: one(il, '.il-ui__linkOk'),
  avatar: one<HTMLImageElement>(il, '.il-ui__avatar'),
  progress: one(il, '.il-ui__progress'),
  progressFill: one(il, '.il-ui__progress i'),
});
type P = ReturnType<typeof parts>;
const restBg = (row: HTMLElement) => getComputedStyle(row).backgroundColor;
const COPY = 'No account to create. Your wallet is your login, and payouts go to any bank you name.';

const ambient = (gsap: G, il: HTMLElement) => {
  const idle = gsap.timeline();
  const across = !isMobile(il);
  all(il, '.il-ui__blob').forEach((b, i) => {
    const d = i % 2 ? -10 : 10;
    idle.to(b, { ...(across ? { x: d } : { y: d }), duration: 8 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0);
  });
  return idle;
};
/** The cursor glides to a row's label. */
const moveTo = (story: TL, p: P, i: number, t: number, duration = 0.75) => story.to(p.cursor, { ...rowPoint(p.g, i), duration, ease: 'power3.inOut' }, t);
/** A click you can feel: the cursor presses, a ring bursts from its tip, the row dips. */
const click = (story: TL, p: P, i: number, t: number) => {
  const row = p.rows[i];
  const at = rowPoint(p.g, i);
  return story
    .fromTo(p.cursor, { scale: 1 }, { scale: 0.8, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '20% 13%' }, t)
    .fromTo(p.ring, { x: at.x + TIP.x, y: at.y + TIP.y, scale: 0.15, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.6, ease: 'power2.out', transformOrigin: '50% 50%' }, t + 0.04)
    .fromTo(row, { scale: 1 }, { scale: 0.975, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, t);
};
/** The row fills to its wallet's full colour; its type turns white and its logo whitens or takes a ring. */
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
/** The panel connects: "Connecting…" with a progress bar in the wallet's colour, then "Connected" with a green mark. */
const connect = (story: TL, p: P, gsap: G, row: HTMLElement, t: number, hold = 1.3) => {
  const c = row.dataset.color!;
  return story
    .add(() => roll(gsap, p.title, 'Connecting…'), t)
    .set(p.progressFill, { backgroundColor: c }, t)
    .fromTo(p.progress, { opacity: 0 }, { opacity: 1, duration: 0.2 }, t)
    .fromTo(p.progressFill, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut', transformOrigin: '0% 50%' }, t + 0.1)
    .add(() => roll(gsap, p.title, 'Connected'), t + 1.4)
    .fromTo(p.linkOk, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)', transformOrigin: '50% 50%' }, t + 1.4)
    .to(p.progress, { opacity: 0, duration: 0.3 }, t + 1.5)
    .add(() => roll(gsap, p.title, 'Connect a wallet'), t + 1.4 + hold)
    .to(p.linkOk, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in' }, t + 1.4 + hold);
};

uiMotion.variants = [
  {
    name: 'Connect',
    blurb: 'The cursor clicks a wallet and the row fills to its colour with white type and logo; under the heading a progress bar in that colour fills while it reads "Connecting…", then "Connected" with a green mark. It releases before the next.',
    idle(gsap, il) {
      const p = parts(il);
      const rest = p.rows.map(restBg);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 0.4 });
      p.rows.forEach((row, i) => {
        const t = i * 4.4;
        moveTo(story, p, i, t);
        click(story, p, i, t + 0.85);
        fill(story, row, t + 0.95);
        connect(story, p, gsap, row, t + 1.0, 1.2);
        unfill(story, row, rest[i], t + 3.7);
      });
      story.to(p.cursor, { ...home(p.g), duration: 0.8, ease: 'power3.inOut' }, p.rows.length * 4.4);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Connect + stay',
    blurb: 'The same connection, but it persists: the chosen wallet stays filled and the green mark stays on until the cursor picks the next one, so exactly one wallet is always connected.',
    idle(gsap, il) {
      const p = parts(il);
      const rest = p.rows.map(restBg);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, delay: 0.4 });
      p.rows.forEach((row, i) => {
        const t = i * 4.0;
        const prevI = (i + p.rows.length - 1) % p.rows.length;
        moveTo(story, p, i, t);
        click(story, p, i, t + 0.85);
        unfill(story, p.rows[prevI], rest[prevI], t + 0.9);
        story.to(p.linkOk, { scale: 0, opacity: 0, duration: 0.2 }, t + 0.9);
        fill(story, row, t + 0.95);
        story
          .add(() => roll(gsap, p.title, 'Connecting…'), t + 1.0)
          .set(p.progressFill, { backgroundColor: row.dataset.color! }, t + 1.0)
          .fromTo(p.progress, { opacity: 0 }, { opacity: 1, duration: 0.2 }, t + 1.0)
          .fromTo(p.progressFill, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut', transformOrigin: '0% 50%' }, t + 1.1)
          .add(() => roll(gsap, p.title, 'Connected'), t + 2.4)
          .fromTo(p.linkOk, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)', transformOrigin: '50% 50%' }, t + 2.4)
          .to(p.progress, { opacity: 0, duration: 0.3 }, t + 2.5);
      });
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Connect + avatar',
    blurb: 'The wallet joins the panel: on connect its logo slides out of the row and docks beside the link icon while the row fills, the progress bar runs, and "Connected" appears; the logo slides home on release.',
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
        story
          .add(() => { p.avatar.src = one<HTMLImageElement>(row, 'img').src; }, t + 0.95)
          .fromTo(p.avatar, { ...avatarFrom(p.g, i), opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.2 }, t + 1.0)
          .to(p.avatar, { x: 0, y: 0, duration: 0.7, ease: 'power3.inOut' }, t + 1.0);
        connect(story, p, gsap, row, t + 1.1, 1.3);
        story.to(p.avatar, { ...avatarFrom(p.g, i), opacity: 0, duration: 0.5, ease: 'power3.inOut' }, t + 3.8);
        unfill(story, row, rest[i], t + 3.9);
      });
      story.to(p.cursor, { ...home(p.g), duration: 0.8, ease: 'power3.inOut' }, p.rows.length * 4.6);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Connect + address',
    blurb: 'Real wallet feel: on connect the copy rolls to the wallet\'s address in the panel while the row fills and the progress bar runs; "Connected" holds a moment, then the copy rolls back.',
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
        connect(story, p, gsap, row, t + 1.0, 1.4);
        story
          .add(() => { roll(gsap, p.copy, `Signed in as ${ADDRESSES[i]}. Payouts go to any bank you name.`); }, t + 2.45)
          .fromTo(p.copy, { color: 'rgba(44,46,49,0.64)' }, { color: '#2c2e31', duration: 0.4 }, t + 2.5)
          .add(() => { roll(gsap, p.copy, COPY); }, t + 3.85)
          .to(p.copy, { color: 'rgba(44,46,49,0.64)', duration: 0.4 }, t + 3.9);
        unfill(story, row, rest[i], t + 3.9);
      });
      story.to(p.cursor, { ...home(p.g), duration: 0.8, ease: 'power3.inOut' }, p.rows.length * 4.6);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Connect + rise',
    blurb: 'The connected wallet moves to the top: the row fills and slides up to the first slot as the others shift down, the progress bar runs and "Connected" appears; it releases and the list settles back.',
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
        story.to(p.cursor, { ...rowPoint(p.g, 0), duration: 0.7, ease: 'power3.inOut' }, t + 1.2);
        for (let j = 0; j < pick; j++) story.to(p.rows[j], { y: 56, duration: 0.7, ease: 'power3.inOut' }, t + 1.2);
        connect(story, p, gsap, p.rows[pick], t + 1.9, 1.0);
        unfill(story, p.rows[pick], rest[pick], t + 4.3);
        story.to(p.rows, { y: 0, duration: 0.7, ease: 'power3.inOut' }, t + 4.5);
      });
      story.to(p.cursor, { ...home(p.g), duration: 0.8, ease: 'power3.inOut' }, 3 * 5.0);
      idle.add(story, 0);
      return idle;
    },
  },
];
