import s2Lines from '../../../assets/steps/s2-lines.svg';
import s2Node from '../../../assets/steps/s2-node.svg';
import s2Lock from '../../../assets/steps/s2-lock.svg';
import s2Tile1 from '../../../assets/steps/s2-tile1.svg';
import s2Tile2 from '../../../assets/steps/s2-tile2.svg';
import s2Tile3 from '../../../assets/steps/s2-tile3.svg';
import s2Tile4 from '../../../assets/steps/s2-tile4.svg';
import s2Tile5 from '../../../assets/steps/s2-tile5.svg';
import { Mark, Glow } from './shared';
import './PanelFund.css';

/* Panel 2 — funding rails converge on a locked balance ------------------- */
const RAILS = [s2Tile1, s2Tile2, s2Tile3, s2Tile4, s2Tile5];
export function PanelFund() {
  return (
    <div className="panel panel--2">
      <Mark className="steps__mark--right" />
      <Glow className="steps__glow--right" />
      <div className="s2" aria-hidden="true">
        <div className="s2__rails">
          {RAILS.map((icon, i) => (
            <span key={i} className={`s2__tile${i === 0 ? ' is-first' : ''}${i > 2 ? ' is-dim' : ''}`}>
              <img src={icon} alt="" />
            </span>
          ))}
        </div>
        <img src={s2Lines} alt="" className="s2__lines" width={347.7} height={315.7} />
        {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`s2__comet s2__comet--${i}`} />)}
        <span className="s2__node"><img src={s2Node} alt="" /><img src={s2Lock} alt="" className="s2__lock" /></span>
        <div className="s2__balance">
          <div className="s2__balance-inner">
            <p className="s2__balance-label">Balance</p>
            <p className="s2__balance-amt">$18,800</p>
            <span className="s2__dots"><i /><i className="is-bar" /><i /><i /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
