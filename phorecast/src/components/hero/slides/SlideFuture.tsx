/**
 * Slide 4 — "The Future of Trading".
 *
 * The right-hand network/orbit diagram from Figma frame 365:762, group 365:803.
 * Every coordinate below is the raw Figma number inside that 1264 x 955 group;
 * `.sl4__stage` shifts the origin so they stay readable (see SlideFuture.css).
 *
 * `.sl4` is the container-query container that defines `--u` (see the CSS);
 * `.sl4__frame` is the painted 999 x 570 box, anchored from the right.
 *
 * The 3D Phorecast mark is NOT rendered here — the hero mounts it as a live
 * WebGL scene (components/HeroLogo). `.sl4__mark-slot` is the empty 370 x 370
 * box it belongs in, at 734, 242 in these same group coordinates.
 */
import { useEffect, useRef } from 'react';
import { slideFutureMotion } from './SlideFuture.motion';
import ringLg from '../../../assets/hero/slide4/circle-lg.svg';
import ringMd from '../../../assets/hero/slide4/circle-md.svg';
import ringSm from '../../../assets/hero/slide4/circle-sm.svg';
import track from '../../../assets/hero/slide4/dashed-path.svg';
import badgeMark from '../../../assets/hero/slide4/badge-mark.svg';
import dotWhite from '../../../assets/hero/slide4/dot-white.svg';
import dotGrey from '../../../assets/hero/slide4/dot-grey.svg';
import dotAccent from '../../../assets/hero/slide4/dot-accent.svg';
import btcCircle from '../../../assets/hero/slide4/btc-circle.svg';
import btcGlyph from '../../../assets/hero/slide4/btc-glyph.svg';
import stubLine from '../../../assets/hero/slide4/stub-line.svg';
import tagDot from '../../../assets/hero/slide4/tag-dot.svg';
import './SlideFuture.css';

type Vars = React.CSSProperties & Record<`--${string}`, string | number>;

/** Badge top-left corners. Figma centres them on the track with a translate. */
const BADGES: ReadonlyArray<readonly [number, number]> = [
  [720, 139],   // 365:820  — top left
  [997, 146],   // 474:909  — top right
  [1075, 395],  // 474:905  — right
  [720, 652],   // 474:897  — bottom left
  [997, 645],   // 474:901  — bottom right
];

/** Ellipse 78 — 6px white nodes strung along the circles. */
const WHITE_NODES: ReadonlyArray<readonly [number, number]> = [
  [491, 331], [534, 297], [534, 544], [491, 511], [457, 427], [457, 415],
];

export function SlideFuture() {
  // The illustration's own load-in and loop. It waits for the slide to become
  // active (all four slides are mounted at once) and kills itself on unmount.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return slideFutureMotion(el);
  }, []);

  return (
    <div className="sl4" aria-hidden="true" ref={ref}>
      <div className="sl4__frame">
        <div className="sl4__stage">
          <img src={ringLg} alt="" className="sl4__ring sl4__ring--lg" />
          <img src={ringMd} alt="" className="sl4__ring sl4__ring--md" />
          <img src={ringSm} alt="" className="sl4__ring sl4__ring--sm" />

          <img src={track} alt="" className="sl4__track sl4__track--top" />
          <img src={track} alt="" className="sl4__track sl4__track--bottom" />

          {BADGES.map(([x, y]) => (
            <span key={`${x}-${y}`} className="sl4__badge" style={{ '--x': x, '--y': y } as Vars}>
              <img src={badgeMark} alt="" />
            </span>
          ))}

          {/* Reserved for <HeroLogo /> — the live 3D lined mark. */}
          <div className="sl4__mark-slot" />

          {WHITE_NODES.map(([x, y]) => (
            <img
              key={`${x}-${y}`}
              src={dotWhite}
              alt=""
              className="sl4__node"
              style={{ '--x': x, '--y': y, '--s': 6 } as Vars}
            />
          ))}
          <img src={dotGrey} alt="" className="sl4__node" style={{ '--x': 278, '--y': 421, '--s': 7 } as Vars} />
          <img src={dotAccent} alt="" className="sl4__node" style={{ '--x': 730.97, '--y': 419, '--s': 6 } as Vars} />

          <img src={btcCircle} alt="" className="sl4__coin" />
          <img src={btcGlyph} alt="" className="sl4__coin-glyph" />
          <span className="sl4__pill">BTC/USD</span>

          <img src={stubLine} alt="" className="sl4__stub" />
          <span className="sl4__diamond" />

          <span className="sl4__tag sl4__tag--sport"><img src={tagDot} alt="" />Sport</span>
          <span className="sl4__tag sl4__tag--elections"><img src={tagDot} alt="" />Elections</span>
        </div>
      </div>
    </div>
  );
}
