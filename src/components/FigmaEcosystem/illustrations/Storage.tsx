import { B, Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, one, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

const S = (n: string) => `/figma/simple/${n}`;
const ASSETS: [string, string, string, string][] = [
  ['BTC', 'Bitcoin', '0.482', S('imgGroup.svg')],
  ['ETH', 'Ethereum', '3.10', S('imgFlatColor1.svg')],
  ['USDT', 'Tether', '4,200.00', S('imgFlatColor2.svg')],
  ['SOL', 'Solana', '58.2', S('imgSolana1.svg')],
];

/** Storage: self-custody by default. A vault of assets, keys on the device, a hardware wallet that connects. */
export function Storage() {
  return (
    <Stage id="ec-storage" width={800} height={640} className="ec-il ec-store">
      <div className="ec-card ec-store__card" style={{ left: 190, top: 122 }}>
        <div className="ec-card__head">
          <span className="ec-store__title">
            <span className="ec-lock">
              <i className="ec-lock__shackle" />
              <i className="ec-lock__body" />
            </span>
            <b>Vault</b>
          </span>
          <span className="ec-tag ec-tag--green">
            <img src={S('imgShieldCheckStreamlineNova.svg')} alt="" width={14} height={14} />
            Self-custody
          </span>
        </div>
        <ul className="ec-store__rows">
          {ASSETS.map(([sym, name, amt, icon]) => (
            <li key={sym} className="ec-store__row">
              <img src={icon} alt="" width={28} height={28} />
              <span className="ec-store__name">
                <b>{name}</b>
                <small>{sym}</small>
              </span>
              <span className="ec-store__amt">
                <b>{amt}</b>
                <small>{sym}</small>
              </span>
            </li>
          ))}
        </ul>
        <div className="ec-store__foot">
          <span>Keys never leave your device</span>
          <span className="ec-store__key">
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
      <span className="ec-chip ec-store__hw" style={{ left: 470, top: 96 }}>
        <img src={B('imgCheckCircle2.svg')} alt="" width={18} height={18} />
        Hardware wallet connected
      </span>
      <span className="ec-caption" style={{ left: 190, top: 528 }}>Your keys · your coins · a built-in vault for the long term</span>
    </Stage>
  );
}

export const storageMotion: SceneMotion = {
  build(tl, il, at) {
    tl.from(one(il, '.ec-store__card'), { y: 24, opacity: 0, duration: 0.9, ease: EASE }, at);
    tl.from(all(il, '.ec-card__head > *'), { ...RISE, y: 8, duration: 0.6, stagger: 0.08 }, at + 0.2);
    // The lock closes: the shackle drops into the body.
    tl.fromTo(one(il, '.ec-lock__shackle'), { y: -5 }, { y: 0, duration: 0.45, ease: 'power3.in' }, at + 0.5);
    tl.from(all(il, '.ec-store__row'), { ...RISE, y: 10, stagger: 0.08 }, at + 0.45);
    tl.from(one(il, '.ec-store__foot'), { ...RISE, y: 8 }, at + 0.9);
    tl.from(all(il, '.ec-store__key i'), { scale: 0, duration: 0.3, stagger: 0.06, ease: EASE, transformOrigin: '50% 50%' }, at + 1.0);
    tl.from(one(il, '.ec-caption'), { ...RISE, y: 6 }, at + 1.3);
  },
  idle(gsap, il) {
    // Every few seconds a hardware wallet connects: the chip slides in, the lock's shackle clicks,
    // the key dots light one by one as the device signs, and the vault's rows glint; then it
    // disconnects and the vault rests.
    const hw = one(il, '.ec-store__hw');
    const shackle = one(il, '.ec-lock__shackle');
    const keys = all(il, '.ec-store__key i');
    const rows = all(il, '.ec-store__row');
    const idle = gsap.timeline();
    const beat = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1.2 });
    beat
      .fromTo(hw, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: EASE }, 0)
      .fromTo(shackle, { y: 0 }, { y: -4, duration: 0.25, ease: 'power2.out' }, 0.5)
      .to(shackle, { y: 0, duration: 0.35, ease: 'power3.in' }, 0.95)
      .fromTo(keys, { backgroundColor: '#c9cdd3' }, { backgroundColor: '#02774d', duration: 0.2, stagger: 0.14 }, 0.6)
      .fromTo(rows, { x: 0 }, { x: 3, duration: 0.25, stagger: 0.06, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 1.2)
      .to(keys, { backgroundColor: '#c9cdd3', duration: 0.5, stagger: 0.05 }, 3.0)
      .to(hw, { x: 24, opacity: 0, duration: 0.5, ease: 'power2.in' }, 3.2);
    idle.add(beat, 0);
    return idle;
  },
};
