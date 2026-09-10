import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, isMobile, one, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

/** One batch: five people, five countries, five local rails. */
const RUN = [
  ['Ana Ribeiro', 'Nubank · Pix', 'BRL 7,412.00'],
  ['Tomás Silva', 'Itaú · Pix', 'BRL 2,180.00'],
  ['Marta Cruz', 'Millennium · SEPA', 'EUR 1,240.00'],
  ['J. Okafor', 'GTBank · NIP', 'NGN 1,982,400'],
  ['Priya Nair', 'HDFC · UPI', 'INR 112,640.00'],
] as const;

/**
 * Payments: a payout run. A batch of payouts selected and sent in one action, each row flipping
 * from pending to paid on its own rail. A pointer works the run — the site's own cursor glyph —
 * so the selection reads as something done, not something that happens.
 *
 * The phone gets its own composition rather than the landscape one shrunk: at 361 the scene is
 * drawn 1:1, so its writing lands on screen at the size it was set in. The run keeps all five
 * people — the count is the point of a batch — and the row is what gives, folding from one line
 * into two: who over which rail on the left, how much over what state on the right. That is the
 * shape a payout list actually takes on a phone, and it buys back the ~140px the four-column
 * desktop row needed to stay legible.
 */
export function Payments({ mobile = false }: { mobile?: boolean } = {}) {
  return mobile ? <PaymentsPortrait /> : <PaymentsLandscape />;
}

/**
 * The action bar's geometry in each layout, so the markup and the motion agree on the box that
 * collapses into the success disc. `park` is where the pointer waits between runs.
 */
export const RUN_BAR = {
  desktop: { wide: 256, left: 272, radius: 14, park: { x: 628, y: 566 } },
  mobile: { wide: 345, left: 8, radius: 16, park: { x: 320, y: 438 } },
} as const;
/** The disc the bar collapses to once the run is sent — the same in both layouts. */
const NARROW = 52;

function PaymentsLandscape() {
  const g = RUN_BAR.desktop;
  return (
    <Stage id="ec-payments" width={800} height={640} className="ec-il ec-run">
      <div className="ec-zoom">
        <span className="ec-caption" style={{ left: 120, top: 118 }}>
          One run · five countries · five rails
        </span>
        <div className="ec-run__card" style={{ left: 120, top: 156 }}>
          <div className="ec-run__head">
            <b>Payout run</b>
            <span className="ec-live">
              <i />
              Ready
            </span>
          </div>
          {RUN.map(([who, bank, amt]) => (
            <div key={who} className="ec-run__row">
              <i className="ec-run__box" />
              <span className="ec-run__who">
                <b>{who}</b>
                <small>{bank}</small>
              </span>
              <span className="ec-run__amt">{amt}</span>
              <span className="ec-run__state">Pending</span>
            </div>
          ))}
        </div>
        <div className="ec-run__bar" style={{ left: g.left, top: 508 }}>
          <span data-sel>0 selected</span>
          <span className="ec-run__go" data-go>
            Send payouts
          </span>
          <svg className="ec-run__tick" data-tick viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.6l4.6 4.6L19 7.4" />
          </svg>
        </div>
        <i className="ec-run__ping" data-ping />
        <div className="ec-run__cursor" data-cursor>
          <img src="/figma/simple/imgCursor2StreamlineNova.svg" alt="" width={24} height={24} />
        </div>
      </div>
    </Stage>
  );
}

/**
 * Portrait (361×470). Same parts, same class names, so the loop below only has to be re-aimed at
 * the new geometry rather than rewritten. The card takes the frame edge to edge with an 8px
 * margin; the send bar runs the card's full width under it, the way an action bar does on a
 * phone, which also gives the collapse a wider run into its disc. The pointer parks in the empty
 * corner below the bar.
 */
