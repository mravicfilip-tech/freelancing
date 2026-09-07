import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, one, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

const HEX = '0123456789ABCDEF'.split('');
/** The fingerprint the reels settle on. */
const PRINT = '7F3A9C41';
const TURNS = 5;

/**
 * Storage: the key fingerprint. Eight reels spin and settle into the fingerprint of the key on this
 * device while the hero's progress bar tracks the derivation; then the device confirms the match.
 * Nothing about the key leaves the device — the derivation and the check both happen here.
 */
export function Storage() {
  return (
    <Stage id="ec-storage" width={800} height={640} className="ec-il ec-tum">
      <div className="ec-center" style={{ left: 0, top: 122 }}>
        <span className="ec-caption">Only your device can produce this</span>
      </div>
      <div style={{ left: 110, top: 176, width: 580, height: 96 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="ec-tum__reel" style={{ position: 'absolute', left: i * 74, top: 0 }}>
            <span className="ec-tum__strip" data-strip={i}>
              {Array.from({ length: TURNS }, (_, r) => HEX.map((h) => <span key={`${r}${h}`}>{h}</span>))}
            </span>
          </span>
        ))}
      </div>
      <span className="ec-tum__prog" style={{ left: 110, top: 308, width: 580 }}>
        <i className="ec-tum__progFill" data-barfill>
          <i className="ec-tum__progGlow" data-glow />
        </i>
      </span>
      <div className="ec-center" style={{ left: 0, top: 358 }}>
        <small className="ec-tum__printLabel">Key fingerprint</small>
        <b className="il-mono ec-tum__print" data-print>
          —— —— —— ——
        </b>
      </div>
      <div className="ec-center" style={{ left: 0, top: 444 }}>
        <span className="ec-chip ec-tum__match" data-match>
          <i />
          Matches the key on this device
        </span>
      </div>
      <div className="ec-center" style={{ left: 0, top: 518 }}>
        <span className="ec-caption">Derived on device · verified on device</span>
      </div>
    </Stage>
  );
}

export const storageMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    all(il, '[data-strip]').forEach((s) => gsap.set(s, { y: 0 }));
    tl.from(all(il, '.ec-caption'), { ...RISE, y: 6, stagger: 0.5 }, at);
    tl.from(all(il, '.ec-tum__reel'), { y: 18, opacity: 0, duration: 0.6, ease: EASE, stagger: 0.06 }, at + 0.1);
    tl.from(one(il, '.ec-tum__prog'), { scaleX: 0, duration: 0.7, ease: 'power2.out', transformOrigin: '50% 50%' }, at + 0.45);
    tl.from(all(il, '.ec-center')[1].children, { ...RISE, y: 8, stagger: 0.08 }, at + 0.55);
  },
  idle(gsap, il) {
    const strips = all(il, '[data-strip]');
    const fill = one(il, '[data-barfill]');
    const glow = one(il, '[data-glow]');
    const print = one(il, '[data-print]');
    const match = one(il, '[data-match]');
    const idle = gsap.timeline();
    const beat = gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: 0.6 });
    beat.add(() => {
      const t = gsap.timeline();
      t.set(match, { opacity: 0, y: 8 }, 0)
        .set(fill, { width: '0%' }, 0)
        .add(() => {
          print.textContent = '—— —— —— ——';
        }, 0);
      strips.forEach((s, i) => {
        const target = HEX.indexOf(PRINT[i]);
        // Spin a few full turns, then settle on the fingerprint's character.
        t.fromTo(s, { y: 0 }, { y: -(HEX.length * 3 + target) * 96, duration: 1.0 + i * 0.14, ease: 'power3.out' }, 0.05 + i * 0.06);
      });
      t.to(fill, { width: '100%', duration: 1.7, ease: 'power2.inOut' }, 0.1)
        .fromTo(glow, { xPercent: -120 }, { xPercent: 350, duration: 1.5, ease: 'power1.inOut' }, 0.25)
        .add(() => {
          print.textContent = `${PRINT.slice(0, 2)} ${PRINT.slice(2, 4)} ${PRINT.slice(4, 6)} ${PRINT.slice(6)}`;
        }, 1.9)
        .fromTo(print, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.9)
        .fromTo(match, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE }, 2.1);
    }, 0);
    beat.to({}, { duration: 4.2 }, 0);
    return idle.add(beat, 0);
  },
};
