import { B, Layer, Stage } from './Stage';
import { all, one, type IllustrationMotion } from './motion';

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
    tl.from(all(il, '.il-ui__blob'), { opacity: 0, scale: 0.8, duration: 1.4, stagger: 0.12, ease: 'power2.out', transformOrigin: '50% 50%' }, at);
    tl.from(one(il, '.il-ui__dots'), { opacity: 0, duration: 1.2, ease: 'power1.out' }, at);
    tl.from(one(il, '.il-ui__panel'), { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out' }, at + 0.3);
    tl.from(all(il, '.il-ui__introTop > *, .il-ui__intro p'), { y: 10, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }, at + 0.6);
    tl.from(all(il, '.il-ui__row'), { x: 40, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, at + 0.7);
  },
  idle(gsap, il) {
    // The blobs breathe and drift. The wallets take turns being picked: a highlight settles on each
    // row in turn, its icon pops, and once the list has been walked the link icon gives a twirl.
    all(il, '.il-ui__blob').forEach((b, i) => gsap.to(b, { x: i % 2 ? -12 : 12, y: i * 4, duration: 6 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    const rows = all(il, '.il-ui__row');
    const link = one(il, '.il-ui__link');
    let i = 0;
    const pick = () => {
      const row = rows[i];
      gsap
        .timeline()
        .fromTo(one(row, '.il-ui__hi'), { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
        .fromTo(row, { x: 0 }, { x: 5, duration: 0.35, ease: 'power2.out' }, 0)
        .fromTo(one(row, 'img'), { scale: 1 }, { scale: 1.2, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0)
        .to(one(row, '.il-ui__hi'), { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 1.6)
        .to(row, { x: 0, duration: 0.5, ease: 'power2.inOut' }, 1.6);
      if (i === rows.length - 1) gsap.to(link, { rotation: '+=360', duration: 0.9, ease: 'back.out(1.4)', transformOrigin: '50% 50%', delay: 0.4 });
      i = (i + 1) % rows.length;
      gsap.delayedCall(2.4, pick);
    };
    gsap.delayedCall(1.2, pick);
  },
};
