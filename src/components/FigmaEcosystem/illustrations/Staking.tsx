import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, one, count, roll, isMobile, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import { odoBuild, odoSet } from './odometer';
import type { SceneMotion } from './index';

/** Three open positions, newest at the front. */
const POS = [
  { no: 'Position 03', amt: '12,500', term: '90 days', left: '56 days', rate: '12.4%', acc: 3.42, day: 34 },
  { no: 'Position 02', amt: '4,800', term: '30 days', left: '11 days', rate: '11.8%', acc: 1.31, day: 19 },
  { no: 'Position 01', amt: '2,250', term: '60 days', left: '3 days', rate: '12.1%', acc: 0.62, day: 57 },
];

/** Where each card of the deck sits: the front one flat, the two behind stepped back and dimmed. */
const GHOST = [
  { y: 0, scale: 1, opacity: 1 },
  { y: 22, scale: 0.955, opacity: 0.55 },
  { y: 44, scale: 0.91, opacity: 0.28 },
];

/**
 * The same deck on a phone. The steps are pulled in because a portrait card is shorter: at the
 * desktop's 22/44 the rearmost card's stat row clears the front card's bottom edge and a slice of
 * it shows through, which reads as a clipping accident rather than as depth. Paired with the
 * deeper bottom padding the portrait card carries, 16/32 leaves each card behind showing ~10px of
 * blank card and its rounded bottom edge — enough to count them, not enough to read them.
 */
const GHOST_M = [
  { y: 0, scale: 1, opacity: 1 },
  { y: 16, scale: 0.955, opacity: 0.55 },
  { y: 32, scale: 0.91, opacity: 0.28 },
];

/** The deck's resting places for whichever composition is on screen. */
const deck = (il: HTMLElement) => (isMobile(il) ? GHOST_M : GHOST);

/** The Remittix mark, in the current colour. */
function Mark({ w }: { w: number }) {
  return (
    <svg viewBox="0 0 33 17" width={w} height={(w * 17) / 33} fill="currentColor" aria-hidden="true">
      <path d="M8.375 10.106H8.373v5.325c0 .85-.69 1.54-1.54 1.54H5.07c-.485 0-.942-.229-1.232-.617L.308 11.639A1.54 1.54 0 0 1 0 10.716v-.675C0 9.191.69 8.501 1.54 8.501h6.835v1.605Z" />
      <path d="m4.175 3.144 9.93 12.782c.291.376.74.596 1.215.596h1.717c.85 0 1.54-.69 1.54-1.54V8.868c0-.342-.114-.674-.323-.944L12.719.789a1.54 1.54 0 0 0-1.217-.596H5.391c-.85 0-1.54.689-1.54 1.54v.466c0 .342.114.674.324.945Z" />
      <path d="M18.352 7.872V2.146c0-.456.145-.901.415-1.269A2.66 2.66 0 0 1 20.498 0h.779c.683 0 1.327.32 1.739.865l9.394 12.41c.286.379.442.841.442 1.316v.069c0 .516-.195 1.014-.545 1.393-.389.421-.936.661-1.51.661h-5.005a2.16 2.16 0 0 1-1.712-.83l-5.259-6.66a2.16 2.16 0 0 1-.469-1.352Z" />
    </svg>
  );
}

/**
 * One position's card. Both compositions use the same parts in the same order — brand, position,
 * balance, rule, then the four figures — so the only thing that changes between them is how wide
 * the box is and whether the figures sit in one row or two. The motion below never has to know.
 */
function Card({ p, mark }: { p: (typeof POS)[number]; mark: number }) {
  return (
    <div className="ec-stk__card">
      <div className="ec-stk__head">
        <span className="ec-stk__brand">
          <Mark w={mark} />
          <em>Remittix staking</em>
        </span>
        <span className="ec-stk__tag">{p.no}</span>
      </div>
      <b className="ec-stk__big">
        <span data-principal>{p.amt}</span>
        <span className="ec-stk__unit">RTX staked</span>
      </b>
      <i className="ec-stk__rule" />
      <div className="ec-stk__foot">
        <span>
          <small className="ec-stk__lab">Rate</small>
          <b className="ec-stk__val">{p.rate} APY</b>
        </span>
        <span>
          <small className="ec-stk__lab">Term</small>
          <b className="ec-stk__val">{p.term}</b>
        </span>
        <span>
          <small className="ec-stk__lab">Unlocks in</small>
          <b className="ec-stk__val" data-left>
            {p.left}
          </b>
        </span>
        <span>
          <small className="ec-stk__lab">Accrued today</small>
          <b className="ec-stk__val is-gain ec-stk__mono" data-acc>
            +{p.acc.toFixed(2)}
          </b>
        </span>
      </div>
    </div>
  );
}

