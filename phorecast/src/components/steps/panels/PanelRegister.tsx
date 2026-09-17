import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
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
import battFill from '../../../assets/steps/s1-batt-tip.svg';
import { REDUCED, all, count, one } from '../../../lib/motion';
import { tok, useThemeEpoch } from '../../../lib/theme';
import { Mark, Glow } from './shared';
import './PanelRegister.css';

/* The loop ------------------------------------------------------------------
 *
 * One beat, and it is the step's own sentence acted out: an email address
 * becomes an account becomes a working app.
 *
 *   0.00  the pill's stroke comes up to full orange and the envelope lands
 *   0.30  the address types itself in -- the text is revealed by a clip and the
 *         caret rides the reveal's leading edge, so it travels the whole string
 *   1.15  the orange diamond fires and the caret blinks twice
 *   1.35  the wire between pill and cards energises left to right
 *   1.95  the two account cards slide in off the wire, 0.15 apart, and each one
 *         fills: glyph, rule, then its fields
 *   2.55  the bracket to the phone draws, and the white diamond pops at its end
 *   3.20  the phone wakes -- chrome, then the chart, then the five columns grow
 *         from the axis with the balance counting up beside them
 *   4.00  the +2.41% flag lands on the orange column. Story ends at 4.35.
 *   4.35  everything is handed back to CSS (`clearProps`), and the panel sits
 *         perfectly still for 1.55s before going again. Period 5.90s in GSAP
 *         time, inside the stepper's 6s dwell.
 *
 * Mechanics worth keeping:
 * - The hidden state is a `tl.set(..., 0)`. A timeline `set` at position 0
 *   renders when the timeline is built (so nothing flashes at its design value
 *   before the first frame -- this is a layout effect) AND every time the
 *   playhead returns to 0, so each repeat re-hides without a second code path.
 *   Nothing here is a delayed `fromTo`, which is the only construct that writes
 *   its start value at build time and strands elements in it; where a `to`
 *   needs an explicit landing value it is stated, never inferred.
 * - Rest is the design: a single `clearProps` at STORY removes every inline
 *   style the loop wrote, and the counted balance is put back by hand on
 *   teardown because text content is not a style.
 * - No hover, no pointer, no idle drift. Reduced motion never builds anything.
 */
const STORY = 4.35;
const REST = 1.55;

