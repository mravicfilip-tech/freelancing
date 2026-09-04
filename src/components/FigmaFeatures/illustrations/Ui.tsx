import { B, Layer, Stage } from './Stage';
import { all, one, roll, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "User-friendly interface" (Figma 2409:2544, 716×440): a connect-a-wallet panel with four wallet
 * rows, standing on soft yellow, blue and lavender blobs at the card's foot. A cursor works the
 * list in every loop.
 */
export function Ui() {
  const rows: [string, string, string][] = [
    ['metamask', 'MetaMask', B('imgMetamask1.svg')],
    ['walletconnect', 'Walletconnect', B('exWalletConnect.svg')],
    ['coinbase', 'coinbase wallet', B('exCoinbase.svg')],
    ['phantom', 'phantom', B('imgPhantom1.svg')],
  ];
  return (
    <Stage id="ui" width={716} height={440} className="ff__art ff__art--ui il-ui">
      <span className="il-ui__dots" style={{ left: 470, top: 0, width: 246, height: 150 }} />
      <Layer className="il-ui__blob" src={B('imgEllipse3474.svg')} x={-142} y={192.7} w={796} h={852} style={{ transform: 'rotate(151.07deg) scaleY(-1)' }} />
      <Layer className="il-ui__blob" src={B('imgEllipse3475.svg')} x={-169} y={206.7} w={941} h={941} style={{ transform: 'rotate(-90deg) scaleY(-1)' }} />
      <Layer className="il-ui__blob" src={B('imgEllipse3476.svg')} x={38} y={170.7} w={796} h={852} style={{ transform: 'rotate(-90deg) scaleY(-1)' }} />

      <div className="il-ui__panel" style={{ left: 129.5, top: 160.7 }}>
        <div className="il-ui__intro">
          <span className="il-ui__introTop">
            <img className="il-ui__link" src={B('imgHyperlink1.svg')} alt="" width={20} height={20} />
            <b>Connect a wallet</b>
          </span>
          <p>No account to create. Your wallet is your login, and payouts go to any bank you name.</p>
        </div>
        <div className="il-ui__rows">
          {rows.map(([id, label, icon]) => (
            <span key={id} className={`il-ui__row il-ui__row--${id}`}>
              <i className="il-ui__hi" />
              <img src={icon} alt="" width={24} height={24} />
              {label}
              <i className="il-ui__ok" />
            </span>
          ))}
        </div>
      </div>
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
    tl.from(all(il, '.il-ui__link, .il-ui__introTop b, .il-ui__intro p'), { ...RISE, y: 8, duration: 0.6, stagger: 0.07 }, at + 0.45);
    tl.from(all(il, '.il-ui__row'), { ...RISE, duration: 0.6, stagger: 0.06 }, at + 0.5);
    tl.fromTo(one(il, '.il-ui__cursor'), { x: HOME.x, y: HOME.y, opacity: 0 }, { opacity: 1, duration: 0.5 }, at + 1.0);
  },
  idle: (gsap, il) => uiMotion.variants[0].idle(gsap, il),
  variants: [],
};

type G = Parameters<MotionVariant['idle']>[0];
type TL = gsap.core.Timeline;

// Where the cursor's tip goes, in design px. The rows column starts at 400.5 and each row is 56
// tall from 161.7; the tip lands on the row's label, a third of the way in. The icon's tip sits
// at (4.4, 2.9) of the 22px image, so the element is offset by that.
const TIP = { x: 4.4, y: 2.9 };
const rowPoint = (i: number) => ({ x: 468 - TIP.x, y: 190 + 56 * i - TIP.y });
const HOME = { x: 600 - TIP.x, y: 330 - TIP.y };

const parts = (il: HTMLElement) => ({
  rows: all(il, '.il-ui__row'),
  cursor: one(il, '.il-ui__cursor'),
  ring: one(il, '.il-ui__click'),
  panel: one(il, '.il-ui__panel'),
  title: one(il, '.il-ui__introTop b'),
  link: one(il, '.il-ui__link'),
});
type P = ReturnType<typeof parts>;

const ambient = (gsap: G, il: HTMLElement) => {
  const idle = gsap.timeline();
  all(il, '.il-ui__blob').forEach((b, i) => idle.to(b, { x: i % 2 ? -10 : 10, duration: 8 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0));
  return idle;
};
/** The cursor glides to a row's label. */
const moveTo = (story: TL, p: P, i: number, t: number, duration = 0.75) => story.to(p.cursor, { ...rowPoint(i), duration, ease: 'power3.inOut' }, t);
/** A hover: the row's highlight comes in softly under the cursor. */
const hover = (story: TL, row: HTMLElement, t: number) => story.fromTo(one(row, '.il-ui__hi'), { opacity: 0 }, { opacity: 0.55, duration: 0.25, ease: 'power2.out' }, t);
/** A click you can feel: the cursor presses, a ring bursts from its tip, the row dips and its highlight snaps on. */
const click = (story: TL, p: P, i: number, t: number) => {
  const row = p.rows[i];
  const at = rowPoint(i);
  story
    .fromTo(p.cursor, { scale: 1 }, { scale: 0.8, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '20% 13%' }, t)
    .fromTo(p.ring, { x: at.x + TIP.x, y: at.y + TIP.y, scale: 0.15, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.6, ease: 'power2.out', transformOrigin: '50% 50%' }, t + 0.04)
    .fromTo(row, { scale: 1 }, { scale: 0.975, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, t)
    .to(one(row, '.il-ui__hi'), { opacity: 1, duration: 0.08 }, t + 0.08)
    .fromTo(row, { x: 0 }, { x: 5, duration: 0.35, ease: 'power3.out' }, t + 0.1);
  return story;
};
/** The row lets go of its highlight. */
const release = (story: TL, row: HTMLElement, t: number) =>
  story.to(one(row, '.il-ui__hi'), { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, t).to(row, { x: 0, duration: 0.4, ease: 'power2.inOut' }, t);

uiMotion.variants = [
  {
    name: 'Cursor walk',
    blurb: 'The cursor visits each wallet in turn and clicks it: it presses, a ring bursts from its tip, the row dips under the click and holds its highlight before the cursor moves on.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 0.4 });
      p.rows.forEach((row, i) => {
        const t = i * 2.1;
        moveTo(story, p, i, t);
        click(story, p, i, t + 0.85);
        release(story, row, t + 1.95);
      });
      story.to(p.cursor, { ...HOME, duration: 0.8, ease: 'power3.inOut' }, p.rows.length * 2.1);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Cursor connect',
    blurb: 'The cursor clicks a wallet and the panel answers: the heading rolls to "Connecting…" while the link icon pulses, then "Connected" as the icon turns green; it resets before the next click.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 0.4 });
      p.rows.forEach((row, i) => {
        const t = i * 4.2;
        moveTo(story, p, i, t);
        click(story, p, i, t + 0.85);
        story
          .add(() => roll(gsap, p.title, 'Connecting…'), t + 1.0)
          .fromTo(p.link, { opacity: 1 }, { opacity: 0.35, duration: 0.35, yoyo: true, repeat: 3, ease: 'sine.inOut' }, t + 1.0)
          .add(() => roll(gsap, p.title, 'Connected'), t + 2.5)
          .fromTo(p.link, { filter: 'none' }, { filter: 'invert(31%) sepia(69%) saturate(600%) hue-rotate(115deg) brightness(90%)', duration: 0.3 }, t + 2.5)
          .add(() => roll(gsap, p.title, 'Connect a wallet'), t + 3.7)
          .to(p.link, { filter: 'none', duration: 0.3 }, t + 3.7);
        release(story, row, t + 3.6);
      });
      story.to(p.cursor, { ...HOME, duration: 0.8, ease: 'power3.inOut' }, p.rows.length * 4.2);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Cursor browse',
    blurb: 'More human: the cursor hovers over one wallet, drifts to another and hovers there too, then makes up its mind and clicks it; the hover highlight is soft, the click is firm.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.8, delay: 0.4 });
      const plan: [number, number][] = [
        [0, 2],
        [3, 1],
        [1, 3],
        [2, 0],
      ];
      plan.forEach(([first, chosen], k) => {
        const t = k * 3.3;
        moveTo(story, p, first, t, 0.7);
        hover(story, p.rows[first], t + 0.7);
        story.to(one(p.rows[first], '.il-ui__hi'), { opacity: 0, duration: 0.3 }, t + 1.35);
        moveTo(story, p, chosen, t + 1.3, 0.6);
        hover(story, p.rows[chosen], t + 1.9);
        click(story, p, chosen, t + 2.25);
        release(story, p.rows[chosen], t + 3.1);
      });
      story.to(p.cursor, { ...HOME, duration: 0.8, ease: 'power3.inOut' }, plan.length * 3.3);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Cursor recents',
    blurb: 'The cursor clicks a wallet lower in the list and it slides up to the top as the others shift down, the cursor riding with it; the list keeps itself sorted by use.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.8, delay: 0.4 });
      [1, 2, 3].forEach((pick, k) => {
        const t = k * 3.8;
        moveTo(story, p, pick, t);
        click(story, p, pick, t + 0.85);
        story.to(p.rows[pick], { y: -56 * pick, duration: 0.7, ease: 'power3.inOut' }, t + 1.25);
        story.to(p.cursor, { ...rowPoint(0), duration: 0.7, ease: 'power3.inOut' }, t + 1.25);
        for (let j = 0; j < pick; j++) story.to(p.rows[j], { y: 56, duration: 0.7, ease: 'power3.inOut' }, t + 1.25);
        release(story, p.rows[pick], t + 2.5);
        story.to(p.rows, { y: 0, duration: 0.7, ease: 'power3.inOut' }, t + 3.0);
      });
      story.to(p.cursor, { ...HOME, duration: 0.8, ease: 'power3.inOut' }, 3 * 3.8);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Cursor status',
    blurb: 'The cursor clicks a wallet and a status dot appears beside it, blinking while it pairs and settling solid once connected; the highlight lets go only when the dot is steady.',
    idle(gsap, il) {
      const p = parts(il);
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 0.4 });
      p.rows.forEach((row, i) => {
        const t = i * 3.4;
        const ok = one(row, '.il-ui__ok');
        moveTo(story, p, i, t);
        click(story, p, i, t + 0.85);
        story
          .fromTo(ok, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out', transformOrigin: '50% 50%' }, t + 1.0)
          .fromTo(ok, { opacity: 1 }, { opacity: 0.25, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut' }, t + 1.3)
          .to(ok, { backgroundColor: '#02774d', duration: 0.3 }, t + 2.4)
          .to(ok, { opacity: 0, scale: 0.4, duration: 0.3, ease: 'power2.in' }, t + 3.1)
          .set(ok, { backgroundColor: '#4042d1' }, t + 3.4);
        release(story, row, t + 3.0);
      });
      story.to(p.cursor, { ...HOME, duration: 0.8, ease: 'power3.inOut' }, p.rows.length * 3.4);
      idle.add(story, 0);
      return idle;
    },
  },
];
