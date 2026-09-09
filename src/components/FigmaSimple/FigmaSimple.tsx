import { useRef } from 'react';
import orbit from './orbit.svg?raw';
import orbitInner from '../../../public/figma/simple/ellipse-inner.svg?raw';
import { Layer, Stage, Strokes, useMobileArt } from '../FigmaFeatures/illustrations/Stage';
import { useSimpleMotion } from './useSimpleMotion';
import '../FigmaFeatures/illustrations/illustrations.css';
import './FigmaSimple.css';

/**
 * "Crypto-to-fiat payments made simple" from the Figma design "Remittix Redesign", node 2409:2784 ("4").
 * Between the hero and the feature band: a centred two-tone headline, an orbit diagram on a dotted
 * band (currencies circling the Remittix hub, pay-ins on one side and pay-outs on the other), then a
 * paragraph and a Secure · Fast · Compliant pill. The diagram's layers sit in design coordinates on
 * a 1560×586 stage that scales to the band; motion lives in useSimpleMotion.
 *
 * On a phone (node 2603:1541) the file stands the diagram up: the same 1560×586 orbit is turned
 * -75° and centred in a 393×852 frame, so a tall slice of the ellipse runs down the card with the
 * hub at its middle. Only the ellipse, its glow and the anchors on it actually turn — the chips,
 * hub, badge, cursor and coin groups are counter-rotated in the file, which is to say they stay in
 * the frame's own axes, so here they are simply placed in the frame's coordinates instead.
 */

/** Where the orbit's parts sit: the turning ones in the 1560×586 box, the upright ones in the frame. */
const ORBIT = {
  desktop: {
    stage: { w: 1560, h: 586 },
    turn: false,
    ring: { x: 270.4, y: 121.6 },
    glow: { x: 543, y: 235 },
    dots: [{ x: 279.5, y: 352.5 }, { x: 959, y: 115 }],
    markers: [{ x: 391, y: 248 }, { x: 897, y: 403 }],
    payIns: { x: 197, y: 377 },
    payOuts: { x: 990, y: 98 },
    hub: { x: 717.15, y: 233 },
    badge: { x: 870, y: 307 },
    cursor: { x: 842, y: 308 },
    stable: { x: 495.65, y: 146.59 },
    exotic: { x: 512, y: 433 },
    fiat: { x: 1156, y: 233 },
  },
  // Turning parts stay in the box's coordinates; upright parts are given the frame positions the
  // -75° turn puts them at, which is where the file draws them.
  mobile: {
    // Tall enough for what the composition holds: the ring's lower end, its dot and the pay-ins
    // chip all sit past 852, so a screen-height frame cut the pay-in half of the story away.
    stage: { w: 393, h: 1010 },
    turn: true,
    ring: { x: 270.4, y: 121.6 },
    glow: { x: 543, y: 235 },
    dots: [{ x: 279.5, y: 352.5 }, { x: 964, y: 129.96 }],
    markers: [{ x: 393.47, y: 280.76 }, { x: 737.24, y: 427.8 }],
    payIns: { x: 100.2, y: 942.2 },
    payOuts: { x: 72.65, y: 91.5 },
    hub: { x: 135.76, y: 368.75 },
    // The cursor and badge are one upright row in the file (2603:1464), so the turn is applied to
    // the row's centre and the pair is laid out along the frame's own axis from there.
    badge: { x: 102.4, y: 319.3 },
    cursor: { x: 74.4, y: 320.3 },
    stable: { x: 14.6, y: 518.4 },
    exotic: { x: 207.7, y: 662.5 },
    fiat: { x: 235.7, y: 126.5 },
  },
} as const;
type OrbitGeo = (typeof ORBIT)[keyof typeof ORBIT];

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

/**
 * The skew the file gives the orbit (Tailwind `-rotate-15 scale-y-87 skew-x-30`, which composes
 * rotate → skew → scale). The desk band's export has it baked into the path; the portrait frame's
 * ellipses are axis-aligned and carry it here.
 */
const ORBIT_SKEW = 'rotate(-15deg) skewX(30deg) scaleY(0.87)';

