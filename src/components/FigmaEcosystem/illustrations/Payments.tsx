import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, one, roll, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

/** The local rails Remittix pays out over. Code, the rail's own name, and a plausible amount. */
const RAILS: [string, string, string][] = [
  ['USD', 'ACH', '1,340.00'],
  ['EUR', 'SEPA', '1,240.00'],
  ['GBP', 'Faster Pay', '1,062.00'],
  ['BRL', 'Pix', '7,412.00'],
  ['MXN', 'SPEI', '23,180.00'],
  ['NGN', 'NIP', '1,982,400'],
  ['INR', 'UPI', '112,640.00'],
  ['PHP', 'InstaPay', '76,290.00'],
  ['KES', 'M-Pesa', '174,300'],
  ['VND', 'NAPAS', '33,140,000'],
  ['IDR', 'BI-FAST', '20,860,000'],
  ['ARS', 'CBU', '1,286,000'],
  ['COP', 'PSE', '5,204,000'],
  ['ZAR', 'PayShap', '24,180.00'],
  ['THB', 'PromptPay', '45,720.00'],
  ['TRY', 'FAST', '43,900.00'],
  ['PLN', 'Elixir', '5,320.00'],
  ['CAD', 'Interac', '1,806.00'],
];

/** The order the loop walks the grid in: a wandering path, not a scan line. */
const ORDER = [1, 7, 3, 12, 5, 9, 0, 14, 8, 16, 2, 10, 6, 13, 4, 17, 11, 15];

/**
 * Payments: the reach of the payout network. A grid of local rails, each a real scheme in a real
 * currency, lights as payouts settle through it, and a receipt toast names the one that just landed.
 */
export function Payments() {
  return (
    <Stage id="ec-payments" width={800} height={640} className="ec-il ec-pay">
      <span className="ec-caption ec-pay__eyebrow" style={{ left: 48, top: 92 }}>
        Over 30 local rails · one wallet
      </span>
      <div className="ec-pay__grid" style={{ left: 48, top: 148 }}>
        {RAILS.map(([code, rail]) => (
          <span key={code} className="ec-pay__tile">
            <b>{code}</b>
            <small>{rail}</small>
          </span>
        ))}
      </div>
      <div className="ec-pay__toast" style={{ left: 48, top: 484 }}>
        <span className="ec-pay__tick">
          <i />
        </span>
        <span className="ec-pay__toastText">
          <b data-count="amount">BRL 7,412.00</b>
          <small>
            paid out via <em data-count="rail">Pix</em> · settled in <em className="il-mono" data-count="secs">4.2s</em>
          </small>
        </span>
        <span className="ec-pay__fee">0 FX fee</span>
      </div>
    </Stage>
  );
}

export const paymentsMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    const tiles = all(il, '.ec-pay__tile');
    tl.from(one(il, '.ec-pay__eyebrow'), { ...RISE, y: 6 }, at);
    // The grid assembles in reading order, tightly staggered so it lands as one gesture.
    tl.from(tiles, { y: 14, opacity: 0, duration: 0.6, ease: EASE, stagger: { each: 0.028, from: 'start' } }, at + 0.12);
    tl.from(one(il, '.ec-pay__toast'), { y: 16, opacity: 0, duration: 0.8, ease: EASE }, at + 0.75);
    tl.from(all(il, '.ec-pay__toast > *'), { ...RISE, y: 6, duration: 0.5, stagger: 0.06 }, at + 0.9);
    void gsap;
  },
  idle(gsap, il) {
    // A payout every couple of seconds: one rail lights, holds while it settles, and the toast
    // takes its currency, scheme and time. The grid is never busy — one tile at a time.
    const tiles = all(il, '.ec-pay__tile');
    const amount = one(il, '[data-count="amount"]');
    const rail = one(il, '[data-count="rail"]');
    const secs = one(il, '[data-count="secs"]');
    const tick = one(il, '.ec-pay__tick');
    const RAILS_ = tiles.map((t) => ({ code: t.querySelector('b')!.textContent!, rail: t.querySelector('small')!.textContent! }));
    const AMOUNTS = ['1,340.00', '1,240.00', '1,062.00', '7,412.00', '23,180.00', '1,982,400', '112,640.00', '76,290.00', '174,300', '33,140,000', '20,860,000', '1,286,000', '5,204,000', '24,180.00', '45,720.00', '43,900.00', '5,320.00', '1,806.00'];
    let n = 0;
    const idle = gsap.timeline();
    const story = gsap.timeline({ repeat: -1, repeatDelay: 0.9, delay: 0.7 });
    story.add(() => {
      const k = ORDER[n % ORDER.length];
      const tile = tiles[k];
      n += 1;
      const beat = gsap.timeline();
      beat
        .to(tile, { backgroundColor: '#4042d1', borderColor: '#4042d1', duration: 0.28, ease: 'power2.out' }, 0)
        .to(tile.querySelector('b'), { color: '#ffffff', duration: 0.28 }, 0)
        .to(tile.querySelector('small'), { color: 'rgba(255,255,255,0.72)', duration: 0.28 }, 0)
        .fromTo(tile, { boxShadow: '0 0 0 0 rgba(64,66,209,0.35)' }, { boxShadow: '0 0 0 8px rgba(64,66,209,0)', duration: 0.8, ease: 'power2.out' }, 0)
        .add(() => {
          roll(gsap, amount, `${RAILS_[k].code} ${AMOUNTS[k]}`);
          roll(gsap, rail, RAILS_[k].rail);
          roll(gsap, secs, `${(3.4 + ((k * 7) % 11) * 0.16).toFixed(1)}s`);
          gsap.fromTo(tick, { scale: 0.7 }, { scale: 1, duration: 0.45, ease: 'back.out(2)', transformOrigin: '50% 50%' });
        }, 0.45)
        .to(tile, { backgroundColor: '#ffffff', borderColor: '#e0e0e0', duration: 0.5, ease: 'power2.inOut' }, 1.5)
        .to(tile.querySelector('b'), { color: '#2c2e31', duration: 0.5 }, 1.5)
        .to(tile.querySelector('small'), { color: '#7c858d', duration: 0.5 }, 1.5);
    }, 0);
    story.to({}, { duration: 2.1 }, 0);
    idle.add(story, 0);
    return idle;
  },
};
