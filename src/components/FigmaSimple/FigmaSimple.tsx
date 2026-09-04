import { useRef } from 'react';
import orbit from './orbit.svg?raw';
import { Layer, Stage, Strokes } from '../FigmaFeatures/illustrations/Stage';
import { useSimpleMotion } from './useSimpleMotion';
import '../FigmaFeatures/illustrations/illustrations.css';
import './FigmaSimple.css';

/**
 * "Crypto-to-fiat payments made simple" from the Figma design "Remittix Redesign", node 2409:2784 ("4").
 * Between the hero and the feature band: a centred two-tone headline, an orbit diagram on a dotted
 * band (currencies circling the Remittix hub, pay-ins on one side and pay-outs on the other), then a
 * paragraph and a Secure · Fast · Compliant pill. The diagram's layers sit in design coordinates on
 * a 1560×586 stage that scales to the band; motion lives in useSimpleMotion.
 */

const A = (name: string) => `/figma/simple/${name}.svg`;

function Coins({ label, icons, x, y, id }: { label: string; icons: string[]; x: number; y: number; id: string }) {
  return (
    <div className="fs__group" data-group={id} style={{ left: x, top: y }}>
      <span className="fs__groupLabel">{label}</span>
      <span className="fs__coins">
        <span className="fs__coinsInner">
          {icons.map((icon) => (
            <img key={icon} className="fs__coin" src={A(icon)} alt="" width={32} height={32} />
          ))}
        </span>
      </span>
    </div>
  );
}

function Chip({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <span className="fs__chip" style={{ left: x, top: y }}>
      <img src={A('imgCircleSelectionStreamlineNova')} alt="" width={20} height={20} />
      {text}
    </span>
  );
}

export function FigmaSimple() {
  const root = useRef<HTMLElement>(null);
  useSimpleMotion(root);
  return (
    <section ref={root} className="fs" data-node-id="2409:2784" data-motion="pending" aria-labelledby="fs-title">
      <div className="fs__inner">
        <h2 id="fs-title" className="fs__title" data-node-id="2409:2788">
          Crypto-to-fiat
          <br />
          <span className="fs__titleMuted">payments made simple.</span>
        </h2>

        <div className="fs__band" data-node-id="2409:2790">
          <Stage id="orbit" width={1560} height={586} className="fs__orbit">
            <Strokes className="fs__ring" svg={orbit} x={270.4} y={121.6} w={1019} h={354} />
            <Layer className="fs__glow" src={A('imgSubtract')} x={543} y={235} w={584.4} h={488.5} style={{ transform: 'rotate(-24.3deg) scaleY(-1)' }} />

            <Chip text="PAY-INS" x={197} y={377} />
            <Chip text="PAY-OUTS" x={990} y={98} />

            <div className="fs__hub" style={{ left: 717.15, top: 233 }}>
              <img src={A('imgGroup3')} alt="" width={68.7} height={35.5} />
            </div>
            <div className="fs__cursor" style={{ left: 842, top: 308 }}>
              <img className="fs__cursorIcon" src={A('imgCursor2StreamlineNova')} alt="" width={24} height={24} />
              <span className="fs__badge">Fast &amp; reliable payments</span>
            </div>

            <Coins id="stable" label="Stablecoins" icons={['imgGroup', 'imgFlatColor1', 'imgFlatColor2']} x={495.65} y={146.59} />
            <Coins id="exotic" label="Exotic currencies" icons={['imgFi12114250', 'imgFlatColor', 'imgSolana1']} x={512} y={433} />
            <Coins id="fiat" label="Traditional currencies" icons={['imgGroup1', 'img561868088', 'imgPound1']} x={1156} y={233} />

            <span className="fs__dot" style={{ left: 279.5, top: 352.5 }} />
            <span className="fs__dot" style={{ left: 959, top: 115 }} />
            <span className="fs__marker" style={{ left: 391, top: 248 }} />
            <span className="fs__marker" style={{ left: 897, top: 403 }} />
          </Stage>
        </div>

        <div className="fs__foot">
          <p className="fs__body" data-node-id="2409:2905">
            Remittix operates just like your favorite banking apps, but we allow you to send crypto while ensuring your
            recipients receive fiat. When you need an easy solution for crypto payments, Remittix is your go-to protocol.
          </p>
          <div className="fs__pill" data-node-id="2409:2906">
            <img src={A('imgShieldCheckStreamlineNova')} alt="" width={20} height={20} />
            <span className="fs__pillItems">
              <span>Secure</span>
              <i />
              <span>Fast</span>
              <i />
              <span>Compliant</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
