import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, isMobile, one, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

const HEX = '0123456789ABCDEF'.split('');
/** The fingerprint the reels settle on. */
const PRINT = '7F3A9C41';
/** One character's box on a strip — the reel's window, and so the distance one turn travels. */
const CELL = 96;
/**
 * How many copies of the hex run each strip holds, and how many full turns the spin makes before
 * it settles. A strip only has to be one copy longer than its spin, so the portrait layout can
 * carry a shorter strip (48 cells a reel rather than 80) without the spin ever running off its end
 * — that is 384 character nodes instead of 640, which matters on the device that has the least to
 * spend on them.
 */
const TURNS = { desktop: 5, mobile: 3 } as const;
const SPINS = { desktop: 3, mobile: 2 } as const;

/**
 * Storage: the key fingerprint. Eight reels spin and settle into the fingerprint of the key on this
 * device while the hero's progress bar tracks the derivation; then the device confirms the match.
 * Nothing about the key leaves the device — the derivation and the check both happen here.
 *
 * On a phone the eight reels break into two rows of four. A single row of eight is 580px of
 * fingerprint and there are only 361 to put it in, so the landscape composition arrives sliced at
 * both edges — and shrinking the reels would take the hex characters, the one thing in the scene
 * that has to be read, down with them. Four and four is not an arbitrary fold: the readout below
 * already groups the fingerprint in pairs, `7F 3A 9C 41`, so breaking after the fourth character
 * cuts it exactly where the eye is being told the halves are. The reels keep their design size —
 * 62x96, 34px characters, the same 74px pitch as the desktop row — so the portrait scene is the
 * same drawing at the same scale, folded, not a small copy of a big one.
 */
export function Storage({ mobile = false }: { mobile?: boolean } = {}) {
  return mobile ? <StoragePortrait /> : <StorageLandscape />;
}

/** One tumbler: a strip of hex characters long enough for the turns its layout's spin makes. */
function Reel({ index, turns, x, y }: { index: number; turns: number; x: number; y: number }) {
  return (
    <span className="ec-tum__reel" style={{ position: 'absolute', left: x, top: y }}>
      <span className="ec-tum__strip" data-strip={index}>
        {Array.from({ length: turns }, (_, r) => HEX.map((h) => <span key={`${r}${h}`}>{h}</span>))}
      </span>
    </span>
  );
}

function StorageLandscape() {
  return (
    <Stage id="ec-storage" width={800} height={640} className="ec-il ec-tum">
      <div className="ec-center" style={{ left: 0, top: 122 }}>
        <span className="ec-caption">Only your device can produce this</span>
      </div>
      <div style={{ left: 110, top: 176, width: 580, height: 96 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <Reel key={i} index={i} turns={TURNS.desktop} x={i * 74} y={0} />
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

/**
 * Portrait (361x480, the width a phone's card actually leaves the drawing, drawn at 1:1 so every
 * label lands on the screen at the size it was set in). The scene keeps its whole order of events
 * — claim, reels, derivation bar, readout, confirmation, closing line — because the order is the
 * argument: the key is produced here, checked here, and never goes anywhere else. Only the reels'
 * row folds; the progress bar follows it down to the 284px the folded block is wide, so the bar
 * still reads as the thing filling underneath the reels rather than a rule across the card.
 */
function StoragePortrait() {
  return (
    <Stage id="ec-storage" width={361} height={480} layout="mobile" className="ec-il ec-tum ec-tum--m">
      <div className="ec-center" style={{ left: 0, top: 12 }}>
        <span className="ec-caption">Only your device can produce this</span>
      </div>
      <div style={{ left: 38.5, top: 46, width: 284, height: 206 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <Reel key={i} index={i} turns={TURNS.mobile} x={(i % 4) * 74} y={Math.floor(i / 4) * 110} />
        ))}
      </div>
      <span className="ec-tum__prog" style={{ left: 38.5, top: 270, width: 284 }}>
        <i className="ec-tum__progFill" data-barfill>
          <i className="ec-tum__progGlow" data-glow />
        </i>
      </span>
      <div className="ec-center" style={{ left: 0, top: 318 }}>
        <small className="ec-tum__printLabel">Key fingerprint</small>
        <b className="il-mono ec-tum__print" data-print>
          —— —— —— ——
        </b>
      </div>
      <div className="ec-center" style={{ left: 0, top: 390 }}>
        <span className="ec-chip ec-tum__match" data-match>
          <i />
          Matches the key on this device
        </span>
      </div>
      <div className="ec-center" style={{ left: 0, top: 444 }}>
        <span className="ec-caption">Derived on device · verified on device</span>
      </div>
    </Stage>
  );
}

export const storageMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    // Back to the moment before the first derivation, whatever the loop had reached when it was cut.
    all(il, '[data-strip]').forEach((s) => gsap.set(s, { y: 0 }));
    gsap.set(one(il, '[data-barfill]'), { width: '0%' });
    gsap.set(one(il, '[data-match]'), { opacity: 0, y: 8 });
    const print = one(il, '[data-print]');
    print.textContent = '—— —— —— ——';
    gsap.set(print, { opacity: 1, y: 0 });
    tl.from(all(il, '.ec-caption'), { ...RISE, y: 6, stagger: 0.5 }, at);
    // Reading order in both layouts: across the row on a desk, across and then down on a phone.
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
    // The phone's strips are shorter, so its spin makes one turn fewer — the same blur at the same
    // speed for the same beat, just over a strip that isn't carrying cells it will never show.
    const spins = isMobile(il) ? SPINS.mobile : SPINS.desktop;
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
        t.fromTo(s, { y: 0 }, { y: -(HEX.length * spins + target) * CELL, duration: 1.0 + i * 0.14, ease: 'power3.out' }, 0.05 + i * 0.06);
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
