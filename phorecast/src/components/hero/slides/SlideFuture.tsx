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
 * The 3D Phorcast mark is NOT rendered here — the hero mounts it as a live
 * WebGL scene (components/HeroLogo). `.sl4__mark-slot` is the empty 370 x 370
 * box it belongs in, at 734, 242 in these same group coordinates.
 */
import { useEffect, useRef } from 'react';
import { Icon } from '../../Icon';
import { useTheme } from '../../../lib/theme';
import { slideFutureMotion } from './SlideFuture.motion';
import ringLg from '../../../assets/hero/slide4/circle-lg.svg';
import ringMd from '../../../assets/hero/slide4/circle-md.svg';
import ringSm from '../../../assets/hero/slide4/circle-sm.svg';
import track from '../../../assets/hero/slide4/dashed-path.svg';
/* The circuit on paper. Gradient artwork, so a light variant rather than a
   mask or an inline -- see SlideAccount.tsx. Its `d` is untouched, which
   matters here more than anywhere: SlideFuture.motion.ts samples a verbatim
   copy of that path to place the travelling order frame by frame. */
import trackLight from '../../../assets/hero/slide4/dashed-path-light.svg';
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

/**
 * Hand a masked glyph's box back to CSS.
 *
 * <Icon> writes `width` and `height` inline from its w/h, because the <img>
 * it replaces usually carries them as attributes. Nothing in this illustration
 * does: every ring, node and badge mark is sized by `calc(N * var(--u))` in
 * SlideFuture.css and would freeze at one width if an inline px value outranked
 * it. The w/h are still passed, and are still the file's intrinsic numbers, so
 * the contract is documented at the call site even though CSS wins.
 */
const NO_BOX = { width: undefined, height: undefined } as const;

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
  const light = useTheme() === 'light';
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return slideFutureMotion(el);
  }, []);

  return (
    <div className="sl4" aria-hidden="true" ref={ref}>
      <div className="sl4__frame">
        <div className="sl4__stage">
          <Icon src={ringLg} w={274} h={274} className="sl4__ring sl4__ring--lg" style={NO_BOX} />
          <Icon src={ringMd} w={186} h={186} className="sl4__ring sl4__ring--md" style={NO_BOX} />
          <Icon src={ringSm} w={143} h={143} className="sl4__ring sl4__ring--sm" style={NO_BOX} />

          <img src={light ? trackLight : track} alt="" className="sl4__track sl4__track--top" />
          <img src={light ? trackLight : track} alt="" className="sl4__track sl4__track--bottom" />

          {BADGES.map(([x, y]) => (
            <span key={`${x}-${y}`} className="sl4__badge" style={{ '--x': x, '--y': y } as Vars}>
              <Icon src={badgeMark} w={32.827} h={35.015} style={NO_BOX} />
            </span>
          ))}

          {/* Reserved for <HeroLogo /> — the live 3D lined mark. */}
          <div className="sl4__mark-slot" />

          {WHITE_NODES.map(([x, y]) => (
            <Icon
              key={`${x}-${y}`}
              src={dotWhite}
              w={6}
              h={6}
              className="sl4__node"
              style={{ '--x': x, '--y': y, '--s': 6, ...NO_BOX } as Vars}
            />
          ))}
          {/* The one grey node. Its colour is carried inline rather than by a
              modifier class because theme-diff.mjs keys an element by its class
              plus its ordinal: renaming the class would report this node as
              GONE and ADDED, which is exactly the noise that keying exists to
              remove. The value is still a token, not a literal. */}
          <Icon src={dotGrey} w={7} h={7} className="sl4__node" style={{ '--x': 278, '--y': 421, '--s': 7, color: 'var(--sl4-node-2)', ...NO_BOX } as Vars} />
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
