/* The About page — Figma 531:148, a 1920 x 3660 frame.
   ---------------------------------------------------------------------------
   Six bands, top to bottom: the hero over the ember ground, CHOOSE AN EVENT,
   ABOUT PHORCAST, CAST YOUR CONVICTION, the comparison table, and the two
   primer cards. <Faq /> and <Footer /> are appended by App.tsx, so this file
   is the page's own content and nothing else.

   WHAT WAS REUSED RATHER THAN REBUILT
     - <Nav>, which brings the MORE menu with it.
     - The hero's ember ground: the same `.hero__bg` markup, the same five
       discs and the same horizon, re-anchored for this frame by
       `.hero__bg--about` in About.css. Hero.css is imported here explicitly
       rather than left to whichever module happened to pull it in first.
     - <LiveDot> for every eyebrow. Six bands on the landing page draw that
       dot; the design's `Ellipses` + `Section Title` pair IS that pattern, so
       it is `.eyebrow` + <LiveDot> here too, not a new circle.
     - <Icon> for the two marks, which are the same Union path the wordmark
       already ships as `brand/mark.svg` -- see MARK below.
     - `.btn--primary`, `.container--wide`, `.eyebrow`, `.lede`.

   THE ONE ASSET DECISION WORTH READING. The table's ticks and crosses are NOT
   <Icon>s, and could not be. <Icon> is a CSS mask, and a mask keeps an alpha
   channel and throws the colour away -- Icon.tsx says so itself: "Use it ONLY
   for a file that is one flat colour on transparent." tick.svg is a green
   rounded square with a WHITE check on top of it and cross.svg is a red square
   with a white X; both are opaque across their whole box, so masking either
   one yields a solid rounded rectangle and the symbol disappears. They stay
   <img>, which is also why they need no light-mode work: a filled badge with a
   white glyph reads the same on paper as on black.

   THE MARK, twice. 531:231 (33.83 x 39.43) and 531:277 (26 x 30) are the same
   artwork as `src/assets/brand/mark.svg` -- proportional to five decimal
   places, checked by scaling the path's first coordinate against the viewBox
   -- differing only in the hex they bake, #E5331E where the wordmark bakes the
   artwork red #f03725. Through <Icon> that hex is discarded and the paint is
   `color`, so the codebase file is an exact match and two more near-duplicate
   SVGs did not need to land in src/assets. */

import { LiveDot } from '../LiveDot';
import { Icon } from '../Icon';
import { Nav } from '../Nav';
import { Roll } from '../Roll';
import { useSectionMotion } from '../../lib/motion';
import {
  buildAboutHero, buildChoose, buildBrand, buildConviction, buildCompare, buildPrimer,
} from './About.motion';
import mark from '../../assets/brand/mark.svg';
import cardPick from '../../assets/about/card-pick.png';
import cardSide from '../../assets/about/card-side.png';
import cardExit from '../../assets/about/card-exit.png';
import laptop from '../../assets/about/laptop.png';
import panelLower from '../../assets/about/panel-lower.png';
import panelUpper from '../../assets/about/panel-upper.png';
import tick from '../../assets/about/tick.svg';
import cross from '../../assets/about/cross.svg';
import logoKalshi from '../../assets/about/logo-kalshi.png';
import logoPolymarket from '../../assets/about/logo-polymarket.png';
import logoPredictfun from '../../assets/about/logo-predictfun.png';
import logoMagicmarkets from '../../assets/about/logo-magicmarkets.png';
import '../hero/Hero.css';
import './About.css';

/* ── 1. Hero ──────────────────────────────────────────────────────────────── */