function PaymentsPortrait() {
  const g = RUN_BAR.mobile;
  return (
    <Stage id="ec-payments" width={361} height={470} layout="mobile" className="ec-il ec-run ec-run--m">
      <div className="ec-zoom">
        <span className="ec-caption" style={{ left: 10, top: 4 }}>
          One run · five countries · five rails
        </span>
        <div className="ec-run__card" style={{ left: 8, top: 30 }}>
          <div className="ec-run__head">
            <b>Payout run</b>
            <span className="ec-live">
              <i />
              Ready
            </span>
          </div>
          {RUN.map(([who, bank, amt]) => (
            <div key={who} className="ec-run__row">
              <i className="ec-run__box" />
              <span className="ec-run__who">
                <b>{who}</b>
                <small>{bank}</small>
              </span>
              <span className="ec-run__amt">{amt}</span>
              <span className="ec-run__state">Pending</span>
            </div>
          ))}
        </div>
        <div className="ec-run__bar" style={{ left: g.left, top: 382 }}>
          <span data-sel>0 selected</span>
          <span className="ec-run__go" data-go>
            Send payouts
          </span>
          <svg className="ec-run__tick" data-tick viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.6l4.6 4.6L19 7.4" />
          </svg>
        </div>
        <i className="ec-run__ping" data-ping />
        <div className="ec-run__cursor" data-cursor>
          <img src="/figma/simple/imgCursor2StreamlineNova.svg" alt="" width={24} height={24} />
        </div>
      </div>
    </Stage>
  );
}

/* The bar's rest and sent states are colours, and GSAP needs values rather than `var()` — so they
   are read off the scene, which keeps them in the stylesheet with the rest of the palette. */
const barTone = (il: HTMLElement, name: string, fallback: string) =>
  getComputedStyle(il).getPropertyValue(name).trim() || fallback;

