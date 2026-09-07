import { Stage } from '../../FigmaFeatures/illustrations/Stage';
import { all, count, one, roll, EASE, RISE } from '../../FigmaFeatures/illustrations/motion';
import type { SceneMotion } from './index';

const R = 52;
const CIRC = 2 * Math.PI * R;
const DAYS = [34, 46, 41, 58, 63, 57, 72];

/** Staking: idle RTX at work, with rewards accruing and a claim every so often. */
export function Staking() {
  return (
    <Stage id="ec-staking" width={800} height={640} className="ec-il ec-stake">
      <div className="ec-card ec-stake__card" style={{ left: 200, top: 120 }}>
        <div className="ec-card__head">
          <b>Staking</b>
          <span className="ec-tag">RTX</span>
        </div>
        <div className="ec-stake__top">
          <div className="ec-stake__figure">
            <span className="ec-row__label">Staked</span>
            <span className="ec-stake__amount"><b className="il-count" data-count="staked">12,500</b> RTX</span>
            <span className="ec-stake__sub">Locked 90 days · 56 left</span>
          </div>
          <svg className="ec-stake__ring" viewBox="0 0 120 120" width={120} height={120} aria-hidden="true">
            <circle className="ec-stake__track" cx="60" cy="60" r={R} />
            <circle className="ec-stake__arc" cx="60" cy="60" r={R} style={{ strokeDasharray: CIRC, strokeDashoffset: CIRC }} />
          </svg>
          <span className="ec-stake__apy"><b data-count="apy">12.4%</b><small>APY</small></span>
        </div>
        <div className="ec-stake__rewards">
          <span className="ec-row__label">Rewards today</span>
          <span className="ec-stake__gain"><b className="il-count" data-count="reward">+3.42</b> RTX</span>
          <button type="button" className="ec-stake__claim" tabIndex={-1}>Claim</button>
        </div>
        <div className="ec-stake__bars">
          {DAYS.map((h, i) => (
            <i key={i} style={{ height: h }} />
          ))}
        </div>
      </div>
      <span className="ec-caption" style={{ left: 200, top: 528 }}>Stake in one tap · rewards daily · unstake any time</span>
    </Stage>
  );
}

export const stakingMotion: SceneMotion = {
  build(tl, il, at) {
    tl.from(one(il, '.ec-stake__card'), { y: 24, opacity: 0, duration: 0.9, ease: EASE }, at);
    tl.from(all(il, '.ec-card__head, .ec-stake__figure > *'), { ...RISE, y: 8, duration: 0.6, stagger: 0.07 }, at + 0.2);
    count(tl, one(il, '[data-count="staked"]'), 0, 12500, at + 0.4, 1.0, (n) => Math.round(n).toLocaleString('en-US'));
    tl.from(one(il, '.ec-stake__ring'), { scale: 0.8, opacity: 0, duration: 0.7, ease: EASE, transformOrigin: '50% 50%' }, at + 0.4);
    tl.to(one(il, '.ec-stake__arc'), { strokeDashoffset: CIRC * (1 - 0.62), duration: 1.2, ease: 'power2.inOut' }, at + 0.6);
    tl.from(one(il, '.ec-stake__apy'), { ...RISE, y: 6 }, at + 1.0);
    tl.from(one(il, '.ec-stake__rewards'), { ...RISE, y: 10 }, at + 0.9);
    count(tl, one(il, '[data-count="reward"]'), 0, 3.42, at + 1.0, 0.9, (n) => `+${n.toFixed(2)}`);
    tl.from(all(il, '.ec-stake__bars i'), { scaleY: 0, duration: 0.6, stagger: 0.06, ease: EASE, transformOrigin: '50% 100%' }, at + 1.1);
    tl.from(one(il, '.ec-caption'), { ...RISE, y: 6 }, at + 1.5);
  },
  idle(gsap, il) {
    // Rewards accrue in real time; every few seconds the day's bar grows a touch and the lock
    // ring inches on. Now and then the wallet claims: the claim button presses, the reward rolls
    // back to zero and the staked amount takes it.
    const reward = one(il, '[data-count="reward"]');
    const staked = one(il, '[data-count="staked"]');
    const claim = one(il, '.ec-stake__claim');
    const arc = one(il, '.ec-stake__arc');
    const bars = all(il, '.ec-stake__bars i');
    let value = 3.42;
    let total = 12500;
    let progress = 0.62;
    const idle = gsap.timeline();
    const accrue = gsap.timeline({ repeat: -1, delay: 0.5 });
    accrue.add(() => {
      value = Math.round((value + 0.01) * 100) / 100;
      reward.textContent = `+${value.toFixed(2)}`;
    }, 0).to({}, { duration: 0.45 }, 0);
    idle.add(accrue, 0);
    const day = gsap.timeline({ repeat: -1, repeatDelay: 2.6, delay: 1.5 });
    day.add(() => {
      const last = bars[bars.length - 1];
      gsap.to(last, { height: `+=${2}`, duration: 0.5, ease: 'power2.out' });
      progress = Math.min(0.98, progress + 0.01);
      gsap.to(arc, { strokeDashoffset: CIRC * (1 - progress), duration: 0.8, ease: 'power2.inOut' });
    }, 0).to({}, { duration: 0.1 }, 0);
    idle.add(day, 0);
    const claimBeat = gsap.timeline({ repeat: -1, repeatDelay: 7.4, delay: 5 });
    claimBeat
      .fromTo(claim, { scale: 1 }, { scale: 0.94, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut', transformOrigin: '50% 50%' }, 0)
      .to(claim, { backgroundColor: '#02774d', duration: 0.2 }, 0.1)
      .add(() => {
        total = Math.round(total + value);
        roll(gsap, staked, total.toLocaleString('en-US'));
        gsap.fromTo(staked, { color: '#4042d1' }, { color: '#2c2e31', duration: 1.2, ease: 'power1.out', delay: 0.35 });
        value = 0;
        roll(gsap, reward, '+0.00');
      }, 0.3)
      .to(claim, { backgroundColor: '#4042d1', duration: 0.6 }, 1.4);
    idle.add(claimBeat, 0);
    return idle;
  },
};