function AboutHero() {
  // Above the fold by definition, so it does not go through the observer —
  // the same call the landing hero makes, and for the same reason.
  const ref = useSectionMotion<HTMLElement>(buildAboutHero, { immediate: true });
  return (
    <section ref={ref} className="ab-hero" id="top" data-motion="pending">
      {/* The landing hero's ground, verbatim -- five discs, the horizon, the
          same `--hero-g-*` tokens and the same light-mode inversion.

          The wrapper carries `.hero` ON PURPOSE and it is not decoration:
          Hero.css declares the whole ember ramp, and the light block that
          turns it around, on `.hero` itself. A copy of those values in this
          file would be a second source of truth for a ramp that was tuned as
          a unit and would drift the first time either moved. Borrowing the
          class borrows the palette instead, and About.css then overrides the
          four box properties `.hero` brings with it (min-height, padding,
          background, position) and nothing else. */}
      <div className="hero ab-hero__ground" aria-hidden="true">
      <div className="hero__bg hero__bg--about">
        <span className="hero__glow hero__glow--ember" />
        <span className="hero__glow hero__glow--peach" />
        <span className="hero__glow hero__glow--orange" />
        <span className="hero__glow hero__glow--core" />
        <span className="hero__glow hero__glow--cream" />
        <span className="hero__horizon" />
      </div>
      </div>

      <div className="container container--wide ab-col ab-hero__inner">
        <Nav />
        <div className="ab-hero__copy">
          <h1 className="ab-hero__title">A prediction market for real-world events — simple and transparent</h1>
          <p className="lede ab-hero__lede">
            You buy an “opinion” (YES/NO) like a stock: you can hold it until the event resolves or sell earlier and lock in profit while market expectations shift.
          </p>
          <a href="#signup" className="btn btn--primary ab-hero__cta"><Roll>Get Started</Roll></a>
        </div>
      </div>
    </section>
  );
}

/* ── 2. Choose an event ───────────────────────────────────────────────────── */

/** The three cards' copy, and the crop each screenshot sits at in its window.
 *
 *  The three images are placed the way 531:190 / 531:199 / 531:208 place them:
 *  a 524 x 238 window with the right corners rounded, and a screenshot larger
 *  than the window offset inside it. The numbers below are those offsets
 *  restated as percentages OF THE WINDOW, which is the only form that survives
 *  the window becoming fluid — Figma states them as a box inside a box inside
 *  a box, and three nested percentage bases do not fold into a stylesheet. */
const CARDS = [
  {
    key: 'pick',
    img: cardPick,
    title: 'Pick a market',
    body: ['Hundreds of markets across crypto, stocks, forex, indices, commodities and sports. Find one you have a view on.'],
    crop: { left: '0%', top: '-18.24%', width: '140.65%', height: '151.44%' },
  },
  {
    key: 'side',
    img: cardSide,
    title: 'Take a side',
    body: ['Every market has two options: buy YES or buy NO.', 'Pick the one you think wins'],
    crop: { left: '-0.757%', top: '0.4%', width: '119.15%', height: '116.39%' },
  },
  {
    key: 'exit',
    img: cardExit,
    title: 'Exit when you want',
    body: ['Hold to resolution or sell early to lock in profit or cut a loss — just like trading a stock.'],
    crop: { left: '-4.641%', top: '0.13%', width: '115.76%', height: '114.29%' },
  },
] as const;

