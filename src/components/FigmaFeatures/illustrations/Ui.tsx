import lines from './svg/imgFrame2085662216.svg?raw';
import dashes from './svg/imgFrame2085662217.svg?raw';
import curve from './svg/imgVector1682.svg?raw';
import curveTop from './svg/imgFrame2085662222.svg?raw';
import curveBottom from './svg/imgFrame2085662221.svg?raw';
import { Stage, Strokes, part } from './Stage';
import { all, bob, draw, one, pop, type IllustrationMotion } from './motion';

/** "User-friendly interface" (Figma 2360:1807, 668×234): two actions feed the Remittix app, which pays out to a card. */
export function Ui() {
  return (
    <Stage id="ui" width={668} height={234} className="ff__art ff__art--ui il-ui">
      <Strokes className="il-ui__curve" svg={curveTop} x={287.25} y={34.75} w={77.5} h={58} style={{ transform: 'rotate(90deg)' }} />
      <Strokes className="il-ui__curve" svg={curveBottom} x={293.25} y={150.75} w={77.5} h={58} style={{ transform: 'rotate(90deg)' }} />
      <Strokes className="il-ui__curve" svg={curve} x={244.8} y={146} w={57.5} h={53.5} style={{ transform: 'rotate(180deg)' }} />
      <Strokes className="il-ui__lines" svg={lines} x={220.8} y={79} w={83} h={78.5} />
      <Strokes className="il-ui__dashes" svg={dashes} x={361.4} y={108} w={58} h={9} />

      <div className="il-ui__action il-ui__pill" style={{ left: 45, top: 65 }}>
        <img src={part('imgFi9235952.svg')} alt="" width={18} height={18} />
        Send crypto payments
      </div>
      <div className="il-ui__action il-ui__pill" style={{ left: 45, top: 121, width: 196 }}>
        <img src={part('imgGroup1.svg')} alt="" width={18} height={18} />
        Straight to bank accounts
      </div>

      <div className="il-ui__app" style={{ left: 296, top: 75 }}>
        <img src={part('imgGroup5.svg')} alt="" width={45.4} height={24.7} />
      </div>
      <div className="il-ui__card" style={{ left: 419, top: 57 }}>
        <span className="il-ui__stripe" />
        <span className="il-ui__discs">
          <i />
          <i />
        </span>
      </div>

      <span className="il-ui__node il-ui__dots" style={{ left: 271, top: 19 }}>
        <i /><i /><i />
      </span>
      <span className="il-ui__node il-ui__round" style={{ left: 332, top: 196 }}>
        <img className="il-ui__gear" src={part('imgWeuiSettingFilled.svg')} alt="" width={15} height={15} />
      </span>
      <span className="il-ui__node il-ui__round" style={{ left: 230, top: 180, width: 36, height: 36 }}>
        <img src={part('imgMynauiUserSolid.svg')} alt="" width={12} height={12} />
      </span>
    </Stage>
  );
}

export const uiMotion: IllustrationMotion = {
  build(tl, il, at, gsap) {
    tl.from(all(il, '.il-ui__action'), { x: -40, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' }, at);
    draw(tl, gsap, all<SVGGeometryElement>(il, '.il-ui__lines path'), at + 0.45, 0.7, 0.1);
    pop(tl, one(il, '.il-ui__app'), at + 0.95, { scale: 0.5, duration: 0.7 });
    tl.from(one(il, '.il-ui__app img'), { opacity: 0, duration: 0.4 }, at + 1.1);
    draw(tl, gsap, all<SVGGeometryElement>(il, '.il-ui__dashes path'), at + 1.2, 0.5, 0.08);
    tl.from(one(il, '.il-ui__card'), { x: 40, opacity: 0, duration: 0.7, ease: 'power3.out' }, at + 1.35);
    all(il, '.il-ui__curve').forEach((c, i) => draw(tl, gsap, all<SVGGeometryElement>(c, 'path'), at + 1.5 + i * 0.1, 0.6));
    pop(tl, all(il, '.il-ui__node'), at + 1.95, { stagger: 0.1 });
  },
  idle(gsap, il) {
    // The dots type; the gear turns; the app breathes; the pills and card drift.
    gsap.to(all(il, '.il-ui__dots i'), { opacity: 0.25, duration: 0.35, ease: 'sine.inOut', stagger: { each: 0.15, repeat: -1, yoyo: true } });
    gsap.to(one(il, '.il-ui__gear'), { rotation: 360, duration: 18, ease: 'none', repeat: -1 });
    gsap.to(one(il, '.il-ui__app'), { y: -3, boxShadow: '0 14px 22px -12px rgba(146, 147, 150, 0.5)', duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    all(il, '.il-ui__action').forEach((p, i) => bob(gsap, p, i ? -2.5 : 2.5, 3.4 + i * 0.4));
    bob(gsap, one(il, '.il-ui__card'), 3, 4.2, 0.6);
  },
};