function useRegisterLoop() {
  const ref = useRef<HTMLDivElement>(null);
  /* The loop reads the pill's two stroke colours once, at build time, exactly
     where it already measures the box -- so it has to be rebuilt when the
     theme changes or it would keep tweening to the palette that was live when
     the panel mounted. The stepper does remount this panel every six seconds,
     but a six-second window of the wrong red is still the wrong red. */
  const epoch = useThemeEpoch();

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || REDUCED) return;

    const q = (sel: string) => one(root, sel);
    const pill = q('.s1__email');
    const env = q('.s1__envelope');
    const addr = q('.s1__addr-in');
    const caret = q('.s1__caret');
    const dOrange = q('.s1__diamond--orange');
    const dWhite = q('.s1__diamond--white');
    const wire = q('.s1__connector');
    const arm = q('.s1__bracket');
    const cardA = q('.s1__card--a');
    const cardB = q('.s1__card--b');
    const chart = q('.s1__chart');
    const amount = q('.s1__amount');
    const delta = q('.s1__delta');
    const cols = all(root, '.s1__col');
    const chrome = [
      q('.s1__status'), q('.s1__status-right'), q('.s1__phone-rule'), q('.s1__phone-head'),
      q('.s1__bar--row'), q('.s1__bar--cap'),
    ].filter((el): el is HTMLElement => !!el);
    const block = q('.s1__bar--block');
    const trim = [q('.s1__indicator'), q('.s1__nav')].filter((el): el is HTMLElement => !!el);

    if (!pill || !env || !addr || !caret || !dOrange || !dWhite || !wire || !arm) return;
    if (!cardA || !cardB || !chart || !amount || !delta || !block || cols.length !== 5) return;

    // The design pixel, read off the rendered box rather than out of `--p`:
    // the unit is written in container-query units and computes to an
    // unresolved token, so it can only be measured.
    const p = root.getBoundingClientRect().width / 760;
    const restAmount = amount.textContent ?? '$3,280';
    // How far the caret has to come back from: the full width of the address.
    const run = addr.getBoundingClientRect().width;
    // The pill's stroke, as a pair. Today's values are the fallbacks, so a
    // missing custom property yields exactly what the panel shipped with.
    const pillRest = tok('--steps-p1-pill-rest', 'rgba(229, 51, 30, 0.22)');
    const pillLit = tok('--steps-p1-pill-lit', 'rgb(229, 51, 30)');

    const innardsA = [q('.s1__glyph--card'), q('.s1__card--a .s1__rule'), q('.s1__digits'), q('.s1__card--a .s1__bar--pill')]
      .filter((el): el is HTMLElement => !!el);
    const innardsB = [q('.s1__glyph--user'), q('.s1__card--b .s1__rule'), q('.s1__bar--wide'), q('.s1__card--b .s1__bar--pill')]
      .filter((el): el is HTMLElement => !!el);

    const everything = [
      pill, env, addr, caret, dOrange, dWhite, wire, arm, cardA, cardB, chart, amount, delta,
      block, ...cols, ...chrome, ...trim, ...innardsA, ...innardsB,
    ];

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: REST, paused: true });

      /* ---- the panel at the start of the story, re-applied on every repeat */
      tl.set(pill, { borderColor: pillRest }, 0)
        .set(env, { opacity: 0, scale: 0.55, transformOrigin: '50% 50%' }, 0)
        .set(addr, { clipPath: 'inset(0% 100% 0% 0%)' }, 0)
        .set(caret, { x: -run }, 0)
        .set([dOrange, dWhite], { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, 0)
        .set([wire, arm], { clipPath: 'inset(0% 100% 0% 0%)' }, 0)
        .set([cardA, cardB], { opacity: 0, x: -22 * p }, 0)
        .set([...innardsA, ...innardsB], { opacity: 0 }, 0)
        .set([q('.s1__card--a .s1__rule'), q('.s1__card--b .s1__rule')], { scaleX: 0, transformOrigin: '0% 50%' }, 0)
        .set([q('.s1__card--a .s1__bar--pill'), q('.s1__card--b .s1__bar--pill'), q('.s1__bar--wide')],
          { scaleX: 0, transformOrigin: '0% 50%' }, 0)
        .set([q('.s1__glyph--card'), q('.s1__glyph--user')], { scale: 0.5, transformOrigin: '50% 50%' }, 0)
        .set(q('.s1__digits'), { y: 6 * p }, 0)
        .set([...chrome, ...trim, chart], { opacity: 0 }, 0)
        .set(block, { opacity: 0 }, 0)
        .set(cols, { scaleY: 0, transformOrigin: '50% 100%' }, 0)
        .set(delta, { opacity: 0, scale: 0.5, y: 4 * p, transformOrigin: '50% 100%' }, 0)
        .call(() => { amount.textContent = '$0'; }, undefined, 0);

      /* ---- 1. the pill wakes and the address types itself */
      tl.to(pill, { borderColor: pillLit, duration: 0.5, ease: 'power2.out' }, 0)
        .to(env, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.05)
        .to(addr, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power2.inOut' }, 0.3)
        .to(caret, { x: 0, duration: 0.95, ease: 'power2.inOut' }, 0.3)
        .to(caret, { opacity: 0.12, duration: 0.16, repeat: 3, yoyo: true }, 1.25);

      /* ---- 2. the packet leaves, the wire carries it */
      tl.to(dOrange, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(3)' }, 1.15)
        .to(wire, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power1.inOut' }, 1.35);

      /* ---- 3. the account cards arrive off the wire and fill in */
      ([[cardA, innardsA, 1.95], [cardB, innardsB, 2.1]] as const).forEach(([card, kids, at]) => {
        tl.to(card, { opacity: 1, x: 0, duration: 0.55, ease: 'expo.out' }, at);
        tl.to(kids[0], { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, at + 0.2);
        tl.to(kids[1], { opacity: 1, scaleX: 1, duration: 0.45, ease: 'power2.out' }, at + 0.25);
        tl.to(kids[2], { opacity: 1, scaleX: 1, y: 0, duration: 0.4, ease: 'power2.out' }, at + 0.35);
        tl.to(kids[3], { opacity: 1, scaleX: 1, duration: 0.4, ease: 'power2.out' }, at + 0.43);
      });

      /* ---- 4. on to the phone */
      tl.to(arm, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power1.inOut' }, 2.55)
        .to(dWhite, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(3)' }, 3.05);

      /* ---- 5. the app comes up */
      tl.to(chrome, { opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }, 3.2)
        .to(chart, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 3.35)
        .to(cols, { scaleY: 1, duration: 0.5, stagger: 0.07, ease: 'power3.out' }, 3.5)
        .to(block, { opacity: 0.4, duration: 0.4, ease: 'power2.out' }, 3.95)
        .to(trim, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 3.95)
        .to(delta, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, 4);
      count(tl, amount, 0, 3280, 3.55, 0.7, (n) => `$${Math.round(n).toLocaleString('en-US')}`);

      /* ---- 6. hand it all back to CSS and hold still */
      tl.set(everything, { clearProps: 'all' }, STORY)
        .call(() => { amount.textContent = restAmount; }, undefined, STORY);

      tl.play(0);
    }, root);

    return () => {
      ctx.revert();
      // `revert` restores inline styles; the counted text is ours to undo.
      amount.textContent = restAmount;
    };
  }, [epoch]);

  return ref;
}

/* Panel 1 — email → account cards → phone -------------------------------- */
export function PanelRegister() {
  const ref = useRegisterLoop();

  return (
    <div className="panel panel--1">
      <Mark className="steps__mark--full" />
      <Glow className="steps__glow--left" />
      <div className="s1" ref={ref} aria-hidden="true">
        <div className="s1__email">
          <span className="s1__envelope"><img src={envelope} alt="" width={23.989} height={18.848} /></span>
          <span className="s1__addr">
            <span className="s1__addr-in">you@phorcast.io</span>
            <i className="s1__caret">|</i>
          </span>
        </div>
        <span className="s1__diamond s1__diamond--orange"><i /></span>
        <img src={connector} alt="" className="s1__connector" width={91.157} height={107.948} />
        <div className="s1__card s1__card--a">
          <img src={cardGlyph} alt="" className="s1__glyph--card" width={28} height={18} />
          <img src={divider} alt="" className="s1__rule" width={193.108} height={1.199} />
          <p className="s1__digits">000 000 000 ****</p>
          <span className="s1__bar s1__bar--pill" />
        </div>
        <div className="s1__card s1__card--b">
          <img src={userGlyph} alt="" className="s1__glyph--user" width={21} height={23.333} />
          <img src={divider} alt="" className="s1__rule" width={193.108} height={1.199} />
          <span className="s1__bar s1__bar--wide" />
          <span className="s1__bar s1__bar--pill" />
        </div>
        <img src={bracket} alt="" className="s1__bracket" width={80.362} height={182.913} />
        <span className="s1__diamond s1__diamond--white"><i /></span>
        <div className="s1__phone">
          <div className="s1__status">
            <span className="s1__time">9:41</span>
            <img src={statusArrow} alt="" className="s1__loc" width={4.851} height={4.851} />
          </div>
          <div className="s1__status-right">
            <span className="s1__signal"><img src={signal} alt="" width={7.082} height={4.785} /></span>
            <span className="s1__data"><img src={data} alt="" width={7.577} height={5.359} /></span>
            <span className="s1__batt">
              <img src={battery} alt="" className="s1__batt-shell" width={10.335} height={5.359} />
              <img src={battFill} alt="" className="s1__batt-fill" width={3.782} height={5.359} />
              <i>32</i>
            </span>
          </div>
          <img src={divider} alt="" className="s1__phone-rule" width={193.108} height={1.199} />
          <div className="s1__phone-head">
            <span className="s1__logo-slot">
              <span className="s1__logo-tile"><img src={phoneLogo} alt="" width={11.518} height={12.286} /></span>
            </span>
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
              <span className="s1__col" />
              <span className="s1__col" />
              <span className="s1__col" />
              <span className="s1__col" />
              <span className="s1__col" />
              <i className="s1__axis" />
              <i className="s1__delta">+2.41%</i>
            </div>
          </div>
          <img src={indicator} alt="" className="s1__indicator" width={22.391} height={2.399} />
          <span className="s1__bar s1__bar--block" />
          <img src={bottomnav} alt="" className="s1__nav" width={69.567} height={21.59} />
        </div>
      </div>
    </div>
  );
}
