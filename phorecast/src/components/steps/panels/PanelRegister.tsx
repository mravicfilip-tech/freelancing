import envelope from '../../../assets/steps/s1-envelope.svg';
import cardGlyph from '../../../assets/steps/s1-card-glyph.svg';
import userGlyph from '../../../assets/steps/s1-user-glyph.svg';
import divider from '../../../assets/steps/s1-divider.svg';
import bracket from '../../../assets/steps/s1-bracket.svg';
import connector from '../../../assets/steps/s1-connector.svg';
import indicator from '../../../assets/steps/s1-indicator.svg';
import bottomnav from '../../../assets/steps/s1-bottomnav.svg';
import phoneLogo from '../../../assets/steps/s1-logo.svg';
import statusArrow from '../../../assets/steps/s1-status-arrow.svg';
import signal from '../../../assets/steps/s1-signal.svg';
import data from '../../../assets/steps/s1-data.svg';
import battery from '../../../assets/steps/s1-battery.svg';
import battTip from '../../../assets/steps/s1-batt-tip.svg';
import { Mark, Glow } from './shared';
import './PanelRegister.css';

/* Panel 1 — email → account cards → phone -------------------------------- */
export function PanelRegister() {
  return (
    <div className="panel panel--1">
      <Mark className="steps__mark--full" />
      <Glow className="steps__glow--left" />
      <div className="s1" aria-hidden="true">
        <div className="s1__email">
          <img src={envelope} alt="" width={24} height={18.85} />
          <span>you@phirecast.io<i>|</i></span>
        </div>
        <span className="s1__diamond s1__diamond--orange" />
        <img src={connector} alt="" className="s1__connector" width={91.16} height={107.95} />
        <div className="s1__card s1__card--a">
          <img src={cardGlyph} alt="" className="s1__glyph" />
          <img src={divider} alt="" className="s1__rule" />
          <p className="s1__digits">000 000 000 ****</p>
          <span className="s1__bar s1__bar--pill" />
        </div>
        <div className="s1__card s1__card--b">
          <img src={userGlyph} alt="" className="s1__glyph" />
          <img src={divider} alt="" className="s1__rule" />
          <span className="s1__bar s1__bar--light s1__bar--wide" />
          <span className="s1__bar s1__bar--pill" />
        </div>
        <img src={bracket} alt="" className="s1__bracket" width={80.36} height={182.91} />
        <span className="s1__diamond s1__diamond--white" />
        <div className="s1__phone">
          <div className="s1__status">
            <span className="s1__time">9:41</span>
            <img src={statusArrow} alt="" className="s1__loc" />
            <span className="s1__status-right">
              <img src={signal} alt="" /><img src={data} alt="" />
              <span className="s1__batt"><img src={battery} alt="" /><img src={battTip} alt="" className="s1__batt-tip" /><i>32</i></span>
            </span>
          </div>
          <img src={divider} alt="" className="s1__phone-rule" />
          <div className="s1__phone-head">
            <span className="s1__logo-tile"><img src={phoneLogo} alt="" /></span>
            <span className="s1__skeletons">
              <span className="s1__sk s1__sk--sm" />
              <span className="s1__sk s1__sk--lg" />
            </span>
          </div>
          <span className="s1__bar s1__bar--row" />
          <span className="s1__bar s1__bar--cap" />
          <div className="s1__chart">
            <p className="s1__amount">$3,280</p>
            <div className="s1__bars">
              <span style={{ ['--h' as string]: 26 }} /><span style={{ ['--h' as string]: 34 }} />
              <span className="is-active" style={{ ['--h' as string]: 43 }}><i>+2.41%</i></span>
              <span style={{ ['--h' as string]: 30 }} /><span style={{ ['--h' as string]: 38 }} />
            </div>
          </div>
          <img src={indicator} alt="" className="s1__indicator" />
          <span className="s1__bar s1__bar--block" />
          <img src={bottomnav} alt="" className="s1__nav" />
        </div>
      </div>
    </div>
  );
}