function Choose() {
  const ref = useSectionMotion<HTMLElement>(buildChoose);
  return (
    <section ref={ref} className="ab-choose" aria-labelledby="ab-choose-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-choose__inner">
          <h2 className="eyebrow" id="ab-choose-title"><LiveDot />Choose an event</h2>
          <ul className="ab-choose__row">
            {CARDS.map((c) => (
              <li key={c.key} className="ab-card">
                <div className="ab-card__shot">
                  <img src={c.img} alt="" className="ab-card__img" style={c.crop} decoding="async" />
                </div>
                <div className="ab-card__text">
                  <h3 className="ab-card__title">{c.title}</h3>
                  <p className="ab-card__body">
                    {c.body.map((line, i) => (
                      <span key={line}>{i > 0 && <br />}{line}</span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── 3. About Phorcast ────────────────────────────────────────────────────── */

function Brand() {
  const ref = useSectionMotion<HTMLElement>(buildBrand);
  return (
    <section ref={ref} className="ab-brand" aria-labelledby="ab-brand-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-brand__inner">
          <h2 className="eyebrow" id="ab-brand-title"><LiveDot />About Phorcast</h2>
          <div className="ab-brand__card">
            <div className="ab-brand__copy">
              <Icon src={mark} w={33.827} h={39.432} className="ab-brand__mark" />
              <div className="ab-brand__prose">
                <p>
                  <strong>Phorcast</strong> is a prediction market platform where you trade on what happens next. Take a position on hundreds of markets across sports, crypto, stocks, forex, indices, commodities, and real-world assets from the next five minutes to the next twelve months.
                </p>
                <p>
                  Every contract is simple: pick a market, pick a side, stake your conviction. No leverage, no liquidations, no margin calls.<br />
                  Your maximum loss is always the amount you put in.
                </p>
              </div>
            </div>

            {/* 531:238 / 531:239 / 531:240. Each one is the node's own export,
                which Figma already clipped to the card — so the three files
                are the visible part at 1.5x and not three multi-megabyte
                source photographs cropped again in the browser. Paint order
                is the design's: body, lower panel, upper panel. */}
            {/* `loading="lazy"` and `decoding="async"` on all three, and this
                is the one performance decision on the page. They are the only
                large rasters here -- 82, 132 and 173 KB -- and they sit a
                screen and a half down. Decoded eagerly on the main thread they
                land in the middle of the bands above them building their
                entrances, and a blocked main thread does not advance a GSAP
                timeline (lag smoothing is on, deliberately; src/lib/motion.ts
                says why). Measured at 1600 before this, the CHOOSE band's
                sampler saw 16 frames in five seconds. */}
            <div className="ab-brand__visual" aria-hidden="true">
              <img src={laptop} alt="" className="ab-brand__laptop" loading="lazy" decoding="async" />
              <img src={panelLower} alt="" className="ab-brand__panel ab-brand__panel--lower" loading="lazy" decoding="async" />
              <img src={panelUpper} alt="" className="ab-brand__panel ab-brand__panel--upper" loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 4. Cast your conviction ──────────────────────────────────────────────── */

function Conviction() {
  const ref = useSectionMotion<HTMLElement>(buildConviction);
  return (
    <section ref={ref} className="ab-conv" aria-labelledby="ab-conv-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-conv__inner">
          <h2 className="eyebrow" id="ab-conv-title"><LiveDot />Cast your conviction</h2>
          {/* The opening runs bright and turns over to the accent on its last
              letter; the rest sits back. See the note on `.ab-conv__statement`
              in About.css for how the design does that and why it is a
              background on the whole block rather than a span. */}
          <p className="ab-conv__statement">
            We were founded{' '}
            <span className="ab-conv__rest">
              by traders and fintech professionals who spent years on derivative and crypto platforms and wanted something cleaner, a market that&apos;s easy to read, fast to trade and deep enough to fill your size. That&apos;s what we&apos;re building.
            </span>
          </p>
          <p className="ab-conv__goal">
            Our goal is straightforward: to become the platform serious traders choose when they want to trade outcomes, not just price.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── 5. How it works: price and profit ────────────────────────────────────── */

const CRITERIA = [
  'Trade Sports, Crypto & RWAs',
  'No KYC Account Opening',
  'Own Native Token',
  'Offer Sign-up Bonus',
  'Multi-chain Access',
] as const;

/** Column header plus its five answers, in the frame's own order. `logo` is
 *  null for Phorcast, whose mark is the codebase's own `brand/mark.svg`. */
const BRANDS: { name: string; logo: string | null; box: string; yes: boolean[] }[] = [
  { name: 'Phorcast', logo: null, box: 'ab-cmp__logo--phorcast', yes: [true, true, true, true, true] },
  { name: 'Kalshi', logo: logoKalshi, box: 'ab-cmp__logo--kalshi', yes: [true, false, false, true, false] },
  { name: 'Polymarket', logo: logoPolymarket, box: 'ab-cmp__logo--polymarket', yes: [true, true, true, true, false] },
  { name: 'Predict.fun', logo: logoPredictfun, box: 'ab-cmp__logo--predictfun', yes: [true, true, true, false, false] },
  { name: 'MagicMarkets', logo: logoMagicmarkets, box: 'ab-cmp__logo--magicmarkets', yes: [false, true, false, false, false] },
];

function Compare() {
  const ref = useSectionMotion<HTMLElement>(buildCompare);
  return (
    <section ref={ref} className="ab-cmp" aria-labelledby="ab-cmp-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-cmp__inner">
          <h2 className="eyebrow" id="ab-cmp-title"><LiveDot />How it works: price and profit</h2>
          <div className="ab-cmp__card">
            {/* A real <table>, because this is a real table: five criteria
                against five venues, and a screen reader should be able to ask
                "what does Kalshi do about KYC" and be answered by the row and
                column headers rather than by reading order. The scroller is
                what the phone block below turns on; at desktop widths it
                never scrolls. */}
            <div className="ab-cmp__scroll">
              <table className="ab-cmp__table">
                <thead>
                  <tr>
                    <th scope="col" className="ab-cmp__crit ab-cmp__crit--head">Criterion</th>
                    {BRANDS.map((b) => (
                      <th key={b.name} scope="col" className="ab-cmp__brand">
                        <span className={`ab-cmp__logo ${b.box}`}>
                          {b.logo
                            ? <img src={b.logo} alt="" loading="lazy" decoding="async" />
                            : <Icon src={mark} w={26} h={30} className="ab-cmp__mark" />}
                        </span>
                        <span className="ab-cmp__name">{b.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRITERIA.map((c, row) => (
                    <tr key={c}>
                      <th scope="row" className="ab-cmp__crit">{c}</th>
                      {BRANDS.map((b) => (
                        <td key={b.name}>
                          <img
                            className="ab-cmp__vote"
                            src={b.yes[row] ? tick : cross}
                            alt={b.yes[row] ? 'Yes' : 'No'}
                            width={38.5}
                            height={38.5}
                            decoding="async"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 6. Why is it better than bets or crypto/stocks? ──────────────────────── */

function Primer() {
  const ref = useSectionMotion<HTMLElement>(buildPrimer);
  return (
    <section ref={ref} className="ab-why" aria-labelledby="ab-why-title" data-motion="pending">
      <div className="container container--wide ab-col">
        <div className="ab-why__inner">
          <h2 className="eyebrow" id="ab-why-title"><LiveDot />Why is it better than bets or crypto/stocks?</h2>
          <div className="ab-why__row">
            <article className="ab-why__card">
              <h3 className="ab-why__title">How Trading Prediction Markets Work?</h3>
              <div className="ab-why__body">
                <p className="ab-why__lead">Price = what the market thinks will happen</p>
                <ul className="ab-why__list">
                  <li>Every outcome trades at a price between 1¢ and 99¢.</li>
                  <li>That price is the market&apos;s probability. YES at 70¢ means the market puts a 70% chance on it happening.</li>
                  <li>If you&apos;re right, each contract pays out $1. Buy at 70¢, win, collect $1 — your profit is 30¢ per contract.</li>
                  <li>Prices move as traders buy and sell. When new information hits, the price hits with it.</li>
                </ul>
              </div>
            </article>

            <article className="ab-why__card">
              <h3 className="ab-why__title">Example</h3>
              <div className="ab-why__body">
                <p>YES is trading at 70¢ — the market gives this outcome a 70% chance.</p>
                <p>
                  <strong>You back YES with $1,000.</strong><br />
                  That buys you 1,428 contracts. If the event happens, each one pays $1 — you collect $1,428. Profit: $428 (+43%).
                </p>
                <p>
                  <strong>You think the market&apos;s wrong and back NO at 30¢.</strong><br />
                  That buys you 3,333 contracts. If the event doesn&apos;t happen, you collect $3,333. Profit: $2,333 (+233%).
                </p>
                <p className="ab-why__close">Either way, your maximum loss is the $1,000 you put in.</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <>
      <AboutHero />
      <Choose />
      <Brand />
      <Conviction />
      <Compare />
      <Primer />
    </>
  );
}