/** The ellipse, its glow, and the anchors that sit on it — everything that turns with the orbit. */
function Ring({ g }: { g: OrbitGeo }) {
  return (
    <>
      {/* Portrait draws the orbit as two layers, as the file does (2603:1440/:1441): a filled plate
          and a narrower stroke over it. The desk band's single wide stroke already reads correctly
          across the whole 1560, where the ellipse's ends fall outside the eye's reach. */}
      {g.turn ? (
        <>
          <Layer className="fs__plate" src={A('ellipse-outer')} x={270.45} y={121.62} w={1019} h={354} style={{ transform: ORBIT_SKEW }} />
          <Strokes className="fs__ring" svg={orbitInner} x={395.35} y={119.35} w={786.076} h={354} style={{ transform: ORBIT_SKEW }} />
        </>
      ) : (
        <Strokes className="fs__ring" svg={orbit} x={g.ring.x} y={g.ring.y} w={1019} h={354} />
      )}
      <Layer className="fs__glow" src={A('imgSubtract')} x={g.glow.x} y={g.glow.y} w={584.4} h={488.5} style={{ transform: 'rotate(-24.3deg) scaleY(-1)' }} />
      {g.dots.map((d) => (
        <span key={`${d.x}`} className="fs__dot" style={{ left: d.x, top: d.y }} />
      ))}
      {g.markers.map((m) => (
        <span key={`${m.x}`} className="fs__marker" style={{ left: m.x, top: m.y }}>
          <i className="fs__markerHalo" />
        </span>
      ))}
    </>
  );
}

/** Everything that stays in the frame's own axes: the chips, hub, badge, cursor and coin groups. */
function Upright({ g }: { g: OrbitGeo }) {
  return (
    <>
      <Chip text="PAY-INS" x={g.payIns.x} y={g.payIns.y} />
      <Chip text="PAY-OUTS" x={g.payOuts.x} y={g.payOuts.y} />

      <div className="fs__hub" style={{ left: g.hub.x, top: g.hub.y }}>
        <img src={A('imgGroup3')} alt="" width={68.7} height={35.5} />
      </div>
      <span className="fs__badge" style={{ left: g.badge.x, top: g.badge.y }}>Fast &amp; reliable payments</span>
      <div className="fs__cursor" style={{ left: g.cursor.x, top: g.cursor.y }}>
        <img className="fs__cursorIcon" src={A('imgCursor2StreamlineNova')} alt="" width={24} height={24} />
      </div>

      <Coins id="stable" label="Stablecoins" icons={['imgGroup', 'imgFlatColor1', 'imgFlatColor2']} x={g.stable.x} y={g.stable.y} />
      <Coins id="exotic" label="Exotic currencies" icons={['imgFi12114250', 'imgFlatColor', 'imgSolana1']} x={g.exotic.x} y={g.exotic.y} />
      <Coins id="fiat" label="Traditional currencies" icons={['imgGroup1', 'img561868088', 'imgPound1']} x={g.fiat.x} y={g.fiat.y} />
    </>
  );
}

/**
 * The diagram. The portrait frame keeps the turning parts inside one -75° box (the file's own
 * construction, node 2603:1439) and lays the upright parts straight onto the frame, so the loop's
 * path sampling and the cursor that rides it share the stage's coordinates.
 */
function Orbit() {
  const mobile = useMobileArt();
  const g = mobile ? ORBIT.mobile : ORBIT.desktop;
  return (
    <Stage
      id="orbit"
      width={g.stage.w}
      height={g.stage.h}
      layout={mobile ? 'mobile' : 'desktop'}
      className={`fs__orbit${mobile ? ' fs__orbit--m' : ''}`}
    >
      {g.turn ? (
        <div className="fs__turn" style={{ left: (g.stage.w - 1560) / 2, top: (g.stage.h - 586) / 2, width: 1560, height: 586 }}>
          <Ring g={g} />
        </div>
      ) : (
        <Ring g={g} />
      )}
      <Upright g={g} />
    </Stage>
  );
}

export function FigmaSimple() {
  const root = useRef<HTMLElement>(null);
  const mobile = useMobileArt();
  useSimpleMotion(root, mobile);
  return (
    <section ref={root} className="fs" data-node-id="2409:2784" data-motion="pending" aria-labelledby="fs-title">
      <div className="fs__inner">
        <h2 id="fs-title" className="fs__title" data-node-id="2409:2788">
          <span className="fs__line">
            <span className="fs__lineInner">Crypto-to-fiat</span>
          </span>
          <span className="fs__line">
            <span className="fs__lineInner fs__titleMuted">payments made simple.</span>
          </span>
        </h2>

        <div className="fs__band" data-node-id="2409:2790">
          <Orbit />
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
