/* Hero slide 2 — "One account. Your keys." illustration.
   Figma: file aczG8te17zRGoK5wvirB92, slide 365:293, cluster 365:346
   ("Stats Container"). Re-exported from the node; see SlideAccount.css for the
   geometry and THE EXPORT note there for what the previous pass had wrong.

   Only the illustration lives here. The nav, eyebrow, headline, lede and CTA
   are the slide's own markup (Hero.tsx) and are untouched.

   Geometry is laid out in Figma design pixels scaled by --u (see the CSS), so
   one design px is one 1800th of the hero's content column at any width. */

import { useEffect, useRef } from 'react';

import { Icon } from '../../Icon';
import { useTheme, useThemeEpoch } from '../../../lib/theme';
import { slideAccountMotion } from './SlideAccount.motion';
import './SlideAccount.css';

/* Assets exported from the Figma node. */
import connectorLeft from '../../../assets/hero/slide2/connector-left.svg';
import connectorRight from '../../../assets/hero/slide2/connector-right.svg';
import cardGrid from '../../../assets/hero/slide2/card-grid.svg';
/* Light variants. These are gradient artwork: a mask would flatten the
   gradient to its alpha and throw the colour away, and inlining them would add
   elements to .hero -- which theme-diff.mjs compares by array index, so every
   later element would report as changed. A second file swapped by `src` is the
   one mechanism that leaves the dark DOM, the dark bytes and the dark gate
   untouched. Each is the original with its stops changed and nothing else. */
import connectorLeftLight from '../../../assets/hero/slide2/connector-left-light.svg';
import connectorRightLight from '../../../assets/hero/slide2/connector-right-light.svg';
import cardGridLight from '../../../assets/hero/slide2/card-grid-light.svg';
import chartNflLight from '../../../assets/hero/slide2/chart-nfl-light.svg';
import chartXauLight from '../../../assets/hero/slide2/chart-xau-light.svg';
import trendRingLight from '../../../assets/hero/slide2/trend-ring-light.svg';
import trendArrowNflLight from '../../../assets/hero/slide2/trend-arrow-nfl-light.svg';
import trendArrowXauLight from '../../../assets/hero/slide2/trend-arrow-xau-light.svg';
import nflLogo from '../../../assets/hero/slide2/nfl-logo.svg';
import chiefs from '../../../assets/hero/slide2/chiefs.svg';
import trendRing from '../../../assets/hero/slide2/trend-ring.svg';
import trendArrowNfl from '../../../assets/hero/slide2/trend-arrow-nfl.svg';
import trendArrowXau from '../../../assets/hero/slide2/trend-arrow-xau.svg';
import deltaUp from '../../../assets/hero/slide2/delta-up.svg';
import chartNfl from '../../../assets/hero/slide2/chart-nfl.svg';
import chartXau from '../../../assets/hero/slide2/chart-xau.svg';
import goldCoin from '../../../assets/hero/slide2/gold-coin.svg';
import goldGlyph from '../../../assets/hero/slide2/gold-glyph.svg';
import madrid from '../../../assets/hero/slide2/madrid.jpg';
import lakers from '../../../assets/hero/slide2/lakers.png';
import miniIsrael from '../../../assets/hero/slide2/mini-israel.png';
import toastGlobe from '../../../assets/hero/slide2/toast-globe.svg';
import pie1 from '../../../assets/hero/slide2/pie-1.svg';
import pie2 from '../../../assets/hero/slide2/pie-2.svg';
import pie3 from '../../../assets/hero/slide2/pie-3.svg';
import toastBolt from '../../../assets/hero/slide2/toast-bolt.svg';
import pillDisc from '../../../assets/hero/slide2/pill-disc.svg';
/* The Union inside the disc is the brand mark, the same path Logo.tsx paints
   in the nav -- one flat glyph, so it is the shared asset through <Icon> and
   the colour comes from `color`, not from a second copy of the artwork with a
   white fill baked in. */
import brandMark from '../../../assets/brand/mark.svg';

/* <Icon> writes width/height inline from w/h, which would outrank the
   `calc(N * var(--u))` that sizes everything in this illustration. The numbers
   are still passed, so the file's intrinsic box is recorded at the call site,
   but CSS wins. Same contract as SlideFuture.tsx. */
const NO_BOX = { width: undefined, height: undefined } as const;

const ODDS = [
  { label: 'This year', pct: '92%' },
  { label: '<2 Years', pct: '4%' },
  { label: '5+ Years', pct: '2%' },
];

