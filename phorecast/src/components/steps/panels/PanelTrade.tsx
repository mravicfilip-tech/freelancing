import s3Btc from '../../../assets/steps/s3-btc.svg';
import s3Target from '../../../assets/steps/s3-target.svg';
import s3Tesla from '../../../assets/steps/s3-tesla.svg';
import s3Sp500 from '../../../assets/steps/s3-sp500.svg';
import s3Apple from '../../../assets/steps/s3-apple.svg';
import s3GridTall from '../../../assets/steps/s3-grid-tall.svg';
import s3GridShort from '../../../assets/steps/s3-grid-short.svg';
import s3Marker from '../../../assets/steps/s3-marker.svg';
// Raw, not a URL. The graph is one exported vector layer and the loop has to
// reach the line inside it -- nothing inside an <img> is addressable. It paints
// exactly as the <img> did: the export already carries its own 371 x 191
// viewBox and `preserveAspectRatio="none"`, and PanelTrade.css gives it a box of
// exactly those design pixels.
import chartMarkup from '../../../assets/steps/s3-chart.svg?raw';
import { Mark, Glow } from './shared';
import './PanelTrade.css';

/**
 * Namespace the export's internal ids.
 *
 * An inlined SVG's ids are document-global, and Figma numbers them per export
 * session (`paint0_linear_0_17`, `clip0_0_17`, ...), so two panels inlining two
 * exports can collide and silently steal each other's gradients. Only the ids
 * something actually points at with `url(#...)` are renamed, which leaves the
 * layer names -- `Vector 60`, `Detail Point` -- alone for the motion to find.
 * The file on disk stays exactly as Figma exported it.
 */
const CHART_MARKUP = (() => {
  const refs = new Set<string>();
  for (const m of chartMarkup.matchAll(/url\(#([^)]+)\)/g)) refs.add(m[1]);
  let out = chartMarkup;
  for (const id of refs) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out
      .replace(new RegExp(`id="${esc}"`, 'g'), `id="s3-${id}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, 'g'), `url(#s3-${id})`);
  }
  return out;
})();

/* Panel 3 -- market picker and price chart (Figma 365:1532) ----------------- */
const TILES = [
  { mod: 'btc', icon: s3Btc, w: 28, h: 28, active: true },
  { mod: 'gold', icon: s3Target, w: 28, h: 28, active: false },
  { mod: 'tesla', icon: s3Tesla, w: 20.8, h: 20.7113, active: false },
  { mod: 'sp', icon: s3Sp500, w: 30, h: 8, active: false },
  { mod: 'apple', icon: s3Apple, w: 28, h: 28, active: false },
];

/** The measure lines drawn over the graph (365:1573-1580), in Figma's order.
 *  Their x, y and height live in PanelTrade.css as `.s3__grid--<key>`. */
const GRID = [
  { key: 'a', src: s3GridTall, h: 116 },
  { key: 'b', src: s3GridShort, h: 71 },
  { key: 'c', src: s3Marker, h: 64.5 },
  { key: 'd', src: s3GridShort, h: 71 },
  { key: 'e', src: s3GridTall, h: 116 },
  { key: 'f', src: s3GridShort, h: 71 },
  { key: 'g', src: s3GridTall, h: 116 },
  { key: 'h', src: s3GridShort, h: 71 },
];

export function PanelTrade() {
  return (
    <div className="panel panel--3">
      <Mark className="steps__mark--corner" />
      <Glow className="steps__glow--corner" />
      <div className="s3" aria-hidden="true">
        <div className="s3__tiles">
          {TILES.map((t) => (
            <span key={t.mod} className={`s3__tile s3__tile--${t.mod}${t.active ? ' is-active' : ''}`}>
              <img src={t.icon} alt="" width={t.w} height={t.h} />
            </span>
          ))}
        </div>
        <div className="s3__chart-card">
          <p className="s3__label">Market price</p>
          <div className="s3__money">
            <p className="s3__price">
              <span className="s3__price-int">62,894.</span>
              <span className="s3__price-dec">00</span>
            </p>
            <p className="s3__delta">+2.41%</p>
          </div>
          <span className="s3__chart" dangerouslySetInnerHTML={{ __html: CHART_MARKUP }} />
          {GRID.map((g) => (
            <img key={g.key} src={g.src} alt="" width={1} height={g.h} className={`s3__grid s3__grid--${g.key}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
