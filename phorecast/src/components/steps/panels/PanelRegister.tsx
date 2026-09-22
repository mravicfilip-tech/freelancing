import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
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
import { Icon } from '../../Icon';
import { Mark, Glow } from './shared';
import './PanelRegister.css';

/* The loop ------------------------------------------------------------------
 *
 * One beat, and it is the step's own sentence acted out: an email address
 * becomes an account becomes a working app.
 *
 * DESKTOP -- all three acts.
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
 * PHONE (below 700, where PanelRegister.css recomposes the panel) -- two acts,
 * because the third is not drawn there. Same opening, to the frame; the cards
 * then rise from under the diamond instead of sliding in off a wire that no
 * longer exists, and the story simply ends when they have filled.
 *
 *   0.00  the pill's stroke comes up to full orange and the envelope lands
 *   0.30  the address types itself in, caret on the reveal's leading edge
 *   1.15  the orange diamond fires and the caret blinks twice
 *   1.70  card A rises 18 design px out from under the diamond and fills:
 *         glyph, rule, digits, bar
 *   1.92  card B follows, 0.22 behind it, the same four beats
 *   2.80  handed back to CSS, then 3.10s of rest. Period 5.90s -- the SAME
 *         period as the desktop, so both layouts breathe alike inside the
 *         stepper's 6s dwell; the phone simply spends more of it at rest.
 *
 * Nothing below animates an element the phone stylesheet has set to
 * `display: none`: the cast is built from the composition, not from the DOM.
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
/* Every glyph in this panel is sized by PanelRegister.css, in design pixels
   off `--p`, so none of them wants Icon's own width/height: an <img> ignores
   its width attribute once CSS gives it a length, and a <span> would take that
   length too, but writing both invites them to disagree at some width. The
   attribute numbers are still passed, because they are the asset's own and are
   worth having in the markup; this clears the box they would otherwise set.
   The one exception is s1-connector: a two-stop gradient wire, which a mask
   would flatten to a silhouette. It stays an <img>, and both of its ends -- a
   warm #ff632a and a mid grey -- still read on paper. */
const CSS_SIZED: CSSProperties = { width: undefined, height: undefined };

const STORY = 4.35;
const REST = 1.55;
/* The phone's two acts, and the rest that keeps the period at the desktop's
   5.90s. See the beat sheet above. */
const STORY_PHONE = 2.8;
const REST_PHONE = 3.1;

/* The same breakpoint Steps.tsx reads for its own layout switch, and the same
   one PanelRegister.css recomposes at. Written out here rather than inferred
   from a computed style: a cast built by asking each element whether it is
   currently displayed would be a different cast on a frame where the
   stylesheet has not applied yet, and this runs in a layout effect. */
const PHONE = '(max-width: 700px)';