/**
 * Staking: one position, accruing. The balance is the whole card; rate, term, unlock and today's
 * accrual sit under it as a quiet footer. Three positions stack as a deck that swaps between
 * rewards. The figures under `[data-principal]`, `[data-acc]` and `[data-left]` are written by
 * the loop, not by React, and never change in the tree.
 *
 * A phone gets the portrait composition below rather than this one shrunk: fitted into the 361px
 * the card gives it, the landscape canvas puts its stat labels on screen at ~6px and crops the
 * deck at both edges. Same scene, drawn for a narrow frame.
 */
export function Staking({ mobile = false }: { mobile?: boolean } = {}) {
  return mobile ? <StakingPortrait /> : <StakingLandscape />;
}

function StakingLandscape() {
  return (
    <Stage id="ec-staking" width={800} height={640} className="ec-il ec-stk-scene">
      <div className="ec-zoom">
        <div className="ec-center" style={{ left: 0, top: 120 }}>
          <span className="ec-caption">What is staked</span>
        </div>
        <div style={{ left: 165, top: 190, width: 470, height: 330 }}>
          {POS.map((p, i) => (
            <div key={p.no} className="ec-stk" data-tic={i} style={{ zIndex: 10 - i }}>
              <Card p={p} mark={22} />
            </div>
          ))}
        </div>
        <div className="ec-center" style={{ left: 0, top: 540 }}>
          <small>Three positions · unstake any of them at any time</small>
        </div>
      </div>
    </Stage>
  );
}

/**
 * Portrait (361x400, the width the pillar card hands a scene on a 393 phone, so the stage fits
 * at 1:1 and every figure lands on screen at the size it is set).
 *
 * The layout decision is the stat row. On the desktop card the four figures — rate, term, unlock,
 * accrual — run as one row across 470px, which gives each about 100px to be legible in. At 329
 * they would get 70, and the two longest labels ("Unlocks in", "Accrued today") would have to
 * drop below 10px to survive. So the row folds into a 2x2 grid instead of shrinking: the terms of
 * the deal on the top line, what the position is doing right now on the bottom. That reads better
 * than the flat row did anyway, because the pair that moves — the unlock counting down and the
 * accrual counting up — now sits together on one line, which is where the eye already is.
 *
 * Nothing is dropped and nothing is abbreviated: all four figures, all three cards, the caption
 * and the closing line are the same words as the desktop scene.
 */
function StakingPortrait() {
  return (
    <Stage id="ec-staking" width={361} height={400} layout="mobile" className="ec-il ec-stk-scene ec-stk-scene--m">
      <div className="ec-zoom">
        <div className="ec-center" style={{ left: 0, top: 6 }}>
          <span className="ec-caption">What is staked</span>
        </div>
        {/* 329-wide cards on a 16px rail; the box is tall enough to hold the two stepped-back
            cards, so nothing in the deck ever reaches the stage's edge. */}
        <div style={{ left: 16, top: 52, width: 329, height: 288 }}>
          {POS.map((p, i) => (
            <div key={p.no} className="ec-stk" data-tic={i} style={{ zIndex: 10 - i }}>
              <Card p={p} mark={20} />
            </div>
          ))}
        </div>
        <div className="ec-center" style={{ left: 0, top: 370 }}>
          <small>Three positions · unstake any of them at any time</small>
        </div>
      </div>
    </Stage>
  );
}

