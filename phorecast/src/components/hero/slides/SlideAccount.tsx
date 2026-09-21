/* Hero slide 2 — "One account. Your keys." illustration.
   Figma: file aczG8te17zRGoK5wvirB92, node 365:346 (the right-hand cluster).

   Only the illustration lives here. The nav, eyebrow, headline, lede and CTA
   are the slide's own markup and are untouched.

   Geometry is laid out in Figma design pixels scaled by --u2 (see the CSS),
   so one design px is one 1800th of the hero's content column at any width. */

import { useEffect, useRef } from 'react';

import { Icon } from '../../Icon';
import { useTheme, useThemeEpoch } from '../../../lib/theme';
import { slideAccountMotion } from './SlideAccount.motion';
import './SlideAccount.css';

/* Assets exported from the Figma node. Three photos already exist in the
   project from the earlier pass and are reused rather than duplicated. */
import connectorLeft from '../../../assets/hero/slide2/connector-left.svg';
import connectorRight from '../../../assets/hero/slide2/connector-right.svg';
import cardGrid from '../../../assets/hero/slide2/card-grid.svg';
/* Light variants. These five are gradient artwork: a mask would flatten the
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
import lakers from '../../../assets/hero/slide2/lakers.png';
import ovArrow from '../../../assets/hero/slide2/ov-arrow.svg';
import toastGlobe from '../../../assets/hero/slide2/toast-globe.svg';
import pie1 from '../../../assets/hero/slide2/pie-1.svg';
import pie2 from '../../../assets/hero/slide2/pie-2.svg';
import pie3 from '../../../assets/hero/slide2/pie-3.svg';
import toastBolt from '../../../assets/hero/slide2/toast-bolt.svg';
import pillDisc from '../../../assets/hero/slide2/pill-disc.svg';
import pillMark from '../../../assets/hero/slide2/pill-mark.svg';
/* already in the repo — same bytes as the Figma exports */
import madrid from '../../../assets/hero/pred-real-madrid.jpg';
import guterres from '../../../assets/hero/mini-2.jpg';
import crestGen from '../../../assets/hero/mini-gen.jpg';
import crestSud from '../../../assets/hero/avatar.png';

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
            {/* 390 × 248 prediction card ------------------------------- */}
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

            {/* 200 × 248 market card — NFL Super Bowl ------------------- */}
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
                  <Icon src={deltaUp} w={10} h={8.333} style={{ width: undefined, height: undefined }} />
                  <b>2.4 pp </b>
                  <i>today</i>
                </p>
              </div>
              <img src={light ? chartNflLight : chartNfl} alt="" className="sl2-mc__chart sl2-mc__chart--nfl" />
              <Ranges />
            </article>

            {/* 200 × 248 market card — XAU/USD Gold --------------------- */}
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

            {/* 140px column of three stacked cards ---------------------- */}
            <div className="sl2__minis">
              <article className="sl2-mini sl2-mini--a">
                <div className="sl2-mini__meta">
                  <span>$2.3K Vol</span>
                  <span>Ends in 3mo 16d</span>
                </div>
                <div className="sl2-mini__head">
                  <span className="sl2-mini__avatar sl2-mini__avatar--lakers">
                    <img src={lakers} alt="" />
                  </span>
                  <p className="sl2-mini__title sl2-mini__title--wrap">
                    {' Will LA Lakers win the 2027 NBA Championship?'}
                  </p>
                </div>
                <div className="sl2-mini__bar sl2-mini__bar--a">
                  <span style={{ left: '0.48%', right: '78.3%' }} />
                  <i>29%</i>
                </div>
                <div className="sl2-mini__btns">
                  <span className="is-yes">Yes</span>
                  <span className="is-no">No</span>
                </div>
              </article>

              <article className="sl2-mini sl2-mini--b">
                <div className="sl2-mini__meta">
                  <span>$2.3K Vol</span>
                  <span>Ends in 3mo 16d</span>
                </div>
                <div className="sl2-mini__head">
                  <span className="sl2-mini__avatar">
                    <img src={guterres} alt="" className="sl2-mini__avatar-img" />
                  </span>
                  <p className="sl2-mini__title">António Guterres out by December 31?</p>
                </div>
                <div className="sl2-mini__bar sl2-mini__bar--b">
                  <span style={{ left: '0.31%', right: '40.34%' }} />
                  <i>53,50%</i>
                </div>
                <div className="sl2-mini__btns">
                  <span className="is-yes">Yes</span>
                  <span className="is-no">No</span>
                </div>
              </article>

              <article className="sl2-mini sl2-mini--live">
                <div className="sl2-live__top">
                  <span className="sl2-live__badge"><i />Live</span>
                  <span className="sl2-live__clock">16:00</span>
                  <span className="sl2-live__vol">$229.2K Vol</span>
                  <span className="sl2-live__ov">
                    Game overview
                    <Icon src={ovArrow} w={5.405} h={5.405} style={{ width: undefined, height: undefined }} />
                  </span>
                </div>

                <span className="sl2-live__score sl2-live__score--1">0</span>
                <span className="sl2-live__crest sl2-live__crest--gen">
                  <img src={crestGen} alt="" />
                </span>
                <span className="sl2-live__name sl2-live__name--1">Genoa CFC</span>

                <span className="sl2-live__score sl2-live__score--2">0</span>
                <span className="sl2-live__crest sl2-live__crest--sud">
                  <img src={crestSud} alt="" />
                </span>
                <span className="sl2-live__name sl2-live__name--2">FC Südtirol</span>

                <span className="sl2-live__btn sl2-live__btn--gen"><b>gen</b><i>53¢</i></span>
                <span className="sl2-live__btn sl2-live__btn--draw"><b>Draw</b><i>38¢</i></span>
                <span className="sl2-live__btn sl2-live__btn--sud"><b>sud</b><i>15¢</i></span>
              </article>
            </div>
          </div>

          {/* toast + two 44px icon tiles ------------------------------- */}
          <div className="sl2__toasts">
            <div className="sl2-toast">
              <Icon src={toastGlobe} w={22} h={22} className="sl2-toast__globe" style={{ width: undefined, height: undefined }} />
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

        {/* connector curves down to the pill -------------------------- */}
        <img src={light ? connectorLeftLight : connectorLeft} alt="" className="sl2__conn sl2__conn--l" />
        <img src={light ? connectorRightLight : connectorRight} alt="" className="sl2__conn sl2__conn--r" />
        <span className="sl2__diamond" />

        <div className="sl2__pill">
          <span className="sl2__pill-disc">
            <img src={pillDisc} alt="" className="sl2__pill-ring" />
            <img src={pillMark} alt="" className="sl2__pill-mark" />
          </span>
          <span className="sl2__pill-body">One Account</span>
        </div>
      </div>
    </div>
  );
}
