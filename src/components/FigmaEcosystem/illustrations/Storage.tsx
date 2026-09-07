import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, one, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

/** Where each key shard docks around the seal, and where it flies in from. */
const SHARDS: { angle: number; from: [number, number]; label: string }[] = [
  { angle: -90, from: [0, -150], label: 'Device' },
  { angle: 30, from: [160, 90], label: 'Hardware' },
  { angle: 150, from: [-160, 90], label: 'Recovery' },
];
const DOCK = 128;

/**
 * Storage: self-custody as an object, not a list. A seal in the middle, three key shards that dock
 * around it, and a ring that turns to lock. Nothing here is a balance sheet, so it reads as
 * custody rather than as another wallet screen.
 */
export function Storage() {
  return (
    <Stage id="ec-storage" width={800} height={640} className="ec-il ec-store">
      <div className="ec-store__seal" style={{ left: 240, top: 140 }}>
        <i className="ec-store__ring ec-store__ring--outer" />
        <i className="ec-store__ring ec-store__ring--mid" />
        <svg className="ec-store__notches" viewBox="0 0 320 320" width={320} height={320} aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r1 = 118;
            const r2 = i % 6 === 0 ? 104 : 111;
            return (
              <line
                key={i}
                x1={160 + Math.cos(a) * r1}
                y1={160 + Math.sin(a) * r1}
                x2={160 + Math.cos(a) * r2}
                y2={160 + Math.sin(a) * r2}
                className={i % 6 === 0 ? 'is-major' : ''}
              />
            );
          })}
        </svg>
        <span className="ec-store__core">
          <span className="ec-lock">
            <i className="ec-lock__shackle" />
            <i className="ec-lock__body" />
          </span>
          <b>Sealed</b>
        </span>
        {SHARDS.map((s) => (
          <i
            key={s.label}
            className="ec-store__shard"
            data-shard={s.label}
            style={{
              left: 160 + Math.cos((s.angle * Math.PI) / 180) * DOCK - 26,
              top: 160 + Math.sin((s.angle * Math.PI) / 180) * DOCK - 26,
            }}
          >
            <svg viewBox="0 0 24 24" width={22} height={22} style={{ transform: `rotate(${s.angle + 90}deg)` }} aria-hidden="true">
              <circle cx="12" cy="6.8" r="4.4" fill="none" stroke="currentColor" strokeWidth="2.3" />
              <path d="M12 11.2V20.4M12 15.1h3.4M12 18.1h2.5" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
            </svg>
          </i>
        ))}
      </div>

      <div className="ec-store__keys" style={{ left: 48, top: 150 }}>
        <span className="ec-caption">Three keys, one owner</span>
        {SHARDS.map((s, i) => (
          <span key={s.label} className="ec-store__key" data-key={i}>
            <i />
            <b>{s.label} key</b>
            <small>on your side</small>
          </span>
        ))}
      </div>

      <div className="ec-store__chips" style={{ left: 48, top: 470 }}>
        <span className="ec-chip ec-store__chip">Keys never leave your device</span>
        <span className="ec-chip ec-store__chip ec-store__chip--ok">
          <i />
          Hardware wallet supported
        </span>
      </div>
    </Stage>
  );
}

export const storageMotion: SceneMotion = {
  build(tl, il, at, gsap) {
    const shards = all(il, '.ec-store__shard');
    tl.from(one(il, '.ec-store__ring--outer'), { scale: 0.9, opacity: 0, duration: 0.9, ease: EASE, transformOrigin: '50% 50%' }, at);
    tl.from(one(il, '.ec-store__ring--mid'), { scale: 0.9, opacity: 0, duration: 0.9, ease: EASE, transformOrigin: '50% 50%' }, at + 0.1);
    tl.from(all(il, '.ec-store__notches line'), { opacity: 0, duration: 0.5, stagger: 0.012 }, at + 0.25);
    tl.from(one(il, '.ec-store__core'), { scale: 0.8, opacity: 0, duration: 0.7, ease: EASE, transformOrigin: '50% 50%' }, at + 0.4);
    // The shackle drops home as the seal lands.
    tl.fromTo(one(il, '.ec-lock__shackle'), { y: -5 }, { y: 0, duration: 0.4, ease: 'power3.in' }, at + 0.75);
    shards.forEach((s, i) => {
      const [fx, fy] = SHARDS[i].from;
      tl.fromTo(s, { x: fx, y: fy, opacity: 0, scale: 0.8 }, { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.85, ease: EASE }, at + 0.55 + i * 0.1);
    });
    tl.from(all(il, '.ec-store__keys > *'), { ...RISE, y: 10, stagger: 0.08 }, at + 0.3);
    tl.from(all(il, '.ec-store__chip'), { ...RISE, y: 10, stagger: 0.1 }, at + 0.95);
    void gsap;
  },
  idle(gsap, il) {
    // A signature every few seconds: the ring turns a notch, each key answers in turn, and the
    // seal confirms. Nothing drifts in between — the object is at rest until it is used.
    const outer = one(il, '.ec-store__ring--outer');
    const notches = one(il, '.ec-store__notches');
    const shards = all(il, '.ec-store__shard');
    const keys = all(il, '.ec-store__key');
    const core = one(il, '.ec-store__core');
    const shackle = one(il, '.ec-lock__shackle');
    const idle = gsap.timeline();

    const beat = gsap.timeline({ repeat: -1, repeatDelay: 2.6, delay: 1.2 });
    beat.to(notches, { rotation: '+=15', duration: 1.1, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 0);
    shards.forEach((s, i) => {
      beat
        .to(s, { backgroundColor: '#4042d1', borderColor: '#4042d1', duration: 0.25 }, 0.25 + i * 0.22)
        .to(s, { color: '#ffffff', duration: 0.25 }, 0.25 + i * 0.22)
        .to(keys[i], { color: '#2c2e31', duration: 0.25 }, 0.25 + i * 0.22)
        .to(keys[i].querySelector('i'), { backgroundColor: '#4042d1', scale: 1.15, duration: 0.25, transformOrigin: '50% 50%' }, 0.25 + i * 0.22)
        .to(s, { backgroundColor: '#ffffff', borderColor: '#dfe3ef', duration: 0.5 }, 1.6 + i * 0.08)
        .to(s, { color: '#4042d1', duration: 0.5 }, 1.6 + i * 0.08)
        .to(keys[i].querySelector('i'), { backgroundColor: '#c9cdd3', scale: 1, duration: 0.5 }, 1.7 + i * 0.08);
    });
    beat
      .fromTo(outer, { boxShadow: '0 0 0 0 rgba(64,66,209,0.28)' }, { boxShadow: '0 0 0 22px rgba(64,66,209,0)', duration: 1.1, ease: 'power2.out' }, 1.0)
      .fromTo(shackle, { y: 0 }, { y: -4, duration: 0.22, ease: 'power2.out' }, 1.0)
      .to(shackle, { y: 0, duration: 0.3, ease: 'power3.in' }, 1.35)
      .fromTo(core, { scale: 1 }, { scale: 1.04, duration: 0.22, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 1.35);
    idle.add(beat, 0);
    return idle;
  },
};
