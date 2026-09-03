import { Layer, Stage, part } from './Stage';
import { all, bob, one, pop, rand, type IllustrationMotion } from './motion';

/** "Super fast" (Figma 2361:2199, 500×436): an orbit of tick rings around the Remittix mark, with coins on the rings. */
export function Fast() {
  return (
    <Stage id="fast" width={500} height={436} className="ff__art ff__art--fast il-fast">
      <div className="il-fast__inner" style={{ left: 23.5, top: -114.5 }}>
        <Layer className="il-fast__rings" src="imgEffect.svg" x={0} y={0} w={550.9} h={563} />
        <span className="il-fast__yen" style={{ left: 124.5, top: 59.4 }}>
          <img src={part('imgClarityYenSolid.svg')} alt="" width={16.8} height={16.8} />
        </span>
        <Layer className="il-fast__logo" src="imgGroup4.svg" x={199.9} y={248.2} w={152} h={78.5} />
      </div>
      <span className="il-coin il-fast__coin" style={{ left: 20.5, top: 217, width: 35, height: 35 }}>
        <img src={part('imgCryptocurrencyColorGbp.svg')} alt="" width={17.8} height={17.8} />
      </span>
      <span className="il-coin il-fast__coin" style={{ left: 121, top: 295, width: 34, height: 34 }}>
        <img src={part('imgCryptocurrencyColorGbp1.svg')} alt="" width={17.3} height={17.3} />
        <img className="il-coin__glyph" src={part('imgVector1.svg')} alt="" style={{ left: 13.1, top: 11.8, width: 9, height: 7.8, transform: 'scaleX(-1)' }} />
      </span>
      <span className="il-coin il-fast__coin" style={{ left: 375, top: 273, width: 37, height: 37 }}>
        <img src={part('imgCryptocurrencyColorGbp2.svg')} alt="" width={18.8} height={18.8} />
        <img className="il-coin__glyph" src={part('imgVector2.svg')} alt="" style={{ left: 15.7, top: 14.2, width: 5.9, height: 9.1 }} />
      </span>
      <span className="il-coin il-coin--bare il-fast__coin" style={{ left: 427, top: 91, width: 35, height: 35 }}>
        <img src={part('imgCryptocurrencyColorXrp.svg')} alt="" width={35} height={35} style={{ transform: 'scaleX(-1)' }} />
      </span>
    </Stage>
  );
}

export const fastMotion: IllustrationMotion = {
  build(tl, il, at) {
    tl.fromTo(one(il, '.il-fast__inner'), { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.3, ease: 'power2.out' }, at);
    tl.from(one(il, '.il-fast__logo'), { opacity: 0, scale: 0.8, duration: 0.9, ease: 'power3.out', transformOrigin: '50% 50%' }, at + 0.5);
    pop(tl, one(il, '.il-fast__yen'), at + 0.8);
    pop(tl, all(il, '.il-fast__coin'), at + 0.45, { stagger: 0.18 });
  },
  idle(gsap, il) {
    // The tick rings turn slowly; the coins breathe, and now and then one pings.
    gsap.to(one(il, '.il-fast__rings'), { rotation: 360, duration: 90, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
    const coins = all(il, '.il-fast__coin');
    coins.forEach((c, i) => bob(gsap, c, 3, 3 + i * 0.4, i * 0.5));
    const ping = () => {
      const coin = coins[Math.floor(Math.random() * coins.length)];
      gsap.fromTo(coin, { boxShadow: '0 0 0 0 rgba(64, 66, 210, 0.35)' }, { boxShadow: '0 0 0 14px rgba(64, 66, 210, 0)', duration: 0.9, ease: 'power2.out' });
      gsap.fromTo(coin, { scale: 1 }, { scale: 1.16, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      gsap.delayedCall(rand(2.4, 4), ping);
    };
    gsap.delayedCall(1.5, ping);
    bob(gsap, one(il, '.il-fast__logo'), 3, 5);
  },
};