function usePhoneComposition() {
  const [phone, setPhone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(PHONE).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const onChange = () => setPhone(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return phone;
}

function useRegisterLoop() {
  const ref = useRef<HTMLDivElement>(null);
  /* Which composition is on screen. It is a dependency of the build below,
     so crossing the breakpoint rebuilds the timeline rather than leaving
     beats aimed at parts the stylesheet has just removed. */
  const phone = usePhoneComposition();
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
    // unresolved token, so it can only be measured. The divisor is the width
    // of `.s1` in design units, and the phone gives it a narrower box: 362,
    // the two cards and the 10 between them.
    const p = root.getBoundingClientRect().width / (phone ? 362 : 760);
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

    /* The third act: the wire, the bracket, its diamond and the whole phone.
       Drawn on the desktop, not drawn on the phone -- so on the phone this is
       empty and nothing below can reach it, including the `clearProps` at the
       end, which is the one place a hidden element would otherwise still be
       written to. */
    const act3 = phone
      ? []
      : [dWhite, wire, arm, chart, amount, delta, block, ...cols, ...chrome, ...trim];

    const everything = [
      pill, env, addr, caret, dOrange, cardA, cardB, ...innardsA, ...innardsB, ...act3,
    ];

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: phone ? REST_PHONE : REST,
        paused: true,
      });

      /* ---- the panel at the start of the story, re-applied on every repeat.
             The cards come in off the wire on the desktop and up from under
             the diamond on the phone, which is where the flow now runs. */
      tl.set(pill, { borderColor: pillRest }, 0)
        .set(env, { opacity: 0, scale: 0.55, transformOrigin: '50% 50%' }, 0)
        .set(addr, { clipPath: 'inset(0% 100% 0% 0%)' }, 0)
        .set(caret, { x: -run }, 0)
        .set(dOrange, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, 0)
        .set([cardA, cardB], phone ? { opacity: 0, y: 18 * p } : { opacity: 0, x: -22 * p }, 0)
        .set([...innardsA, ...innardsB], { opacity: 0 }, 0)
        .set([q('.s1__card--a .s1__rule'), q('.s1__card--b .s1__rule')], { scaleX: 0, transformOrigin: '0% 50%' }, 0)
        .set([q('.s1__card--a .s1__bar--pill'), q('.s1__card--b .s1__bar--pill'), q('.s1__bar--wide')],
          { scaleX: 0, transformOrigin: '0% 50%' }, 0)
        .set([q('.s1__glyph--card'), q('.s1__glyph--user')], { scale: 0.5, transformOrigin: '50% 50%' }, 0)
        .set(q('.s1__digits'), { y: 6 * p }, 0);

      if (!phone) {
        tl.set(dWhite, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, 0)
          .set([wire, arm], { clipPath: 'inset(0% 100% 0% 0%)' }, 0)
          .set([...chrome, ...trim, chart], { opacity: 0 }, 0)
          .set(block, { opacity: 0 }, 0)
          .set(cols, { scaleY: 0, transformOrigin: '50% 100%' }, 0)
          .set(delta, { opacity: 0, scale: 0.5, y: 4 * p, transformOrigin: '50% 100%' }, 0)
          .call(() => { amount.textContent = '$0'; }, undefined, 0);
      }

      /* ---- 1. the pill wakes and the address types itself */
      tl.to(pill, { borderColor: pillLit, duration: 0.5, ease: 'power2.out' }, 0)
        .to(env, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.05)
        .to(addr, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power2.inOut' }, 0.3)
        .to(caret, { x: 0, duration: 0.95, ease: 'power2.inOut' }, 0.3)
        .to(caret, { opacity: 0.12, duration: 0.16, repeat: 3, yoyo: true }, 1.25);

      /* ---- 2. the packet leaves. On the desktop the wire then carries it;
             on the phone the diamond IS the carry, and the cards answer it. */
      tl.to(dOrange, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(3)' }, 1.15);
      if (!phone) {
        tl.to(wire, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'power1.inOut' }, 1.35);
      }

      /* ---- 3. the account cards arrive and fill in. The phone's pair starts
             0.25 earlier, because there is no wire to wait out, and is 0.22
             apart rather than 0.15 -- a pair stacked side by side wants to be
             counted, and a pair arriving off a wire wants to look carried. */
      const cardAt: readonly (readonly [HTMLElement, HTMLElement[], number])[] = phone
        ? [[cardA, innardsA, 1.7], [cardB, innardsB, 1.92]]
        : [[cardA, innardsA, 1.95], [cardB, innardsB, 2.1]];
      cardAt.forEach(([card, kids, at]) => {
        tl.to(card, phone
          ? { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }
          : { opacity: 1, x: 0, duration: 0.55, ease: 'expo.out' }, at);
        tl.to(kids[0], { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, at + 0.2);
        tl.to(kids[1], { opacity: 1, scaleX: 1, duration: 0.45, ease: 'power2.out' }, at + 0.25);
        tl.to(kids[2], { opacity: 1, scaleX: 1, y: 0, duration: 0.4, ease: 'power2.out' }, at + 0.35);
        tl.to(kids[3], { opacity: 1, scaleX: 1, duration: 0.4, ease: 'power2.out' }, at + 0.43);
      });

      if (!phone) {
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
      }

      /* ---- 6. hand it all back to CSS and hold still.
             The list is EXPLICIT, and `all` is a bug it is worth naming. Eight
             of the elements below are <Icon>s, and an Icon is a mask whose
             `--icon` url is written INLINE by the component. `clearProps:
             'all'` strips inline styles, which includes that custom property:
             the mask becomes `none`, `background: currentColor` then paints
             the element's whole box, and the panel spent every rest with the
             bracket as a solid 80 x 183 red rectangle and both card glyphs as
             grey blocks. Measured at 1440: 12,493 pixels of the settled panel
             differed from the same panel under reduced motion, all of it
             there. Clearing the five properties this loop actually writes
             hands the elements back to CSS and leaves the mask alone. */
      const WROTE = 'transform,transformOrigin,opacity,clipPath,borderColor';
      const end = phone ? STORY_PHONE : STORY;
      tl.set(everything, { clearProps: WROTE }, end);
      if (!phone) tl.call(() => { amount.textContent = restAmount; }, undefined, end);

      tl.play(0);
    }, root);

    return () => {
      ctx.revert();
      // `revert` restores inline styles; the counted text is ours to undo.
      // Unconditional: the phone never counts it, so this is a no-op there,
      // and a build that crossed the breakpoint mid-story still lands on the
      // design's own figure.
      amount.textContent = restAmount;
    };
  }, [epoch, phone]);

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
          <span className="s1__envelope"><Icon src={envelope} w={23.989} h={18.848} style={CSS_SIZED} /></span>
          <span className="s1__addr">
            <span className="s1__addr-in">you@phorcast.io</span>
            <i className="s1__caret">|</i>
          </span>
        </div>
        <span className="s1__diamond s1__diamond--orange"><i /></span>
        <img src={connector} alt="" className="s1__connector" width={91.157} height={107.749} />
        <div className="s1__card s1__card--a">
          <Icon src={cardGlyph} w={28} h={18} className="s1__glyph--card" style={CSS_SIZED} />
          <Icon src={divider} w={193.108} h={1.199} className="s1__rule" style={CSS_SIZED} />
          <p className="s1__digits">000 000 000 ****</p>
          <span className="s1__bar s1__bar--pill" />
        </div>
        <div className="s1__card s1__card--b">
          <Icon src={userGlyph} w={21} h={23.333} className="s1__glyph--user" style={CSS_SIZED} />
          <Icon src={divider} w={193.108} h={1.199} className="s1__rule" style={CSS_SIZED} />
          <span className="s1__bar s1__bar--wide" />
          <span className="s1__bar s1__bar--pill" />
        </div>
        <Icon src={bracket} w={80.362} h={182.813} className="s1__bracket" style={CSS_SIZED} />
        <span className="s1__diamond s1__diamond--white"><i /></span>
        <div className="s1__phone">
          <div className="s1__status">
            <span className="s1__time">9:41</span>
            <Icon src={statusArrow} w={4.851} h={4.851} className="s1__loc" style={CSS_SIZED} />
          </div>
          <div className="s1__status-right">
            <span className="s1__signal"><Icon src={signal} w={7.082} h={4.785} style={CSS_SIZED} /></span>
            <span className="s1__data"><Icon src={data} w={7.577} h={5.359} style={CSS_SIZED} /></span>
            <span className="s1__batt">
              <Icon src={battery} w={10.335} h={5.359} className="s1__batt-shell" style={CSS_SIZED} />
              <Icon src={battFill} w={3.782} h={5.359} className="s1__batt-fill" style={CSS_SIZED} />
              <i>32</i>
            </span>
          </div>
          <Icon src={divider} w={193.108} h={1.199} className="s1__phone-rule" style={CSS_SIZED} />
          <div className="s1__phone-head">
            <span className="s1__logo-slot">
              <span className="s1__logo-tile"><Icon src={phoneLogo} w={11.518} h={12.286} style={CSS_SIZED} /></span>
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
          <Icon src={indicator} w={22.391} h={2.399} className="s1__indicator" style={CSS_SIZED} />
          <span className="s1__bar s1__bar--block" />
          <Icon src={bottomnav} w={69.567} h={21.59} className="s1__nav" style={CSS_SIZED} />
        </div>
      </div>
    </div>
  );
}
