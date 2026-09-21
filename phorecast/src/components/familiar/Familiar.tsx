import type { CSSProperties } from 'react';
import { LiveDot } from '../LiveDot';
import { Roll } from '../Roll';
import { Icon } from '../Icon';
import ecb from '../../assets/familiar/ecb.svg';
import nvidia from '../../assets/familiar/nvidia.svg';
import trendA from '../../assets/familiar/trend-a.svg';
import trendB from '../../assets/familiar/trend-b.svg';
import arrowDown from '../../assets/familiar/arrow-down.svg';
import bank from '../../assets/familiar/bank.svg';
import avatar from '../../assets/familiar/avatar.jpg';
import petro from '../../assets/familiar/petro.jpg';
import logo from '../../assets/familiar/logo.svg';
import signal from '../../assets/familiar/signal.svg';
import data from '../../assets/familiar/data.svg';
import battery from '../../assets/familiar/battery.svg';
import battTip from '../../assets/familiar/batt-tip.svg';
import loc from '../../assets/familiar/loc.svg';
import btc from '../../assets/familiar/btc.svg';
import flagFr from '../../assets/familiar/flag-fr.jpg';
import search from '../../assets/familiar/search.svg';
import filter from '../../assets/familiar/filter.svg';
import trendTab from '../../assets/familiar/trend-tab.svg';
import { useSectionMotion } from '../../lib/motion';
import { buildFamiliar } from './Familiar.motion';
import { familiarLoop } from './Familiar.loop';
import './Familiar.css';

const CANDIDATES = [
  { name: 'Éric Zemmour', pct: '87%' },
  { name: 'François Hollande', pct: '56%' },
  { name: 'Bernard Cazeneuve', pct: '55%' },
];

const CHIPS = ['Politics', 'Sports', 'Crypto', 'Finance'];

/**
 * The two prediction cards that float to the RIGHT OF THE HANDSET.
 *
 * Figma `365:1807` and `474:913` — two 206 x 160 cards of the product's own
 * dark UI, side by side at y 532 with a 14px gutter, the second one 220 design
 * pixels right of the first. Both were re-exported from the file on the same
 * pass; before it there was one real card here and two blurred bitmap crops of
 * `familiar/ghost.png` standing in beside it, which the current frame does not
 * contain at all. See the note over `.fam__pred` in `Familiar.css`.
 *
 * `lines` rather than one string because the design breaks the first card's
 * title by hand (a nowrap block with an explicit break after "sever") and lets
 * the second wrap inside its own 143px measure. `titleW` is that measure, in
 * design pixels; the first card takes the width Figma's nowrap block measures
 * so the break lands where the file puts it rather than wherever the flex row
 * happens to run out.
 *
 * `fill` is the green run of the bar as a percentage of the track, read off the
 * file: the first card's is the whole track — which is why its label is dark,
 * it sits ON the green — and the second's stops at 23.69%, leaving the label
 * over the bare track where it has to be light instead.
 */
const PREDICTIONS = [
  {
    mod: 'a',
    vol: '$112.5K Vol',
    ends: 'Ends in 3mo 17d',
    avatar,
    alt: '',
    lines: ['UAE x Saudi Arabia sever', 'diplomatic relations in 2026?'],
    titleW: 135,
    fill: '100%',
    pct: '95,70%',
  },
  {
    mod: 'b',
    vol: '$95.8K Vol',
    ends: 'Ends in 3mo 17d',
    avatar: petro,
    alt: '',
    lines: ['Will Gustavo Petro be charged in the US by...?'],
    titleW: 143,
    fill: '23.69%',
    pct: '27%',
  },
];

/**
 * Every glyph in this band is sized by `Familiar.css`, not by the file.
 *
 * `Icon` writes a width and a height inline, which would freeze each one at
 * whatever the stage measured when it rendered — the whole band is laid out
 * in `--u`, one design pixel, so a pixel size is wrong at every width but one.
 * `undefined` overrides Icon's own width/height and hands the box straight
 * back to the stylesheet. Six of these are also sized on ONE axis, and the
 * `aspect-ratio` the previous commit put beside each of them is what replaces
 * the intrinsic ratio an <img> resolved `auto` from; a <span> is not a
 * replaced element and would otherwise collapse.
 */
const CSS_SIZED: CSSProperties = { width: undefined, height: undefined };

