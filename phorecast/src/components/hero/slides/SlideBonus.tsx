import { Fragment, useEffect, useRef } from 'react';
// Raw, not a URL: the two stacks are one exported vector layer, and the plates
// inside it have to be addressable for SlideBonus.motion to move them. In an
// <img> they are not reachable at all. Everything about how it paints is
// unchanged -- the SVG already carries `preserveAspectRatio="none"`, so it
// stretches to the same box the image was given.
import stacksMarkup from '../../../assets/hero/slide3/stacks.svg?raw';
import bracket from '../../../assets/hero/slide3/bracket.svg';
import dashed from '../../../assets/hero/slide3/dashed.svg';
import nikkei from '../../../assets/hero/slide3/nikkei.svg';
import sp500 from '../../../assets/hero/slide3/sp500.svg';
import tagDot from '../../../assets/hero/slide3/tag-dot.svg';
import gift1 from '../../../assets/hero/slide3/gift-1.svg';
import gift2 from '../../../assets/hero/slide3/gift-2.svg';
import gift3 from '../../../assets/hero/slide3/gift-3.svg';
import gift4 from '../../../assets/hero/slide3/gift-4.svg';
import gift5 from '../../../assets/hero/slide3/gift-5.svg';
import { Icon } from '../../Icon';
import { useTheme } from '../../../lib/theme';
/* Light variants of the two gradient strokes. See SlideAccount.tsx for why a
   second file rather than an inline or a mask. stacks.svg needs neither: it is
   already inlined, so SlideBonus.css themes its stops directly -- and swapping
   THAT string would replace the element graph under the motion module's feet. */
import bracketLight from '../../../assets/hero/slide3/bracket-light.svg';
import dashedLight from '../../../assets/hero/slide3/dashed-light.svg';
import { bonusCountdownMotion, slideBonusMotion } from './SlideBonus.motion';
import './SlideBonus.css';

/**
 * Hero slide 3 — "Half this stack is on us."
 *
 * The illustration is the Figma frame 464:309: a 964 × 822 design box that sits
 * 64 design px in from the right edge of the 1800px content column. Everything
 * inside is laid out in that frame's own coordinates.
 */
export function SlideBonus() {
  const ref = useRef<HTMLDivElement>(null);
  const light = useTheme() === 'light';

  useEffect(() => (ref.current ? slideBonusMotion(ref.current) : undefined), []);

  return (
    <div
      ref={ref}
      className="sl3"
      role="img"
      aria-label="You deposit $200, Phorcast adds $200, you trade with $400."
    >
      <div className="sl3__frame">
        {/* Both isometric stacks, exported from Figma as one vector layer. */}
        <span
          className="sl3__stacks"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: stacksMarkup }}
        />

        <p className="sl3__total">$400</p>

        <span className="sl3__bracket">
          <img src={light ? bracketLight : bracket} alt="" />
        </span>
        <div className="sl3__adds">
          <span>Phorcast adds</span>
          <strong>+$200</strong>
        </div>

        <p className="sl3__amount">$200</p>
        <span className="sl3__rule">
          <img src={light ? dashedLight : dashed} alt="" />
        </span>
        <span className="sl3__diamond sl3__diamond--start" />
        <span className="sl3__diamond sl3__diamond--end" />

        <p className="sl3__tag sl3__tag--transfer">
          <img src={tagDot} alt="" />
          Transfer
        </p>
        <p className="sl3__tag sl3__tag--stock">
          <img src={tagDot} alt="" />
          Stock
        </p>

        <p className="sl3__cap sl3__cap--deposit">You deposit</p>
        <p className="sl3__cap sl3__cap--trade">You trade with</p>

        <span className="sl3__badge sl3__badge--nikkei">
          <Icon src={nikkei} w={46.08} h={10.24} style={{ width: undefined, height: undefined }} />
        </span>
        <span className="sl3__badge sl3__badge--sp">
          <Icon src={sp500} w={46.08} h={10.24} style={{ width: undefined, height: undefined }} />
        </span>
      </div>
    </div>
  );
}

const COUNTDOWN = [
  { value: '02', unit: 'Days' },
  { value: '14', unit: 'Hours' },
  { value: '38', unit: 'Minutes' },
];

/**
 * The gift glyph ships from Figma as five separate vector layers inside one
 * 16 × 16 box, each with its own inset. Redrawing them as a single path would
 * lose that geometry, so the layers are kept and positioned by class.
 */
function GiftIcon() {
  return (
    <span className="sl3-countdown__gift">
      <img src={gift1} alt="" className="sl3-countdown__gift-1" />
      <img src={gift2} alt="" className="sl3-countdown__gift-2" />
      <img src={gift3} alt="" className="sl3-countdown__gift-3" />
      <img src={gift4} alt="" className="sl3-countdown__gift-4" />
      <img src={gift5} alt="" className="sl3-countdown__gift-5" />
    </span>
  );
}

/**
 * The limited-time bonus block that sits in slide 3's copy column, under the
 * lede and above the "Get your bonus" button (Figma 474:857).
 */
export function BonusCountdown() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => (ref.current ? bonusCountdownMotion(ref.current) : undefined), []);

  return (
    <div className="sl3-countdown" ref={ref}>
      <p className="sl3-countdown__label">
        <GiftIcon />
        Limited-time bonus
      </p>
      <div className="sl3-countdown__tiles">
        {COUNTDOWN.map((item, i) => (
          <Fragment key={item.unit}>
            {i > 0 && <span className="sl3-countdown__colon" aria-hidden="true">:</span>}
            <div className="sl3-countdown__tile">
              <span className="sl3-countdown__value">{item.value}</span>
              <span className="sl3-countdown__unit">{item.unit}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