/* The 1D / 1W / 1M range picker, shared by both 200px market cards. */
function Ranges() {
  return (
    <div className="sl2-mc__ranges">
      <span className="sl2-mc__range is-active">1D</span>
      <span className="sl2-mc__range">1W</span>
      <span className="sl2-mc__range">1M</span>
    </div>
  );
}

export function SlideAccount() {
  const ref = useRef<HTMLDivElement>(null);
  const light = useTheme() === 'light';
  /* The motion module reads the price's settled ink out of getComputedStyle
     when it builds, so that the flash has somewhere exact to return to. It is
     built from a useEffect here rather than through useSectionMotion, so
     nothing else would ever rebuild it -- and a flash that cooled to the dark
     page's ink on paper is the frozen-cool-down failure lib/theme.ts exists to
     prevent. The epoch changes only when the theme actually does. */
  const epoch = useThemeEpoch();

  /* The cluster's own choreography — the detail inside the hero's block
     entrance, and the one loop it keeps. It gates itself on this slide being
     the active one, so nothing is spent behind a hidden slide.
     `.sl2` must keep exactly one child (`.sl2__box`): the hero's shared
     entrance counts the illustration's grandchildren to decide whether to pop
     the parts or rise the whole block. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return slideAccountMotion(el);
  }, [epoch]);

  return (
    <div className="sl2" aria-hidden="true" ref={ref}>
      <div className="sl2__box">
        <div className="sl2__group">
          <div className="sl2__row">
            {/* 390 × 258 prediction card — 365:352 ---------------------- */}
            <article className="sl2-pred">
              <div className="sl2-pred__meta">
                <span>3.2m Vol</span>
                <span>Ends in 1mo 14d</span>
              </div>
              <div className="sl2-pred__head">
                <span className="sl2-pred__avatar">
                  <img src={madrid} alt="" />
                </span>
                <p className="sl2-pred__title">Real Madrid wins Champions League</p>
              </div>
              <ul className="sl2-pred__odds">
                {ODDS.map((o) => (
                  <li key={o.label}>
                    <span className="sl2-pred__label">{o.label}</span>
                    <span className="sl2-pred__pct">{o.pct}</span>
                    <span className="sl2-chip sl2-chip--yes">Yes</span>
                    <span className="sl2-chip sl2-chip--no">No</span>
                  </li>
                ))}
              </ul>
            </article>

            {/* 200 × 258 market card — NFL Super Bowl, 365:407 ---------- */}
            <article className="sl2-mc sl2-mc--nfl">
              <img src={light ? cardGridLight : cardGrid} alt="" className="sl2-mc__grid" />
              <div className="sl2-mc__head">
                <img src={nflLogo} alt="" className="sl2-mc__logo" />
                <p className="sl2-mc__id">
                  <b>NFL</b>
                  <i>Super Bowl Winner</i>
                </p>
                <span className="sl2-mc__trend">
                  <img src={light ? trendRingLight : trendRing} alt="" className="sl2-mc__trend-ring" />
                  <img src={light ? trendArrowNflLight : trendArrowNfl} alt="" className="sl2-mc__trend-arrow" />
                </span>
              </div>
              <div className="sl2-mc__body">
                <div className="sl2-mc__team">
                  <span className="sl2-mc__crest">
                    <img src={chiefs} alt="" />
                  </span>
                  <p className="sl2-mc__id">
                    <b>Kansas City Chiefs</b>
                    <i>Chance to win</i>
                  </p>
                </div>
                <p className="sl2-mc__price">24.<span>0%</span></p>
                <p className="sl2-mc__delta">
                  <Icon src={deltaUp} w={10} h={8.333} style={NO_BOX} />
                  <b>2.4 pp </b>
                  <i>today</i>
                </p>
              </div>
              <img src={light ? chartNflLight : chartNfl} alt="" className="sl2-mc__chart sl2-mc__chart--nfl" />
              <Ranges />
            </article>

            {/* 200 × 258 market card — XAU/USD Gold, 365:474 ------------ */}
            <article className="sl2-mc sl2-mc--xau">
              <img src={light ? cardGridLight : cardGrid} alt="" className="sl2-mc__grid sl2-mc__grid--xau" />
              <div className="sl2-mc__head">
                <span className="sl2-mc__logo sl2-mc__logo--gold">
                  <img src={goldCoin} alt="" className="sl2-mc__coin" />
                  <img src={goldGlyph} alt="" className="sl2-mc__glyph" />
                </span>
                <p className="sl2-mc__id">
                  <b>XAU/USD</b>
                  <i>Gold</i>
                </p>
                <span className="sl2-mc__trend">
                  <img src={light ? trendRingLight : trendRing} alt="" className="sl2-mc__trend-ring" />
                  <img src={light ? trendArrowXauLight : trendArrowXau} alt="" className="sl2-mc__trend-arrow" />
                </span>
              </div>
              <div className="sl2-mc__body">
                <p className="sl2-mc__unit">Market price · USD/oz</p>
                <p className="sl2-mc__price">4,289.74<span>00</span></p>
                <p className="sl2-mc__delta is-down">−0.20%</p>
              </div>
              <img src={light ? chartXauLight : chartXau} alt="" className="sl2-mc__chart sl2-mc__chart--xau" />
              <Ranges />
            </article>

            {/* Two 206 × 124 event cards, 526:1658 / 526:1680. They are
                absolutely placed at x 815 inside the 963-wide row and run 58
                units past its right edge, exactly as the node draws them. */}
            <div className="sl2__minis">
              <article className="sl2-mini sl2-mini--a">
                <div className="sl2-mini__meta">
                  <span>$2.3K Vol</span>
                  <span>Ends in 3mo 17d</span>
                </div>
                <div className="sl2-mini__head">
                  <span className="sl2-mini__avatar sl2-mini__avatar--lakers">
                    <img src={lakers} alt="" />
                  </span>
                  <p className="sl2-mini__title sl2-mini__title--a">
                    {' Will LA Lakers win the 2027 NBA Championship?'}
                  </p>
                </div>
                <div className="sl2-mini__bar">
                  <span style={{ left: '-0.02%', right: '76.33%' }} />
                  <i>27%</i>
                </div>
                <div className="sl2-mini__btns">
                  <span className="is-yes">Yes</span>
                  <span className="is-no">No</span>
                </div>
              </article>

              <article className="sl2-mini sl2-mini--b">
                <div className="sl2-mini__meta">
                  <span>$53.9K Vol</span>
                  <span>Ends in 3mo 17d</span>
                </div>
                <div className="sl2-mini__head">
                  <span className="sl2-mini__avatar">
                    <img src={miniIsrael} alt="" />
                  </span>
                  <p className="sl2-mini__title">
                    Will any country expel an Israeli ambassador by December 31?
                  </p>
                </div>
                <div className="sl2-mini__bar">
                  <span style={{ left: '0%', right: '29.47%' }} />
                  <i>77%</i>
                </div>
                <div className="sl2-mini__btns">
                  <span className="is-yes">Yes</span>
                  <span className="is-no">No</span>
                </div>
              </article>
            </div>
          </div>

          {/* Action Container 538:4465 — toast + two 48px tiles --------- */}
          <div className="sl2__toasts">
            <div className="sl2-toast">
              <Icon src={toastGlobe} w={22} h={22} className="sl2-toast__globe" style={NO_BOX} />
              <span className="sl2-toast__text">
                <b>Trade executed</b>
                <i>Buy 0.25 BTC at 62,894.00</i>
              </span>
            </div>
            <span className="sl2__tile sl2__tile--pie">
              <img src={pie1} alt="" className="sl2__pie sl2__pie--1" />
              <img src={pie2} alt="" className="sl2__pie sl2__pie--2" />
              <img src={pie3} alt="" className="sl2__pie sl2__pie--3" />
            </span>
            <span className="sl2__tile sl2__tile--bolt">
              <img src={toastBolt} alt="" />
            </span>
          </div>
        </div>

        {/* connector curves down to the pill — 365:294 / 365:295 ------- */}
        <img src={light ? connectorLeftLight : connectorLeft} alt="" className="sl2__conn sl2__conn--l" />
        <img src={light ? connectorRightLight : connectorRight} alt="" className="sl2__conn sl2__conn--r" />
        <span className="sl2__diamond" />

        <div className="sl2__pill">
          <span className="sl2__pill-disc">
            <img src={pillDisc} alt="" className="sl2__pill-ring" />
            <Icon src={brandMark} w={18.169} h={21.179} className="sl2__pill-mark" style={NO_BOX} />
          </span>
          <span className="sl2__pill-body">One Account</span>
        </div>
      </div>
    </div>
  );
}