export const stakingMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    const g = deck(il);
    const tics = all(il, '[data-tic]');
    // The deck may have rotated before the scene was left: put every card back in its first place,
    // in front-to-back order, with its first figures.
    tics.forEach((t, i) => {
      gsap.set(t, { ...g[i], zIndex: 10 - i, transformOrigin: '50% 50%' });
      const acc = t.querySelector<HTMLElement>('[data-acc]');
      if (acc) acc.textContent = `+${POS[i].acc.toFixed(2)}`;
      const left = t.querySelector<HTMLElement>('[data-left]');
      if (left) { left.textContent = POS[i].left; gsap.set(left, { yPercent: 0, opacity: 1 }); }
      const principal = t.querySelector<HTMLElement>('[data-principal]');
      if (principal) principal.textContent = POS[i].amt;
    });
    tl.from(one(il, '.ec-caption'), { ...RISE, y: 6 }, at);
    // The cards deal in from below, back to front. A portrait card has less room under it before
    // it would slide out of the stage, so it comes in from nearer its resting place.
    const dealt = isMobile(il) ? 28 : 40;
    tics.forEach((t, i) => tl.from(t, { y: g[i].y + dealt, opacity: 0, duration: 0.82, ease: EASE }, at + 0.14 + (tics.length - 1 - i) * 0.1));
    const front = tics[0];
    tl.from(front.querySelectorAll('.ec-stk__head, .ec-stk__big, .ec-stk__rule, .ec-stk__foot'), { y: 12, opacity: 0, duration: 0.6, ease: EASE, stagger: 0.07 }, at + 0.44);
    count(tl, one(front, '[data-principal]'), 0, Number(POS[0].amt.replace(/,/g, '')), at + 0.5, 1.1, (n) => Math.round(n).toLocaleString('en-US'));
    tl.from(all(il, '.ec-center')[1].children, { ...RISE, y: 8 }, at + 0.8);
  },
  /**
   * Staking is accrual, so that is what moves: the front card's accrual climbs through the day,
   * and every few seconds the day settles — the accrual field drains into the balance, which
   * rolls up on its odometer by the same amount. Between settlements the deck swaps: the front
   * card recedes and dims to nothing while the two behind rise into its place, then fades back in
   * at the rear, so the depth change never pops.
   *
   * Both compositions run the same beats; only the deck's resting places differ, and those come
   * from `deck(il)` so the timeline itself is written once.
   */
  idle(gsap, il) {
    const g = deck(il);
    const tics = all(il, '[data-tic]');
    const state = POS.map((p) => ({ total: Number(p.amt.replace(/,/g, '')), earned: p.acc, day: p.day, settling: false }));
    // The principal reads as an odometer from the start, so the first settlement rolls rather than jumps.
    all(il, '[data-principal]').forEach((el) => odoBuild(el, el.textContent ?? ''));
    let order = [0, 1, 2];
    const q = (card: HTMLElement, sel: string) => card.querySelector<HTMLElement>(sel);
    const idle = gsap.timeline();

    // the front card's accrual climbs
    const tick = gsap.timeline({ repeat: -1, delay: 0.4 });
    tick
      .add(() => {
        const k = order[0];
        const st = state[k];
        if (st.settling) return; // the day is being settled into the balance; leave the field alone
        // a day's yield accrues across the cycle, so what lands is the figure the card claims it earns
        st.earned = Math.round((st.earned + 0.16) * 100) / 100;
        const acc = q(tics[k], '[data-acc]');
        if (acc) acc.textContent = `+${st.earned.toFixed(2)}`;
      }, 0)
      .to({}, { duration: 0.22 }, 0);
    idle.add(tick, 0);

    // the day settles on the front card
    const land = gsap.timeline({ repeat: -1, repeatDelay: 4.6, delay: 2.4 });
    land.add(() => {
      const k = order[0];
      const card = tics[k];
      const st = state[k];
      const principal = q(card, '[data-principal]');
      const acc = q(card, '[data-acc]');
      const amount = st.earned;
      if (!principal || !acc || amount <= 0) return;
      // The accrual field empties and the balance takes it up, in the same moment and at the same
      // rate. The position's own value never changes — the yield only changes place.
      st.settling = true;
      st.total = Math.round((st.total + amount) * 10) / 10;
      const o = { v: amount };
      gsap
        .timeline()
        .to(o, { v: 0, duration: 1.0, ease: 'power2.inOut', onUpdate: () => { acc.textContent = `+${o.v.toFixed(2)}`; } }, 0)
        .fromTo(acc, { opacity: 1 }, { opacity: 0.45, duration: 0.5, ease: 'power2.inOut', yoyo: true, repeat: 1 }, 0)
        .add(() => {
          odoSet(gsap, principal, Math.round(st.total).toLocaleString('en-US'), '#02774d');
        }, 0.3)
        .add(() => {
          st.earned = 0;
          st.settling = false;
          acc.textContent = '+0.00';
          st.day = st.day >= 90 ? 34 : st.day + 1;
          const left = q(card, '[data-left]');
          if (left) roll(gsap, left, `${90 - st.day} days`);
        }, 1.0);
    }, 0);
    land.to({}, { duration: 0.1 }, 0);
    idle.add(land, 0);

    // the deck swaps between settlements
    const swap = gsap.timeline({ repeat: -1, repeatDelay: 4.6, delay: 5.0 });
    swap.add(() => {
      const front = tics[order[0]];
      const rest = order.slice(1).map((i) => tics[i]);
      const t = gsap.timeline();
      t.to(front, { y: g[1].y, scale: g[1].scale, opacity: 0, duration: 0.62, ease: 'power2.inOut' }, 0)
        .set(front, { zIndex: 7, y: g[2].y, scale: g[2].scale }, 0.62)
        .to(front, { opacity: g[2].opacity, duration: 0.6, ease: 'power2.out' }, 0.66);
      rest.forEach((el, k) => {
        t.to(el, { ...g[k], duration: 0.9, ease: 'power2.inOut' }, 0.1).set(el, { zIndex: 10 - k }, 0.1);
      });
      order = [order[1], order[2], order[0]];
    }, 0);
    swap.to({}, { duration: 1.5 }, 0);
    idle.add(swap, 0);
    return idle;
  },
};
