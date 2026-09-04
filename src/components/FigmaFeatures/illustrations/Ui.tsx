import { B, Layer, Stage } from './Stage';
import { all, one, EASE, RISE, type IllustrationMotion } from './motion';

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
          {rows.map(([id, label, icon]) => (
            <span key={id} className={`il-ui__row il-ui__row--${id}`}>
              <i className="il-ui__hi" />
              <img src={icon} alt="" width={24} height={24} />
              {label}
            </span>
          ))}
        </div>
      </div>
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
  idle(gsap, il) {
    // A hover walks down the wallet list: each row in turn takes a soft highlight and eases a few
    // pixels forward, holds, and hands over to the next. The blobs drift between passes.
    const rows = all(il, '.il-ui__row');
    const idle = gsap.timeline();
    all(il, '.il-ui__blob').forEach((b, i) => idle.to(b, { x: i % 2 ? -10 : 10, duration: 8 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 0));
    const story = gsap.timeline({ repeat: -1, repeatDelay: 1.2, delay: 1.2 });
    rows.forEach((row, i) => {
      const t = i * 1.5;
      const hi = one(row, '.il-ui__hi');
      story
        .fromTo(hi, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, t)
        .fromTo(row, { x: 0 }, { x: 4, duration: 0.4, ease: 'power2.out' }, t)
        .to(hi, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, t + 1.1)
        .to(row, { x: 0, duration: 0.4, ease: 'power2.inOut' }, t + 1.1);
    });
    idle.add(story, 0);
    return idle;
  },
};
