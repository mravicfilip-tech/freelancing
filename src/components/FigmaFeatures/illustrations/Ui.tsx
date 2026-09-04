import { B, Layer, Stage } from './Stage';
import { all, one, roll, EASE, RISE, type IllustrationMotion, type MotionVariant } from './motion';

/**
 * "User-friendly interface" (Figma 2409:2544, 716×440): a connect-a-wallet panel with four wallet
 * rows, standing on soft yellow, blue and lavender blobs at the card's foot.
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
          <i className="il-ui__sheen" />
          {rows.map(([id, label, icon]) => (
            <span key={id} className={`il-ui__row il-ui__row--${id}`}>
              <i className="il-ui__hi" />
              <img src={icon} alt="" width={24} height={24} />
              {label}
            </span>
          ))}
        </div>
      </div>
      <img className="il-ui__cursor" src="/figma/simple/imgCursor2StreamlineNova.svg" alt="" width={22} height={22} style={{ left: 420, top: 184 }} />
    </Stage>
  );
}

export const uiMotion: IllustrationMotion = {
  build(tl, il, at) {
    // The blobs settle, the panel rises, its copy appears in reading order, and the wallet rows
    // follow one after another.
    tl.from(all(il, '.il-ui__blob'), { opacity: 0, duration: 1.4, stagger: 0.1, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-ui__dots'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-ui__panel'), { y: 32, opacity: 0, duration: 1.0, ease: EASE }, at + 0.15);
    tl.from(all(il, '.il-ui__link, .il-ui__introTop b, .il-ui__intro p'), { ...RISE, y: 8, duration: 0.6, stagger: 0.07 }, at + 0.45);
    tl.from(all(il, '.il-ui__row'), { ...RISE, duration: 0.6, stagger: 0.06 }, at + 0.5);
  },
  idle: (gsap, il) => uiMotion.variants[0].idle(gsap, il),
  variants: [],
};

type G = Parameters<MotionVariant['idle']>[0];
const ambient = (gsap: G, il: HTMLElement) => {
  const idle = gsap.timeline();
  all(il, '.il-ui__blob').forEach((b, i) => idle.to(b, { x: i % 2 ? -10 : 10, duration: 8 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0));
  return idle;
};
const highlight = (story: gsap.core.Timeline, row: HTMLElement, t: number, hold = 1.1) => {
  const hi = one(row, '.il-ui__hi');
  story
    .fromTo(hi, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, t)
    .fromTo(row, { x: 0 }, { x: 4, duration: 0.4, ease: 'power2.out' }, t)
    .to(hi, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, t + hold)
    .to(row, { x: 0, duration: 0.4, ease: 'power2.inOut' }, t + hold);
};

uiMotion.variants = [
  {
    name: 'Hover walk',
    blurb: 'A hover walks down the wallet list: each row in turn takes a soft highlight and eases forward, holds, and hands over to the next.',
    idle(gsap, il) {
      const rows = all(il, '.il-ui__row');
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 1.2 });
      rows.forEach((row, i) => highlight(story, row, i * 1.5));
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Connect',
    blurb: 'A wallet is chosen and the panel responds: the heading rolls to "Connecting…" then "Connected", the link icon settles, and the row\'s highlight releases.',
    idle(gsap, il) {
      const rows = all(il, '.il-ui__row');
      const title = one(il, '.il-ui__introTop b');
      const link = one(il, '.il-ui__link');
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 0.5, delay: 1.2 });
      rows.forEach((row, i) => {
        const t = i * 4;
        highlight(story, row, t, 2.6);
        story
          .add(() => roll(gsap, title, 'Connecting…'), t + 0.5)
          .fromTo(link, { opacity: 1 }, { opacity: 0.4, duration: 0.4, yoyo: true, repeat: 3, ease: 'sine.inOut' }, t + 0.5)
          .add(() => roll(gsap, title, 'Connected'), t + 2.2)
          .fromTo(link, { color: '#2c2e31' }, { color: '#02774d', duration: 0.3 }, t + 2.2)
          .add(() => roll(gsap, title, 'Connect a wallet'), t + 3.6)
          .to(link, { color: '#2c2e31', duration: 0.3 }, t + 3.6);
      });
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Cursor',
    blurb: 'A cursor glides to a wallet row and clicks it; the row takes its highlight under the click, then the cursor moves on to the next.',
    idle(gsap, il) {
      const rows = all(il, '.il-ui__row');
      const cursor = one(il, '.il-ui__cursor');
      const panel = one(il, '.il-ui__panel');
      const idle = ambient(gsap, il);
      // Rows are 56px tall in the panel's right column; the cursor aims at each row's label.
      const px = panel.getBoundingClientRect().left;
      void px;
      const story = gsap.timeline({ repeat: -1, delay: 1 });
      story.fromTo(cursor, { opacity: 0, x: 60, y: 40 }, { opacity: 1, duration: 0.4 }, 0);
      rows.forEach((row, i) => {
        const t = 0.4 + i * 2.2;
        story
          .to(cursor, { x: 0, y: i * 56, duration: 0.8, ease: 'power3.inOut' }, t)
          .fromTo(cursor, { scale: 1 }, { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '20% 15%' }, t + 0.85);
        highlight(story, row, t + 0.9, 1.0);
      });
      story.to(cursor, { opacity: 0, x: 60, y: 40 + 56 * 3, duration: 0.5, ease: 'power2.in' }, 0.4 + rows.length * 2.2);
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Recently used',
    blurb: 'The list keeps itself sorted: the wallet just chosen slides up to the top while the others shift down, like a recents list.',
    idle(gsap, il) {
      const rows = all(il, '.il-ui__row');
      const idle = ambient(gsap, il);
      const story = gsap.timeline({ repeat: -1, repeatDelay: 1, delay: 1.5 });
      [1, 2, 3].forEach((pick, k) => {
        const t = k * 3.4;
        highlight(story, rows[pick], t, 0.8);
        story.to(rows[pick], { y: -56 * pick, duration: 0.7, ease: 'power3.inOut' }, t + 0.8);
        for (let j = 0; j < pick; j++) story.to(rows[j], { y: 56, duration: 0.7, ease: 'power3.inOut' }, t + 0.8);
        story.to(rows, { y: 0, duration: 0.7, ease: 'power3.inOut' }, t + 2.6);
      });
      idle.add(story, 0);
      return idle;
    },
  },
  {
    name: 'Ambient sheen',
    blurb: 'Nothing is chosen. A soft light sweeps down the wallet column every few seconds and the blobs drift; the list simply looks alive.',
    idle(gsap, il) {
      const sheen = one(il, '.il-ui__sheen');
      const idle = ambient(gsap, il);
      idle.fromTo(sheen, { yPercent: -120, opacity: 1 }, { yPercent: 320, duration: 1.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 3.4 }, 1);
      return idle;
    },
  },
];
