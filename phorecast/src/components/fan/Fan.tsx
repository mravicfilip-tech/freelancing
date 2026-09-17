import fanLowerMarkup from '../../assets/fan/fan-lower.svg?raw';
import fanUpperMarkup from '../../assets/fan/fan-upper.svg?raw';
import iconCrypto from '../../assets/fan/icon-crypto.svg';
import iconFinance from '../../assets/fan/icon-finance.svg';
import iconGeopolitics from '../../assets/fan/icon-geopolitics.svg';
import iconTech from '../../assets/fan/icon-tech.svg';
import iconElections from '../../assets/fan/icon-elections.svg';
import iconSportA from '../../assets/fan/icon-sport-a.svg';
import iconSportB from '../../assets/fan/icon-sport-b.svg';
import iconSportC from '../../assets/fan/icon-sport-c.svg';
import tileBg from '../../assets/fan/tile-bg.jpg';
import tileLogo from '../../assets/fan/tile-logo.svg';
import { useSectionMotion } from '../../lib/motion';
import { buildFan } from './Fan.motion';
import { fanLoop } from './Fan.loop';
import './Fan.css';

/* All coordinates are screenshot space inside the 1920 x 675 frame. */
const DIAMONDS = [
  [23, 351.9, '#e5331e'], [97, 429, '#e5331e'], [440, 91, '#5b5b5a'],
  [401, 480, '#e5331e'], [183.9, 469.5, '#fffbf8'], [337.2, 280.1, '#fffbf8'],
  [1886.1, 430.5, '#e5331e'], [1812.1, 353.3, '#e5331e'], [1508.1, 86.3, '#7c7c7c'],
  [1508.1, 302.3, '#e5331e'], [1725.2, 312.8, '#fffbf8'], [1571.9, 502.3, '#fffbf8'],
] as const;

function SportIcon() {
  return (
    <span className="fan__sport">
      <img src={iconSportA} alt="" className="fan__sport-a" />
      <img src={iconSportB} alt="" className="fan__sport-b" />
      <img src={iconSportC} alt="" className="fan__sport-c" />
    </span>
  );
}

/* Figma fixes the three left pills at 120 and hugs the label on the right three. */
const PILLS = [
  { label: 'Crypto', x: 502, y: 212, w: 120, icon: <img src={iconCrypto} alt="" /> },
  { label: 'Sport', x: 201, y: 536, w: 120, icon: <SportIcon /> },
  { label: 'Finance', x: 553, y: 558, w: 120, icon: <img src={iconFinance} alt="" /> },
  { label: 'Geopolitics', x: 1581, y: 188, w: 149, icon: <img src={iconGeopolitics} alt="" /> },
  { label: 'Tech', x: 1639, y: 512, w: 90, icon: <img src={iconTech} alt="" /> },
  { label: 'Elections', x: 1372, y: 556, w: 132, icon: <img src={iconElections} alt="" /> },
];

/**
 * The arcs are inlined rather than dropped in an `<img>` so that the four
 * ellipses inside each file are addressable: the entrance draws them one at a
 * time with `stroke-dashoffset`, which nothing inside an `<img>` can do. The
 * span keeps the same box the image had and `Fan.css` stretches the `<svg>`
 * across it, so the resting render is the one the image produced.
 *
 * Both files are used twice, once per side, and an SVG's ids are document-wide:
 * four copies would put four `filter0_f_0_17` in the page and every `url(#...)`
 * in all of them would resolve to whichever came first. So each copy is given
 * its own suffix. Done once at module load, not per render.
 */
function withIds(markup: string, suffix: string): string {
  return markup
    .replace(/id="([^"]+)"/g, (_, id: string) => `id="${id}__${suffix}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${id}__${suffix})`);
}

const ARC_MARKUP = {
  left: { upper: withIds(fanUpperMarkup, 'la'), lower: withIds(fanLowerMarkup, 'lb') },
  right: { upper: withIds(fanUpperMarkup, 'ra'), lower: withIds(fanLowerMarkup, 'rb') },
};

/** Both arc groups share one 863 x 675 sub-frame; the left one is mirrored. */
function Arcs({ side }: { side: 'left' | 'right' }) {
  const markup = ARC_MARKUP[side];
  return (
    <div className={`fan__arcs fan__arcs--${side}`}>
      <span
        className="fan__lines fan__lines--upper"
        dangerouslySetInnerHTML={{ __html: markup.upper }}
      />
      <span
        className="fan__lines fan__lines--lower"
        dangerouslySetInnerHTML={{ __html: markup.lower }}
      />
    </div>
  );
}

export function Fan() {
  // Scroll-gated on the default margin: the band has to climb a quarter of the
  // screen before it opens, so the sliver showing under the section above is
  // not enough to spend the entrance on.
  //
  // The band's continuing motion is `Fan.loop.ts`, handed over as the `idle`
  // option: the hook starts it on the entrance's `onComplete`, so the two never
  // read as one continuous movement.
  //
  // Importing it puts that module on this component's import path, so saving it
  // hot-updates this file, React remounts the section on the same node and the
  // entrance would perform itself a second time in front of someone who has
  // already watched it. `buildFan` guards against that -- see LANDED there.
  const ref = useSectionMotion<HTMLElement>(buildFan, { idle: fanLoop });

  return (
    <section ref={ref} className="fan" aria-labelledby="fan-title" data-motion="pending">
      <div className="fan__frame">
        <div aria-hidden="true">
          <Arcs side="left" />
          <Arcs side="right" />
          {DIAMONDS.map(([x, y, c], i) => (
            <span key={i} className="fan__diamond" style={{ ['--x' as string]: x, ['--y' as string]: y, background: c }} />
          ))}
          {PILLS.map((p) => (
            <span
              key={p.label}
              className="fan__pill"
              style={{ ['--x' as string]: p.x, ['--y' as string]: p.y, ['--w' as string]: p.w }}
            >
              {p.icon}{p.label}
            </span>
          ))}
        </div>

        <div className="fan__tile" aria-hidden="true">
          <img src={tileBg} alt="" className="fan__tile-bg" />
          <span className="fan__glass"><img src={tileLogo} alt="" /></span>
        </div>
        <h2 id="fan-title" className="fan__title">Your Funds Stay in Your Control</h2>
        <p className="fan__sub">
          Your assets stay under your control through non-custodial infrastructure and transparent on-chain settlement.
        </p>
      </div>
    </section>
  );
}