/**
 * A flat single-colour glyph, masked rather than painted.
 *
 * Eleven of the band's <img> glyphs are one colour on transparent, and as an
 * <img> that colour is unreachable: `color` cannot get inside. As a mask it is
 * ordinary CSS, so each one takes a token — which is how the location arrow
 * and the battery tip keep their #00C950 inside the handset while the market
 * cards' trend arrows follow --pos / --neg out on the page. Every one of them
 * is given an EXPLICIT token whose dark value is the hex Figma baked into the
 * file, so the conversion changes what can reach the glyph and nothing about
 * how it looks.
 *
 * Not converted, deliberately: the ECB and NVIDIA marks (two-colour
 * third-party logos), the BTC coin (an orange disc with a white glyph on it),
 * the down-arrow on the red footer plate (white on --neg in both themes, and
 * --on-accent is what it already inherits), and the eyebrow's live dot, which
 * is three stacked ellipses at three alphas with a white core — flattening it
 * to a silhouette would lose the construction.
 */
function Glyph({ src, className }: { src: string; className: string }) {
  return <Icon src={src} w={0} h={0} className={className} style={CSS_SIZED} />;
}

function Phone() {
  return (
    <div className="fam__phone" aria-hidden="true">
      <div className="fam__screen">
        <div className="fam__status">
          <span className="fam__time">9:41</span>
          <Glyph src={loc} className="fam__loc" />
          <span className="fam__status-right">
            <Glyph src={signal} className="fam__signal" /><Glyph src={data} className="fam__data" />
            <span className="fam__batt"><Glyph src={battery} className="fam__batt-cell" /><Glyph src={battTip} className="fam__batt-tip" /></span>
          </span>
        </div>

        <div className="fam__brand">
          <Glyph src={logo} className="fam__mark" />
          <span>Phorcast</span>
        </div>

        <div className="fam__tabs">
          <span className="is-active">All events</span>
          <span className="fam__tab-trend"><Glyph src={trendTab} className="fam__tab-icon" />Trending</span>
          <i className="fam__tab-rule" />
          <span>Ending Soon</span>
          <span className="fam__tab-cut">Pol</span>
        </div>

        <div className="fam__search">
          <span className="fam__search-field"><Glyph src={search} className="fam__search-icon" />Search markets…</span>
          <Glyph src={filter} className="fam__filter" />
        </div>

        <div className="fam__event">
          <div className="fam__event-meta"><span>$78.4K Vol</span><span>Ends in 7mo 7d</span></div>
          <div className="fam__event-head">
            <img src={flagFr} alt="" className="fam__event-avatar" />
            <p>French Presidential Election: who will announce a run in 2026?</p>
          </div>
          <ul className="fam__rows">
            {CANDIDATES.map((c) => (
              <li key={c.name}>
                <span className="fam__row-name">{c.name}</span>
                <span className="fam__row-pct">{c.pct}</span>
                <span className="fam__chip fam__chip--yes">Yes</span>
                <span className="fam__chip fam__chip--no">No</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="fam__event fam__event--btc">
          <div className="fam__event-meta"><span>$9.3M Vol</span><span>3:01</span></div>
          <div className="fam__btc">
            <img src={btc} alt="" className="fam__btc-icon" />
            <p>BTC Up or Down 5m</p>
            <span className="fam__gauge">63%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketCard(props: {
  mod: string; icon: string; iconClass?: string; symbol: string; name: string;
  value: string; up: boolean; footer: React.ReactNode; footerMod: string;
}) {
  return (
    <div className={`fam__mkt fam__mkt--${props.mod}`} aria-hidden="true">
      <div className="fam__mkt-head">
        <img src={props.icon} alt="" className={`fam__mkt-icon ${props.iconClass ?? ''}`} />
        <span className="fam__mkt-symbol">{props.symbol}</span>
        <Glyph src={props.up ? trendB : trendA} className={`fam__mkt-trend${props.up ? '' : ' is-down'}`} />
      </div>
      <p className="fam__mkt-name">{props.name}</p>
      <p className="fam__mkt-value">{props.value}</p>
      <div className={`fam__mkt-foot fam__mkt-foot--${props.footerMod}`}>{props.footer}</div>
    </div>
  );
}

/**
 * One floating prediction card. Everything it is sized and coloured by lives in
 * `Familiar.css`; this only carries what differs between the two of them.
 */
function Prediction(props: (typeof PREDICTIONS)[number]) {
  return (
    <div className={`fam__pred fam__pred--${props.mod}`} aria-hidden="true">
      <div className="fam__pred-meta"><span>{props.vol}</span><span>{props.ends}</span></div>
      <div className="fam__pred-head">
        <img src={props.avatar} alt={props.alt} />
        <p style={{ maxWidth: `calc(${props.titleW} * var(--u))` }}>
          {props.lines.map((line, i) => (
            <span key={line}>{i > 0 ? <br /> : null}{line}</span>
          ))}
        </p>
      </div>
      <div className="fam__pred-bar"><i style={{ width: props.fill }} /><span>{props.pct}</span></div>
      <div className="fam__pred-btns"><span className="is-yes">Yes</span><span className="is-no">No</span></div>
    </div>
  );
}

export function Familiar() {
  // The band has to climb a quarter of the screen before it opens — the default
  // gate — which is late enough that the sliver showing under the bento is not
  // treated as "scrolled to", and early enough that the phone is never caught
  // half-landed on the way in.
  //
  // The ambient loop is a separate module, `Familiar.loop.ts`, and is wired in
  // here as the `idle` option: useSectionMotion hands it this section element
  // once the entrance timeline completes, and calls the teardown it returns on
  // unmount. Both arguments have to be stable module-scope references, since
  // they are the effect's dependencies.
  //
  const ref = useSectionMotion<HTMLElement>(buildFamiliar, { idle: familiarLoop });

  return (
    <section ref={ref} className="fam" aria-labelledby="fam-title" data-motion="pending">
      <div className="fam__bg glow-fade--top" aria-hidden="true">
        <span className="fam__g fam__g--red" />
        <span className="fam__g fam__g--orange" />
        <span className="fam__g fam__g--peach" />
        <span className="fam__g fam__g--cream" />
      </div>

      <div className="fam__stage">
        <div className="fam__copy fam__copy--left">
          <p className="eyebrow">
            <LiveDot />
            Built for Traders
          </p>
          <h2 id="fam-title" className="fam__title">Familiar Trading.<br />Better Infrastructure.</h2>
        </div>

        <div className="fam__copy fam__copy--right">
          <h3 className="fam__sub-title">Phorcast Trading</h3>
          <p className="fam__sub-body">Trade crypto, forex, stocks, commodities, indices and sports through one simple, intuitive platform.</p>
          <a href="#signup" className="btn btn--primary fam__cta"><Roll>Start Trading</Roll></a>
        </div>

        <MarketCard
          mod="ecb" icon={ecb} symbol="ECB" name="Deposit Facility Rate" value="2.25%" up
          footerMod="dark" footer={<><Glyph src={bank} className="fam__foot-icon" />Current policy rate</>}
        />
        <MarketCard
          mod="nvda" icon={nvidia} iconClass="fam__mkt-icon--nvda" symbol="NVDA" name="NVIDIA" value="$218.36" up={false}
          footerMod="red" footer={<><img src={arrowDown} alt="" className="is-down" />-2.37%</>}
        />

        <Phone />

        {PREDICTIONS.map((p) => <Prediction key={p.mod} {...p} />)}

        {/* THE BOTTOM BAND IS A CHILD OF THE STAGE, and was a sibling of it.
            On a phone the stage is an ordinary column and the Figma mobile
            frame (538:4601) puts the category strip BETWEEN the handset and
            the "Phorcast Trading" copy — so the strip has to be orderable
            against the stage's own children, and `order` only reaches
            siblings. Nothing about the desktop composition moves: the band is
            `position: absolute; inset: auto 0 0` and `.fam` has no in-flow
            child but the stage, so `.fam`'s content box and the stage's are
            the same rectangle and `bottom: 0` resolves to the same line
            against either. It is still the last thing painted, since the stage
            is the only other child of the section. */}
        <div className="fam__band" aria-hidden="true">
          <span className="fam__horizon" />
          <div className="fam__chips">
            <span className="fam__chip-dot" />
            {CHIPS.map((c) => <span key={c} className="fam__chip-pill">{c}</span>)}
            <span className="fam__chip-dot" />
          </div>
        </div>
      </div>
    </section>
  );
}