export const paymentsMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    const g = RUN_BAR[isMobile(il) ? 'mobile' : 'desktop'];
    // A scene can be shown again after its loop was cut mid-run: start from the run's rest state.
    all(il, '.ec-run__box').forEach((b) => b.classList.remove('ec-run__box--on'));
    all(il, '.ec-run__state').forEach((st) => {
      st.textContent = 'Pending';
      st.classList.remove('ec-run__state--paid');
    });
    one(il, '[data-sel]').textContent = '0 selected';
    gsap.set(all(il, '[data-sel], [data-go]'), { opacity: 1, scale: 1, visibility: 'visible' });
    gsap.set(one(il, '.ec-run__bar'), { width: g.wide, left: g.left, borderRadius: g.radius, backgroundColor: barTone(il, '--ec-chip', '#122433') });
    gsap.set(all(il, '[data-tick], [data-cursor], [data-ping]'), { opacity: 0 });
    gsap.set(all(il, '.ec-run__box'), { scale: 1 });
    tl.from(one(il, '.ec-caption'), { ...RISE, y: 6 }, at);
    tl.from(one(il, '.ec-run__card'), { y: 22, opacity: 0, duration: 0.85, ease: EASE }, at + 0.08);
    tl.from(all(il, '.ec-run__row'), { ...RISE, y: 10, duration: 0.55, stagger: 0.07 }, at + 0.3);
    tl.from(one(il, '.ec-run__bar'), { y: 18, opacity: 0, duration: 0.7, ease: EASE }, at + 0.75);
  },
  idle(gsap, il) {
    const BAR_REST = barTone(il, '--ec-chip', '#122433');
    const BAR_SENT = barTone(il, '--ec-green', '#02774d');
    const boxes = all(il, '.ec-run__box');
    const states = all(il, '.ec-run__state');
    const sel = one(il, '[data-sel]');
    const go = one(il, '[data-go]');
    const bar = one(il, '.ec-run__bar');
    const tick = one(il, '[data-tick]');
    const path = one<SVGPathElement>(il, '[data-tick] path');
    const cursor = one(il, '[data-cursor]');
    const ping = one(il, '[data-ping]');
    const zoom = one(il, '.ec-zoom');
    // The bar's box differs between the layouts; every beat below is read off this, so the same
    // story runs on a phone without a second timeline.
    const g = RUN_BAR[isMobile(il) ? 'mobile' : 'desktop'];
    const WIDE = g.wide;
    const LEFT = g.left; // the wide bar's left edge
    const MID = LEFT + WIDE / 2; // the centre it must keep
    const PARK = g.park; // where the pointer waits between runs
    const len = path.getTotalLength();
    gsap.set(bar, { width: WIDE, left: LEFT });
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(cursor, { x: PARK.x, y: PARK.y });

    // Where a node sits in the scene's own design coordinates, whatever the stage and zoom scale it to.
    const centre = (node: Element) => {
      const box = zoom.getBoundingClientRect();
      const scale = box.width / zoom.offsetWidth || 1;
      const r = node.getBoundingClientRect();
      return { x: (r.left + r.width / 2 - box.left) / scale, y: (r.top + r.height / 2 - box.top) / scale };
    };

    const idle = gsap.timeline();
    const beat = gsap.timeline({ repeat: -1, repeatDelay: 1.4, delay: 0.7 });
    beat.add(() => {
      const t = gsap.timeline();
      // The pointer's hotspot is the glyph's tip, so it is offset to sit just inside the target.
      const moveTo = (p: { x: number; y: number }, when: number, dur: number) =>
        t.to(cursor, { x: p.x - 3, y: p.y - 3, duration: dur, ease: 'power2.inOut' }, Math.max(0, when - dur));
      const clickAt = (p: { x: number; y: number }, when: number) => {
        t.to(cursor, { scale: 0.76, duration: 0.09, ease: 'power2.in', transformOrigin: '0% 0%' }, Math.max(0, when - 0.09))
          .to(cursor, { scale: 1, duration: 0.24, ease: 'back.out(3)', transformOrigin: '0% 0%' }, when)
          .fromTo(ping, { x: p.x, y: p.y, scale: 0.4, opacity: 0.9 }, { scale: 1.9, opacity: 0, duration: 0.5, ease: 'power2.out' }, when);
      };

      t.to(cursor, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 0.1);
      // One row at a time: the pointer travels to the box, presses, and the box ticks under it.
      boxes.forEach((b, i) => {
        const when = 0.78 + 0.44 * i;
        const p = centre(b);
        moveTo(p, when, i === 0 ? 0.5 : 0.34);
        clickAt(p, when);
        t.add(() => {
          b.classList.add('ec-run__box--on');
          sel.textContent = `${i + 1} selected`;
        }, when).fromTo(b, { scale: 0.8 }, { scale: 1, duration: 0.24, ease: 'back.out(2.4)', transformOrigin: '50% 50%' }, when);
      });

      // Then across to the button, one press, and the send runs from that click.
      const SEND = 3.24;
      const goAt = centre(go);
      moveTo(goAt, SEND, 0.6);
      clickAt(goAt, SEND);
      t.to(cursor, { opacity: 0, duration: 0.25, ease: 'power2.in' }, SEND + 0.24);

      // Send: the bar collapses to a disc and the tick draws itself.
      t.fromTo(go, { scale: 1 }, { scale: 0.95, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, SEND)
        .to([sel, go], { opacity: 0, duration: 0.18, ease: 'power2.in' }, SEND + 0.2)
        // once faded, the labels leave the layout too, so nothing wider than the disc sits behind its clip
        .set([sel, go], { visibility: 'hidden' }, SEND + 0.4)
        .to(bar, { width: NARROW, left: MID - NARROW / 2, borderRadius: 26, backgroundColor: BAR_SENT, duration: 0.52, ease: 'power3.inOut' }, SEND + 0.3)
        // the tick only starts once the box has finished collapsing around it
        .set(tick, { opacity: 1 }, SEND + 0.82)
        .to(path, { strokeDashoffset: 0, duration: 0.44, ease: 'power2.out' }, SEND + 0.84);
      states.forEach((st, i) => {
        t.add(() => {
          st.textContent = 'Paid';
          st.classList.add('ec-run__state--paid');
        }, SEND + 0.8 + i * 0.13).fromTo(st, { scale: 0.86, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)', transformOrigin: '50% 50%' }, SEND + 0.8 + i * 0.13);
      });

      // Reset for the next run.
      const RESET = SEND + 2.9;
      t.to(path, { strokeDashoffset: len, duration: 0.24, ease: 'power2.in' }, RESET)
        .set(tick, { opacity: 0 }, RESET + 0.25)
        .to(bar, { width: WIDE, left: LEFT, borderRadius: g.radius, backgroundColor: BAR_REST, duration: 0.52, ease: 'power3.inOut' }, RESET + 0.2)
        .add(() => {
          boxes.forEach((b) => b.classList.remove('ec-run__box--on'));
          states.forEach((st) => {
            st.textContent = 'Pending';
            st.classList.remove('ec-run__state--paid');
          });
          sel.textContent = '0 selected';
          gsap.set(cursor, { x: PARK.x, y: PARK.y, scale: 1 });
        }, RESET + 0.3)
        .set([sel, go], { visibility: 'visible' }, RESET + 0.5)
        .to([sel, go], { opacity: 1, duration: 0.3, ease: 'power2.out' }, RESET + 0.5);
    }, 0);
    beat.to({}, { duration: 7.0 }, 0);
    return idle.add(beat, 0);
  },
};
